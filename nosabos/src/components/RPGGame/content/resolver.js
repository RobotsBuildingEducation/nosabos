// Episode selection: affinity-ranked candidates (computed at build time into
// lesson.content.game.episodeCandidates) filtered by least-recently-played.
// Level never filters — every episode plays at every level.

import { ALL_EPISODE_IDS } from "./buckets";
import { doc, setDoc } from "firebase/firestore";
import { database } from "../../../firebaseResources/firebaseResources";

const HISTORY_LIMIT = 12;
const AVOID_RECENT = 3;

function historyKey(lang) {
  return `rpgEpisodeHistory:${String(lang || "es").toLowerCase()}`;
}

export function readEpisodeHistory(lang, remoteHistory = []) {
  try {
    const raw = window.localStorage.getItem(historyKey(lang));
    const parsed = JSON.parse(raw || "[]");
    const local = Array.isArray(parsed)
      ? parsed.filter((id) => typeof id === "string")
      : [];
    const remote = Array.isArray(remoteHistory)
      ? remoteHistory.filter((id) => typeof id === "string")
      : [];
    return [...remote, ...local].slice(-HISTORY_LIMIT);
  } catch {
    return Array.isArray(remoteHistory) ? remoteHistory.slice(-HISTORY_LIMIT) : [];
  }
}

export function recordEpisodePlay(lang, episodeId, { npub = "", remoteHistory = [] } = {}) {
  if (!episodeId) return;
  let nextHistory = [];
  try {
    const history = readEpisodeHistory(lang, remoteHistory);
    history.push(episodeId);
    nextHistory = history.slice(-HISTORY_LIMIT);
    window.localStorage.setItem(
      historyKey(lang),
      JSON.stringify(nextHistory),
    );
  } catch {
    // storage unavailable — rotation just gets less sticky
  }
  if (npub && nextHistory.length) {
    setDoc(
      doc(database, "users", npub),
      {
        progress: {
          gameEpisodeHistory: {
            [String(lang || "es").toLowerCase()]: nextHistory,
          },
        },
      },
      { merge: true },
    ).catch(() => {});
  }
}

/**
 * Pick the episode for a run. `candidates` come affinity-ranked from the
 * lesson content; fall back to the full pool when absent.
 */
export function resolveEpisodeId({ candidates, lang, history: remoteHistory = [] } = {}) {
  const ranked =
    Array.isArray(candidates) && candidates.length
      ? candidates.filter((id) => ALL_EPISODE_IDS.includes(id))
      : [...ALL_EPISODE_IDS];
  if (!ranked.length) return ALL_EPISODE_IDS[0];

  const history = readEpisodeHistory(lang, remoteHistory);
  const recent = new Set(history.slice(-AVOID_RECENT));

  const fresh = ranked.find((id) => !recent.has(id));
  if (fresh) return fresh;

  // Everything ranked was played recently — take the least recently played.
  let best = ranked[0];
  let bestIdx = Infinity;
  ranked.forEach((id) => {
    const lastIdx = history.lastIndexOf(id);
    if (lastIdx < bestIdx) {
      bestIdx = lastIdx;
      best = id;
    }
  });
  return best;
}
