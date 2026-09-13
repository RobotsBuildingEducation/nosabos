import { doc, getDoc, runTransaction } from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";
import { callResponses } from "./llm";
import {
  readAccountScopedJson,
  writeAccountScopedJson,
} from "./dailyQuestState";
import { getLocalDayKey } from "./flashcardReview";

export function practiceArtifactKey(focus, mode) {
  return `${focus.targetLang}_${
    focus.blueprint?.dayKey || focus.plan?.dayKey || getLocalDayKey(new Date())
  }_${mode}_${focus.blueprint?.goalId || `repair-s${focus.stepIndex || 0}`}`;
}
const artifactField = (focus, mode) =>
  `practice_${mode}_${
    focus.blueprint ? "goal" : `repair${focus.stepIndex || 0}`
  }`;
export async function practiceArtifact(focus, mode, create) {
  const key = practiceArtifactKey(focus, mode);
  const local = readAccountScopedJson(`astra:${key}`, focus.npub);
  if (local?.cards?.length) return local;
  const ref = doc(
    database,
    "users",
    focus.npub,
    "questDays",
    `${focus.targetLang}_${
      focus.blueprint?.dayKey ||
      focus.plan?.dayKey ||
      getLocalDayKey(new Date())
    }`,
  );
  const field = artifactField(focus, mode);
  try {
    const remote = (await getDoc(ref)).data()?.[field];
    if (remote?.ownerKey === key && remote?.cards?.length) {
      writeAccountScopedJson(`astra:${key}`, focus.npub, remote);
      return remote;
    }
  } catch {
    /* local deterministic deck is available offline */
  }
  const candidate = {
    version: 1,
    ownerKey: key,
    cards: await create(),
    outcomes: {},
  };
  let result = candidate;
  try {
    result = await runTransaction(database, async (tx) => {
      const existing = (await tx.get(ref)).data()?.[field];
      if (existing?.ownerKey === key && existing?.cards?.length)
        return existing;
      tx.set(ref, { [field]: candidate }, { mergeFields: [field] });
      return candidate;
    });
  } catch {
    /* keep the captured fallback usable */
  }
  writeAccountScopedJson(`astra:${key}`, focus.npub, result);
  return result;
}
export async function savePracticeOutcome(
  focus,
  mode,
  card,
  success,
  support = "prompted",
) {
  const key = practiceArtifactKey(focus, mode);
  const ref = doc(
    database,
    "users",
    focus.npub,
    "questDays",
    `${focus.targetLang}_${
      focus.blueprint?.dayKey ||
      focus.plan?.dayKey ||
      getLocalDayKey(new Date())
    }`,
  );
  const field = artifactField(focus, mode);
  const outcome = {
    success,
    support,
    item: String(
      card.practiceWord ||
        card.concept?.[focus.targetLang] ||
        card.letter ||
        "",
    ).slice(0, 180),
    transfer: card.practiceRole === "transfer",
  };
  const result = await runTransaction(database, async (tx) => {
    const data =
      (await tx.get(ref)).data()?.[field] ||
      readAccountScopedJson(`astra:${key}`, focus.npub);
    if (data?.ownerKey !== key || !data?.cards?.some((c) => c.id === card.id))
      return null;
    const next = {
      ...data,
      outcomes: { ...data.outcomes, [card.id]: outcome },
    };
    tx.set(ref, { [field]: next }, { mergeFields: [field] });
    return next;
  });
  if (result) writeAccountScopedJson(`astra:${key}`, focus.npub, result);
  return result;
}

export async function resetFocusedPracticeArtifacts(npub, targetLang) {
  const dayKey = getLocalDayKey(new Date());
  const ref = doc(
    database,
    "users",
    npub,
    "questDays",
    `${targetLang}_${dayKey}`,
  );
  await runTransaction(database, async (tx) => {
    const data = (await tx.get(ref)).data() || {};
    const patch = Object.fromEntries(
      Object.entries(data)
        .filter(([key]) => key.startsWith("practice_"))
        .map(([key, value]) => [key, { ...value, outcomes: {} }]),
    );
    if (Object.keys(patch).length)
      tx.set(ref, patch, { mergeFields: Object.keys(patch) });
  });
  if (typeof window !== "undefined") {
    const prefix = `astra:${targetLang}_${dayKey}_`;
    const suffix = `:${encodeURIComponent(npub)}`;
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(prefix) && key.endsWith(suffix))
        window.localStorage.removeItem(key);
    }
  }
}

export async function getFocusedPhonicsDeck(focus, alphabet = []) {
  return practiceArtifact(focus, "phonics", async () => {
    const item = focus.plan?.items?.[0];
    const captured =
      item?.sourceContext?.card ||
      alphabet.find((c) => c.id === item?.sourceContext);
    const original =
      captured?.practiceWord ||
      item?.originalAnswer ||
      item?.expectedAnswer ||
      captured?.letter ||
      focus.blueprint?.targetLanguage?.[0];
    // A Goal phonics blueprint lacking a sound is rerouted to Tutor by its planner.
    if (!original) return [];
    let entries = [];
    try {
      const raw = await callResponses({
        input: `Create ${
          focus.blueprint ? "exactly 2" : "3-5"
        } focused phonics items in actual language and writing system ${
          focus.targetLang
        }, explanations in ${
          focus.supportLang
        }. Original captured card: ${JSON.stringify(
          captured || {},
        )}. Required original word/sound: ${JSON.stringify(original)}. ${
          focus.blueprint
            ? `Goal: ${JSON.stringify(
                focus.blueprint,
              )}. CEFR scaffolds; needed language may stretch.`
            : `Repair CEFR ${item?.cefrLevel || "Pre-A1"}; stay level-aware.`
        } First item original; then valid language-specific minimal pair OR close contrast; third a transfer word with the same sound in another context; optional natural phrase. Never invent English-style contrasts in another language. Preserve IPA/phoneme metadata when known. JSON array only: [{word,grapheme,phoneme,tip,meaning,role:"original|contrast|transfer|phrase"}].`,
      });
      const parsed = JSON.parse(
        String(raw).slice(
          String(raw).indexOf("["),
          String(raw).lastIndexOf("]") + 1,
        ),
      );
      if (Array.isArray(parsed))
        entries = parsed
          .filter((e) => typeof e?.word === "string" && e.word.trim())
          .slice(1, focus.blueprint ? 2 : 5);
    } catch {
      /* captured card is the deterministic floor */
    }
    const first = {
      word: original,
      grapheme: captured?.letter || original,
      phoneme: captured?.phoneme || "",
      tip: item?.summary || "",
      meaning: "",
      role: "original",
    };
    const selected = [
      first,
      ...(entries.length
        ? entries
        : focus.blueprint
          ? [{ ...first, role: "transfer", tip: first.tip }]
          : []),
    ].slice(0, focus.blueprint ? 2 : 5);
    return selected.map((e, i) => ({
      ...(i === 0 ? captured || {} : {}),
      id: `focused-${practiceArtifactKey(focus, "phonics")}-${i}`,
      letter: String(e.grapheme || e.word).slice(0, 160),
      tts: String(e.word).slice(0, 160),
      practiceWord: String(e.word).slice(0, 160),
      practiceWordMeaning: {
        [focus.supportLang]: String(e.meaning || "").slice(0, 180),
      },
      phoneme: String(e.phoneme || "").slice(0, 80),
      sound: String(e.phoneme || e.grapheme || "").slice(0, 80),
      tip: String(e.tip || "").slice(0, 180),
      practiceRole: ["original", "contrast", "transfer", "phrase"].includes(
        e.role,
      )
        ? e.role
        : "contrast",
      type: "sound",
      isGoal: Boolean(focus.blueprint),
      isRepair: !focus.blueprint,
      cefrLevel: focus.blueprint?.cefrLevel || item?.cefrLevel || "Pre-A1",
    }));
  });
}

export async function getGoalFlashcards(focus) {
  return practiceArtifact(focus, "flashcards", async () => {
    const blueprint = focus.blueprint;
    let entries = blueprint.targetLanguage.map((target) => ({
      target,
      support: blueprint.objective,
    }));
    try {
      const raw = await callResponses({
        input: `Generate exactly 3 recall cards preparing this goal: ${JSON.stringify(
          blueprint,
        )}. Needed language may exceed CEFR with simple cues in ${
          focus.supportLang
        }. Return only JSON array [{target:"answer in ${
          focus.targetLang
        }",support:"cue in ${focus.supportLang}"}].`,
      });
      const parsed = JSON.parse(
        String(raw).slice(
          String(raw).indexOf("["),
          String(raw).lastIndexOf("]") + 1,
        ),
      );
      if (Array.isArray(parsed) && parsed.some((e) => e?.target && e?.support))
        entries = parsed.filter((e) => e?.target && e?.support);
    } catch {
      /* blueprint chunks remain usable */
    }
    const floor = entries.length
      ? entries
      : (blueprint.targetLanguage.length
          ? blueprint.targetLanguage
          : [blueprint.goalText || blueprint.objective]
        ).map((target) => ({ target, support: blueprint.objective }));
    const selected = Array.from({ length: 3 }, (_, index) => ({
      ...floor[index % floor.length],
      support:
        index < floor.length
          ? floor[index].support
          : `${floor[index % floor.length].support} (${index + 1})`,
    }));
    return selected
      .map((entry, i) => ({
        id: `goal-${blueprint.goalId}-${blueprint.dayKey}-c${i}`,
        isGoal: true,
        category: "goal",
        type: "phrase",
        cefrLevel: blueprint.cefrLevel,
        concept: {
          [focus.supportLang]: String(entry.support).slice(0, 180),
          [focus.targetLang]: String(entry.target).slice(0, 180),
        },
      }));
  });
}
