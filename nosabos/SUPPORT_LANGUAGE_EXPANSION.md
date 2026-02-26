# Support Language Expansion Guide

## What This Covers

This document explains how to expand the **support/UI language** of the app — the language the interface, buttons, labels, and AI instructions appear in. This is separate from adding new *practice/target languages* (what users learn), which is documented in `../NEW_LANGUAGE_EXPANSION_PLAN.md`.

**Current state after consolidation:**
- **Full translations**: English (`en`), Spanish (`es`) — ~546 keys each
- **Skeleton entries** (language names + calendar + a few essentials): `pt`, `fr`, `it`, `de`, `nl`, `ja`, `ru`, `el`, `pl`, `ga`, `nah`, `yua`
- The `t()` helper falls back to English for any missing key, so skeleton languages work immediately — they just show English for untranslated strings

**Goal:** All 14 practice languages should also be available as support languages with complete translations.

---

## Architecture Overview

### How the translation system works

1. **`src/utils/translation.jsx`** — Main translations object
   - Exports `translations` with a sub-object per language code
   - Exports `t(lang, key, vars)` helper that does key lookup + `{placeholder}` replacement
   - Falls back: `translations[lang][key]` → `translations.en[key]` → raw key string

2. **`src/translations/linksPage.jsx`** — Separate translations for the LinksPage
   - Same pattern: `linksPageTranslations.en` / `linksPageTranslations.es`
   - ~83 keys per language

3. **`src/hooks/useLanguage.js`** — Zustand store for UI language state
   - Manages `language` state + localStorage persistence
   - `SUPPORTED_LANGUAGES` set lists all valid language codes
   - Auto-detects language from timezone → browser language → defaults to English
   - Already updated to support all 14 language codes

4. **Component usage patterns:**
   ```javascript
   // Pattern A: Import translations + read language from props/hook
   import { translations } from "../utils/translation";
   const ui = translations[lang] || translations.en;
   // Then use: ui.some_key

   // Pattern B: Use the t() helper for placeholder strings
   import { t } from "../utils/translation";
   t(lang, "daily_goal_level_explainer", { pct: 50 })
   // → "Each level is 100 XP. This goal is 50% of a level per day."
   ```

---

## How to Add a Complete Support Language Translation

### Step 1: Translate the main translations object

**File:** `src/utils/translation.jsx`

Each skeleton language entry currently has ~15-25 bootstrap keys. A complete translation needs all ~546 keys from the `en` object.

**Process:**
1. Copy the entire `en: { ... }` block
2. Translate every string value to the target language
3. Replace the skeleton entry for that language with the full translation

**Important notes:**
- Keep `{placeholder}` tokens intact (e.g., `{xp}`, `{level}`, `{pct}`)
- Keep emoji/symbol prefixes intact (e.g., `"✅ Correct · +{xp} XP"`)
- The `"passcode.instructions"` key contains JSX — translate the text nodes only, keep the JSX structure
- Array values like `benefits` and `calendar_weekdays` need all elements translated
- Some keys like voice names (`onboarding_voice_alloy`, etc.) should NOT be translated

### Step 2: Translate the LinksPage translations

**File:** `src/translations/linksPage.jsx`

1. Add a new language block: `[langCode]: { ... }`
2. Translate all ~83 keys from the `en` block
3. The `aboutContent` key contains JSX — translate text nodes, keep structure

### Step 3: Update the Onboarding support language menu

**File:** `src/components/Onboarding.jsx`

The support language dropdown currently only shows English and Spanish. To add more options, update the `MenuOptionGroup` that lists support languages (~line 367-384).

Add a new `MenuItemOption` for each language:
```jsx
<MenuItemOption value="[langCode]">
  <HStack spacing={2}>
    {flagFunction()}
    <Text as="span">{ui.onboarding_support_[langCode]}</Text>
  </HStack>
</MenuItemOption>
```

You also need to add the corresponding translation key for the support language label:
- In `en`: `onboarding_support_[langCode]: "[Language Name]"`
- In `es`: `onboarding_support_[langCode]: "[Nombre del idioma]"`
- In every other translated language as well

### Step 4: Update the App.jsx language toggle

**File:** `src/App.jsx`

The app header has a language toggle that currently cycles between EN/ES. This needs to be updated to support all languages — likely changing from a toggle button to a dropdown menu.

Search for `app_lang_en` and `app_lang_es` references and the `toggleLanguage` call to find the toggle UI.

### Step 5: Verify no remaining hardcoded `lang === "es"` checks

After this consolidation PR, scattered ternaries have been moved to the translations object. But verify no new ones have been introduced:

```bash
grep -rn 'lang === "es"' --include="*.jsx" --include="*.js" src/
grep -rn 'language === "es"' --include="*.jsx" --include="*.js" src/
grep -rn 'language === "en"' --include="*.jsx" --include="*.js" src/
```

Any matches should be refactored to use `translations[lang]` lookups.

---

## Complete List of Translation Keys

Below is the full list of ~546 keys that need to be translated for each new support language. They are grouped by feature area.

### Core UI (~15 keys)
- `correct`, `try_again`, `generic_loading`, `common_id_label`, `common_saving`, `common_cancel`
- `dailyGoalProgress`
- `intro`, `benefitsTitle`, `benefits` (array), `goToPatreon`, `passcodeLink`, `label`, `invalid`
- `bannedTitle`, `bannedBody`
- `backToQuestion9`

### Language Names (~14 keys)
- `language_en`, `language_es`, `language_pt`, `language_fr`, `language_it`, `language_nl`
- `language_nah`, `language_ja`, `language_ru`, `language_de`, `language_el`, `language_pl`
- `language_ga`, `language_yua`

### Daily Goal (~12 keys)
- `daily_goal_title`, `daily_goal_subtitle`, `daily_goal_input_label`, `daily_goal_save`
- `daily_goal_quick_picks`, `daily_goal_fine_tune`, `daily_goal_xp_unit`
- `daily_goal_level_explainer`, `daily_goal_preview`, `daily_goal_resets_in`
- `daily_goal_error_no_user`, `daily_goal_error_no_user_desc`, `daily_goal_error_save`
- `daily_goal_calendar_title`, `daily_goal_calendar_completed`, `daily_goal_calendar_incomplete`

### Calendar (~5 keys)
- `calendar_weekdays` (array), `calendar_months` (array)
- `calendar_prev_month`, `calendar_next_month`, `calendar_today`

### Tabs & Navigation (~7 keys)
- `tabs_random`, `tabs_realtime`, `tabs_stories`, `tabs_reading`, `tabs_grammar`, `tabs_vocab`
- `path_switcher_path`, `path_switcher_flashcards`, `path_switcher_conversations`

### Random Practice (~3 keys)
- `random_toast_title`, `random_toast_desc`, `random_shuffle`

### Reading Module (~18 keys)
- `reading_title`, `reading_btn_next`, `reading_btn_finish`, `reading_generating`, `reading_skip`
- `reading_badge_level`, `reading_badge_xp`, `reading_btn_generate`
- `reading_list_show`, `reading_list_hide`, `reading_prev_lectures_label`
- `reading_none_yet`, `reading_no_lecture`, `reading_read_in`, `reading_stop_aria`
- `reading_takeaways_heading`, `reading_xp_awarded_line`

### Practice (~12 keys)
- `practice_next_question`, `practice_skip_question`
- `practice_speak_banner_you_said`, `practice_speak_banner_translation`, `practice_speak_banner_xp`
- `practice_drag_drop_instruction`, `practice_drag_drop_slot_placeholder`
- `practice_drag_drop_multi_instruction`, `practice_drag_blank_label`
- `practice_play`, `practice_next_ready`, `practice_try_again_hint`

### Quiz (~7 keys)
- `quiz_correct`, `quiz_try_again`, `quiz_checked`, `quiz_submit`
- `quiz_placeholder_open`, `quiz_placeholder_oneword`, `quiz_select_placeholder`

### Vocabulary (~24 keys)
- `vocab_badge_level`, `vocab_badge_xp`
- `vocab_btn_fill`, `vocab_btn_mc`, `vocab_btn_ma`, `vocab_btn_match`, `vocab_btn_speak`
- `vocab_input_placeholder_word`, `vocab_submit`, `vocab_select_all_apply`
- `vocab_dnd_drop_here`, `vocab_dnd_bank`
- `vocab_speak_*` (12 keys)
- `vocab_result_*` (4 keys)

### Grammar (~24 keys)
- `grammar_badge_level`, `grammar_badge_xp`, `grammar_next`
- `grammar_btn_fill`, `grammar_btn_mc`, `grammar_btn_ma`, `grammar_btn_match`, `grammar_btn_speak`
- `grammar_input_placeholder_answer`, `grammar_submit`, `grammar_select_all_apply`
- `grammar_dnd_drop_here`, `grammar_dnd_bank`
- `grammar_speak_*` (12 keys)
- `grammar_result_*` (4 keys)

### Stories (~25 keys)
- `story_header`, `story_generate`, `story_playing`, `tts_synthesizing`
- `story_listen`, `story_stop`, `story_start_practice`, `story_practice_this`
- `story_skip`, `story_finish`, `story_record`, `story_stop_recording`
- `story_progress`, `story_no_story`, `story_generating_title`, `story_generating_sub`
- `story_almost`, `story_well_done`, `story_score`, `story_level`, `story_story_label`
- `story_back_aria`, `story_demo_*`, `story_speech_*`, `story_mic_*`, `story_audio_*`
- `story_sentence_label`, `story_of`, `story_congrats_*`
- `stories_sentence_success_title`, `stories_sentence_success_score`
- `stories_next_sentence`, `stories_finish`

### Onboarding (~50+ keys)
- `onboarding_title`, `onboarding_subtitle`
- `onboarding_app_language_*`, `onboarding_support_language_*`, `onboarding_practice_language_*`
- `onboarding_section_*`, `onboarding_vad_*`, `onboarding_level_*`
- `onboarding_support_*`, `onboarding_practice_*` (14 language labels)
- `onboarding_voice_*` (voice names — do NOT translate)
- `onboarding_persona_*`, `onboarding_step_*`, `onboarding_challenge_*`
- `onboarding_cta_next`, `onboarding_cta_start`
- `onboarding_bitcoin_*`, `onboarding_help_*`, `onboarding_pron_*`
- `onboarding_translations_toggle`
- `onboarding_vad_hint`, `onboarding_seconds`, `onboarding_alpha`

### Real-time Chat (~18 keys)
- `ra_title`, `ra_label_you`, `ra_label_xp`, `ra_btn_settings`
- `ra_btn_delete_convo`, `ra_btn_connect`, `ra_btn_connecting`, `ra_btn_disconnect`
- `ra_settings_title`, `ra_persona_*`, `ra_progress_*`, `ra_vad_label`
- `ra_translating`, `ra_delete_confirm`, `ra_toast_*`
- `ra_pron_label`, `ra_pron_help`, `ra_help_label`, `ra_help_placeholder`, `ra_help_help`
- `ra_goal_label`

### App/Account (~30+ keys)
- `app_install_*`, `app_account_*`, `app_lang_*`
- `app_close`, `app_sign_out`, `app_copy_id`, `app_copy_secret`
- `app_your_id`, `app_copy`, `app_secret_*`, `app_switch_*`
- `app_cefr_*`, `app_settings_aria`
- `account_final_step_*`, `account_copy_secret`

### Bitcoin/Wallet (~7 keys)
- `bitcoin_modal_title`, `bitcoin_modal_reload_note`, `bitcoin_modal_scholarship_note`
- `bitcoin_modal_success`, `bitcoin_modal_skip`, `bitcoin_modal_close`

### Toast Messages (~12 keys)
- `toast_copied`, `toast_id_copied`, `toast_secret_copied`, `toast_copy_failed`
- `toast_paste_nsec`, `toast_invalid_key`, `toast_must_start_nsec`
- `toast_switch_failed`, `toast_switched_account`, `toast_save_lang_failed`
- `toast_update_title`, `toast_update_desc`, `toast_update_action`

### Skill Tree (~20 keys)
- `skill_tree_learning_activities`, `skill_tree_xp_reward`, `skill_tree_start_lesson`
- `skill_tree_unlock_at`, `skill_tree_unlock_sequential`, `skill_tree_level`
- `skill_tree_no_path`, `skill_tree_check_back`, `skill_tree_your_path`
- `skill_tree_collapse`, `skill_tree_expand`, `skill_tree_lesson_active`
- `skill_tree_cefr_*_desc` (6 CEFR level descriptions)
- `skill_tree_passing_score`, `skill_tree_tutorial_goal`, `skill_tree_tutorial_activities`

### Flashcard Practice (~25 keys)
- `flashcard_translate_to`, `flashcard_show_answer`, `flashcard_answer_label`
- `flashcard_tap_to_flip`, `flashcard_grading`, `flashcard_record_answer`
- `flashcard_stop_recording`, `flashcard_recognized`, `flashcard_type_placeholder`
- `flashcard_submit`, `flashcard_cancel`, `flashcard_correct`, `flashcard_incorrect`
- `flashcard_try_again`, `flashcard_explain_answer`, `flashcard_explanation_heading`
- `flashcard_error_*`, `flashcard_eval_*`, `flashcard_grading_*`
- `flashcard_speech_*`, `flashcard_mic_*`
- `flashcard_all_done`, `flashcard_all_completed`, `flashcard_listen`, `flashcard_listening`
- `flashcard_practice_random`, `flashcard_random_xp_toast`
- `cefr_level_completed`

### Session Timer (~12 keys)
- `timer_modal_title`, `timer_modal_description`, `timer_modal_minutes_label`
- `timer_modal_quick_picks`, `timer_modal_cancel`, `timer_modal_start`
- `timer_modal_restart`, `timer_modal_max_hint`
- `timer_times_up_title`, `timer_times_up_subtitle`, `timer_times_up_duration`
- `timer_times_up_no_duration`, `timer_times_up_close`, `timer_times_up_restart`

### Teams & Community (~50 keys)
- `teams_drawer_title`, `teams_tab_*`, `teams_drawer_close`
- `teams_feed_*` (12 keys)
- `teams_create_*` (18 keys)
- `teams_view_*` (25 keys)

### Sound Effects (~4 keys)
- `sound_effects_label`, `sound_effects_enabled`, `sound_effects_disabled`
- `sound_volume_label`, `test_sound`

### Mode Names (~5 keys)
- `mode_vocabulary`, `mode_grammar`, `mode_reading`, `mode_realtime`, `mode_stories`

### Notes Drawer (~13 keys)
- `notes_drawer_title`, `notes_empty`, `notes_clear_all`
- `notes_summary`, `notes_lesson`, `notes_no_notes`
- `notes_listen`, `notes_delete_note`
- `notes_note_singular`, `notes_note_plural`
- `notes_flashcard`, `notes_vocabulary`, `notes_grammar`

### Tutorial (~14 keys)
- `tutorial_previous`, `tutorial_next`, `tutorial_done`
- `tutorial_btn_*_label` and `tutorial_btn_*_desc` (7 button pairs)

### Speech Evaluation (~7 keys)
- `speech_target_language`, `speech_try_again_generic`
- `speech_quality`, `speech_not_target_lang`, `speech_low_char_sim`
- `speech_low_word_f1`, `speech_low_confidence`

### Subscription/Passcode (~2 keys)
- `passcode.instructions` (JSX — complex, translate text nodes)
- `passcode.label`

### DEFAULT_PERSONA (~1 key)
- `DEFAULT_PERSONA` — translate to a natural-sounding default persona description

---

## Priority Order for Translation

Recommended order for translating languages, based on user base impact:

| Priority | Language | Code | Rationale |
|----------|----------|------|-----------|
| 1 | Portuguese | `pt` | Large learner population, closest to existing ES |
| 2 | French | `fr` | Large global learner population |
| 3 | German | `de` | Large European learner population |
| 4 | Italian | `it` | Significant learner population |
| 5 | Dutch | `nl` | Active language community |
| 6 | Russian | `ru` | Significant learner population |
| 7 | Polish | `pl` | Active language community |
| 8 | Japanese | `ja` | Significant learner population |
| 9 | Greek | `el` | Active language community |
| 10 | Irish | `ga` | Niche but dedicated community |
| 11 | E. Huasteca Nahuatl | `nah` | Indigenous language preservation |
| 12 | Yucatec Maya | `yua` | Indigenous language preservation |

---

## What Was Done in This Consolidation

### Scattered text moved to translations object:

1. **GoalCalendar.jsx** — Hardcoded weekday/month arrays and aria-labels replaced with `calendar_*` translation keys
2. **NotesDrawer.jsx** — 10 inline ternaries replaced with `notes_*` translation keys; module labels use translation keys
3. **TutorialActionBarPopovers.jsx** — 7 button label/description objects with `{en, es}` replaced with translation key lookups (`tutorial_btn_*`)
4. **BitcoinSupportModal.jsx** — 4 fallback ternaries simplified to use existing translation keys
5. **speechEvaluation.js** — Hardcoded `SPEECH_REASON_MESSAGES` object replaced with translation key lookups (`speech_*`)
6. **Onboarding.jsx** — 3 hardcoded ternaries replaced with translation key lookups (`onboarding_vad_hint`, `onboarding_seconds`, `onboarding_alpha`)

### Infrastructure changes:

1. **useLanguage.js** — Expanded from 2-language (en/es) to 14-language support:
   - `SUPPORTED_LANGUAGES` set with all 14 codes
   - `TIMEZONE_LANG_MAP` for geographic auto-detection of all major languages
   - `BROWSER_LANG_MAP` for browser language fallback detection
   - Exported `SUPPORTED_LANGUAGES` for use by other modules

2. **translation.jsx** — Added skeleton entries for 12 new languages with bootstrap keys (language names, calendar data, essential UI strings)

### Remaining known `lang === "es"` patterns:

These exist in components that were NOT part of the scattered text problem (they correctly use existing translation keys for most things but have a few edge cases):

- `src/components/LinksPage.jsx` — Language toggle styling (`language === "en"`)
- `src/components/DailyGoalModal.jsx` — Locale string for number formatting
- `src/components/LandingPage.jsx` — UI variant switching for language button styling

These are low-severity and can be addressed as part of individual language translations.

---

## LinksPage Translation Template

The LinksPage has its own separate translation file. Here's the structure for a new language:

**File:** `src/translations/linksPage.jsx`

```javascript
[langCode]: {
  // Welcome section
  welcome: "...",
  customizeProfile: "...",
  profile: "...",
  about: "...",
  aboutTitle: "...",
  aboutContent: ( /* JSX - translate text nodes */ ),

  // Language toggle
  english: "...",
  spanish: "...",

  // View toggle
  list: "...",
  carousel: "...",

  // Navigation
  previousLink: "...",
  nextLink: "...",
  launchApp: "...",
  subscribe: "...",

  // Link cards
  noSabosTitle: "No Sabos",
  noSabosDescription: "...",
  rbeTitle: "Robots Building Education",
  rbeDescription: "...",
  patreonTitle: "Patreon",
  patreonDescription: "...",

  // Modals, wallet, toasts (~50 more keys)
  // ... see en block for full list
},
```

---

*Last updated: February 2026*
*Companion to: ../NEW_LANGUAGE_EXPANSION_PLAN.md (practice/target language guide)*
