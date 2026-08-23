import test from "node:test";
import assert from "node:assert/strict";

import { isMasterUnlockNpub } from "./masterUnlock.js";

const MASTER_NPUB =
  "npub1anf7634v6rmwjzjnraf09kudr4nsmwy4ggre74sqgqaljd7c5susc8xpev";

test("master unlock follows the public account identity", () => {
  assert.equal(isMasterUnlockNpub(MASTER_NPUB), true);
  assert.equal(isMasterUnlockNpub(`  ${MASTER_NPUB}  `), true);
});

test("master unlock never accepts private-key-shaped values", () => {
  assert.equal(isMasterUnlockNpub("nsec1not-a-public-account"), false);
  assert.equal(isMasterUnlockNpub("nip07"), false);
  assert.equal(isMasterUnlockNpub(""), false);
});
