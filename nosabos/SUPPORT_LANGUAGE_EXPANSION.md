# Support Language Expansion

This document is the authoritative catalog of every file, function, component, and data structure that must be touched to add a new **support / app UI language** (the language the app chrome, instructions, feedback, and LLM meta-prompts are rendered in) to Nosabos.

It is intentionally exhaustive so the same playbook can be reused for every future language. The current goal is Italian (`it`), but the patterns apply to any additional BCP-47 code (`de`, `el`, `pl`, `ga`, `yua`, …).

> Support language ≠ practice (target) language. Practice language breadth is already wide; support language is historically only `en` and `es`. Adding a new support language means the UI can be rendered and the AI can explain in that language — not just be selectable for practice.

---

## 1. Quick Reference

| Item                          | Value (Italian)                     |
| ----------------------------- | ----------------------------------- |
| ISO 639-1 code                | `it`                                |
| BCP-47 tag                    | `it-IT`                             |
| English label                 | Italian                             |
| Spanish label                 | Italiano                            |
| Native label                  | Italiano                            |
| Prompt label                  | `Italian (italiano)`                |
| Flag icon                     | `italianFlag` (`flags.jsx`)         |
| Tier                          | `stable`                            |
| LLM display name              | `Italian`                           |
| Whisper STT code              | `it`                                |
| Intl date / collator locale   | `it-IT`                             |

---

## 2. Architecture Overview

Three language axes coexist in the app:

1. **`appLanguage` / `uiLang`** — UI chrome language (localStorage + user doc `appLanguage`).
2. **`supportLang`** — Explanation / tutoring language used by LLM prompts and feedback.
3. **`targetLang`** — The language the user is practicing.

All three are normalized through `src/constants/languages.js`. Historically only `en`/`es` were valid for (1) and (2); a new support language must be threaded through every place that still hard-codes that pair.

---

## 3. Canonical Files (Must Change)

These files are the primary surface area. Any new support language MUST update each of them.

### 3.1 `src/constants/languages.js`
- `LANGUAGE_FALLBACK_LABELS` (lines 19–34) — English fallback label.
- `LANGUAGE_PROMPT_LABELS` (lines 36–51) — Native-tagged prompt label (e.g. `"Italian (italiano)"`).
- `LANGUAGE_META` array (lines 53–152) — Entry with `value`, `languageKey`, `practiceKey`, `tier`, `flag`.
- Flag import at top of file (lines 1–14).
- `DEFAULT_SUPPORT_LANGUAGE` / `DEFAULT_TARGET_LANGUAGE` (lines 16–17) — Only change if the new language is the new default.
- `buildLanguageOptions` collator (line 249) — Extend `sortLocale` mapping so the new language sorts in-locale instead of falling back to English.
- `withTierTag` (lines 230–241) — Add alpha/beta label for the new UI language.

### 3.2 `src/utils/translation.jsx`
- Add a **top-level `translations.<code>` object** that mirrors the structure of `translations.es` (currently only `en` and `es` exist — confirmed at lines 18 and 757). The `t()` helper falls back to English, so partial coverage is safe but lossy.
- Inside every existing `translations.en` and `translations.es` block, add:
  - `language_<code>` label
  - `onboarding_practice_<code>` label
  - Any `*_<code>` keys already added for other languages (search `language_it`, `onboarding_practice_it`).
- `t(lang, key, vars)` (lines 6–15) — No change needed; it already falls back to English for unknown languages.
- Component-local dictionaries: grep for `translations\[lang\] \|\| translations\.en` and migrate to the shared registry whenever possible.

### 3.3 `src/hooks/useLanguage.js`
- `getStoredLanguage` (line 60) — Expand the `stored === "es" || stored === "en"` guard to accept the new code.
- `setStoredLanguage` (line 70) — Same validation.
- `toggleLanguage` (lines 106–111) — Either expand into a cycle across supported codes or replace with a `setLanguage(code)` flow driven by the shared constant list.
- `spanishTimezones` (lines 3–41) and `detectLanguageFromTimezone` (lines 44–54) — Add matching timezone heuristics for the new language (e.g. `Europe/Rome`, `Europe/Vatican` for Italian).
- Prefer delegating to `normalizeSupportLanguage` from `constants/languages.js` instead of inline code lists.

### 3.4 `src/utils/languageDetection.js`
- `SPANISH_TIMEZONES`, `isSpanishTimezone`, `isSpanishBrowserLanguage`, `detectUserLanguage` (lines 3–139) — Replace the binary Spanish-vs-English logic with a multi-language resolver, or add a parallel `ITALIAN_TIMEZONES` set plus priority ordering.

### 3.5 `src/App.jsx`
Language touchpoints are spread throughout. Key anchors:
- `TARGET_LANGUAGE_LABELS` (~lines 173–217).
- Support/practice language dropdowns (~lines 639–751, 1347–1359, 1463–1470).
- `Intl.Collator(appLanguage === "es" ? "es" : "en")` (line ~648) — generalize to the new code.
- Firestore validation for `supportLang` (~line 3357) currently `["en", "es"].includes(...)` — must include the new code.
- Firestore validation for `targetLang` (~lines 2413–2427 and ~2539–2555) — include the new code.
- `ALPHABET_LANGS` arrays — both occurrences (~lines 1604–1616 and ~5012–5024).
- Inline `appLanguage === "es" ? … : …` ternaries scattered across the file (629, 682, 689, 938, 1016, 1042, 1055–1058, 1505, 1669–1670, 1807–1808, 2322, 2337–2342, …). Convert to translation keys or a `uiText(en, es, it)` helper.

### 3.6 `src/components/Onboarding.jsx`
- Support language selector (lines 89–147) — use `getSupportLanguageOptions()` and drop the binary `supportLang === "es" ? "es" : "en"` collation on line 147.
- Practice language menu — ensure new language is rendered with its tier tag.

### 3.7 `src/components/Conversations.jsx`
- `languageNameFor` (~lines 743–754) — handle the new code.
- Strict language instruction block (~lines 1105–1136) — add native-language "respond ONLY in X" string.
- `languageName` ternary chain (~lines 1215–1232).
- Inline Spanish-vs-English status text (lines 869–872, 2741, 2753, 2784–2797, 2829, 2921, 3013, 3078, 3084–3087, 3132, 3166).

### 3.8 `src/components/RealTimeTest.jsx`
- `buildLanguageInstructions` strict block (~lines 1905–1930).
- `goalLangName` maps — BOTH occurrences (~lines 1265 and ~1473).
- `probeText` voice-updated message (~lines 2095–2107).
- `props` validation list (~line 964).

### 3.9 `src/components/HelpChatFab.jsx`
- `nameFor` helper in TWO places (~lines 278–285 and ~580–588).

### 3.10 `src/components/ConversationSettingsDrawer.jsx`
- Support language picker — ensure it reads from `getSupportLanguageOptions()` and not a hard-coded `[en, es]` list.

### 3.11 `src/components/History.jsx`
- `useSharedProgress` validation list (~line 309), component-level validation (~line 712).
- `LANG_NAME` (~lines 156–166), `localizedLangName` (~lines 741–752).
- BCP47 mapping (~line 681+).

### 3.12 `src/components/GrammarBook.jsx`
- `useSharedProgress` validation (~line 196), component validation (~line 939).
- `LANG_NAME` (~lines 155–165), `localizedLangName` (~lines 955–966).
- English/Spanish prompt template pair (~lines 1187–1423). Add a parallel `userLanguage === "<code>"` branch with translated `fillPrompt` / `mcPrompt` / `maPrompt` / `speakPrompt` / `matchPrompt`.

### 3.13 `src/components/Vocabulary.jsx`
- `useSharedProgress` (~line 207) and component validation (~line 1025).
- `LANG_NAME` (~lines 156–166), `localizedLangName` (~lines 1041–1052).

### 3.14 `src/components/Stories.jsx`
- `useSharedProgress` (~lines 202–214).
- `BCP47` map (~lines 131–145).
- `LLM_LANG_NAME` (~lines 114–129).
- `toLangKey` (~lines 147–181) — add native/English name aliases.

### 3.15 `src/components/JobScript.jsx`
- `useSharedProgress` (~line 171).
- `toBCP47` (~lines 118–137), `LLM_LANG_NAME` (~lines 80–110), `toLangKey` (~lines 116–133).
- English/Spanish prompt block — add the new language branch.

### 3.16 `src/components/IdentityDrawer.jsx`
- Inline Spanish-vs-English copy when rendering identity summary / voice persona description.

### 3.17 `src/components/DailyGoalModal.jsx`
- `Intl.DateTimeFormat` locale (~lines 142–143 and ~558).

### 3.18 `src/components/Randomize.jsx`
- `useSharedProgress` (~line 105) — include new code in validation list.

### 3.19 `src/components/AlphabetBootcamp.jsx`
- `LANGUAGE_ALPHABETS` map (~lines 1000–1012) and `LANGUAGE_SCRIPTS` map (~lines 118–128). For Italian specifically, no new alphabet file is required (Latin), but the entry must be present.

### 3.20 `src/components/LessonFlashcard.jsx` / `FlashcardPractice.jsx` / `FlashcardSkillTree.jsx`
- FlashcardSkillTree: `Intl.DateTimeFormat` (lines 139, 197) — replace with shared locale helper keyed on `appLanguage`.
- LessonFlashcard / FlashcardPractice: practice-language normalization must stay independent from support-language normalization — use `normalizeSupportLanguage` / `normalizePracticeLanguage` helpers.

### 3.21 `src/components/ProficiencyTest.jsx`
- Same pattern: practice vs support language normalization and inline ternaries.

### 3.22 `src/components/LoadingMiniGame.jsx`
- Inline language-dependent copy.

### 3.23 `src/components/quiz/QuestionRenderer.jsx`
- Inline Spanish-vs-English copy for question scaffolding.

### 3.24 `src/components/LessonGroupQuiz.jsx`
- `useSnapshot` validation list (~line 175).
- `LANG_NAME` (~lines 106–117).
- `resolveSupportLang` (~lines 119–124) — add new code to the allow list.

### 3.25 `src/components/VirtualKeyboard.jsx`
- Only required if the new language introduces diacritics or a non-Latin script. Italian does not. For languages that do: character arrays (lines 15–294), `isX` flag (lines 351–355), null-return guard (line 375), `getKeyboardLayout` (lines 378–395), uppercase toggle condition (line 431).

### 3.26 `src/components/flagsIcons/flags.jsx`
- Export a flag function named `<language>Flag`. For Italian this already exists.

---

## 4. Shared Utilities

### 4.1 `src/utils/tts.js`
- `TTS_LANG_TAG` map (lines 10–25) — add BCP-47 tag.
- Default fallback (line 362) — decide whether the new language should become the default when no code is provided (typically: no).
- Session instruction language hints (lines 612–614).

### 4.2 `src/hooks/useSpeechPractice.js`
- `BCP47_TO_WHISPER` (lines 7–22) — add STT code.

### 4.3 `src/utils/noteGeneration.js`
- `LANG_NAME` (lines 5–20).

### 4.4 `src/utils/llm.js`
- Add a `userLanguage === "<code>"` branch that mirrors the English (lines 103–147) and Spanish (lines 149–183) prompt templates: `fillPrompt`, `mcPrompt`, `maPrompt`, etc. This is the single biggest content-authoring task — the new-language tutor prompt quality determines UX quality.

### 4.5 `src/utils/speechEvaluation.js`
- `STOPWORDS` (lines 3–245) — add the stopword set. Italian is already seeded.
- `normalizeGeneric(str, lang)` (lines 271–410) — make sure new code routes through the language-aware path.
- Feedback-tip blocks (~line 250+) that currently pick between Spanish and English — add a third branch or translation-key them.

### 4.6 `src/utils/flashcardReview.js`
- `Intl.RelativeTimeFormat` / `Intl.DateTimeFormat` calls (lines 556, 593, 612).
- Inline copy (lines 56, 68, 88, …) — migrate to translation keys.

---

## 5. Data Layer

### 5.1 Skill tree data
- `src/data/skillTreeData.js`: `SUPPORTED_TARGET_LANGS` set (~lines 10898–10908) and `LEARNING_PATHS` map (~lines 10914–10924).
- `src/data/skillTree/c2.js`: `SUPPORTED_TARGET_LANGS` (~lines 1424–1434) and `LEARNING_PATHS` (~lines 1440–1450).
- `src/data/skillTree/a1.js`: `successCriteria_<code>` on the tutorial lesson (~lines 71–79).
- Repeat for every level file that defines `successCriteria_*` keys.

### 5.2 Flashcard datasets
- `src/data/flashcardData.js`: ~400 entries of the shape `concept: { en: "...", es: "..." }`. For a new support language the `en`/`es` pair stays but each UI rendering path that reads these values must fall back to English cleanly.
- `src/data/flashcards/common.js`: same shape; same caveat.
- If the new language should also be usable as a **label language** on cards, extend the schema to `{ en, es, <code> }`.

### 5.3 Alphabet files
- Only required for languages with a non-standard writing system (`src/data/<lang>Alphabet.js`). Italian does not need one.

---

## 6. User Document Schema (Firestore)

Collection: `users/{npub}`

- `appLanguage` — accepts new code (validated in `App.jsx` and `useLanguage.js`).
- `progress.supportLang` — accepts new code (validated in `App.jsx` ~line 3357 and in `LessonGroupQuiz.jsx`'s `resolveSupportLang`).
- `progress.targetLang` — practice-language list already broad; confirm new code is in every validation list.
- `progress.languageLessons[<code>]` and `progress.languageFlashcards[<code>]` — no schema change; the code is used as a key.

No Firestore rule changes are needed because rules don't restrict specific language codes. Indexes (`firestore.indexes.json`) do not need updates either.

---

## 7. Voice & Character Config

`src/utils/tts.js` — `CHARACTER_VOICES` (lines 68–102) stores English personality strings. If the persona description should be rendered in the new support language, either:

1. Add a translated-persona map keyed by `appLanguage`, or
2. Move the personality into `translations.<code>` under keys like `voice_persona_frog`.

---

## 8. Audit Patterns — Run Before Declaring Done

Run each pattern and confirm no hit in production source (tests / docs exempt):

```
["en", "es"]
stored === "es" || stored === "en"
=== "es" ? "es" : "en"
appLanguage === "es"
uiLang === "es"
supportLang === "es"
stored === "es" ? "es" : "en"
translations[lang] \|\| translations.en
Intl\.(DateTimeFormat|Collator|RelativeTimeFormat)
new Intl\.\w+\(["'](en|es)
lang === "es" \? "es-(MX|ES)" : "en-US"
```

Replace hits with either:

- a translation-key lookup (`t(lang, "…")`), or
- a `normalizeSupportLanguage` / `normalizePracticeLanguage` call from `src/constants/languages.js`, or
- a tiny locale helper (`const sortLocale = getSortLocale(appLanguage);`).

---

## 9. Step-by-Step Rollout Checklist

For each new support language, work top-to-bottom:

1. **Register the code**
   - [ ] Add entry to `LANGUAGE_META` in `src/constants/languages.js`.
   - [ ] Add label to `LANGUAGE_FALLBACK_LABELS` and `LANGUAGE_PROMPT_LABELS`.
   - [ ] Import / reuse the correct flag from `components/flagsIcons/flags.jsx`.
2. **Persistence**
   - [ ] Update `useLanguage.js` validation and detection.
   - [ ] Update `App.jsx` `appLanguage` / `supportLang` validation at every write site.
   - [ ] Update `languageDetection.js` so new-locale users auto-select the new language.
3. **Translations**
   - [ ] Create `translations.<code>` in `src/utils/translation.jsx`.
   - [ ] Add `language_<code>` and `onboarding_practice_<code>` in `en` and `es` blocks (and any other already-populated language blocks).
4. **LLM prompts**
   - [ ] Extend `src/utils/llm.js` with a `userLanguage === "<code>"` branch.
   - [ ] Extend `GrammarBook.jsx`, `JobScript.jsx`, and any other component-local prompt pair.
5. **Realtime & conversation**
   - [ ] Update `Conversations.jsx`, `RealTimeTest.jsx`, `HelpChatFab.jsx`, `ConversationSettingsDrawer.jsx`.
6. **Per-module components**
   - [ ] Update every file in `§3.11`–`§3.24` above.
7. **Utilities & data**
   - [ ] Update every file in `§4` and `§5` above.
8. **Audit**
   - [ ] Run every pattern in `§8`; open a PR only when all hits are legitimate.
9. **Verification**
   - [ ] `npm run build` passes.
   - [ ] Manual smoke: onboarding → practice selection → a lesson → Conversations → RealTime session.
   - [ ] Confirm UI labels render in the new language and LLM respects `supportLang`.

---

## 10. Italian (`it`) Rollout Status

Current state (to keep this doc honest):

| Area                                           | Status |
| ---------------------------------------------- | ------ |
| `LANGUAGE_META` / flag / prompt labels         | Done   |
| `TTS_LANG_TAG` (`it-IT`)                       | Done   |
| Whisper STT code (`it`)                        | Done   |
| BCP47 maps (Stories, JobScript, History, …)    | Done   |
| `LANG_NAME` / `LLM_LANG_NAME`                  | Done   |
| `STOPWORDS.it`                                 | Done   |
| `language_it` / `onboarding_practice_it` keys  | Done (inside `en` and `es` blocks) |
| `translations.it` top-level UI object          | **Missing** |
| `supportLang` validation accepts `"it"`        | **Missing** (still `["en", "es"]` at `App.jsx` ~3357) |
| `useLanguage.js` validation accepts `"it"`     | **Missing** (still `=== "es" \|\| === "en"`) |
| Italian LLM prompt templates (`llm.js`, `GrammarBook.jsx`, `JobScript.jsx`) | **Missing** |
| `Intl.DateTimeFormat` / `Intl.Collator` handles `it-IT` | **Missing** |
| Flashcard `concept` entries include `it`       | **Missing** (still `{ en, es }` only; English fallback is currently acceptable) |
| `languageDetection.js` timezone heuristics     | **Missing** (Europe/Rome etc.) |

Treat the "Missing" rows as the working TODO for Italian — they become the acceptance criteria for shipping Italian as a full support language.

---

## 11. File Count Summary

| Category                               | Files |
| -------------------------------------- | ----- |
| Shared constants & translation         | 2     |
| Language persistence / detection hooks | 2     |
| Main app shell                         | 1     |
| Onboarding                             | 1     |
| Conversation / realtime / help         | 4     |
| Per-module learning components         | ~12   |
| Quiz & lesson wrappers                 | 3     |
| Flashcards / skill tree                | 4     |
| Utility helpers (tts, llm, notes, speech, flashcardReview) | 5 |
| Skill tree data files                  | 3+    |
| Flashcard data                         | 2     |
| Flag icons                             | 1     |
| Virtual keyboard (only for scripts)    | 0–1   |
| **Total**                              | **~40 files per new support language** |

---

## 12. Implementation Principles

- Prefer shared helpers (`normalizeSupportLanguage`, `getSupportLanguageOptions`, `t()`) over adding more one-off branches.
- Keep `supportLang` and `appLanguage` semantics explicit and independent from practice language.
- When a new UI language is incomplete, fall back to English via `translations.en` — never return the raw key.
- Every inline `=== "es" ? … : …` is a bug waiting to happen for language #4, #5, #6. Convert them as you touch them.
- Update this document with any new hotspots discovered during each rollout.
