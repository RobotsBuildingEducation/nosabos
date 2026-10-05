import { doc, getDoc, runTransaction } from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";
import { callResponses } from "./llm";
import useUserStore from "../hooks/useUserStore";
import { generationPerformanceContextFor } from "./performanceEloModel";
import {
  readAccountScopedJson,
  writeAccountScopedJson,
} from "./dailyQuestState";
import { getLocalDayKey } from "./flashcardReview";
import { getAuthoredPhonicsFocusCards, PHONICS_VERSION, PHONICS_LEVELS, getAuthoredPhonicsDeck } from "../data/phonics/index.js";

function goalPromptData(blueprint) {
  const data = { ...blueprint };
  delete data.scoreAtGeneration;
  return data;
}

export function practiceArtifactKey(focus, mode) {
  if (mode === "phonics") mode = `phonics-${PHONICS_VERSION}`;
  return `${focus.targetLang}_${
    focus.blueprint?.dayKey || focus.plan?.dayKey || getLocalDayKey(new Date())
  }_${mode}_${focus.blueprint?.goalId || `repair-s${focus.stepIndex || 0}`}`;
}
const artifactField = (focus, mode) =>
  `practice_${mode}_${
    focus.blueprint ? "goal" : `repair${focus.stepIndex || 0}`
  }${mode === "phonics" ? `_${PHONICS_VERSION}` : ""}`;
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
  const localizedFocus = { ...focus, supportLang: alphabet[0]?.supportLanguage || focus.supportLang };
  const selected = getAuthoredPhonicsFocusCards(localizedFocus);
  if (!selected.length) return { cards: [], outcomes: {}, requiresTutor: true };
  const cards = selected.map((card, index) => ({
    ...card,
    authoredId: card.id,
    id: "focused-" + practiceArtifactKey(focus, "phonics") + "-" + index,
    practiceRole: index === 0 ? "original" : index === (focus.blueprint ? 1 : 2) ? "transfer" : "contrast",
    isGoal: Boolean(focus.blueprint),
    isRepair: !focus.blueprint,
  }));
  const artifact = await practiceArtifact(focus, "phonics", async () => cards);
  // Changing support language keeps outcomes but never reuses saved copy from
  // the previous support language. Only canonical authored text is displayed.
  const byId = new Map(PHONICS_LEVELS.flatMap(level => getAuthoredPhonicsDeck(focus.targetLang, localizedFocus.supportLang, level)).map(card => [card.id, card]));
  return { ...artifact, cards: artifact.cards.flatMap(saved => {
    const source = byId.get(saved.authoredId);
    return source ? [{ ...source, authoredId: source.id, id: saved.id,
      practiceRole: saved.practiceRole, isGoal: Boolean(focus.blueprint), isRepair: !focus.blueprint }] : [];
  }) };
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
          goalPromptData(blueprint),
        )}. Live internal Elo, curriculum CEFR and performance memory: ${JSON.stringify(generationPerformanceContextFor(useUserStore.getState().user, focus.targetLang))}. Adapt recall challenge and support to this evidence. Needed language may exceed CEFR with simple cues in ${
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
