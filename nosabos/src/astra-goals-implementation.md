# Astra implementation

The settings, daily Goal course, durable summaries, and focused Phonics repairs
are implemented alongside the existing practice engines.

Onboarding has two steps, Language and Goals, with highlighted progress bars
and Back/Next navigation. Goals remain optional and drafts survive navigation.

## Storage and isolation

- `users/{npub}.learningIntelligence[language]` holds a versioned goal, bounded
  repair summary, bounded goal progress summary, and today's stable blueprint.
- Goal changes and evidence merge through Firestore transactions. Replacing or
  clearing a goal resets its progress and today's Goal counter. Pausing or
  marking achieved retains its identity and evidence for later maintenance.
- Goal completion atomically saves evidence, updates its summary, and sets
  `progress.goalDailyActivity[language][day] = 1`. Duplicate completion,
  old-day results, and replaced-goal results cannot increment another course.
- Focused decks and their item outcomes live in the existing per-language/day
  `questDays` documents. Goal fields replace the previous goal's artifact;
  Repair fields are step-scoped. Local caches include account, language,
  day, mode and goal/step identity. Both focus stores survive refresh and are
  checked against the active account, language, and day before use.
- Raw companion notes retain their existing two-day lifecycle. Summaries use
  bounded categories, retain at most three unresolved repair patterns, and
  expose at most 200 words of prompt prose. Old repair assumptions expire;
  completion without observable evidence never creates a mastered claim.

## Practice behavior

Daily composition is Repair, one active Goal, then carried/elected normal
courses. Goal is derived independently of election, including on the first
quest. The four goal modes route to Tutor, Alphabet/Phonics, Flashcards, and the
five-module lesson. Conversations is excluded from goals and repairs and serves
as a standalone regular daily quest mode. Goal Tutor sessions use their own
objective and grading instructions.

Goal Lesson preparation XP is stored atomically in `dailyGoal.preparationXp`
and shared across every module. It survives reloads, resets with the daily task,
and stays outside curriculum completion. Exercise feedback reads that counter
once, including inline lesson flashcards. At 100%, the question engine is replaced
by a completion step that validates the saved counter and credits today's Goal
once. Reloads at 100% finish the same task; failed saves offer Retry. Completion
returns to the daily quest and retains the long-term goal as active. The summary
records supported lesson practice, without claiming independent mastery.
Voice attempts receive an
objective-based check, and a focused written production check is available
in a dialog opened from the compact Goal action inside Lesson or Flashcards.
The Goal control never renders above the app header. Tutor and
Phonics use their native attempts without a duplicate written form. Phonics requires graded target-sound success
and, when present, success on the transfer item. Written answers cannot
complete a phonics goal. Summaries distinguish supported production and
recall from independent performance.

Repair Phonics creates a 3–5 item deck with a captured-original fallback and
language-specific contrasts/transfer. Its original metadata and per-item
results persist. Flashcard repairs retain the original card and fresh
variations; neither repair nor goal cards enter normal SRS/path storage.
All five lesson modules receive exact target forms and focus guidance at all
CEFR levels. Goal instructions explicitly allow needed language above CEFR;
Repair retains its level guard.

## Rollout and verification

Goal features are enabled by default. Set `VITE_ASTRA_GOALS_ENABLED=false`
and rebuild to hide goal onboarding/settings, omit derived Goal courses,
and invalidate active Goal sessions. Repair upgrades remain available.
Analytics emits `goal_task_completed` with mode, language and day, without
including the learner's goal text or responses.

Run `npm test` and `npm run build`. The new model/service/deck tests cover
bounds, isolation, compaction, fallback generation, stable blueprints,
replacement races, duplicate completion, all-mode routing, all-level modules,
and persisted phonics outcomes. The browser fixture and repeatable scenarios
are in `tests/astra-browser`; its service boundary is entirely local.

Browser verification covers the actual settings and completion components,
all five routing/completion states, refresh, failed responses, language
switching, pause/resume, achievement, and unchanged custom preferences.
The live app's settings field was also checked. Live microphone sessions,
production Firestore concurrency, and model-generated content quality still
need a test-account pass before broad rollout; the browser fixture simulates
those external services.

Morphology Forge rejects malformed pieces, mismatched assemblies, and missing
or duplicate blanks before display. It also checks that the reference assembly
is a real morphological word that makes the completed sentence natural; a
failed or uncertain check retries the other provider instead of showing an
unanswerable item. Exercise assistance includes the actual offered options and
provides direct solutions; Forge displays its exact pieces and completed sentence
even if the explanation service is unavailable.
