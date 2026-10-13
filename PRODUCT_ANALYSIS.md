# No Sabos - Product & UI/UX Analysis

## Executive Summary

No Sabos is an ambitious AI-powered language learning platform combining real-time voice conversations, structured curriculum (356 lessons across CEFR levels), spaced repetition flashcards, gamification, and decentralized identity via Nostr. The product has strong technical foundations but suffers from **complexity overload**, **onboarding friction**, and **missing feedback loops** that likely hurt retention.

---

## Critical Issues (Fix First)

### 1. Firestore Security Rules Are Wide Open
**File:** `firestore.rules` (lines 15-16)
```
match /{document=**} { allow read, write; }
```
Any user can read/write ANY other user's data. This is a data privacy and integrity risk. Users could manipulate XP, delete others' progress, or access private learning data.

**Fix:** Scope rules to `request.auth.uid == userId` per document path.

### 2. App.jsx is 6,137 Lines - The "God Component"
**File:** `nosabos/src/App.jsx`

The entire app's state, navigation, lesson logic, settings, modals, and tab switching lives in one file. This creates:
- **User-facing impact:** Slower initial load, harder-to-fix bugs, inconsistent state during navigation
- **Development impact:** Any change risks breaking unrelated features

**Recommendation:** Extract into route-level components (LessonView, DashboardView, SettingsView) with shared context providers.

---

## Product-Level Improvements

### 3. Simplify the Navigation - Too Many Tabs
The bottom navigation currently shows **10+ tabs**: Conversations, Stories, Vocabulary, Skill Tree, Grammar, History, Jobs/Scripts, Teams, Notes, Help Chat.

**Problem:** Users face decision paralysis. Language learning apps succeed with focused flows (Duolingo has 5 tabs).

**Recommendation:**
- **Primary tabs (4):** Learn (Skill Tree), Practice (Conversations + Stories), Review (Vocabulary + Flashcards), Profile (Progress + Settings)
- **Secondary access:** Grammar, Teams, Jobs as features within primary tabs or a "More" menu
- Group related features instead of giving each its own tab

### 4. Onboarding Creates Nostr Confusion
**File:** `nosabos/src/hooks/useDecentralizedIdentity.js`

New users are auto-assigned Nostr keys and **automatically post to the Nostr network** (lines 126-131) without clear consent. Three auth paths (NIP-07, nsec import, auto-generate) are presented without guidance.

**Problems:**
- Users don't understand they're broadcasting to a public network
- No seed phrase backup - clearing localStorage = account lost forever
- Crypto key management is intimidating for language learners

**Recommendation:**
- Default to a simple "Get Started" flow that abstracts Nostr entirely
- Add a "What is Nostr?" explainer for curious users
- Implement seed phrase export/backup prompts
- Require explicit opt-in before posting to Nostr relays

### 5. No Mid-Lesson Progress Saving
**File:** `nosabos/src/utils/progressTracking.js`

Lessons are binary: completed or not. If a user finishes 60% of a multi-mode lesson (vocabulary -> grammar -> stories -> conversation) and leaves, they restart from 0%.

**Recommendation:** Save checkpoint progress per mode within a lesson. Show a progress bar like "3/5 activities completed."

### 6. Daily Goal Timer Ignores Timezones
**File:** `nosabos/src/components/DailyGoalModal.jsx` (line 442)

`dailyResetAt: new Date(Date.now() + MS_24H)` resets relative to when the goal was set, not at the user's local midnight. A user setting a goal at 3pm resets at 3pm the next day.

**Recommendation:** Calculate reset based on user's local midnight using `Intl.DateTimeFormat().resolvedOptions().timeZone`.

### 7. Flashcard Daily Target is Too Low
**File:** `nosabos/src/utils/flashcardReview.js` (line 5)

`FLASHCARD_DAILY_TARGET = 12` - only 12 cards per day. Anki defaults to 20 new + unlimited reviews. At 12/day, vocabulary acquisition is slow.

**Recommendation:** Increase default to 20 and let users configure (10/20/30/50). Show projected vocabulary growth ("At this pace, you'll know 500 words in 25 days").

### 8. Pet Recovery From Death Is a Long Climb
**File:** `nosabos/src/utils/dailyGoalPet.js` (lines 3-5), `nosabos/src/components/DailyGoalPetPanel.jsx`

Health gain is +15% per goal hit, loss is -10% per miss — the ratio favors the user, which is good. However, once health reaches 0% (dead state), recovery requires **7 consecutive successful days** to reach 100%. There's no special "revive" mechanic — just the same +15% drip.

**Problem:**
- A user who goes on vacation for a week returns to a dead pet and faces a week-long grind to recover, which can feel demoralizing rather than motivating

**Recommendation:**
- Add a quick "revive" action (e.g., complete 3 lessons in one session to jump to 25%)
- Show real-time pet reactions when goals are met (immediate positive feedback)

---

## UI/UX Improvements

### 9. Silent AI Failures Show Blank Screens
**File:** `nosabos/src/utils/llm.js` (lines 42-44, 78-80)

When Gemini or OpenAI calls fail, the code returns an empty string. Users see blank explanations with no indication something went wrong.

**Recommendation:** Show a "Couldn't load explanation. Tap to retry." message with a retry button instead of empty space.

### 10. No Loading States for AI Responses
**File:** `nosabos/src/utils/llm.js`

Gemini streaming can take 3-5 seconds on mobile. No skeleton loader, spinner, or "thinking..." indicator during this time.

**Recommendation:** Add a shimmer/skeleton animation or "AI is thinking..." text during LLM calls, especially for explanations and story generation.

### 11. No Offline Fallback for TTS
**File:** `nosabos/src/utils/tts.js`

TTS requires the `REALTIME_URL` endpoint. If offline or the endpoint fails, speech breaks entirely.

**Recommendation:** Fall back to the browser's native `speechSynthesis` API when the OpenAI endpoint is unavailable. It won't sound as good but maintains functionality.

### 12. Vocabulary Progress Is Invisible
Users can see individual flashcard states but there's no dashboard showing:
- Total words learned vs. total available
- Words per CEFR level mastered
- Estimated vocabulary size
- Weekly/monthly growth trends

**Recommendation:** Add a vocabulary stats panel showing mastery distribution and growth over time.

### 13. Skill Tree Lacks Completion Context
**File:** `nosabos/src/components/SkillTree.jsx`

The skill tree shows units and lessons but doesn't show:
- Overall curriculum completion percentage
- Estimated time to complete current level
- Which CEFR level the user is working in vs. their assessed level

**Recommendation:** Add a progress header: "B1 Intermediate - 34% complete - ~45 lessons remaining"

### 14. Settings Are Scattered
Voice persona, pause timing, sound settings, translation toggles, and pronunciation practice are configured in the TopBar settings panel, but language selection is in onboarding, and daily goals are in a separate modal.

**Recommendation:** Consolidate into a single Settings page with sections: Learning Preferences, Audio & Voice, Goals & Streaks, Account & Identity.

### 15. No Push Notifications for Streaks
The daily goal system and pet health exist but there are no reminders when users haven't practiced. The pet can die silently.

**Recommendation:** Implement web push notifications (PWA supports this) for:
- "Don't forget your daily goal! Your pet is getting hungry."
- "You're on a 7-day streak! Keep it going."
- "You have 15 flashcards due for review."

---

## Accessibility Gaps

### 16. Missing ARIA Labels and Keyboard Navigation
- Icon buttons (mic, stop, play, flip) lack `aria-label` attributes
- Tab navigation doesn't appear to support keyboard-only usage
- Focus rings are explicitly removed in the theme (`_focus: { boxShadow: "none" }`)
- No skip-to-content links for screen readers

### 17. Color Contrast Concerns
- The glassmorphism design (`rgba(15, 23, 42, 0.4)` backgrounds) with light text may not meet WCAG AA contrast ratios
- CEFR level colors on dark backgrounds need contrast verification
- Error/success states rely on color alone (red/green) without text or icon indicators

---

## Strategic Product Recommendations

### 18. Language Content is Spanish-Cloned
**File:** `nosabos/src/data/skillTreeData.js` (line 11689)

All 13 languages use `cloneLearningPath()` from the Spanish curriculum. This means:
- Japanese learners get Spanish-structured lessons (which don't align with Japanese pedagogy)
- Nahuatl and Yucatec Maya share European language structures
- No language-specific phonetic or writing system modules

**Recommendation:** At minimum, add language-specific introductory modules (e.g., Japanese kana, Russian Cyrillic) and adjust lesson ordering for non-Romance languages.

### 19. Add a Clear "What to Do Next" CTA
After login, users land on the main dashboard with 10+ tabs and no clear direction. New users need a single, prominent "Continue Learning" button that takes them to their next lesson.

**Recommendation:** 
- Show a hero card: "Lesson 12: Family Members - Continue" 
- Below it: "Or review 8 due flashcards"
- Everything else is secondary

### 20. Consider Freemium Gating
The app has a Patreon passcode (`VITE_PATREON_PASSCODE`) but no clear free vs. paid feature distinction. Users may not understand what they get for free vs. what requires subscription.

**Recommendation:** Clearly define and communicate: "Free: 5 lessons + flashcards. Premium: Unlimited lessons, AI conversations, RPG mode."

---

## Priority Matrix

| Priority | Issue | Impact | Effort |
|----------|-------|--------|--------|
| P0 | Fix Firestore security rules | Critical | Low |
| P0 | Add "What to Do Next" CTA / simplify navigation | High retention impact | Medium |
| P1 | Simplify onboarding (abstract Nostr) | High acquisition impact | Medium |
| P1 | Mid-lesson checkpoints | High retention impact | Medium |
| P1 | Fix silent AI failures + loading states | Medium UX impact | Low |
| P2 | Timezone-aware daily resets | Medium UX impact | Low |
| P2 | Increase flashcard daily target + make configurable | Medium learning impact | Low |
| P2 | Pet quick-revive mechanic | Medium engagement impact | Low |
| P2 | Vocabulary progress dashboard | Medium motivation impact | Medium |
| P3 | Offline TTS fallback | Low impact (most users online) | Low |
| P3 | Accessibility improvements | Important but lower urgency | Medium |
| P3 | Language-specific curriculum | High impact but high effort | High |
| P3 | Push notifications | Medium engagement impact | Medium |
