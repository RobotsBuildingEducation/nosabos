# Support Language Expansion

This document tracks the work required to add new support and app UI languages safely.

## Current Goal

Add Italian (`it`) so it behaves like the existing English (`en`) and Spanish (`es`) support and app language paths.

## Rollout Checklist

- [x] Shared language constants support `it` as an app/support language.
- [x] App language persistence accepts `it` in `localStorage`, user docs, onboarding, and settings.
- [x] Support language selectors expose Italian anywhere English and Spanish are currently offered.
- [x] Translation registry provides first-class Italian UI labels with sane fallback behavior.
- [x] Realtime conversation flows accept Italian as the explanation/support language.
- [x] Skill tree lesson modules stop collapsing UI/support choices down to only English or Spanish.
- [x] Helpers that normalize `uiLang`, `supportLang`, or `appLanguage` accept `it`.
- [x] Inline `appLanguage === "es" ? ... : ...` and `uiLang === "es" ? ... : ...` branches are swept anywhere they affect visible copy or behavior.
- [x] Any `["en", "es"]` validation lists are expanded or replaced with shared helpers in the core support/app language paths.
- [x] Verification passes confirm the app builds with Italian enabled.

## Current Status

Italian is now wired into the core support/app language system:

- shared language constants and selectors
- onboarding support-language selection
- app-language persistence and rehydration
- core translation registry with Italian overrides and English fallback
- realtime conversation/replay translation targeting
- major lesson module language normalization paths
- alphabet bootcamp, lesson flashcards, flashcard practice, and flashcard skill-tree helpers

## Future-Language Hardening

The remaining cleanup work is mostly about reducing maintenance cost for the next language:

- replace the last inline Spanish-vs-English ternaries with shared translation keys or a tiny `uiText(en, es, newLang)` helper
- move more component-local dictionaries into `src/utils/translation.jsx`
- keep practice-language normalization separate from support/app-language normalization

## High-Risk Hotspots

- `src/constants/languages.js`
- `src/utils/translation.jsx`
- `src/App.jsx`
- `src/components/Onboarding.jsx`
- `src/components/Conversations.jsx`
- `src/components/RealTimeTest.jsx`
- `src/components/HelpChatFab.jsx`
- `src/components/ConversationSettingsDrawer.jsx`
- `src/components/History.jsx`
- `src/components/Vocabulary.jsx`
- `src/components/GrammarBook.jsx`
- `src/components/Stories.jsx`
- `src/components/JobScript.jsx`
- `src/components/IdentityDrawer.jsx`
- `src/components/DailyGoalModal.jsx`
- `src/components/Randomize.jsx`
- `src/components/AlphabetBootcamp.jsx`
- `src/components/LessonFlashcard.jsx`
- `src/components/FlashcardPractice.jsx`
- `src/components/FlashcardSkillTree.jsx`
- `src/components/ProficiencyTest.jsx`
- `src/components/LoadingMiniGame.jsx`
- `src/components/quiz/QuestionRenderer.jsx`
- `src/utils/speechEvaluation.js`
- `src/data/flashcardData.js`
- `src/data/flashcards/common.js`

## Audit Patterns For Future Languages

Search for these patterns during future language rollouts:

- `["en", "es"]`
- `=== "es" ? "es" : "en"`
- `appLanguage === "es"`
- `uiLang === "es"`
- `supportLang === "es"`
- `stored === "es" ? "es" : "en"`
- `translations[lang] || translations.en`
- local UI dictionaries with only `en` and `es`
- hard-coded locale strings such as `en-US` and `es-MX`

## Implementation Notes

- Prefer shared helpers over adding more one-off language branches.
- Keep `supportLang` and `appLanguage` semantics explicit: practice language is broader than support/app language.
- When a new UI language is incomplete, default missing copy to English instead of crashing or returning the key name.
- Any new language rollout should update this document with new hotspots discovered during the sweep.
