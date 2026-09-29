export const GLOBAL_TEAM_FEED_HASHTAG = "LearnWithNostr";

const CACHE_TTL_MS = 2 * 60 * 1000;
const EMPTY_CACHE_TTL_MS = 15 * 1000;
let cachedFeed = null;
let cachedAt = 0;
let inFlight = null;

export function getCachedGlobalTeamFeed() {
  return cachedFeed;
}

export function loadGlobalTeamFeed(fetchNotes, { force = false } = {}) {
  if (inFlight) return inFlight;
  const cached = getCachedGlobalTeamFeed();
  const ttl = cached?.length ? CACHE_TTL_MS : EMPTY_CACHE_TTL_MS;
  if (!force && cached && Date.now() - cachedAt < ttl) {
    return Promise.resolve(cached);
  }

  const request = Promise.resolve()
    .then(() => fetchNotes(GLOBAL_TEAM_FEED_HASHTAG))
    .then((notes) => {
      cachedFeed = Array.isArray(notes) ? notes : [];
      cachedAt = Date.now();
      return cachedFeed;
    })
    .finally(() => {
      if (inFlight === request) inFlight = null;
    });
  inFlight = request;
  return request;
}

export function clearGlobalTeamFeedCache() {
  cachedFeed = null;
  cachedAt = 0;
  inFlight = null;
}
