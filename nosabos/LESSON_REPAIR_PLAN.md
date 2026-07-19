# Lesson Repair Plan

## Purpose

Repair the shared curriculum pipeline so Tutor and Skill Tree lessons are driven
by concrete, localizable learning objectives instead of generic placeholders or
activity-format labels.

The repaired system must guarantee that:

1. Every Tutor-path lesson has a clearly defined agenda.
2. Every Tutor agenda can be displayed in every supported app/support language.
3. Every Skill Tree lesson has concrete objectives, preserves its authored
   modes, and produces lesson-specific activities.
4. Skill Builders, Integrated Practice lessons, quizzes, and game reviews know
   exactly what the preceding lessons in their unit taught.

This is a shared curriculum repair. The Tutor preview exposed the issue, but the
source problem lives in the lesson-data normalization used by both Tutor and the
Skill Tree.

## Current Failure

### Generic placeholders become curriculum

`ensureModeContent()` creates missing grammar content with:

```js
focusPoints: ["form", "use"]
```

Those values are teaching categories, not objectives. In Tutor they become the
ordered agenda. In Skill Tree Grammar they become mandatory prompt constraints.

The same problem exists in supplemental lessons:

```js
focusPoints: ["pattern recycling", "micro-drills"]
```

These values describe an activity format, not the language to practice.

### A Pre-A1 strategy rewrites lessons at every level

`applyPreA1LessonModuleStrategy()` is currently applied across the entire CEFR
path. For non-protected lessons it replaces authored modes with a generated mix
containing Vocabulary, Grammar, and one or two extra modes.

For example, the authored C2 lesson **Linguistic Diversity** begins with useful
Reading and Realtime content. After normalization, its active modes become
Vocabulary, Grammar, and Stories. Its authored Reading and Realtime content
still exists in the object but is unreachable from the lesson UI.

### Tutor and Skill Tree interpret the damage differently

- Tutor flattens all `content.*.focusPoints` into an ordered, app-controlled
  agenda. A successful turn advances from `form` to `use` even if the real
  lesson objective was never demonstrated.
- Skill Tree sends each active mode its own content block. Grammar treats
  `form` and `use` as mandatory objectives, while injected Vocabulary and Story
  blocks receive only a broad unit topic.
- Supplemental review lessons do not receive a canonical snapshot of the
  concrete material taught earlier in the unit. The model can infer from a
  title, but it cannot reliably review what the learner actually studied.

## Product Invariants

These rules are non-negotiable after the repair.

### Curriculum invariants

- Every launchable core lesson has at least one concrete agenda item.
- An agenda item describes learner capability or target material, not a
  teaching method.
- `form`, `use`, `pattern recycling`, `micro-drills`, `general vocabulary and
  grammar`, and similar placeholders are invalid as standalone objectives.
- Authored lesson modes are preserved unless a migration explicitly changes
  them.
- Content for a mode must not be silently added merely to satisfy global mode
  coverage.
- Active modes must not omit authored content without an explicit reason.
- Runtime generation may choose how to teach an objective, but it must not
  invent the objective itself.

### Tutor invariants

- The lesson preview and the live Tutor use the same canonical agenda source.
- The agenda shown before starting is the agenda used for sequencing and
  progress.
- A successful turn advances a stable agenda-item ID, not a display string.
- Completion requires coverage of real agenda items plus the existing XP gate.
- Locked lessons expose the same localized preview without allowing start.

### Skill Tree invariants

- Each module receives the lesson objectives relevant to that mode.
- Grammar and Vocabulary prompts receive concrete target material.
- Reading, Stories, and Realtime receive concrete comprehension or
  communication goals.
- Skill Builders review prior unit material using a drill strategy.
- Integrated Practice combines previously taught objectives in a scenario.
- Quizzes assess a balanced blueprint of previously taught objectives.
- Game Review uses the same unit curriculum snapshot as the other review
  surfaces.

### Localization invariants

- Agenda display copy is localized for every language returned by the canonical
  support-language registry in `src/constants/languages.js`.
- The initial required support set is `en`, `es`, `pt`, `it`, `fr`, `de`, `ja`,
  `hi`, `ar`, and `zh`.
- Code must read the canonical registry rather than maintaining another
  hard-coded language allowlist.
- Support-language labels and target-language examples are separate fields.
  Translating an objective label must never alter the phrase the learner is
  expected to produce.
- English may remain the runtime fallback, but missing required translations
  must fail curriculum validation before release.

## Canonical Lesson Contract

Introduce an authored, versioned `agenda` on every lesson. `focusPoints` can be
supported temporarily as legacy input, but it must no longer be the canonical
cross-surface contract.

```js
{
  id: "lesson-c2-2-3",
  title: { en: "Linguistic Diversity", es: "Diversidad Lingüística" },
  modes: ["reading", "realtime"],
  agenda: {
    version: 1,
    items: [
      {
        id: "identify-regional-pronouns",
        kind: "comprehension",
        modes: ["reading"],
        label: {
          en: "Identify regional pronouns and vocabulary in authentic texts",
          es: "Identifica pronombres y vocabulario regional en textos auténticos"
        },
        targetConcept: "regional pronoun and vocabulary recognition",
        evidence: {
          type: "identify",
          criteria: "Correctly identifies the regional form and its likely region"
        }
      },
      {
        id: "choose-region-appropriate-pronouns",
        kind: "communication",
        modes: ["realtime"],
        label: {
          en: "Choose tú, vos, usted, vosotros, or ustedes for the situation",
          es: "Elige tú, vos, usted, vosotros o ustedes según la situación"
        },
        targetConcept: "region- and register-appropriate second-person forms",
        targetExamples: {
          es: ["vos tenés", "tú tienes", "usted tiene", "vosotros habláis"]
        },
        evidence: {
          type: "produce_or_choose",
          criteria: "Uses a form appropriate to the stated region and register"
        }
      },
      {
        id: "adapt-regional-register",
        kind: "communication",
        modes: ["realtime"],
        label: {
          en: "Adapt register for Rioplatense and Peninsular speakers",
          es: "Adapta el registro para hablantes rioplatenses y peninsulares"
        },
        targetConcept: "regional register adaptation",
        evidence: {
          type: "scenario_response",
          criteria: "Adapts pronouns, conjugation, and formality to the listener"
        }
      }
    ]
  }
}
```

### Required agenda-item fields

| Field | Purpose |
| --- | --- |
| `id` | Stable progress, analytics, and review reference. Must be unique within the lesson. |
| `kind` | Curriculum category such as `vocabulary`, `grammar`, `comprehension`, `communication`, or `mediation`. |
| `modes` | Modes capable of teaching or assessing the item. |
| `label` | Localized learner-facing description in support/app languages. |
| `targetConcept` | Language-neutral prompt context describing the actual concept. |
| `targetExamples` | Optional target-language forms; never treated as support-language UI copy. |
| `evidence` | What observable learner behavior counts as demonstrating the item. |

### Optional fields

- `prerequisiteItemIds`: earlier items needed for this objective.
- `difficulty`: item-specific CEFR or scaffolding hint.
- `aliases`: migration aliases for legacy stored progress.
- `reviewWeight`: relative representation in Skill Builder and quiz blueprints.
- `notes`: internal authoring guidance that is never shown to learners.

### Keep teaching strategy separate

Teaching strategies belong outside `agenda.items`:

```js
reviewStrategy: {
  formats: ["pattern_recycling", "micro_drill"],
  maxItemsPerRound: 4,
  preferRecentMistakes: true
}
```

`pattern_recycling` may control how an objective is practiced. It must never be
the objective itself.

## Shared Curriculum Selectors

Add pure data-layer selectors and make every consumer use them.

### `getLessonAgenda(lesson, options)`

Returns normalized canonical agenda items.

- Uses `lesson.agenda.items` first.
- Supports concrete legacy `focusPoints` only during migration.
- Rejects known placeholder/meta labels.
- Filters by mode when requested.
- Resolves localized display labels separately from prompt concepts.
- Never creates `form` or `use` as fallback items.

### `getLocalizedAgendaLabel(item, supportLang)`

- Normalizes the requested support language using the shared language registry.
- Returns the exact supported-language label.
- Falls back to English only at runtime.
- Emits a validation failure in development/test when a required locale is
  missing.
- Preserves RTL text and does not mix target examples into the localized label.

### `buildUnitCurriculumSnapshot(unit, options)`

Creates an immutable review payload from the unit's core lessons.

```js
{
  unitId,
  unitTitle,
  cefrLevel,
  sourceLessonIds,
  agendaItems,
  vocabulary,
  grammarConcepts,
  communicativeGoals,
  comprehensionGoals,
  targetExamples,
  evidenceCriteria
}
```

Rules:

- Include only authored core lessons preceding the review lesson.
- Exclude Skill Builder, Integrated Practice, quiz, and game-review lessons to
  prevent review material from recursively reviewing itself.
- Deduplicate by stable agenda-item ID, not translated label.
- Preserve source lesson order.
- Retain source lesson IDs for coverage reporting.
- Support optional weighting without discarding low-frequency objectives.

## Tutor Repair

### Preview

- Replace `getTutorLessonPreviewAgendaItems()` legacy focus-point aggregation
  with `getLessonAgenda()`.
- Render `getLocalizedAgendaLabel()` for the active support/app language.
- Show the actual target-language example separately when useful.
- Continue allowing locked lesson previews.
- Show a clear unavailable state if a lesson fails validation in development;
  do not silently render a generic agenda.

### Live agenda and prompting

- Initialize the Tutor cursor from canonical item IDs.
- Supply the current item's `targetConcept`, relevant target examples, and
  evidence criteria to the live model.
- Keep learner-facing explanations in the support language and practice forms
  in the target language.
- Tell the model how to teach the current objective without exposing internal
  agenda metadata.
- Remove string-based instructions such as `Teach form`.
- Use the same normalized agenda for Gemini and OpenAI; provider differences
  may affect transport/grading, not curriculum selection.

### Progress migration

- Version Tutor agenda progress by lesson and agenda version.
- Map old progress only when an explicit legacy alias exists.
- Do not map completed `form` or `use` entries onto new concrete objectives.
- If stored progress contains only invalid placeholder IDs, restart the agenda
  while preserving earned lesson XP.
- Keep completed lessons completed; do not retroactively revoke completion.

### Completion and review

- A regular Tutor lesson cannot enter review until every required agenda item
  has acceptable evidence.
- The XP threshold remains an additional completion gate.
- Review prompts may combine completed items but cannot introduce objectives
  outside the lesson agenda.
- Completion summaries display the same localized agenda labels used in the
  preview.

## Skill Tree Repair

### Preserve authored modes

- Stop applying `applyPreA1LessonModuleStrategy()` to every CEFR level.
- Scope any truly Pre-A1-specific balancing to `level === "Pre-A1"`.
- Do not replace a lesson's authored `modes` array during normal loading.
- If a level needs module-coverage balancing, solve it in authored curriculum
  data or supplemental lessons, not by mutating core lessons at runtime.
- Add an integrity check that flags authored content blocks excluded from the
  active modes unless explicitly marked as support/reference-only.

### Mode-specific prompting

Each module receives:

- The lesson title and description.
- The relevant canonical agenda items for that mode.
- The concrete target concept and examples.
- The evidence criteria.
- The existing mode-specific topic, scenario, and prompt.
- The CEFR constraint and support/target language policy.

Mode behavior:

- Vocabulary rotates through concrete words, phrases, or lexical categories.
- Grammar generates questions for named structures and contrasts.
- Reading assesses explicitly named comprehension objectives.
- Stories incorporates the specified language and scenario objectives.
- Realtime builds a goal around specified communicative evidence.
- Game consumes the unit snapshot rather than a generic `comprehensive review`
  focus point.

### Fallback policy

Fallbacks may create missing mode instructions, but not missing curriculum.

Allowed fallback:

> Practice the agenda items tagged for Grammar using short transformations.

Forbidden fallback:

> Agenda: form, use.

If a core lesson has no canonical agenda after legacy migration, curriculum
validation must fail and identify the lesson. Runtime should not guess.

## Unit-Aware Review Lessons

### Skill Builder

Skill Builder uses `buildUnitCurriculumSnapshot()` and a drill strategy.

- Pull concrete agenda items from preceding core lessons.
- Favor retrieval, contrast, correction, and short transformations.
- Rotate across source lessons instead of fixating on the first topic.
- Record which source objective each generated question assesses.
- Require coverage across the unit before repeating an already-covered item,
  subject to available material.
- `pattern_recycling` and `micro_drill` remain internal strategy identifiers,
  never learner objectives.

### Integrated Practice

- Use the same unit snapshot.
- Select at least two compatible objectives from different preceding lessons.
- Build one coherent scenario where both objectives are necessary.
- Keep source objective IDs attached to the generated task.
- Validate that the success criteria demonstrate the selected objectives.
- Do not introduce vocabulary or grammar outside the unit snapshot unless it is
  unavoidable connective language appropriate for the level.

### Quiz

Build an explicit quiz blueprint before generating questions.

```js
{
  unitId,
  sourceLessonIds,
  questions: [
    {
      agendaItemId,
      sourceLessonId,
      mode: "grammar",
      assessmentType: "choose_or_produce"
    }
  ]
}
```

Blueprint requirements:

- Every core lesson contributes at least one assessed objective when question
  count permits.
- No objective dominates unless its `reviewWeight` explicitly allows it.
- Questions reference real agenda items and evidence criteria.
- Distractors must be plausible but unambiguously incorrect.
- Passing the quiz indicates unit coverage, not success on generic questions.

### Game Review

- Reuse the unit snapshot instead of maintaining a parallel topic collector.
- Game encounters retain source lesson and agenda-item IDs.
- Generated scenes can be creative, but their required language remains tied to
  unit objectives.

## Localization Plan

### Source of truth

- Add localized `agenda.items[].label` fields through the existing skill-tree
  localization pipeline.
- Extend the existing localizers to traverse agenda labels.
- Centralize traversal so every localizer handles the same fields.
- Derive the required locale list from `src/constants/languages.js`.

### Translation boundaries

Keep these concepts distinct:

1. **Support label**: what the learner reads in the preview or completion
   review.
2. **Prompt concept**: language-neutral internal description supplied to the
   model.
3. **Target example**: the word or phrase the learner practices.
4. **Evidence criteria**: internal description of successful performance.

Support-label localization must not translate or replace target examples.

### Authoring workflow

- English is the canonical agenda-label authoring language.
- Spanish may be authored alongside English where already available.
- Other required support locales are added by the established skill-tree
  localizers.
- Translations are checked into the data pipeline; do not translate agendas via
  an LLM at lesson-launch time.
- Add a report listing missing labels by lesson, agenda item, and locale.
- Treat hybrid-language labels as validation failures.

## Migration Strategy

### Inventory

Create a curriculum audit script that reports, for every target language and
CEFR level:

- Lessons missing `agenda.items`.
- Lessons whose agenda contains placeholder/meta terms.
- Duplicate or unstable agenda-item IDs.
- Missing support-language labels.
- Modes without relevant agenda items.
- Authored content blocks omitted from active modes.
- Review lessons without source-unit objectives.
- Spanish source examples leaking into non-Spanish target lessons.

### Automatic migration

Safe automatic conversions:

- Convert concrete legacy `focusPoints` into agenda items with stable IDs.
- Preserve the originating mode on each item.
- Convert explicit realtime success criteria into communication evidence.
- Convert reading/story prompts into draft comprehension objectives only when
  the prompt names a concrete learner action.

Unsafe conversions must be reviewed manually:

- `form`, `use`, `pattern recycling`, `micro-drills`, and similar labels.
- Broad topics without observable learner behavior.
- Prompts that describe an activity but not what successful learning means.
- Target-language examples that are hard-coded in Spanish for every target
  language.

### Manual curriculum pass

Repair lessons level by level:

1. Pre-A1 and A1 establish schema and pedagogy conventions.
2. A2 and B1 validate scaling to larger functional agendas.
3. B2, C1, and C2 repair abstract, discourse, register, and mediation goals.
4. Supplemental and review lessons are regenerated from the repaired core
   lessons rather than authored with generic placeholders.

Each repaired unit should be reviewed as a whole before moving to the next one.

## Implementation Phases

### Phase 0: Capture the failure

- Add regression fixtures for Linguistic Diversity and representative lessons
  at Pre-A1, A1, B1, and C2.
- Assert the current authored modes before normalization.
- Add prompt snapshots showing how `form`, `use`, `pattern recycling`, and
  `micro-drills` currently leak into Tutor and Skill Tree prompts.
- Record current saved Tutor-agenda progress shapes for migration tests.

### Phase 1: Stop further curriculum mutation

- Scope or remove the global Pre-A1 module rewrite.
- Preserve authored modes across all levels.
- Remove `form`/`use` and other placeholder objective fallbacks.
- Make missing curriculum visible through validation rather than runtime
  invention.

### Phase 2: Add the canonical agenda contract

- Implement schema validation and shared selectors.
- Add stable agenda-item IDs.
- Add legacy concrete-focus-point compatibility.
- Migrate Tutor preview, Tutor cursor, completion review, and grading context to
  canonical agenda items.

### Phase 3: Repair core lessons

- Run the inventory.
- Convert concrete focus points automatically.
- Manually repair vague or missing objectives.
- Verify target-language examples for each supported target path.
- Remove unreachable or unintended mode content.

### Phase 4: Make reviews unit-aware

- Implement `buildUnitCurriculumSnapshot()`.
- Rebuild Skill Builder, Integrated Practice, quiz, and Game Review inputs from
  the snapshot.
- Add source objective IDs to generated activities and results.
- Remove generic supplemental `focusPoints`.

### Phase 5: Complete localization

- Extend localizers to agenda labels.
- Fill every required support/app language.
- Add missing/hybrid localization audits.
- Verify RTL layout and target-example separation.

### Phase 6: Remove legacy behavior

- Stop cross-mode aggregation of raw `focusPoints`.
- Remove placeholder-generating branches.
- Remove legacy progress compatibility after the migration window.
- Document the curriculum-authoring contract for future lessons.

## Verification

### Data integrity tests

- Every launchable lesson has a valid agenda.
- Every agenda item has a stable, unique ID and observable evidence.
- No banned placeholder is a standalone agenda item.
- Every required support language has a nonempty label.
- Every active mode has at least one relevant objective or an explicit
  reference-only exemption.
- Authored modes survive loading unchanged.
- Review snapshots contain only preceding core lessons.

### Tutor tests

- Preview items exactly match live agenda IDs and order.
- Locked and unlocked previews show the same localized curriculum.
- Changing support language changes labels but not agenda IDs or target forms.
- Successful turns advance only the demonstrated objective.
- Invalid legacy progress does not mark new objectives complete.
- Completion requires both real agenda coverage and XP.

### Skill Tree tests

- Grammar questions name a concrete structure or contrast.
- Vocabulary questions rotate through concrete lexical material.
- Reading, Stories, and Realtime use their authored content.
- Original modes remain active for Linguistic Diversity.
- Skill Builder questions reference source lesson/objective IDs.
- Integrated Practice combines objectives from multiple lessons.
- Quiz blueprints cover the unit without excessive repetition.
- Game Review consumes the same unit snapshot.

### Localization matrix

For each required support/app language, verify:

- Tutor preview title, description, and agenda.
- Locked-lesson explanation and disabled start action.
- Live Tutor agenda instruction separation between support and target language.
- Skill Tree lesson detail and module instructions.
- Skill Builder, Integrated Practice, quiz, and completion review labels.
- RTL rendering for Arabic.

Use at least one target language different from the support language in every
test pass to detect accidental target/support mixing.

### Representative acceptance fixture

For C2 **Linguistic Diversity**, acceptance requires:

- Active modes remain Reading and Realtime.
- The preview contains concrete regional-variation objectives.
- No `form` or `use` agenda entry exists.
- Reading prompts assess recognition of regional forms.
- Realtime prompts assess region- and register-appropriate adaptation.
- The unit Skill Builder drills concrete concepts from all Regional Variations
  lessons.
- Integrated Practice combines regional recognition with appropriate
  production.
- The unit quiz includes balanced coverage of vocabulary, pronouns,
  conjugation, accents, and register.
- All agenda labels render in every required support/app language.

## Rollout and Compatibility

- Gate the new selectors behind a development flag only while the schema is
  incomplete; do not ship a mixed system in which preview and live progression
  use different agenda sources.
- Preserve existing completed-lesson status and XP.
- Restart only invalid in-progress agenda cursors while retaining earned XP.
- Add telemetry for missing agenda, missing localization, fallback usage, and
  review questions without source objective IDs.
- Roll out by completed CEFR bands or full units, never individual consumers.
- Remove the flag once every lesson passes the integrity audit.

## Definition of Done

The repair is complete when:

- Every core lesson has concrete, validated, localizable agenda items.
- Tutor preview, live sequencing, grading, and completion use that same agenda.
- Skill Tree preserves authored modes and supplies mode-relevant objectives to
  every prompt generator.
- Skill Builders, Integrated Practice, quizzes, and Game Reviews consume a
  shared snapshot of the unit's actual taught curriculum.
- Generic activity labels are strategies, not objectives.
- All required support/app languages pass localization validation.
- The full curriculum integrity suite, Tutor tests, Skill Tree tests, build, and
  representative UI smoke tests pass.

