# Support Language Expansion

This document is the authoritative catalog of every file, function, component, and data structure that must be touched to add a new **support / app UI language** (the language the app chrome, instructions, feedback, and LLM meta-prompts are rendered in) to Nosabos.

It is intentionally exhaustive so the same playbook can be reused for every future language. Italian (`it`) is the reference completed rollout, French (`fr`) is the first regression-hardening pass, and the patterns apply to any additional BCP-47 code (`de`, `el`, `pl`, `ga`, `yua`, …).

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
- The **collapsed** bottom action-bar pill is its own smoke target. Its visible label must come from the same localized mode-menu copy as the expanded menu; do not leave a hardcoded `Menu` string in the minimized state.
- `Intl.Collator(appLanguage === "es" ? "es" : "en")` (line ~648) — generalize to the new code.
- Firestore validation for `supportLang` (~line 3357) currently `["en", "es"].includes(...)` — must include the new code.
- Firestore validation for `targetLang` (~lines 2413–2427 and ~2539–2555) — include the new code.
- `ALPHABET_LANGS` arrays — both occurrences (~lines 1604–1616 and ~5012–5024).
- Inline `appLanguage === "es" ? … : …` ternaries scattered across the file (629, 682, 689, 938, 1016, 1042, 1055–1058, 1505, 1669–1670, 1807–1808, 2322, 2337–2342, …). Convert to translation keys or a `uiText(en, es, it)` helper.
- Default settings that are stored as user-editable strings, especially the voice/persona prompt, must be treated as localized defaults. When the support language changes, swap the default persona to the new language immediately; if the user has edited the persona to a custom value, preserve it exactly.
- Keep support-language tier metadata separate from practice-language tier metadata when needed. A language can be stable as a support/app language while still being tagged `beta` for practice, and support-language pickers must not inherit the practice-only `(beta)` label.
- When option labels already include a tier tag from `getPracticeLanguageOptions()` / `getSupportLanguageOptions()`, do not append another manual ` (beta)` suffix in the drawer/menu renderer. The account/settings drawer is a required smoke target for accidental `(beta)(beta)` duplication.

**Voice/persona implementation note:** `App.jsx` and `Onboarding.jsx` now detect the known default persona strings across `en`/`es`/`it` and localize those defaults before rendering, refilling, onboarding-save, and settings persistence. Empty strings are treated as intentional custom edits instead of "restore the default." The settings drawer also keeps active text drafts for debounced persona/help-request saves so a delayed user-progress refresh cannot revert partially deleted text while the user is typing.

### 3.6 `src/components/Onboarding.jsx`
- Support language selector (lines 89–147) — use `getSupportLanguageOptions()` and drop the binary `supportLang === "es" ? "es" : "en"` collation on line 147.
- Practice language menu — ensure new language is rendered with its tier tag.
- Onboarding step tabs / section labels are visible chrome and must be localized: `LANGUAGES`, `VOICE`, `EFFECTS`, progress labels, card titles, card descriptions, and any aria labels/tooltips attached to the tabs.
- Navigation buttons must be localized through shared translations or local `uiText(...)`: `Back`, `Next`, `Finish`, disabled/loading variants, and aria labels. Do not leave the bottom button row in English when the page body is localized.
- Voice activation / VAD slider copy must localize both the setting label and the live value suffix. Audit strings such as `seconds`, `(seconds)`, and `1.2 seconds` separately; value suffixes are often built outside normal translation keys.
- If onboarding has component-local copy, keep it in lockstep with `translations.<code>` and test the whole onboarding flow in the new support language, not just the first language-picker screen.

### 3.7 `src/components/Conversations.jsx`
- `languageNameFor` (~lines 743–754) — handle the new code.
- Strict language instruction block (~lines 1105–1136) — add native-language "respond ONLY in X" string.
- `languageName` ternary chain (~lines 1215–1232).
- Inline Spanish-vs-English status text (lines 869–872, 2741, 2753, 2784–2797, 2829, 2921, 3013, 3078, 3084–3087, 3132, 3166).
- Support-language normalization must include the new code. If the resolver only accepts `en`/`es`, the whole conversation UI will silently fall back to English even when `supportLang` is correct.
- Visible conversation chrome includes settings button text, chat-log labels, generating-topic copy, topic shuffle aria labels, suggestion aria labels, level/XP labels, start/end buttons, replay labels, and transcript modal titles.
- Regression note: the conversation header/footer controls are easy to miss because the lesson content itself can already be localized while the surrounding chrome is not. Smoke-test the settings button label, the `Level {n}` / XP strip, and the bottom `Start` / `End` button in the new support language.

**Italian implementation note:** `Conversations.jsx` now accepts `it`/`it-*`/Italian aliases in its local resolver and reads the visible chrome from `translations.it` keys such as `ra_conversation_settings`, `ra_chat_log`, `ra_generating_topic`, `ra_btn_start`, `ra_btn_end`, `ra_btn_replay`, and `ra_label_level`.

**Support-language routing note:** Conversation-turn translations must resolve against the active app/support language, not a stale profile fallback. Use the shared support-language resolver/prompt helpers and persist per-message `translationLang` metadata so Hindi/Portuguese/French/etc. support text does not silently fall back to English or keep rendering an old gloss after the user switches the app language.

### 3.8 `src/components/RealTimeTest.jsx`
- `buildLanguageInstructions` strict block (~lines 1905–1930).
- `goalLangName` maps — BOTH occurrences (~lines 1265 and ~1473).
- `probeText` voice-updated message (~lines 2095–2107).
- `props` validation list (~line 964).
- Visible lesson-realtime chrome includes goal buttons, skip/next, chat-log modal title, replay labels, auto-stop toast, translation-failed toast, free-practice toast, and loading/generating text.
- Regression note: the bottom realtime control row (`Skip`, `Connect`, `End`, `Next`) is a distinct audit surface. It can stay in English even after the transcript modal, goals, and toasts are localized if the local support-language resolver still only accepts `en`/`es`.

**Italian implementation note:** `RealTimeTest.jsx` now uses the shared `translations.it` realtime keys for these visible labels instead of local English/Spanish ternaries.

**Support-language routing note:** Realtime message/goal translations must use the same shared support-language resolver as `Conversations.jsx`, and rendered support text must be gated by the stored `translationLang` for that turn. Otherwise the Gemini/OpenAI call can succeed while the UI still shows English or mismatched-language support text under Hindi/Portuguese/etc. shells.

### 3.9 `src/components/HelpChatFab.jsx`
- `nameFor` helper in TWO places (~lines 278–285 and ~580–588).
- The **entire help chat UI** must be localized, not only language names and instructions. Audit saved-chat list copy, empty states, toast titles/descriptions, connection errors, delete/new/save actions, menu buttons, tooltip labels, morph/morpheme mode labels, message placeholders, attachment/action labels, timestamps, and any inline `appLanguage === "es" ? … : …` branches.
- Required visible-string smoke targets: `Your chats`, `No saved chats`, `Save chat`, `New chat`, `Morpheme mode`, `Break down words`, `What do you want to learn today?`, `Ask about this lesson...`, close/save/delete tooltips, microphone/send labels, and any collapsed FAB labels.
- Realtime/system instructions should use the new support language, while visible help-chat chrome should read from `translations.<code>` or a local `uiText(en, es, <code>)` helper.

### 3.10 `src/components/ConversationSettingsDrawer.jsx`
- Support language picker — ensure it reads from `getSupportLanguageOptions()` and not a hard-coded `[en, es]` list.
- Conversation settings labels, placeholders, button text, section headings, helper copy, and reset/save actions must be localized.

### 3.11 `src/components/History.jsx`
- `useSharedProgress` validation list (~line 309), component-level validation (~line 712).
- `LANG_NAME` (~lines 156–166), `localizedLangName` (~lines 741–752).
- BCP47 mapping (~line 681+).
- History/reading voice-orb loaders must be localized independently from the speech-evaluation rubric. Audit all `VoiceOrb` / read-aloud state captions such as `Listening...`, `Reading...`, `Thinking...`, `Generating...`, retry/error labels, and any `uiStateLabel(...)` helpers used by the reading module.
- Reading/speech evaluation is only partially localized. `SPEECH_CRITERIA` still defines `en`/`es` labels only, and the rendered criterion label still uses `criterion[userLanguage === "es" ? "es" : "en"]`, so Italian falls back to English labels (`Accuracy`, `Completeness`, etc.). Add `it` labels and switch the lookup to `criterion[supportLang] || criterion.en`.
- The `gradeSpeechAttempt()` LLM prompt asks for the summary in `supportName`, but the per-criterion `scores.*.note` fields are not explicitly required to be in the support language and the JSON example uses English placeholders. Update the prompt so `summary` **and every criterion note** are written in the support language, and localize the fallback error summary beyond the current English/Spanish ternary.

**Italian implementation note — speech evaluation:** Done.
1. `SPEECH_CRITERIA` now includes `it` for all six entries (`Precisione`, `Completezza`, `Pronuncia`, `Fluidità`, `Sicurezza`, `Comprensione`).
2. Criterion label lookup changed from `criterion[userLanguage === "es" ? "es" : "en"]` to `criterion[supportLang] || criterion.en`.
3. `gradeSpeechAttempt()` prompt updated with an explicit `LANGUAGE REQUIREMENT` block instructing the LLM to write the summary and every criterion note in `${supportName}`; the JSON example placeholders updated to say `"[reason in ${supportName}]"` so the LLM cannot default to English.
4. Error fallback changed from `userLanguage === "es"` binary ternary to a three-way `supportLang` check covering `es`, `it`, and English default.

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
- Patreon/support card copy is part of the settings surface. Localize `Join us on Patreon`, its subtitle/helper text, `Join` button, loading/disabled states, and external-link aria labels.
- Display-name accordion copy must be fully localized: accordion heading, input label/placeholder, `Save` button, save/loading/error/success toasts, and validation text.
- Bitcoin wallet accordion/modal copy must be fully localized: `Bitcoin wallet`, contribution explanation, `Choose a recipient`, recipient labels, `Select an option to enable deposits.`, `Create wallet`, wallet-created/loading/error states, and every helper line shown before/after wallet creation.

Do not treat account settings as localized just because `translations.<code>` exists. Manually open the account/settings drawer in the new support language and verify every visible label.

**Italian implementation note:** `Account` is acceptable Italian product terminology for the settings account tab. Deeper identity drawer copy still uses Italian strings for actions, warnings, and helper text.

### 3.17 `src/components/DailyGoalModal.jsx`
- `Intl.DateTimeFormat` locale (~lines 142–143 and ~558).

### 3.18 `src/components/Randomize.jsx`
- `useSharedProgress` (~line 105) — include new code in validation list.

### 3.18a `src/components/RealWorldTasksModal.jsx` / Immersion drawer
- Immersion practice chrome must be localized separately from the task data. Audit drawer title/header (`Immersion Practice`), subtitle/count copy (`3 tasks to use your language outside the app`), timer labels (`Next batch in`, remaining time), progress labels, empty states, error states, loading states, and refresh/retry copy.
- Task titles/descriptions may come from localized data or the LLM, but the surrounding controls cannot fall back to English. Localize checkbox aria labels, completed-state copy, disabled reasons, and any claim/reward copy.
- Claim flow is a required smoke target: `Claim +50 XP`, claim-loading text, already-claimed text, success toast, failure toast, and disabled-button text must all resolve through support-language-aware copy.

### 3.19 `src/components/AlphabetBootcamp.jsx`
- `LANGUAGE_ALPHABETS` map (~lines 1000–1012) and `LANGUAGE_SCRIPTS` map (~lines 118–128). For Italian specifically, no new alphabet file is required (Latin), but the entry must be present.
- Alphabet card contents are separate from the bootcamp chrome. The rendered card uses `soundIt`, `tipIt`, and `practiceWordMeaning.it` when `appLanguage === "it"`. Do not stop after localizing headings/buttons.
- The card face also renders `letter.name`. Adding `sound<code>` / `tip<code>` alone is not enough; either add `name<code>` or suppress unresolved names so the bootcamp does not leak raw English letter labels like `I met trema`.
- Japanese regression note: a tiny token-based localizer over `soundEs` / `tipEs` produced mixed Japanese/English/Spanish strings in production (`I met trema`, `Considered one letter in Dutch`, `Se pronuncia...`). For support-language localizers, prefer `sound` / `tip` English source copy as the canonical fallback, then run a runtime audit against `name<code>`, `sound<code>`, and `tip<code>` for mixed-language outputs, not just missing fields.
- Hybrid output is itself a release blocker. If a generated `sound<code>` / `tip<code>` still contains stitched English scaffolding (`Unique Dutch diphthong`, `Say 'ee' with rounded lips`, `... uses IJ`, etc.), do not render it. Either provide an authored/full translation or suppress the field until the localized copy is complete.
- Do not "fix" hybrid output by blanking legitimate instructional copy. Exact or pattern-based localized tips that still contain quoted sample words, transliterations, named phrases, or pedagogical cognates (`'Slawn-cha'`, `Dia is Muire duit`, `toast`, example words in quotes) are valid teaching text and must keep rendering. Every bootcamp pass needs both a mixed-language audit and a missing-copy audit for `sound<code>` / `tip<code>`.
- Practice-word glosses are a separate acceptance check from the card headline/body. If `practiceWordMeaning.<code>` cannot be resolved cleanly, do not surface the raw English/Spanish fallback on the Japanese card back.
- Bootcamp card copy must resolve through a single support-language field map. Do not let `AlphabetBootcamp.jsx` live-translate `sound` / `tip` / `name` at render time with ad hoc `appLanguage === "es" ? ... : ...` branches or cross-language fallbacks. The component should read `name<code>`, `sound<code>`, `tip<code>`, and `practiceWordMeaning.<code>` directly from the localized payload and render blank when the support-language field is missing.
- Treat support-language source preference as part of the contract. Different localizers may use different canonical source fields (`sound` vs `soundEs`), but that decision belongs inside the localizer, never inside the React component. A French localizer that accidentally prefers `soundEs` will leak Spanish when switching target alphabets; a Japanese localizer that falls back to `sound` after a failed translation will leak English. Keep source selection in the data layer and verify it there.
- Alphabet Bootcamp must be audited as a matrix, not a single-language smoke test. For every new support language, verify at least one phrase-heavy alphabet (Irish), one Latin alphabet with lots of pronunciation notes (Dutch or German), one authored target alphabet (Spanish/Japanese/Italian), and one non-Latin alphabet (Russian/Greek). A rollout is not complete until `name`, `sound`, `tip`, and `practiceWordMeaning` stay in the support language across that matrix.
- Hindi regression note: token replacement alone was not enough for Bootcamp tips. Exact phrase patterns such as `Same as English B.`, `Same sound as U.`, `Only appears in 'où'...`, and trema/nasal explanations needed explicit localizer rules in `alphabetHindiLocalizer.js` or the card shipped stitched English/Hindi support text even though `soundHi` / `tipHi` fields technically existed.
- Hindi regression note: do not close Alphabet Bootcamp work after fixing the reported target language only. Run the mixed-output audit across **every registered target alphabet dataset** (`english`, `spanish`, `portuguese`, `french`, `italian`, `dutch`, `german`, `japanese`, `russian`, `greek`, `polish`, `irish`, `nahuatl`, `yucatec_maya`) because Hindi leaks were resurfacing in untouched decks like Japanese even after French-specific fixes looked correct.
- Bootcamp parity is measured against existing support languages, not just against "some localized output exists". When a new support language is added, compare its representative-matrix coverage against Spanish/French/Italian and treat big blank deltas as a blocker. Japanese looked "partially localized" while still failing Dutch / Irish / Italian / Russian card content.
- Do not assume one support-language localizer is "done" because another support language renders the same target alphabet correctly. Spanish/French/Italian/Japanese localizers must each pass their own representative-matrix audit; French rendering an Irish tip does not prove Japanese does.
- Run both audits on the localized bootcamp payload before signoff: `blank-field audit` (`sound<code>` / `tip<code>` missing where source copy exists) and `mixed-output audit` (raw English/Spanish or specialist source labels leaking into support-language text). Passing only one of the two is not enough.
- Mixed-output audit must also catch untranslated pedagogy labels and specialist shorthand, not just obvious English sentences. Raw source terms like `broad`, `slender`, `lenition`, `H muet`, `H aspiré`, `uvular`, or unwrapped example tokens (`que`, `qui`, `kilo`) still count as support-language failures unless they are intentionally translated or localized for the learner.

### 3.20 `src/components/LessonFlashcard.jsx` / `FlashcardPractice.jsx` / `FlashcardSkillTree.jsx`
- FlashcardSkillTree: `Intl.DateTimeFormat` (lines 139, 197) — replace with shared locale helper keyed on `appLanguage`.
- LessonFlashcard / FlashcardPractice: practice-language normalization must stay independent from support-language normalization — use `normalizeSupportLanguage` / `normalizePracticeLanguage` helpers.
- LessonFlashcard has a **component-local `t()` dict** (not the shared `translation.jsx` helper) — add the new language entry to all keys in that dict, including the `generating` loading-state key.
- FlashcardPractice correct-answer footer must localize the progress strip (`Level {level}` / `Total XP {xp}`) through `translations.<code>` keys instead of hardcoded English.

**Italian implementation note:** `LessonFlashcard.jsx`'s local dict was extended with an `it` entry for all flashcard UI strings and a new `generating` key (en: "Generating flashcard...", es: "Generando tarjeta...", it: "Generazione scheda..."). The loading text ternary `userLanguage === "es" ? ... : ...` was replaced with `t("generating")`.

**Italian flashcard footer note:** `FlashcardPractice.jsx` now uses `flashcard_xp_level` and `flashcard_total_xp` translation keys for the correct-answer level/XP strip, so Italian renders `Livello {level} • XP totali {xp}` rather than hardcoded `Level … • Total XP …`.

### 3.21 `src/components/ProficiencyTest.jsx`
- `const isEs = supportLang === "es"` and `ui = translations[isEs ? "es" : "en"]` — change to `ui = translations[supportLang] || translations.en`. This single line propagates correct Italian to every `ui.*` lookup in the file.
- `uiStateLabel(uiState, isEs)` helper — change signature to accept `ui` dict object; use `ui.proficiency_speaking/listening/thinking` keys.
- All remaining `isEs ? ... : ...` JSX ternaries (40+) — replace with `ui.proficiency_test_*` keys.
- Data-driven `[isEs ? "es" : "en"]` accesses for `levelInfo.name`, `criterion`, rubric `row`, and `CEFR_LEVEL_OFFERINGS` — change to `[supportLang] || .en` pattern.
- The generated assessment content is only partially localized. The grading prompt is still authored in English and only produces a generic JSON schema with English placeholders; it does not require `summary` or `scores.*.note` to be written in `supportLang`. Add a `supportName`/support-language instruction block and require all learner-facing generated text in the assessment JSON to be in the support language.
- The pronunciation fallback phrase is hardcoded as the exact English string `"Insufficient audio evidence."`. Add a localized fallback per support language or avoid exact English text in learner-facing fields.

**Italian implementation note:** Done — visible UI chrome was already localized; generated assessment prose and rubric rows are now also localized:
1. `ASSESSMENT_CRITERIA` updated with `it` labels for all six entries (`Pronuncia`, `Grammatica`, `Vocabolario`, `Fluidità`, `Sicurezza`, `Comprensione`); the existing `criterion[supportLang] || criterion.en` lookup in JSX picks them up automatically.
2. `runAssessment()` now derives `supportName` from a shared `LANG_MAP` constant (consolidated from the old separate `langName` map), then injects a `LANGUAGE REQUIREMENT` block into the prompt instructing the LLM to write the `summary` and every criterion `note` in `${supportName}`; JSON example placeholders updated to `"[reason in ${supportName}]"`.
3. `insufficientAudioMsg` lookup table added for all supported languages; the hardcoded English `"Insufficient audio evidence."` string in the prompt replaced with `${insufficientAudioMsg}`.
4. `rubricRows` array (the CEFR level description table rendered in the rubric drawer) — each of the 7 rows had only `en`/`es` keys; `it` added to all entries. The existing `row[supportLang] || row.en` JSX lookup picks them up without further changes. For future support languages, add a key to every `rubricRows` entry alongside `en` and `es`.
5. The rubric drawer intro paragraph (`ui.proficiency_test_rubric_desc`) is a separate translation key from the row table. Future support-language rollouts must patch both the intro copy and every `rubricRows.<lang>` entry together or the drawer will ship mixed-language content.

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
- Add `language_<code>` keys for **every practice-language card** (`nl`, `en`, `fr`, `de`, `it`, `pt`, `es`, `nah`, `yua`, `el`, `ja`, `ru`, `pl`, `ga`) in every support-language block. The landing-page practice grid is a separate surface from the support-language dropdown; localizing only the dropdown still leaves the 14-card language list in English.
- Author a complete `<code>` entry for all ~60 landing-page copy keys.

**Italian implementation note:** Done — full `it` block added covering all landing-page copy (nav, hero, features, values, scholarship, FAQ, CTA, sign-in, footer). `copy = translations[lang] || translations.en` fallback guard added. Language two-button toggle replaced with a styled `<select>` dropdown listing all three options (English / Español / Italiano) using a `LANG_OPTIONS` constant. `language_it` added to `en` and `es` blocks.

**Label-localization wiring note:** `LanguageMenu` must pass the active locale dictionary to `getSupportLanguageOptions` so the option labels are localized, not just the selected language code. Use `getSupportLanguageOptions({ ui: translations[lang] || translations.en, uiLang: lang })`. The practice-language grid must do the same with `getPracticeLanguageOptions({ ui: translations[lang] || translations.en, uiLang: lang })` and render `langOption.label`, not `LANGUAGE_FALLBACK_LABELS[langOption.value]`. Without the `ui` argument, `buildLanguageOptions` falls through to `LANGUAGE_FALLBACK_LABELS` (English) and the dropdown/cards read "English / Spanish / Italian" regardless of `lang`. Label convention matches `src/utils/translation.jsx`: each locale spells every language name in *its own* language (`en` → `English` / `Spanish` / `Italian`; `es` → `Inglés` / `Español` / `Italiano`; `it` → `Inglese` / `Spagnolo` / `Italiano`; `fr` → `Anglais` / `Espagnol` / `Italien`). Do **not** use native names (e.g. `Español` inside the English block) unless the design explicitly asks for native display names.

**Tier-display note:** the landing-page support-language menu must not show practice-only tier tags. Japanese support language is stable, so the support menu label should not render `(beta)` there even if Japanese practice remains tagged elsewhere. Also audit the post-login practice-language card grid: if the card UI already renders a visible `Beta` badge, the label text itself should not also include a second `(beta)` suffix.

**Hidden-fallback note:** if a locale is authored as `translations.<code> = { ...translations.en, ...overrides }`, missing keys silently leak English instead of failing loudly. Do a key-for-key audit against the English landing-page block before signoff; screenshots alone are not enough.

**Japanese regression note:** the Japanese landing block once stopped after `feature_goals_desc`, omitted `feature_notes`, `feature_immersion`, `feature_assistant`, `feature_flashcards_spaced`, `feature_game_review`, `feature_proficiency_test`, `feature_phonics`, `value_1` through `value_4`, `scholarship_title_accent`, and `scholarship_note`, and used an unused `value_adaptive/value_voice/value_private` schema that the renderer never reads. That left the lower capability-card grid, the "How learning works" numbered bullets, and the scholarship title/note partially in English while the surrounding headings were Japanese. Treat those three landing-page sections as explicit acceptance tests for every future support language.

**Split-heading note:** the scholarship headline renders `scholarship_title` and `scholarship_title_accent` as two separately styled spans on one line. Translate them as a pair so the grammar still reads naturally in the target language; do not assume English word order survives the accent split.

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

**Label-localization wiring note:** `LanguageMenuFixed` must receive the active locale dictionary and forward it to `getSupportLanguageOptions`. `LinksPage` already computes `translations = t(linksPageTranslations)` via `useLanguage().t`; pass it as a `translations` prop (alongside `language`) and call `getSupportLanguageOptions({ ui: translations, uiLang: language })` inside the menu. Required dictionary keys on every locale block in `src/translations/linksPage.jsx`: `language_en`, `language_es`, `language_fr`, `language_it`, spelled in the *UI* language — `en` block: `English / Spanish / French / Italian`; `es` block: `Inglés / Español / Francés / Italiano`; `it` block: `Inglese / Spagnolo / Francese / Italiano`; `fr` block: `Anglais / Espagnol / Français / Italien`. This matches the convention in `src/utils/translation.jsx`. Without these keys, `buildLanguageOptions` falls through to `LANGUAGE_FALLBACK_LABELS` (English) and the dropdown displays English labels on every UI locale.

**Flag-swatches note:** `LanguageMenuFixed` also maintains a separate `SUPPORT_LANGUAGE_FLAG_SWATCHES` map for the collapsed top-left flag button. Adding a new support language is not complete until this swatch map includes the new code; otherwise the menu can show the correct label list while still rendering the wrong flag.

**Language icon rendering note (mobile):** Do not wrap the flag SVG in a Chakra `<Text>` inside the `IconButton`'s `icon` prop. `Text` renders as `<p>`, which is invalid inside `<button>` and causes the icon to intermittently fail to paint on mobile WebKit. Wrap in `<Box as="span" display="inline-flex" …>` with an explicit 24×24 size and `"& svg": { width, height, display: "block" }` so the SVG always lays out.

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

**Object-examine reliability note:** The object-read panel must never stay spinner-only while an examine request is in flight. Seed `objectExamine` with immediate fallback/support copy from `buildFallbackObjectExamineText(...)`, keep the loading orb as a secondary indicator, and ensure every completion/fallback path clears `pending` for the currently open object even when the active request is a map-level preload that started before the click.

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

**`LoadingMiniGame.jsx` runtime message map** — do not stop at the authored `SIGN_MESSAGES` / `CHEST_MESSAGES` / `LAMP_MESSAGES` / `PLANT_MESSAGES` / `TABLE_MESSAGES` pools. The generated `world.messages` object must also carry **every support language key** at runtime. A previous regression left Portuguese out of this shuffle step, so the authored `pt` strings existed on disk while review loaders still fell back to English in production. Prefer iterating over `SUPPORT_LANGUAGE_CODES` instead of hand-writing `{ en, es, it, ... }` objects here.

**`index.jsx` object-examine `mapName`** — was looking up `map.name?.[targetLang]` (the practice language) for LLM context. Changed to `map.name?.en` since the LLM prompt is in English regardless of target language.

**`index.jsx` object-examine fallback copy** — `buildFallbackObjectExamineText(...)` is a learner-visible support-language surface. Localizing the generated `supportName` / `supportText` prompt is not enough; if generation fails or omits those fields, the fallback/merge path must still populate `supportName` and `supportText` in the support language instead of leaking English.

**`index.jsx` object click targeting** — examine interactions must use `findScenarioObjectAtTile(...)` hitboxes, not exact anchor-tile matching, for pointer/tap input. Large sprites such as shelves/bookcases can occupy multiple visible tiles; exact matching makes the user hit a blocked solid tile and see the red `X` instead of opening the object-read panel.

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
- Regression note: the authored message pools are not the full contract. The generated `world.messages` shuffle loop must also preserve the new support language. If that loop only rebuilds `{ en, es, it }`, Portuguese/French/Japanese loaders will still show English even though their message arrays exist above.

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

Tutorial / realtime goal UI is a separate required audit. Any learner-visible goal, objective, or criteria line must read the localized suffix field (`successCriteria_<code>`, localized goal text, or equivalent) before falling back to English. Search for renderers that print `successCriteria`, `criteria`, `goal`, or tutorial objective text directly; a localized UI can still leak English data strings such as `The learner says hello.` if the renderer ignores `successCriteria_fr`.

**Italian implementation note:** `src/data/skillTree/italianLocalizer.js` is the current Italian coverage layer for both skill-tree data paths:
- The frontend-rendered legacy path: `src/data/skillTreeData.js`, which powers `SkillTree.jsx` through `getLearningPath(...)` / `getMultiLevelLearningPath(...)`.
- The seven split CEFR files in `src/data/skillTree/{pre-a1,a1,a2,b1,b2,c1,c2}.js`.

Each path applies `withItalianSkillTreeText(...)`, which recursively adds `it` to every `{ en, es }` object, including unit titles, unit descriptions, lesson titles, lesson descriptions, generated supplemental lessons, and `content.*.tutorialDescription`. `SkillTree.jsx` reads these through `getUIDisplayText(...)`, so both the skill-tree cards and `LessonDetailModal` render Italian when `appLanguage` is `it`. The CEFR level header is separate UI chrome in `CEFRLevelNavigator.jsx`; add the new language to its `CEFR_LEVEL_INFO` names/descriptions too.

`SkillTree.jsx` also has a separate review-game loader surface inside `LessonDetailModal`: its local `GAME_LOADING_MESSAGES` table is independent from `LoadingMiniGame.jsx`. Audit that table for every support language (`pt`, `fr`, `ja`, and future additions) instead of assuming the loading minigame copy covers the review modal too.

**French implementation note:** `src/data/skillTree/frenchLocalizer.js` must be treated as a full coverage layer, not a small phrase glossary. The French rollout originally left most Pre-A1 through C2 unit/lesson titles in English (`People & Family`, `My Family`, etc.). The corrected localizer now recursively covers all seven split CEFR files and adds `fr` to 1,100 `{ en, es }` objects plus all 13 `successCriteria_fr` strings. For the next support language, run the audit in §8 and require `frSame/newCodeSame = 0` for skill-tree objects before calling the tree complete.

`LessonDetailModal` also has action/loading chrome outside the data-localized lesson objects. The standard lesson start button must use a dedicated translation key (`skill_tree_starting_lesson`) for its loading state and resolve it from `supportLang`; otherwise Italian users can see English/generic loading text while the lesson is starting. Keep `generic_loading` present in every support-language block as a fallback for shared loaders.

When adding the next support language, either author the new key directly in each CEFR file or add an equivalent centralized data-localization pass. In both cases, run a recursive audit that confirms every `{ en, es }` object in `src/data/skillTreeData.js` and `src/data/skillTree/{pre-a1,a1,a2,b1,b2,c1,c2}.js` resolves the new key before marking the skill tree done.

**Comprehensiveness note:** lesson-node titles and unit descriptions must be localized across the entire A0/Pre-A1 through C2 tree, not just the beginner levels. A centralized localizer is acceptable, but the renderer should also have a support-language-aware fallback so a missing `ja` object key does not leak English lesson nodes (`Zero to Five`, `Count from zero to ten`, etc.) in production.

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

**French implementation note:** `src/data/flashcards/frenchLocalizer.js` now covers all 1,150 split CEFR cards from Pre-A1 through C2, including the B2 idiom deck that was visibly falling back to English (`It costs an arm and a leg`, `Break a leg`, etc.). Equality-based audits will still flag true French cognates and unchanged forms (`taxi`, `visa`, `culture`, `six`, `orange`, etc.), so verify either that the key is explicitly present in the localizer or that the identical spelling is intentional. Do not mark the rollout complete while the first card in any level still displays its English `concept.en` as the support-language prompt.

**Renderer fallback note:** flashcard mode must not rely exclusively on pre-expanded `concept.<code>` fields. Add a support-language-aware fallback in both the legacy `flashcardData.js` reader and the split-deck `flashcards/common.js` reader so a missing `concept.ja` is translated before the UI falls back to English. Run an audit against all unique concept strings and require zero unintended English fallbacks before declaring flashcards complete for the new support language.

### 5.3 Alphabet bootcamps (`src/data/<lang>Alphabet.js`)

Only needed when the new language has a non-standard script or diacritics. Italian is Latin and does not need a bootcamp file, but the following exist as reference implementations:

- `dutchAlphabet.js`, `englishAlphabet.js`, `frenchAlphabet.js`, `germanAlphabet.js`, `greekAlphabet.js`, `irishAlphabet.js`, `italianAlphabet.js`, `japaneseAlphabet.js`, `nahuatlAlphabet.js`, `polishAlphabet.js`, `portugueseAlphabet.js`, `russianAlphabet.js`, `spanishAlphabet.js`, `yucatecMayaAlphabet.js`.

Each file must be registered in `AlphabetBootcamp.jsx` (`LANGUAGE_ALPHABETS` map, ~lines 1000–1012) and `LANGUAGE_SCRIPTS` (~lines 118–128).

**Italian implementation note:** `AlphabetBootcamp.jsx` has its own UI copy, language-name maps, script-name maps, and generated-practice-word prompt. It must be localized separately from `translations.<code>`. For Italian, the component now uses an Italian-aware `uiText(...)` helper, `LANGUAGE_NAMES_IT`, `LANGUAGE_SCRIPTS_IT`, and asks generated practice words for `meaning_it`. `src/data/alphabetItalianLocalizer.js` wraps every registered alphabet dataset with `soundIt`, `tipIt`, and `practiceWordMeaning.it`, so Dutch/German/Greek/etc. cards render their explanatory content in Italian instead of falling back to English. `src/data/italianAlphabet.js` still carries authored Italian card copy for the Italian bootcamp itself. When adding future support languages, audit `AlphabetBootcamp.jsx` for binary `appLanguage === "es"` branches and audit the target alphabet file/localizer for localized sound/tip/meaning fields.

**Japanese implementation note:** `src/data/alphabetJapaneseLocalizer.js` must cover `nameJa`, `soundJa`, `tipJa`, and `practiceWordMeaning.ja` for every registered alphabet dataset, not just the Japanese bootcamp itself. A passing grep is not enough here: run a runtime audit over the localized payloads and look specifically for mixed-language strings where Japanese scaffolding still contains raw English/Spanish phrases. The Dutch bootcamp regression (`Lange IJ`, `I met trema`, `Considered one letter in Dutch`, etc.) came from assuming chrome-level localization implied card-level localization.

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
Back|Next|Finish|seconds|\(seconds\)
LANGUAGES|VOICE|EFFECTS
Immersion Practice|Claim \+|Next batch in|tasks to use your language
Join us on Patreon|Change display name|Bitcoin wallet|Create wallet|Choose a recipient
Your chats|No saved chats|Save chat|New chat|Morpheme mode|Break down words|What do you want to learn today\?
Listening\.\.\.|Reading\.\.\.|Thinking\.\.\.|Generating
The learner says|successCriteria|Critères:\s*The learner
```

For the data layer, also run a runtime audit against the localized modules instead of only grepping source files. Grep finds raw `{ en, es }` authoring data by design; the localizer pass is what matters. Use a tiny Node ESM script that imports the exact named exports (`SKILL_TREE_PRE_A1`, `SKILL_TREE_A1`, ..., `FLASHCARDS_C2`) and counts:

- skill-tree objects where `typeof value.en === "string" && typeof value.es === "string"` but `value[code]` is missing or equals `value.en`;
- `successCriteria` strings without `successCriteria_<code>`;
- flashcards where `card.concept[code]` is missing or unintentionally equals `card.concept.en`.

For French after the regression pass, the skill-tree audit is `0` missing / `0` English fallbacks across 1,100 objects and `0` missing across 13 success criteria. Flashcards cover all 1,150 split CEFR cards; identical-spelling hits are acceptable only when they are true cognates or unchanged French forms.

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
   - [ ] Verify HelpChatFab visible UI, not just its prompt/instruction language: saved-chat sidebar, empty state, save/new actions, Morpheme mode, center prompt, input placeholder, send/mic buttons, close/delete tooltips.
6. **App shell & settings**
   - [ ] Localize the mode menu and primary app navigation chrome in `App.jsx`.
   - [ ] Localize onboarding step tabs, Back/Next/Finish controls, voice/effects section labels, and voice-activation slider units/value suffixes.
   - [ ] Localize account/settings surfaces (`IdentityDrawer.jsx`, `ConversationAccountDrawer.jsx`, `BitcoinSupportModal.jsx`, subscription/payment gates).
   - [ ] Verify Patreon card, display-name accordion, and Bitcoin wallet creation flow inside account/settings.
7. **Per-module components**
   - [ ] Update every file in `§3.11`–`§3.24` above.
   - [ ] Verify History/Reading `VoiceOrb` loader captions and realtime/tutorial goal criteria render in the new support language.
8. **Utilities & data**
   - [ ] Update every file in `§4` and `§5` above.
   - [ ] Confirm localized `successCriteria_<code>` / goal text is actually consumed by tutorial/realtime renderers.
9. **Audit**
   - [ ] Run every pattern in `§8`; open a PR only when all hits are legitimate.
10. **Verification**
   - [ ] `npm run build` passes.
   - [ ] Manual smoke: onboarding tabs/buttons/VAD slider → practice selection → mode menu → account/settings drawer (Patreon/display name/Bitcoin wallet) → HelpChatFab full screen → immersion drawer/claim flow → skill-tree card → lesson modal/tutorial goal UI → a lesson → History/Reading voice orb → Conversations → RealTime session.
   - [ ] Confirm UI labels render in the new language and LLM respects `supportLang`.

---

### 9.1 First-Pass French Regression Targets

These misses came from the French rollout and must be treated as acceptance tests for French and every future support language:

- Landing page practice-language cards render the localized `langOption.label` for all 14 cards. Selecting French should show labels such as `Anglais`, `Allemand`, `Italien`, `Portugais`, etc.; it must not render the English fallback list.
- `/links` support-language dropdown labels come from the active `linksPageTranslations` locale and include `language_fr` in every support-language block.
- Skill-tree data is not complete until Pre-A1 through C2 unit/lesson titles, descriptions, tutorial descriptions, and `successCriteria_<code>` pass the runtime audit. Smoke target: French Pre-A1 People & Family should render `Personnes et famille`, `Ma famille`, `Plus de famille`, and `Les gens autour de moi`, not English.
- Flashcard data is not complete until all 1,150 split CEFR concepts resolve `concept.<code>`. Smoke target: French B2 idiom cards should render `Ca coute les yeux de la tete`, `Bonne chance`, `Il pleut des cordes`, etc., not English idioms.
- Onboarding tabs and section labels (`LANGUAGES`, `VOICE`, `EFFECTS`) render in the support language.
- Onboarding voice-activation slider localizes both the label and the value suffix (`seconds`).
- Onboarding navigation localizes `Back` and all neighboring button states.
- Immersion drawer localizes header/subtitle, loading/empty/error text, timer labels, and `Claim +50 XP`.
- Account settings localizes the Patreon card, display-name accordion, and Bitcoin wallet card/modal end to end.
- HelpChatFab localizes its full visible UI: saved-chat sidebar, empty state, save/new actions, Morpheme mode, center prompt, input placeholder, and tooltips.
- History/Reading module localizes `VoiceOrb` loader captions such as `Listening...`.
- Tutorial/realtime goal UI renders localized success criteria; it must not show English strings like `The learner says hello.` under localized labels such as `Critères`.

---

### 9.2 Hindi Regression Sweep Targets

These misses surfaced during the Hindi support-language rollout and should now be treated as explicit smoke targets for every future support language:

1. Account/settings drawer must localize all visible settings chrome, including post toggles, sound toggles/state text, volume label, theme title/description, theme option labels, and test-sound CTA. Audit `App.jsx`, `Onboarding.jsx`, `ThemeModeField.jsx`, and shared translation keys together.
2. Conversation settings must never crash when opened in a new support language. `ConversationSettingsDrawer.jsx` needs a full support-language entry in `getConversationSettingsUi()`, CEFR `name` / `description` coverage, and a safe `copy[lang] || copy.en` fallback so `proficiencyLabel` and related fields cannot be `undefined`.
3. Flashcard mode needs a dedicated smoke test beyond deck data. Audit the overview stats, activity legend, daily-target card, CTA buttons, level/XP footer, connecting/loading copy, and review buttons/hints across `FlashcardPractice.jsx`, `FlashcardSkillTree.jsx`, `LessonFlashcard.jsx`, and `translation.jsx`.
4. Alphabet Bootcamp parity includes card-face content, not just shell chrome. Run a runtime audit against `name<code>`, `sound<code>`, `tip<code>`, and `practiceWordMeaning.<code>` so mixed English scaffolding does not leak into localized cards.
5. Lesson-modal module tags are separate from lesson titles. Audit every mode chip (`Vocabulary`, `Grammar`, `Reading`, `Stories`, `Realtime`, `Game`) and confirm the lesson modal reads localized tag copy instead of hardcoded English.
6. Tutorial steppers/popovers have their own local dictionaries. `TutorialStepper.jsx` and `TutorialActionBarPopovers.jsx` must each include the new support-language labels/descriptions plus localized previous/next/done/help labels.
7. Module level/XP headers are separate chrome. Audit the `Level {n}` / `XP {xp}` bar anywhere it appears in modules and loaders instead of assuming lesson-body localization covers it.
8. Daily-goal celebration copy in `App.jsx` is a required surface: title, subtitle, goal label, streak/pet status text, and primary CTA must all resolve through the support language.
9. History/Reading evaluation is only complete when every speech-evaluation label and learner-facing note is localized. Audit `SPEECH_CRITERIA`, summary copy, button labels, and generated/fallback notes in `History.jsx` and related speech-evaluation utilities.
10. Stories UI has its own support-language resolver. `Stories.jsx` `getAppUILang()` must recognize the new support language or the story shell can stay in English while lesson text is localized.
11. Realtime goal/objective UI must be localized independently from the rest of the realtime shell. Audit tutorial goal cards, rubric text, success criteria, and goal badges in `RealTimeTest.jsx`.
12. Realtime message translation requires both prompt coverage and render-path coverage. Audit the translation prompt language name, auto-translation trigger, persisted translation fields, and history replay rendering so translated assistant/user messages do not silently fall back to English.
13. Tutorial/review game loaders require localized world data, not just localized outer UI. `LoadingMiniGame.jsx` must include the new support language in room-name pools, interactable message pools, generated room-name objects, and the runtime `world.messages` builder.
14. RPG mode has its own isolated text system. Audit `RPGGame/index.jsx` and `scenarios.js` for local dictionaries (`UI_TEXT`, `QUEST_LOG_COPY`, `OBJECT_SEARCH_TEST_COPY`, `GAME_LOADING_MESSAGES`) plus map names, inventory modal text, help labels, and translation toggles.
15. Lesson-complete celebration copy in `App.jsx` is a separate modal surface: `Lesson Complete!`, `XP Earned`, `Experience Points`, and the continue CTA all need support-language coverage.
16. Session timer modal must localize its full shell, including title, description, clock drag hint, minutes label, max hint, quick picks, restart state, and completion-state text.
17. Flashcard answer-rating buttons (`Need help`, `Still learning`, `Know it`, `Mastered`, plus helper text) must be localized explicitly; do not assume the flashcard shell covers them.
18. Assistant labels must be smoke-tested anywhere they appear as local component chrome, including vocab/grammar support panels and tutorial/help popovers. Shared `vocab_assistant` coverage alone is not enough if component-local button maps still hardcode `Assistant`.
19. Alphabet Bootcamp localizers need a phrase-level audit, not just token replacement. Exact pronunciation tips such as diaeresis / trema explanations (`Pronounced separately from adjacent vowel`, `'Naïf'`, `'Noël'`) must be translated cleanly in the data localizer or the card will ship mixed support-language output.
20. Account/settings proficiency CTAs can live outside shared translation dictionaries. Audit `App.jsx` and any local `uiCopy(...)` / inline support-language maps for strings like `Start proficiency test`, because they will not be fixed by adding `translations.<code>` alone.
21. Notes drawers are separate from the global team/community drawer copy. Audit `NotesDrawer.jsx` for local title, empty state, clear-all CTA, lesson/module labels, listen/delete aria labels, accordion note-count chips/pluralization (`1 note`, `2 notes`), no-notes rows, and footer close text; this surface often bypasses `translations.<code>` entirely.
22. Support-language flag accuracy on `/links` is rendered through `LinksPage.jsx` swatches, not only shared SVG assets. Visual regressions like an oversimplified India flag must be fixed in the swatch renderer (`SupportLanguageFlagSwatch`) as part of rollout QA.
23. Stories support translations require both resolver coverage and fallback-story coverage. `Stories.jsx` must accept the new support language in `supportLang` validation AND include that language in demo/tutorial `supportStoryText(...)` blocks, or sentence-level support text silently falls back to English.
24. RPG room names come from multiple registries. Audit `MAP_NAME_BY_ID`, `REVIEW_ROOM_BLUEPRINTS`, `WORLD_BLUEPRINTS`, review-hub builders, fallback scenarios, and any generated `processedName` objects together; patching only one source leaves mixed English room labels in review worlds.
25. RPG gather/object-search items need support-language metadata on the item model itself. Add and preserve fields like `supportName`, `supportHint`, and optional `transcription` through scenario generation, gather placement, pickup, inventory storage, and object-search assignment so quest log, pickup banners, and inventory UI cannot leak raw target strings or English decoys.
26. RPG object-examine fallback tables are a separate smoke target. `OBJECT_EXAMINE_FALLBACK_LABELS` and `OBJECT_EXAMINE_FALLBACK_SENTENCES` in `RPGGame/index.jsx` must include the new support language so object descriptions still localize when the runtime generation path fails.
27. Proficiency-test rubric QA must include the full drawer body, not just the header chrome. Audit `proficiency_test_rubric_desc` plus all seven CEFR `rubricRows` descriptions in `ProficiencyTest.jsx`, because this table has repeatedly stayed in English after new support-language launches.
28. Notes drawer QA must explicitly verify singular/plural note-count labels in every supported app language (`1 note`, `2 notes`, etc.). Static drawer headers can be localized while the accordion summary still leaks English if `NotesDrawer.jsx` keeps a component-local count formatter.
29. Realtime/conversation support translations need a routing smoke test separate from visible chrome. Verify that generated support text resolves against the active app/support language for every supported support locale (`en`, `es`, `pt`, `it`, `fr`, `ja`, `hi`), that each saved turn stores `translationLang`, and that the UI does not render stale English glosses after switching support languages.
30. RPG object-examine QA must include the async-loading path, not just fallback dictionaries. Click an object while the map-preload request is already in flight and verify the panel shows immediate fallback/support text, then resolves to the generated text (or a fallback) instead of staying stuck on the loading orb forever.

---

### 9.3 Egyptian Arabic RTL Regression Targets

These misses surfaced during the Egyptian Arabic support-language rollout. Treat them as required smoke targets for Arabic and any future RTL support language:

1. Daily-goal manager footer actions need dedicated localized labels. Do not rely on `teams_drawer_close` or an English `Close` fallback for the visible close button.
2. Modal close buttons must be direction-aware. For RTL app languages, place `ModalCloseButton` / icon close controls on the left side and add matching header padding so the icon does not overlap Arabic titles. Smoke-test session timer, daily goal, skill-tree lesson modal, wallet/support modals, and app-level completion/time-up modals.
3. Account/settings drawer QA must include local setting rows and nested wallet copy: VAD value suffixes, post toggles/state text, proficiency CTAs, secret-key copy, wallet headings, loading text, recipient selection, and toast/error fallbacks.
4. Lesson-modal module tags are independent UI chrome. Confirm every mode chip (`Vocabulary`, `Grammar`, `Reading`, `Stories`, `Realtime`, `Game`) resolves through support-language keys such as `mode_vocabulary` instead of hardcoded English.
5. Vocab/grammar practice text direction must follow the content language, not only the app shell. If the UI language is Arabic but the learner is studying Spanish, Spanish prompts and answer inputs must stay LTR so strings like `Buenos dias` do not visually reorder; if the target/answer language is RTL, that text must render RTL.
6. Vocab/grammar action controls are required smoke targets: `Next question`, `Skip`, submit/check buttons, drag/drop helper text, and final-quiz controls must all resolve through `practice_*`, `quiz_*`, `vocab_*`, or `grammar_*` keys.
7. Vocab/grammar question headers are separate from generated lesson text. Audit mode instructions such as `Choose the correct answer`, `Choose all correct answers`, `Match the words`, `Fill the blank`, and speak/listen headers in both `Vocabulary.jsx` and `GrammarBook.jsx`.
8. Stories UI has two language gates. `Stories.jsx` must include the new support code in both `getAppUILang()` and the bilingual `supportLang` resolver, or story loaders and shell copy can fall back to English while the lesson content looks localized.
9. Component-local Arabic support-copy maps are easy to miss. Audit `IdentityDrawer.jsx`, `BitcoinSupportModal.jsx`, and any other `supportCopy(...)` helper for English key lookups that bypass `translations.ar`.

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
| Support-language switching updates default voice/persona without flicker | Done — `App.jsx` and `Onboarding.jsx` detect known default personas across `en`/`es`/`it`, localize them before render/refill/persist, and preserve custom persona text |
| Account settings menu fully localized        | Done — Italian intentionally keeps `Account` for the tab label |
| HelpChatFab visible UI localized             | Done |
| Conversation/realtime UI and loaders localized | Done — `Conversations.jsx`, `RealTimeTest.jsx`, realtime `translations.it` keys, and `LoadingMiniGame.jsx` loader copy |
| Flashcard `concept` entries include `it`       | Done — `italianLocalizer.js` covers `flashcardData.js` and all seven split CEFR decks |
| Flashcard correct-answer level/XP footer localized | Done — `flashcard_xp_level` / `flashcard_total_xp` keys added to `translations.en/es/it` and used in `FlashcardPractice.jsx` |
| Skill-tree `{ en, es }` pairs include `it`     | Done — `italianLocalizer.js` covers `skillTreeData.js`, generated lesson data, all seven CEFR split files, and lesson modal data |
| Alphabet bootcamp UI and all card content     | Done — `AlphabetBootcamp.jsx` UI copy plus `alphabetItalianLocalizer.js` coverage for all registered alphabet datasets |
| `conversationTopics.js` includes `it`          | Done |
| `flashcards/common.js` `getConceptText` bilingual list includes `it` | Done |
| `languageDetection.js` timezone + browser-language heuristics | Done — `ITALIAN_TIMEZONES` (`Europe/Rome`, `Europe/Vatican`, `Europe/San_Marino`) and `ITALIAN_LANGUAGE_CODES` already present; `detectUserLanguage()` returns `'it'` before falling back to `'es'` or `'en'`; `LandingPage.jsx` calls it on mount so Italian-locale users auto-land in Italian |
| Question UI in `Vocabulary.jsx`, `GrammarBook.jsx`, `FeedbackRail.jsx` fully localized | Done — all `userLanguage === "es" ? … : …` visible-chrome ternaries replaced with `t("key")` calls; 27 new `vocab_*` keys added to `translations.en/es/it` |
| `Stories.jsx` (role-play UI + loader lang detection), `RepeatWhatYouHear.jsx`, `TranslateSentence.jsx`, `LessonFlashcard.jsx` localized | Done — `useUIText` hook migrated to `t(uiLang, "story_*")` calls; `getAppUILang()` fixed to return `"it"`; 21+ role-play/repeat-hear/translate-sentence keys added; flashcard local dict extended with `it` entry + `generating` key. **Per-sentence support translation**: `supportLang` validation allow-list in `setProgress` (line ~269) was `["en","es","bilingual"]` — `"it"` added so the LLM is instructed to translate into Italian instead of silently falling back to English. |
| `ProficiencyTestModal.jsx` localized | Done — `isEs` removed; all 6 visible-copy ternaries replaced with `tFn(lang, key)` |
| `ProficiencyTest.jsx` visible UI localized | Partial — visible chrome is done, but generated assessment summary/score notes still need explicit support-language enforcement in the grading prompt |
| `History.jsx` / reading speech evaluation localized | Partial — reading UI keys exist, but speech-evaluation labels/notes still fall back to English for Italian; `SPEECH_CRITERIA`, prompt instructions, and fallback summary need support-language coverage |
| `GettingStartedModal.jsx` localized | Done — `isEs` removed; installSteps array, toast, and JSX ternaries replaced with `tFn(lang, key)`; 4 new `app_install_*` keys added |
| `LessonGroupQuiz.jsx` generating-question loader | Done — binary ternary replaced with `t(userLanguage, "history_generating_question")` |
| `TutorialStepper.jsx` module labels/descriptions | Done — `it` added to all 6 entries in `MODULE_CONFIG` |
| `TutorialActionBarPopovers.jsx` (onboarding stepper cards) | Done — `it` added to all 6 `BUTTON_EXPLANATIONS` entries; JSX fallback guards added; blank-card bug fixed |
| `LandingPage.jsx` (full Italian landing + language menu) | Done — full `it` translation block authored; language toggle replaced with EN/ES/IT select menu; `translations[lang] \|\| translations.en` fallback added; `LanguageMenu` now passes `ui: translations[lang] \|\| translations.en` to `getSupportLanguageOptions` so dropdown labels localize with the selected UI language |
| `LinksPage.jsx` + `linksPage.jsx` translations (Italian + language menu) | Done — full `it` translation block (all 50+ keys including JSX `aboutContent`); Switch/toggle removed; top-left fixed Chakra `Menu` added (flag-icon-only collapsed, expands to flag+label list via `getSupportLanguageOptions`); `setLanguage` wired from `useLanguage` hook; `language_en` / `language_es` / `language_it` keys added to every locale block in `linksPage.jsx`; `LanguageMenuFixed` receives `translations` as a prop and forwards it as `ui` to `getSupportLanguageOptions` so dropdown labels localize; flag-icon wrapper swapped from `<Text>` (renders as `<p>`, invalid inside `<button>`) to a span-based flex `Box` with explicit 24×24 sizing so the icon renders reliably on mobile WebKit |
| `SubscriptionGate.jsx` + `/subscribe` route fully localized | Done — `"passcode.instructions"` JSX added to `translations.it` (intro text, benefit list, Abbonati/Paga una volta buttons); `invalid`, `bannedTitle`, `bannedBody`, `goToPatreon`, `passcodeLink` added to `it` block; three binary `appLanguage === "es"` ternaries in `App.jsx` passcode handler extended to include Italian (`"it"` branch: not-configured msg, accepted toast, save-failed msg) |
| `RPGGame/index.jsx` + `scenarios.js` UI fully localized | Done — `it` block added to `UI_TEXT`, `QUEST_LOG_COPY`, `OBJECT_SEARCH_TEST_COPY`, `GAME_LOADING_MESSAGES`; all 10 hardcoded `=== "es"` ternaries replaced with `ui.*` lookups; `normalizeQuestions` `chooseCorrect` string extended to three-way |
| RPGGame room/area names in Italian (`scenarios.js`, `worldGen.js`, `LoadingMiniGame.jsx`) | Done — `it` added to `MAP_NAME_BY_ID` + 4 call sites in `scenarios.js`; `it` arrays added to all 8 `WORLD_BLUEPRINTS` in `worldGen.js`; `LoadingMiniGame.jsx` world-gen now picks `it` from existing pools; object-examine `mapName` fixed to use `en` for LLM context |
| `LoadingMiniGame.jsx` object interaction messages | Done — world-gen message shuffle loop was building `{ en, es }` objects only; `it` key added so Italian sign/chest/lamp/plant/table messages are shown |
| RPGGame NPC dialogue language mixing (non-en/es targets) | Done — `scenarios.js` `L[tl] \|\| L.en` fallback replaced with a target-language-neutral object: `firstGreetings` uses LLM `storySeed` directly; `midGreetings`/`finalGreetings`/`npcHandoff` use NPC name only; `questComplete` → `"✓"`; `fallbackSpeech`/`speechContinue` → `null` so `index.jsx` falls through to `ui.noSpeechMatch`/`ui.speechContinue` (support language) |
| Daily goal celebration modal (`App.jsx`) | Done — 5 binary `appLanguage === "es"` ternaries extended to three-way: title, subtitle, "Goal" label, streak message, "Keep learning" button |
| Lesson complete celebration modal (`App.jsx`) | Done — 4 binary `appLanguage === "es"` ternaries extended to three-way: "Lesson Complete!", "XP Earned", "Experience Points", "Continue" |
| `LandingPage.jsx` sign-in "or" divider | Done — hardcoded `"or"` replaced with `{copy.signin_or}`; `signin_or` key added to `en` ("or"), `es` ("o"), `it` ("o") translation blocks |
| `SkillTree.jsx` game review loader messages | Done — `GAME_LOADING_MESSAGES` extended with `it` array (8 Italian messages); loader header gradient always dark (removed light-theme white override); text color fixed to `blue.100` regardless of theme |
| `SkillTree.jsx` standard lesson start loader | Done — `LessonDetailModal` loading button now uses `skill_tree_starting_lesson` from `supportLang`; `translations.en/es/it` include the key and Italian also has `generic_loading` fallback |
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
