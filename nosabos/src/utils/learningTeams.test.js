import test from "node:test";
import assert from "node:assert/strict";
import { generateSecretKey, getPublicKey, nip19 } from "nostr-tools";
import {
  buildTeamEvent,
  learningTeamAddress,
  memberLeft,
  parseTeamEvent,
  progressSnapshot,
  teamProgressRow,
  pubkeyFromNpub,
  TEAM_KIND,
  TEAM_RELAYS,
} from "./learningTeams.js";
import { scoreToElo } from "./performanceEloModel.js";

test("a team event is a public roster both apps can query", () => {
  const creator = getPublicKey(generateSecretKey());
  const member = getPublicKey(generateSecretKey());
  const event = buildTeamEvent({
    id: "classroom",
    name: "Weekend Study",
    memberHexes: [creator, member],
    createdAt: 100,
  });
  event.pubkey = creator;
  const team = parseTeamEvent(event);

  assert.equal(event.kind, TEAM_KIND);
  assert.deepEqual(event.tags.find((tag) => tag[0] === "d"), ["d", "learning-team:classroom"]);
  assert.equal(team.name, "Weekend Study");
  assert.deepEqual(team.members, [creator, member].map((hex) => nip19.npubEncode(hex)));
  assert.equal(team.deleted, false);
  assert.deepEqual(TEAM_RELAYS, ["wss://relay.primal.net", "wss://relay.ditto.pub"]);
});

test("progress snapshot shares the displayed score, level, and companion separately from XP", () => {
  const snapshot = progressSnapshot({
    xp: 40,
    dailyGoalXp: 20,
    dailyXp: 10,
    proficiencyPlacement: "A2",
    proficiencyPlacements: { es: "A2" },
    learningIntelligence: { es: { elo: { rating: scoreToElo(32), scaleVersion: 4 } } },
    dailyGoalPetName: "Nova",
    dailyGoalPetType: "alien",
    dailyGoalPetHealth: 73,
    profile: { displayName: "Ada" },
    progress: { targetLang: "es", languageXp: { es: 250 }, streak: 3 },
  });
  assert.equal(snapshot.xp, 40);
  assert.equal(snapshot.score, 32);
  assert.equal(snapshot.scoreLevel, "A2");
  assert.equal(snapshot.level, "A2");
  assert.equal(snapshot.proficiency.es, "A2");
  assert.equal(snapshot.goal, 20);
  assert.equal(snapshot.progressPercent, 50);
  assert.equal(snapshot.name, "Ada");
  assert.deepEqual(snapshot.companion, { name: "Nova", type: "alien", level: 3, health: 73 });
  assert.equal(teamProgressRow("npub1example", snapshot).score, 32);
  assert.equal(teamProgressRow("npub1example", { xp: 40, score: 40 }).score, null);
  assert.equal(teamProgressRow("npub1example", { schemaVersion: 2, scoreScale: "0-100", score: null }).score, null);
});

test("team progress uses the account display name and leaves unnamed members for UI localization", () => {
  const named = progressSnapshot({ displayName: "  Ada  ", name: "Old name" });
  assert.equal(named.name, "Ada");
  assert.equal(teamProgressRow("npub1example", named).name, "Ada");

  const unnamed = progressSnapshot({});
  assert.equal(unnamed.name, "");
  assert.equal(teamProgressRow("npub1example", unnamed).name, "");
});

test("a newer leave hides a member and a deleted team is ignored", () => {
  assert.equal(memberLeft(10, 10), true);
  assert.equal(memberLeft(11, 10), false);
  const creator = getPublicKey(generateSecretKey());
  const event = buildTeamEvent({
    id: "classroom",
    name: "Weekend Study",
    memberHexes: [creator],
    deleted: true,
  });
  event.pubkey = creator;
  assert.equal(parseTeamEvent(event).deleted, true);
});

test("team address points at the shared relays", () => {
  const secret = generateSecretKey();
  const createdBy = nip19.npubEncode(getPublicKey(secret));
  const address = learningTeamAddress({ id: "classroom", createdBy });
  const decoded = nip19.decode(address);
  assert.equal(decoded.type, "naddr");
  assert.equal(decoded.data.kind, TEAM_KIND);
  assert.equal(decoded.data.identifier, "learning-team:classroom");
  assert.equal(decoded.data.pubkey, pubkeyFromNpub(createdBy));
  assert.deepEqual(decoded.data.relays, TEAM_RELAYS);
});
