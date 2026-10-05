# Authored phonics curriculum

Piyali selects its fixed pronunciation curriculum by target language, support language, and proficiency level. Those cards never use runtime translation or model generation. Learners may explicitly request a generated continuation after completing a collection.

The catalog covers **17 targets × 10 support languages × 7 levels = 1,190 localized deck choices**, with **119 canonical collections and 3,802 canonical cards**. Beginner collections cover the writing system and its principal pronunciation inventory; higher levels contain at least 24 pronunciation exercises. These level labels organize practice, not certified CEFR assessments.

| Target | Pre-A1 | A1 | A2 | B1 | B2 | C1 | C2 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| English | 58 | 24 | 24 | 28 | 28 | 28 | 28 |
| Spanish | 46 | 24 | 28 | 25 | 28 | 28 | 28 |
| Portuguese | 50 | 26 | 26 | 28 | 24 | 28 | 28 |
| Italian | 47 | 27 | 24 | 28 | 26 | 28 | 28 |
| French | 58 | 24 | 24 | 28 | 28 | 28 | 28 |
| German | 48 | 28 | 28 | 28 | 28 | 28 | 28 |
| Japanese | 237 | 24 | 28 | 27 | 27 | 28 | 28 |
| Hindi | 63 | 24 | 26 | 24 | 25 | 28 | 28 |
| Arabic | 48 | 28 | 28 | 28 | 28 | 28 | 28 |
| Mandarin | 72 | 28 | 24 | 26 | 25 | 25 | 28 |
| Russian | 44 | 27 | 24 | 33 | 24 | 25 | 28 |
| Dutch | 47 | 29 | 30 | 26 | 26 | 28 | 28 |
| Greek | 44 | 29 | 31 | 27 | 28 | 28 | 28 |
| Polish | 47 | 30 | 28 | 24 | 26 | 28 | 28 |
| Irish | 42 | 24 | 28 | 28 | 27 | 26 | 28 |
| Nahuatl | 32 | 28 | 28 | 28 | 28 | 28 | 28 |
| Yucatec Maya | 48 | 28 | 28 | 28 | 28 | 28 | 28 |

Targets: English, Spanish, Brazilian Portuguese, Italian, French, German, Japanese, Russian, Dutch, Greek, Polish, Irish, Eastern Huasteca Nahuatl, Yucatec Maya, Egyptian Arabic, Hindi, Mandarin Chinese.

Supports: English, Spanish, Portuguese, Italian, French, German, Japanese, Hindi, Arabic, Mandarin Chinese.

Levels: Pre-A1, A1, A2, B1, B2, C1, C2. Arabic, Hindi and Mandarin target decks are authored, but their existing `practiceEnabled: false` course settings remain unchanged. Existing visibility settings for all other targets remain unchanged too.

## Authoring and selection

Each target's `.js` file contains seven literal core lesson objects; its `.coverage.js` file contains the added sound inventory, words, contrasts and phrases. Every core support-language `copy` row explicitly contains a topic, an instruction and meanings. Foundation additions have their own ten localized instruction rows; higher additions use the matching level's authored instructions. `index.js` only selects literal fields and constructs identities. It does not translate or synthesize practice text.

The original 476 cards retain their identities and meanings. Added pronunciation drills deliberately omit vocabulary glosses: letters, isolated sounds and word sequences are pronunciation exercises, and are not presented with invented translations. Nahuatl and Maya sequences are contrast drills rather than fabricated sentences. Literal target words, IPA symbols and target spelling may appear inside localized guidance.

The learner starts at their highest level unlocked by placement, existing course access or sequential phonics completion. Phonics uses the same CEFR navigator and course-progress header as lessons and flashcards, displaying completed/total cards instead of XP with a gold card-completion bar. The progress card omits the redundant level and percentage labels. Previous levels stay accessible; higher levels remain locked until unlocked course access or completed phonics collections permit them. Placement skips lower gates without marking their cards complete. Finishing the current collection unlocks the next level; C2 offers repeat practice. The existing master-account unlock remains consistent with the other modes. Changing the support language changes explanations and meanings, retaining the same card and deck IDs.

Original IDs have the form `authored-v1:<target>:<level>:<card-slug>`. Added IDs use `authored-v1:<target>:<level>:coverage:<encoded-display>:<encoded-example>`, stable across support languages. Do not change an existing card's learning objective after release. Future incompatible changes need an explicit migration decision.

## Progress, compatibility and focused practice

Firebase progress is scoped to the account and target language. Reads accept positive completion counts for canonical IDs; saved words, meanings, tips and old generated decks cannot replace the authored copy. Increment writes protect counts from concurrent devices. Selecting or repeating a word does not write a completion count.

Legacy completion records and previously earned achievements are retained. The existing historical achievement scan still reads the legacy alphabet files. Legacy letter IDs are not silently treated as proof of completing newly authored words or advanced pronunciation objectives. The new collections have their own progress IDs.

An achievement observer waits for acknowledged server snapshots and checks the entire target's seven-level manifest. A deck event requires every canonical card in that collection, and uses its stable deck ID so repeats and support-language changes cannot create duplicate milestone credit. The all-phonics-cards award requires the full canonical manifest for that target. Expanding a collection retains previous card successes and previously earned awards; the added exercises start incomplete. Placement does not complete cards.

After completion, **New round** requests six new level-specific units without discarding collected cards. **Next level** remains a separate action. Generated definitions and localized copy are saved atomically in the account's `alphabetPractice` collection. They reload only for their original target, support language and level. Missing translations, wrong-script explanations, repeated words and incomplete batches are rejected; there is no English fallback. Switching accounts or levels cancels applying an outstanding request. A failed save leaves the existing collection intact.

Generated batches have their own version and six-card manifest. Fully acknowledged successes count toward distinct deck milestones; they never replace canonical requirements or unlock higher levels. The header includes generated cards in its completed/total count. Model output still needs linguistic review: script checks cannot prove the language or pronunciation quality, especially for languages sharing Latin script. Old unversioned generated definitions are retained in storage and historical achievement evidence, but are not used to supply the new localized curriculum.

Focused goal/repair practice selects the requested canonical word, even if it belongs to a different level. Saved artifacts have a curriculum version and are rehydrated with the current support language's copy. A goal word outside this finite curriculum routes to Tutor with its original objective; practicing an unrelated phonics card cannot complete it. Ordinary offline/loading fallbacks never replace a focused objective with the general collection.

## Validation and limits

Run `npm run test:phonics` for all pair/level coverage, localized copy, placement selection, stable identities, canonical progress, concurrent saves, focused practice, acknowledged achievement evidence and placement access. Tests catch missing data and wiring errors; they do not establish the linguistic quality of every translation.

Hindi-to-German was also checked in the rendered component at Pre-A1 and B2, including a Hindi/Japanese support-language switch. Both the guidance and the word meaning update in the selected support language. The expanded German foundation renders 48 cards. An isolated C2 fixture verified the visible New round action, 28 completed cards retained while six fresh cards were appended, and restoration after remounting and changing levels. That fixture used controlled generation and persistence responses, not a live model or account.

The shared header uses card counts and hides the level-completed badge in phonics. Tests cover all pairs, minimum collection sizes, required script/sound combinations, original identities, partial collections, onward unlocks, repeated attempts, support-language changes, generated reloads, atomic saves, rejected copy and stable achievement evidence.

The curriculum still needs native-speaker editorial review for every language pair, including regional pronunciation and naturalness. Nahuatl uses traditional Huasteca spelling; other communities use different orthographies. Arabic combines shared sound contrasts with Egyptian phrases. Those choices should be reviewed by speakers of the registered varieties.

Playback uses the existing TTS service. Nahuatl and Yucatec Maya currently map to a Spanish voice in that service, so they **do not yet have trustworthy native pronunciation audio**. Speech transcription plus the existing grader assesses recognizable attempts; it cannot measure pitch, tone, stress or rhythm. Advanced cards teach those features but passing a transcript comparison is not proof of mastering them.

## Editorial references

The staged sound, stress and prosody focus draws on the [Council of Europe's phonological competence descriptors](https://www.coe.int/en/web/common-european-framework-reference-languages/phonological-competence) and [CEFR Companion Volume](https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4). The level labels organize this practice curriculum; they do not certify proficiency.

Irish word checks use [Teanglann](https://www.teanglann.ie/en/). Yucatec Maya orthography references [INALI's writing norm](https://site.inali.gob.mx/Micrositios/normas/maya). Nahuatl regional scope references [SIL's Huasteca course](https://mexico.sil.org/resources/archives/326); contemporary Eastern Huasteca vocabulary checks include the Getty's [native-language vocabulary alongside folio 188v](https://florentinecodex.getty.edu/book/11/folio/188v/images/4c681520-5d26-419e-bd20-2c0c1f46ee26) and [folio 231r](https://florentinecodex.getty.edu/en/book/11/folio/231r/images/3ce72d58-4c18-43a6-a14b-5c456f24ab51). These references support editorial choices; they do not imply speaker review or endorsement of this catalog.

Expanded script coverage references the [Japan Foundation kana chart](https://www.erin.jpf.go.jp/en/extra/syllabary/), [MIT's pinyin overview](https://ocw.mit.edu/courses/res-21g-003-learning-chinese-a-foundation-course-in-mandarin-spring-2011/01af9a25b804b7d58a26fa580691df4f_MITRES_21G_003S11_pinyin.pdf) and [SIL's notes on Nahuatl orthography](https://mexico.sil.org/language_culture/aztec/notes-on-nahuatl-orthography).
