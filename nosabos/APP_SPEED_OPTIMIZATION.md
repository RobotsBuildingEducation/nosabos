# App Speed Optimization Plan

Handoff document for improving Piyali's loading speed and runtime performance
without changing the product behavior or visual experience. This plan is based
on the production-bundle audit and manual Fast/Slow 4G observations from
2026-07-24.

Any future implementation session should begin here, work one phase at a time,
and preserve the behavior gates in this document.

## Goal

Reduce cold-start loading time, JavaScript download/parse cost, hidden rendering,
Firestore traffic, and animation overhead while keeping the app working exactly
as it does today.

The app is functionally correct. This is not a redesign and not permission for a
broad rewrite.

## Non-goals

- Do not redesign screens, navigation, lesson flow, or visual styling.
- Do not change curriculum content or language behavior.
- Do not remove Tutor or Conversation session persistence.
- Do not trade correctness for optimistic UI without a reconciliation path.
- Do not virtualize or restructure the Skill Tree until lower-risk loading work
  is complete and measured.
- Do not combine every optimization into one PR.
- Do not raise Vite's chunk warning threshold to hide the current warnings.
- Do not use `manualChunks` as a substitute for real feature boundaries.

## Measured baseline (2026-07-24)

Production build command:

```sh
npm run build
```

Build observations:

| Artifact | Minified | Gzip |
|---|---:|---:|
| Public entry / landing chunk | 2,135.42 KB | 610.31 KB |
| Authenticated `App` chunk | 2,803.07 KB | 916.79 KB |
| Aggregate Skill Tree data | 2,332.46 KB | 663.63 KB |
| Game Router | 752.99 KB | 218.24 KB |
| Citizenship Guide | 607.23 KB | 174.28 KB |
| Shared translations/drawer chunk | 444.67 KB | 129.82 KB |

Additional observations:

- A cold authenticated boot processes an estimated **2.48 MB gzip of
  JavaScript** before/background-during the initial Daily Plate experience.
- The service worker precaches **34 entries / 9,948.88 KiB**.
- Vite transformed 4,475 modules and completed the audited build in 17.41s.
- `src/App.jsx` is 11,691 lines with approximately 95 `useState` calls and 76
  `useEffect` calls.
- The active CEFR level can render 56–126 lesson nodes plus SVG connectors.
- There are 62 `VoiceOrb` call sites. Each mounted orb can continuously render
  through `requestAnimationFrame`.
- The 41 imported character PNGs total approximately 1.4 MB.

Manual observed loading:

| Network profile | Observed load |
|---|---:|
| Fast 4G | approximately 20 seconds |
| Slow 4G | more than 45 seconds |

The exact cache, service-worker, device, and CPU settings used for those manual
numbers were not recorded. Phase 0 must produce a repeatable baseline before
implementation begins.

## Main causes, ranked

1. The authenticated app eagerly imports most learning features.
2. Desktop and non-iOS clients mount hidden Path, Flashcards, Conversations,
   and Tutor surfaces at the same time.
3. Curriculum and localization loaders include data for languages and levels
   the current learner is not using.
4. Firebase, Nostr, and Tone/audio dependencies are present in the public
   bootstrap.
5. The PWA precaches nearly the complete JavaScript graph.
6. Progress writes are followed by redundant full Firestore rehydrations even
   though live listeners already exist.
7. The root App subscribes to the complete user object and owns many unrelated
   state machines.
8. Large Skill Tree and continuous canvas/WebGL rendering add DOM, paint, GPU,
   and battery cost.

## Behavior-preservation rules

These rules are mandatory unless a later product decision explicitly changes
them.

### Learning-mode lifecycle

- A mode may be absent before its first visit.
- On first visit, load and mount it.
- After the first visit, retain the current keep-alive behavior unless it is
  proven safe to change.
- Never unmount Tutor or Conversations while connecting or connected.
- Switching away from an active voice session must preserve the connection,
  transcript, current lesson, audio state, and return experience.
- On iOS/WebKit, retain the existing special handling unless device testing
  proves a replacement is safer.

Desired lifecycle:

```text
Initial Daily Plate
  Path UI:          not mounted
  Flashcards UI:    not mounted
  Conversations UI: not mounted
  Tutor UI:         not mounted

User opens Tutor
  Tutor chunk loads
  Tutor mounts

User switches away while connected
  Tutor remains mounted and connected

User disconnects and leaves
  Initial implementation still keeps Tutor mounted
  A later measured phase may consider unmounting it
```

### Data correctness

- New curriculum loaders must return data deeply equivalent to the old loaders
  for every supported language and CEFR level.
- Firestore optimizations must retain server reconciliation and multi-device
  behavior.
- XP, lesson status, flashcard review state, daily goals, companion state, and
  celebrations must remain correct after refresh.

### Loading and failure behavior

- Every lazy boundary needs a deliberate loading state.
- A failed feature chunk must show a recoverable retry UI, not a blank screen.
- A deploy must not strand clients on an old HTML/service-worker version whose
  referenced chunks no longer exist.
- Offline behavior must be tested before changing the precache strategy.

## Execution principles

1. Establish repeatable measurements before changing behavior.
2. Make one bounded architectural change per PR.
3. Measure cold and warm behavior after every phase.
4. Keep the change only when it improves the intended metric.
5. Run the complete behavioral smoke matrix before merging.
6. Prefer reversible gates and compatibility adapters.
7. Do lower-risk delivery work before Firestore or virtualization work.
8. Preserve existing user changes and unrelated work in the repository.

---

## Phase 0 — Measurement and regression safety

**Risk:** Low  
**Behavior change:** None  
**Required before all other phases**

### 0.1 Record a controlled baseline

Capture each scenario under:

1. No throttling, cache disabled, service worker bypassed.
2. Fast 4G, cache disabled, service worker bypassed.
3. Fast 4G, cache disabled, service worker enabled.
4. Fast 4G, cache enabled, service worker enabled.
5. Slow 4G, cache disabled, service worker enabled.

Record the test machine, browser version, viewport, CPU throttling, network
profile values, cache state, and service-worker state.

Measure:

- Landing navigation to usable page.
- Sign-in action to interactive Daily Plate.
- Daily Plate to first Path render.
- First open of Flashcards.
- First open of Tutor.
- First open of Conversations.
- First lesson start.
- First RPG start.
- Warm reopen of every visited mode.
- Reload after a simulated PWA update.

For each scenario capture:

- LCP and visually complete time.
- Time until the loading overlay disappears.
- Time until the target button/screen responds.
- Total transferred bytes and total JavaScript transferred.
- Long tasks and main-thread blocking time.
- Peak memory after visiting every learning mode.
- Firestore requests and documents read for one flashcard completion and one
  lesson completion.

### 0.2 Add explicit User Timing marks

Add stable instrumentation points such as:

```text
piyali:bootstrap:start
piyali:landing:interactive
piyali:auth:start
piyali:user:hydrated
piyali:plate:committed
piyali:boot-overlay:hidden
piyali:mode:<name>:import-start
piyali:mode:<name>:mounted
piyali:curriculum:load-start
piyali:curriculum:ready
```

Use `performance.mark()` and `performance.measure()`. Instrumentation must not
contain secrets, Nostr keys, user text, or personal identifiers.

### 0.3 Establish behavioral regression coverage

Before changing lifecycle behavior, add or document automated coverage for:

- Initial Daily Plate selection.
- First visit and revisit for each mode.
- Tutor connection surviving a mode switch.
- Conversation connection surviving a mode switch.
- Lesson start, progress, completion, XP, and return to Path.
- Flashcard answer, review scheduling, XP, and refresh.
- Language and CEFR-level switching.
- Onboarding and subscription gates.
- Daily-goal/timer/proficiency modal ordering.
- PWA offline start and update.

Where automation is impractical, add the scenario to the mandatory manual smoke
matrix below.

### 0.4 Add bundle reporting and budgets

- Keep generating the Rollup visualizer output in CI/artifacts, but do not open
  it automatically in non-interactive builds.
- Record entry, App, curriculum, and optional-feature gzip sizes.
- Add an initial non-blocking budget report.
- Turn budgets into merge-blocking checks after the first improvement phase
  establishes realistic thresholds.

### Phase 0 completion gate

- Repeatable cold and warm results are recorded.
- Timing marks distinguish download, user hydration, React commit, and overlay
  delay.
- Smoke coverage exists for all lifecycle-sensitive flows.
- `npm test`, `npm run build`, and `git diff --check` pass.

---

## Phase 1 — Active-feature loading and mount-on-first-visit

**Risk:** Medium  
**Expected impact:** Highest  
**Primary files:** `src/App.jsx`, `src/components/SkillTree.jsx`,
`src/main.jsx`

### Objective

Make Daily Plate load without downloading or mounting Path, Flashcards,
Conversations, Tutor, lesson modules, and optional modal-heavy features.

### Implementation

- Introduce lazy boundaries for major authenticated surfaces:
  - Skill Tree / Path
  - Flashcard Skill Tree
  - Conversations
  - Tutor
  - Alphabet Bootcamp
  - Grammar Book
  - Vocabulary
  - Stories
  - History
  - Real-time lesson surface
  - Help Chat
  - Large optional drawers/modals where appropriate
- Track `visitedModes` separately from `pathMode`.
- Render a mode only when it is active or has previously been visited.
- Once visited, preserve existing keep-alive behavior.
- Retain the existing `isActive` signal for connection/audio work.
- Do not render `SkillTree` at all while the initial mode is `plate` and no
  Skill Tree-owned mode has been visited.
- Add retryable feature error boundaries.
- Preload on intent where it improves responsiveness:
  - pointer hover on desktop
  - pointer/touch down on mobile
  - idle prefetch only after Daily Plate is interactive
- Do not preload every feature during the same idle callback.

### Important caution

Wrapping an already-mounted hidden component in `React.lazy` is insufficient:
React will still request the chunk when it attempts to render that hidden
component. The mount gate must happen outside the lazy component.

### Verification

- On a cold Daily Plate load, Network and Coverage show no Tutor,
  Conversations, Flashcards, or Skill Tree feature chunk.
- React Profiler shows none of those feature trees mounted.
- First visit displays the expected loading treatment.
- Revisit matches the current instant/keep-alive behavior.
- Active voice sessions survive switching modes.
- Back navigation and modal sequencing remain unchanged.

### Rollback trigger

Roll back or disable the gate if transcripts, audio connections, lesson state,
modal ordering, or first/revisit navigation changes.

---

## Phase 2 — Split curriculum and localization data

**Risk:** Medium  
**Expected impact:** Very high  
**Primary files:** `src/data/skillTree/index.js`,
`src/data/skillTreeData.js`,
`src/data/skillTree/targetCurriculum/index.js`,
`src/utils/translation.jsx`, alphabet and flashcard localizers

### Objective

Download only the selected target language, support language, and active CEFR
level. Prefetch adjacent data only after the current screen is interactive.

### Implementation

- Replace the single aggregate `skillTreeData.js` dynamic import with an
  explicit loader manifest.
- Split authored target curriculum by target language.
- Split the base path by CEFR level if this can be done without changing lesson
  object identity/shape relied on by consumers.
- Load the current lesson level first.
- Load the flashcard level only when Flashcards is first visited.
- Prefetch an adjacent level during idle time after the current level renders.
- Dynamically load support-language translation maps.
- Apply the same pattern to alphabet and flashcard localizers.
- Preserve a compatibility loader API so callers do not need simultaneous
  changes.

Example shape:

```js
const targetCurriculumLoaders = {
  de: () => import("./targetCurriculum/de.js"),
  en: () => import("./targetCurriculum/en.js"),
  fr: () => import("./targetCurriculum/fr.js"),
  // ...
};
```

The import specifiers must remain statically enumerable so Vite creates stable,
separate chunks.

### Required equivalence tests

For every supported target language and every level:

- Compare old and new units.
- Compare lesson IDs and order.
- Compare titles, descriptions, modes, XP, agenda data, and authored target
  curriculum.
- Confirm repair overrides and alignment overrides are applied.
- Confirm Nahuatl and Yucatec Maya retain their intentional fallback behavior.
- Confirm `getLatestUnlockedLesson` returns the same result for representative
  progress maps.

Keep a temporary legacy loader available only in tests until equivalence is
proven. Remove it after the phase is stable.

### Verification

- A French Pre-A1 cold load does not download German, Greek, Russian, Japanese,
  or other target curriculum files.
- Switching language loads the new language and renders identical content.
- Switching level loads the requested level without losing scroll/progress.
- Curriculum validation and the full test suite pass.

---

## Phase 3 — Slim the public bootstrap

**Risk:** Medium  
**Expected impact:** Very high for new visitors  
**Primary files:** `src/main.jsx`, `src/useThemeStore.jsx`,
`src/components/LandingPage.jsx`,
`src/firebaseResources/*`, identity and sound hooks

### Objective

Render the public landing page without downloading Firestore, Firebase AI,
Analytics, Messaging, Nostr wallet code, or Tone unless the visitor performs an
action that needs them.

### Firebase work

- Make theme initialization local-only.
- Remove static Firestore imports from `useThemeStore`.
- Dynamically import authenticated theme persistence inside the setter.
- Split Firebase initialization by capability:
  - minimal app initialization
  - App Check
  - Firestore
  - AI models
  - Analytics
  - Messaging
- Initialize Analytics and Messaging after the page is interactive/idle.
- Do not duplicate `@firebase/vertexai` and `firebase/ai`; standardize on one
  supported API after verifying all model consumers.
- Ensure App Check is initialized before protected calls that require it.
- Cache each initialization promise so concurrent callers share one instance.

### Nostr work

- Keep key detection/local session checks lightweight.
- Load NDK/Nostr signing and wallet code when authentication or wallet UI opens.
- Preserve the requirement that secret-key handling never leaves the expected
  local boundary.
- Test reconnect and account switching.

### Audio work

- Load Tone/SoundManager on the first eligible user gesture.
- Preserve synchronous gesture handling required by iOS audio policies.
- Do not place an `await` before the call that unlocks audio.
- Consider lightweight native Web Audio or silent gesture priming for basic UI
  feedback, but only if sound output remains identical.
- Cache the audio initialization promise.

### Verification

- Coverage confirms Firebase AI, Messaging, NDK, wallet code, and Tone are
  absent from an untouched landing-page session.
- Sign-in still succeeds on first click/tap.
- First sound works on iPhone Safari and Android Chrome.
- Theme selection persists locally immediately and remotely after auth.
- Analytics/notification initialization still occurs when appropriate.

---

## Phase 4 — PWA cache strategy

**Risk:** Medium  
**Expected impact:** High for first install, updates, and constrained networks  
**Primary file:** `vite.config.js`

### Objective

Stop the service worker from downloading almost every optional feature during
installation/update while retaining deliberate offline behavior.

### Implementation

- Document which screens must work offline.
- Precache only the true app shell:
  - `index.html`
  - critical entry JavaScript
  - critical CSS
  - manifest
  - essential fonts/icons
- Runtime-cache optional hashed feature chunks after first use.
- Do not precache:
  - RPG/Game Router
  - Citizenship Guide
  - all curriculum languages
  - Tutor/Conversation/Flashcard chunks before use
  - large optional media
- Warm only the active language/current level when offline readiness requires
  it.
- Keep update installation atomic and recoverable.
- Retain old hashed assets long enough that existing clients can finish an
  update safely, or implement an explicit reload/retry path.
- Confirm outdated caches are cleaned after successful activation.

### Required comparisons

Measure the same cold load with:

1. Service worker bypassed.
2. Service worker enabled on first install.
3. Service worker enabled on update.
4. Warm cache.

### Verification

- Precache is within the agreed budget.
- Optional feature downloads do not compete with initial Daily Plate startup.
- Offline-required screens still work.
- An update never produces a blank screen or chunk-load loop.

---

## Phase 5 — Firestore request and state reconciliation

**Risk:** High  
**Expected impact:** High for interactions, latency, reads, and rerenders  
**Primary files:** `src/App.jsx`, `src/hooks/useUserStore.js`,
progress and Firestore utilities

Do not begin this phase until Phases 0–4 are stable. The existing full
rehydration is inefficient but provides correctness. Replace it incrementally.

### Current issue

`loadUserObjectFromDB` reads:

- the root user document
- `languageLessons`
- `tutorLanguageLessons`
- `languageFlashcards`

It is called after lesson starts, lesson completion, flashcard reviews,
onboarding, repair completion, and reward claims while live snapshot listeners
also subscribe to the same state.

### Implementation sequence

1. Instrument and count reads per user action.
2. Convert one action at a time, starting with flashcard review.
3. Have the write/transaction return the authoritative fields needed locally.
4. Apply a narrow optimistic patch.
5. Let the existing snapshot reconcile server/multi-device changes.
6. Process `snapshot.docChanges()` instead of rebuilding complete maps when
   practical.
7. Preserve an explicit full-refresh recovery path for errors/account switches.
8. Remove each redundant rehydration only after its action-specific tests pass.

### State-store changes

- Add narrow actions such as:
  - `patchXp`
  - `patchLanguageLesson`
  - `patchTutorLesson`
  - `patchFlashcardReview`
  - `patchDailyGoal`
- Avoid replacing the complete `user.progress` object for a single card.
- Preserve structural sharing so unrelated selectors do not rerender.
- Add stale-write/order tests for rapid consecutive actions.

### Verification

- One flashcard review does not trigger a root read plus three full queries.
- XP/progress update immediately and remain correct after refresh.
- Multi-tab and multi-device changes reconcile.
- Offline writes reconcile when connectivity returns.
- Firestore read counts fall without changing user-visible state.

---

## Phase 6 — Root render boundaries

**Risk:** Medium-high  
**Expected impact:** Medium-high  
**Primary files:** `src/App.jsx`, Zustand stores, modal/session providers

### Objective

Prevent an unrelated timer, snapshot, note, modal, or progress update from
rerendering the entire application shell.

### Candidate boundaries

- App/router shell
- Authentication and user hydration
- Daily Plate conductor
- Learning-mode host
- Lesson player
- Modal/celebration host
- Bottom action bar
- Timer
- Real-world tasks
- Companion state

### Implementation

- Extract one boundary at a time without changing state ownership prematurely.
- Replace `useUserStore((s) => s.user)` with narrow selectors where possible.
- Use shallow equality for composite selector results.
- Move the one-minute real-world-task tick into the component that displays it.
- Keep the existing module-level one-second timer optimization.
- Stabilize frequently passed object/callback props only where profiling proves
  rerenders.
- Do not add `memo` everywhere without evidence.

### Verification

Use React Profiler to confirm:

- XP changes do not rerender unrelated drawers and screens.
- The minute task tick does not rerender App.
- Opening a modal does not walk the complete learning surface.
- Mode switches preserve state and modal ordering.

---

## Phase 7 — Skill Tree rendering

**Risk:** High  
**Expected impact:** Medium  
**Primary file:** `src/components/SkillTree.jsx`

Only begin after bundle delivery and hidden mounting are fixed. Re-profile first;
the earlier phases may make full virtualization unnecessary.

### Safer first steps

- Load/render only the active CEFR level.
- Use unit-level `content-visibility: auto` with an intrinsic-size placeholder.
- Avoid rebuilding progress scans multiple times per render.
- Cache derived lesson status by the narrow progress map and visible units.
- Verify that hidden/offscreen decorative filters are not painting.

### Virtualization, if still needed

- Virtualize at the unit level before lesson-node level.
- Preserve deterministic unit heights and scroll position.
- Preserve `scrollToLatestUnlocked`.
- Preserve SVG connector continuity.
- Keep keyboard navigation and accessibility semantics.
- Test opening a lesson near the beginning, middle, and end of every level.

### Rollback trigger

Any broken connector, incorrect scroll target, jump on level switch, missing
lesson, inaccessible node, or modal-position regression requires rollback.

---

## Phase 8 — Animation, GPU, and battery budget

**Risk:** Low-medium  
**Expected impact:** Medium on mobile/runtime battery  
**Primary files:** `src/components/VoiceOrb.jsx`,
`src/components/RoleCanvas/RoleCanvas.jsx`,
`src/components/RobotBuddyPro.jsx`, animated feature components

### VoiceOrb

- Pause rendering when `document.hidden`.
- Pause or reduce frame rate when outside the viewport.
- Render idle orbs at 15–30 FPS.
- Use a static/CSS treatment for very small loading indicators where visual
  equivalence is acceptable.
- Use the worker path where supported and beneficial, but remember that workers
  reduce main-thread work rather than GPU work.
- Avoid creating unnecessary simultaneous WebGL contexts.
- Respect `prefers-reduced-motion`.
- Ensure every pause condition has a tested resume path.

### Other animations

- Add visibility/activity gates to RoleCanvas and RobotBuddy loops.
- Do not run hidden-mode animation loops.
- Cap device pixel ratio for small canvases.
- Measure GPU/main-thread improvement rather than assuming it.

### Verification

- Animations resume after tab/background/viewport changes.
- Active Tutor/Conversation visuals remain responsive.
- Reduced-motion behavior is correct.
- Idle CPU/GPU use falls in Performance/Task Manager.

---

## Phase 9 — Assets and dependency cleanup

**Risk:** Low-medium  
**Expected impact:** Lower than earlier phases

- Convert character PNGs to WebP/AVIF where transparency and quality remain
  visually equivalent.
- Consider a sprite atlas or dynamic asset manifest for character selection.
- Preserve rendered dimensions to prevent layout shift.
- Verify that unused 2 MB tutor artwork is not emitted or fetched.
- Keep the RPG music and Three.js client lazy.
- Consolidate duplicate Firebase AI packages.
- Review large icon families only after higher-impact work; tree shaking already
  limits much of their cost.
- Remove genuinely unused dependencies only after repository-wide verification.

---

## Risk register

| Optimization | Risk | Main failure mode | Required safeguard |
|---|---:|---|---|
| Lazy feature imports | Medium | blank screen/chunk failure | Suspense + retryable error boundary |
| Mount on first visit | Medium | state differs on first switch | visited-mode tests; keep alive afterward |
| Fully unmount hidden modes | High | voice/session loss | deferred; never while connected |
| Per-language curriculum | Medium | missing/wrong data | old-vs-new equivalence tests |
| Lazy Firebase initialization | Medium | initialization races | singleton promises + integration tests |
| Lazy Tone initialization | Medium | first sound blocked on iOS | synchronous gesture unlock testing |
| PWA cache changes | Medium | offline/update failure | offline and update test matrix |
| Remove Firestore rehydration | High | stale/incorrect progress | narrow optimistic patch + snapshot reconcile |
| Root state refactor | Medium-high | modal/order/state regression | one boundary per PR |
| Skill Tree virtualization | High | scroll/connector/UI breakage | unit-first implementation + visual tests |
| Animation throttling | Low | animation does not resume | visibility lifecycle tests |
| Asset conversion | Low | transparency/size regression | screenshot comparison |

## Mandatory smoke matrix

Run after every phase that touches the relevant area.

### Authentication and boot

- New user sign-in.
- Returning user sign-in.
- Account switch.
- Sign out and sign back in.
- Onboarding resume and completion.
- Subscription gate accepted/rejected.
- Cold load and warm load.

### Daily Plate and navigation

- Initial load lands on Daily Plate.
- Open Path, return to Plate, reopen Path.
- Open Flashcards, return, reopen.
- Open Alphabet Bootcamp for a supported language.
- Bottom action bar minimize/restore.
- Settings, Notes, Help Chat, and real-world tasks.

### Voice modes

- First Tutor open.
- Tutor connects, switch mode, return while connected.
- Tutor disconnects and reconnects.
- First Conversations open.
- Conversations connects, switch mode, return while connected.
- Microphone permission accepted and denied.
- First sound on iPhone Safari.

### Lessons and progress

- Start regular lesson.
- Start tutorial lesson.
- Start repair lesson.
- Complete each lesson module type.
- Complete RPG lesson and return.
- XP updates immediately and after refresh.
- Flashcard review updates scheduling and XP.
- Level unlock and celebration ordering.
- Daily goal and timer modal sequence.

### Language/data

- Every target language loads.
- Every support language loads.
- Every CEFR level loads.
- Switch target language from Plate and Path.
- RTL layout for Arabic.
- Japanese/Hindi/Chinese localized data.
- Nahuatl/Yucatec Maya fallback remains unchanged.

### PWA/offline/update

- First install.
- Warm launch.
- Offline launch of required screens.
- Go offline after loading a feature.
- New deployment while old client is open.
- Service-worker update and reload.
- Chunk-load failure and retry.

### Devices

- iPhone Safari.
- Android Chrome.
- Desktop Chrome.
- At least one lower-memory/mid-range mobile device or representative CPU
  throttling profile.

## Provisional performance targets

Validate and adjust these targets after Phase 0. They are directional budgets,
not permission to break behavior.

| Metric | Current | First target | Stretch target |
|---|---:|---:|---:|
| Fast 4G cold boot to Daily Plate | ~20s | ≤8s | ≤5s |
| Slow 4G cold boot to Daily Plate | >45s | ≤20s | ≤12s |
| Public entry JavaScript (gzip) | 610 KB | ≤350 KB | ≤250 KB |
| Extra authenticated shell JS before Plate (gzip) | ~1.2 MB | ≤650 KB | ≤400 KB |
| Selected curriculum load (gzip) | 664 KB aggregate | ≤250 KB | ≤150 KB |
| PWA precache | 9.95 MB | ≤3 MB | ≤1.5 MB |
| Hidden unvisited mode trees on initial Plate | 4 | 0 | 0 |
| Full four-read hydration after flashcard review | 1/action | 0 | 0 |

Feature-first-open time should improve without making revisits slower than the
current keep-alive experience.

## Per-phase validation commands

Run the relevant targeted tests plus:

```sh
npm test
npm run lint
npm run build
git diff --check
```

If the repository has pre-existing lint failures, record the baseline and do
not introduce new failures. Do not silently weaken lint or test configuration.

After the production build:

- Compare generated chunk sizes against the recorded baseline.
- Inspect the Rollup visualizer.
- Confirm optional chunks are absent from the initial Network waterfall.
- Repeat the controlled Fast 4G cold and warm measurements.
- Run the relevant manual smoke matrix.

## Change and rollback discipline

- One phase or smaller bounded slice per branch/PR.
- Include before/after measurements in every performance PR.
- Include the exact test scenarios exercised.
- Keep compatibility adapters until the new path is verified.
- Prefer feature flags for lifecycle, PWA, and Firestore changes.
- Do not delete the old path in the same commit that introduces a high-risk
  replacement.
- Revert when correctness changes, even if performance improves.
- Never stack another optimization on top of an unresolved regression.

## Recommended implementation order

1. Phase 0: measurement and regression safety.
2. Phase 1: active-feature loading and mount-on-first-visit.
3. Phase 2: per-language/per-level curriculum and localization.
4. Phase 3: slim public bootstrap.
5. Phase 4: PWA cache strategy.
6. Re-measure and decide whether targets are already acceptable.
7. Phase 5: Firestore requests, one action at a time.
8. Phase 6: root render boundaries, one boundary at a time.
9. Phase 8: animation/GPU improvements.
10. Phase 7: Skill Tree virtualization only if profiling still justifies it.
11. Phase 9: assets and dependency cleanup.

The numerical phase labels group related work; the recommended implementation
order intentionally puts low-risk animation work before high-risk Skill Tree
virtualization.

## Definition of done

The optimization program is complete when:

- Controlled Fast and Slow 4G targets are met or consciously revised with
  documented evidence.
- Daily Plate initially downloads and mounts only what it needs.
- Unvisited learning modes are absent from the initial bundle waterfall and
  React tree.
- Active Tutor and Conversation sessions survive mode switches exactly as
  before.
- Only the selected language/level curriculum loads initially.
- The landing page does not eagerly load optional Firebase, Nostr, wallet, AI,
  messaging, or audio capabilities.
- PWA install/update no longer precaches the complete optional application.
- Common progress actions do not perform redundant full user rehydrations.
- React profiling shows unrelated updates contained to their feature boundary.
- Animation loops pause offscreen/background and reliably resume.
- All automated tests, build, diff checks, and mandatory smoke scenarios pass.
- No visual, navigation, curriculum, progress, audio, session, offline, or
  update behavior regression remains.

