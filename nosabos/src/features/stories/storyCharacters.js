export const RPG_CHARACTER_PORTRAIT_POOLS = {
  hamster: ["33", "26", "25", "22"],
  frog: ["29", "32", "36"],
  "purple-girl": ["31", "39", "34"],
  cat: ["40", "38", "37", "28", "24"],
  yachiru: ["18", "20", "21", "23", "27", "30", "35"],
  user: ["35", "36", "31", "24"],
};

export const RPG_STORY_CHARACTERS = [
  {
    id: "hamster",
    name: "Sheilfer",
    role: "radio host / narrator",
    voice: "cedar",
    personality:
      "the narrator of the app, a relaxed but confident male voice guiding the experience",
    portraitIndex: "33",
    portraitPool: ["33", "26", "25", "22"],
  },
  {
    id: "frog",
    name: "Jiraiya",
    role: "wise elder / toad sage",
    voice: "ash",
    personality:
      "an ancient male toad sage, wise and measured with a deep gravelly tone",
    portraitIndex: "29",
    portraitPool: ["29", "32", "36"],
  },
  {
    id: "purple-girl",
    name: "Yoruichi",
    role: "spirited martial artist / cheerful adventurer",
    voice: "marin",
    personality:
      "a joyful woman with a Japanese accent, warm and enthusiastic",
    portraitIndex: "31",
    portraitPool: ["31", "39", "34"],
  },
  {
    id: "cat",
    name: "Neko",
    role: "witty companion / playful feline",
    voice: "coral",
    personality:
      "a sarcastic female cat humanoid, dry wit and playful disdain in every word",
    portraitIndex: "40",
    portraitPool: ["40", "38", "37", "28", "24"],
  },
  {
    id: "yachiru",
    name: "Yachiru",
    role: "cheerful companion / energetic friend",
    voice: "shimmer",
    personality:
      "an adorable, bubbly companion with childlike energy, excitable, warm, and playful",
    portraitIndex: "18",
    portraitPool: ["18", "20", "21", "23", "27", "30", "35"],
  },
];

export const USER_CHARACTER = {
  id: "user",
  name: "You",
  role: "learner / radio caller / conversational partner",
  isUser: true,
  portraitIndex: "35",
  petType: "ghost",
  portraitPool: ["35", "36", "31", "24"],
};

export function getUserPetType(user = null) {
  let pet = null;
  if (typeof window !== "undefined") {
    try {
      const storedRpg =
        window.localStorage?.getItem("nosabos:rpg-companion:v2") ||
        window.localStorage?.getItem("nosabos:rpg-companion:v1");
      pet =
        (storedRpg && storedRpg.trim().toLowerCase() !== "girl"
          ? storedRpg
          : null) || window.localStorage?.getItem("dailyGoalPetType");
    } catch {
      // LocalStorage access may be restricted
    }
  }
  if (!pet && user) {
    pet = user?.dailyGoalPetType || user?.petType || user?.rpgCompanion;
  }
  const norm = String(pet || "").trim().toLowerCase();
  // If for whatever reason it's "girl" or empty, default to "ghost"
  if (!norm || norm === "girl") {
    return "ghost";
  }
  const validPetTypes = ["ghost", "alien", "robot", "slime", "dog", "axolotl"];
  return validPetTypes.includes(norm) ? norm : "ghost";
}

export function isUserCharacter(name, user = null) {
  if (!name || typeof name !== "string") return false;
  const norm = name.trim().toLowerCase();
  if (norm === "you" || norm === "tú" || norm === "toi" || norm === "du" || norm === "tu") return true;
  if (user?.name && norm === user.name.trim().toLowerCase()) return true;
  if (user?.displayName && norm === user.displayName.trim().toLowerCase()) return true;
  return false;
}

export function getStoryCharacter(name, user = null) {
  if (!name || typeof name !== "string") return null;
  if (isUserCharacter(name, user)) {
    return {
      ...USER_CHARACTER,
      name: user?.name || user?.displayName || "You",
      petType: getUserPetType(user),
    };
  }
  const norm = name.trim().toLowerCase();
  const match = RPG_STORY_CHARACTERS.find(
    (c) => c.name.toLowerCase() === norm || c.id.toLowerCase() === norm,
  );
  if (match) return match;

  // Stable fallback for other names
  const hash = Array.from(norm).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const fallbackId = String((hash % 40) + 1);
  return {
    id: norm,
    name: name.trim(),
    role: "character",
    voice: "alloy",
    personality: null,
    portraitIndex: fallbackId,
  };
}

export function getUserProfilePicture(user = null) {
  if (typeof window !== "undefined") {
    try {
      const stored =
        window.localStorage?.getItem("profilePicture") ||
        window.localStorage?.getItem("profilePictureUrl");
      if (stored && typeof stored === "string" && stored.trim().length > 0) {
        return stored.trim();
      }
    } catch {
      // LocalStorage access may be restricted
    }
  }
  if (user?.picture && typeof user.picture === "string" && user.picture.trim().length > 0) {
    return user.picture.trim();
  }
  if (user?.profilePicture && typeof user.profilePicture === "string" && user.profilePicture.trim().length > 0) {
    return user.profilePicture.trim();
  }
  return null;
}

export function getStoryCharacterVoice(name, user = null) {
  if (isUserCharacter(name, user)) {
    return user?.progress?.voice || "alloy";
  }
  const char = getStoryCharacter(name, user);
  return char?.voice || "alloy";
}

export function getStoryCharacterPersonality(name) {
  if (isUserCharacter(name)) return null;
  const char = getStoryCharacter(name);
  return char?.personality || null;
}

export function getStoryCharacterPortraitId(name, user = null) {
  const char = getStoryCharacter(name, user);
  return char?.portraitIndex || "35";
}

export function getStoryCharacterPortraitPool(name, user = null) {
  const char = getStoryCharacter(name, user);
  if (!char) return ["35"];
  if (isUserCharacter(name, user)) {
    return RPG_CHARACTER_PORTRAIT_POOLS.user;
  }
  return (
    char.portraitPool ||
    RPG_CHARACTER_PORTRAIT_POOLS[char.id] ||
    [char.portraitIndex || "35"]
  );
}

export function getRandomStoryCharacterPortraitId(name, user = null) {
  const pool = getStoryCharacterPortraitPool(name, user);
  if (!pool || !pool.length) return "35";
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex] || pool[0];
}

