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
  try {
    return window.localStorage;
  } catch {
    try {
      return window.sessionStorage;
    } catch {
      return null;
    }
  }
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

function storageGet(storage, key) {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function storageSet(storage, key, value) {
  try {
    storage?.setItem(key, value);
  } catch {
    // OAuth remains recoverable through the server-bound Nostr key even when
    // an embedded browser blocks local storage.
  }
}

function storageRemove(storage, key) {
  try {
    storage?.removeItem(key);
  } catch {
    // Ignore restricted browser storage failures.
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
  reopenDrawer = true,
  storage,
  now = Date.now(),
} = {}) {
  const targetStorage = browserStorage(storage);
  if (!targetStorage) return;
  const record = {
    returnPath: sanitizePatreonDrawerReturnPath(returnPath),
    npub: String(npub || "").trim(),
    reopenDrawer: Boolean(reopenDrawer),
    createdAtMs: now,
  };
  storageSet(targetStorage, PENDING_KEY, JSON.stringify(record));
  storageRemove(targetStorage, READY_KEY);
  if (record.reopenDrawer) {
    storageSet(targetStorage, REOPEN_KEY, "1");
  } else {
    storageRemove(targetStorage, REOPEN_KEY);
  }
}

export function clearPatreonDrawerReturn({ storage } = {}) {
  const targetStorage = browserStorage(storage);
  if (!targetStorage) return;
  storageRemove(targetStorage, PENDING_KEY);
  storageRemove(targetStorage, READY_KEY);
  storageRemove(targetStorage, REOPEN_KEY);
}

function matchesNpub(record, npub) {
  const expectedNpub = String(npub || "").trim();
  if (!expectedNpub) return true;
  return String(record?.npub || "").trim() === expectedNpub;
}

export function hasPatreonDrawerReopenRequest({ storage, npub } = {}) {
  const targetStorage = browserStorage(storage);
  if (storageGet(targetStorage, REOPEN_KEY) !== "1") return false;
  const record =
    parseRecord(storageGet(targetStorage, READY_KEY)) ||
    parseRecord(storageGet(targetStorage, PENDING_KEY));
  return matchesNpub(record, npub);
}

export function hasPendingPatreonDrawerReturn({
  storage,
  npub,
  now = Date.now(),
} = {}) {
  const targetStorage = browserStorage(storage);
  if (!targetStorage) return false;
  const record = parseRecord(storageGet(targetStorage, PENDING_KEY));
  return isFresh(record, now) && matchesNpub(record, npub);
}

export function readPatreonDrawerReadyResult({ storage, npub } = {}) {
  const targetStorage = browserStorage(storage);
  if (!targetStorage) return "";
  const ready = parseRecord(storageGet(targetStorage, READY_KEY));
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

  let record = parseRecord(storageGet(targetStorage, PENDING_KEY));
  if (!isFresh(record, now)) {
    const ready = parseRecord(storageGet(targetStorage, READY_KEY));
    record = isFresh(ready, now) ? ready : null;
  }

  const returnPath = sanitizePatreonDrawerReturnPath(record?.returnPath || "/");
  const requestedResult = String(result || record?.result || "oauth_error");
  const normalizedResult = ALLOWED_RESULTS.has(requestedResult)
    ? requestedResult
    : "oauth_error";
  // OAuth callbacks must never select or replace the browser's active Nostr
  // identity. The key that began the signed transaction remains authoritative.
  const targetNpub = String(record?.npub || "").trim();

  const readyRecord = {
    returnPath,
    result: normalizedResult,
    npub: targetNpub,
    reopenDrawer: record?.reopenDrawer !== false,
    createdAtMs: Number(record?.createdAtMs || now),
  };
  storageRemove(targetStorage, PENDING_KEY);
  storageSet(targetStorage, READY_KEY, JSON.stringify(readyRecord));

  const parsed = new URL(returnPath, "https://piyali.app");
  if (readyRecord.reopenDrawer) {
    storageSet(targetStorage, REOPEN_KEY, "1");
    parsed.searchParams.set("patreon_drawer", "1");
    parsed.searchParams.set("patreon_result", normalizedResult);
  } else {
    storageRemove(targetStorage, REOPEN_KEY);
    parsed.searchParams.set("patreon", normalizedResult);
  }
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export const PATREON_DRAWER_RETURN_KEYS = {
  pending: PENDING_KEY,
  ready: READY_KEY,
  reopen: REOPEN_KEY,
};
