const PENDING_KEY = "piyali:patreon-drawer-return:pending";
const READY_KEY = "piyali:patreon-drawer-return:ready";
const REOPEN_KEY = "piyali:patreon-drawer-return:reopen";
const RETURN_LIFETIME_MS = 10 * 60 * 1000;
const ALLOWED_RESULTS = new Set([
  "awaiting_subscription",
  "checkout_required",
  "connected",
  "link_conflict",
  "not_subscribed",
  "oauth_cancelled",
  "oauth_error",
  "replace_rate_limited",
  "replace_required",
  "state_error",
  "unavailable",
]);

function browserStorage(storage) {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

function parseRecord(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function sanitizePatreonDrawerReturnPath(value) {
  const candidate = String(value || "").trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return "/";
  try {
    const parsed = new URL(candidate, "https://piyali.app");
    if (parsed.origin !== "https://piyali.app") return "/";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}

function isFresh(record, now) {
  const createdAtMs = Number(record?.createdAtMs || 0);
  return (
    createdAtMs > 0 &&
    now - createdAtMs >= 0 &&
    now - createdAtMs <= RETURN_LIFETIME_MS
  );
}

export function currentPatreonDrawerReturnPath(locationLike = null) {
  const location =
    locationLike || (typeof window !== "undefined" ? window.location : null);
  if (!location) return "/";
  return sanitizePatreonDrawerReturnPath(
    `${location.pathname || "/"}${location.search || ""}${location.hash || ""}`,
  );
}

export function beginPatreonDrawerReturn({
  returnPath,
  npub,
  storage,
  now = Date.now(),
} = {}) {
  const targetStorage = browserStorage(storage);
  if (!targetStorage) return;
  const record = {
    returnPath: sanitizePatreonDrawerReturnPath(returnPath),
    npub: String(npub || "").trim(),
    createdAtMs: now,
  };
  targetStorage.setItem(PENDING_KEY, JSON.stringify(record));
  targetStorage.removeItem(READY_KEY);
  targetStorage.setItem(REOPEN_KEY, "1");
}

export function clearPatreonDrawerReturn({ storage } = {}) {
  const targetStorage = browserStorage(storage);
  if (!targetStorage) return;
  targetStorage.removeItem(PENDING_KEY);
  targetStorage.removeItem(READY_KEY);
  targetStorage.removeItem(REOPEN_KEY);
}

function matchesNpub(record, npub) {
  const expectedNpub = String(npub || "").trim();
  if (!expectedNpub) return true;
  return String(record?.npub || "").trim() === expectedNpub;
}

export function hasPatreonDrawerReopenRequest({ storage, npub } = {}) {
  const targetStorage = browserStorage(storage);
  if (targetStorage?.getItem(REOPEN_KEY) !== "1") return false;
  const record =
    parseRecord(targetStorage.getItem(READY_KEY)) ||
    parseRecord(targetStorage.getItem(PENDING_KEY));
  return matchesNpub(record, npub);
}

export function readPatreonDrawerReadyResult({ storage, npub } = {}) {
  const targetStorage = browserStorage(storage);
  if (!targetStorage) return "";
  const ready = parseRecord(targetStorage.getItem(READY_KEY));
  if (!matchesNpub(ready, npub)) return "";
  return String(ready?.result || "");
}

export function completePatreonDrawerReturn({
  result = "",
  storage,
  now = Date.now(),
} = {}) {
  const targetStorage = browserStorage(storage);
  if (!targetStorage) return "/";

  let record = parseRecord(targetStorage.getItem(PENDING_KEY));
  if (!isFresh(record, now)) {
    const ready = parseRecord(targetStorage.getItem(READY_KEY));
    record = isFresh(ready, now) ? ready : null;
  }

  const returnPath = sanitizePatreonDrawerReturnPath(record?.returnPath || "/");
  const requestedResult = String(result || record?.result || "oauth_error");
  const normalizedResult = ALLOWED_RESULTS.has(requestedResult)
    ? requestedResult
    : "oauth_error";
  const readyRecord = {
    returnPath,
    result: normalizedResult,
    npub: String(record?.npub || "").trim(),
    createdAtMs: Number(record?.createdAtMs || now),
  };
  targetStorage.removeItem(PENDING_KEY);
  targetStorage.setItem(READY_KEY, JSON.stringify(readyRecord));
  targetStorage.setItem(REOPEN_KEY, "1");

  const parsed = new URL(returnPath, "https://piyali.app");
  parsed.searchParams.set("patreon_drawer", "1");
  parsed.searchParams.set("patreon_result", normalizedResult);
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export const PATREON_DRAWER_RETURN_KEYS = {
  pending: PENDING_KEY,
  ready: READY_KEY,
  reopen: REOPEN_KEY,
};
