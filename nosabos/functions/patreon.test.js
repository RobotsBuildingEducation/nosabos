/* global require */

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  decodeSessionCookieValue,
  decryptToken,
  encodeSessionCookieValue,
  encryptToken,
  evaluatePatreonIdentity,
  getPatreonConfig,
  parseCookies,
  serializeCookie,
} = require("./patreon");

function identityWithMembership({
  campaignId = "campaign-1",
  patronStatus = "active_patron",
  lastChargeStatus = "Paid",
  amountCents = 500,
  tierIds = ["tier-annual"],
} = {}) {
  return {
    data: {
      id: "patreon-user-1",
      type: "user",
      relationships: {
        memberships: {
          data: [{ id: "member-1", type: "member" }],
        },
      },
    },
    included: [
      {
        id: "member-1",
        type: "member",
        attributes: {
          patron_status: patronStatus,
          last_charge_status: lastChargeStatus,
          currently_entitled_amount_cents: amountCents,
        },
        relationships: {
          ...(campaignId
            ? { campaign: { data: { id: campaignId, type: "campaign" } } }
            : {}),
          currently_entitled_tiers: {
            data: tierIds.map((id) => ({ id, type: "tier" })),
          },
        },
      },
    ],
  };
}

function config(overrides = {}) {
  return {
    campaignId: "campaign-1",
    allowedTierIds: new Set(),
    ...overrides,
  };
}

test("authorizes an active paid member of the configured campaign", () => {
  const result = evaluatePatreonIdentity(identityWithMembership(), config());
  assert.equal(result.authorized, true);
  assert.equal(result.patreonUserId, "patreon-user-1");
  assert.equal(result.memberId, "member-1");
  assert.equal(result.entitledAmountCents, 500);
});

test("authorizes the sole client-campaign membership when Patreon omits its campaign relationship", () => {
  const result = evaluatePatreonIdentity(
    identityWithMembership({ campaignId: null }),
    config(),
  );

  assert.equal(result.authorized, true);
  assert.equal(result.reason, "active_paid_member");
  assert.equal(result.entitledAmountCents, 500);
});

test("denies users without a Patreon membership", () => {
  const result = evaluatePatreonIdentity(
    { data: { relationships: { memberships: { data: [] } } }, included: [] },
    config(),
  );
  assert.deepEqual(result, { authorized: false, reason: "no_membership" });
});

test("denies membership for another campaign", () => {
  const result = evaluatePatreonIdentity(
    identityWithMembership({ campaignId: "campaign-2" }),
    config(),
  );
  assert.equal(result.authorized, false);
  assert.equal(result.reason, "wrong_campaign");
});

test("denies inactive, declined, and zero-value memberships", () => {
  const inactive = evaluatePatreonIdentity(
    identityWithMembership({ patronStatus: "former_patron" }),
    config(),
  );
  const declined = evaluatePatreonIdentity(
    identityWithMembership({ lastChargeStatus: "Declined" }),
    config(),
  );
  const free = evaluatePatreonIdentity(
    identityWithMembership({ amountCents: 0 }),
    config(),
  );

  assert.equal(inactive.reason, "inactive_membership");
  assert.equal(declined.reason, "payment_not_current");
  assert.equal(free.reason, "no_paid_entitlement");
});

test("enforces configured tier ids", () => {
  const denied = evaluatePatreonIdentity(
    identityWithMembership({ tierIds: ["tier-monthly"] }),
    config({ allowedTierIds: new Set(["tier-annual"]) }),
  );
  const allowed = evaluatePatreonIdentity(
    identityWithMembership({ tierIds: ["tier-annual"] }),
    config({ allowedTierIds: new Set(["tier-annual"]) }),
  );

  assert.equal(denied.reason, "tier_not_allowed");
  assert.equal(allowed.authorized, true);
});

test("encrypts OAuth tokens with authenticated encryption", () => {
  const encrypted = encryptToken("patreon-token", "test-encryption-secret");
  assert.notEqual(encrypted, "patreon-token");
  assert.equal(
    decryptToken(encrypted, "test-encryption-secret"),
    "patreon-token",
  );
  assert.throws(() => decryptToken(encrypted, "wrong-secret"));
});

test("serializes and parses secure OAuth cookies", () => {
  const serialized = serializeCookie("__session", "abc 123", {
    maxAge: 60,
    secure: true,
  });
  assert.match(serialized, /HttpOnly/);
  assert.match(serialized, /Secure/);
  assert.match(serialized, /SameSite=Lax/);
  assert.equal(parseCookies("__session=abc%20123").__session, "abc 123");
});

test("keeps OAuth state and authenticated sessions distinct", () => {
  const stateCookie = encodeSessionCookieValue("oauth-state", "state-value");
  const authCookie = encodeSessionCookieValue("auth-session", "session-id");

  assert.equal(
    decodeSessionCookieValue(stateCookie, "oauth-state"),
    "state-value",
  );
  assert.equal(decodeSessionCookieValue(stateCookie, "auth-session"), "");
  assert.equal(
    decodeSessionCookieValue(authCookie, "auth-session"),
    "session-id",
  );
});

test("marks Patreon configuration complete only when secrets are present", () => {
  const incomplete = getPatreonConfig({ PATREON_CLIENT_ID: "client" });
  const complete = getPatreonConfig({
    PATREON_CLIENT_ID: "client",
    PATREON_CLIENT_SECRET: "secret",
    PATREON_CAMPAIGN_ID: "campaign",
    PATREON_REDIRECT_URI: "https://example.com/api/patreon/callback",
    PATREON_TOKEN_ENCRYPTION_KEY: "encryption-secret",
  });

  assert.equal(incomplete.configured, false);
  assert.equal(complete.configured, true);
  assert.equal(complete.cookieSecure, true);
});
