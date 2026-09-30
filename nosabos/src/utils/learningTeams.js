import { finalizeEvent, generateSecretKey, getPublicKey, nip19, SimplePool, verifyEvent } from "nostr-tools";
import { scoreForUser, practiceLevelForScore, curriculumLevelsForUser } from "./performanceEloModel.js";
import { getDailyGoalPetHealth } from "./dailyGoalPet.js";
import { getCompanionLevelFromXp, getEffectivePetType } from "./petTypes.js";

export const TEAM_KIND = 30078;
export const TEAM_RELAYS = [
  "wss://relay.primal.net",
  "wss://relay.ditto.pub",
  "wss://nos.lol",
];
export const TEAM_TAG = "learning-team";
export const PROGRESS_D = "learning-progress";
const QUERY_TIMEOUT_MS = 7000;

export const teamIdentifier = (id) => `learning-team:${id}`;
export const leaveIdentifier = (creatorHex, teamId) => `learning-team-left:${creatorHex}:${teamId}`;

export const pubkeyFromNpub = (npub) => {
  const decoded = nip19.decode(npub);
  if (decoded.type !== "npub") throw new Error("Invalid Nostr public key");
  return decoded.data;
};

export const newTeamId = () =>
  Array.from(generateSecretKey(), (byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 32);

const activeSigner = async (expectedNpub) => {
  const expected = pubkeyFromNpub(expectedNpub);
  if (localStorage.getItem("nip07_signer") === "true") {
    if (!window.nostr?.signEvent || !window.nostr?.getPublicKey) {
      throw new Error("Connect your Nostr signer to manage this team");
    }
    const actual = await window.nostr.getPublicKey();
    if (actual !== expected) throw new Error("The active Nostr signer does not match this account");
    return (template) => window.nostr.signEvent(template);
  }
  const nsec = localStorage.getItem("local_nsec");
  if (!nsec) throw new Error("Your Nostr key is unavailable");
  const decoded = nip19.decode(nsec);
  if (decoded.type !== "nsec" || getPublicKey(decoded.data) !== expected) {
    throw new Error("The stored Nostr key does not match this account");
  }
  return (template) => finalizeEvent(template, decoded.data);
};

const withPool = async (action) => {
  const pool = new SimplePool();
  try {
    return await action(pool);
  } finally {
    pool.destroy();
  }
};

const publish = async (pool, event, sign) => {
  const signed = await sign(event);
  if (!verifyEvent(signed)) throw new Error("Nostr signer returned an invalid event");
  const results = await Promise.allSettled(pool.publish(TEAM_RELAYS, signed));
  if (results.every((result) => result.status === "rejected")) {
    throw new Error("No Nostr relay accepted the team update");
  }
  return signed;
};

const query = (pool, filter, sign) => new Promise((resolve, reject) => {
  const events = [];
  let settled = false;
  const timer = setTimeout(() => finish(new Error("Nostr relay did not respond")), QUERY_TIMEOUT_MS);
  let subscription;
  const finish = (error) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    subscription?.close();
    if (error) reject(error);
    else resolve(events.filter(verifyEvent));
  };
  subscription = pool.subscribeEose(TEAM_RELAYS, filter, {
    maxWait: QUERY_TIMEOUT_MS,
    onevent: (event) => events.push(event),
    onclose: () => finish(),
    onauth: sign,
  });
});

const latestByAddress = (events) => {
  const byAddress = new Map();
  for (const event of events) {
    const key = `${event.kind}:${event.pubkey}:${event.tags.find((tag) => tag[0] === "d")?.[1] || ""}`;
    const current = byAddress.get(key);
    if (!current || event.created_at > current.created_at) byAddress.set(key, event);
  }
  return [...byAddress.values()];
};

const contentObject = (event) => {
  try {
    const parsed = JSON.parse(event.content || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const progressSnapshot = (userData = {}, targetLang = userData?.progress?.targetLang || "es") => {
  const lang = String(targetLang || "es").toLowerCase();
  const progressInfo = userData.progress || {};
  const stats = userData.stats || {};
  const xp = Number(userData.xp ?? progressInfo.xp ?? stats.xp ?? 0) || 0;
  const score = scoreForUser(userData, lang);
  const scoreLevel = practiceLevelForScore(score);
  const languageXp = progressInfo.languageXp && typeof progressInfo.languageXp === "object"
    ? (typeof progressInfo.languageXp[lang] === "number" ? progressInfo.languageXp[lang] : 0)
    : (typeof progressInfo.totalXp === "number" ? progressInfo.totalXp : 0);
  const companionLevel = getCompanionLevelFromXp(languageXp);
  const goal = Number(userData.dailyGoalXp ?? progressInfo.dailyGoalXp ?? stats.dailyGoalXp ?? 0) || 0;
  const dailyXp = Number(userData.dailyXp ?? progressInfo.dailyXp ?? stats.dailyXp ?? 0) || 0;
  const level = curriculumLevelsForUser(userData, lang).overall;
  const proficiency = userData.proficiencyPlacements && typeof userData.proficiencyPlacements === "object"
    ? userData.proficiencyPlacements
    : level;
  return {
    schemaVersion: 2,
    targetLang: lang,
    xp,
    score,
    scoreScale: "0-100",
    scoreLevel,
    level,
    proficiency,
    goal,
    dailyGoalXp: goal,
    dailyXp,
    streak: Number(progressInfo.streak ?? progressInfo.dailyStreak ?? stats.streak ?? 0) || 0,
    answeredStepsCount: Number(stats.answeredStepsCount ?? progressInfo.answeredStepsCount ?? 0) || 0,
    progressPercent: goal > 0 ? Math.min(100, Math.round((dailyXp / goal) * 100)) : 0,
    name: [userData.displayName, userData.profile?.displayName, userData.name]
      .find((value) => typeof value === "string" && value.trim())?.trim() || "",
    companion: {
      name: typeof userData.dailyGoalPetName === "string" ? userData.dailyGoalPetName.trim() : "",
      type: getEffectivePetType(userData.dailyGoalPetType, companionLevel),
      level: companionLevel,
      health: getDailyGoalPetHealth(userData),
    },
    updatedAt: Math.floor(Date.now() / 1000),
  };
};

export const teamProgressRow = (npub, data = {}, isCreator = false) => {
  const score = data.schemaVersion >= 2 && data.scoreScale === "0-100"
    && data.score !== null && data.score !== undefined && data.score !== ""
    && Number.isFinite(Number(data.score))
    ? Math.max(0, Math.min(100, Number(data.score)))
    : null;
  const companion = data.schemaVersion >= 2 && data.companion
    ? {
      name: typeof data.companion.name === "string" ? data.companion.name.slice(0, 80) : "",
      type: getEffectivePetType(data.companion.type, data.companion.level),
      level: Math.max(1, Math.floor(Number(data.companion.level) || 1)),
      health: Math.max(0, Math.min(100, Number(data.companion.health) || 0)),
    }
    : { name: "", type: "ghost", level: 1, health: 100 };
  return {
    npub,
    name: typeof data.name === "string" ? data.name.trim() : "",
    targetLang: data.targetLang || "",
    level: data.level || "—",
    score,
    scoreLevel: score !== null ? data.scoreLevel || practiceLevelForScore(score) : "",
    companion,
    streak: Number(data.streak) || 0,
    answeredStepsCount: Number(data.answeredStepsCount) || 0,
    dailyProgress: Number(data.progressPercent) || 0,
    progressPercent: Number(data.progressPercent) || 0,
    totalXp: Number(data.xp) || 0,
    dailyGoalXp: Number(data.goal ?? data.dailyGoalXp) || 0,
    dailyXp: Number(data.dailyXp) || 0,
    isCreator,
  };
};

export const buildTeamEvent = ({ id, name, memberHexes, createdAt = Math.floor(Date.now() / 1000), deleted = false }) => ({
  kind: TEAM_KIND,
  content: JSON.stringify({ name, createdAt }),
  created_at: createdAt,
  tags: [
    ["d", teamIdentifier(id)],
    ["t", TEAM_TAG],
    ["name", name],
    ...(deleted ? [["deleted"]] : []),
    ...[...new Set(memberHexes)].map((hex) => ["p", hex]),
  ],
});

export const parseTeamEvent = (event) => {
  const identifier = event.tags.find((tag) => tag[0] === "d")?.[1] || "";
  if (!identifier.startsWith("learning-team:") || identifier.startsWith("learning-team-left:")) return null;
  const content = contentObject(event);
  const members = event.tags
    .filter((tag) => tag[0] === "p" && /^[0-9a-f]{64}$/.test(tag[1] || ""))
    .map((tag) => nip19.npubEncode(tag[1]));
  return {
    id: identifier.slice("learning-team:".length),
    identifier,
    name: event.tags.find((tag) => tag[0] === "name")?.[1] || content.name || "Team",
    createdBy: nip19.npubEncode(event.pubkey),
    createdAt: event.created_at,
    members,
    deleted: event.tags.some((tag) => tag[0] === "deleted"),
    relays: TEAM_RELAYS,
  };
};

export const memberLeft = (teamCreatedAt, leaveCreatedAt) =>
  Number.isFinite(leaveCreatedAt) && leaveCreatedAt >= teamCreatedAt;

export const learningTeamAddress = (team) => {
  if (!team?.id || !team?.createdBy) return "";
  return nip19.naddrEncode({
    kind: TEAM_KIND,
    pubkey: pubkeyFromNpub(team.createdBy),
    identifier: team.identifier || teamIdentifier(team.id),
    relays: TEAM_RELAYS,
  });
};

export const publishLearningTeam = async ({ creatorNpub, id, name, memberNpubs, deleted = false, afterCreatedAt = 0 }) => {
  const sign = await activeSigner(creatorNpub);
  const memberHexes = [...new Set([creatorNpub, ...memberNpubs].map(pubkeyFromNpub))];
  return withPool((pool) => publish(pool, buildTeamEvent({
    id,
    name,
    memberHexes,
    createdAt: Math.max(Math.floor(Date.now() / 1000), Number(afterCreatedAt) + 1),
    deleted,
  }), sign));
};

export const publishLearningProgress = async (userNpub, userData, targetLang) => {
  const sign = await activeSigner(userNpub);
  const snapshot = progressSnapshot(userData, targetLang);
  return withPool((pool) => publish(pool, {
    kind: TEAM_KIND,
    content: JSON.stringify(snapshot),
    created_at: snapshot.updatedAt,
    tags: [["d", PROGRESS_D], ["t", "learning-progress"]],
  }, sign));
};

export const publishTeamLeave = async ({ userNpub, creatorNpub, teamId }) => {
  const sign = await activeSigner(userNpub);
  const creatorHex = pubkeyFromNpub(creatorNpub);
  return withPool((pool) => publish(pool, {
    kind: TEAM_KIND,
    content: "",
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ["d", leaveIdentifier(creatorHex, teamId)],
      ["t", "learning-team-left"],
      ["a", `${TEAM_KIND}:${creatorHex}:${teamIdentifier(teamId)}`],
    ],
  }, sign));
};

export const readLearningTeams = async (userNpub) => {
  const sign = await activeSigner(userNpub).catch(() => undefined);
  const pubkey = pubkeyFromNpub(userNpub);
  return withPool(async (pool) => {
    const events = latestByAddress(await query(pool, {
      kinds: [TEAM_KIND],
      "#t": [TEAM_TAG],
      "#p": [pubkey],
      limit: 100,
    }, sign));
    const teams = events.map(parseTeamEvent).filter((team) => team && !team.deleted);
    if (!teams.length) return [];
    const leaves = latestByAddress(await query(pool, {
      kinds: [TEAM_KIND],
      "#d": teams.map((team) => leaveIdentifier(pubkeyFromNpub(team.createdBy), team.id)),
      limit: 200,
    }, sign));
    return teams.flatMap((team) => {
      const leaveId = leaveIdentifier(pubkeyFromNpub(team.createdBy), team.id);
      const teamLeaves = leaves.filter((event) => event.tags.find((tag) => tag[0] === "d")?.[1] === leaveId);
      const viewerLeave = teamLeaves.find((event) => event.pubkey === pubkey);
      if (memberLeft(team.createdAt, viewerLeave?.created_at)) return [];
      const left = new Set(teamLeaves
        .filter((event) => memberLeft(team.createdAt, event.created_at))
        .map((event) => nip19.npubEncode(event.pubkey)));
      return [{ ...team, members: team.members.filter((npub) => !left.has(npub)) }];
    });
  });
};

export const readTeamLeaves = async (team, sign) => withPool(async (pool) => {
  const events = latestByAddress(await query(pool, {
    kinds: [TEAM_KIND],
    "#d": [leaveIdentifier(pubkeyFromNpub(team.createdBy), team.id)],
    limit: 100,
  }, sign));
  return new Map(events.map((event) => [nip19.npubEncode(event.pubkey), event.created_at]));
});

export const readLearningProgress = async (npubs, sign) => {
  const hexes = npubs.map(pubkeyFromNpub);
  if (!hexes.length) return new Map();
  return withPool(async (pool) => {
    const events = latestByAddress(await query(pool, {
      kinds: [TEAM_KIND],
      "#d": [PROGRESS_D],
      authors: hexes,
      limit: hexes.length,
    }, sign));
    return new Map(events.map((event) => [nip19.npubEncode(event.pubkey), contentObject(event)]));
  });
};

export const readLearningProfiles = async (npubs, sign) => {
  const hexes = [...new Set(npubs.map(pubkeyFromNpub))];
  if (!hexes.length) return new Map();
  return withPool(async (pool) => {
    const events = latestByAddress(await query(pool, {
      kinds: [0],
      authors: hexes,
      limit: hexes.length,
    }, sign));
    return new Map(events.map((event) => {
      const profile = contentObject(event);
      return [nip19.npubEncode(event.pubkey), {
        name: [profile.display_name, profile.displayName, profile.name]
          .find((value) => typeof value === "string" && value.trim())?.trim() || "",
      }];
    }));
  });
};
