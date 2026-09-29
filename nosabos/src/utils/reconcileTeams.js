import { TEAM_RELAYS } from "./learningTeams.js";

export const reconcileUserTeams = ({
  createdTeams = [],
  memberTeams = [],
  nostrTeams = null,
  userNpub,
  onPruneInvite = () => {},
}) => {
  const nostrTeamsLoaded = Array.isArray(nostrTeams);
  const activeNostrTeamMap = new Map((nostrTeams || []).map((t) => [t.id, t]));

  const fromNostr = (nostrTeams || []).map((team) => ({
    id: team.id,
    teamName: team.name,
    createdBy: team.createdBy,
    isCreator: team.createdBy === userNpub,
    members: team.members
      .filter((npub) => npub !== team.createdBy)
      .map((npub) => ({ npub, status: "accepted" })),
    nostr: { id: team.id, identifier: team.identifier, relays: TEAM_RELAYS },
    nostrCreatedAt: team.createdAt,
  }));

  // 1. Reconcile Firestore memberTeams against Nostr
  const validMemberTeams = memberTeams.filter(Boolean).filter((team) => {
    const isNostrTeam = Boolean(team.nostr);
    if (!isNostrTeam) return true;
    if (!nostrTeamsLoaded) return true; // Keep local cache if relay query errored
    const onNostr = activeNostrTeamMap.has(team.id);
    if (!onNostr) {
      // User left on Nostr or team was deleted; prune stale invite in Firestore
      onPruneInvite(team.id);
      return false;
    }
    return true;
  });

  // 2. Reconcile Firestore createdTeams
  // Keep created teams from Firestore even if Nostr relay propagation is still pending,
  // ensuring newly created teams remain visible immediately.
  const validCreatedTeams = createdTeams.filter(Boolean);

  // 3. Merge teams with fromNostr first so Nostr roster takes precedence
  const allTeams = [...fromNostr, ...validCreatedTeams, ...validMemberTeams];
  const deduped = [];
  for (const team of allTeams) {
    if (!team) continue;
    const existing = deduped.find((entry) => entry.id === team.id && entry.createdBy === team.createdBy);
    if (!existing) {
      deduped.push({ ...team });
      continue;
    }
    if (team.creatorName && !existing.creatorName) existing.creatorName = team.creatorName;
    if (team.isCreator) existing.isCreator = true;
    if (team.nostr && !existing.nostr) existing.nostr = team.nostr;
  }
  return deduped;
};
