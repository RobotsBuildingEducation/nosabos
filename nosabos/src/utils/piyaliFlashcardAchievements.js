import { flashcardCompletionEvent, flashcardEvidenceForLedger } from "../achievements/flashcardProgress.js";
import { addProgressEvents } from "../achievements/progressionEvidence.js";
import { readProgressLedger } from "../achievements/progressionRuntime.js";
import { awardProgressionAchievements } from "./achievements.js";

export async function awardPiyaliFlashcardProgress({ npub, language, cards }) {
  if (!npub) return [];
  const events = cards.map(card => flashcardCompletionEvent(language, card.cardId || card.id, card)).filter(Boolean);
  if (!events.length) return [];
  const ledger = addProgressEvents(readProgressLedger(npub, "nosabos"), events);
  const evidence = flashcardEvidenceForLedger(ledger).find(item => item.language === language);
  return awardProgressionAchievements({ npub, source: "nosabos", events, evidence });
}
