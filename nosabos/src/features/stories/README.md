# Stories modes

`Stories.jsx` automatically selects Speak, Radio, or Conversation once per activity.
Learners do not choose or switch modes. Tutorial activities keep the existing speaking flow.
Lesson authors can pin a mode with `lessonContent.storyMode` (`speaking`, `radio`,
or `conversation`). Changing the lesson, account, or learning languages resets
the activity.

Radio plays a host/caller segment with stable character voices and no visible
transcript or translations. The question unlocks only after all turns finish.
Conversation reveals one pair of turns and its checkpoint at a time, retaining
earlier pairs for review. Each turn offers audio replay and optional translation;
word-order excerpts remain hidden until the checkpoint is graded.

Episodes are generated from the lesson topic, curriculum, CEFR level, and learning
and support languages using schema-constrained JSON output. Word-order tiles and
their answers are built directly from the referenced dialogue rather than trusting
model-generated indices. `storySession.js` validates the complete episode before
it is shown. Checkpoints support multiple choice, true/false, selecting heard words,
and ordering phrase tiles. A malformed episode gets one automatic repair request
including the rejected candidate and validation error, followed by an explicit
retry/skip surface. Failed attempts log their stage, attempt number, mode, language,
and reason without logging the dialogue or user identifiers.

Each question is graded once, with explanations for correct and incorrect answers.
Completing all checkpoints awards 6 XP and shows a first-attempt score. Save errors
remain retryable; analytics errors cannot cause a second XP award. Skipping does
not award XP. The recap's Continue action advances the containing lesson.

Audio is owned by one cancellable queue. Pausing, replaying, moving to the next
checkpoint, and unmounting cannot unlock a checkpoint from an old playback run.
The queue observes the shared player's typed playout result even while readiness
or `audio.play()` remains pending. Preparing audio is shown separately from ON AIR.
Setup/readiness/start failures time out after 30 seconds; stalled playout after
90 seconds (suspended while paused). Failure returns to replay with a diagnostic
and does not unlock a checkpoint. Playback completion does not wait for cache writes.

Validation:

- `npm test` includes schema, multilingual word matching, grading, playback,
  cancellation, replay, and failure tests.
- With Vite running, open `/tests/browser/stories.html` and click **Run checks**.
  This exercises the real component using fixture generation, audio, and XP
  services; it never generates a real story or writes progress.
- Browser checks cover radio gating, pair visibility, translations, tile answers,
  incorrect feedback, completion, score, and a failed-save retry.
- `/tests/browser/story-generation.html` runs the real generation/validation
  pipeline against a synthetic birthday-party topic, without playback or XP writes.
  Voice quality still requires an authenticated app smoke test.
- `/tests/browser/story-playback.html` exercises two turns using real TTS, with
  readiness, finalization, and queue state visible for diagnosis, without XP writes.

New interface copy currently provides English and Spanish, with English fallback
for other interface languages. Generated story content and questions use the
learner's configured target/support languages.
