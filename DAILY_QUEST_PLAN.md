# Daily Quest — Build Plan & Status

A living plan for the **Daily Quest** feature (formerly "Daily Plate"). Check items
off as they ship. This doc is self-contained so the work can be picked up cold
elsewhere.

App lives in `nosabos/` (git root is the parent of that folder). Verify changes with:

```
cd nosabos
npx eslint src/<file>          # lint (the app has pre-existing lint debt; only judge NEW findings)
npm run build                  # production build (does NOT run eslint)
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/src/<file>   # user's dev server hot-reload check (200 = served)
```

Notes on the environment: the user runs their own `vite` dev server on **:5173** (hot reload).
The Claude preview harness cannot spawn a server here (sandbox EPERM) — verify via eslint/build/curl.
`devOptions.enabled` is `false` in `vite.config.js` so there's no dev service worker.

---

## Concept

The Daily Quest is the app's **home surface** (`pathMode === "plate"`) and a **session
conductor**. It composes one light daily session out of "courses" (mode types). The
user presses **Start daily practice**, which routes them to each surface; finishing a
course fires a celebration; clearing all courses pays a one-time **+25 XP bonus**
through the normal `awardXp` pipeline (so it feeds the daily goal, calendar, and pet).

**Design philosophy (agreed):** keep a predictable ritual, but evolve from "fixed" to
**"stable core + adaptive edges."** Not random — *intelligent* with stable-per-day output.

---

## Data model

Per-day, per-language counters on the user doc (`users/{npub}`), under `progress`:

| Field | Course | Written by |
|---|---|---|
| `flashcardDailyActivity[lang][YYYY-MM-DD]` | review | flashcard review flow (`persistFlashcardReview`) |
| `lessonDailyActivity[lang][day]` | learn | `awardXp(..., "lesson")` (skill-tree lesson complete) |
| `speakDailyActivity[lang][day]` | speak | `recordPlateActivity(npub, "speak")` (Tutor lesson complete) |
| `conversationDailyActivity[lang][day]` | conversation (accruing; **not yet a visible course**) | `recordPlateActivity(npub, "conversation")` (Conversation goal complete) |
| `plateBonusDailyActivity[lang][day]` | — | bonus-claim marker (claimed once/day) |

Client state:
- `localStorage["dailyPlateSession"]` = guided session `{ langKey, dayKey, startedAt }`
- `localStorage["pathMode"]` = persisted last-used mode (restored on boot)

**Targets** (`DAILY_PLATE_TARGETS` in `src/utils/dailyPlate.js`): `review = FLASHCARD_DAILY_TARGET` (12),
`learn = 1`, `speak = 1`. **Order** (`DAILY_PLATE_COURSE_ORDER`): `speak → learn → review`.

**Course "done" definitions:**
- review = 12 graded flashcards (pass or fail both count)
- learn = 1 completed skill-tree lesson
- speak = 1 completed Tutor lesson (a finished *lesson*, not free turns)
- conversation = (future) N completed Conversation goals — **target TBD, default 1**
- phonics = (future) TBD — depends on regenerable bootcamp (Phase 3)

---

## Key files

- `src/utils/dailyPlate.js` — `getDailyPlateSnapshot`, targets, `DAILY_PLATE_COURSE_ORDER`,
  `getNextPlateCourse`, `recordPlateActivity`, `claimDailyPlateBonus`, `applyPlateBonusMarker`,
  `resetTodayPlate`, session helpers (`readPlateSession`/`startPlateSession`/`clearPlateSession`/`isPlateSessionFor`).
- `src/utils/dailyPlateCopy.js` — localized copy maps + `PLATE_COURSE_META` (label + icon per course), `plateUiCopy`.
- `src/components/DailyPlateHome.jsx` — the quest home (rendered by App when `pathMode === "plate"`). Pet panel + heatmap + course rows + Start button + dev "Regenerate quest" button.
- `src/components/DailyPlate.jsx` — slim tracker card. **Currently unmounted** (removed from Lessons/Cards surfaces). Kept for possible reuse.
- `src/components/PlatePetPanel.jsx` — standalone pet panel (Health + Daily XP bars). `MdShowChart` icon, % readout uncapped.
- `src/components/PlateActivityHeatmap.jsx` — standalone year heatmap.
- `src/App.jsx` — the brains: conductor effect, celebration modal (`plateCelebration`), bonus-claim effect, `navigateToPlateCourse`, `handleStartDailyPractice`, `handlePlateCelebrationContinue`, `handleRegenerateQuestPlate`, `PATH_MODES` (the "Daily Quest" mode entry uses `PiSealQuestionDuotone` + `PLATE_TITLE_COPY`), `SparkleFrame`/`SparkleShape` (celebration sparkles), `awardXp` source tagging at lesson completion.
- `src/utils/utils.js` — `awardXp(npub, amount, targetLang, source)`; `source` of `"lesson"`/`"speak"` bumps the matching counter via `PLATE_XP_SOURCE_FIELDS`.
- `src/components/SkillTree.jsx` — normalizes `"plate"` into keep-alive/conversation-style modes (renders nothing for plate; App owns the home). Hidden via `display:none` in plate mode so it adds no scroll height.
- `src/components/ModesCarouselModal.jsx` — onboarding "How it works" carousel (shown once after the proficiency step; `modesIntroShown` flag). Localized.
- `src/components/FlashcardSkillTree.jsx` / `FlashcardPractice.jsx` — Cards UI; daily-target bar shown under the rating buttons during a card.
- `src/components/AlphabetBootcamp.jsx` — Phonics (Phase 3 work lives here).

---

## Phases

### ✅ Phase 0 — Dev "Regenerate quest" button (testing)
- [x] `resetTodayPlate(npub, lang)` in `dailyPlate.js` zeros today's course counters + bonus marker (local + Firestore).
- [x] `handleRegenerateQuestPlate` in App resets in-memory guards (`plateClearedCelebratedKeyRef`, `platePrevSnapshotRef`, pending celebration) + ends the session.
- [x] Subtle "↻ Regenerate quest (dev)" button at the bottom of `DailyPlateHome`. **Remove before production.**

### ✅ Phase 1 — Quick wins
- [x] **1a** Bootcamp "Practice" on a completed/collected letter now works: Practice button always renders; `handlePracticeClick` generates a practice word on demand if none is loaded (spinner while generating). (`AlphabetBootcamp.jsx`)
- [x] **1b** Conversation goal completion now calls `recordPlateActivity(npub, "conversation", …)` → `conversationDailyActivity`. Data accrues; not yet a visible course. (`Conversations.jsx`)

### ✅ Phase 2 — Variable quest elector (the main feature)
First quest fixed for everyone; after that, each day auto-elects **~3 (±1)** courses
intelligently from available modes, stable per day.

- [x] `getDailyPlateSnapshot(user, lang, now, kinds)` builds `courses` from an elected `kinds` set. `getNextPlateCourse` iterates the elected order.
- [x] `electDailyQuestCourses({ available, count, avoid, seed, weights })` — neglect-weighted sampling without replacement; canonical order. + `QUEST_CANONICAL_ORDER`, `DAILY_QUEST_DEFAULT_COUNT`.
- [x] **Deterministic per-day seed:** `makeSeededRandom` (hashString → mulberry32). Auto-election seeds `${npub}:${lang}:${dayKey}` → stable per day, identical across devices. Omit seed → random roll (dev button).
- [x] **±1 size variance:** `pickQuestCount` (≈3, sometimes 2/4) derived from the seed.
- [x] **Intelligent weighting:** `getQuestNeglectWeights` — 1 + (# of last 7 days with zero activity in that course). More-neglected modes surface more.
- [x] **Cross-day anti-repeat:** yesterday's stored set is down-weighted (×0.25) via `avoid`.
- [x] **Auto daily election:** App effect — already-elected-today → keep (survives refresh); first quest ever → fixed trio (`hasSeenFirstQuest`/`markFirstQuestSeen`, localStorage `dailyQuestFirstSeen`); else auto-elect for the day. Persisted via `writeQuestPlate`.
- [x] Quest-plate persistence: `writeQuestPlate` / `readQuestPlate` / `readQuestPlateKinds` (localStorage `dailyQuestPlate`, keyed day+lang).
- [x] App: `electedQuestKinds` state, `availableQuestKinds` memo (gates `learn` on `getLatestUnlockedLesson`), snapshot wired to elected kinds, conductor `justDone` uses elected courses.
- [x] **Conversation is a real electable course:** target 1 goal, `PLATE_COURSE_META.conversation` (localized, `RiChat3Line`), `navigateToPlateCourse("conversation") → conversations`.
- [x] Dev "Regenerate quest" button re-rolls (random, weighted) + resets counts.
- [x] `DailyPlateHome` maps `snapshot.courses` (elected order).

**Phase 2 follow-ups:**
- [x] First-quest flag moved from localStorage to the user doc (`progress.dailyQuestFirstSeen`) via `hasSeenFirstQuest(user)` / `markFirstQuestSeen(npub)` — cross-device consistent. Election effect now guards on `activeNpub` (waits for a loaded user before electing/marking).
- [ ] Optional "intensity" setting (light/standard/committed) to drive the count instead of fixed ±1.

### ✅ Phase 3 — Bootcamp epic (Phonics as a recurring course)

**Scope correction:** Phonics is **already available for every learnable target language.**
The learnable targets (`LANGUAGE_META` where `practiceEnabled !== false`) are exactly
`en, es, pt, fr, it, nl, de, ru, ja, el, pl, ga, nah, yua` — which is precisely the set in
`LANGUAGE_ALPHABETS` / `ALPHABET_LANGS`. So no alphabet decks are missing.

`ar` / `zh` / `hi` are **support/UI languages only** (`practiceEnabled: false`) — you learn
*in* them, you don't learn *them* — so they never need an alphabet deck. (Earlier "3c" was a
false premise: it assumed you could pick Arabic/Chinese/Hindi as a target. You can't.)

**Done (3a — Phonics is now a quest course):**
- [x] `phonicsDailyActivity` field + `DAILY_PLATE_ACTIVITY_FIELDS.phonics` + reset list.
- [x] **"Done" metric:** practice **3** letters/day (`DAILY_PLATE_TARGETS.phonics = 3`). Counts every graded practice (pass/fail), like flashcards — `recordPlateActivity(npub, "phonics", lang)` in `AlphabetBootcamp` after grading.
- [x] `PLATE_COURSE_META.phonics` (localized, `LuLanguages`); `navigateToPlateCourse("phonics") → "alphabet"` mode.
- [x] Elector availability: `phonics` added when `ALPHABET_LANGS.includes(targetLang)`. Conductor/celebration/cleared all work generically off the elected set.

**Done (3b — Regenerable decks):**
- [x] "New round" button at deck completion (`handleNewRound`): reshuffles the full alphabet back into the deck and clears the collected display for another pass. Cumulative counts + practiced-word history persist in Firestore; new vocab comes via "Next word" / on-demand generation.
- [x] Collection decoupled from cumulative count: per-mount `collectedThisMountRef` collects a card on its first clear *this round* (replaced the `correctCount === 0` gate that blocked second rounds). First-run behavior unchanged.
- [x] Localized `newRound` copy (all langs) + `RiRefreshLine` icon.

**3c — N/A:** No ar/zh/hi alphabet decks needed (those are support-only, not targets). Every learnable target already has a deck. Phonics is universal.

**Optional polish:**
- [ ] Auto-generate fresh practice words for the whole deck on "New round" instead of relying on per-letter "Next word".

---

## Decisions / conventions captured

- Course count: **~3, ±1** (composition rotates, size stays anchored). No wild 2–5 swings.
- Conversation "done" = **completed goals** (turns are the raw signal). Target TBD (default 1).
- Phonics requires the regenerable bootcamp (Phase 3) before it can join the rotation.
- Changing the daily XP goal **only** updates `dailyGoalXp` — never resets earned XP / the day window / pet / celebration state. (Fixed in `handleDailyGoalSave` + the `DailyGoalModal` fallback.)
- Outside a guided session, finishing **any** course still fires its celebration (chained after that surface's own completion modal); the cleared-bonus celebration covers the full-clear case.
- Pet panel "Daily XP" row shows an uncapped percentage (e.g. 259%); the bar fill clamps at 100%.
- Celebration characters: per-course complete → `RandomCharacter notSoRandomCharacter="25"`; plate cleared → `"29"`; both wrapped in `SparkleFrame`.

## Pre-production cleanup
- [ ] Remove the "↻ Regenerate quest (dev)" button (`DailyPlateHome.jsx`) + its `onRegenerate` prop wiring (keep `resetTodayPlate` util if useful).
- [ ] Decide whether existing users should see the modes carousel once (currently yes) or only new signups.
