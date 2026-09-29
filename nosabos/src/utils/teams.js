import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";
import {
  TEAM_RELAYS,
  memberLeft,
  progressSnapshot,
  publishLearningProgress,
  publishLearningTeam,
  publishTeamLeave,
  pubkeyFromNpub,
  readLearningProgress,
  readLearningProfiles,
  readLearningTeams,
  readTeamLeaves,
  teamIdentifier,
  teamProgressRow,
  newTeamId,
} from "./learningTeams";
import { reconcileUserTeams } from "./reconcileTeams.js";

export const getUserData = async (npub) => {
  if (!npub) return null;
  const ref = doc(database, "users", npub);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const createTeam = async (creatorNpub, teamName, creatorName = "", memberNpubs = []) => {
  if (!creatorNpub || !teamName) {
    throw new Error("Creator npub and team name are required");
  }
  const members = [...new Set(memberNpubs.map((npub) => String(npub || "").trim()).filter(Boolean))];
  if (!members.length) throw new Error("Add at least one teammate before creating");
  members.forEach(pubkeyFromNpub);

  const teamId = newTeamId();
  const nostr = { id: teamId, identifier: teamIdentifier(teamId), relays: TEAM_RELAYS };
  await publishLearningTeam({ creatorNpub, id: teamId, name: teamName, memberNpubs: members });
  const teamRef = doc(database, "users", creatorNpub, "teams", teamId);
  const addedAt = new Date().toISOString();
  const teamData = {
    teamName,
    creatorName,
    createdBy: creatorNpub,
    createdAt: addedAt,
    members: members.map((npub) => ({ npub, status: "accepted", addedAt, name: "" })),
    nostr,
  };

  try {
    await setDoc(teamRef, teamData);
    await Promise.all(members.map((inviteeNpub) => setDoc(
      doc(database, "users", inviteeNpub, "teamInvites", `team_${teamId}`),
      {
        teamId,
        teamName,
        creatorNpub,
        invitedBy: creatorNpub,
        invitedByName: creatorName,
        nostr,
        status: "accepted",
        createdAt: addedAt,
      },
    )));
    // Team creation does not need to wait for a second profile read and relay
    // publish before the team can be shown. TeamView publishes progress after
    // the new team appears; keep this as a best-effort background sync.
    void getUserData(creatorNpub)
      .then((userData) => publishLearningProgress(creatorNpub, userData))
      .catch((error) => console.warn("Could not publish creator team progress", error));
  } catch (error) {
    await publishLearningTeam({
      creatorNpub,
      id: teamId,
      name: teamName,
      memberNpubs: members,
      deleted: true,
    }).catch(() => {});
    throw error;
  }
  return teamId;
};

export const addMembersToTeam = async (creatorNpub, team, memberNpubs, creatorName = "") => {
  if (!creatorNpub || !team?.id || team.createdBy !== creatorNpub) {
    throw new Error("Only the team creator can add members");
  }
  const invitees = [...new Set(memberNpubs.map((npub) => String(npub || "").trim()).filter(Boolean))];
  if (!invitees.length) throw new Error("Enter at least one teammate npub");
  invitees.forEach(pubkeyFromNpub);
  if (invitees.includes(creatorNpub)) throw new Error("You are already on this team");

  const teamRef = doc(database, "users", creatorNpub, "teams", team.id);
  const teamSnap = await getDoc(teamRef).catch((error) => {
    if (!team.nostr) throw error;
    return null;
  });
  const cachedTeam = teamSnap?.exists() ? teamSnap.data() : null;
  const isNostrTeam = Boolean(team.nostr || cachedTeam?.nostr);
  if (!cachedTeam && !isNostrTeam) throw new Error("Team does not exist");

  const nostrTeam = isNostrTeam
    ? (await readLearningTeams(creatorNpub)).find((entry) =>
      entry.id === team.id && entry.createdBy === creatorNpub)
    : null;
  if (isNostrTeam && !nostrTeam) throw new Error("Could not load the current Nostr team roster");
  const existing = new Set(isNostrTeam
    ? [creatorNpub, ...(nostrTeam?.members || [])]
    : [creatorNpub, ...(cachedTeam?.members || []).map((member) => member.npub)]);
  if (invitees.some((npub) => existing.has(npub))) {
    throw new Error("One or more teammates are already on this team");
  }

  if (isNostrTeam) {
    await publishLearningTeam({
      creatorNpub,
      id: team.id,
      name: nostrTeam.name || cachedTeam?.teamName || team.teamName,
      memberNpubs: [...existing, ...invitees],
      afterCreatedAt: nostrTeam.createdAt,
    });
  }

  if (!cachedTeam) return { groupListSynced: true, mirrorSynced: false };
  try {
    await runTransaction(database, async (transaction) => {
      const current = await transaction.get(teamRef);
      if (!current.exists()) throw new Error("Team does not exist");
      const members = current.data().members || [];
      if (invitees.some((npub) => members.some((member) => member.npub === npub))) {
        throw new Error("One or more teammates are already on this team");
      }
      const addedAt = new Date().toISOString();
      const status = isNostrTeam ? "accepted" : "pending";
      transaction.update(teamRef, {
        members: [...members, ...invitees.map((npub) => ({ npub, status, addedAt, name: "" }))],
      });
      invitees.forEach((npub) => transaction.set(
        doc(database, "users", npub, "teamInvites", `team_${team.id}`),
        {
          teamId: team.id,
          teamName: cachedTeam.teamName || team.teamName,
          creatorNpub,
          invitedBy: creatorNpub,
          invitedByName: creatorName,
          ...(isNostrTeam ? { nostr: cachedTeam.nostr || team.nostr } : {}),
          status,
          createdAt: addedAt,
        },
      ));
    });
    return { groupListSynced: true, mirrorSynced: true };
  } catch (error) {
    if (!isNostrTeam) throw error;
    console.warn("Nostr team updated, but its Firestore cache could not sync", error);
    return { groupListSynced: true, mirrorSynced: false };
  }
};

export const inviteUserToTeam = (creatorNpub, teamId, teamName, inviteeNpub, creatorName) =>
  addMembersToTeam(creatorNpub, { id: teamId, teamName, createdBy: creatorNpub }, [inviteeNpub], creatorName);

export const renameTeam = async (creatorNpub, team, nextName) => {
  if (!creatorNpub || !team?.id || team.createdBy !== creatorNpub) {
    throw new Error("Only the team creator can edit its name");
  }
  const name = String(nextName || "").trim();
  if (!name) throw new Error("Enter a team name");
  if (name.length > 80) throw new Error("Team names must be 80 characters or fewer");

  const teamRef = doc(database, "users", creatorNpub, "teams", team.id);
  const teamSnap = await getDoc(teamRef).catch((error) => {
    if (!team.nostr) throw error;
    return null;
  });
  const cachedTeam = teamSnap?.exists() ? teamSnap.data() : null;
  const isNostrTeam = Boolean(team.nostr || cachedTeam?.nostr);
  if (!cachedTeam && !isNostrTeam) throw new Error("Team does not exist");

  const nostrTeam = isNostrTeam
    ? (await readLearningTeams(creatorNpub)).find((entry) =>
      entry.id === team.id && entry.createdBy === creatorNpub)
    : null;
  if (isNostrTeam && !nostrTeam) throw new Error("Could not load the current Nostr team roster");
  if (name === (nostrTeam?.name || cachedTeam?.teamName || team.teamName)) {
    return { name, mirrorSynced: true };
  }

  if (isNostrTeam) {
    await publishLearningTeam({
      creatorNpub,
      id: team.id,
      name,
      memberNpubs: nostrTeam.members,
      afterCreatedAt: nostrTeam.createdAt,
    });
  }

  if (!cachedTeam) return { name, mirrorSynced: true };
  let mirrorSynced = true;
  try {
    await updateDoc(teamRef, { teamName: name });
  } catch (error) {
    if (!isNostrTeam) throw error;
    console.warn("Nostr team renamed, but its Firestore cache could not sync", error);
    mirrorSynced = false;
  }

  const invitees = [...new Set((cachedTeam.members || []).map((member) => member.npub))];
  const inviteResults = await Promise.allSettled(invitees.map(async (npub) => {
    const invitesRef = collection(database, "users", npub, "teamInvites");
    const invites = await getDocs(query(invitesRef, where("teamId", "==", team.id)));
    await Promise.all(invites.docs.map((invite) => updateDoc(invite.ref, { teamName: name })));
  }));
  if (inviteResults.some((result) => result.status === "rejected")) {
    mirrorSynced = false;
    console.warn("Some team invitations still have the previous name");
  }
  return { name, mirrorSynced };
};

export const acceptTeamInvite = async (userNpub, inviteId) => {
  if (!userNpub || !inviteId) {
    throw new Error("User npub and invite ID are required");
  }

  const inviteRef = doc(database, "users", userNpub, "teamInvites", inviteId);
  const inviteDoc = await getDoc(inviteRef);
  if (!inviteDoc.exists()) {
    throw new Error("Invite does not exist");
  }

  const inviteData = inviteDoc.data();
  const teamRef = doc(database, "users", inviteData.creatorNpub, "teams", inviteData.teamId);
  await runTransaction(database, async (transaction) => {
    const teamSnap = await transaction.get(teamRef);
    if (teamSnap.exists()) {
      const members = (teamSnap.data().members || []).map((member) =>
        member.npub === userNpub ? { ...member, status: "accepted" } : member
      );
      transaction.update(teamRef, { members });
    }
    transaction.update(inviteRef, { status: "accepted" });
  });
  return { groupListSynced: true };
};

export const rejectTeamInvite = async (userNpub, inviteId) => {
  if (!userNpub || !inviteId) {
    throw new Error("User npub and invite ID are required");
  }

  const inviteRef = doc(database, "users", userNpub, "teamInvites", inviteId);
  const inviteDoc = await getDoc(inviteRef);
  if (!inviteDoc.exists()) {
    throw new Error("Invite does not exist");
  }

  const inviteData = inviteDoc.data();
  const teamRef = doc(database, "users", inviteData.creatorNpub, "teams", inviteData.teamId);
  const teamSnap = await getDoc(teamRef);
  if (teamSnap.exists()) {
    const teamData = teamSnap.data();
    const members = (teamData.members || []).filter(
      (member) => member.npub !== userNpub
    );
    await updateDoc(teamRef, { members });
  }

  await updateDoc(inviteRef, { status: "rejected" });
};

export const getUserTeams = async (userNpub) => {
  if (!userNpub) throw new Error("User npub is required");

  const createdTeamsRef = collection(database, "users", userNpub, "teams");
  const createdSnapshot = await getDocs(createdTeamsRef);
  const createdTeams = createdSnapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
    isCreator: true,
    createdBy: userNpub,
  }));

  const invitesRef = collection(database, "users", userNpub, "teamInvites");
  const invitesSnapshot = await getDocs(invitesRef);
  const memberTeams = await Promise.all(
    invitesSnapshot.docs.map(async (inviteDoc) => {
      const invite = inviteDoc.data();
      if (invite.status !== "accepted" || !invite.creatorNpub) return null;
      const ref = doc(
        database,
        "users",
        invite.creatorNpub,
        "teams",
        invite.teamId
      );
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      return {
        id: snap.id,
        ...snap.data(),
        isCreator: false,
        createdBy: invite.creatorNpub,
      };
    })
  );

  let nostrTeams = null;
  try {
    nostrTeams = await readLearningTeams(userNpub);
  } catch (error) {
    console.warn("Could not query Nostr teams from relays", error);
    nostrTeams = null;
  }

  return reconcileUserTeams({
    createdTeams,
    memberTeams,
    nostrTeams,
    userNpub,
    onPruneInvite: (teamId) => {
      deleteDoc(doc(database, "users", userNpub, "teamInvites", `team_${teamId}`)).catch(() => {});
    },
  });
};

export const getUserTeamInvites = async (userNpub) => {
  if (!userNpub) throw new Error("User npub is required");
  const invitesRef = collection(database, "users", userNpub, "teamInvites");
  const snapshot = await getDocs(invitesRef);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
};

export const getTeamMemberProgress = async (creatorNpub, teamId, viewerNpub = creatorNpub, viewerData = null, targetLang) => {
  if (!creatorNpub || !teamId) {
    throw new Error("Creator npub and team ID are required");
  }
  const teamRef = doc(database, "users", creatorNpub, "teams", teamId);
  const teamSnap = await getDoc(teamRef).catch(() => null);
  const teamData = teamSnap?.exists() ? teamSnap.data() : null;
  const isNostrTeam = Boolean(teamData?.nostr);
  const nostrTeams = await readLearningTeams(viewerNpub).catch(() => []);
  const nostrTeam = nostrTeams.find((team) => team.id === teamId && team.createdBy === creatorNpub) || null;
  if (!teamData && !nostrTeam) throw new Error("Team does not exist");

  let entries;
  if (nostrTeam) {
    const leaves = await readTeamLeaves(nostrTeam).catch(() => new Map());
    const active = nostrTeam.members.filter((npub) => !memberLeft(nostrTeam.createdAt, leaves.get(npub)));
    if (!active.includes(viewerNpub)) throw new Error("You are not a team member");
    entries = active.map((npub) => ({ npub, isCreator: npub === creatorNpub }));
    if (viewerNpub === creatorNpub && teamData?.members?.length) {
      const activeSet = new Set(active);
      const reconciled = teamData.members.filter((m) => activeSet.has(m.npub));
      if (reconciled.length !== teamData.members.length) {
        updateDoc(teamRef, { members: reconciled }).catch(() => {});
      }
    }
  } else if (isNostrTeam) {
    throw new Error("You are not a team member");
  } else {
    const members = (teamData.members || []).filter((member) => member.status === "accepted");
    entries = [
      { npub: creatorNpub, isCreator: true },
      ...members.map((member) => ({
        npub: member.npub,
        name: member.name,
        isCreator: false,
      })),
    ];
  }

  const [shared, userDocs, profiles] = await Promise.all([
    readLearningProgress(entries.map((entry) => entry.npub)).catch(() => new Map()),
    Promise.all(entries.map((entry) => getUserData(entry.npub).catch(() => null))),
    readLearningProfiles(entries.map((entry) => entry.npub)).catch(() => new Map()),
  ]);
  return entries.map((entry, index) => {
    const userData = userDocs[index];
    const accountName = [userData?.displayName, userData?.profile?.displayName, userData?.name]
      .find((value) => typeof value === "string" && value.trim())?.trim() || "";
    const profileName = profiles.get(entry.npub)?.name || "";
    if (entry.npub === viewerNpub && viewerData) {
      const snapshot = progressSnapshot(viewerData, targetLang);
      return teamProgressRow(entry.npub, { ...snapshot, name: accountName || profileName || snapshot.name }, entry.isCreator);
    }
    const published = shared.get(entry.npub);
    const publishedName = published?.name === "Learner" ? "" : published?.name;
    if (published?.schemaVersion >= 2) {
      return teamProgressRow(entry.npub, {
        ...published,
        name: accountName || profileName || publishedName || entry.name || "",
      }, entry.isCreator);
    }
    const snapshot = userData ? progressSnapshot(userData) : published || {};
    return teamProgressRow(entry.npub, {
      ...snapshot,
      name: accountName || profileName || publishedName || entry.name || "",
    }, entry.isCreator);
  });
};

export const deleteTeam = async (creatorNpub, teamId) => {
  if (!creatorNpub || !teamId) {
    throw new Error("Creator npub and team ID are required");
  }
  const teamRef = doc(database, "users", creatorNpub, "teams", teamId);
  const teamSnap = await getDoc(teamRef);
  if (!teamSnap.exists()) {
    await publishLearningTeam({
      creatorNpub,
      id: teamId,
      name: "Team",
      memberNpubs: [],
      deleted: true,
    });
    return { groupListSynced: true };
  }
  const teamData = teamSnap.data();
  if (teamData.nostr) {
    await publishLearningTeam({
      creatorNpub,
      id: teamData.nostr.id,
      name: teamData.teamName,
      memberNpubs: (teamData.members || []).map((member) => member.npub),
      deleted: true,
    });
  }
  const memberPromises = (teamData.members || []).map(async (member) => {
    const invitesRef = collection(database, "users", member.npub, "teamInvites");
    const q = query(invitesRef, where("teamId", "==", teamId));
    const snapshot = await getDocs(q);
    await Promise.all(snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));
  });
  await Promise.all(memberPromises);
  await deleteDoc(teamRef);
  return { groupListSynced: true };
};

export const leaveTeam = async (userNpub, creatorNpub, teamId) => {
  if (!userNpub || !creatorNpub || !teamId) {
    throw new Error("User npub, creator npub, and team ID are required");
  }
  const teamRef = doc(database, "users", creatorNpub, "teams", teamId);
  const teamSnap = await getDoc(teamRef);
  if (teamSnap.exists()) {
    const teamData = teamSnap.data();
    if (teamData.nostr) {
      await publishTeamLeave({ userNpub, creatorNpub, teamId: teamData.nostr.id });
    }
    const members = (teamData.members || []).filter(
      (member) => member.npub !== userNpub
    );
    await updateDoc(teamRef, { members });
  } else {
    await publishTeamLeave({ userNpub, creatorNpub, teamId });
  }
  const invitesRef = collection(database, "users", userNpub, "teamInvites");
  const q = query(invitesRef, where("teamId", "==", teamId));
  const snapshot = await getDocs(q);
  await Promise.all(snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));
  return { groupListSynced: true };
};

export const subscribeToTeamUpdates = (
  creatorNpub,
  teamId,
  callback
) => {
  if (!creatorNpub || !teamId) return () => {};
  const teamRef = doc(database, "users", creatorNpub, "teams", teamId);
  return onSnapshot(teamRef, (snap) => {
    if (!snap.exists()) {
      callback(null);
    } else {
      callback({ id: snap.id, ...snap.data() });
    }
  });
};

export const subscribeToTeamInvites = (userNpub, callback) => {
  if (!userNpub) return () => {};
  const invitesRef = collection(database, "users", userNpub, "teamInvites");
  return onSnapshot(invitesRef, (snapshot) => {
    const invites = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    callback(invites);
  });
};

export const checkUserExists = async (npub) => {
  if (!npub) return false;
  const ref = doc(database, "users", npub);
  const snap = await getDoc(ref);
  return snap.exists();
};
