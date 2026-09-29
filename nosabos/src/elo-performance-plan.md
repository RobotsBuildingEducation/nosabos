# Score Performance Plan

## Purpose

Give each learner one live Score per practice language across all CEFR question levels. Show it beneath Today’s Focus date and on the daily Quest plate, and use it with compact performance memory throughout practice generation and daily quest selection. CEFR still controls curriculum advancement.

This records the updated direction agreed in discussion. It extends `astra-goals-and-repair-plan.md`. It does not replace that plan's goal setting, daily Goal task, or mode list.

## Why

The current loop is reliable and cheap, and it is thin.

- Slips are saved as they happen, then enriched in the background.
- When today's quest clears, tomorrow's companion message and repair are written once from today's notes. If that never runs, the next open builds today's plan from yesterday's unused notes.
- A ready blueprint is not updated when later slips arrive.
- Raw notes live through the next day, then they are pruned. The day before yesterday is gone.
- What lasts longer is a short repair summary and a short goal-progress summary, not the underlying evidence.
- The quest itself is chosen by rules. The model only writes the message and up to 3 repair items.
- Generators see CEFR plus that short window. They do not see how the learner is actually performing inside the band.

CEFR answers "what course are they in." Internal Elo estimates demonstrated performance across every level; the visible Score is its 0–100 projection. Together with recent outcomes, Elo guides how difficult the next question or interaction should be. A learner on a B1 track can receive an A1 diagnostic question. Missing that A1 question costs more Elo than missing a B1 question, and far more than missing a C2 question.

## Understandings

### What already exists

- Mistake capture across practice surfaces, stored as companion-memory notes, with a cheap enrichment pass for the slip, the fix, and a tip.
- A two-day raw window, then prune.
- A one-shot next-day batch: manga message plus a short repair. Frozen once ready.
- Durable compact summaries for repair patterns and goal progress. These already merge evidence instead of appending a diary.
- User-saved notes, separate from automatic slip capture. These are useful context, not graded attempts.
- Goal attempts already record right and wrong, including how much support was needed. That evidence is compacted, not kept as a full log.
- CEFR unlock follows tutor, lesson skill-tree, and flashcard progress, plus an explicit placement. That path is intentional.

### What Score is not

- Not a replacement for CEFR.
- Not a per-concept rating system. One rating per practice language.
- Visible throughout the app like XP, while remaining a performance signal that generators read.
- Not a reason to keep every question and answer forever.
- Not a signal that saved notes should move. Saving something useful is not a win or a loss.

### What moves the rating

Graded events only:

- Question or exercise outcomes.
- Repair outcomes.
- Goal-attempt outcomes.

An independent success moves internal Elo more than a prompted or modeled success. A miss moves it down. Fractional changes accumulate until the visible Score moves. Storing a repair, opening a note, or saving a note does not move it.

### What the compact record is for

Elo is the running rating; Score is its learner-facing projection. The compact record is the memory of why, and it tells generators *what* to practice. It changes as questions are graded, without retaining every answer. Same concept bumps severity. A repair that did not stick stays open. A repaired item that does not recur drops off. Saved notes stay attached as context and are not scored.

CEFR stays on the tutor, skill-tree, and flashcard path. Score changes question difficulty across the entire Pre-A1–C2 range, as well as the support offered in practice. Do not derive a CEFR unlock from Score or let Score flicker the unlocked level.

## Direction

1. Keep one internal Elo rating per practice language, stored on the learner profile and updated on each graded question or attempt. Derive the visible Score from it. Use the question's actual CEFR difficulty in the calculation.
2. Keep compact, evolving performance, repair, and goal summaries. Do not add a permanent question ledger.
3. Pass internal Elo, one CEFR curriculum label, a suggested question level, recent accuracy with its sample count, and up to three weak concepts into teaching-content generation. Keep the visible Score in the UI; it is derived from Elo and adds no new ability evidence to a generation prompt. Goal and repair prompts can also include their task-specific notes.
4. Leave CEFR advancement alone.
5. Use Score to influence daily quest selection while keeping the first introductory quest and daily persistence stable.
6. Saved notes bias content. They do not bias the score.
7. Show the current Score and a horizontal trail of capability milestones beneath the companion and above the activity map on the daily Quest plate.

## Score scale, onboarding, and milestones

The Pre-A1–C2 Score spans 0–100. Immediately after onboarding, an unassessed learner has Score 0. The first earned milestone is 1. Choosing “completely new” keeps Score 0; checklist and placement-test answers can seed a higher Score, including within Pre-A1. The estimated bands are Pre-A1 0–14, A1 15–28, A2 29–42, B1 43–56, B2 57–70, C1 71–84, and C2 85–100. The first checklist statement starts at 3, and the placement test uses its rubric to choose a point inside the assessed band. The strongest checklist statement determines the lower CEFR course for a range and seeds the Score within its band (for example, B1–B2 starts in B1 at Score 53).

For existing accounts with no stored rating, the current per-language placement or completed course progress supplies the level's default Score. Saved 0–100 Scores, earlier 1–700 Scores, and legacy Elo ratings retain their displayed Score on read; the next graded outcome saves the converted internal 800–2200 Elo without losing compact graded history. Elo updates use a small K factor, so moving from the middle of one CEFR Score band to the next takes roughly 80–100 independent correct answers at that level in a no-miss simulation. Placement never overwrites a rating that already has graded outcomes. Self-report answers remain compact context for generated practice.

The milestone trail relates Score thresholds to curriculum capabilities practiced through lessons, cards, sounds, Tutor, conversations, stories, reading, and games. It is a guide to estimated capability, not a separate course unlock.

The learner can be at different CEFR positions in the skill tree, flashcards, and Tutor. The overall CEFR label is the highest of those curriculum positions; it is only a summary. A generated problem receives the position of its actual lesson or mode, the current internal Elo, and compact evidence such as recent accuracy, level outcomes, and weak concepts. Elo adjusts the requested challenge and support around that curriculum objective.

When a generated problem or goal is created, Gemini assesses the actual item's difficulty on the shared 0–100 Pre-A1–C2 scale, considering its language, answer format, options, and built-in help. The app combines that estimate with the learner's internal Elo to attach a fixed worth snapshot: rating at generation, curriculum question level, assessed item difficulty and CEFR level, gain for each support level, and loss for a miss. The assessed level also labels the item's performance evidence; a simple item inside a B1 lesson contributes to the Pre-A1 or A1 evidence bucket when appropriate. Gemini supplies a difficulty estimate, not arbitrary point rewards. If assessment is unavailable, the snapshot explicitly records a CEFR-based fallback. Grading decides whether the response met the item's criteria, then applies the stored gain or loss in a Firestore transaction. No difficulty or point model call occurs at answer time. The next generated problem reads the updated Elo and compact memory. Older items without a worth snapshot retain the level-based calculation until they are replaced.

## Out of scope

- Changing when or how CEFR unlocks.
- Replacing companion memory, the notes drawer, or the daily Goal task.
- A global Score across languages.
- Treating ungraded conversation turns as Score wins or losses.
- Keeping raw transcripts so the rating can be replayed later.
