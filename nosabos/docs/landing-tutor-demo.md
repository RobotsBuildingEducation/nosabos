# Landing-page live tutoring demo

The Speak card uses the same Firebase AI Logic Gemini Live bridge as Tutor. It
does not need a separate Gemini API key or a new HTTP endpoint. The configured
Firebase project, AI Logic provider, model, and App Check settings must work for
visitors who have not signed in. The demo does not create an account, write lesson
progress, record audio, or persist transcripts in the app.

## Behavior

- The visitor chooses one of the existing 12 practice languages and explicitly
  starts the lesson. No microphone is requested on page load.
- The five-turn beginner experience uses the page's interface language for
  explanations: introduce a greeting, affirm or correct the first attempt,
  introduce a word for thanks, creatively review the greeting, and creatively
  review thanks. First-attempt feedback flows into the second word automatically.
  Each request includes the selected words, so shared-bridge context resets do
  not lose the lesson's vocabulary. No personal details are requested.
- Microphone input is disabled while Gemini speaks and reopened after playback
  completes. The orb follows the actual listening/thinking/speaking state and
  microphone/output amplitude.
- The demo waits for the learner's final review answer and plays brief final
  feedback before closing. That recap is not an extra lesson turn. There is no
  countdown or lesson-duration cutoff. Startup still times out after 20 seconds
  if a connection cannot be established.
- End/Cancel, switching showcase tabs, scrolling the demo out of view, hiding
  the page, and leaving the page all stop the session. Cancellation also cleans
  up connections or microphone streams that arrive after startup was canceled.
- Captions remain only in component memory. Selecting another language resets
  them; leaving the Speak tab stops the session.

## Configuration and verification

Use the existing `VITE_FIREBASE_*`, `VITE_GEMINI_LIVE_PROVIDER`, and
`VITE_TUTOR_GEMINI_LIVE_MODEL` settings described in the app setup. This demo
always uses Gemini, independently of Tutor's optional OpenAI provider override.
Keep existing Firebase App Check enforcement and project quotas in place. If
the project requires authenticated AI Logic requests, unauthenticated visitors
will receive the demo's unavailable message; this feature does not bypass that
project policy.

The local worktree uses the existing Firebase web configuration in ignored
`.env`. Its existing App Check debug token belongs only in ignored
`.env.development.local`, so production builds do not include it. Restart Vite
after changing environment settings. Shell-level `VITE_*` overrides take
precedence over these files; do not launch the live demo with placeholder keys.

Manually check Start, microphone allow and deny, spoken captions/audio, End, tab
changes, the five-turn sequence, correction of mistakes, and completion after
the final exercise answer on desktop and mobile. Startup/configuration checks
and mocked transport tests do not by themselves verify an end-to-end spoken lesson.

Automated session and shared transport regressions:

```sh
node --test src/utils/landingTutorDemo.test.js src/utils/geminiLiveBridgeCancellation.test.js src/utils/geminiLiveBridge.test.js src/utils/realtimeSessionControls.test.js
```
