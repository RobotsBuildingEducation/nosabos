import test from "node:test";
import assert from "node:assert/strict";
import {
  formatUsdEntitlement,
  getSubscriptionSettingsState,
  PATREON_MEMBERSHIP_URL,
  PATREON_PAYMENT_URL,
} from "./subscriptionSettingsModel.js";

test("subscription settings expose only connection actions before linking", () => {
  const state = getSubscriptionSettingsState({ linked: false });
  assert.equal(state.showConnect, true);
  assert.equal(state.showRefresh, false);
  assert.equal(state.showManage, false);
  assert.equal(state.showDisconnect, false);
});

test("active linked subscriptions expose refresh, management, and entitlement", () => {
  const state = getSubscriptionSettingsState({
    linked: true,
    subscription: { status: "active", entitledAmountCents: 500 },
  });
  assert.equal(state.showConnect, false);
  assert.equal(state.showRefresh, true);
  assert.equal(state.showReconnect, false);
  assert.equal(state.showManage, true);
  assert.equal(state.showPayment, false);
  assert.equal(state.entitledAmountCents, 500);
  assert.match(formatUsdEntitlement(500, "en"), /USD/);
});

test("payment problems expose reconnect and Patreon payment management", () => {
  const state = getSubscriptionSettingsState({
    linked: true,
    subscription: { status: "payment_issue" },
  });
  assert.equal(state.showReconnect, true);
  assert.equal(state.showPayment, true);
  assert.equal(PATREON_MEMBERSHIP_URL.startsWith("https://"), true);
  assert.equal(PATREON_PAYMENT_URL.startsWith("https://"), true);
});
