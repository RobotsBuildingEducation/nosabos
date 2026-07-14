# database_fix.md — Shrinking the `users/{npub}` document

**Problem:** the user document accumulates day-keyed maps that are never pruned. Every
Firestore listener receives the *whole* doc on *any* field change (there are at least three
simultaneous full-doc listeners: `App.jsx:1449`, the daily-goal listener, and
`History.jsx:419`), and `awardXp` re-uploads the full history maps inside its transaction
payload on every XP grant. Left alone, a daily bilingual user hits Firestore's **1MB doc
limit in well under two years** — and long before that, every XP tick ships hundreds of KB
both directions.

No Firestore **rules changes are needed** for any fix below: `firestore.rules:40` already has a
recursive `match /{document=**}` wildcard under `/users/{userId}`, so new subcollections
inherit the same access. (Consider tightening that wildcard later, separately.)

---

## 1. Field inventory (what's on the user doc today)

### Tier 1 — unbounded AND large per entry (fix first)

| Field | Shape | Written by | Pruned? | Growth |
|---|---|---|---|---|
| `dailyQuestBlueprint` | `{lang: {dayKey: blueprintObj}}` | `persistBlueprint` (`companionMemory.js:1448`, doc write at `:1492`) | **NO — never** | ~1–4KB **per day per language**, forever |
| `dailyQuestRepair` | `{lang: {dayKey: repairObj}}` | same write (`companionMemory.js:1494`) | **NO — never** | ~0.5–2KB/day/lang |
| `dailyQuestExplanations` | `{lang: {dayKey: text}}` | same write (`companionMemory.js:1496`) | **NO — never** | ~0.1–0.3KB/day/lang |

The blueprint object holds the full repair sequence (items with concept/userAnswer/
expectedAnswer/correction strings up to 240 chars each), the companion message, tips, and
rationale. `mergeDayField` (`companionMemory.js:1436`) only ever **adds** day keys; nothing
calls `deleteField()` on these maps (`resetTodayRepairArtifacts` only clears localStorage and
repair flashcard docs; `pruneCompanionMemory` only touches `companionMemory` notes).
**This is the fastest-growing data in the product: ~1MB/year/language at daily use.**
The product lifecycle only ever reads *today / yesterday / tomorrow* keys
(`companionMemory.js:1405`), so >99% of this data is dead weight.

### Tier 2 — unbounded, small per entry (fix second)

| Field | Shape | Written by | Growth |
|---|---|---|---|
| `dailyXpHistory` | `{dayKey: xp}` | `awardXp` (`utils.js`), goal-reset logic, App snapshot handler | +1 key per active day (~20B/day). Also **fully re-spread and re-uploaded on every XP award** |
| `completedGoalDates` | `arrayUnion(dayKey)` (`utils.js:223`) | `awardXp` on goal hit | +1 entry per goal day |
| `progress.lessonDailyActivity` `speakDailyActivity` `flashcardDailyActivity` `conversationDailyActivity` `phonicsDailyActivity` `repairDailyActivity` `plateBonusDailyActivity` | each `{lang: {dayKey: count}}` (`dailyPlate.js:71–99`) | `awardXp`, flashcard grading (`App.jsx:5147`), plate bonus | 7 maps × languages × days. Quest neglect-weighting only looks back **7 days** (`dailyPlate.js`, `getQuestNeglectWeights`) |

### Tier 3 — bounded but heavy and "hot" (fix opportunistically)

| Field | Bound | Notes |
|---|---|---|
| `companionMemory[lang].notes` | ≤40 notes/lang, fields sliced to 240 chars, expiry-pruned (`pruneCompanionMemory`) | Up to ~40KB per language. Bounded, but re-shipped to every listener on every unrelated XP write |
| `progress.languageXp`, settings, pet state, streak fields | bounded | Fine where they are |

### Related read-amplification (not doc size, same work session)

- **No persistent cache**: `firebaseResources.js` uses plain `getFirestore(app)` — memory
  cache only. Every app boot re-downloads the user doc **and** the three whole-subcollection
  listeners below from the server.
- App boot listens to **entire subcollections** with no `where`/`limit`
  (`App.jsx:6409–6480`): `languageLessons`, `tutorLanguageLessons`, `languageFlashcards`
  (one doc per card ever answered — grows for life; every boot = N doc reads).
- `alphabetPractice` `getDocs` filtered by lang but **no limit** (`AlphabetBootcamp.jsx:2720`).
- `savedScripts` is already correctly limited to 50 — use it as the model.

---

## 2. Target design

### Fix A — quest day-blobs → per-day subcollection docs *(Tier 1, do first)*

```
users/{npub}/questDays/{lang}_{dayKey}
  { blueprint, repair, explanation, lang, dayKey, createdAt }
```

- One doc per lang per day. Doc is written once by `persistBlueprint`, read by day key —
  which is exactly how it's consumed today (`getStoredRepairPlan`,
  `dailyQuestBlueprint[lang][dayKey]` at `companionMemory.js:1405`).
- Readers do a **direct `getDoc`** for today/yesterday/tomorrow keys. No listener needed;
  keep patching results into `useUserStore` exactly as now so downstream code is untouched.
- Old day docs can simply accumulate (they're out of every read path), or delete >7-day-old
  docs opportunistically inside `runDailyBatch`. Either is fine; doc-per-day never threatens
  any limit.
- After migration, remove the three legacy maps from the user doc with `deleteField()`.
- Touch points: `persistBlueprint` + `getStoredRepairPlan` + `shouldRunDailyBatch`/
  `runDailyBatch` (`companionMemory.js`), the companion patch block in the App user-doc
  listener (`App.jsx:1460–1476` — stops reading these three fields from the snapshot).

### Fix B — XP history → monthly buckets + hot summary *(Tier 2)*

```
users/{npub}/xpHistory/{YYYY-MM}
  { days: {dayKey: xp}, goalDays: [dayKey, ...], updatedAt }
```

- **Parent doc keeps a hot summary** (all current readers except the heatmap/calendar only
  need this): `dailyXp`, `dailyXpRecent: {last 14 dayKeys: xp}`, `goalStreakCount`,
  `lastGoalDayKey`. This is what the daily-goal modal, plate home, Tutor, and streak logic
  consume at boot — one small doc read, unchanged latency.
- `awardXp` transaction writes today's entry to the month bucket **and** the parent summary
  in the same transaction (transactions span docs; ≤500 ops is nowhere near a concern). It
  also prunes `dailyXpRecent` in place to 14 keys — the parent doc stops growing, and the
  transaction payload becomes constant-size instead of re-spreading the full history.
- `completedGoalDates` → `goalDays` array inside the month bucket (bounded ≤31), plus the
  streak counters on the parent. Whatever currently derives streaks from the full array
  moves to the counters.
- **Heatmap/calendar** (`PlateActivityHeatmap.jsx:169`, `DailyGoalModal`) switch from the
  `dailyXpHistory` prop to lazily fetching the visible months' bucket docs (`getDocs`, no
  listener) when the view opens. A year of heatmap = 12 reads, only when opened.

### Fix C — activity maps → rolling-window prune in place *(Tier 2, cheapest fix)*

- Nothing reads these beyond a 7-day window (neglect weights). Don't create a subcollection:
  in `awardXp` and the flashcard write path, after incrementing today's count, **drop keys
  older than 14 days** for that lang/activity. Constant-size forever, zero migration, zero
  read-path changes.
- If long-term per-activity stats are ever wanted, archive the pruned keys into the same
  monthly `xpHistory` bucket under `activity:` — optional, not needed today.

### Fix D — companion memory → own doc *(Tier 3, optional today)*

- `users/{npub}/companion/{lang}` holding `{notes, lastPrunedDayKey}`. Bounded already, so
  this is purely a bandwidth fix: stops ≤40KB/lang re-shipping through every user-doc
  snapshot. `persistBucket`/`readBucket` in `companionMemory.js` are the only touch points
  (store-first pattern stays identical). Do it if time remains; skip otherwise.

### Fix E — platform-level wins *(independent, 15 minutes, do anytime)*

1. Swap `getFirestore(app)` for `initializeFirestore(app, { localCache:
   persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })` in
   `firebaseResources.js`. Boot reads then serve from IndexedDB and only deltas hit the
   network — this alone removes most of the per-boot read bill and makes the subcollection
   listeners cheap.
2. Narrow the three boot listeners to the active target language (`where("targetLang", "==",
   lang)` — flashcard docs already store `targetLang`; lesson docs: verify field exists,
   else key by prefix as with `{lang}_{cardId}`).
3. Add a `limit()` to the `alphabetPractice` query.

---

## 3. Migration mechanics (lazy, per-user, idempotent)

1. Stamp `schemaVersion` on the parent doc. Current implicit version = 1; migrated = 2.
2. On login (right after the first user-doc read in `connectDID`/App boot), if
   `schemaVersion < 2`, run one transaction:
   - copy `dailyQuestBlueprint/Repair/Explanations` **for the last 3 day keys only** into
     `questDays` docs (older keys are dead — drop them);
   - copy `dailyXpHistory` into month buckets; build `dailyXpRecent` (last 14),
     `goalStreakCount`/`lastGoalDayKey` from `completedGoalDates`;
   - prune activity maps to 14 days in place;
   - `deleteField()` the legacy maps: `dailyQuestBlueprint`, `dailyQuestRepair`,
     `dailyQuestExplanations`, `dailyXpHistory`, `completedGoalDates`;
   - set `schemaVersion: 2`.
   Transaction = atomic: a crash mid-migration leaves version 1 and it simply reruns.
3. **Deploy order:** ship readers that handle both shapes first (read bucket → fall back to
   legacy map if `schemaVersion < 2`), then the migration + new writers in the same release.
   Because migration runs at boot before the surfaces mount, dual-path readers can be
   minimal — but keep them for users with multiple devices/tabs on stale JS: an old tab's
   `awardXp` would otherwise resurrect `dailyXpHistory`. The PWA `autoUpdate` registration
   shortens that window but doesn't close it; a later cleanup pass (or re-running the
   migration whenever `schemaVersion < 2` is observed) mops up resurrections.

---

## 4. Suggested order for today

| # | Task | Size | Risk |
|---|---|---|---|
| 1 | Fix E1: persistent local cache | XS | Low — one init change; test multi-tab |
| 2 | Fix A: questDays subcollection + deleteField + stop reading in App listener | M | Medium — 2-day lifecycle logic; test capture→repair across a simulated day boundary |
| 3 | Fix C: rolling-window prune of activity maps | S | Low — verify neglect weights still see 7 days |
| 4 | Fix B: xpHistory buckets + hot summary + heatmap lazy fetch | M/L | Medium — streak math + heatmap read path |
| 5 | Migration txn + schemaVersion (covers A/B/C deletions) | M | Gate everything behind it |
| 6 | Fix D + E2/E3 if time remains | S | Low |

---

## 5. Verification checklist

- [ ] Before/after doc-size probe: log `new Blob([JSON.stringify(snap.data())]).size` in the
  App user-doc listener on a seasoned test account. Expect: hundreds of KB → single-digit KB.
- [ ] Award XP → parent summary updates optimistically (latency compensation) and the month
  bucket gains today's key; **network payload of the transaction no longer contains old day
  keys** (inspect in DevTools).
- [ ] Daily goal hit → streak counter increments, calendar shows the day (bucket read).
- [ ] Companion: capture a miss today → tomorrow's plate shows Repair built from
  `questDays` doc; day-2 expiry still works; Memory drawer unaffected.
- [ ] Heatmap opens correctly for a user with pre-migration history (buckets populated by
  migration) and for a brand-new user (empty state).
- [ ] Second device with old JS: award XP, confirm mop-up re-migration removes any
  resurrected legacy fields.
- [ ] Unit tests for the new date-window helpers (month-key builder, 14-day prune, streak
  from counters). **Note:** there are currently *two* day-key builders (manual format in
  `awardXp`, `getLocalDayKey` in `flashcardReview.js`) — unify on one before writing buckets,
  timezone bugs here are exactly what tests must pin down.

## 6. Gotchas

- `persistBucket`'s "store-first, never write empty over unloaded data" discipline
  (`companionMemory.js`, comment in `pruneCompanionMemory`) must carry over to `questDays`
  reads/writes — don't write before the first snapshot resolves.
- Firestore latency compensation only applies per-doc: UI reading the parent summary stays
  instant; anything that previously read `dailyXpHistory` synchronously from the store must
  now read the summary (or await the bucket fetch in history views).
- Keep bucket writes inside the same `runTransaction` as the parent update — a partial write
  (bucket without summary) would desync streaks.
- `increment()` doesn't exist inside transactions the same way — you're already doing
  read-modify-write in `awardXp`'s transaction; keep that pattern for the bucket too.
- Multi-language users: buckets and questDays are keyed per lang where the data is per lang
  (questDays yes, xpHistory is global — keep it global).
