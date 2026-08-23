# Question Variant UI & Interaction Design Guide

This document establishes the UI architecture, interaction patterns, and design standards for all 9 question variants used across grammar and vocabulary modules in Nosabos.

---

## The 9 Question Variants

| # | Variant | Modality | Focus & Interaction |
|---|---|---|---|
| 1 | **Sentence Detective** | Grammar & Vocab | Identify the single broken token in a sentence and choose its repair. |
| 2 | **Dialogue Fork** | Conversational | Select the natural pragmatic response in a branching mini-dialogue. |
| 3 | **Sentence Shapeshifter** | Syntax & Structure | Transform a sentence according to a grammatical constraint. |
| 4 | **Word Neighborhoods** | Lexical Semantics | Categorize related words into semantic groups or collocations. |
| 5 | **Morphology Forge** | Morphology | Assemble base words, prefixes, and suffixes to build inflections. |
| 6 | **Three-Clue Mystery** | Deductive Vocabulary | Deduce a target word from up to 3 progressively revealed clues. |
| 7 | **Listen for the Difference** | Audio & Phonetics | Distinguish minimal pairs and pronunciation nuances by ear. |
| 8 | **Three-Word Challenge** | Generative Production | Produce a natural sentence using 3 mandatory anchor words. |
| 9 | **Natural or Weird?** | Intuition & Idiom | Decide if an idiom/expression sounds natural, then uncover the repair. |

---

## Core UI Standards

### 1. Action Button Placement (Submit & Skip)
- **Position**: Action buttons must sit **outside and underneath** the main white/elevated question container box, never inside it.
- **Alignment**: Right-aligned (`HStack justify="flex-end" spacing={3}`).
- **Buttons**:
  - **Skip**: Ghost button (`variant="ghost"`, size `lg`), visible in standard lessons and hidden during final quizzes.
  - **Submit**: Primary purple/accent squircle button (`style={questionSquircleStyle}`, size `lg`). **Always labeled "Submit"** (never "Check answer" or "Check my repair").
- **Feedback Transition**:
  - While answering or retrying an incorrect answer, show the Submit and Skip buttons.
  - When the answer is submitted and correct, replace the action row with the standard full-width `<FeedbackRail>`.

```jsx
{/* Action buttons under question box */}
{!loading && question && (result === null || (!isFinalQuiz && result === false)) && (
  <VStack spacing={3} align="stretch" pt={1}>
    <HStack justify="flex-end" spacing={3} flexWrap="wrap">
      {!isFinalQuiz && (
        <Button variant="ghost" size="lg" onClick={handleSkipQuestion} style={questionSquircleStyle}>
          Skip
        </Button>
      )}
      <Button
        colorScheme="purple"
        size="lg"
        px={{ base: 7, md: 10 }}
        isLoading={submitting}
        isDisabled={!ready || submitting}
        onClick={handleSubmit}
        style={questionSquircleStyle}
      >
        {submitting ? "Checking…" : "Submit"}
      </Button>
    </HStack>
  </VStack>
)}
```

---

### 2. Custom Skeleton Loaders & Real-Time Streaming
- **No Generic Spinners**: Do not render a plain centered spinner in the question area.
- **Component Skeleton**: Every question variant must provide a matching skeleton component (e.g. `SentenceDetectiveSkeleton`) matching its exact card dimensions, header, and chip layout.
- **Squircle Skeletons**: Use theme-tinted pulsing colors (`startColor="rgba(128, 90, 213, 0.12)"`, `endColor="rgba(128, 90, 213, 0.28)"`) with `borderRadius="xl"` and `style={questionSquircleStyle}`.
- **Live Streaming**: Stream generation chunks using `generateContentStream` and parse partial JSON via `parsePartialDelightQuestion` so UI elements pop into place smoothly with zero layout jumps.

---

### 3. Inline Assistant Button (`MdOutlineSupportAgent`)
- **Header Placement**: Located in the top-right corner of the question card header.
- **Inline Card**: Clicking the assistant button **must NOT** open the global bottom drawer or floating chat. It renders an inline streaming assistance card directly inside the question card using `VoiceOrb` and `ReactMarkdown`.
- **Styling**: Wrapped with `getQuestionAssistantPanelProps()` with clear markdown styling.
- **Guidance Rule**: Keeps explanations concise (≤ 60 words) in the learner's support language, providing helpful conceptual clues without giving away the exact answer immediately.

---

### 4. Minimalist Question Header
- **Single Header Title**: Display only the clean feature title (e.g., `Sentence Detective`, `Dialogue Fork`), without emoji icons (like 🔎) inside the card.
- **No Redundant Subtitles or Clues**: Never display duplicate title labels, situational hints, or clue prefixes (e.g., *"Clue: Choose the appropriate polite reply..."*). Clues are reserved exclusively for *Three-Clue Mystery*.
- **Standard Localized Instructions**: Render a single instruction line in secondary text (`color={APP_TEXT_SECONDARY}`, font weight normal) directly beneath the title sourced strictly from `*I18n.js` (e.g., *"Which word doesn't belong? Tap the one word or phrase that makes the sentence sound wrong."* or *"Choose the natural response to continue the conversation."*). Never let LLM-generated prompt instructions override the standard localized instruction.

---

### 5. Standard Right / Wrong Answer Feedback (`FeedbackRail`) & Dynamic XP
All question variants must use the live standard `<FeedbackRail>` component (`src/components/FeedbackRail.jsx`).

#### 🎯 Dynamic XP Reward Scaling:
XP rewards are not static; they dynamically adapt within the standard 4–10 XP range based on question modality and learner accuracy:
- **Sentence Detective**:
  - Solved on 1st try (0 rejected tokens): **+7 XP**
  - Solved on 2nd try (1 rejected token): **+6 XP**
  - Solved with multiple attempts: **+5 XP**
- **Three-Clue Mystery**:
  - Solved after 1st clue: **+10 XP**
  - Solved after 2nd clue: **+7 XP**
  - Solved after 3rd clue: **+4 XP**
- **Generative Production (Three-Word Challenge & Sentence Shapeshifter)**: **+7 XP**
- **Multi-Part Assembly (Word Neighborhoods & Morphology Forge)**: **+6 XP**
- **Multiple Choice & Perception (Dialogue Fork, Listen for Difference, Natural or Weird)**: **+6 XP** (or **+4 XP** after retry)
- **Final Quiz Mode**: **0 XP** (XP awarded upon overall quiz completion)

#### ✅ Correct Answer State:
- **Badge**: Green checkmark icon + localized **"Correct!"** + **`+X XP`** (dynamic reward).
- **Progress**: Animated `lessonProgress` WaveBar with percentage and earned/total labels (rendered in standard lessons; hidden in tutorial mode and final quizzes).
- **Next Action**: Full-width **"Next question →"** button.
- **Companion**: Celebrating `RandomCharacter` avatar at the bottom.
- **Note Bookmark**: Bookmark button (`RiBookmarkLine`) enabling instant note saving to the user's notebook via `generateNoteContent` and `buildNoteObject`.
- **No Automatic Tip Text**: Extraneous auto-generated tip text is omitted.

#### ❌ Incorrect Answer State:
- **Badge**: Red cross icon + localized **"Try again"** + **"Review and try again."**.
- **Explain Answer Button**: Full-width **"Explain the answer"** button.
- **On-Demand Explanation**: Explanation is **never** shown automatically. When clicked, it streams an AI explanation in the learner's support language.
- **Companion**: Sad / crying `RandomCharacter` avatar.
- **Retry Mechanism**: The question options remain interactive (`locked={result === true}`), allowing the learner to change selections and re-submit.

---

### 6. Comprehensive Localization Requirement (`*I18n.js`)
Nosabos serves a global audience learning across 15+ support languages. Every question variant must provide complete, native localization:
- **Dedicated I18n Module**: Each variant must have its own `src/utils/<variantName>I18n.js` module (e.g. `sentenceDetectiveI18n.js`, `dialogueForkI18n.js`).
- **All 15+ Support Languages Supported**:
  - `en` (English), `es` (Spanish), `fr` (French), `de` (German), `it` (Italian), `pt` (Portuguese), `nl` (Dutch), `pl` (Polish), `ru` (Russian), `ja` (Japanese), `zh` (Chinese), `ar` (Arabic), `hi` (Hindi), `el` (Greek), `ga` (Irish), `nah` (Nahuatl), `yua` (Yucatec Maya).
- **Core Localized Dictionary Keys**:
  - `title`: Minimalist feature title (e.g. "Sentence Detective", "Bifurcación de diálogo", "ダイアログ・フォーク").
  - `instruction`: Clear single-sentence instruction in the learner's support language.
  - `submit` / `checking` / `skip`: Action button labels.
  - `helpRequest`: Prompt string sent to the inline AI assistant.
  - `generationFailed` / `tryAnother`: Error fallback labels.
  - Variant-specific UI strings (e.g., `speaker`, `clue`, `reaction`).
- **Exported Helper Functions**:
  - `get<Variant>Copy(supportLang)`: Safely returns the localized dictionary with English fallback.
  - `format<Variant>Copy(template, variables)`: Interpolates dynamic tokens like `{sentence}` or `{speaker}`.
- **Strict Language Separation in Generation**:
  - Sentences, utterances, and choice options must be strictly in the **Target Language**.
  - Instructions, hints, assistant advice, and explanations must be strictly in the **Support Language**.

---

### 7. Integrated Variant Rotation
The approved variants are exported through `DELIGHT_VARIANT_IDS` and participate
as individual entries in the Grammar and Vocabulary shuffle bags. The host module
owns question order, lesson navigation, and quiz progress; `DelightQuestionLab`
owns generation, interaction, and grading for the selected variant.

---

### 8. Native TTS Audio Playback & Spinner Lifecycle
When question variants provide native audio playback (e.g. `DialogueFork`, `ListenDifference`):
- **Continuous Feedback**: When the user taps the speaker button (`FiVolume2`), the button immediately enters a loading state (`isLoading={isSpeaking}`) displaying the spinner throughout synthesis, stream connection, and voice playback.
- **Immediate Stop on Finish**: As soon as speech playback finishes (or on stop/cancel/error), `isSpeaking` flips to `false` and the spinner stops spinning immediately, returning to `<FiVolume2 />`.
- **Dual WebRTC & Blob Settlement**: WebRTC MediaStreams do not reliably fire standard DOM `onended` events. The handler MUST listen to both media events (`ended`, `error`, `pause`) AND the `player.finalize` promise.
- **Cleanup Guarantee**: On completion, cancellation, question switch, or error, `isSpeaking` is guaranteed to reset to `false`, preventing any stuck or infinite spinning states.

---

## Variant Implementation Checklist

When implementing or refining any of the 9 question variants:

1. [ ] **AI Grading Judge**: Ensure open-ended or semantic decisions delegate to an LLM Judge prompt (`build<Variant>JudgePrompt`).
2. [ ] **Localization (`*I18n.js`)**: Create dedicated localized copy dictionary covering all 15+ support languages with `get<Variant>Copy`.
3. [ ] **Minimalist Header**: Single title without emoji, single instruction line, assistant button on top-right.
4. [ ] **Inline Assistant Support**: Supports streaming assistance in support language via `handleAskAssistant`.
5. [ ] **Responsive Container**: Bounded width (`maxW="720px"`), squircle styling, and responsive padding.
6. [ ] **External Actions**: Submit and Skip buttons placed outside under the card.
7. [ ] **FeedbackRail**: Uses `<FeedbackRail>` for correct/incorrect feedback with dynamic XP scaling, progress wavebar, and on-demand explanation.
8. [ ] **Note Creation**: Supports `handleCreateNote` with localized summary and example sentences.
9. [ ] **Skeleton Loader**: Dedicated skeleton component with zero layout shift during generation.
10. [ ] **Host Integration**: Add the approved variant ID to `DELIGHT_VARIANTS`; the shared Grammar and Vocabulary rotations consume `DELIGHT_VARIANT_IDS` automatically.
11. [ ] **Audio & Spinner Lifecycle**: Spinner stops immediately when speaking starts, and resets cleanly on completion via `player.finalize`.
