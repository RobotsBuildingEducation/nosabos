import { doc, onSnapshot } from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";
import { useEffect } from "react";
import * as achievementServices from "../utils/achievements.js";
import { useAchievementAccount } from "../achievements/useAchievementUnlock.js";
const { awardProgressionAchievements } = achievementServices;
import { getDailyPlateSnapshot } from "../utils/dailyPlate.js";
import { createCommittedProgressObserver } from "../achievements/committedProgress.js";
import { piyaliCompletionProof } from "../utils/piyaliAchievementProgress.js";
import { awardPiyaliFlashcardProgress } from "../utils/piyaliFlashcardAchievements.js";

export default function usePiyaliAchievements(user, targetLang, npub, language = "en") {
  useAchievementAccount(npub, achievementServices, language);
  const owner = user?.local_npub || user?.npub || user?.id || user?.identity;
  const practiceLanguage = String(targetLang || "es").toLowerCase();
  const dayKey = getDailyPlateSnapshot(user || {}, practiceLanguage).dayKey;
  const flashcardProgress = user?.progress?.languageFlashcards?.[practiceLanguage];
  useEffect(() => {
    if (!npub || owner !== npub || !flashcardProgress) return;
    // Normal progress hydration also recovers missed awards from cards studied
    // before this fix, without rerunning the one-time account history scan.
    const cards = Object.entries(flashcardProgress).map(([id, progress]) => ({ ...progress, cardId: progress?.cardId || id }));
    void awardPiyaliFlashcardProgress({ npub, language: practiceLanguage, cards })
      .catch(error => console.warn("Flashcard achievements:", error));
  }, [npub, owner, practiceLanguage, flashcardProgress]);
  useEffect(() => {
    if (!npub || owner !== npub) return;
    const observer = createCommittedProgressObserver(({ profile, summary, quest }) => {
      const proof = piyaliCompletionProof({ profile, summary, quest, language: practiceLanguage, dayKey });
      void awardProgressionAchievements({ npub, source: "nosabos", ...proof })
        .catch(error => console.warn("Achievement progress:", error));
    });
    const refs = {
      profile: doc(database, "users", npub),
      summary: doc(database, "users", npub, "courseProgress", practiceLanguage),
      quest: doc(database, "users", npub, "questDays", `${practiceLanguage}_${dayKey}`),
    };
    const unsubscribe = Object.entries(refs).map(([name, ref]) => onSnapshot(ref,
      { includeMetadataChanges: true }, snapshot => observer.receive(name, snapshot),
      error => console.warn("Achievement evidence:", error)));
    return () => { observer.dispose(); unsubscribe.forEach(stop => stop()); };
  }, [owner, practiceLanguage, dayKey, npub]);
}
