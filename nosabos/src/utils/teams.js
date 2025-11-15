import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";

export const getUserData = async (npub) => {
  if (!npub) return null;
  const ref = doc(database, "users", npub);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const createTeam = async (creatorNpub, teamName, creatorName = "") => {
  if (!creatorNpub || !teamName) {
    throw new Error("Creator npub and team name are required");
  }

  const teamId = `team_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const teamRef = doc(database, "users", creatorNpub, "teams", teamId);

  const teamData = {
    teamName,
    creatorName,
    createdBy: creatorNpub,
    createdAt: new Date().toISOString(),
    members: [],
  };

  await setDoc(teamRef, teamData);
  return teamId;
};

export const inviteUserToTeam = async (
  creatorNpub,
  teamId,
  teamName,
  inviteeNpub,
  creatorName
) => {
  if (!creatorNpub || !teamId || !inviteeNpub) {
    throw new Error("Creator npub, team ID, and invitee npub are required");
  }

  const teamRef = doc(database, "users", creatorNpub, "teams", teamId);
  const teamDoc = await getDoc(teamRef);

  if (!teamDoc.exists()) {
    throw new Error("Team does not exist");
  }

  const teamData = teamDoc.data();
  const alreadyMember = teamData.members?.find((m) => m.npub === inviteeNpub);
  if (alreadyMember) {
    throw new Error("User already invited");
  }

  await updateDoc(teamRef, {
    members: [
      ...(teamData.members || []),
      {
        npub: inviteeNpub,
        status: "pending",
        addedAt: new Date().toISOString(),
        name: "",
      },
    ],
  });

  const inviteId = `invite_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const inviteRef = doc(database, "users", inviteeNpub, "teamInvites", inviteId);

  await setDoc(inviteRef, {
    teamId,
    teamName,
    creatorNpub,
    invitedBy: creatorNpub,
    invitedByName: creatorName,
    status: "pending",
    createdAt: new Date().toISOString(),
  });

  return inviteId;
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
  const teamSnap = await getDoc(teamRef);
  if (teamSnap.exists()) {
    const teamData = teamSnap.data();
    const members = (teamData.members || []).map((member) =>
      member.npub === userNpub ? { ...member, status: "accepted" } : member
    );
    await updateDoc(teamRef, { members });
  }

  await updateDoc(inviteRef, { status: "accepted" });
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

  const allTeams = [...createdTeams, ...memberTeams.filter(Boolean)];
  const deduped = [];
  for (const team of allTeams) {
    if (team && !deduped.find((t) => t.id === team.id && t.createdBy === team.createdBy)) {
      deduped.push(team);
    }
  }
  return deduped;
};

export const getUserTeamInvites = async (userNpub) => {
  if (!userNpub) throw new Error("User npub is required");
  const invitesRef = collection(database, "users", userNpub, "teamInvites");
  const snapshot = await getDocs(invitesRef);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
};

export const getTeamMemberProgress = async (creatorNpub, teamId) => {
  if (!creatorNpub || !teamId) {
    throw new Error("Creator npub and team ID are required");
  }
  const teamRef = doc(database, "users", creatorNpub, "teams", teamId);
  const teamSnap = await getDoc(teamRef);
  if (!teamSnap.exists()) {
    throw new Error("Team does not exist");
  }
  const teamData = teamSnap.data();
  const members = (teamData.members || []).filter(
    (member) => member.status === "accepted"
  );

  const entries = [
    { npub: creatorNpub, isCreator: true },
    ...members.map((member) => ({
      npub: member.npub,
      name: member.name,
      isCreator: false,
    })),
  ];

      const progress = await Promise.all(
        entries.map(async (entry) => {
          const userData = await getUserData(entry.npub);
          const progressInfo = userData?.progress || {};
          const stats = userData?.stats || {};
          const totalXp =
            Number(userData?.xp ?? progressInfo?.xp ?? stats?.xp ?? 0) || 0;
          const dailyGoalXp =
            Number(
              userData?.dailyGoalXp ??
                progressInfo?.dailyGoalXp ??
                stats?.dailyGoalXp ??
                0
            ) || 0;
          const dailyXp =
            Number(
              userData?.dailyXp ??
                progressInfo?.dailyXp ??
                stats?.dailyXp ??
                0
            ) || 0;
          const streak =
            Number(progressInfo?.streak ?? progressInfo?.dailyStreak ?? stats?.streak ?? 0) || 0;
          const answeredStepsCount =
            Number(stats?.answeredStepsCount ?? progressInfo?.answeredStepsCount ?? 0) || 0;
          const dailyProgress =
            Number(progressInfo?.dailyProgress ?? stats?.dailyProgress ?? 0) || 0;
          const dailyGoalPercentFromGoal =
            dailyGoalXp > 0
              ? Math.min(100, Math.round((dailyXp / dailyGoalXp) * 100))
              : null;
          const percentSource =
            dailyGoalPercentFromGoal ??
            progressInfo?.dailyGoalPercent ??
            progressInfo?.dailyGoalPercentage ??
            progressInfo?.dailyGoalProgress ??
            dailyProgress;
          const progressPercent = Math.max(
            0,
            Math.min(100, Number(percentSource) || 0)
          );
          return {
            npub: entry.npub,
            name:
              userData?.profile?.displayName ||
              userData?.name ||
              entry.name ||
              "Learner",
            level: progressInfo?.level || userData?.progress?.level || "—",
            streak,
            answeredStepsCount,
            dailyProgress,
            progressPercent,
            totalXp,
            dailyGoalXp,
            dailyXp,
            isCreator: entry.isCreator,
          };
        })
      );

  return progress;
};

export const deleteTeam = async (creatorNpub, teamId) => {
  if (!creatorNpub || !teamId) {
    throw new Error("Creator npub and team ID are required");
  }
  const teamRef = doc(database, "users", creatorNpub, "teams", teamId);
  const teamSnap = await getDoc(teamRef);
  if (!teamSnap.exists()) {
    throw new Error("Team does not exist");
  }
  const teamData = teamSnap.data();
  const memberPromises = (teamData.members || []).map(async (member) => {
    const invitesRef = collection(database, "users", member.npub, "teamInvites");
    const q = query(invitesRef, where("teamId", "==", teamId));
    const snapshot = await getDocs(q);
    await Promise.all(snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));
  });
  await Promise.all(memberPromises);
  await deleteDoc(teamRef);
};

export const leaveTeam = async (userNpub, creatorNpub, teamId) => {
  if (!userNpub || !creatorNpub || !teamId) {
    throw new Error("User npub, creator npub, and team ID are required");
  }
  const teamRef = doc(database, "users", creatorNpub, "teams", teamId);
  const teamSnap = await getDoc(teamRef);
  if (teamSnap.exists()) {
    const teamData = teamSnap.data();
    const members = (teamData.members || []).filter(
      (member) => member.npub !== userNpub
    );
    await updateDoc(teamRef, { members });
  }
  const invitesRef = collection(database, "users", userNpub, "teamInvites");
  const q = query(invitesRef, where("teamId", "==", teamId));
  const snapshot = await getDocs(q);
  await Promise.all(snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));
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
