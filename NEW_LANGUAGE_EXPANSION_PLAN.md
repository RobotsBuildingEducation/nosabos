# New Language Expansion Plan
## Complete Guide for Adding a New Target Language

This document provides a comprehensive checklist for adding a new language to the Nosabos language learning platform. Following this guide ensures the language is properly integrated across all modules (Vocabulary, Grammar, Reading, Stories, Conversations, RealTime).

---

## Quick Reference: Language Code Standards

When adding a new language, choose an ISO 639-1 (2-letter) or ISO 639-3 (3-letter) code:
- `en` - English
- `es` - Spanish
- `pt` - Portuguese
- `fr` - French
- `it` - Italian
- `nl` - Dutch
- `ja` - Japanese
- `nah` - Huastec Nahuatl (ISO 639-3)
- `ru` - Russian
- **[NEW]** - Your new language code

---

## Alphabet Bootcamp vs Skill Tree Entry Point

When adding a new language, you must determine the **initial learning mode** based on the language's writing system:

### Non-Latin Alphabet Languages
Languages that do **not** use the Latin alphabet start in **Alphabet Bootcamp** mode first:
- `ja` - Japanese (Hiragana/Katakana/Kanji)
- `ru` - Russian (Cyrillic)
- **Future examples**: Arabic, Korean, Greek, Hebrew, Thai, Chinese, etc.

**Why?** Learners need to master the target language's writing system before they can effectively engage with vocabulary and grammar content in the skill tree.

### Latin Alphabet Languages
Languages that use the Latin alphabet start directly in the **Skill Tree** mode:
- `en` - English
- `es` - Spanish
- `pt` - Portuguese
- `fr` - French
- `it` - Italian
- `nl` - Dutch
- `nah` - Huastec Nahuatl

**Why?** Learners can immediately read and recognize words, so they can jump straight into vocabulary and grammar lessons.

### Implementation Note
When adding a new language, determine which entry point is appropriate and configure the app accordingly. This affects the initial onboarding flow and what content users see first when they select the language.

---

## File Change Checklist

### 1. Translation Strings (`src/utils/translation.jsx`)

Add language labels in **both English and Spanish** UI sections:

**English section (~line 121-129):**
```javascript
language_en: "English",
language_es: "Spanish",
// ... other languages ...
language_[NEW]: "[Language Name]",
```

**Spanish section (~line 782-790):**
```javascript
language_en: "Inglés",
language_es: "Español",
// ... other languages ...
language_[NEW]: "[Nombre del idioma]",
```

**English onboarding options (~line 161-169):**
```javascript
onboarding_practice_[NEW]: "Practice: [Language Name]",
```

**Spanish onboarding options (~line 970-978):**
```javascript
onboarding_practice_[NEW]: "Práctica: [Nombre del idioma]",
```

---

### 2. Text-to-Speech Mapping (`src/utils/tts.js`)

Add the BCP-47 language tag for TTS:

```javascript
export const TTS_LANG_TAG = {
  en: "en-US",
  es: "es-MX",
  pt: "pt-BR",
  fr: "fr-FR",
  it: "it-IT",
  nl: "nl-NL",
  nah: "es-MX",  // fallback for unsupported languages
  ja: "ja-JP",
  ru: "ru-RU",
  [NEW]: "[xx-XX]",  // e.g., "de-DE" for German
};
```

---

### 3. Onboarding Component (`src/components/Onboarding.jsx`)

**Menu button display (~line 250-258):**
```javascript
{targetLang === "[NEW]" && ui.onboarding_practice_[NEW]}
// Or with beta tag:
{targetLang === "[NEW]" && <>{ui.onboarding_practice_[NEW]} (beta)</>}
```

**Menu option (~line 266-294):**
```javascript
<MenuItemOption value="[NEW]">
  {ui.onboarding_practice_[NEW]}
</MenuItemOption>
// Or with beta tag:
<MenuItemOption value="[NEW]">
  {ui.onboarding_practice_[NEW]} (beta)
</MenuItemOption>
```

---

### 4. App Settings (`src/App.jsx`)

**TARGET_LANGUAGE_LABELS (~line 173-183):**
```javascript
const TARGET_LANGUAGE_LABELS = {
  en: "English",
  es: "Spanish",
  // ... other languages ...
  [NEW]: "[Language Name]",
};
```

**Menu button display (~line 860-878):**
```javascript
{targetLang === "[NEW]" &&
  translations[appLanguage].onboarding_practice_[NEW]}
// Or with beta tag:
{targetLang === "[NEW]" && (
  <>{translations[appLanguage].onboarding_practice_[NEW]} (beta)</>
)}
```

**Menu option (~line 888-917):**
```javascript
<MenuItemOption value="[NEW]">
  {translations[appLanguage].onboarding_practice_[NEW]}
</MenuItemOption>
```

**Validation arrays - TWO LOCATIONS (~line 1936 and ~line 2052):**
```javascript
targetLang: ["nah", "es", "pt", "en", "fr", "it", "nl", "ja", "ru", "[NEW]"].includes(
  partial.targetLang ?? prev.targetLang
)
```

---

### 5. Skill Tree Data (`src/data/skillTreeData.js`)

**SUPPORTED_TARGET_LANGS (~line 10898-10908):**
```javascript
const SUPPORTED_TARGET_LANGS = new Set([
  "en", "es", "pt", "fr", "it", "nl", "nah", "ja", "ru", "[NEW]",
]);
```

**LEARNING_PATHS (~line 10914-10924):**
```javascript
export const LEARNING_PATHS = {
  es: cloneLearningPath(),
  en: cloneLearningPath(),
  // ... other languages ...
  [NEW]: cloneLearningPath(), // [Language Name]
};
```

---

### 6. Skill Tree C2 Data (`src/data/skillTree/c2.js`)

**SUPPORTED_TARGET_LANGS (~line 1424-1434):**
```javascript
const SUPPORTED_TARGET_LANGS = new Set([
  "en", "es", "pt", "fr", "it", "nl", "nah", "ja", "ru", "[NEW]",
]);
```

**LEARNING_PATHS (~line 1440-1450):**
```javascript
export const LEARNING_PATHS = {
  es: cloneLearningPath(),
  // ... other languages ...
  [NEW]: cloneLearningPath(), // [Language Name]
};
```

---

### 7. Success Criteria (`src/data/skillTree/a1.js`)

Add language-specific success criteria for the tutorial lesson (~line 71-79):

```javascript
successCriteria: "The learner says hello to you.",
successCriteria_es: 'El estudiante te dice "hola".',
successCriteria_pt: 'O aluno diz "olá" para você.',
successCriteria_fr: 'L\'apprenant te dit "bonjour".',
successCriteria_it: 'L\'apprendente ti dice "ciao".',
successCriteria_nl: 'De leerling zegt "hallo" tegen je.',
successCriteria_nah: 'The learner says "niltze" to you.',
successCriteria_ja: 'The learner says "こんにちは" (konnichiwa) to you.',
successCriteria_ru: 'The learner says "привет" (privet) to you.',
successCriteria_[NEW]: 'The learner says "[hello in language]" to you.',
```

---

### 8. Component Validation Arrays

Each component has validation arrays that must include the new language code. Search for patterns like `["nah", "es", "pt", "en", "fr", "it", "nl", "ja", "ru"]` and add your language code.

**Files with validation arrays:**

| File | Line(s) | Description |
|------|---------|-------------|
| `src/components/LessonGroupQuiz.jsx` | ~175 | useSnapshot validation |
| `src/components/RealTimeTest.jsx` | ~964 | props validation |
| `src/components/History.jsx` | ~309, ~712 | useSharedProgress + component |
| `src/components/GrammarBook.jsx` | ~196, ~939 | useSharedProgress + component |
| `src/components/Vocabulary.jsx` | ~207, ~1025 | useSharedProgress + component |
| `src/components/Randomize.jsx` | ~105 | useSharedProgress |
| `src/components/JobScript.jsx` | ~171 | useSharedProgress |
| `src/components/Stories.jsx` | ~202-214 | useSharedProgress |

---

### 9. LANG_NAME Functions

Add language name mapping to all `LANG_NAME` / `LLM_LANG_NAME` functions used for LLM prompts:

**Files with LANG_NAME mappings:**

| File | Line(s) | Function Name |
|------|---------|---------------|
| `src/utils/noteGeneration.js` | ~5-15 | `LANG_NAME` |
| `src/components/GrammarBook.jsx` | ~155-165 | `LANG_NAME` |
| `src/components/History.jsx` | ~156-166 | `LANG_NAME` |
| `src/components/Vocabulary.jsx` | ~156-166 | `LANG_NAME` |
| `src/components/LessonGroupQuiz.jsx` | ~106-117 | `LANG_NAME` |
| `src/components/Stories.jsx` | ~90-100 | `LLM_LANG_NAME` |
| `src/components/JobScript.jsx` | ~75-91 | `LLM_LANG_NAME` |
| `src/components/HelpChatFab.jsx` | ~278-285, ~580-588 | `nameFor` (2 locations) |

**Example addition:**
```javascript
const LANG_NAME = (code) =>
  ({
    en: "English",
    es: "Spanish",
    pt: "Brazilian Portuguese",
    fr: "French",
    it: "Italian",
    nl: "Dutch",
    nah: "Huastec Nahuatl",
    ja: "Japanese",
    ru: "Russian",
    [NEW]: "[Language Name]",
  }[code] || code);
```

---

### 10. Localized Language Name Functions

Add to `localizedLangName` functions that use translation keys:

**Files with localizedLangName:**

| File | Line(s) |
|------|---------|
| `src/components/GrammarBook.jsx` | ~955-966 |
| `src/components/Vocabulary.jsx` | ~1041-1052 |
| `src/components/History.jsx` | ~741-752 |

**Example addition:**
```javascript
const localizedLangName = (code) =>
  ({
    en: t("language_en"),
    es: t("language_es"),
    // ... other languages ...
    [NEW]: t("language_[NEW]"),
  }[code] || code);
```

---

### 11. Conversations Component (`src/components/Conversations.jsx`)

**languageNameFor function (~line 743-754):**
```javascript
if (code === "[NEW]") return translations[uiLang].language_[NEW] || "[Language Name]";
```

**strict language instructions (~line 1105-1136):**
```javascript
} else if (tLang === "[NEW]") {
  strict =
    "[Native instruction to respond only in this language]. Respond ONLY in [Language Name].";
}
```

**languageName ternary chain (~line 1215-1232):**
```javascript
: tLang === "[NEW]"
? "[Language Name]"
```

---

### 12. RealTimeTest Component (`src/components/RealTimeTest.jsx`)

**buildLanguageInstructions strict (~line 1905-1930):**
```javascript
} else if (tLang === "[NEW]") {
  strict =
    "[Native instruction]. Respond ONLY in [Language Name].";
}
```

**goalLangName mappings - TWO LOCATIONS (~line 1265 and ~line 1473):**
```javascript
const goalLangName = {
  es: "Spanish",
  en: "English",
  pt: "Portuguese",
  fr: "French",
  it: "Italian",
  nl: "Dutch",
  nah: "Huastec Nahuatl",
  ja: "Japanese",
  ru: "Russian",
  [NEW]: "[Language Name]",
}[goalLangCode] || "English";
```

**probeText voice update message (~line 2095-2107):**
```javascript
: targetLangRef.current === "[NEW]"
? "[Voice updated in new language]"
```

---

### 13. BCP-47 Speech Recognition Mappings

**Files with BCP47 mappings:**

| File | Line(s) | Type |
|------|---------|------|
| `src/hooks/useSpeechPractice.js` | ~8-17 | Simple object |
| `src/components/Stories.jsx` | ~101-111 | Object with stt/tts |
| `src/components/JobScript.jsx` | ~99-114 | Function with if/else |

**Example for useSpeechPractice.js:**
```javascript
const BCP47 = {
  es: "es-ES",
  en: "en-US",
  pt: "pt-BR",
  fr: "fr-FR",
  it: "it-IT",
  nl: "nl-NL",
  nah: "es-ES",  // fallback
  ja: "ja-JP",
  ru: "ru-RU",
  [NEW]: "[xx-XX]",
};
```

**Example for Stories.jsx:**
```javascript
const BCP47 = {
  // ... other languages ...
  [NEW]: { stt: "[xx-XX]", tts: "[xx-XX]" },
};
```

---

### 14. toLangKey Functions

Add language variants to `toLangKey` functions for input normalization:

**Files with toLangKey:**

| File | Line(s) |
|------|---------|
| `src/components/Stories.jsx` | ~113-138 |
| `src/components/JobScript.jsx` | ~116-133 |

**Example addition:**
```javascript
if (["[NEW]", "[language name]", "[native name]"].includes(raw)) return "[NEW]";
```

---

### 15. resolveSupportLang Functions

If the language can be used as a support language, add to `resolveSupportLang`:

**File:** `src/components/LessonGroupQuiz.jsx` (~line 119-124)

```javascript
function resolveSupportLang(support, appUILang) {
  if (!support || support === "auto") return appUILang === "es" ? "es" : "en";
  return ["en", "es", "pt", "fr", "it", "nl", "nah", "ru", "[NEW]"].includes(support)
    ? support
    : "en";
}
```

---

## Search Commands for Verification

After making changes, run these grep commands to verify completeness:

```bash
# Find all validation arrays that might be missing your language
grep -rn '"ja"\]' --include="*.jsx" --include="*.js" src/ | grep -v '"[NEW]"'

# Find all LANG_NAME mappings
grep -rn 'ja:.*Japanese\|"ja".*Japanese' --include="*.jsx" --include="*.js" src/

# Find all language_ja references (replace with your language)
grep -rn 'language_ja' --include="*.jsx" --include="*.js" src/

# Find all BCP47 mappings
grep -rn 'ja.*ja-JP\|"ja".*"ja-JP"' --include="*.jsx" --include="*.js" src/

# Find strict language instructions
grep -rn 'tLang === "ja"' --include="*.jsx" --include="*.js" src/
```

---

## Testing Checklist

After adding a new language, test these scenarios:

- [ ] **Onboarding**: Can select the new language during onboarding
- [ ] **Entry point**: Non-Latin alphabet languages start in Alphabet Bootcamp; Latin alphabet languages start in Skill Tree
- [ ] **Alphabet Bootcamp** (non-Latin only): Character recognition and writing practice works correctly
- [ ] **Settings**: Can change to the new language in settings
- [ ] **Language persists**: Language selection persists after refresh
- [ ] **Vocabulary module**: Generates content in the new language
- [ ] **Grammar module**: Generates content in the new language
- [ ] **Reading module**: Generates content in the new language
- [ ] **Stories module**: Generates dialogues in the new language
- [ ] **Conversations tab**: Free-form chat responds in the new language
- [ ] **RealTime lessons**: Conversation practice works in the new language
- [ ] **TTS**: Text-to-speech pronounces the new language correctly
- [ ] **Speech recognition**: Understands spoken input in the new language
- [ ] **UI labels**: Language name displays correctly in English and Spanish UI

---

## Summary: File Count

| Category | Files to Modify |
|----------|-----------------|
| Translations | 1 |
| TTS Config | 1 |
| UI Components | 3 (Onboarding, App, HelpChatFab) |
| Skill Tree Data | 3 (skillTreeData, c2, a1) |
| Module Components | 7 (LessonGroupQuiz, RealTimeTest, History, GrammarBook, Vocabulary, Stories, JobScript) |
| Utility Files | 2 (tts, noteGeneration) |
| Hooks | 1 (useSpeechPractice) |
| Conversations | 1 |
| Randomize | 1 |
| **Total** | **~20 files** |

---

## Notes

### Languages Without Native TTS Support
For languages without native TTS support (like Huastec Nahuatl), use a fallback:
```javascript
nah: "es-MX",  // Uses Spanish TTS as fallback
```

### Beta Languages
To mark a language as beta, add `(beta)` to the display text in Onboarding.jsx and App.jsx menu items.

### Adding Support Languages
If the new language should also be available as a **support language** (UI language for instructions), additional changes are needed in:
- Language detection (`src/utils/languageDetection.js`)
- Support language validation arrays throughout components

### Alphabet Bootcamp Entry Point
For non-Latin alphabet languages (Japanese, Russian, Arabic, Korean, etc.), the app automatically starts users in **Alphabet Bootcamp** mode to learn the writing system first. Users progress to the Skill Tree after completing the alphabet training.

Latin alphabet languages skip the bootcamp entirely and start directly in the Skill Tree.

---

## Example: Adding German (de)

Here's a quick example of what adding German would look like:

1. **Language code**: `de`
2. **BCP-47 tag**: `de-DE`
3. **English name**: "German"
4. **Spanish name**: "Alemán"
5. **Native greeting**: "Hallo"
6. **Strict instruction**: "Antworten Sie NUR auf Deutsch. Verwenden Sie kein Englisch oder Spanisch. Respond ONLY in German."
7. **Voice updated**: "Stimme aktualisiert."

---

*Last updated: January 2026*
*Based on Russian language integration*
