/* global require, Buffer, module, process */

const crypto = require("node:crypto");
const { nip19, verifyEvent } = require("nostr-tools");

const PATREON_AUTHORIZE_URL = "https://www.patreon.com/oauth2/authorize";
const PATREON_TOKEN_URL = "https://www.patreon.com/api/oauth2/token";
const PATREON_IDENTITY_URL =
  "https://www.patreon.com/api/oauth2/v2/identity";
// Firebase Hosting forwards only the specially named __session cookie to
// rewritten Functions. Prefix its payload so OAuth state and authenticated
// sessions share that transport without being interchangeable.
const FIREBASE_SESSION_COOKIE = "__session";
const OAUTH_STATE_COOKIE_KIND = "oauth-state";
const OAUTH_LINK_STATE_COOKIE_KIND = "oauth-link-state";
const AUTH_SESSION_COOKIE_KIND = "auth-session";
const SESSION_COLLECTION = "patreonOAuthSessions";
const LINK_CHALLENGE_COLLECTION = "patreonLinkChallenges";
const OAUTH_STATE_COLLECTION = "patreonOAuthStates";
const ACCOUNT_LINK_COLLECTION = "patreonAccountLinks";
const PATREON_USER_LINK_COLLECTION = "patreonUserLinks";
const NOSTR_AUTH_EVENT_KIND = 27235;
const LINK_CHALLENGE_DURATION_MS = 5 * 60 * 1000;
const USER_AGENT = "NoSabos - Patreon subscription verification";

function splitIds(value) {
  return new Set(
    String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function positiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getPatreonConfig(env = process.env) {
  const redirectUri = String(env.PATREON_REDIRECT_URI || "").trim();
  const appUrl = String(env.PATREON_APP_URL || "").trim();
  const cookieSecureSetting = String(
    env.PATREON_COOKIE_SECURE || "",
  ).toLowerCase();
  const inferredSecure = redirectUri.startsWith("https://");

  const config = {
    clientId: String(env.PATREON_CLIENT_ID || "").trim(),
    clientSecret: String(env.PATREON_CLIENT_SECRET || "").trim(),
    campaignId: String(env.PATREON_CAMPAIGN_ID || "").trim(),
    redirectUri,
    appUrl,
    tokenEncryptionKey: String(
      env.PATREON_TOKEN_ENCRYPTION_KEY || "",
    ).trim(),
    allowedTierIds: splitIds(env.PATREON_ALLOWED_TIER_IDS),
    sessionDurationMs:
      positiveNumber(env.PATREON_SESSION_DAYS, 30) * 24 * 60 * 60 * 1000,
    statusCacheMs:
      positiveNumber(env.PATREON_STATUS_CACHE_MINUTES, 10) * 60 * 1000,
    staleGraceMs:
      positiveNumber(env.PATREON_STALE_GRACE_HOURS, 6) * 60 * 60 * 1000,
    cookieSecure:
      cookieSecureSetting === "true"
        ? true
        : cookieSecureSetting === "false"
          ? false
          : inferredSecure,
  };

  config.configured = Boolean(
    config.clientId &&
      config.clientSecret &&
      config.campaignId &&
      config.redirectUri &&
      config.tokenEncryptionKey,
  );

  return config;
}

function getMembershipResources(identityPayload) {
  const membershipRefs =
    identityPayload?.data?.relationships?.memberships?.data || [];
  const membershipIds = new Set(
    membershipRefs.map((membership) => String(membership?.id || "")),
  );

  return (identityPayload?.included || []).filter(
    (resource) =>
      resource?.type === "member" && membershipIds.has(String(resource.id)),
  );
}

function getMembershipDiagnostics(identityPayload, config) {
  const membershipRefs =
    identityPayload?.data?.relationships?.memberships?.data || [];
  const includedMembers = (identityPayload?.included || []).filter(
    (resource) => resource?.type === "member",
  );

  return {
    expectedCampaignId: String(config.campaignId || ""),
    relationshipMembershipCount: membershipRefs.length,
    includedMemberCount: includedMembers.length,
    memberships: includedMembers.map((membership) => ({
      campaignId: String(
        membership?.relationships?.campaign?.data?.id || "",
      ),
      patronStatus: String(membership?.attributes?.patron_status || ""),
      lastChargeStatus: String(
        membership?.attributes?.last_charge_status || "",
      ),
      currentlyEntitledAmountCents: Number(
        membership?.attributes?.currently_entitled_amount_cents || 0,
      ),
      entitledTierCount: (
        membership?.relationships?.currently_entitled_tiers?.data || []
      ).length,
    })),
  };
}

function evaluatePatreonIdentity(identityPayload, config) {
  const memberships = getMembershipResources(identityPayload);

  if (!memberships.length) {
    return { authorized: false, reason: "no_membership" };
  }

  let matchingMembership = memberships.find((membership) => {
    const campaignId = String(
      membership?.relationships?.campaign?.data?.id || "",
    );
    return campaignId === String(config.campaignId);
  });

  // With the basic `identity` scope, Patreon returns only the user's
  // membership to the OAuth client's own campaign, but can omit the campaign
  // relationship from that Member resource. Accept that documented one-member
  // shape while continuing to reject any explicit campaign mismatch.
  if (!matchingMembership && memberships.length === 1) {
    const soleCampaignId = String(
      memberships[0]?.relationships?.campaign?.data?.id || "",
    );
    if (!soleCampaignId) matchingMembership = memberships[0];
  }

  if (!matchingMembership) {
    return { authorized: false, reason: "wrong_campaign" };
  }

  const attributes = matchingMembership.attributes || {};
  const patronStatus = String(attributes.patron_status || "").toLowerCase();
  const lastChargeStatus = String(
    attributes.last_charge_status || "",
  ).toLowerCase();
  const entitledAmountCents = Number(
    attributes.currently_entitled_amount_cents || 0,
  );
  const tierIds = (
    matchingMembership?.relationships?.currently_entitled_tiers?.data || []
  )
    .map((tier) => String(tier?.id || ""))
    .filter(Boolean);

  if (patronStatus !== "active_patron") {
    return {
      authorized: false,
      reason: "inactive_membership",
      patronStatus,
    };
  }

  if (lastChargeStatus.includes("declin") || lastChargeStatus === "failed") {
    return {
      authorized: false,
      reason: "payment_not_current",
      patronStatus,
    };
  }

  if (!Number.isFinite(entitledAmountCents) || entitledAmountCents <= 0) {
    return {
      authorized: false,
      reason: "no_paid_entitlement",
      patronStatus,
    };
  }

  if (
    config.allowedTierIds?.size > 0 &&
    !tierIds.some((tierId) => config.allowedTierIds.has(tierId))
  ) {
    return {
      authorized: false,
      reason: "tier_not_allowed",
      patronStatus,
      tierIds,
    };
  }

  return {
    authorized: true,
    reason: "active_paid_member",
    patreonUserId: String(identityPayload?.data?.id || ""),
    memberId: String(matchingMembership.id || ""),
    patronStatus,
    entitledAmountCents,
    tierIds,
  };
}

function parseCookies(cookieHeader = "") {
  return String(cookieHeader)
    .split(";")
    .reduce((cookies, part) => {
      const separator = part.indexOf("=");
      if (separator < 0) return cookies;
      const key = part.slice(0, separator).trim();
      const value = part.slice(separator + 1).trim();
      if (!key) return cookies;
      try {
        cookies[key] = decodeURIComponent(value);
      } catch {
        cookies[key] = value;
      }
      return cookies;
    }, {});
}

function encodeSessionCookieValue(kind, value) {
  return `${kind}.${String(value || "")}`;
}

function decodeSessionCookieValue(value, expectedKind) {
  const prefix = `${expectedKind}.`;
  const normalized = String(value || "");
  return normalized.startsWith(prefix) ? normalized.slice(prefix.length) : "";
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path || "/"}`);
  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  }
  if (options.httpOnly !== false) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  parts.push(`SameSite=${options.sameSite || "Lax"}`);
  return parts.join("; ");
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function decodeNpub(npub) {
  try {
    const decoded = nip19.decode(String(npub || "").trim());
    if (decoded.type !== "npub" || typeof decoded.data !== "string") return "";
    return /^[0-9a-f]{64}$/i.test(decoded.data) ? decoded.data.toLowerCase() : "";
  } catch {
    return "";
  }
}

function buildNostrAuthEvent({ action, challengeId, challenge, expiresAtMs }) {
  return {
    kind: NOSTR_AUTH_EVENT_KIND,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ["action", action],
      ["challenge", challengeId],
      ["expires", new Date(expiresAtMs).toISOString()],
    ],
    content: `Authorize Piyali Patreon ${action}: ${challenge}`,
  };
}

function verifyNostrAuthEvent(storedChallenge, signedEvent, expectedAction, now) {
  if (!storedChallenge) {
    return { valid: false, reason: "challenge_not_found" };
  }
  if (storedChallenge.usedAtMs) {
    return { valid: false, reason: "challenge_used" };
  }
  if (Number(storedChallenge.expiresAtMs || 0) <= now) {
    return { valid: false, reason: "challenge_expired" };
  }
  if (storedChallenge.action !== expectedAction) {
    return { valid: false, reason: "challenge_action_mismatch" };
  }
  if (!signedEvent || typeof signedEvent !== "object") {
    return { valid: false, reason: "missing_signed_event" };
  }
  if (String(signedEvent.pubkey || "").toLowerCase() !== storedChallenge.hexPubkey) {
    return { valid: false, reason: "public_key_mismatch" };
  }

  let template = storedChallenge.eventTemplate || {};
  if (storedChallenge.eventTemplateJson) {
    try {
      template = JSON.parse(storedChallenge.eventTemplateJson);
    } catch {
      return { valid: false, reason: "challenge_content_mismatch" };
    }
  }
  if (
    signedEvent.kind !== template.kind ||
    signedEvent.created_at !== template.created_at ||
    signedEvent.content !== template.content ||
    JSON.stringify(signedEvent.tags || []) !== JSON.stringify(template.tags || [])
  ) {
    return { valid: false, reason: "challenge_content_mismatch" };
  }

  try {
    if (!verifyEvent(signedEvent)) {
      return { valid: false, reason: "invalid_signature" };
    }
  } catch {
    return { valid: false, reason: "invalid_signature" };
  }

  return {
    valid: true,
    npub: storedChallenge.npub,
    hexPubkey: storedChallenge.hexPubkey,
  };
}

async function consumeNostrChallenge({
  db,
  challengeId,
  signedEvent,
  expectedAction,
}) {
  const challengeRef = db
    .collection(LINK_CHALLENGE_COLLECTION)
    .doc(sha256(challengeId));

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(challengeRef);
    const verification = verifyNostrAuthEvent(
      snapshot.exists ? snapshot.data() : null,
      signedEvent,
      expectedAction,
      Date.now(),
    );
    if (!verification.valid) {
      const error = new Error(verification.reason);
      error.code = verification.reason;
      error.isNostrProofError = true;
      throw error;
    }
    transaction.update(challengeRef, { usedAtMs: Date.now() });
    return verification;
  });
}

function encryptionKey(secret) {
  return crypto.createHash("sha256").update(String(secret)).digest();
}

function encryptToken(value, secret) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(secret), iv);
  const ciphertext = Buffer.concat([
    cipher.update(String(value), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext]
    .map((part) => part.toString("base64url"))
    .join(".");
}

function decryptToken(value, secret) {
  const [ivValue, tagValue, ciphertextValue] = String(value || "").split(".");
  if (!ivValue || !tagValue || !ciphertextValue) {
    throw new Error("Invalid encrypted token");
  }
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey(secret),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function redirectTarget(config, result) {
  let baseUrl = config.appUrl;
  if (!baseUrl) {
    try {
      const callbackUrl = new URL(config.redirectUri);
      baseUrl = callbackUrl.origin;
    } catch {
      baseUrl = "";
    }
  }

  if (!baseUrl) return `/subscribe?patreon=${encodeURIComponent(result)}`;
  const url = new URL("/subscribe", baseUrl);
  url.searchParams.set("patreon", result);
  return url.toString();
}

async function parseJsonResponse(response, label) {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(`${label} failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function exchangeAuthorizationCode(code, config, fetchImpl) {
  const body = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
  });
  const response = await fetchImpl(PATREON_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body,
  });
  return parseJsonResponse(response, "Patreon token exchange");
}

async function refreshAccessToken(refreshToken, config, fetchImpl) {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });
  const response = await fetchImpl(PATREON_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body,
  });
  return parseJsonResponse(response, "Patreon token refresh");
}

async function fetchIdentity(accessToken, fetchImpl) {
  const url = new URL(PATREON_IDENTITY_URL);
  url.searchParams.set("include", "memberships");
  url.searchParams.set(
    "fields[member]",
    [
      "patron_status",
      "last_charge_status",
      "currently_entitled_amount_cents",
      "is_free_trial",
      "is_gifted",
    ].join(","),
  );

  const response = await fetchImpl(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": USER_AGENT,
    },
  });
  return parseJsonResponse(response, "Patreon identity request");
}

function buildAuthorizedRecord({ membership, tokens, config, now }) {
  return {
    authorized: true,
    patreonUserId: membership.patreonUserId,
    memberId: membership.memberId,
    tierIds: membership.tierIds,
    entitledAmountCents: membership.entitledAmountCents,
    lastVerifiedAtMs: now,
    oauthExpiresAtMs: now + positiveNumber(tokens.expires_in, 3600) * 1000,
    encryptedAccessToken: encryptToken(
      tokens.access_token,
      config.tokenEncryptionKey,
    ),
    encryptedRefreshToken: encryptToken(
      tokens.refresh_token,
      config.tokenEncryptionKey,
    ),
  };
}

async function evaluateStoredPatreonRecord(record, config, fetchImpl) {
  const now = Date.now();
  if (
    record.authorized &&
    now - Number(record.lastVerifiedAtMs || 0) < config.statusCacheMs
  ) {
    return { authorized: true, stale: false, updates: null };
  }

  try {
    let accessToken = decryptToken(
      record.encryptedAccessToken,
      config.tokenEncryptionKey,
    );
    let refreshToken = decryptToken(
      record.encryptedRefreshToken,
      config.tokenEncryptionKey,
    );
    let oauthExpiresAtMs = Number(record.oauthExpiresAtMs || 0);

    if (oauthExpiresAtMs <= now + 60_000) {
      const refreshed = await refreshAccessToken(
        refreshToken,
        config,
        fetchImpl,
      );
      if (!refreshed?.access_token) {
        throw new Error("Patreon refresh response did not include an access token");
      }
      accessToken = refreshed.access_token;
      refreshToken = refreshed.refresh_token || refreshToken;
      oauthExpiresAtMs =
        now + positiveNumber(refreshed.expires_in, 3600) * 1000;
    }

    const identity = await fetchIdentity(accessToken, fetchImpl);
    const membership = evaluatePatreonIdentity(identity, config);
    if (!membership.authorized) {
      return {
        authorized: false,
        reason: membership.reason,
        identity,
        updates: {
          authorized: false,
          lastVerifiedAtMs: now,
          oauthExpiresAtMs,
          encryptedAccessToken: encryptToken(
            accessToken,
            config.tokenEncryptionKey,
          ),
          encryptedRefreshToken: encryptToken(
            refreshToken,
            config.tokenEncryptionKey,
          ),
        },
      };
    }

    return {
      authorized: true,
      stale: false,
      membership,
      updates: {
        authorized: true,
        patreonUserId: membership.patreonUserId,
        memberId: membership.memberId,
        tierIds: membership.tierIds,
        entitledAmountCents: membership.entitledAmountCents,
        lastVerifiedAtMs: now,
        oauthExpiresAtMs,
        encryptedAccessToken: encryptToken(
          accessToken,
          config.tokenEncryptionKey,
        ),
        encryptedRefreshToken: encryptToken(
          refreshToken,
          config.tokenEncryptionKey,
        ),
      },
    };
  } catch (error) {
    if (
      record.authorized &&
      now - Number(record.lastVerifiedAtMs || 0) <= config.staleGraceMs
    ) {
      return { authorized: true, stale: true, updates: null };
    }
    throw error;
  }
}

async function createBrowserSession({ db, record, config }) {
  const now = Date.now();
  const rawSessionId = crypto.randomBytes(32).toString("base64url");
  await db
    .collection(SESSION_COLLECTION)
    .doc(sha256(rawSessionId))
    .set({
      authorized: true,
      patreonUserId: record.patreonUserId,
      memberId: record.memberId,
      tierIds: record.tierIds || [],
      entitledAmountCents: record.entitledAmountCents,
      linkedNpub: record.npub || "",
      createdAtMs: now,
      lastVerifiedAtMs: Number(record.lastVerifiedAtMs || now),
      expiresAtMs: now + config.sessionDurationMs,
      oauthExpiresAtMs: record.oauthExpiresAtMs,
      encryptedAccessToken: record.encryptedAccessToken,
      encryptedRefreshToken: record.encryptedRefreshToken,
    });
  return rawSessionId;
}

async function linkPatreonAccount({ db, npub, hexPubkey, record }) {
  const now = Date.now();
  const npubHash = sha256(npub);
  const patreonUserHash = sha256(record.patreonUserId);
  const accountRef = db.collection(ACCOUNT_LINK_COLLECTION).doc(npubHash);
  const patreonUserRef = db
    .collection(PATREON_USER_LINK_COLLECTION)
    .doc(patreonUserHash);

  await db.runTransaction(async (transaction) => {
    const [accountSnapshot, patreonUserSnapshot] = await Promise.all([
      transaction.get(accountRef),
      transaction.get(patreonUserRef),
    ]);
    const existingAccount = accountSnapshot.exists
      ? accountSnapshot.data()
      : null;
    const existingPatreonUser = patreonUserSnapshot.exists
      ? patreonUserSnapshot.data()
      : null;

    if (
      existingAccount?.patreonUserId &&
      existingAccount.patreonUserId !== record.patreonUserId
    ) {
      const error = new Error("piyali_key_already_linked");
      error.code = "piyali_key_already_linked";
      throw error;
    }
    if (
      existingPatreonUser?.npubHash &&
      existingPatreonUser.npubHash !== npubHash
    ) {
      const error = new Error("patreon_account_already_linked");
      error.code = "patreon_account_already_linked";
      throw error;
    }

    transaction.set(accountRef, {
      ...record,
      npub,
      hexPubkey,
      linkedAtMs: Number(existingAccount?.linkedAtMs || now),
      updatedAtMs: now,
    });
    transaction.set(patreonUserRef, {
      npubHash,
      linkedAtMs: Number(existingPatreonUser?.linkedAtMs || now),
      updatedAtMs: now,
    });
  });

  return accountRef;
}

function setJsonHeaders(res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
}

function sendJson(res, status, payload) {
  setJsonHeaders(res);
  return res.status(status).send(JSON.stringify(payload));
}

function clearCookie(name, secure) {
  return serializeCookie(name, "", { maxAge: 0, secure });
}

function requestPath(req) {
  try {
    return new URL(req.originalUrl || req.url || "/", "http://localhost")
      .pathname;
  } catch {
    return req.path || "/";
  }
}

function createPatreonHandler({ db, getConfig, fetchImpl = fetch, logger }) {
  const log = logger || console;

  return async function patreonHandler(req, res) {
    const config = getConfig();
    const path = requestPath(req).replace(/\/+$/, "") || "/";
    res.setHeader("Cache-Control", "no-store, max-age=0");

    if (path.endsWith("/link-challenge")) {
      if (req.method !== "POST") {
        return sendJson(res, 405, { error: "method_not_allowed" });
      }
      if (!config.configured) {
        return sendJson(res, 503, { error: "patreon_unavailable" });
      }

      const npub = String(req.body?.npub || "").trim();
      const action = String(req.body?.action || "").trim();
      const hexPubkey = decodeNpub(npub);
      if (!hexPubkey || !["link", "restore"].includes(action)) {
        return sendJson(res, 400, { error: "invalid_link_request" });
      }

      const challengeId = crypto.randomBytes(24).toString("base64url");
      const challenge = crypto.randomBytes(32).toString("base64url");
      const expiresAtMs = Date.now() + LINK_CHALLENGE_DURATION_MS;
      const eventTemplate = buildNostrAuthEvent({
        action,
        challengeId,
        challenge,
        expiresAtMs,
      });
      await db
        .collection(LINK_CHALLENGE_COLLECTION)
        .doc(sha256(challengeId))
        .set({
          npub,
          hexPubkey,
          action,
          // Firestore does not allow an array nested directly inside another
          // array, which Nostr tags use. Preserve the exact signed template as
          // JSON so round-trip verification remains byte-for-byte strict.
          eventTemplateJson: JSON.stringify(eventTemplate),
          createdAtMs: Date.now(),
          expiresAtMs,
          usedAtMs: null,
        });

      return sendJson(res, 200, { challengeId, eventTemplate });
    }

    if (path.endsWith("/link-start")) {
      if (req.method !== "POST") {
        return sendJson(res, 405, { error: "method_not_allowed" });
      }
      if (!config.configured) {
        return sendJson(res, 503, { error: "patreon_unavailable" });
      }

      try {
        const proof = await consumeNostrChallenge({
          db,
          challengeId: String(req.body?.challengeId || ""),
          signedEvent: req.body?.signedEvent,
          expectedAction: "link",
        });
        const state = crypto.randomBytes(32).toString("base64url");
        await db
          .collection(OAUTH_STATE_COLLECTION)
          .doc(sha256(state))
          .set({
            npub: proof.npub,
            hexPubkey: proof.hexPubkey,
            createdAtMs: Date.now(),
            expiresAtMs: Date.now() + 10 * 60 * 1000,
          });

        const authorizeUrl = new URL(PATREON_AUTHORIZE_URL);
        authorizeUrl.searchParams.set("response_type", "code");
        authorizeUrl.searchParams.set("client_id", config.clientId);
        authorizeUrl.searchParams.set("redirect_uri", config.redirectUri);
        authorizeUrl.searchParams.set("scope", "identity");
        authorizeUrl.searchParams.set("state", state);
        res.setHeader(
          "Set-Cookie",
          serializeCookie(
            FIREBASE_SESSION_COOKIE,
            encodeSessionCookieValue(OAUTH_LINK_STATE_COOKIE_KIND, state),
            { maxAge: 10 * 60, secure: config.cookieSecure },
          ),
        );
        return sendJson(res, 200, { authorizeUrl: authorizeUrl.toString() });
      } catch (error) {
        if (error?.isNostrProofError) {
          log.warn("Invalid Patreon link proof", error?.code || error?.message);
          return sendJson(res, 401, { error: "invalid_nostr_proof" });
        }
        log.error("Unable to start Patreon linking", error?.message || error);
        return sendJson(res, 503, { error: "patreon_unavailable" });
      }
    }

    if (path.endsWith("/key-status")) {
      if (req.method !== "POST") {
        return sendJson(res, 405, { error: "method_not_allowed" });
      }
      if (!config.configured) {
        return sendJson(res, 503, {
          authorized: false,
          configured: false,
        });
      }

      try {
        const proof = await consumeNostrChallenge({
          db,
          challengeId: String(req.body?.challengeId || ""),
          signedEvent: req.body?.signedEvent,
          expectedAction: "restore",
        });
        const accountRef = db
          .collection(ACCOUNT_LINK_COLLECTION)
          .doc(sha256(proof.npub));
        const accountSnapshot = await accountRef.get();
        if (!accountSnapshot.exists) {
          return sendJson(res, 200, {
            authorized: false,
            configured: true,
            linked: false,
          });
        }

        const account = accountSnapshot.data() || {};
        const evaluation = await evaluateStoredPatreonRecord(
          account,
          config,
          fetchImpl,
        );
        if (evaluation.updates) {
          await accountRef.set(
            { ...evaluation.updates, updatedAtMs: Date.now() },
            { merge: true },
          );
        }
        if (!evaluation.authorized) {
          return sendJson(res, 200, {
            authorized: false,
            configured: true,
            linked: true,
            reason: evaluation.reason,
          });
        }

        const currentRecord = { ...account, ...(evaluation.updates || {}) };
        const rawSessionId = await createBrowserSession({
          db,
          record: currentRecord,
          config,
        });
        res.setHeader(
          "Set-Cookie",
          serializeCookie(
            FIREBASE_SESSION_COOKIE,
            encodeSessionCookieValue(AUTH_SESSION_COOKIE_KIND, rawSessionId),
            {
              maxAge: config.sessionDurationMs / 1000,
              secure: config.cookieSecure,
            },
          ),
        );
        return sendJson(res, 200, {
          authorized: true,
          configured: true,
          linked: true,
          stale: Boolean(evaluation.stale),
        });
      } catch (error) {
        if (error?.isNostrProofError) {
          return sendJson(res, 401, { error: "invalid_nostr_proof" });
        }
        log.error("Patreon key restore failed", error?.message || error);
        return sendJson(res, 503, {
          authorized: false,
          configured: true,
          error: "patreon_unavailable",
        });
      }
    }

    if (path.endsWith("/status")) {
      if (req.method !== "GET") {
        return sendJson(res, 405, { error: "method_not_allowed" });
      }
      if (!config.configured) {
        return sendJson(res, 200, {
          authorized: false,
          configured: false,
        });
      }

      const cookies = parseCookies(req.headers.cookie);
      const rawSessionId = decodeSessionCookieValue(
        cookies[FIREBASE_SESSION_COOKIE],
        AUTH_SESSION_COOKIE_KIND,
      );
      if (!rawSessionId) {
        return sendJson(res, 200, {
          authorized: false,
          configured: true,
        });
      }

      const sessionRef = db
        .collection(SESSION_COLLECTION)
        .doc(sha256(rawSessionId));
      const sessionSnapshot = await sessionRef.get();
      if (!sessionSnapshot.exists) {
        res.setHeader(
          "Set-Cookie",
          clearCookie(FIREBASE_SESSION_COOKIE, config.cookieSecure),
        );
        return sendJson(res, 200, {
          authorized: false,
          configured: true,
        });
      }

      const session = sessionSnapshot.data() || {};
      const now = Date.now();
      if (!session.authorized || Number(session.expiresAtMs || 0) <= now) {
        await sessionRef.delete();
        res.setHeader(
          "Set-Cookie",
          clearCookie(FIREBASE_SESSION_COOKIE, config.cookieSecure),
        );
        return sendJson(res, 200, {
          authorized: false,
          configured: true,
        });
      }

      try {
        const evaluation = await evaluateStoredPatreonRecord(
          session,
          config,
          fetchImpl,
        );
        if (!evaluation.authorized) {
          log.warn("Patreon session membership rejected", {
            reason: evaluation.reason,
            ...getMembershipDiagnostics(evaluation.identity, config),
          });
          await sessionRef.delete();
          res.setHeader(
            "Set-Cookie",
            clearCookie(FIREBASE_SESSION_COOKIE, config.cookieSecure),
          );
          return sendJson(res, 200, {
            authorized: false,
            configured: true,
            reason: evaluation.reason,
          });
        }

        if (evaluation.updates) {
          await sessionRef.set(evaluation.updates, { merge: true });
        }

        return sendJson(res, 200, {
          authorized: true,
          configured: true,
          stale: Boolean(evaluation.stale),
        });
      } catch (error) {
        log.error("Patreon status refresh failed", error?.message || error);
        return sendJson(res, 503, {
          authorized: false,
          configured: true,
          error: "patreon_unavailable",
        });
      }
    }

    if (path.endsWith("/start")) {
      if (req.method !== "GET") {
        return sendJson(res, 405, { error: "method_not_allowed" });
      }
      if (!config.configured) {
        return res.redirect(302, redirectTarget(config, "unavailable"));
      }

      const state = crypto.randomBytes(32).toString("base64url");
      const authorizeUrl = new URL(PATREON_AUTHORIZE_URL);
      authorizeUrl.searchParams.set("response_type", "code");
      authorizeUrl.searchParams.set("client_id", config.clientId);
      authorizeUrl.searchParams.set("redirect_uri", config.redirectUri);
      authorizeUrl.searchParams.set("scope", "identity");
      authorizeUrl.searchParams.set("state", state);

      res.setHeader(
        "Set-Cookie",
        serializeCookie(
          FIREBASE_SESSION_COOKIE,
          encodeSessionCookieValue(OAUTH_STATE_COOKIE_KIND, state),
          {
            maxAge: 10 * 60,
            secure: config.cookieSecure,
          },
        ),
      );
      return res.redirect(302, authorizeUrl.toString());
    }

    if (path.endsWith("/callback")) {
      if (req.method !== "GET") {
        return sendJson(res, 405, { error: "method_not_allowed" });
      }
      if (!config.configured) {
        return res.redirect(302, redirectTarget(config, "unavailable"));
      }

      const cookies = parseCookies(req.headers.cookie);
      const expectedLinkState = decodeSessionCookieValue(
        cookies[FIREBASE_SESSION_COOKIE],
        OAUTH_LINK_STATE_COOKIE_KIND,
      );
      const expectedState =
        expectedLinkState ||
        decodeSessionCookieValue(
          cookies[FIREBASE_SESSION_COOKIE],
          OAUTH_STATE_COOKIE_KIND,
        );
      const receivedState = String(req.query?.state || "");
      const code = String(req.query?.code || "");
      const oauthError = String(req.query?.error || "");
      res.setHeader(
        "Set-Cookie",
        clearCookie(FIREBASE_SESSION_COOKIE, config.cookieSecure),
      );

      if (
        !expectedState ||
        !receivedState ||
        !safeEqual(expectedState, receivedState)
      ) {
        return res.redirect(302, redirectTarget(config, "state_error"));
      }

      let linkProof = null;
      if (expectedLinkState) {
        try {
          const oauthStateRef = db
            .collection(OAUTH_STATE_COLLECTION)
            .doc(sha256(receivedState));
          const oauthStateSnapshot = await oauthStateRef.get();
          const oauthState = oauthStateSnapshot.exists
            ? oauthStateSnapshot.data() || {}
            : null;
          if (oauthStateSnapshot.exists) await oauthStateRef.delete();
          if (oauthState && Number(oauthState.expiresAtMs || 0) > Date.now()) {
            linkProof = {
              npub: String(oauthState.npub || ""),
              hexPubkey: String(oauthState.hexPubkey || ""),
            };
          }
        } catch (error) {
          log.error("Unable to read Patreon link state", error?.message || error);
        }
        if (!linkProof?.npub || !linkProof?.hexPubkey) {
          return res.redirect(302, redirectTarget(config, "state_error"));
        }
      }

      if (oauthError) {
        return res.redirect(302, redirectTarget(config, "oauth_cancelled"));
      }
      if (!code) {
        return res.redirect(302, redirectTarget(config, "oauth_error"));
      }

      try {
        const tokens = await exchangeAuthorizationCode(code, config, fetchImpl);
        if (!tokens?.access_token || !tokens?.refresh_token) {
          throw new Error("Patreon OAuth response did not include both tokens");
        }
        const identity = await fetchIdentity(tokens.access_token, fetchImpl);
        const membership = evaluatePatreonIdentity(identity, config);

        if (!membership.authorized) {
          log.warn("Patreon OAuth membership rejected", {
            reason: membership.reason,
            ...getMembershipDiagnostics(identity, config),
          });
          return res.redirect(
            302,
            redirectTarget(config, "not_subscribed"),
          );
        }

        const now = Date.now();
        const authorizedRecord = buildAuthorizedRecord({
          membership,
          tokens,
          config,
          now,
        });
        if (linkProof?.npub && linkProof?.hexPubkey) {
          try {
            await linkPatreonAccount({
              db,
              npub: linkProof.npub,
              hexPubkey: linkProof.hexPubkey,
              record: authorizedRecord,
            });
            authorizedRecord.npub = linkProof.npub;
          } catch (error) {
            if (
              error?.code === "piyali_key_already_linked" ||
              error?.code === "patreon_account_already_linked"
            ) {
              return res.redirect(302, redirectTarget(config, "link_conflict"));
            }
            throw error;
          }
        }

        const rawSessionId = await createBrowserSession({
          db,
          record: authorizedRecord,
          config,
        });

        res.setHeader(
          "Set-Cookie",
          serializeCookie(
            FIREBASE_SESSION_COOKIE,
            encodeSessionCookieValue(AUTH_SESSION_COOKIE_KIND, rawSessionId),
            {
              maxAge: config.sessionDurationMs / 1000,
              secure: config.cookieSecure,
            },
          ),
        );
        return res.redirect(302, redirectTarget(config, "connected"));
      } catch (error) {
        log.error("Patreon OAuth callback failed", error?.message || error);
        return res.redirect(302, redirectTarget(config, "oauth_error"));
      }
    }

    if (path.endsWith("/logout")) {
      if (req.method !== "POST") {
        return sendJson(res, 405, { error: "method_not_allowed" });
      }
      const cookies = parseCookies(req.headers.cookie);
      const rawSessionId = decodeSessionCookieValue(
        cookies[FIREBASE_SESSION_COOKIE],
        AUTH_SESSION_COOKIE_KIND,
      );
      if (rawSessionId) {
        await db
          .collection(SESSION_COLLECTION)
          .doc(sha256(rawSessionId))
          .delete()
          .catch(() => {});
      }
      res.setHeader(
        "Set-Cookie",
        clearCookie(FIREBASE_SESSION_COOKIE, config.cookieSecure),
      );
      return sendJson(res, 200, { ok: true });
    }

    return sendJson(res, 404, { error: "not_found" });
  };
}

module.exports = {
  buildNostrAuthEvent,
  createPatreonHandler,
  decodeNpub,
  decodeSessionCookieValue,
  decryptToken,
  encodeSessionCookieValue,
  encryptToken,
  evaluatePatreonIdentity,
  getPatreonConfig,
  parseCookies,
  serializeCookie,
  sha256,
  verifyNostrAuthEvent,
};
