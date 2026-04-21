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

**Italian implementation note:** Done. `languageDetection.js` already contains a full multi-language resolver:
1. **Stored preference** — if `localStorage.appLanguage` is a valid support language code, it is returned immediately (respects explicit user choice).
2. **Italian timezone** — `ITALIAN_TIMEZONES = ['Europe/Rome', 'Europe/Vatican', 'Europe/San_Marino']` checked first; returns `'it'`.
3. **Spanish timezone** — returns `'es'`.
4. **Italian browser language** — `ITALIAN_LANGUAGE_CODES = ['it', 'it-IT', 'it-CH', 'it-SM', 'it-VA']` checked against `navigator.languages`; returns `'it'`.
5. **Spanish browser language** — returns `'es'`.
6. **Default** — returns `DEFAULT_SUPPORT_LANGUAGE` (`'en'`).

`LandingPage.jsx` calls `detectUserLanguage()` in its `useState` initializer — so Italian-timezone and Italian-browser-language users land on the page in Italian automatically. The prerequisite was `translations.it` existing in `LandingPage.jsx`, which was added in §3.21f. For any future support language, add its timezone set + browser language codes to this file in the same pattern.

### 3.5 `src/App.jsx`
Language touchpoints are spread throughout. Key anchors:
- `TARGET_LANGUAGE_LABELS` (~lines 173–217).
- Support/practice language dropdowns (~lines 639–751, 1347–1359, 1463–1470).
- **Mode menu / app navigation chrome** — the bottom/primary mode menu, menu label, and tab labels (`Alphabet`, `Path`, `Cards`, `Conversation`, `Mode`, `Help`, `Notes`, etc.) must be fully localized. These labels often live outside `translations.<code>` and are easy to miss because they are rendered in app-shell helpers rather than feature pages.
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
- Support-language normalization must include the new code. If the resolver only accepts `en`/`es`, the whole conversation UI will silently fall back to English even when `supportLang` is correct.
- Visible conversation chrome includes settings button text, chat-log labels, generating-topic copy, topic shuffle aria labels, suggestion aria labels, level/XP labels, start/end buttons, replay labels, and transcript modal titles.

**Italian implementation note:** `Conversations.jsx` now accepts `it`/`it-*`/Italian aliases in its local resolver and reads the visible chrome from `translations.it` keys such as `ra_conversation_settings`, `ra_chat_log`, `ra_generating_topic`, `ra_btn_start`, `ra_btn_end`, `ra_btn_replay`, and `ra_label_level`.

### 3.8 `src/components/RealTimeTest.jsx`
- `buildLanguageInstructions` strict block (~lines 1905–1930).
- `goalLangName` maps — BOTH occurrences (~lines 1265 and ~1473).
- `probeText` voice-updated message (~lines 2095–2107).
- `props` validation list (~line 964).
- Visible lesson-realtime chrome includes goal buttons, skip/next, chat-log modal title, replay labels, auto-stop toast, translation-failed toast, free-practice toast, and loading/generating text.

**Italian implementation note:** `RealTimeTest.jsx` now uses the shared `translations.it` realtime keys for these visible labels instead of local English/Spanish ternaries.

### 3.9 `src/components/HelpChatFab.jsx`
- `nameFor` helper in TWO places (~lines 278–285 and ~580–588).
- The **entire help chat UI** must be localized, not only language names and instructions. Audit saved-chat list copy, empty states, toast titles/descriptions, connection errors, delete/new/save actions, menu buttons, tooltip labels, morph/morpheme mode labels, message placeholders, attachment/action labels, timestamps, and any inline `appLanguage === "es" ? … : …` branches.
- Realtime/system instructions should use the new support language, while visible help-chat chrome should read from `translations.<code>` or a local `uiText(en, es, <code>)` helper.

### 3.10 `src/components/ConversationSettingsDrawer.jsx`
- Support language picker — ensure it reads from `getSupportLanguageOptions()` and not a hard-coded `[en, es]` list.
- Conversation settings labels, placeholders, button text, section headings, helper copy, and reset/save actions must be localized.

### 3.11 `src/components/History.jsx`
- `useSharedProgress` validation list (~line 309), component-level validation (~line 712).
- `LANG_NAME` (~lines 156–166), `localizedLangName` (~lines 741–752).
- BCP47 mapping (~line 681+).

### 3.12 `src/components/GrammarBook.jsx`
- `useSharedProgress` validation (~line 196), component validation (~line 939).
- `LANG_NAME` (~lines 155–165), `localizedLangName` (~lines 955–966).
- English/Spanish prompt template pair (~lines 1187–1423). Add a parallel `userLanguage === "<code>"` branch with translated `fillPrompt` / `mcPrompt` / `maPrompt` / `speakPrompt` / `matchPrompt`.

**Italian implementation note:** All visible UI binary ternaries (`userLanguage === "es" ? … : …`) in `GrammarBook.jsx` have been replaced with `t("key")` calls that resolve through `translations.it` when `userLanguage === "it"`. This includes: mode instruction headers (fill/MC/MA/match/speak), quiz result modals (pass/fail titles, score strings, action buttons), keyboard toggle labels, lesson progress label, speech error toast titles/descriptions, and the ask-assistant aria label. The `isSpanishUI` flag near LLM prompt construction is intentionally preserved — it gates AI-prompt text (not visible chrome) and only needs extending when the Italian AI prompt branch is authored. 27 new `vocab_*` translation keys were added to `translations.en`, `translations.es`, and `translations.it` in `translation.jsx` to support these lookups. Several lookups reuse existing keys (`story_score`, `flashcard_continue`, `try_again`, `flashcard_try_again`, `history_keyboard_close`, `history_keyboard_open`, `flashcard_mic_denied_title`, `flashcard_mic_denied_desc`, `flashcard_speech_unavailable_desc`) rather than duplicating strings.

### 3.13 `src/components/Vocabulary.jsx`
- `useSharedProgress` (~line 207) and component validation (~line 1025).
- `LANG_NAME` (~lines 156–166), `localizedLangName` (~lines 1041–1052).

**Italian implementation note:** All visible UI binary ternaries in `Vocabulary.jsx` have been replaced with `t("key")` calls, matching the same treatment as `GrammarBook.jsx`. Covered areas: mode instruction headers, quiz result modals, keyboard toggle, lesson progress label (`vocab_lesson_progress`), speak-mode header (`vocab_say_it_aloud`), listen labels (`vocab_listen_question`, `vocab_listen_example`, `vocab_listen_word`), LLM hint prefix label (`vocab_speak_hint_label`), and all speech error toasts. `FeedbackRail.jsx` was also updated: the note-button labels (`vocab_create_note`, `vocab_note_saved`) and the explain/explanation strings (`flashcard_explain_answer`, `flashcard_explanation_heading`) now use the `t` prop passed from parents instead of hardcoded `userLanguage === "es"` ternaries.

### 3.14 `src/components/Stories.jsx`
- `useSharedProgress` (~lines 202–214).
- `BCP47` map (~lines 131–145).
- `LLM_LANG_NAME` (~lines 114–129).
- `toLangKey` (~lines 147–181) — add native/English name aliases.
- `getAppUILang()` helper — was binary `appLanguage === "es" ? "es" : "en"`; must be extended to return the new code.

**Italian implementation note:** The `useUIText` hook's entire role-play string object has been migrated from binary `uiLang === "es" ? ... : ...` ternaries to `t(uiLang, "story_*")` calls. Role-play-specific keys (`story_header_roleplay`, `story_role_prompt`, `story_role_placeholder`, `story_start_role`, `story_update_role`, `story_edit_role`, `story_cancel_edit`, `story_play_target`, `story_no_role`, `story_generating_role_title`, `story_generating_role_sub`, `story_finish_role`) were added to all three language blocks in `translation.jsx`. Additional inline ternaries in the component body (demo toast, skip-unavailable toast, eval-error toast, recording-error toasts, Connecting button, sentence counter, role-play completed card) were replaced with `t(uiLang, "story_*")` / existing key lookups. The `bilingual` supportLang resolution was updated from a binary `es`/`en` gate to include `it`. `getAppUILang()` was updated from a binary `appLanguage === "es"` check to `["es", "it"].includes(lang) ? lang : "en"` — this was the root cause of all Stories UI text displaying in English for Italian users. `RepeatWhatYouHear.jsx` and `TranslateSentence.jsx` — which render the "Tap what you hear" and "Translate this sentence" question modes — had all bare ternaries replaced with `t("repeat_hear_*")` / `t("translate_sentence_*")` keys added to all three language blocks. `LessonFlashcard.jsx`'s local translation dict was extended with an `it` entry covering all flashcard UI strings (translate_to, show_answer, type_placeholder, submit, record, skip, etc.). **Per-sentence translation language**: the `supportLang` validation allow-list inside `setProgress` (line ~269) was `["en","es","bilingual"]` — `"it"` was missing, causing the LLM prompt to request English translations regardless of the user's app language. Fixed by adding `"it"` to the list.

### 3.15 `src/components/JobScript.jsx`
- `useSharedProgress` (~line 171).
- `toBCP47` (~lines 118–137), `LLM_LANG_NAME` (~lines 80–110), `toLangKey` (~lines 116–133).
- English/Spanish prompt block — add the new language branch.

### 3.16 Account / Settings Surfaces
Account settings are split across multiple components and must be audited together:
- `src/components/IdentityDrawer.jsx` — display-name form, account switcher, sign-out confirmation, install instructions, CEFR analysis controls, wallet/identity copy, toast titles/descriptions, date formatting, voice persona description, and any inline Spanish-vs-English copy.
- `src/components/ConversationAccountDrawer.jsx` — drawer title and embedded conversation settings surface.
- `src/components/BitcoinSupportModal.jsx` — account/wallet contribution copy, buttons, close labels, tutorial completion copy.
- `src/components/SubscriptionGate.jsx` and adjacent account/payment UI — gate copy, loading text, submit buttons, validation/errors.

Do not treat account settings as localized just because `translations.<code>` exists. Manually open the account/settings drawer in the new support language and verify every visible label.

### 3.17 `src/components/DailyGoalModal.jsx`
- `Intl.DateTimeFormat` locale (~lines 142–143 and ~558).

### 3.18 `src/components/Randomize.jsx`
- `useSharedProgress` (~line 105) — include new code in validation list.

### 3.19 `src/components/AlphabetBootcamp.jsx`
- `LANGUAGE_ALPHABETS` map (~lines 1000–1012) and `LANGUAGE_SCRIPTS` map (~lines 118–128). For Italian specifically, no new alphabet file is required (Latin), but the entry must be present.
- Alphabet card contents are separate from the bootcamp chrome. The rendered card uses `soundIt`, `tipIt`, and `practiceWordMeaning.it` when `appLanguage === "it"`. Do not stop after localizing headings/buttons.

### 3.20 `src/components/LessonFlashcard.jsx` / `FlashcardPractice.jsx` / `FlashcardSkillTree.jsx`
- FlashcardSkillTree: `Intl.DateTimeFormat` (lines 139, 197) — replace with shared locale helper keyed on `appLanguage`.
- LessonFlashcard / FlashcardPractice: practice-language normalization must stay independent from support-language normalization — use `normalizeSupportLanguage` / `normalizePracticeLanguage` helpers.
- LessonFlashcard has a **component-local `t()` dict** (not the shared `translation.jsx` helper) — add the new language entry to all keys in that dict, including the `generating` loading-state key.

**Italian implementation note:** `LessonFlashcard.jsx`'s local dict was extended with an `it` entry for all flashcard UI strings and a new `generating` key (en: "Generating flashcard...", es: "Generando tarjeta...", it: "Generazione scheda..."). The loading text ternary `userLanguage === "es" ? ... : ...` was replaced with `t("generating")`.

### 3.21 `src/components/ProficiencyTest.jsx`
- `const isEs = supportLang === "es"` and `ui = translations[isEs ? "es" : "en"]` — change to `ui = translations[supportLang] || translations.en`. This single line propagates correct Italian to every `ui.*` lookup in the file.
- `uiStateLabel(uiState, isEs)` helper — change signature to accept `ui` dict object; use `ui.proficiency_speaking/listening/thinking` keys.
- All remaining `isEs ? ... : ...` JSX ternaries (40+) — replace with `ui.proficiency_test_*` keys.
- Data-driven `[isEs ? "es" : "en"]` accesses for `levelInfo.name`, `criterion`, rubric `row`, and `CEFR_LEVEL_OFFERINGS` — change to `[supportLang] || .en` pattern.

**Italian implementation note:** Done — `ui = translations[supportLang] || translations.en` one-line fix, `uiStateLabel` updated, all 40+ `isEs` ternaries replaced with `ui.*` lookups, data-driven language keys updated. 43+ new `proficiency_test_*` and `proficiency_*` keys added to `translations.en/es/it`.

### 3.21b `src/components/ProficiencyTestModal.jsx`
- Uses `const isEs = lang === "es"` with binary ternaries for all visible copy — import `t as tFn` and create a `ui = (key, vars) => tFn(lang, key, vars)` helper; replace all ternaries.

**Italian implementation note:** Done — `tFn` imported, `isEs` replaced with `ui` helper, all 6 visible-copy ternaries replaced.

### 3.21c `src/components/GettingStartedModal.jsx`
- Same `isEs` pattern; install step texts are in a `useMemo` array that hard-codes en/es copy.
- `handleCopyKey` toast title is a bare ternary.

**Italian implementation note:** Done — `tFn` imported, `isEs` removed, `installSteps` array uses `tFn(lang, "app_install_step*")`, toast uses `app_install_copied`, all JSX ternaries replaced. New keys: `app_install_subtitle`, `app_install_step6`, `app_install_got_it`, `app_install_copied` added to all three blocks.

### 3.21d `src/components/TutorialStepper.jsx`
- `MODULE_CONFIG` constant has `label`, `shortLabel`, and `description` objects with only `en` and `es` keys — add `it` to every entry.

**Italian implementation note:** Done — `it` added to all 6 module entries (vocabulary, grammar, reading, stories, realtime, game) for all three fields.

### 3.21f `src/components/LandingPage.jsx`
- Contains its own **component-local `translations` object** (completely separate from `src/utils/translation.jsx`) with only `en` and `es` entries.
- `copy = translations[lang]` has no fallback — crashes when `detectUserLanguage()` returns `"it"`.
- Language picker was a two-button `en`/`es` toggle — must be replaced with a menu/select supporting all supported UI languages.
- Add `language_it` key to `en` and `es` blocks, and author a complete `it` entry for all ~60 keys.

**Italian implementation note:** Done — full `it` block added covering all landing-page copy (nav, hero, features, values, scholarship, FAQ, CTA, sign-in, footer). `copy = translations[lang] || translations.en` fallback guard added. Language two-button toggle replaced with a styled `<select>` dropdown listing all three options (English / Español / Italiano) using a `LANG_OPTIONS` constant. `language_it` added to `en` and `es` blocks.

### 3.21e `src/components/TutorialActionBarPopovers.jsx`
- `BUTTON_EXPLANATIONS` array has `label` and `description` objects with only `en` and `es` keys — Italian users see a completely blank card body.
- `aria-label` / "Done" button copy uses binary `lang === "es"` ternaries.
- JSX reads `currentButton.label[lang]` / `currentButton.description[lang]` with no fallback — `undefined` for unknown languages.

**Italian implementation note:** Done — `it` entries added to all 6 button configs; `|| .en` fallback guards added to both JSX reads; Previous/Next/Done ternaries updated to include `"it"` branch.

### 3.21g `src/components/LinksPage.jsx` + `src/translations/linksPage.jsx`

**`linksPage.jsx`**: has a standalone `linksPageTranslations` object (separate from `src/utils/translation.jsx`). Only `en` and `es` blocks existed; add a full `it` block covering every key including the JSX `aboutContent` value. The `en` block is the authoritative key list — any key missing from `es` or `it` falls back to `en` via the `useLanguage` hook's `t()` helper (`translations[lang] ?? translations.en`).

**`LinksPage.jsx`**: consumes `useLanguage` for state; the old language picker was a Chakra `Switch` between "ENGLISH" / "SPANISH" labels centered in the page body — this is a binary control that cannot represent three languages. Replace the entire `<HStack>` + `<Switch>` block with a **fixed top-left Chakra `Menu`** component:
- `position: fixed; top: 18px; left: 16px; zIndex: 121` (positioned left of the existing theme-toggle at top-right).
- `MenuButton` shows only the selected language's flag emoji (from `getSupportLanguageOptions()`); no visible label text when collapsed.
- `MenuList` expands downward with `MenuOptionGroup` + `MenuItemOption` for each supported language (flag + label), matching the style used in `Onboarding.jsx` / `LandingPage.jsx`.
- Uses `setLanguage` from `useLanguage` (not `toggleLanguage`) so clicking any option sets the language directly.
- Import `Menu, MenuButton, MenuList, MenuOptionGroup, MenuItemOption` from `@chakra-ui/react` and `getSupportLanguageOptions` from `../constants/languages`.
- Remove the `Switch` import (no longer used).

**Italian implementation note:** Done — full `it` translation block added to `linksPage.jsx` (all 50+ keys, including JSX `aboutContent`). Switch/toggle removed; top-left `LanguageMenuFixed` component added using `getSupportLanguageOptions()`, `setLanguage` from `useLanguage`, and Chakra `Menu`/`MenuOptionGroup`/`MenuItemOption`. The `useLanguage` hook already handles Italian timezone auto-detection, so Italian-locale users who land on the `/links` page also see the correct language without any extra changes.

### 3.21i `src/components/RPGGame/index.jsx` + `scenarios.js`

The RPGGame has its own isolated UI text system — it does **not** use `translation.jsx`. All UI strings live in component-local dictionaries that must each have an `it` entry.

**Dictionaries in `index.jsx`** — add `it` block to each:
- `UI_TEXT` — all game-chrome strings (Skip, Continue, Correct, Incorrect, quest, mic, movement hints, music, Inventory, Drop, Thinking, translate/undo aria-labels, speech-continue fallback, wrong-item name, chooseCorrect prompt).
- `QUEST_LOG_COPY` — quest log title, button, task strings (all are functions or strings).
- `OBJECT_SEARCH_TEST_COPY` — NPC object-search dialogue (intro, wrongItem, success, chooseItem, foundItem, alreadyChecked, nothingFound, continueSearching).
- `GAME_LOADING_MESSAGES` — loading-screen messages array.

**Hardcoded `targetLang === "es"` / `supportLang === "es"` ternaries in `index.jsx`** — replace with `ui.*` lookups (all keys now in `UI_TEXT`):
- `chooseItem` / `continueSearching` fallbacks (use `objectSearchCopy.*` directly)
- `wrongItem` name in gather quest
- `speechContinue` fallback reply
- `aria-label` on Help button
- Inventory modal header, empty-inventory text, Drop button
- translate/undo-translation `aria-label`
- "Thinking..." text during NPC reply

**`scenarios.js` `normalizeQuestions()`** (line ~396) — `supportLang === "es" ? "Elige..." : "Choose..."` extended to three-way including `"it"`.

**Italian implementation note:** Done — `it` entries added to all four dictionaries; all 10 hardcoded ternaries replaced with `ui.*` lookups; `normalizeQuestions` extended to three-way. The LLM prompt construction in `scenarios.js` already used `getLanguagePromptName()` and worked for any language code — no changes needed there. The `GATHER_ITEMS_BY_MAP` gather-quest item pools (`en`/`es` only) remain English as a fallback since item names are target-language content, not support-language chrome.

### 3.21j RPGGame room names (`scenarios.js`, `worldGen.js`, `LoadingMiniGame.jsx`)

Room/area names displayed in the game HUD and loader are stored as `{ en, es }` name objects and looked up by `supportLang`. Adding `it` requires changes in three files:

**`scenarios.js` `MAP_NAME_BY_ID`** — static map names for the 5 built-in maps:
```js
{ en: "Greeting Plaza", es: "Plaza de Saludos", it: "Piazza dei Saluti" }
// likewise for livingRoom, park, airport, REVIEW_WORLD_ID
```

**`scenarios.js` — 4 call sites that build the `name` object** (lines ~2836, ~2963, ~3261, ~3320):
```js
{ en: getMapName(mapId, "en"), es: getMapName(mapId, "es"), it: getMapName(mapId, "it") }
```

**`worldGen.js` `WORLD_BLUEPRINTS`** — 8 blueprints (`home`, `market`, `library`, `transit`, `nature`, `civic`, `lab`, `festival`) each had `names: { en, es }` — `it` array added to all 8.

**`LoadingMiniGame.jsx` world generation** (lines ~571–591) — `outdoorName`, `indoor1Name`, `indoor2Name` objects were built with only `en`/`es` keys even though `OUTDOOR_NAMES` and `INDOOR_ROOM_TYPES[].names` already had `it` arrays. Added `it: pick(rng, ...)` to all three.

**`index.jsx` object-examine `mapName`** — was looking up `map.name?.[targetLang]` (the practice language) for LLM context. Changed to `map.name?.en` since the LLM prompt is in English regardless of target language.

**`activeAreaLabel`** in `index.jsx` already correctly reads `activeMap.name?.[supportLang]` — no change needed; it works automatically once the upstream name objects include the `it` key.

### 3.21h `src/components/SubscriptionGate.jsx` + `/subscribe` route

`SubscriptionGate.jsx` already uses a `supportCopy(lang, en, es, it)` helper and has inline Italian strings for the empty-input error, submit button text, and loading text. The gaps are in `translation.jsx` and `App.jsx`:

**`translation.jsx` `it` block** — add:
- `"passcode.instructions"` — JSX with intro sentence, benefit `<ol>`, and "Abbonati" / "Paga una volta" `<Button>` pair (mirroring the `en` block structure exactly).
- `invalid` — invalid-passcode message.
- `bannedTitle` / `bannedBody` — access-denied strings.
- `goToPatreon` / `passcodeLink` — Patreon link labels.

**`App.jsx` passcode submit handler** (~line 2958) — three binary `appLanguage === "es" ? "..." : "..."` ternaries that must be extended to three-way `"it" / "es" / default`:
1. "Subscription passcode is not configured" message.
2. "Passcode accepted" success toast title.
3. "Failed to save passcode" error message.

**Italian implementation note:** Done — all five `it` translation keys added; three App.jsx ternaries extended to include Italian.

### 3.22 `src/components/LoadingMiniGame.jsx`
- Inline language-dependent copy.
- Loader room names and interactable messages are data payloads, not regular UI strings. Add the new language to `OUTDOOR_NAMES`, every `INDOOR_ROOM_TYPES[].names`, and each message pool (`SIGN_MESSAGES`, `CHEST_MESSAGES`, `LAMP_MESSAGES`, `PLANT_MESSAGES`, `TABLE_MESSAGES`).

**Italian implementation note:** the loading minigame now includes Italian room names and interaction messages so conversation/realtime loaders do not fall back to English.

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

The `src/data/` tree is where most of the raw content lives. It splits into three families: **skill-tree lessons**, **flashcard decks**, and **alphabet bootcamps**. Every family currently encodes UI copy as `{ en: "...", es: "..." }` pairs. Adding a new support language means extending those pairs to `{ en, es, <code> }` and adjusting the readers that consume them.

### 5.1 Skill-tree lessons (`src/data/skillTree/` and `skillTreeData.js`)

Every CEFR-level file is in scope — they all follow the same schema:

| File                                        | `{ en, es }` pairs (approx) | Notes |
| ------------------------------------------- | --------------------------- | ----- |
| `src/data/skillTree/pre-a1.js`              | ~106                        | Lesson titles, descriptions, module copy |
| `src/data/skillTree/a1.js`                  | ~238                        | Also contains `successCriteria_<code>` strings for the tutorial lesson (~lines 71–86) |
| `src/data/skillTree/a2.js`                  | ~216                        | |
| `src/data/skillTree/b1.js`                  | ~180                        | |
| `src/data/skillTree/b2.js`                  | ~144                        | |
| `src/data/skillTree/c1.js`                  | ~120                        | |
| `src/data/skillTree/c2.js`                  | ~98                         | `SUPPORTED_TARGET_LANGS` (~lines 1424–1434) and `LEARNING_PATHS` (~lines 1440–1450) |
| `src/data/skillTree/index.js`               | —                           | Barrel export; confirm no inline copy |
| `src/data/skillTreeData.js`                 | —                           | `SUPPORTED_TARGET_LANGS` (~10898–10908) and `LEARNING_PATHS` (~10914–10924) |

Two shapes coexist inside the CEFR files — both must be extended:

1. **Inline bilingual objects** — used for titles, section descriptions, mode-card copy:
   ```js
   { en: "Getting Started", es: "Primeros Pasos" }
   ```
   Add `it: "Per iniziare"` (etc.) to every occurrence. Total footprint is ~1,100 pairs across the seven CEFR files.

2. **Flat `*_<code>` suffix keys** — used for realtime lesson success criteria and any other per-language metadata. Today these already cover `en, es, pt, fr, it, nl, nah, ja, ru, de, el, pl, ga, yua`. New languages must add their entry to every such key.

If a rendering helper reads these fields, make sure it falls back to English when the new code is missing. Do not silently fall back to Spanish — it regresses the English baseline.

**Italian implementation note:** `src/data/skillTree/italianLocalizer.js` is the current Italian coverage layer for both skill-tree data paths:
- The frontend-rendered legacy path: `src/data/skillTreeData.js`, which powers `SkillTree.jsx` through `getLearningPath(...)` / `getMultiLevelLearningPath(...)`.
- The seven split CEFR files in `src/data/skillTree/{pre-a1,a1,a2,b1,b2,c1,c2}.js`.

Each path applies `withItalianSkillTreeText(...)`, which recursively adds `it` to every `{ en, es }` object, including unit titles, unit descriptions, lesson titles, lesson descriptions, generated supplemental lessons, and `content.*.tutorialDescription`. `SkillTree.jsx` reads these through `getUIDisplayText(...)`, so both the skill-tree cards and `LessonDetailModal` render Italian when `appLanguage` is `it`. The CEFR level header is separate UI chrome in `CEFRLevelNavigator.jsx`; add the new language to its `CEFR_LEVEL_INFO` names/descriptions too.

When adding the next support language, either author the new key directly in each CEFR file or add an equivalent centralized data-localization pass. In both cases, run a recursive audit that confirms every `{ en, es }` object in `src/data/skillTreeData.js` and `src/data/skillTree/{pre-a1,a1,a2,b1,b2,c1,c2}.js` resolves the new key before marking the skill tree done.

### 5.2 Flashcard decks (`src/data/flashcards/` and `flashcardData.js`)

Each level file is a flat list of card objects of the shape `concept: { en, es }`.

| File                                     | Card count |
| ---------------------------------------- | ---------- |
| `src/data/flashcards/pre-a1.js`          | 100        |
| `src/data/flashcards/a1.js`              | 300        |
| `src/data/flashcards/a2.js`              | 250        |
| `src/data/flashcards/b1.js`              | 200        |
| `src/data/flashcards/b2.js`              | 150        |
| `src/data/flashcards/c1.js`              | 100        |
| `src/data/flashcards/c2.js`              | 50         |
| `src/data/flashcardData.js`              | ~400 legacy entries (deprecated path; still referenced) |
| `src/data/flashcards/common.js`          | — (reader + constants) |
| `src/data/flashcards/index.js`           | — (barrel) |

**Canonical count**: `CEFR_LEVEL_COUNTS` in `common.js:47` enumerates 1,150 cards across the CEFR levels; adding a new support language means adding `<code>: "..."` to every one of them.

**Reader (`src/data/flashcards/common.js`)**:
- `getConceptText(card, supportLang)` (lines 23–42) — the bilingual branch hard-codes `["en", "es"]` at line 35. Extend this list (or accept any valid support-language code) so cards rendered in "bilingual" mode include the new language.
- `CEFR_COLORS`, `CEFR_LEVELS`, `CEFR_LEVEL_COUNTS` — no change; they're language-agnostic.

**Italian implementation note:** `src/data/flashcards/italianLocalizer.js` is the current Italian coverage layer for flashcard concepts. `src/data/flashcardData.js` and every split CEFR deck in `src/data/flashcards/{pre-a1,a1,a2,b1,b2,c1,c2}.js` applies `withItalianFlashcardText(...)`, which adds `concept.it` for the card prompt shown in flashcard mode and flashcard practice modals. Audit both the legacy dataset and split decks; the frontend can render from either path depending on initial load, lazy-load success, and fallback state.

### 5.3 Alphabet bootcamps (`src/data/<lang>Alphabet.js`)

Only needed when the new language has a non-standard script or diacritics. Italian is Latin and does not need a bootcamp file, but the following exist as reference implementations:

- `dutchAlphabet.js`, `englishAlphabet.js`, `frenchAlphabet.js`, `germanAlphabet.js`, `greekAlphabet.js`, `irishAlphabet.js`, `italianAlphabet.js`, `japaneseAlphabet.js`, `nahuatlAlphabet.js`, `polishAlphabet.js`, `portugueseAlphabet.js`, `russianAlphabet.js`, `spanishAlphabet.js`, `yucatecMayaAlphabet.js`.

Each file must be registered in `AlphabetBootcamp.jsx` (`LANGUAGE_ALPHABETS` map, ~lines 1000–1012) and `LANGUAGE_SCRIPTS` (~lines 118–128).

**Italian implementation note:** `AlphabetBootcamp.jsx` has its own UI copy, language-name maps, script-name maps, and generated-practice-word prompt. It must be localized separately from `translations.<code>`. For Italian, the component now uses an Italian-aware `uiText(...)` helper, `LANGUAGE_NAMES_IT`, `LANGUAGE_SCRIPTS_IT`, and asks generated practice words for `meaning_it`. `src/data/alphabetItalianLocalizer.js` wraps every registered alphabet dataset with `soundIt`, `tipIt`, and `practiceWordMeaning.it`, so Dutch/German/Greek/etc. cards render their explanatory content in Italian instead of falling back to English. `src/data/italianAlphabet.js` still carries authored Italian card copy for the Italian bootcamp itself. When adding future support languages, audit `AlphabetBootcamp.jsx` for binary `appLanguage === "es"` branches and audit the target alphabet file/localizer for localized sound/tip/meaning fields.

### 5.4 Conversation topics (`src/data/conversationTopics.js`)

Another large `{ en, es }` payload (free-chat topic seeds, ~90+ entries starting at line 87). Extend to `{ en, es, <code> }` so Conversations can surface topics in the new support language. The consumer is `Conversations.jsx` via `languageNameFor` and the topic renderer.

### 5.5 Schema principles for new support languages

- Prefer additive keys: keep `en` and `es` untouched; add `<code>` alongside.
- When a translation is unknown, omit the key instead of guessing — readers fall back to `en`, which is the sane default.
- Any helper that does `text.en || text.es` is a bug magnet; migrate it to `text[supportLang] || text.en`.
- If a reader hard-codes `["en", "es"]` (as `common.js:35` does today), list it in the audit patterns in §8 and fix it as part of the rollout.

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
concept\[supportLang\] \|\| concept\.en
\{\s*en:\s*".*",\s*es:\s*".*"\s*\}
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
   - [ ] Verify HelpChatFab visible UI, not just its prompt/instruction language.
6. **App shell & settings**
   - [ ] Localize the mode menu and primary app navigation chrome in `App.jsx`.
   - [ ] Localize account/settings surfaces (`IdentityDrawer.jsx`, `ConversationAccountDrawer.jsx`, `BitcoinSupportModal.jsx`, subscription/payment gates).
7. **Per-module components**
   - [ ] Update every file in `§3.11`–`§3.24` above.
8. **Utilities & data**
   - [ ] Update every file in `§4` and `§5` above.
9. **Audit**
   - [ ] Run every pattern in `§8`; open a PR only when all hits are legitimate.
10. **Verification**
   - [ ] `npm run build` passes.
   - [ ] Manual smoke: onboarding → practice selection → mode menu → account/settings drawer → HelpChatFab → skill-tree card → lesson modal → a lesson → Conversations → RealTime session.
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
| `translations.it` top-level UI object          | Done |
| `supportLang` validation accepts `"it"`        | Done |
| `useLanguage.js` validation accepts `"it"`     | Done |
| Italian LLM prompt templates (`llm.js`, `GrammarBook.jsx`, `JobScript.jsx`) | Done |
| `Intl.DateTimeFormat` / `Intl.Collator` handles `it-IT` | Done |
| Mode menu / primary app navigation localized | Done |
| Account settings menu fully localized        | Done |
| HelpChatFab visible UI localized             | Done |
| Conversation/realtime UI and loaders localized | Done — `Conversations.jsx`, `RealTimeTest.jsx`, realtime `translations.it` keys, and `LoadingMiniGame.jsx` loader copy |
| Flashcard `concept` entries include `it`       | Done — `italianLocalizer.js` covers `flashcardData.js` and all seven split CEFR decks |
| Skill-tree `{ en, es }` pairs include `it`     | Done — `italianLocalizer.js` covers `skillTreeData.js`, generated lesson data, all seven CEFR split files, and lesson modal data |
| Alphabet bootcamp UI and all card content     | Done — `AlphabetBootcamp.jsx` UI copy plus `alphabetItalianLocalizer.js` coverage for all registered alphabet datasets |
| `conversationTopics.js` includes `it`          | Done |
| `flashcards/common.js` `getConceptText` bilingual list includes `it` | Done |
| `languageDetection.js` timezone + browser-language heuristics | Done — `ITALIAN_TIMEZONES` (`Europe/Rome`, `Europe/Vatican`, `Europe/San_Marino`) and `ITALIAN_LANGUAGE_CODES` already present; `detectUserLanguage()` returns `'it'` before falling back to `'es'` or `'en'`; `LandingPage.jsx` calls it on mount so Italian-locale users auto-land in Italian |
| Question UI in `Vocabulary.jsx`, `GrammarBook.jsx`, `FeedbackRail.jsx` fully localized | Done — all `userLanguage === "es" ? … : …` visible-chrome ternaries replaced with `t("key")` calls; 27 new `vocab_*` keys added to `translations.en/es/it` |
| `Stories.jsx` (role-play UI + loader lang detection), `RepeatWhatYouHear.jsx`, `TranslateSentence.jsx`, `LessonFlashcard.jsx` localized | Done — `useUIText` hook migrated to `t(uiLang, "story_*")` calls; `getAppUILang()` fixed to return `"it"`; 21+ role-play/repeat-hear/translate-sentence keys added; flashcard local dict extended with `it` entry + `generating` key. **Per-sentence support translation**: `supportLang` validation allow-list in `setProgress` (line ~269) was `["en","es","bilingual"]` — `"it"` added so the LLM is instructed to translate into Italian instead of silently falling back to English. |
| `ProficiencyTestModal.jsx` localized | Done — `isEs` removed; all 6 visible-copy ternaries replaced with `tFn(lang, key)` |
| `ProficiencyTest.jsx` localized | Done — `ui = translations[supportLang] \|\| translations.en`; `uiStateLabel` updated; all 40+ `isEs` ternaries replaced; data-driven language key accesses updated; 43+ `proficiency_test_*` keys added to all three blocks |
| `GettingStartedModal.jsx` localized | Done — `isEs` removed; installSteps array, toast, and JSX ternaries replaced with `tFn(lang, key)`; 4 new `app_install_*` keys added |
| `LessonGroupQuiz.jsx` generating-question loader | Done — binary ternary replaced with `t(userLanguage, "history_generating_question")` |
| `TutorialStepper.jsx` module labels/descriptions | Done — `it` added to all 6 entries in `MODULE_CONFIG` |
| `TutorialActionBarPopovers.jsx` (onboarding stepper cards) | Done — `it` added to all 6 `BUTTON_EXPLANATIONS` entries; JSX fallback guards added; blank-card bug fixed |
| `LandingPage.jsx` (full Italian landing + language menu) | Done — full `it` translation block authored; language toggle replaced with EN/ES/IT select menu; `translations[lang] \|\| translations.en` fallback added |
| `LinksPage.jsx` + `linksPage.jsx` translations (Italian + language menu) | Done — full `it` translation block (all 50+ keys including JSX `aboutContent`); Switch/toggle removed; top-left fixed Chakra `Menu` added (flag-icon-only collapsed, expands to flag+label list via `getSupportLanguageOptions`); `setLanguage` wired from `useLanguage` hook |
| `SubscriptionGate.jsx` + `/subscribe` route fully localized | Done — `"passcode.instructions"` JSX added to `translations.it` (intro text, benefit list, Abbonati/Paga una volta buttons); `invalid`, `bannedTitle`, `bannedBody`, `goToPatreon`, `passcodeLink` added to `it` block; three binary `appLanguage === "es"` ternaries in `App.jsx` passcode handler extended to include Italian (`"it"` branch: not-configured msg, accepted toast, save-failed msg) |
| `RPGGame/index.jsx` + `scenarios.js` UI fully localized | Done — `it` block added to `UI_TEXT`, `QUEST_LOG_COPY`, `OBJECT_SEARCH_TEST_COPY`, `GAME_LOADING_MESSAGES`; all 10 hardcoded `=== "es"` ternaries replaced with `ui.*` lookups; `normalizeQuestions` `chooseCorrect` string extended to three-way |
| RPGGame room/area names in Italian (`scenarios.js`, `worldGen.js`, `LoadingMiniGame.jsx`) | Done — `it` added to `MAP_NAME_BY_ID` + 4 call sites in `scenarios.js`; `it` arrays added to all 8 `WORLD_BLUEPRINTS` in `worldGen.js`; `LoadingMiniGame.jsx` world-gen now picks `it` from existing pools; object-examine `mapName` fixed to use `en` for LLM context |
| `LoadingMiniGame.jsx` object interaction messages | Done — world-gen message shuffle loop was building `{ en, es }` objects only; `it` key added so Italian sign/chest/lamp/plant/table messages are shown |
| RPGGame NPC dialogue language mixing (non-en/es targets) | Done — `scenarios.js` `L[tl] \|\| L.en` fallback replaced with a target-language-neutral object: `firstGreetings` uses LLM `storySeed` directly; `midGreetings`/`finalGreetings`/`npcHandoff` use NPC name only; `questComplete` → `"✓"`; `fallbackSpeech`/`speechContinue` → `null` so `index.jsx` falls through to `ui.noSpeechMatch`/`ui.speechContinue` (support language) |
| Daily goal celebration modal (`App.jsx`) | Done — 5 binary `appLanguage === "es"` ternaries extended to three-way: title, subtitle, "Goal" label, streak message, "Keep learning" button |
| Lesson complete celebration modal (`App.jsx`) | Done — 4 binary `appLanguage === "es"` ternaries extended to three-way: "Lesson Complete!", "XP Earned", "Experience Points", "Continue" |
| `LandingPage.jsx` sign-in "or" divider | Done — hardcoded `"or"` replaced with `{copy.signin_or}`; `signin_or` key added to `en` ("or"), `es` ("o"), `it` ("o") translation blocks |
| `SkillTree.jsx` game review loader messages | Done — `GAME_LOADING_MESSAGES` extended with `it` array (8 Italian messages); loader header gradient always dark (removed light-theme white override); text color fixed to `blue.100` regardless of theme |
| RPGGame LLM-generated map/room names in support language (`scenarios.js`) | Done — both `generateScenarioWithAI` prompt JSON shapes now include `"${supportLang}": "..."` in the `name` field when support lang is not `en`/`es` (so the LLM generates Italian names directly); `environment.names[lang]` array fallback fixed to use `[0]` instead of `String(array)` to avoid comma-joined names |
| `REVIEW_ROOM_BLUEPRINTS` static sub-room names (`scenarios.js`) | Done — all 24 static review-world sub-room specs (home, market, library, transit, nature, civic, lab, festival × 3 rooms each) now include `it` translations so the HUD area label shows Italian names instead of falling back to English |
| RPGGame hub room name (`scenarios.js`) | Done — `generateScenarioWithAI` was computing a correct `processedName` (with `it`) on the outer scenario object but leaving `hubMap.name` pointing at raw `environment.names` (blueprint arrays). Fixed by extracting `processedName` first and assigning it to `hubMap.name` before the return, so both the outer scenario and the in-`maps[]` hub map share the same resolved string object |

Treat the "Partial" rows as the working TODO for Italian — they become the acceptance criteria for shipping Italian as a full support language.

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
| Skill tree data files                  | 10 (`skillTreeData.js` + `skillTree/{pre-a1,a1,a2,b1,b2,c1,c2,index,italianLocalizer}.js`) |
| Flashcard data                         | 10 (`flashcardData.js` + `flashcards/{pre-a1,a1,a2,b1,b2,c1,c2,common,index,italianLocalizer}.js`) |
| Conversation topics                    | 1 (`conversationTopics.js`) |
| Alphabet bootcamp data/localizers       | 1–2 (`alphabetItalianLocalizer.js`; `<lang>Alphabet.js` only if new script; Italian uses `italianAlphabet.js`) |
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
