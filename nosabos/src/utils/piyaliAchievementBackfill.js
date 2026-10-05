import { buildCourseProgressSummary, mergeCourseProgressSummaries } from "./courseProgress.js";
import { piyaliCompletionProof } from "./piyaliAchievementProgress.js";
import { phonicsCompletionEvidence } from "../achievements/phonicsProgress.js";
import { TUTOR_LEVELS, earnedTutorAchievementIds } from "../achievements/catalog.js";
import { completeLevel, levelKey } from "../achievements/progressionEvidence.js";
import { tutorLevelFromCompletions } from "../achievements/proficiencyCompletion.js";
import { flashcardCompletionEvent } from "../achievements/flashcardProgress.js";

// Server documents and legacy account maps contain explicit completion state.
// XP, placement, selected levels and daily activity totals are not curriculum proof.
export function piyaliBackfillProofs({ profile, records, alphabets = {} }) {
  const byLanguage = new Map();
  const bucket = language => {
    if (!language || typeof language !== "string") return null;
    const key = language.toLowerCase();
    if (!byLanguage.has(key)) byLanguage.set(key, { languageLessons: [], tutorLanguageLessons: [], languageFlashcards: [], alphabetPractice: [], quests: [] });
    return byLanguage.get(key);
  };
  for (const field of ["languageLessons", "tutorLanguageLessons", "languageFlashcards"]) {
    const add = (language, entry) => {
      const group = bucket(language);
      if (!group) return;
      const target = field === "languageLessons" && entry.data?.tutorAgendaProgress ? "tutorLanguageLessons" : field;
      group[target].push(entry);
    };
    for (const entry of records[field] || []) add(entry.data.targetLang || (/^([^_]+)_/.exec(entry.id)?.[1]), entry);
    for (const [language, map] of Object.entries(profile.progress?.[field] || {})) {
      for (const [id, data] of Object.entries(map || {})) add(language, { id, data });
    }
  }
  for (const entry of records.courseProgress || []) {
    const group = bucket(entry.data.targetLang || entry.id);
    if (group && entry.data.migration?.complete === true) group.summary = entry.data;
  }
  for (const entry of records.alphabetPractice || []) bucket(entry.data.targetLang)?.alphabetPractice.push(entry.data);
  for (const entry of records.questDays || []) {
    if (entry.data.dayKey) bucket(entry.data.lang)?.quests.push(entry.data);
  }
  for (const language of Object.keys(profile.learningIntelligence || {})) bucket(language);
  if (profile.realWorldTasks?.targetLang) bucket(profile.realWorldTasks.targetLang);
  // Older repair plans may still be on the account, before schema migration.
  for (const [language, days] of Object.entries(profile.dailyQuestRepair || {})) {
    for (const [dayKey, repair] of Object.entries(days || {})) bucket(language)?.quests.push({ dayKey, repair });
  }
  const proofs = [], achievementIds = new Set();
  for (const [language, group] of byLanguage) {
    const calculated = buildCourseProgressSummary({ targetLang: language, ...group });
    const summary = mergeCourseProgressSummaries(calculated, group.summary);
    const proof = piyaliCompletionProof({ profile, summary, language });
    const cardEvents = [...new Map(group.languageFlashcards.map(entry =>
      flashcardCompletionEvent(language, entry.data.cardId || entry.id.replace(`${language}_`, ""), entry.data))
      .filter(Boolean).map(event => [event.id, event])).values()];
    proof.events.push(...cardEvents);
    proof.evidence.counters.flashcards_completed = Math.max(proof.evidence.counters.flashcards_completed, cardEvents.length);
    proofs.push(proof);
    for (const quest of group.quests) proofs.push(piyaliCompletionProof({ profile, quest, language, dayKey: quest.dayKey }));
    const earned = tutorLevelFromCompletions(Object.fromEntries(TUTOR_LEVELS.map(level =>
      [level, { isComplete: completeLevel(summary.tutor.levels[levelKey(level)]) }])));
    earnedTutorAchievementIds(earned).forEach(id => achievementIds.add(id));
    if (group.alphabetPractice.length && alphabets[language]?.length) {
      proofs.push(phonicsCompletionEvidence(language, alphabets[language], group.alphabetPractice));
    }
  }
  return { proofs, achievementIds: [...achievementIds] };
}

export async function scanPiyaliAchievementHistory(npub, { database, doc, collection, getDoc, getDocs }) {
  const profile = (await getDoc(doc(database, "users", npub))).data();
  if (!profile) throw new Error("Achievement catch-up is waiting for the account profile");
  const names = ["courseProgress", "languageLessons", "tutorLanguageLessons", "languageFlashcards", "alphabetPractice", "questDays"];
  const snapshots = await Promise.all(names.map(name => getDocs(collection(database, "users", npub, name))));
  const records = Object.fromEntries(names.map((name, index) => [name, snapshots[index].docs.map(snapshot => ({ id: snapshot.id, data: snapshot.data() }))]));
  const alphabetLanguages = [...new Set(records.alphabetPractice.map(entry => entry.data.targetLang).filter(Boolean))];
  const alphabetNames = { ru: "russian", ja: "japanese", en: "english", es: "spanish", pt: "portuguese", fr: "french", it: "italian", nl: "dutch", de: "german", nah: "nahuatl", el: "greek", pl: "polish", ga: "irish", yua: "yucatecMaya" };
  // Load only alphabets with saved practice, after all historical reads succeed.
  const modules = import.meta.glob("../data/*Alphabet.js");
  const alphabets = {};
  await Promise.all(alphabetLanguages.map(async language => {
    const load = modules[`../data/${alphabetNames[language]}Alphabet.js`];
    if (load) alphabets[language] = Object.values(await load()).find(Array.isArray);
  }));
  return piyaliBackfillProofs({ profile, records, alphabets });
}
