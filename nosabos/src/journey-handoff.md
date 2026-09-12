Piyali Journey and Memory — continuation handoff
================================================

This handoff summarizes the conversation and implementation as of September 10, 2026. The workspace is `/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos`. The application is React 19, Chakra UI 2, Vite, Firebase/Firestore, Zustand, and Nostr-based account identity.

**Current status:** The requested Journey feature, Memory tab changes, and Journey test button are implemented locally. All code changes from this conversation remain uncommitted; many new files are still untracked. Nothing was committed, pushed, or deployed. Preserve this working tree when continuing.

**Product intention and scope.** The starting point was ideas 3 and 5 in [astra-upgrades.md](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/astra-upgrades.md).

- Idea 3, “Listen to how far you’ve come,” lets learners hear their own speaking progress through saved recordings. The emotional goal is to make their growth personally recognizable. Meaningful comparisons matter more than another score.
- Idea 5, “Teach me through this,” would let learners bring a message, menu image, passage, or audio into Piyali and turn it into explanation, response composition, and practice. The user thinks HelpChatFab is the right home, potentially replacing the prominent Morpheme mode toggle with a broader learning entry and attachments.
- **The user explicitly deferred HelpChatFab work. No HelpChatFab changes were made.**
- Initial discussion suggested recording after an early comfortable speaking experience, then revisiting after relevant practice. The user replaced calendar-based scheduling with the specific session-based design below. Do not revert to weekly recording reminders or the earlier proposed “Your voice” navigation name without a new request.

**Agreed Journey behavior.** A Journey session currently means **one fully completed Today’s Focus quest, including all its selected activities**. The user initially described “X amount” of quests; the assistant asked about the ratio, received no answer, and explicitly proceeded with one complete quest per session. The constant is `QUESTS_PER_JOURNEY_SESSION = 1`.

This is distinct from an individual activity, XP threshold, calendar streak, or starting a live voice conversation. It is also distinct from the existing `dailyPlateSession` concept, which means a guided traversal of the daily activities.

Recording milestones are exactly:

`1 → 5 → 15 → 30 → 45 → 60 → 90 → 120 → 150`

The first completed quest unlocks a modal to set a speaking prompt and save a recording. Subsequent milestones invite another recording. Learners see future locked milestones on a path in Memory → Journey.

Normal counting starts with new successful Focus completion/bonus claims after this implementation. There is no historical backfill. Because Today’s Focus completion is tracked by account, target language, and local calendar day, ordinary progress counts at most once per language per day. Replaying the same day through the developer quest reset does not add a second Journey session.

**Design and user experience.** The implementation follows the existing app surfaces, typography, theme variables, and modal motion. It has cream/light and dark appearances, rounded cards, teal accents, microphone icons, and a vertical dashed path joining milestone nodes. States include locked, ready to record, and recording saved.

Memory opens on Repairs normally. The tab order is:

`Repairs → Goals (only when a goal exists) → Notes → Journey`

An explicit “Explore my journey” action opens Memory directly on Journey. Changing the selected tab uses stable tab keys so the optional Goals tab does not shift the meaning of the selected tab. Journey content is unmounted when inactive to clean up its playback/recording UI.

The Journey header shows the completed-session count, progress toward the next milestone, and the one-quest-per-session definition. The modal shows the unlocked milestone, future milestone badges, a privacy explanation, and actions to record, postpone, or explore Journey. It waits until the existing quest, lesson, XP, onboarding, and companion celebration sequence is quiet.

The recorder flow is:

1. Read the invitation and choose “Record my voice.”
2. Set the first speaking prompt. Default: “Introduce yourself, say something you enjoy, and ask a question.”
3. Choose self-reported support: “On my own” or “With hints or a sentence starter.”
4. Record, stop, preview, and retry if desired.
5. Explicitly save the recording.
6. Play the saved clip and the starting recording, when one exists.

Later recordings reuse the original prompt, which is read-only for that attempt. Skipping is allowed, and unlocked milestones remain available for later recording. Each recording displays its actual capture session and date, so a recording added to the session-1 node during session 15 is labeled as captured during session 15.

The comparison baseline is the **earliest retained recording by creation time**, not the smallest milestone number. This was specifically fixed so filling a skipped early milestone later does not replace the learner’s actual starting recording. Deleting the earliest recording makes the earliest remaining recording the baseline.

Playback is user initiated, only one audio element plays at a time, and downloading is supported. A saved recording can be deleted with confirmation. Saving over an existing milestone is rejected; replacement currently requires deletion first.

There is **no AI audio evaluation, transcription, numerical speaking score, generated improvement narrative, or transfer-test generation** in this version. Comparisons consist of the recordings, shared prompt, dates/capture sessions, and self-reported support. Those richer interpretations were discussed as product possibilities, not implemented requirements.

**Goals tab.** This exposes existing learning intelligence rather than creating another goal system. It reads `user.learningIntelligence[targetLang]`.

- Shows the saved goal text and active, paused, or achieved status. The tab remains available for paused/achieved goals if the goal object still exists.
- Shows `goalProgress.demonstrated`, `openCapabilities`, and `usefulLanguage`.
- Displays evidence examples and support-stage badges, with recognition distinguished from production.
- For active goals, shows today’s matching blueprint objective/rationale, or the next guidance target when there is no current matching blueprint.
- Shows an honest empty state when there is no evidence yet.
- Does not introduce a percentage-based goal score or goal editing controls.

The App’s root-user snapshot listener was updated to synchronize `learningIntelligence` into the user store so the tab receives current goal data.

**Completion and modal integration.** [dailyPlate.js](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/utils/dailyPlate.js) now integrates `prepareJourneyCompletion` into `claimDailyPlateBonus`. The transaction verifies the committed activity snapshot and then atomically writes the existing daily bonus marker, the Journey state, and a durable completion receipt. All transaction reads happen before writes.

The elected course list and original completion day are passed from App; the real timestamp is used for the recorded completion time. There are account/language checks around subsequent local-store patching and celebration display to prevent an old async completion from updating another account’s UI.

The completion receipt is separate from the app’s rolling daily-activity maps. Those maps are pruned, while Journey receipts persist. Developer quest resets preserve the receipts.

`JourneyMilestoneGate` polls for a quiet modal state every 300 ms and requires approximately 1.5 seconds of quiet before presenting an eligible milestone. `lastPromptedMilestone` persists acknowledgement. Only the latest eligible milestone is proactively offered; skipped older milestones remain manual options. A local seen set prevents immediate repeat prompts if acknowledgement fails. Successful saving also acknowledges that milestone.

**Persistence and encryption.** Firestore paths are scoped by account and target language:

```text
users/{npub}/voiceJourney/{lang}
users/{npub}/voiceJourney/{lang}/completions/{YYYY-MM-DD}
users/{npub}/voiceJourney/{lang}/recordings/{milestone}
```

The Journey state includes `version`, `completedQuests`, `unlockedAt`, `recordings` metadata, `lastPromptedMilestone`, `updatedAt`, and optionally `lastTestUnlockAt`. Recording metadata contains `createdAt` and `capturedSession`. Completion receipts contain `completedAt` and `session`.

Each recording document stores an encrypted envelope: version, wrapped key, IV, and ciphertext. The encrypted payload contains base64 audio, MIME type, prompt, support choice, and duration. Audio and prompt text are not stored as plaintext in the document. The small state/recording metadata is not encrypted.

Encryption uses Web Crypto AES-GCM with a fresh random 256-bit content key and 12-byte IV. Additional authenticated data binds the payload to account, language, and milestone. The content key is wrapped to the learner’s own account using NIP-44. This avoids NIP-44’s message-size limit for audio.

Local-key accounts use the existing `local_nsec` after checking that its public key matches the active `npub`. Extension accounts require `window.nostr.nip44.encrypt/decrypt` and a matching public key. Unsupported extensions show an explicit error. Account secrets stay in the browser or signer.

Firestore Bytes are used for IV/ciphertext; Firebase Storage was not introduced. No dependencies, Cloud Functions, Firestore rules, or indexes were added.

The existing Firestore rules remain in place: they use npub-shaped user paths and matching user fields without authenticating ownership via Firebase Auth. Audio encryption protects recording contents, but it does not change the existing authorization behavior for metadata or writes/deletes. This implementation did not harden the application’s wider access-control model.

**Recording constraints and cleanup.** The capture controller uses browser `getUserMedia` and `MediaRecorder`. Preferred formats are WebM/Opus, MP4, and Ogg/Opus, depending on browser support. It requests 48 kbps audio, caps recording at 45 seconds, and caps raw audio at 650,000 bytes to keep encrypted/base64 payloads below Firestore document limits.

It handles unsupported browsers, microphone denial, empty/too-short clips, recorder failures, and oversized audio. Tracks/timers are released on stop, failure, or unmount. Closing while permission is pending also stops the eventual stream. Moving the page into the background stops an active recording. Recording/preview state stays local until Save; closing during saving is disabled. Object URLs are revoked on cleanup.

**Latest user request: the test button.** The user explicitly asked for a button at the top of Today’s Focus that opens the Journey modal and unlocks future sessions on every open for testing. This is implemented as `JourneyTestButton`, injected into `DailyPlateHome` through `journeyTestControl`.

The label is “Test Journey · Session N.” Each successful click transactionally advances to the next milestone greater than the account/language’s current Journey session count. A fresh Journey therefore opens session 1, then 5, 15, etc. It immediately opens the same recording modal used by normal milestones. At/after 150, the control becomes “Explore my journey” and opens the path; it does not wrap or reset.

**This is a real persisted testing shortcut, not an isolated preview:** it raises `completedQuests` to unlock the milestone and writes `lastTestUnlockAt`. Recordings made there use the real save flow. Existing recordings are preserved. It does not award XP, change Today’s Focus activity counters, or create normal completion receipts. It acknowledges the milestone in the same transaction to prevent an automatic duplicate modal.

The button is currently visible in all builds, not gated behind `import.meta.env.DEV`. There is no reset-test-progress button. Removing/gating it for release and deciding what to do with test-advanced account data remain separate future decisions; the user has not requested those actions.

**File map.** All paths below point into the current workspace.

| File | Responsibility |
| --- | --- |
| [App.jsx](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/App.jsx) | Shared Journey subscription, modal gating, goal hydration, Memory navigation, completion integration, test-button injection. |
| [DailyPlateHome.jsx](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/components/DailyPlateHome.jsx) | Renders the test control above Today’s Focus. |
| [NotesDrawer.jsx](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/components/NotesDrawer.jsx) | Repairs/Goals/Notes/Journey tabs and direct Journey navigation. |
| [MemoryGoals.jsx](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/components/MemoryGoals.jsx) | Existing goal/evidence display. |
| [VoiceJourney.jsx](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/components/VoiceJourney.jsx) | Milestone path, comparison playback, deletion, manual recording entry. |
| [JourneyRecordingModal.jsx](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/components/JourneyRecordingModal.jsx) | Invitation, prompt setup, recorder UI, preview/save, shared audio player. |
| [JourneyMilestoneGate.jsx](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/components/JourneyMilestoneGate.jsx) | Automatic milestone prompts after the celebration sequence. |
| [JourneyTestButton.jsx](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/components/JourneyTestButton.jsx) | User-requested shortcut to unlock/open each next milestone. |
| [useVoiceJourney.js](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/hooks/useVoiceJourney.js) | Account/language subscription, loading/error state, retry. |
| [voiceJourneyModel.js](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/utils/voiceJourneyModel.js) | Milestones, quest/session ratio, count/unlock/prompt/baseline logic and recording limits. |
| [voiceJourney.js](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/utils/voiceJourney.js) | Firestore transactions, receipts, save/load/delete, acknowledgement, test unlock service. |
| [voiceJourneyCrypto.js](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/utils/voiceJourneyCrypto.js) | Account-key wrapping and authenticated audio encryption. |
| [journeyRecorder.js](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/utils/journeyRecorder.js) | Capture lifecycle independent of React. |
| [voiceJourneyCopy.js](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/utils/voiceJourneyCopy.js) | New UI copy; complete English and Spanish, other supported languages currently get translated tab labels and English fallback for most new content. |
| [dailyPlate.js](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/utils/dailyPlate.js) | Atomic normal Focus-completion counting. |

The four new test files are [voiceJourneyModel.test.js](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/utils/voiceJourneyModel.test.js), [voiceJourneyCrypto.test.js](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/utils/voiceJourneyCrypto.test.js), [journeyRecorder.test.js](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/utils/journeyRecorder.test.js), and [voiceJourney.integration.test.js](/Users/sheilferzepeda/Desktop/nosabos-x/nosabos/nosabos/src/utils/voiceJourney.integration.test.js). The integration tests execute the actual service code against explicit in-memory Firestore boundaries.

**Validation already performed.**

- After the core feature: full `npm test` passed with 503 tests; production build and targeted ESLint checks passed.
- After the test-button addition: the model/integration subset passed all 11 tests, including the newly added milestone-advancement test; targeted ESLint, `git diff --check`, and the production build passed. The entire suite was not rerun after that one additional test.
- Tests cover milestone boundaries through 150, duplicate/device races, incomplete quests, developer resets, account/language separation, skipped milestones, baseline selection, acknowledgement, encrypted storage, tampering/account/language/milestone binding, save/delete behavior, and microphone lifecycle/error handling.
- Browser checks confirmed the actual Memory tabs, locked path, and test-button placement above Today’s Focus.
- Isolated browser fixtures exercised automatic session-1 prompting, skipping and reopening Journey, session-5 recording/preview/save, comparison playback, and Goals evidence. Light/dark surfaces and a 390-pixel-wide modal were checked.
- Browser capture/save tests used synthetic audio and a mocked storage service. A real microphone → encrypted cloud save → account reload → playback round trip has **not** been exercised end to end. Real extension-signer operation also remains to be checked.
- Build warnings were the existing large-bundle/dependency/Browserslist warnings; builds completed successfully.

Useful commands from the workspace:

```sh
npm test
node --test src/utils/voiceJourneyModel.test.js src/utils/voiceJourneyCrypto.test.js src/utils/journeyRecorder.test.js src/utils/voiceJourney.integration.test.js
npm run build
git diff --check
```

Prior logs are in `/private/tmp/piyali-journey-tests-final.log`, `/private/tmp/piyali-journey-build-final.log`, and `/private/tmp/piyali-journey-test-button-build.log`. Temporary browser fixtures were created in `/private/tmp/piyali-journey-preview`; that separate port-5184 server was stopped. They are not repository deliverables and may not exist in a different environment.

**Continuing from here.** The current requested implementation is complete. The user requested this handoff so work can continue elsewhere; they did not authorize a new task, a commit, deployment, or reopening HelpChatFab scope. Start by reviewing the existing changes and asking what they want to refine next if no new instruction is supplied.

If they request release preparation, useful concrete follow-ups are: verify real account/audio persistence across reloads and browsers; finish localization; decide how the test button should be gated/removed and how test-advanced Journey data should be treated. Keep the session schedule, Memory tab order, learner-controlled saving, actual capture-session labels, and earliest-recording baseline behavior intact unless the user changes those decisions.

