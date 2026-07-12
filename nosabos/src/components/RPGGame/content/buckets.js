// Content-shape bucketing: maps a unit's topic strings onto the six buckets
// the episode pool is designed around, and resolves episode candidates from
// bucket affinities. Pure module — safe to import from src/data at build time.
// See RPG_REFINEMENT_PLAN.md § "Unit → episode resolution".

export const BUCKET_KEYS = [
  "vocab",
  "numbers-time",
  "social",
  "grammar-forms",
  "place",
  "discourse",
];

const BUCKET_RULES = {
  "grammar-forms":
    /tense|preterite|preterit|subjunctive|conditional|passive|pronoun|verb|gustar|comparat|superlat|future|perfect|continuous|si-clause|imperative|gerund|article|plural|negat|conjug|adjective|adverb|question words|clause|mood|reflexive|\bser\b|\bestar\b|por.*para|preposition|connector|formula|pattern|structure|hypothetical/i,
  vocab:
    /food|drink|cloth|color|colour|body|house|room|animal|family|items|objects|weather|jobs|profess|sports|hobb|technolog|nature|city|places|furniture|school|vocabulary|shapes|health/i,
  "numbers-time":
    /number|time|date|month|day|price|quantit|count|calendar|age|schedule|routine/i,
  social:
    /greet|introduc|polite|likes|dislikes|opinion|feeling|emotion|invit|apolog|thank|small talk|agree|conversation|name/i,
  place:
    /market|doctor|restaurant|shop|direction|transport|travel|airport|hotel|bank|pharmac|store|caf[eé]|ordering|ticket|tour|station/i,
  discourse:
    /essay|literature|academ|rhetor|argument|debate|abstract|culture|society|news|report|idiom|register|formal|style|tone|discourse|narrat|story|speech in writing|uncertainty/i,
};

/**
 * Weigh topic strings against the six buckets.
 * Returns { weights: {bucket: n}, dominant: bucketKey }.
 */
export function bucketizeTopics(topics = []) {
  const weights = Object.fromEntries(BUCKET_KEYS.map((key) => [key, 0]));
  (Array.isArray(topics) ? topics : []).forEach((topic) => {
    const text = String(topic || "");
    if (!text) return;
    let matched = false;
    BUCKET_KEYS.forEach((key) => {
      if (BUCKET_RULES[key].test(text)) {
        weights[key] += 1;
        matched = true;
      }
    });
    if (!matched) weights.vocab += 0.5; // unmatched topics lean lexical
  });
  const dominant = BUCKET_KEYS.reduce(
    (best, key) => (weights[key] > weights[best] ? key : best),
    BUCKET_KEYS[0],
  );
  return { weights, dominant };
}

// Affinity table from the plan (● counts). Every episode is playable at every
// level; affinities only steer which unit lands on which episode.
export const EPISODE_AFFINITIES = {
  marketRush: { vocab: 3, "numbers-time": 2, social: 1, "grammar-forms": 1, place: 2, discourse: 0 },
  cafeShift: { vocab: 2, "numbers-time": 1, social: 3, "grammar-forms": 0, place: 2, discourse: 1 },
  movingDay: { vocab: 3, "numbers-time": 0, social: 0, "grammar-forms": 2, place: 1, discourse: 0 },
  frontDesk: { vocab: 2, "numbers-time": 2, social: 1, "grammar-forms": 2, place: 1, discourse: 0 },
  ticketWindow: { vocab: 1, "numbers-time": 3, social: 0, "grammar-forms": 1, place: 2, discourse: 0 },
  clinic: { vocab: 2, "numbers-time": 0, social: 1, "grammar-forms": 3, place: 1, discourse: 0 },
  partyPrep: { vocab: 2, "numbers-time": 2, social: 3, "grammar-forms": 0, place: 0, discourse: 1 },
  detective: { vocab: 1, "numbers-time": 1, social: 0, "grammar-forms": 3, place: 0, discourse: 1 },
  fortuneTeller: { vocab: 0, "numbers-time": 1, social: 1, "grammar-forms": 3, place: 0, discourse: 2 },
  newsroom: { vocab: 1, "numbers-time": 0, social: 0, "grammar-forms": 3, place: 0, discourse: 2 },
  tertulia: { vocab: 0, "numbers-time": 0, social: 1, "grammar-forms": 2, place: 0, discourse: 3 },
  storyWorkshop: { vocab: 1, "numbers-time": 0, social: 0, "grammar-forms": 3, place: 0, discourse: 2 },
};

export const ALL_EPISODE_IDS = Object.keys(EPISODE_AFFINITIES);

/**
 * Rank episodes for a bucket-weight map; returns the top `count` episode ids.
 */
export function episodeCandidatesForWeights(weights = {}, count = 4) {
  const scored = ALL_EPISODE_IDS.map((id) => {
    const affinity = EPISODE_AFFINITIES[id];
    let score = 0;
    BUCKET_KEYS.forEach((key) => {
      score += (Number(weights[key]) || 0) * (affinity[key] || 0);
    });
    return { id, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((entry) => entry.score > 0).slice(0, count);
  // A unit that matches nothing still gets broadly-hosting episodes.
  if (!top.length) {
    return ["marketRush", "cafeShift", "frontDesk", "partyPrep"].slice(0, count);
  }
  return top.map((entry) => entry.id);
}

/**
 * Convenience used at build time by skillTreeData scaffolding.
 */
export function tagGameLessonContent(unitTopics = []) {
  const { weights, dominant } = bucketizeTopics(unitTopics);
  return {
    bucket: dominant,
    buckets: weights,
    episodeCandidates: episodeCandidatesForWeights(weights, 4),
  };
}
