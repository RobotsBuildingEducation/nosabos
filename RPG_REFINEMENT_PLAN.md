# RPG Game Review — Refinement Plan (Episode Engine)

A living plan for rebuilding the **unit Game Review** around authored episodes instead of
per-run LLM world generation. Check items off as they ship. This doc is self-contained so
the work can be picked up cold elsewhere.

App lives in `nosabos/` (git root is the parent of that folder). Verify changes with:

```
cd nosabos
npx eslint src/<file>          # lint (the app has pre-existing lint debt; only judge NEW findings)
npm run build                  # production build (does NOT run eslint)
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/src/<file>   # user's dev server hot-reload check (200 = served)
```

Environment notes: the user runs their own `vite` dev server on **:5173** (hot reload).
The Claude preview harness cannot spawn a server here (sandbox EPERM) — verify via
eslint/build/curl. Every edit hot-reloads live: define functions BEFORE call sites across
multi-edit sequences.

---

## Why (diagnosis of the current module)

The current Game Review (`src/components/RPGGame/`, launched from the auto-appended
`isGame` lesson at the end of every non-tutorial unit — synthesized in
`src/data/skillTreeData.js` `applyCEFRScaffolding`) has two linked problems:

**It's expensive and slow.** Every run makes ~4 sequential `gpt-5-nano` calls before play
(scenario JSON including a 216–468-int tile array and 8+ quiz questions that are never
used; a full-quest rewrite with a 2048 thinking budget; gather visuals; support copy) plus
15–25 more during play (dynamic choices per node, a reply per speech turn, bridge +
greeting per step transition, object examines). Nothing is cached; replays regenerate the
universe. Even the fallback path makes 3 LLM calls.

**It plays like a chore.** The loop is a checklist of conversations you cannot fail:
walk to the one unlocked NPC, read generated prose, pick one of three interchangeable
options (all lead to the same node), speech advances no matter what is said. No score, no
stakes, no recap. The spend is on the layer players barely experience (map backdrop,
filler prose) while the only game-like graded mechanic (gather/objectSearch) appears in a
minority of runs. The review is also invisible to the companion/repair system — the game
never calls `captureCompanionMemory`, unlike the 8 other modes that do.

**Design philosophy (agreed):** invert the stack. Humans author mechanics and pacing
once; worlds are bundled code + procedural dressing; the LLM (if used at all) fills
thin, cacheable content slots. Score IS the assessment. Speech is always a bonus,
never a gate. **Level lives in the slots, not the episode** — every episode is playable
at every CEFR level.

---

## Curriculum facts this design is built on

- **90 units** across Pre-A1 (9), A1 (17), A2 (18), B1 (15), B2 (12), C1 (10), C2 (8),
  tutorial (1) → **89 Game Review lessons** (`xpReward: 30`, appended at
  `skillTreeData.js` ~13162).
- **425 unique lesson topics**, which keyword-bucket into **six content shapes**
  (overlapping counts): grammar forms ~92, concrete vocabulary ~87, academic/discourse
  ~89, numbers/time/dates ~62, social phrases ~36, place-named transactional ~23.
- The two biggest buckets (grammar, discourse — ~180 topics) are **placeless**: no map
  theme matches them, so maps are a *variety* budget, not a *coverage* budget.
- 10 target/support languages (es, en, pt, it, fr, de, ja, hi, ar, zh); UI copy follows
  the `QUEST_LOG_COPY`-style 10-language object pattern; `ar` is RTL.

---

## Architecture: three layers

| Layer | What | When it runs | Cost |
|---|---|---|---|
| **1. Authored, bundled** | 12 episode manifests (map recipe, stations, cast, beats), 6 interaction primitives with CEFR scaling, reaction copy, UI copy ×10 langs | build time (shipped as code/data) | zero |
| **2. Procedural, local** | seeded dressing (palette/decor shuffle via `worldGen.js`), NPC sprite/name assignment, beat→primitive dealing, item placement | at "Start game", <50ms, no network | zero |
| **3. Contextualization** | unit terms → slots. **Tier 1**: pure template+term substitution from `unitTopics`/focusPoints (structured data, no LLM). **Tier 2**: ONE small constrained call for flavored lines at higher levels, cached forever by `(unit × episode × lang × level)` | Tier 1 always; Tier 2 first-ever play of a combo (or pre-warmed) | 0–1 small calls |

Runtime cost before → after: **~4 start calls + 15–25 in-play calls → 0 (typical) / 1
(first play of a combo, usually pre-warmed)**. Start latency: 20–60s loading screen →
instant.

During play there are **zero required LLM calls**: NPC reactions to right/wrong/partial
are authored per primitive; say-aloud grades locally against the known target phrase.

---

## The six interaction primitives

Primitives are authored ONCE, shared by all episodes, and scale by the CEFR profile
table below. Each defines: prompt rendering, input mode, validation, scoring, and
right/wrong/partial reaction hooks (filled by episode copy + slot content).

### P1 · fetch-serve
NPC requests something; player finds it in the world (gather sprite or station shelf)
and submits it. Direct descendant of the existing gather/objectSearch mechanic —
reuse the sprite pipeline, wrong-item template, and inventory UI.
- **Validation**: submitted item vs slot target. Wrong item → authored in-character
  correction + heart loss; item returns to world.
- **Scaling**: request complexity (bare noun → article/color/quantity constraints →
  comparative/exclusion clauses → idiomatic/negotiated requests).

### P2 · listen-and-pick
NPC line plays as TTS **first**; the player acts on what they heard (pick an item,
mark an order pad, choose a door). Text is visible at Pre-A1/A1, delayed-reveal at
A2–B1, hidden until after the answer at B2+.
- **Validation**: selection vs slot answer.
- **Scaling**: utterance length, speech items per turn (1 → 3), text visibility.

### P3 · choice-check
One correct option + 2 distractors (unlike today's three-equivalent-choices). NPC
reacts differently to wrong picks: gentle in-character correction, then re-ask once.
- **Validation**: option index. Distractors come from the same unit's term pool.
- **Scaling**: distractor proximity (unrelated → same category → same word wrong form
  → register/nuance traps).

### P4 · form-fill
A small diegetic form (claim ticket, order pad, telegram, headline) with 2–4 fields;
inputs are pickers at low levels, free text at high levels.
- **Validation**: per-field vs slot data (normalized).
- **Scaling**: field count, picker → typed, formulaic → composed answers.

### P5 · spot-the-mismatch
Two statements (or a statement vs the visible scene) — the player identifies the
inconsistency. Core of The Detective; reusable anywhere ("the sign says X but he
said Y").
- **Validation**: which statement/element chosen.
- **Scaling**: mismatch type (visible attribute → tense/time-marker contradiction →
  implication/irony).

### P6 · say-aloud (bonus, never gated)
After any beat, an optional mic prompt: say the target phrase for **×2 beat points**.
Uses `useSpeechPractice` (`src/hooks/useSpeechPractice.js`) exactly as today.
- **Validation**: LOCAL — normalized transcript similarity vs the known target
  (see Speech section). No LLM for Latin-script langs; optional tiny grading call
  only for open-ended C1+ prompts.
- **Scaling**: read-the-phrase → recall-the-phrase (target hidden) → open response
  against a micro-goal.

---

## CEFR scaling profile

One table drives all primitives (plugs into the same place `CEFR_DIALOGUE_GUIDANCE`
does today). Episodes never branch on level; primitives read this profile.

| Level | Utterance | Constraints/beat | Distractors | Text during TTS | Say-aloud mode | Tense inventory |
|---|---|---|---|---|---|---|
| Pre-A1 | 2–4 words | 1 | unrelated | always visible | read | present, formulas |
| A1 | short sentence | 1 | same category | visible | read | present, near future |
| A2 | 1–2 sentences | 2 | same category | delayed reveal | read/recall | + preterite, imperfect |
| B1 | 2 sentences | 2 | close (form traps) | delayed reveal | recall | + perfect, future, conditional |
| B2 | 2–3 sentences, natural pace | 3 | close | hidden until answer | recall | + subjunctive, passive |
| C1 | natural, idiomatic | 3 | nuance/register traps | hidden | open (micro-goal) | full |
| C2 | rapid, colloquial, rhetorical | 3–4 | implication/irony traps | hidden | open | full + stylistic |

---

## Episode skeleton (shared run structure)

Every episode runs the same shell, so the engine is one system:

1. **Arrival** — map fades in, objective banner (episode copy, 10 langs), cast intro
   beat (P2 or plain line; doubles as the greeting warm-up).
2. **6 scored beats** — dealt from the episode's beat list, slots filled from the
   unit's term pool. Beat = primitive + slot content + authored reactions. Fixed
   count (no random 2–6 steps, no revisit filler).
3. **Finale beat** — the episode's payoff (accuse the suspect, seat the last guest,
   read the bulletin on air) — always a check, weighted ×2.
4. **Recap screen** — replaces the "Completed!" overlay (see Scoring & recap).

**Hearts & flow:** 3 hearts. First-try correct = 100 pts, second try = 50, third = 25
(the beat then resolves with support shown). A wrong attempt costs a heart; at 0 hearts
remaining beats enter **assisted mode** (support language visible, half points).
Completion is always reachable — the score, not survival, carries the stakes.

**Pacing target:** 3–5 minutes per run. Patience meters (soft per-beat timers that
shave points, never fail) only in episodes flagged `rush: true`, and only A2+.

---

## The 12 episodes

Format per episode: map recipe (all buildable from `worldGen.js` layout generators +
`buildDynamicTileLibrary` palettes + existing sprites — an episode map is **config,
not art**), cast, beat structure, primitive mix, bucket affinities, slot schema, and a
level walk showing the same beat at three levels.

Bucket keys: `vocab`, `numbers-time`, `social`, `grammar-forms`, `place`, `discourse`.

---

### E1 · Market Rush 🧺
- **Map**: outdoor plaza (urban layout), 4 stall stations (produce, textiles, household,
  misc) + strolling customers. Palette/dressing shuffled per run.
- **Cast**: 2 stallkeepers, 2–3 customers (roles, not fixed names — names dealt from the
  existing NPC name pools).
- **Beats**: customer/stallkeeper requests → fetch from stalls (P1 ×3), price/quantity
  exchange (P3 or P4), overheard order (P2), finale: assemble a multi-item order right
  (P1 weighted ×2). `rush: true` at A2+.
- **Affinities**: vocab ●●●, numbers-time ●●, social ●, grammar-forms ● (requests/
  comparatives), place ●●.
- **Slots**: `items[]` (target/support/sprite — reuse the gather visual-spec format so
  `drawDynamicGatherVisual` renders authored items), `requestTemplates[]`, `prices[]`.
- **Level walk**: Pre-A1 "Una manzana, por favor." → B1 "Quiero la más barata, pero que
  no sea la verde." → C2 vendor haggles in rapid colloquial speech with an idiom; catch
  whether "me está tomando el pelo" means walk away or counter-offer.

### E2 · Café Shift ☕
- **Map**: indoor café (indoor layout): counter, 4 tables, kitchen pass station.
- **Cast**: 1 co-worker (tutorial voice), 3 seated customers.
- **Beats**: spoken orders → mark the order pad (P2+P4 ×3), serve the right table (P1),
  a complaint handled with the right register (P3), finale: the regular's "usual" —
  recall order from earlier in the run (P2 memory variant, ×2).
- **Affinities**: vocab ●● (food/drink), social ●●● (likes, politeness, tú/usted),
  numbers-time ●, discourse ● (complaint pragmatics at B2+).
- **Slots**: `menuItems[]`, `preferences[]` (gustar frames), `registerPairs[]`.
- **Level walk**: Pre-A1 point at "un café" → B1 order with modification + polite
  conditional → C1 detect that the complaint is ironic and pick the rebuttal that
  addresses the implication.

### E3 · Moving Day 📦
- **Map**: living room + one adjacent room (livingRoom tile library exists), furniture
  stations, moving truck at the entrance.
- **Cast**: 2 movers, 1 homeowner.
- **Beats**: movers ask where things go → place furniture per instruction (P2 ×2),
  "¿este o ese?" this/that checks (P3), a mislabeled box (P5), then roles flip: player
  instructs a mover (P3 choosing the correct imperative/preposition), finale: the
  fragile item — multi-constraint placement (P2 ×2).
- **Affinities**: vocab ●●● (house/rooms/furniture), grammar-forms ●● (prepositions,
  imperatives, this/that), place ●.
- **Slots**: `furniture[]`, `rooms[]`, `positions[]` (prepositional frames).
- **Level walk**: Pre-A1 "La mesa… aquí." → A2 "Ponla al lado de la ventana, no debajo."
  → B2 mediate two movers arguing in conditional/subjunctive about where it *should have*
  gone.

### E4 · Front Desk 🛎️
- **Map**: hotel/office lobby (indoor layout): desk, back room with shelf grid
  (objectSearch reuse), waiting bench.
- **Cast**: 3 guests, 1 manager.
- **Beats**: guest describes a lost item → find the match in the back room (P1
  objectSearch variant ×2), fill the claim form — name spelling, date, time (P4),
  a description that matches two items (P5 disambiguation), finale: reunite the last
  guest, confirming details aloud (P3 + P6 spotlight, ×2).
- **Affinities**: vocab ●● (adjectives, personal items), grammar-forms ●● (ser/estar,
  descriptions, reported speech at B2+), numbers-time ●● (dates/times), social ●
  (formal register).
- **Slots**: `lostItems[]` (attribute matrices: color/size/material), `guestDetails[]`,
  `formFields[]`.
- **Level walk**: Pre-A1 "Es azul y pequeño." → B1 "Lo dejé en el taxi esta mañana,
  creo." → C1 the guest's sentimental, hedged description ("dijo que lo había dejado…")
  must be converted into form fields.

### E5 · Ticket Window 🚉
- **Map**: station hall (airport tile library re-dressed): departure board station,
  ticket window, 2 platforms gates.
- **Cast**: 3 travelers, 1 announcer (voice only — TTS from the board).
- **Beats**: read the board and answer a traveler (P3 ×2), sell the correct ticket under
  constraints — "two seats, arriving before 5" (P4), a garbled announcement changes a
  platform (P2), point a lost traveler the right way (P3 directions), finale: the tight
  connection — combine board + announcement info (P5, ×2).
- **Affinities**: numbers-time ●●●, place ●● (transport, directions), vocab ●,
  grammar-forms ● (future, conditional courtesy).
- **Slots**: `destinations[]`, `times[]`, `prices[]`, `platformEvents[]`.
- **Level walk**: Pre-A1 "Un boleto, por favor." + numbers 0–20 → A2 "¿A qué hora sale
  el próximo tren a…?" → C2 a rapid, apologetic service-change announcement full of
  hedges; extract what actually changed.

### E6 · The Clinic 🩺
- **Map**: small clinic (indoor layout): reception, exam room, pharmacy shelf station.
- **Cast**: 3 patients, 1 doctor (the player assists).
- **Beats**: patient describes symptoms → identify the body part / complaint (P2 ×2),
  match the remedy from the shelf (P1), give advice choosing the right form —
  imperative → deber → "te recomiendo que…" subjunctive by level (P3 ×2), finale:
  relay the doctor's instructions back to the patient correctly (P3, ×2).
- **Affinities**: vocab ●● (body/health/feelings), grammar-forms ●●● (imperatives,
  advice modality, subjunctive), social ●.
- **Slots**: `symptoms[]`, `bodyParts[]`, `remedies[]`, `adviceFrames[]`.
- **Level walk**: A1 "Me duele la cabeza." → B1 "Debería descansar y tomar líquidos."
  → B2 "Le recomiendo que no haga esfuerzo hasta que se le pase."

### E7 · Party Prep 🎉
- **Map**: park pavilion (park tile library): tables, music station, gift table,
  kitchen corner.
- **Cast**: host + 3 guests (guest cards show relationships — family vocab).
- **Beats**: match food/music/gifts to guest preference cards (P3 gustar frames ×2),
  write the invitation — date/time/place (P4), seat two guests who "no se llevan bien"
  (P5 social inference), a guest RSVP voicemail (P2), finale: the toast — assemble it,
  then say it aloud (P3 + P6 spotlight, ×2).
- **Affinities**: social ●●● (likes, invitations, family), numbers-time ●● (dates),
  vocab ●●, discourse ● (the toast at C1 becomes mini-rhetoric).
- **Slots**: `guests[]` (relations + preference matrices), `partyItems[]`,
  `inviteFields[]`, `toastFrames[]`.
- **Level walk**: Pre-A1 "A Ana le gusta la música." → B1 diplomatic seating with
  explanations → C1 a toast with one metaphor, delivered aloud for the bonus.

### E8 · The Detective 🔍
- **Map**: ANY dressing (placeless by design — rotate plaza/café/museum recipes);
  3 witness spots + 1 evidence station.
- **Cast**: 3 witnesses, 1 constable (exposition), the culprit among the witnesses.
- **Beats**: something's missing — interview witnesses (P2 testimony ×3, each logged
  into an on-screen notebook), check evidence vs a statement (P5), a follow-up question
  choosing the right question word / tense (P3), finale: **accuse** — pick the testimony
  that contradicts the notebook (P5, ×2). Wrong accusation = heart + a hint, one retry.
- **Affinities**: grammar-forms ●●● (THE past-tense machine: preterite/imperfect/past
  continuous/past perfect/present perfect + time markers; question words), vocab ●,
  discourse ● (implication at C1+).
- **Slots**: `caseObject`, `testimonies[]` (time-anchored statement triples with one
  planted contradiction), `questionFrames[]`.
- **Level walk**: Pre-A1 — no past tense yet, the contradiction is a *description*
  mismatch ("the tall one with the red bag" doesn't match any suspect) → A2 preterite
  timeline mismatch → B2 "ya había salido cuando…" past-perfect contradiction → C2 the
  lie is an implication, not a stated fact.

### E9 · Fortune Teller 🔮
- **Map**: mystical tent + small queue outside (indoor recipe, night palette).
- **Cast**: the seer (main voice), 2 querents.
- **Beats**: a querent asks about tomorrow → complete the prediction (P3 future forms),
  "what would you do if…" hypotheticals (P3 ×2), read the cards — order a 3-card
  sequence to match a spoken fortune (P2+P4), the seer's deliberately ambiguous line
  (P5 interpretation at B2+), finale: the player's own fortune — respond aloud to an
  open prompt (P6 spotlight over a P3, ×2).
- **Affinities**: grammar-forms ●●● (future, conditional, ALL THREE si-clause types,
  past subjunctive at C1+), discourse ●● (ambiguity, hedging), social ●.
- **Slots**: `predictions[]`, `hypotheticals[]` (si-clause frames by type),
  `cardSequences[]`.
- **Level walk**: Pre-A1 lucky numbers + days/weather words ("El martes… sol.") →
  B1 "Si tuvieras un boleto, ¿adónde irías?" → C2 "Si no hubiera perdido aquel tren…"
  counterfactual chains.

### E10 · The Newsroom 📰
- **Map**: office (indoor layout): editor desk, wire station, recording booth.
- **Cast**: editor, field reporter (voice), fact-checker.
- **Beats**: turn a witness quote into a headline — choose the right passive/reported
  form (P3 ×2), fact-check a claim against the wire (P5), assemble the weather/traffic
  brief (P4), a correction call from the reporter (P2), finale: **record the bulletin**
  — read the assembled brief aloud in the booth (P6 spotlight as the scored finale, ×2;
  the one episode where speech is the payoff — still skippable for base points).
- **Affinities**: grammar-forms ●●● (passive, reported speech, uncertainty hedges),
  discourse ●● (fact vs opinion, headline register), vocab ● (media/news).
- **Slots**: `quotes[]` (active→passive pairs), `claims[]` (true/false vs wire),
  `briefFields[]`.
- **Level walk**: A1 picture-headline matching ("Perro encuentra queso") → B2
  "El puente fue cerrado por las autoridades." → C1 detect that a source's hedge
  ("se rumorea que…") makes the claim unpublishable.

### E11 · Tertulia 🗣️
- **Map**: salon/café back room (indoor, warm palette): round table, chalkboard motion.
- **Cast**: moderator + 3 debaters with distinct registers (formal academic, colloquial,
  ironic).
- **Beats**: the motion is read (P2), pick the strongest supporting argument (P3),
  identify the connector that links two turns (P3 discourse markers), spot the
  rhetorical device — metaphor/irony/hyperbole (P5 ×2), finale: **rebut aloud** — an
  open speech prompt against a stated position, graded against a micro-goal (P6 open
  mode over a P3 fallback, ×2).
- **Affinities**: discourse ●●● (THE academic/rhetoric machine), grammar-forms ●●
  (opinion subjunctive, connectors), social ● (register).
- **Slots**: `motions[]`, `arguments[]` (strong/weak/fallacious triples),
  `devices[]` (labeled rhetoric samples), `connectors[]`.
- **Level walk**: Pre-A1 opinion circle "¿Te gusta el café? — Sí, me gusta." → B2 pick
  the argument that actually addresses the motion → C2 spot the irony and choose the
  rebuttal that answers the implication, then deliver it aloud.

### E12 · Story Workshop 🎭
- **Map**: small theater (indoor recipe): stage, director's chair, prop shelf.
- **Cast**: director, 2 actors.
- **Beats**: order the scene cards to match the director's summary (P2+P4 sequencing),
  choose the right tense/mood for a beat — "she HAD already left" (P3 ×2), pick the prop
  the scene implies (P1 inference fetch), fix the line that breaks the story's register
  (P5), finale: **voice a line with the right emotion** (P6 spotlight, ×2).
- **Affinities**: grammar-forms ●●● (narration tenses, past subjunctive in
  storytelling), discourse ●● (tone, register, literary devices at C1/C2),
  vocab ●.
- **Slots**: `sceneCards[]`, `tenseChoices[]` (beat-anchored), `props[]`,
  `registerLines[]`.
- **Level walk**: A1 order 3 picture cards with single sentences → B1 preterite vs
  imperfect per beat → C2 identify why the ironic line deflates the scene and choose
  the tonally right replacement.

---

## Unit → episode resolution

1. **Bucket tagging (build time).** In `applyCEFRScaffolding` where the game lesson is
   synthesized (and already collects `unitTopics`), run the keyword bucketer over the
   unit's topics → store `content.game.bucket` (dominant) + `content.game.buckets`
   (weighted) + `content.game.episodeCandidates` (from the affinity table). Add a
   manual `episodeOverride` field for hand-tuning specific units.
2. **Resolver (runtime, local).** Pick from `episodeCandidates` by: affinity weight →
   least-recently-played (per-language history `progress.gameEpisodeHistory[lang]`,
   last ~6 entries) → seeded tiebreak. Level never filters; it only sets the CEFR
   profile for the slots.
3. **Weak-spot seeding.** 1–2 of the 6 beats draw their slot content from the learner's
   companion-memory notes for that language when compatible items exist (a fumbled food
   word becomes a Market request; a fumbled tense becomes a Detective testimony). Local
   data, zero cost, plugs the game into the repair loop from the content side.
4. **Fallback.** A unit whose bucket matches nothing (shouldn't happen — six buckets
   cover the curriculum) routes to the highest-affinity episode anyway with tier-1
   generic frames.

---

## Contextualization pipeline

**Tier 1 — substitution (always, zero LLM).** Each episode's slot schema is filled from
the unit's structured content (`unitTopics`, focusPoints, per-language learning path via
`loadLearningPath`). Templates per language per primitive (house 10-language copy
pattern). Pre-A1–A1 runs are fully tier-1.

**Tier 2 — one flavored-lines call (A2+ polish, cached forever).**
- One `callResponses` (`src/utils/llm.js`) call with a fixed JSON schema:
  `{ beats: { [beatId]: { npcLine, right, wrong, hint } }, finaleLine }` — ≤ ~20 short
  strings, CEFR profile + unit terms in the prompt. No maps, no quests, no structure.
- Validate shape + language guard; ANY failure → tier-1 templates (which are always
  complete). The failure mode is "less flavorful," never "broken" or "generic mystery."
- **Cache**: Firestore doc keyed `(targetLang, cefrLevel, unitId, episodeId, schemaVersion)`
  — generated once EVER, shared across all users. Local mirror in localStorage.
- **Warming**: when a learner completes the unit's penultimate lesson, fire the tier-2
  call in the background for the resolver's top candidate. First play is then instant.

---

## Speech & listening

- **TTS**: reuse the existing NPC speech path (`speakNPCText` / tts player refs) for all
  P2 prompts and reactions.
- **Say-aloud matching (local)**: normalize (lowercase, strip diacritics for Latin
  scripts, strip punctuation) → token-level Levenshtein similarity vs target; pass
  thresholds by level (Pre-A1 0.6 → B2 0.85). For ja/zh/hi/ar ship a containment-based
  matcher first (target tokens present in transcript) and iterate — flagged as an open
  question below.
- **Open speech (C1/C2 P6 only)**: optional single small grading call (pass/fail vs
  micro-goal, same pattern as Conversations turn grading). Only fires if the player
  chose the bonus.
- Keep `GAME_SPEECH_VAD_MS` / stop-delay tuning from the current module.

> **Amendment (2026-07-11) — the story IS the product.** Playtesting showed the
> local-only say-aloud + canned reactions made runs feel binary and chore-like,
> losing the original game's spirit. Direction: keep the authored engine, bring
> back the free-form soul. Shipped:
> - The prepared-story call (`episodes/legacyScenario.js`, schema
>   `v4-story-personas`, cached per unit × episode × lang × level) returns a
>   story `title`, bilingual `intro`/`epilogue`, one persona per NPC, and a
>   support-language `sceneLine` storybook caption per beat. Speech beats are
>   OPEN role-play invitations (`speechGoal` + `speechExample`) — never
>   repeat-after-me.
> - Speech turns are free-form again: at runtime ONE call
>   (`buildAuthoredSpeechTurnPrompt` in `index.jsx`) grades full/partial/miss
>   (100/50/25 pts, misses recorded in `authoredMisses`) AND replies in the
>   NPC's persona to whatever the player actually said — jokes, refusals, and
>   opinions included. Speech never blocks progression; the local matcher vs
>   `speechExample` is only the offline/error fallback.
> - Revised per-run LLM budget: 1 cached story call + one small call per speech
>   beat (2–3 per run). Choice beats remain zero-call, with persona-voiced
>   authored reactions. Do not optimize the speech-turn calls away — they are
>   the point of the speech exercise.

---

## Scoring, XP, recap, capture

- **Score**: 6 beats + finale(×2) → max 800. Speech bonuses can add up to +800 more
  (×2 per beat) — tracked separately as "flair."
- **Stars**: ≥90% base score 3★, ≥70% 2★, else 1★ (completion always yields 1★).
- **XP**: `xpReward` stays 30 → 1★ = 15, 2★ = 22, 3★ = 30, plus +5 if flair ≥ 50%.
  (Numbers tunable; keeps game XP ≤ current flat value at the top so no inflation.)
- **Recap screen** (replaces the emoji-only overlay): score + stars, terms exercised
  with ✓/✗, best spoken line (if any), "worth another look" list (max 3), Play again /
  Continue. Play-again re-deals beats with fresh slots (seeded variety) — replay is free.
- **Companion capture**: per missed beat (max 3/run), call `captureCompanionMemory`
  (`src/utils/companionMemory.js`) with `sourceMode: "game"`, `concept` = the term/form,
  `userAnswer` / `expectedAnswer` from the beat, `cefrLevel` = the unit's level (this
  also satisfies the standing TODO to thread real CEFR levels into capture sites),
  `sourceContext` = `{ episodeId, unitId, beatId, primitive }`.
- **Completion**: unchanged contract — `onGameComplete` → `triggerLessonCompletion
  ("game_complete")` in `App.jsx`; the recap screen fires it from its Continue button.

---

## Module layout & engine extraction

New code lives beside the existing game and reuses its renderer:

```
src/components/RPGGame/
  engine/            # extracted from index.jsx (Phase 0)
    renderer.js      # three.js scene/camera/tiles/sprites setup
    movement.js      # input, walking, collision, camera follow
    npcSprites.js    # sheet loading, variants, indicators
    tts.js           # speakNPCText + player refs
    audio.js         # music + sfx (existing sounds reused)
  episodes/
    skeleton.jsx     # the shared run shell (arrival → beats → finale → recap)
    primitives/      # fetchServe.jsx, listenPick.jsx, choiceCheck.jsx,
                     # formFill.jsx, spotMismatch.jsx, sayAloud.jsx
    manifests/       # marketRush.js, cafeShift.js, … one per episode
    copy.js          # 10-language episode UI copy (QUEST_LOG_COPY pattern)
  content/
    buckets.js       # keyword bucketer (also used at build time)
    resolver.js      # episode selection + history
    slots.js         # tier-1 filler + slot schema types
    flavor.js        # tier-2 call, validation, Firestore cache, warming
    speechMatch.js   # local transcript matcher
  index.jsx          # legacy runner (shrinks each phase, deleted in Phase 5)
```

**Phase 0 rule**: extraction is move-only (no behavior change) so the legacy game keeps
working during the build. The 8,473-line `index.jsx` shrinks as each system moves.

---

## What gets deleted at the end (the payoff)

- `scenarios.js`: `buildPrompt` (both variants), LLM `mapData` generation,
  `adaptQuestForReviewContext`, `enrichQuestGatherVisuals` (runtime path — the visual
  spec FORMAT stays; authored items use it as data), `enrichQuestGatherSupportCopy`,
  the template greeting/choice pools in `normalizeQuest`, the unused 8-question
  generation requirement.
- `index.jsx`: `generateDynamicChoices`, per-turn speech-reply generation, bridge +
  greeting pre-generation in `completeNPCChapter`, object-examine LLM calls (stations
  get authored examine copy in manifests).
- SkillTree modal: the generation loading state + skip button (start becomes instant);
  `App.jsx` `preGeneratedGameScenario` plumbing.
- Keep: renderer, worldGen, pixelArt, gather sprite pipeline, `useSpeechPractice`,
  `gameReviewContext.js` (still feeds bucket tagging + tier-2 prompts).

---

## Build order (full scope, sequenced for safety)

All 12 episodes are in scope (this is not the eased-in variant); phases exist only
because engineering needs an order. Legacy path stays as a flagged fallback until
Phase 5, then dies.

- [ ] **Phase 0 — extraction.** Pull renderer/movement/sprites/TTS/audio out of
      `index.jsx` into `engine/` (move-only). Legacy game still green.
- [ ] **Phase 1 — skeleton + primitives.** Episode shell, 6 primitives, CEFR profile,
      scoring/hearts/recap, local speech matcher. Dev-only harness episode behind a
      flag (`?episode=` param) for testing primitives.
- [ ] **Phase 2 — content plumbing.** Bucket tagger in `applyCEFRScaffolding`,
      resolver + history, tier-1 slot filler, weak-spot seeding.
- [ ] **Phase 3 — episodes batch A.** Market Rush, Café Shift, The Detective,
      Fortune Teller (widest bucket coverage first: vocab, social/listening,
      past tenses, conditionals).
- [ ] **Phase 4 — episodes batch B.** Moving Day, Front Desk, Ticket Window,
      The Clinic (cheapest maps — livingRoom/airport libs exist; form-fill matures).
- [ ] **Phase 5 — episodes batch C + cutover.** Party Prep, The Newsroom, Tertulia,
      Story Workshop. Resolver handles all 89 units → remove the legacy generation
      path and its in-play LLM calls; delete dead code listed above.
- [ ] **Phase 6 — tier-2 flavor + cache + warming.** (Can land in parallel with 4–5;
      everything before it is fully playable tier-1.)
- [ ] **Phase 7 — capture + XP + recap polish.** `captureCompanionMemory` wiring,
      star XP, weak-spot recap, Play-again re-deal.
- [ ] **Phase 8 — i18n & a11y pass.** 10-language copy audit, RTL (ar) layout check,
      CJK line-length check, reduced-motion.

---

## Expansion: beyond the 12

**Episode manifest = the authoring kit.** A new world is one data file, no engine work:

```js
{
  id, emoji,
  copy: { name, objective, … } × 10 langs,
  map: { layout: "indoor|urban|nature|plaza", palette, stations[], decorKinds[] },
  cast: [{ role, spriteHints, personality }],
  beats: [{ id, primitive, slotRefs, reactions, weight }],
  affinities: { vocab: 0–3, "numbers-time": 0–3, … },
  slotSchema: { … },
  flags: { rush?, night? }
}
```

**Authoring workflow for new episodes**: draft the manifest with an LLM **at authoring
time** (a skill/script, not runtime), human-review the beats and jokes, playtest via the
`?episode=` harness, ship as data. The LLM moves from per-run generator (weakest link)
to authoring assistant (its strength).

**Candidate episodes 13–24** (each one line: loop → buckets):

| # | Episode | Loop | Buckets |
|---|---|---|---|
| 13 | Post Office 📮 | address/parcel forms, weigh & price | numbers-time, vocab |
| 14 | Cooking Class 🍳 | follow spoken recipe steps in order | grammar (imperatives, sequencing), vocab |
| 15 | Night Market 🏮 | same fetch loop, **regional-variant vendors** — pick the right word per vendor's dialect | discourse (regional variation units!), vocab |
| 16 | Museum Night 🏛️ | match exhibits to spoken descriptions; past narration of artifacts | discourse, grammar (past), vocab |
| 17 | Radio Quiz 📻 | rapid listening comprehension against the clock | discourse (rapid idiomatic speech), numbers-time |
| 18 | Town Hall 🏛️ | constituents' complaints → the right formal reply | discourse, grammar (passive, formal register) |
| 19 | Garden Center 🌱 | plant care advice — "si llueve…" condition chains | grammar (conditionals), vocab (nature) |
| 20 | Sports Day 🏅 | coach commands, live commentary | vocab (body/sports), grammar (present continuous) |
| 21 | Wedding Planner 💐 | seating, invitations, wishes | social, grammar (subjunctive of wishes) |
| 22 | Tech Support 🎧 | troubleshoot reported problems step by step | vocab (technology), grammar (reported speech) |
| 23 | Border Crossing 🛂 | documents, purpose-of-visit interview | social (formal), numbers-time, place |
| 24 | Rehearsal Room 🎬 | direct-speech ↔ stage direction conversions | grammar, discourse |

**Variant packs** (cheap perceived-content multipliers, all layer-2/local):
- Seasonal dressing (palette + decor swaps; e.g., Night Market in winter).
- **Mutators** at 3★ mastery: `rush` (tighter patience), `mystery shopper` (one NPC
  secretly re-tests a missed weak spot), `double-or-nothing` (finale speech for ×4).
- Tutorial: keep the existing greeting-plaza tutorial untouched during the build; after
  cutover, re-express it as `E0 · Welcome Plaza` on the skeleton (greetings/name/polite
  formulas only).

---

## Verification

- Per-primitive unit tests (validation + scoring + scaling table lookups).
- `?episode=<id>&level=<cefr>&unit=<unitId>` dev harness → play any combo directly.
- Playthrough checklist per episode × {Pre-A1, B1, C2} × {es, ja, ar} (script coverage:
  Latin, CJK, RTL).
- Cache behavior: first-play generates once, second device hits Firestore doc, schema
  bump invalidates.
- Build gates per phase: `npx eslint` on touched files, `npm run build`, hot-reload
  curl check on :5173.
- Cost check after cutover: the only remaining game-related LLM traffic should be
  tier-2 cache misses + optional C1+ open-speech grades.

## Open questions

1. **Non-Latin speech matching** — containment matcher is the v1 for ja/zh/hi/ar;
   is kana/pinyin normalization worth it, or route those langs' say-aloud through the
   existing phonics comparison logic if reusable?
2. **Patience meters at Pre-A1/A1** — plan says never; confirm after playtesting
   (some learners may want the energy even at A1).
3. **Music** — one shared track today; per-episode ambience is a cheap polish item,
   worth it? (Assets would need sourcing.)
4. **`gameEpisodeHistory` storage** — user doc vs localStorage-only. Plan assumes user
   doc (survives devices) with localStorage mirror.
5. **Tier-2 cache location** — a top-level `gameFlavor` collection vs nesting under an
   existing generated-content collection; pick whichever matches current Firestore
   rules with least friction.
