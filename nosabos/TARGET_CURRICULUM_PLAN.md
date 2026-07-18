# Target-Curriculum Authoring Plan

Handoff document for completing the per-practice-language curriculum. Any
model/session can pick this up with zero prior context: everything needed is
in this repo.

## Goal

The skill tree ([src/data/skillTreeData.js](src/data/skillTreeData.js)) is
authored for **Spanish practice** and cloned for all 14 practice languages.
Non-Spanish learners used to get improvised lessons (the AI translated Spanish
curriculum live, badly). The fix: author real per-language curriculum data that
the app's adapter reads at runtime. **The code is done; what remains is data.**

Every practice language gets, per agenda objective, an authored `concept`
(the equivalent teaching point in that language) plus 1–3 short `examples`
(learner-sayable phrases). This data drives the Tutor's lesson sequence, the
lesson-modal objectives, quiz blueprints, phrase matching, and speech-recognition
keywords — it is **not** display-only.

## Architecture (already built — do not change)

- Data lives in `src/data/skillTree/targetCurriculum/<lang>.js`, keyed
  `lessonId → agendaItemId → { concept, examples }`, registered in
  `targetCurriculum/index.js`, merged into `LEARNING_PATHS[lang]` by
  `applyAuthoredTargetCurriculum` ([src/utils/lessonCurriculum.js](src/utils/lessonCurriculum.js)).
- `getLessonAgenda(lesson, {unit, targetLang})` emits authored items per
  objective (`source: "target-language-authored"`); unauthored items fall back
  to a generic per-mode adapter, so **partial coverage is always safe to ship**.
- Review lessons (skill-builder / integrated-practice / game) inherit authored
  data from source lessons automatically. Final quizzes draw from the quiz
  blueprint. **Only source lessons need authoring** — the export command below
  already emits exactly the right set.
- Pipeline: [scripts/generateTargetCurriculum.mjs](scripts/generateTargetCurriculum.mjs)
  (`export` / `merge` / `validate`). The merge validates every lesson/item id
  against the live tree (auto-repairing ids truncated to ≥52 chars) and
  preserves existing entries unless `--overwrite` is passed.

## Current status (2026-07-18)

| Language | Pre-A1 (144) | A1 (140) | A2 (180) | B1 (150) | B2 (120) | C1 (101) | C2 (84) |
|---|---|---|---|---|---|---|---|
| en, pt, fr, de, it, ja, ru, nl, el, pl, ga | ✅ 100% | ✅ 100% | — | — | — | — | — |
| nah, yua | *excluded* | *excluded* | — | — | — | — | — |

- ~3,124 items authored; **6,985 remain** (635/language × 11 languages).
- Check live coverage anytime: `node scripts/generateTargetCurriculum.mjs validate --lang <code>`
- **nah (Eastern Huasteca Nahuatl) and yua (Yucatec Maya) are deliberately
  excluded**: model-generated curriculum for these languages is not reliable
  enough, and wrong Indigenous-language data baked into the app is worse than
  the safe generic fallback they currently use. Their data should come from
  native speakers/community sources. Do not mass-generate them.

## The work loop (per level, per language)

Work **level by level** (A2 → B1 → B2 → C1 → C2), all 11 languages per level.
Language order (approximate user priority): en, pt, fr, de, it, ja, ru, nl, el, pl, ga.

1. **Export the level's manifest** (once per level):
   ```
   node scripts/generateTargetCurriculum.mjs export --levels A2 --out /tmp/a2-manifest.json
   ```
   Each manifest entry has `lessonId`, `unitTitle`, `lessonTitle`, and `items`
   with `id`, `kind`, and the source `concept`.

2. **Author one adaptation file per language** — JSON shaped:
   ```json
   { "lesson-a2-1-1": { "vocabulary-alto-a-bajo-a-moreno-a-rubio-a-1": {
       "concept": "alto/basso, moro/biondo", "examples": ["Luca è alto.", "Mia sorella è bionda."] } } }
   ```
   Use the **exact ids from the manifest** (the merge auto-repairs ids
   truncated past 52 chars, but don't rely on it for shorter ids).
   Cover **every item of every lesson in the manifest** for that language.

3. **Merge and validate**:
   ```
   node scripts/generateTargetCurriculum.mjs merge --lang it --from /tmp/adapted-it-a2.json
   node scripts/generateTargetCurriculum.mjs validate --lang it
   ```
   The merge refuses on unknown ids/empty concepts — fix and re-run (existing
   entries are kept, so re-merging is safe).

4. **After each level (or session), verify**: `npm test` (must stay 44/44 —
   one test asserts Italian A1 stays fully authored) and `npm run build`.
   New language codes must be registered in `targetCurriculum/index.js`
   (all 11 already are).

## Authoring rules (the quality bar)

Reference files: [targetCurriculum/it.js](src/data/skillTree/targetCurriculum/it.js)
is the gold standard; each language's existing entry-level data shows that
language's established conventions — **stay consistent with them**.

1. **Adapt, don't translate.** Produce what a native curriculum author would
   teach for that objective at that CEFR level. Examples of the expected depth,
   all already in the data: Spanish "y in compounds (cuarenta y dos)" became
   German "units first: zweiundvierzig", Dutch "tweeënveertig"; Spanish
   "written accents on question words" became English do-support, Polish
   czy-questions, Greek's «;» question mark, Irish síneadh fada, Russian
   intonation-only questions; Spanish number agreement became Russian/Polish
   "jeden rok / dwa lata / pięć lat", Japanese counters, Irish personal
   numbers (beirt, triúr).
2. **Concept register mirrors the source item:**
   - *vocabulary/grammar items*: target-language content in the same shape —
     word lists stay word lists, patterns stay patterns. English scaffolding
     words are fine ("compounds: trentacinque", "possessives with family:
     mia madre (no article)").
   - *reading/stories/realtime items* (English task prose): keep the English
     instruction, swap any referenced forms into the target language
     ("Practice ordering: 'per me..., il conto, per favore'"). If the source
     prose is fully language-neutral ("Read a schedule and discuss it"), copy
     it verbatim — only the examples localize it.
3. **Examples are load-bearing**: they feed ASR keywords, phrase matching, and
   the tutor's model phrases. 1–2 (max 3) short, natural, level-appropriate
   sentences a learner could actually say. Every example must be in the target
   language and demonstrate the concept.
4. **Level-appropriate**: A2 examples use A2 language; C1 items may use
   sophisticated structures. Don't leak advanced forms into low levels.
5. **No Spanish leakage**: no Spanish words in non-Spanish concepts/examples
   (`npm test` spot-checks this for Italian; apply the same bar everywhere).
6. Escape quotes properly in JSON; typographic quotes in examples are fine.

## Per-language conventions already established (keep consistent)

| Lang | Key choices made in entry levels |
|---|---|
| en | US English; "I like + -ing"; do-support for the question-orthography item |
| pt | **Brazilian** Portuguese (oi, tchau, você, suco, cardápio, R$-style contexts); o senhor/a senhora for formal |
| fr | tu/vous register; il y a; est-ce que + inversion; soixante-dix/quatre-vingts quirks |
| de | du/Sie; gern-pattern for likes; separable verbs (ich stehe auf); halb drei = 2:30; verb-second |
| it | tu/Lei; mi piace/piacciono; possessives without article for family (mia madre) |
| ja | Polite です/ます baseline with casual noted; kana-forward with common kanji; counters; これ/それ/あれ 3-way |
| ru | ты/вы; у меня есть for have; нравится/нравятся mirrors gustar; number-case agreement (год/года/лет) |
| nl | je/u; er is/er zijn; graag-pattern; eenentwintig units-first; half drie = 2:30 |
| el | εσύ/εσείς; μου αρέσει/αρέσουν; possessives after the noun (η μαμά μου); εκατό/εκατόν; «;» |
| pl | ty/pan-pani; poproszę for ordering; wpół do; ordinal clock times (jest pierwsza); genitive dates |
| ga | no T-V (tú/sibh plural); is maith liom / ba mhaith liom; tá…agam for have; lenition after mo/feminine; answer yes/no with the verb (tá/níl) |

## Remaining content by level (source concepts are in the manifests)

- **A2 (180/lang)**: descriptions (ser/estar-type contrasts), shopping, market
  quantities, transport, directions + imperatives, plans (ir a + inf), hobbies
  (soler/frequency), sports (jugar a vs hacer), **regular + irregular preterite**,
  storytelling (imperfect vs preterite), and more — map each tense/contrast to
  the language's own system (e.g., German Perfekt for A2 past, French passé
  composé, Japanese 〜ました, Polish aspect pairs, Irish past tense + bhí).
- **B1 (150)**, **B2 (120)**, **C1 (101)**, **C2 (84)**: progressively advanced
  grammar (subjunctive-equivalents, conditionals, passive, reported speech,
  discourse/register). Where a Spanish category has no direct equivalent
  (e.g., subjunctive in Japanese), teach the language's own means for the same
  *function* (conjecture, wishes, politeness) — never fake a parallel form.

## Do not

- Do not generate nah/yua data (see above).
- Do not invent new lesson/item ids or edit `skillTreeData.js` authored content.
- Do not use `--overwrite` unless deliberately replacing reviewed data
  (hand-edits by humans must survive merges).
- Do not change the adapter/scripts logic as part of data work.
- Do not ship a language×level partially — finish the level for that language
  before moving on (partial files are safe but leave mixed generic/authored
  lessons mid-level).

## Definition of done

`validate` shows 100% for all seven levels for the 11 languages above;
`npm test` 44/44; `npm run build` passes; a native-speaker review pass is
recommended (data files are hand-editable; merges preserve edits).
