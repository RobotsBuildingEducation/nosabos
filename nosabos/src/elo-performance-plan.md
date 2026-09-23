# Elo Performance Plan

## Purpose

Give each learner a live performance rating next to their CEFR level, and use that rating when generating repairs, goal tasks, and other practice. The rating moves on graded events. The memory behind it stays compact and keeps evolving. It does not become a forever ledger, and it does not change how CEFR advances.

This records the direction agreed in discussion. It extends `astra-goals-and-repair-plan.md`. It does not replace that plan's goal setting, daily Goal task, mode list, or the rule that conversation is not a repair or goal surface.

## Why

The current loop is reliable and cheap, and it is thin.

- Slips are saved as they happen, then enriched in the background.
- When today's quest clears, tomorrow's companion message and repair are written once from today's notes. If that never runs, the next open builds today's plan from yesterday's unused notes.
- A ready blueprint is not updated when later slips arrive.
- Raw notes live through the next day, then they are pruned. The day before yesterday is gone.
- What lasts longer is a short repair summary and a short goal-progress summary, not the underlying evidence.
- The quest itself is chosen by rules. The model only writes the message and up to 3 repair items.
- Generators see CEFR plus that short window. They do not see how the learner is actually performing inside the band.

CEFR answers "what course are they in." It does not answer "how hard should tomorrow's repair and goal task be, given how they have been doing." That is what Elo is for.

## Understandings

### What already exists

- Mistake capture across practice surfaces, stored as companion-memory notes, with a cheap enrichment pass for the slip, the fix, and a tip.
- A two-day raw window, then prune.
- A one-shot next-day batch: manga message plus a short repair. Frozen once ready.
- Durable compact summaries for repair patterns and goal progress. These already merge evidence instead of appending a diary.
- User-saved notes, separate from automatic slip capture. These are useful context, not graded attempts.
- Goal attempts already record right and wrong, including how much support was needed. That evidence is compacted, not kept as a full log.
- CEFR unlock follows tutor, lesson skill-tree, and flashcard progress, plus an explicit placement. That path is intentional.

### What Elo is not

- Not a replacement for CEFR.
- Not a per-concept rating system. One rating per practice language.
- Not a gamification score beside XP. Generators read it.
- Not a reason to keep every question and answer forever.
- Not a signal that saved notes should move. Saving something useful is not a win or a loss.

### What moves the rating

Graded events only:

- Question or exercise outcomes.
- Repair outcomes.
- Goal-attempt outcomes.

An independent success moves Elo more than a prompted or modeled success. A miss moves it down. Storing a repair, opening a note, or saving a note does not move it.

### What the compact record is for

Elo is the running score. The compact record is the memory of why, and it is what tells generators *what* to practice. Same concept bumps severity. A repair that did not stick stays open. A repaired item that does not recur drops off. Saved notes stay attached as context and are not scored.

CEFR stays on the tutor, skill-tree, and flashcard path. Elo only changes how hard the next repair or goal task is inside that band. Do not derive a CEFR change from Elo, and do not let Elo flicker the unlocked level.

## Direction

1. Keep one Elo per practice language, stored on the learner profile, updated on each graded event.
2. Keep evolving the existing compact repair and goal summaries. Do not add a permanent question ledger.
3. Pass CEFR, Elo, the compact state, the active goal, and relevant saved notes into repair generation, goal-task generation, and the other practice outputs that currently only see the short note window.
4. Leave CEFR advancement alone.
5. Leave the quest elector alone. Elo changes the generated repair and goal work, not which courses were elected.
6. Saved notes bias content. They do not bias the score.

## Out of scope

- Changing when or how CEFR unlocks.
- Replacing companion memory, the notes drawer, or the daily Goal task.
- A global Elo across languages.
- Using conversation as a graded repair or goal surface.
- Keeping raw transcripts so the rating can be replayed later.
