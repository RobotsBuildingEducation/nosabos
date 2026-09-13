# Astra browser checks

Start the isolated browser fixture from the project root:

```sh
./node_modules/.bin/vite --config tests/astra-browser/vite.config.js
```

Open `http://127.0.0.1:5186/`. This renders the production Goal settings and
completion components with local fixture storage and deterministic grading.
It never reads or writes a learner's Firebase account. The test server's Vite
plugin replaces the service and Firebase boundaries; production builds do not import it.

`scenarios.js` exports a browser-adapter scenario covering setting a goal,
single derived course composition, refresh, failed attempts, all five route
and completion states, language switching, pause/resume, achievement, and
unchanged custom preferences. Run it with a Codex browser tab, or pass a
Playwright page as `{ playwright: page, reload: () => page.reload() }`.
The fixture grader accepts `¿Dónde vivías?`; native-mode test controls simulate
already-graded voice/phonics attempts. Lesson and Flashcards open their written
checks through the compact Goal button; no response form appears on entry.

These checks cover the UI and routing contracts, not microphone hardware or
live model quality. Before a wider rollout, run the five real practice modes
on a test learner account with the live speech/model services, verifying fresh
content, transcription, TTS, and supportive difficulty. Native voice sessions
were not exercised by this fixture.

Open `/action-bar.html` for the production compact and activity footers in
separate portals under React Strict Mode. **Run transition checks** records
rendered dimensions on every animation frame and verifies expansion,
contraction, feedback height, loading replacements, and mid-spring reversal.
It also checks that only one surface is visible, the bar stays centered, and
controls retain their width. Run at desktop and phone widths; add `?theme=dark`
for dark glass. Frame measurements are available below the results.

Open `/?onboarding` for the real two-step onboarding UI with a local save
callback. `runOnboardingBrowserChecks` verifies step order, progress, draft
preservation, and the completion payload. Use `&lang=es&theme=dark` for a
localized dark preview. Check mobile sizes including a short viewport: the
body scrolls independently while Back/Next remain accessible. The component
was visually checked at 390×844, 390×450, and desktop width in light/dark themes.

`/?flashcard` renders the production inline LessonFlashcard with a deterministic
grader and a local completion callback. Answer twice to verify the feedback
includes cumulative lesson progress (67%, then 74%). This specifically covers
the missing Grammar/Vocabulary flashcard progress rail. XP storage itself is
covered by `goalPreparationXp.integration.test.js`, which runs the real XP
transaction against isolated in-memory persistence.

`/?completion` exercises the production completion gate and readiness predicate:
two correct 5-XP answers reach the 10-XP lesson target, leave the answered
question visible behind the task-complete modal, and advance to Tutor only when
Continue is pressed.
`/?completion&resume` starts at 100%; `/?completion&resume&fail` simulates one
failed save and verifies Retry succeeds without leaving the question. The
real completion transaction, duplicate requests, active goal status, and daily
credit isolation are tested in `learningIntelligence.integration.test.js`.
