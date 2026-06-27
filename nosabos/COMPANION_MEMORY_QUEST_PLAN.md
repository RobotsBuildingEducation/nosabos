# Companion Memory Quest Plan

## Central Idea

Your companion curates today's quest from your learning memory.

The experience should stop feeling like separate systems:

- Daily tasks
- Pet health
- Notes
- Flashcards
- Tutor
- Conversation
- Lessons

Instead, it should feel like one living loop:

> My companion knows what I am working on, picks a good practice mix, and helps
> me repair yesterday's weak spots.

The companion becomes the face of the learning system. The Daily Quest becomes
the orchestrator. The notes drawer becomes the companion's temporary brain.

## Product Goal

Make the app feel more alive and personal without overwhelming users or
breaking the existing learning flow.

The user should feel:

- "The app remembers what I struggled with."
- "My companion picked today's quest for a reason."
- "Mistakes are useful material, not failure."
- "The daily quest is a small adventure, not a generic checklist."
- "My pet is not just a health meter; it is my learning companion."

## Non-Negotiable Caveat

The existing first quest plate must remain.

That first plate is intentionally designed as an introduction to the learning
flow. It should not be replaced by companion-memory personalization.

The first quest should continue to introduce the user to the app in the intended
sequence and tone. Companion memory should begin affecting quest generation only
after the introductory plate has served its purpose.

## Core Loop

1. User opens the app.
2. Companion greets them with a tiny personalized reason for today's quest.
3. Daily Quest shows 2-4 tasks.
4. Some tasks are normal progress tasks: lesson, speaking, flashcards,
   conversation, phonics, tutor.
5. Some tasks may be repair tasks pulled from recent mistakes or weak concepts.
6. User completes the quest.
7. Companion summarizes what improved, what still needs reinforcement, and what
   tomorrow may focus on.

Example companion message:

> Today I picked a short speaking quest and two repairs from yesterday. You
> hesitated on restaurant phrases, so we will warm that up first.

## The Three Product Pieces

### 1. Companion = Personality + Memory

The companion should not only be a pet health meter.

It should:

- Explain why today's quest exists.
- Celebrate specific progress.
- Gently point to weak spots.
- Make mistakes feel useful.
- Give the app a single emotional voice.

Avoid:

> Complete 3 tasks for XP.

Prefer:

> You nailed greetings yesterday. Today let's repair numbers and try one tiny
> conversation.

### 2. Daily Quest = Orchestrator

The Daily Quest should be the user's daily learning command center.

It decides:

- What normal progress the user should do today.
- Whether the user needs a repair task.
- Which mode is best suited for that repair.
- How to explain the task selection in a game-like way.

The daily quest plate should feel like it was curated, not randomly assembled.

### 3. Notes Drawer = Companion Brain

The notes drawer should evolve from "manual saved notes" into the companion's
temporary learning memory.

Today, users manually press a button to create notes. The new experience should
intelligently store notes when users get things wrong across the app.

These notes are not permanent study notes by default. They are a short-lived
daily memory log that informs tomorrow's quest.

The drawer should still animate or highlight when something is stored, so the
companion feels alive and observant.

## Companion Brain Memory Lifecycle

The memory system should be intentionally temporary.

### Day T: Capture

During today's session, the app captures learning signals.

Examples:

- Missed flashcard
- Incorrect grammar answer
- Weak vocabulary response
- Tutor correction
- Conversation hesitation
- Pronunciation issue
- Failed phonics item
- Repeated hint usage

These items are stored in a Day T memory log.

### Day T+1: Reuse

When the next day's quest is created, the app reads the Day T memory log.

The log can:

- Influence the quest explanation.
- Add a Repair task if needed.
- Add temporary repair material to an existing mode.
- Help the companion explain why the quest was chosen.

The Day T memory continues to exist during Day T+1 as reinforcement context.

### Day T+2: Expire

On Day T+2, the Day T memory should be erased because it has already served its
purpose.

The mental model:

- Day T creates a log.
- Day T+1 consumes and reinforces that log.
- Day T+2 erases the old log because it has merged into the Day T+1 learning
  experience.

This keeps memory fresh, lightweight, and emotionally safe.

## Memory Capture Philosophy

The app should not capture everything.

The companion brain should only store items that are useful for near-term
reinforcement.

Good memory candidates:

- User got something wrong.
- User needed repeated hints.
- User mispronounced a sound.
- User failed the same concept more than once.
- User abandoned or skipped a task after struggling.
- Tutor gave a correction that maps to a practice concept.

Weak memory candidates:

- User completed a normal task correctly.
- User saw a concept once.
- User made a typo with no learning value.
- User skipped because of time, not difficulty.

## Memory Note Shape

This is a product-level sketch, not final implementation.

Each memory note could include:

- `id`
- `createdDayKey`
- `targetLang`
- `supportLang`
- `sourceMode`
- `sourceLessonId` or source context
- `concept`
- `userAnswer`
- `expectedAnswer`
- `errorType`
- `cefrLevel`
- `severity`
- `recommendedRepairMode`
- `companionSummary`
- `expiresAfterDayKey`
- `usedInQuestDayKey`
- `status`

Possible statuses:

- `captured`
- `queued_for_repair`
- `used_in_quest`
- `reinforced`
- `expired`

## Error Types

Useful categories:

- `vocabulary`
- `grammar`
- `pronunciation`
- `listening`
- `reading`
- `writing`
- `conversation_flow`
- `phonics`
- `confidence`
- `unknown`

These categories can help choose the best repair mode.

## The Repair Task

Repair is a new possible Daily Quest task.

It appears only when the companion brain has useful memory notes from the
previous day.

The Repair task should intelligently select a mode to fix the issue.

Examples:

- Vocabulary error -> temporary flashcard repair
- Grammar error -> mini grammar lesson or targeted lesson practice
- Pronunciation error -> phonics or speech drill
- Listening error -> repeat-what-you-hear
- Conversation hesitation -> conversation prompt
- Tutor correction -> targeted tutor micro-lesson
- Weak lesson concept -> short skill-tree reinforcement

Repair should feel positive.

Avoid:

> You got this wrong yesterday.

Prefer:

> Let's make yesterday's tricky phrase automatic.

## Repair Task Behavior By Mode

### Flashcards

The app can generate temporary/ephemeral repair flashcards.

These should:

- Appear inside the existing flashcard UI.
- Be marked as repair cards.
- Not permanently pollute the user's long-term flashcard library unless the user
  chooses to save them.
- Award repair completion progress when reviewed successfully.

### Skill Tree

The app can create a temporary repair lesson.

This could be:

- A short lesson-like card.
- A focused drill.
- A link back to the relevant existing lesson.
- A generated micro-lesson based on the memory note.

The skill tree should not become cluttered with permanent one-off nodes.

### Phonics

The app can select specific sounds, letters, or minimal pairs that relate to the
captured issue.

Examples:

- User mispronounced rolled `r`.
- User confused Japanese kana.
- User missed a Russian sound-letter mapping.

### Tutor

The tutor can run a short repair agenda.

Example:

> We are going to practice polite ordering phrases from yesterday. I will say
> one, you repeat, then we use it in a tiny roleplay.

### Conversation

The conversation mode can use a targeted scenario.

Example:

> You hesitated with restaurant phrases, so today's repair conversation is a
> 2-minute ordering scene.

### Repeat / Listening

For listening issues, the app can create short repeat-what-you-hear items using
the weak phrase or sound pattern.

## Manga-Like Quest Bubble

The Daily Quest plate should include a manga-like chat bubble from the
companion.

Purpose:

- Explain why today's quest was defined the way it was.
- Make the quest feel authored by the companion.
- Give the plate a game-like, quest-like emotional frame.
- Store the explanation to the user document for future UI/UX use.

Example:

> I picked this quest because yesterday you were strong on greetings, but
> numbers and ordering phrases still need a little heat. We will repair those
> first, then try a tiny conversation.

The bubble should be concise. It should feel like the companion is helping, not
lecturing.

## Stored Quest Explanation

Each generated Daily Quest can store a companion explanation.

Possible fields:

- `questDayKey`
- `targetLang`
- `questKinds`
- `repairMemoryIds`
- `explanation`
- `shortBubbleText`
- `createdAt`
- `companionMood`
- `sourceMemorySummary`

This can later support:

- Quest history
- Companion diary
- Progress recap
- Personalized notifications
- End-of-week reflection

## Daily Quest Generation Flow

### First Quest

Use existing introductory quest logic.

Do not allow companion memory to override this flow.

### Returning Quest

1. Determine today's available quest modes.
2. Read recent memory logs.
3. Expire logs older than the Day T+1 reinforcement window.
4. Decide whether a Repair task is needed.
5. Select the best repair mode.
6. Generate quest course list.
7. Generate companion quest explanation.
8. Store quest explanation and selected memory references.
9. Render Daily Quest plate with manga-like companion bubble.

## Repair Task Selection Logic

The system can choose Repair when:

- There are one or more valid memory notes from the previous day.
- The notes have not already been used in a repair.
- At least one mode can satisfy the repair.
- The user's daily plate has room for an extra task or can swap a lower-priority
  task.

Repair should not appear every day if there is no useful memory.

Repair should also not dominate the plate. The user still needs forward motion.

Recommended ratio:

- 0 or 1 Repair task per day for MVP.
- Later, allow 2 only for highly active users or heavy practice sessions.

## Quest Plate Example

Companion bubble:

> I saved two tricky bits from yesterday. Let's warm up numbers, repair one
> ordering phrase, then try a short conversation.

Quest tasks:

1. Repair: Ordering phrase
2. Review: 8 due cards
3. Speak: Tiny restaurant roleplay

End summary:

> Nice. Yesterday's ordering phrase is stronger now. Tomorrow I may bring back
> numbers if they still feel shaky.

## Notes Drawer UX

The notes drawer becomes the companion brain.

Possible naming options:

- Companion Brain
- Coach Notes
- Memory
- Today's Memory
- Learning Memory
- Repair Notes

Recommended framing:

Use "Memory" or "Coach Notes" in user-facing copy. Internally, "companion brain"
is a useful concept, but it may feel too technical or uncanny as direct UI copy.

The drawer should show:

- Captured today
- Used in today's quest
- Reinforced
- Expiring soon

When a note is captured:

- Bottom action bar notes button highlights.
- Drawer badge pulses.
- Tiny companion reaction may appear.
- No interruption unless the user opens the drawer.

Example note copy:

> Saved for tomorrow: polite ordering phrase.

## Emotional Tone

Mistakes should feel like discoveries.

Avoid:

- "Wrong again"
- "You failed this"
- "Weakness detected"
- "Mistake log"

Prefer:

- "Saved for tomorrow"
- "Let's make this automatic"
- "This is worth one more pass"
- "Good catch"
- "Repair complete"

## MVP Scope

The first version can be small.

### MVP Features

1. Keep existing first quest plate unchanged.
2. Capture wrong answers across a few high-signal modes.
3. Store memory notes with a two-day lifecycle.
4. Transform notes drawer into a memory drawer.
5. Add one optional Repair task to the daily quest.
6. Generate a short companion bubble explaining the quest.
7. Store quest explanation to the user document.
8. Animate/highlight notes drawer when memory is captured.

### Best MVP Capture Sources

Start with:

- Flashcards
- Vocabulary
- Grammar
- Tutor corrections if easy to isolate

Later:

- Conversation hesitation
- Pronunciation
- Phonics
- RPG/game review
- Real-world task debriefs

## Phase Plan

### Phase 1: Memory Capture

Goal: create the companion brain data layer.

Tasks:

- Define memory note format.
- Add helper for writing memory notes.
- Capture wrong answers from high-signal modes.
- Add local/user document sync strategy.
- Add expiry logic for Day T+2.
- Trigger existing notes drawer animation when memory is stored.

### Phase 2: Memory Drawer

Goal: make the notes drawer feel like the pet's brain.

Tasks:

- Rename/reframe sections.
- Show temporary memory notes.
- Show status: captured, used, reinforced, expiring.
- Preserve existing note animation/highlight behavior.
- Consider keeping manual notes as a separate saved-notes section if still
  useful.

### Phase 3: Quest Explanation Bubble

Goal: make the Daily Quest feel intentionally curated.

Tasks:

- Add manga-like companion bubble to Daily Quest plate.
- Generate concise explanation from quest selection and memory notes.
- Store explanation to user document.
- Handle fallback explanations without AI.
- Keep the first quest plate unchanged.

### Phase 4: Repair Task MVP

Goal: add one repair task to the Daily Quest.

Tasks:

- Add `repair` as a quest kind.
- Pick repair mode based on memory note type.
- Start with one repair surface, likely flashcards or tutor.
- Mark memory note as used in quest.
- Mark repair as completed once user succeeds.
- Include repair completion in quest progress.

### Phase 5: Multi-Mode Repair

Goal: allow Repair to intelligently use the best mode.

Tasks:

- Add temporary flashcards.
- Add tutor repair agenda.
- Add conversation repair scenario.
- Add phonics repair drill.
- Add repeat/listening repair drill.
- Add skill-tree micro-lesson or lesson redirect.

### Phase 6: Recap And Future UX

Goal: make memory feel like progress.

Tasks:

- Add end-of-quest companion summary.
- Store quest recaps.
- Consider weekly memory recap.
- Consider companion diary.
- Consider user-facing progress narrative.

## Data Placement

Memory and quest explanations should likely live on the user document or a user
subcollection.

Possible options:

### User Document

Pros:

- Easy to read during app boot and quest generation.
- Simple for small logs.

Cons:

- Can grow if not aggressively pruned.
- More write contention if many systems update it.

### User Subcollection

Pros:

- Cleaner lifecycle.
- Easier to query by day/status.
- Better long-term scalability.

Cons:

- More reads and more orchestration.

Recommendation:

For MVP, use a compact user document field only if the data stays tiny and is
strictly pruned. If memory notes may become numerous or rich, use a
subcollection early.

## Potential User Document Fields

Sketch:

- `companionMemory.currentLog`
- `companionMemory.previousLog`
- `companionMemory.lastPrunedDayKey`
- `dailyQuestExplanations[targetLang][dayKey]`
- `dailyQuestRepair[targetLang][dayKey]`

Alternative:

- `users/{npub}/companionMemory/{dayKey}`
- `users/{npub}/dailyQuestExplanations/{dayKey}`

## Product Risks

### Risk: It Feels Punitive

Mitigation:

- Use positive language.
- Store "repair notes," not "mistakes."
- Celebrate repaired items.

### Risk: The Quest Feels Too Repetitive

Mitigation:

- Limit Repair to one task in MVP.
- Mix repair with forward progress.
- Do not show Repair if memory quality is low.

### Risk: Memory Gets Noisy

Mitigation:

- Capture only high-signal events.
- Deduplicate similar concepts.
- Expire aggressively.
- Score severity and usefulness.

### Risk: AI Explanations Are Too Long

Mitigation:

- Limit bubble text to 1-2 sentences.
- Generate fallback templates.
- Store both short bubble and longer internal rationale.

### Risk: First Quest Loses Its Intended Teaching Role

Mitigation:

- Explicitly gate companion-memory quest personalization until after the first
  quest plate has completed.

## Open Questions

1. What should the user-facing name be: Memory, Coach Notes, Repair Deck, or
   something else?
2. Should manual note creation remain, or should all notes become automatic?
3. Which mode should Repair support first: flashcards, tutor, or grammar?
4. Should users be able to dismiss a repair item?
5. Should repaired items ever become permanent flashcards?
6. Should the companion bubble be visible every day or only when memory affected
   the quest?
7. Should quest explanations be generated by AI, deterministic templates, or a
   hybrid?
8. How should this interact with real-world task debriefs later?

## Recommended First Build

Build the smallest version that proves the magic:

1. Keep first quest plate unchanged.
2. Capture wrong answers into temporary companion memory.
3. Reframe notes drawer as Memory.
4. Add a manga-like companion bubble to Daily Quest.
5. Add one Repair task when yesterday's memory exists.
6. Start Repair with temporary flashcards or a tutor micro-lesson.
7. Expire memory after it has informed the next day.

If this works, the app should immediately feel less like a set of learning
tools and more like a companion-led quest system.

