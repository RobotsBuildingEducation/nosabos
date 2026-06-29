# Companion Batch Repair — Spec

Extends `COMPANION_MEMORY_QUEST_PLAN.md`. Turns the repair task from a
heuristic flashcard replay into an **AI-composed "tomorrow's blueprint"**,
generated **once per day as a batch** when today's quest finishes.

This is the phase the original plan deferred ("multi-mode repair + generated
material"). It does **not** touch the capture → 2-day-lifecycle → prune loop,
which stays as-is.

---

## 1. Corrected mental model

Generation is **batched at quest-completion**, not fired per mistake.

- **Trigger = "today's quest is done."** When the plate clears, one job reads
  the whole day's note feed + completion state and composes tomorrow.
- **Batch, because the unit is the day.** One synthesis pass sees every weak
  spot together → one coherent repair theme + one message, in a single LLM
  call. (Per-mistake generation = N disconnected fragments, N calls, and no
  notion of whether the user actually finished. Rejected.)
- **Completion state is itself input.** "Finished all 4" vs "did 1 of 4 and
  bailed" changes tomorrow (see §5, Option A).

Generation runs the night before; Day T+1 just **reads** an already-stored
blueprint → still instant, no loading beat on the pet.

---

## 2. Triggers

### 2a. Happy path — quest completed (primary)

Hook a new effect next to the bonus-claim effect at **`App.jsx:7972`**
(`plateSnapshot.isCleared && !plateSnapshot.bonusAwarded`). That site is
already "fires once per plate, even across reloads/devices," because
`claimDailyPlateBonus` writes a Firestore marker. We mirror that pattern with
our own marker:

```
on (isCleared && !blueprintMarker(tomorrow)):
  write dailyQuestBlueprint[lang][tomorrowKey] = { status: "generating" }   // marker FIRST (multi-device guard)
  blueprint = await runBatch({ todaysNotes, todayCleared: true, ... })
  store blueprint (status: "ready") OR (status: "failed") on error
```

Keep it a **separate effect from bonus payment** — a failed LLM call must not
block the XP bonus, and vice-versa. Use a `useRef` in-flight guard +
the Firestore marker, exactly like `plateBonusClaimingRef`.

`tomorrowKey = getCompanionDayKey(now + 1 day)` (the blueprint is keyed to the
day it will be *consumed*).

### 2b. Fallback — quest NOT completed (next-day on open)

If the user never clears the plate, 2a never fires. The existing repair-gen
effect at **`App.jsx:7537`** (runs on app-open, idempotent via a stored-plan
check, gated on `isPastFirstQuest + hasReusableMemory`) **becomes the
fallback**:

```
on app-open, if NO blueprint exists for today AND yesterday had notes:
  yesterdayComplete = hasPlateBonusMarker(user, lang, yesterdayKey)   // bonus marker = "was cleared"
  blueprint = await runBatch({ yesterdaysNotes, todayCleared: yesterdayComplete, generatedFrom: "fallback" })
  store blueprint for today
```

`yesterdayComplete` is read from the **plate-bonus marker**
(`applyPlateBonusMarker` / `claimDailyPlateBonus` already stamp `progress` per
cleared day) — no new bookkeeping needed.

This is the only path that can show a brief generating state on open, and only
on days the user didn't finish. Acceptable, and it resolves the earlier
precompute-vs-on-open tension: **precompute is the happy path; on-open is just
the safety net.**

---

## 3. Data schema (new)

One new top-level user-doc field, written via the store + Firestore merge (same
convention as `companionMemory` / `dailyQuestRepair`):

```js
user.dailyQuestBlueprint[lang][dayKey] = {
  dayKey, targetLang,
  status: "generating" | "ready" | "failed",
  generatedAt, generatedFrom: "completion" | "fallback",
  yesterdayComplete: boolean,

  // Option A carry-over (see §5)
  carryOverKinds: ["speak", "learn"],     // unfinished quest kinds from yesterday

  // Replaces the heuristic buildRepairPlan output
  repair: {
    mode, recommendedMode, target,
    items: [{ memoryId, concept, errorType, sourceMode, prompt, answer, hint }],
    memoryIds: [...],
  },

  // AI-written manga bubble (replaces buildQuestBubble for returning days)
  message: { short, long },

  rationale: { questKinds, repairMemoryIds, summary },  // supersedes dailyQuestExplanations
}
```

**Back-compat:** the batch also mirrors `repair` into the existing
`dailyQuestRepair[lang][day]` shape, so `getStoredRepairPlan`, the derived
`questKinds` prepend, and `CompanionRepairModal` keep working untouched. New
consumers read the blueprint; old ones keep reading their fields.

---

## 4. The batch job (`utils/companionMemory.js` → new `runDailyBatch`)

**Inputs:** the day's notes (`getCompanionNotes` filtered to the source day),
`todayCleared`, `carryOverKinds`, target/support langs, CEFR.

**LLM call:** `callResponses` from `utils/llm.js` (the shared client every
generative surface already uses). One call, JSON out:

```js
const raw = await callResponses({
  model: DEFAULT_RESPONSES_MODEL,            // gpt-5-nano; bump or add a thinking budget for richer voice
  input: buildBatchPrompt({ notes, todayCleared, carryOverKinds, lang, supportLang }),
  // generationConfig: { thinkingConfig: { thinkingBudget: ... } }  // optional, for less formulaic message
});
const blueprint = parseBatchJson(raw);       // strict parse, defensive
```

**Output contract (the prompt demands this exact JSON):**

```json
{
  "message": { "short": "...", "long": "..." },
  "repair": {
    "recommendedMode": "flashcard|grammar|phonics|conversation|tutor|listening|review",
    "items": [{ "memoryId": "...", "prompt": "...", "answer": "...", "hint": "..." }]
  },
  "summary": "one-line why-this-quest"
}
```

The prompt: persona = the companion; tone rules from the plan (§"Repair should
feel positive" — never "you got this wrong"); when `todayCleared === false`,
instruct it to gently acknowledge the unfinished day and prioritize the
carried-over concepts. `memoryId`s are constrained to the ones we passed in, so
items map back to real notes for progress/reinforcement.

**Mode selection** is now the model's job (it sees all errors at once), but we
keep `repairModeForError` as a deterministic fallback default.

---

## 5. Option A — carry over unfinished + bump priority

When `todayCleared === false`:

1. **Carry over the tasks.** `carryOverKinds` = yesterday's elected kinds where
   `byKind[kind].done === false`. Today's `questKinds` prepends them, **exactly
   like `repair` is prepended today** (derived, never re-elected — see the
   existing `repairPlanToday ? ["repair", ...] : ...` at `App.jsx:7433`). New
   dayKey ⇒ their counters reset ⇒ genuinely re-attempted.

   ```
   questKinds = dedupe([...carryOverKinds, ...(repair ? ["repair"] : []), ...electedQuestKinds])
   ```

2. **Bump the weak concepts.** Notes tied to the unfinished day get a priority
   boost so the repair plan favors them — either bump `severity` on those notes
   (buildRepairPlan already ranks by severity) or have the batch emit the repair
   `items` pre-ordered. Prefer the latter (the AI already ranked them).

3. **Acknowledge it.** `message` reflects the slip ("we didn't finish
   yesterday — let's close it out"), driven by the `todayCleared:false` branch
   of the prompt.

---

## 6. Consumption changes (minimal)

- **Bubble** (`DailyPlateHome`): prefer `blueprint.message.long`; fall back to
  the deterministic `buildQuestBubble` when no blueprint / `status:"failed"`.
- **Repair** (`getStoredRepairPlan` + modal): unchanged — reads the mirrored
  `dailyQuestRepair`, now AI-authored.
- **First-quest caveat:** **generation** gate = "quest cleared + has notes"
  (so Day-1 completion produces Day-2's blueprint); **consumption** gate stays
  `isPastFirstQuest` (unchanged). They line up naturally — Day 1 is never
  personalized, Day 2 is the first day a blueprint is read.

---

## 7. Failure principle (non-negotiable)

The AI layer is an **enhancement over a working deterministic floor.** If
`callResponses` fails, times out, or returns unparseable JSON → `status:
"failed"` and every surface falls back to today's shipped behavior
(`buildQuestBubble` + heuristic `buildRepairPlan`). A bad LLM response must
never break Day 2.

---

## 8. Idempotency & multi-device

Marker-first, mirroring `claimDailyPlateBonus`: write
`dailyQuestBlueprint[...][day].status = "generating"` **before** the call. A
second tab/device sees the marker and skips. A `generating` marker older than N
minutes (stale, e.g. the tab closed mid-call) is eligible for one retry on next
open.

---

## 9. Build order

1. **Schema + store helpers** — `dailyQuestBlueprint` read/write, bonus-marker
   reader (`hasPlateBonusMarker`), `runDailyBatch` skeleton that *only* writes
   the deterministic blueprint (no AI yet). Wire 2a + 2b triggers. Ship: same
   behavior, new plumbing.
2. **AI batch** — `buildBatchPrompt` + `parseBatchJson` + failure fallback.
   Bubble reads `blueprint.message`. Ship: AI voice + AI-selected repair,
   instant on Day T+1.
3. **Option A carry-over** — `carryOverKinds` derive + prepend, priority bump,
   incomplete-day acknowledgment.
4. **Multi-mode routing** — act on `recommendedMode` to send repair into
   phonics / conversation / tutor instead of always flashcards (touches the
   repair surface; largest blast radius, last).

---

## 10. Open decisions

- **Model/quality:** `gpt-5-nano` is cheap and fine for structure; the
  companion *voice* may want a stronger model or a thinking budget. Tunable per
  call — not a blocker.
- **Carry-over cap:** if yesterday had many unfinished kinds, cap how many
  carry over (e.g. 2) so today's plate doesn't balloon.
- **Stale-`generating` retry window:** pick N (suggest 10 min).
