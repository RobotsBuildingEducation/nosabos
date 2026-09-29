import test from "node:test";
import assert from "node:assert/strict";
import { reconcileUserTeams } from "./reconcileTeams.js";

test("reconcileUserTeams drops Nostr member team if user has left on Nostr", () => {
  const userNpub = "npub1member";
  const creatorNpub = "npub1creator";
  const pruned = [];

  const memberTeams = [
    {
      id: "team123",
      teamName: "dog gang 1",
      createdBy: creatorNpub,
      isCreator: false,
      nostr: { id: "team123", relays: [] },
      members: [{ npub: userNpub, status: "accepted" }],
    },
  ];

  // Nostr reports [] because the user left on another app
  const nostrTeams = [];

  const result = reconcileUserTeams({
    createdTeams: [],
    memberTeams,
    nostrTeams,
    userNpub,
    onPruneInvite: (id) => pruned.push(id),
  });

  assert.equal(result.length, 0);
  assert.deepEqual(pruned, ["team123"]);
});

test("reconcileUserTeams keeps active Nostr team with Nostr roster", () => {
  const userNpub = "npub1member";
  const creatorNpub = "npub1creator";
  const pruned = [];

  const memberTeams = [
    {
      id: "team123",
      teamName: "dog gang 1",
      createdBy: creatorNpub,
      isCreator: false,
      nostr: { id: "team123", relays: [] },
      members: [{ npub: userNpub, status: "accepted" }],
    },
  ];

  const nostrTeams = [
    {
      id: "team123",
      name: "dog gang 1",
      createdBy: creatorNpub,
      createdAt: 100,
      members: [creatorNpub, userNpub],
      deleted: false,
      relays: [],
    },
  ];

  const result = reconcileUserTeams({
    createdTeams: [],
    memberTeams,
    nostrTeams,
    userNpub,
    onPruneInvite: (id) => pruned.push(id),
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].id, "team123");
  assert.equal(pruned.length, 0);
});

test("reconcileUserTeams preserves cached teams when Nostr relay query errored (offline)", () => {
  const userNpub = "npub1member";
  const creatorNpub = "npub1creator";
  const pruned = [];

  const memberTeams = [
    {
      id: "team123",
      teamName: "dog gang 1",
      createdBy: creatorNpub,
      isCreator: false,
      nostr: { id: "team123", relays: [] },
      members: [{ npub: userNpub, status: "accepted" }],
    },
  ];

  const result = reconcileUserTeams({
    createdTeams: [],
    memberTeams,
    nostrTeams: null, // query error
    userNpub,
    onPruneInvite: (id) => pruned.push(id),
  });

  assert.equal(result.length, 1);
  assert.equal(pruned.length, 0);
});

test("reconcileUserTeams preserves legacy Firestore-only teams", () => {
  const userNpub = "npub1member";
  const creatorNpub = "npub1creator";

  const memberTeams = [
    {
      id: "legacy_team",
      teamName: "Old Team",
      createdBy: creatorNpub,
      isCreator: false,
      members: [{ npub: userNpub, status: "accepted" }],
    },
  ];

  const result = reconcileUserTeams({
    createdTeams: [],
    memberTeams,
    nostrTeams: [],
    userNpub,
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].id, "legacy_team");
});

test("reconcileUserTeams preserves newly created Firestore teams when Nostr relays have not indexed them yet", () => {
  const userNpub = "npub1creator";

  const createdTeams = [
    {
      id: "team_just_created",
      teamName: "Super Learners",
      createdBy: userNpub,
      isCreator: true,
      nostr: { id: "team_just_created", relays: [] },
      members: [{ npub: "npub1invitee", status: "accepted" }],
    },
  ];

  // Nostr query succeeded but relay indexing has not caught up yet
  const nostrTeams = [];

  const result = reconcileUserTeams({
    createdTeams,
    memberTeams: [],
    nostrTeams,
    userNpub,
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].id, "team_just_created");
  assert.equal(result[0].teamName, "Super Learners");
  assert.equal(result[0].isCreator, true);
});

