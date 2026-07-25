import test from "node:test";
import assert from "node:assert/strict";

import {
  readAccountScopedJson,
  removeAccountScopedValue,
  shouldUseFixedFirstQuest,
  writeAccountScopedJson,
} from "./dailyQuestState.js";

function installLocalStorage() {
  const values = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    },
  };
}

test("daily quest browser state is isolated by account", () => {
  installLocalStorage();
  try {
    writeAccountScopedJson("dailyQuestPlate", "account-a", {
      langKey: "es",
      dayKey: "2026-07-24",
      kinds: ["review", "conversation", "phonics"],
    });
    assert.deepEqual(
      readAccountScopedJson("dailyQuestPlate", "account-a")?.kinds,
      ["review", "conversation", "phonics"],
    );
    assert.equal(
      readAccountScopedJson("dailyQuestPlate", "account-b"),
      null,
    );

    writeAccountScopedJson("dailyPlateSession", "account-a", {
      langKey: "es",
      dayKey: "2026-07-24",
    });
    assert.equal(
      readAccountScopedJson("dailyPlateSession", "account-b"),
      null,
    );
    assert.equal(
      readAccountScopedJson("dailyPlateSession", "account-a")?.langKey,
      "es",
    );
    removeAccountScopedValue("dailyPlateSession", "account-a");
    assert.equal(
      readAccountScopedJson("dailyPlateSession", "account-a"),
      null,
    );
  } finally {
    delete globalThis.window;
  }
});

test("the fixed introductory quest remains authoritative for its first day", () => {
  assert.equal(
    shouldUseFixedFirstQuest({ progress: {} }, "2026-07-24"),
    true,
  );
  assert.equal(
    shouldUseFixedFirstQuest(
      {
        progress: {
          dailyQuestFirstSeen: true,
          dailyQuestFirstDayKey: "2026-07-24",
        },
      },
      "2026-07-24",
    ),
    true,
  );
  assert.equal(
    shouldUseFixedFirstQuest(
      {
        progress: {
          dailyQuestFirstSeen: true,
          dailyQuestFirstDayKey: "2026-07-24",
        },
      },
      "2026-07-25",
    ),
    false,
  );
});

test("an unused account with the old flag-only cache bug is repaired as a first quest", () => {
  assert.equal(
    shouldUseFixedFirstQuest(
      { progress: { dailyQuestFirstSeen: true } },
      "2026-07-24",
    ),
    true,
  );
  assert.equal(
    shouldUseFixedFirstQuest(
      {
        xp: 20,
        progress: { dailyQuestFirstSeen: true },
      },
      "2026-07-24",
    ),
    false,
  );
});
