import { Bytes, doc, getDoc, onSnapshot, runTransaction } from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";
import { canRecordJourneyMilestone, completeJourneyQuest, JOURNEY_MAX_AUDIO_BYTES, JOURNEY_MAX_SECONDS, JOURNEY_MILESTONES, QUESTS_PER_JOURNEY_SESSION, journeySessionCount } from "./voiceJourneyModel";
import { decryptJourneyPayload, encryptJourneyPayload, journeyKeyWrapper } from "./voiceJourneyCrypto";

export const journeyRef = (npub, lang) => doc(database, "users", npub, "voiceJourney", lang);
const recordingRef = (npub, lang, milestone) => doc(database, "users", npub, "voiceJourney", lang, "recordings", String(milestone));

export function subscribeVoiceJourney(npub, lang, onData, onError) {
  return onSnapshot(journeyRef(npub, lang), snapshot => onData(snapshot.data() || {}), onError);
}

// Explicit test control: advance Journey without awarding XP or changing
// Today's Focus activity/receipts. Real recording persistence still applies.
export async function unlockNextJourneyMilestoneForTesting(npub, lang) {
  if (!npub) throw new Error("Sign in to test your journey");
  const ref = journeyRef(npub, lang);
  return runTransaction(database, async tx => {
    const journey = (await tx.get(ref)).data() || {};
    const milestone = JOURNEY_MILESTONES.find(number => number > journeySessionCount(journey));
    if (!milestone) return null;
    const now = new Date().toISOString();
    const next = completeJourneyQuest({
      ...journey,
      completedQuests: milestone * QUESTS_PER_JOURNEY_SESSION - 1,
    }, false, now);
    // This button opens the modal itself; suppress the automatic prompt so
    // closing it never opens another copy behind it.
    next.lastPromptedMilestone = Math.max(milestone, journey.lastPromptedMilestone || 0);
    next.lastTestUnlockAt = now;
    tx.set(ref, next);
    return { milestone, journey: next };
  });
}

// Called inside the bonus transaction, before ANY writes. This keeps XP's
// completion receipt and the durable session counter atomic across devices.
export async function prepareJourneyCompletion(tx, npub, lang, dayKey, now) {
  const ref = journeyRef(npub, lang);
  const receipt = doc(database, "users", npub, "voiceJourney", lang, "completions", dayKey);
  const snapshot = await tx.get(ref);
  const receiptSnapshot = await tx.get(receipt);
  const previous = snapshot.data() || {};
  const next = completeJourneyQuest(previous, receiptSnapshot.exists(), now);
  return () => {
    if (next === previous) return;
    tx.set(ref, next);
    tx.set(receipt, { completedAt: now, session: journeySessionCount(next) });
  };
}

export async function acknowledgeJourneyMilestone(npub, lang, milestone) {
  const ref = journeyRef(npub, lang);
  await runTransaction(database, async tx => {
    const snapshot = await tx.get(ref);
    const journey = snapshot.data() || {};
    if (!canRecordJourneyMilestone(journey, milestone)) return;
    tx.update(ref, { lastPromptedMilestone: Math.max(milestone, journey.lastPromptedMilestone || 0) });
  });
}

const blobBase64 = blob => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(",")[1]);
  reader.onerror = () => reject(new Error("Could not read recording"));
  reader.readAsDataURL(blob);
});

export async function saveJourneyRecording({ npub, lang, milestone, blob, prompt = "Voice Journey", support = "independent", duration }) {
  const cleanPrompt = (prompt && String(prompt).trim()) || "Voice Journey";
  const cleanSupport = ["independent", "hints"].includes(support) ? support : "independent";
  if (!blob?.size || blob.size > JOURNEY_MAX_AUDIO_BYTES || !blob.type.startsWith("audio/") ||
      !Number.isFinite(duration) || duration < 1 || duration > JOURNEY_MAX_SECONDS + 2 ||
      cleanPrompt.length > 600) {
    throw new Error("Invalid recording");
  }
  const wrapper = await journeyKeyWrapper(npub);
  const envelope = await encryptJourneyPayload({
    audio: await blobBase64(blob), mimeType: blob.type, prompt: cleanPrompt, support: cleanSupport, duration,
  }, { npub, lang, milestone, wrapper });
  if (localStorage.getItem("local_npub") !== npub) throw new Error("Account changed");
  const ref = journeyRef(npub, lang);
  await runTransaction(database, async tx => {
    const journey = (await tx.get(ref)).data() || {};
    if (journey.recordings?.[milestone]) throw new Error("A recording already exists at this milestone");
    if (!canRecordJourneyMilestone(journey, milestone)) throw new Error("Milestone is still locked");
    const metadata = { createdAt: new Date().toISOString(), capturedSession: journeySessionCount(journey) };
    tx.set(recordingRef(npub, lang, milestone), {
      ...envelope, iv: Bytes.fromUint8Array(envelope.iv), ciphertext: Bytes.fromUint8Array(envelope.ciphertext),
    });
    tx.update(ref, {
      [`recordings.${milestone}`]: metadata,
      lastPromptedMilestone: Math.max(milestone, journey.lastPromptedMilestone || 0),
    });
  });
}

export async function loadJourneyRecording(npub, lang, milestone) {
  const snapshot = await getDoc(recordingRef(npub, lang, milestone));
  if (!snapshot.exists()) throw new Error("Recording no longer available");
  const envelope = snapshot.data();
  const wrapper = await journeyKeyWrapper(npub);
  const payload = await decryptJourneyPayload({
    ...envelope, iv: envelope.iv.toUint8Array(), ciphertext: envelope.ciphertext.toUint8Array(),
  }, { npub, lang, milestone, wrapper });
  if (!payload.mimeType?.startsWith("audio/") || typeof payload.audio !== "string") throw new Error("Invalid recording");
  const bytes = Uint8Array.from(atob(payload.audio), character => character.charCodeAt(0));
  return { ...payload, blob: new Blob([bytes], { type: payload.mimeType }) };
}

export async function deleteJourneyRecording(npub, lang, milestone) {
  const ref = journeyRef(npub, lang);
  await runTransaction(database, async tx => {
    const journey = (await tx.get(ref)).data() || {};
    const recordings = { ...journey.recordings };
    delete recordings[milestone];
    tx.delete(recordingRef(npub, lang, milestone));
    tx.update(ref, { recordings });
  });
}
