import test from "node:test";
import assert from "node:assert/strict";
import {
  RPG_STORY_CHARACTERS,
  USER_CHARACTER,
  isUserCharacter,
  getStoryCharacter,
  getStoryCharacterVoice,
  getStoryCharacterPersonality,
  getStoryCharacterPortraitId,
  getUserProfilePicture,
  getUserPetType,
  getStoryCharacterPortraitPool,
  getRandomStoryCharacterPortraitId,
} from "./storyCharacters.js";

test("RPG_STORY_CHARACTERS contains Sheilfer, Jiraiya, Yoruichi, Neko, and Yachiru with correct voices and portraits", () => {
  const sheilfer = RPG_STORY_CHARACTERS.find((c) => c.name === "Sheilfer");
  assert.ok(sheilfer);
  assert.equal(sheilfer.voice, "cedar");
  assert.equal(sheilfer.portraitIndex, "33");

  const jiraiya = RPG_STORY_CHARACTERS.find((c) => c.name === "Jiraiya");
  assert.ok(jiraiya);
  assert.equal(jiraiya.voice, "ash");
  assert.equal(jiraiya.portraitIndex, "29");

  const yoruichi = RPG_STORY_CHARACTERS.find((c) => c.name === "Yoruichi");
  assert.ok(yoruichi);
  assert.equal(yoruichi.voice, "marin");
  assert.equal(yoruichi.portraitIndex, "31");

  const neko = RPG_STORY_CHARACTERS.find((c) => c.name === "Neko");
  assert.ok(neko);
  assert.equal(neko.voice, "coral");
  assert.equal(neko.portraitIndex, "40");

  const yachiru = RPG_STORY_CHARACTERS.find((c) => c.name === "Yachiru");
  assert.ok(yachiru);
  assert.equal(yachiru.voice, "shimmer");
  assert.equal(yachiru.portraitIndex, "18");
  assert.deepEqual(yachiru.portraitPool, ["18", "20", "21", "23", "27", "30", "35"]);
});

test("isUserCharacter detects You and user display names", () => {
  assert.equal(isUserCharacter("You"), true);
  assert.equal(isUserCharacter("you"), true);
  assert.equal(isUserCharacter("Tú"), true);
  assert.equal(isUserCharacter("Alex", { name: "Alex" }), true);
  assert.equal(isUserCharacter("Sheilfer"), false);
});

test("getStoryCharacterVoice resolves RPG character voices and user preference", () => {
  assert.equal(getStoryCharacterVoice("Sheilfer"), "cedar");
  assert.equal(getStoryCharacterVoice("Jiraiya"), "ash");
  assert.equal(getStoryCharacterVoice("Yoruichi"), "marin");
  assert.equal(getStoryCharacterVoice("Neko"), "coral");
  assert.equal(getStoryCharacterVoice("Yachiru"), "shimmer");
  assert.equal(getStoryCharacterVoice("You", { progress: { voice: "shimmer" } }), "shimmer");
  assert.equal(getStoryCharacterVoice("You"), "alloy");
});

test("getStoryCharacterPortraitId maps character names to distinct portraits", () => {
  assert.equal(getStoryCharacterPortraitId("Sheilfer"), "33");
  assert.equal(getStoryCharacterPortraitId("Jiraiya"), "29");
  assert.equal(getStoryCharacterPortraitId("Yoruichi"), "31");
  assert.equal(getStoryCharacterPortraitId("Neko"), "40");
  assert.equal(getStoryCharacterPortraitId("Yachiru"), "18");
  assert.equal(getStoryCharacterPortraitId("You"), "35");
});

test("getUserPetType defaults 'girl' to 'ghost'", () => {
  assert.equal(getUserPetType({ dailyGoalPetType: "girl" }), "ghost");
  assert.equal(getUserPetType({ petType: "girl" }), "ghost");
  assert.equal(getUserPetType({ petType: "GIRL" }), "ghost");
  assert.equal(getUserPetType({ rpgCompanion: "girl" }), "ghost");
});

test("getUserPetType falls back to user pet when stored rpg companion is 'girl'", () => {
  const originalWindow = globalThis.window;
  try {
    globalThis.window = {
      localStorage: {
        getItem: (key) => (key === "nosabos:rpg-companion:v2" ? "girl" : null),
      },
    };
    assert.equal(getUserPetType({ dailyGoalPetType: "dog" }), "dog");
  } finally {
    globalThis.window = originalWindow;
  }
});

test("getUserPetType returns actual pet avatar or defaults to ghost", () => {
  assert.equal(getUserPetType({ dailyGoalPetType: "dog" }), "dog");
  assert.equal(getUserPetType({ dailyGoalPetType: "alien" }), "alien");
  assert.equal(getUserPetType({ dailyGoalPetType: "robot" }), "robot");
  assert.equal(getUserPetType({ dailyGoalPetType: "slime" }), "slime");
  assert.equal(getUserPetType({ dailyGoalPetType: "axolotl" }), "axolotl");
  assert.equal(getUserPetType({ dailyGoalPetType: "ghost" }), "ghost");
  assert.equal(getUserPetType({ dailyGoalPetType: "unknown_creature" }), "ghost");
  assert.equal(getUserPetType(null), "ghost");
  assert.equal(getUserPetType({}), "ghost");
});

test("getStoryCharacter assigns petType to You", () => {
  const char = getStoryCharacter("You", { dailyGoalPetType: "dog" });
  assert.equal(char.petType, "dog");

  const charGirl = getStoryCharacter("You", { dailyGoalPetType: "girl" });
  assert.equal(charGirl.petType, "ghost");
});

test("getStoryCharacterPortraitPool returns character portrait pools", () => {
  assert.deepEqual(getStoryCharacterPortraitPool("Sheilfer"), ["33", "26", "25", "22"]);
  assert.deepEqual(getStoryCharacterPortraitPool("Jiraiya"), ["29", "32", "36"]);
  assert.deepEqual(getStoryCharacterPortraitPool("Yoruichi"), ["31", "39", "34"]);
  assert.deepEqual(getStoryCharacterPortraitPool("Neko"), ["40", "38", "37", "28", "24"]);
  assert.deepEqual(getStoryCharacterPortraitPool("Yachiru"), ["18", "20", "21", "23", "27", "30", "35"]);
});

test("getRandomStoryCharacterPortraitId picks from the character's pool", () => {
  const sheilferPool = ["33", "26", "25", "22"];
  for (let i = 0; i < 20; i++) {
    const portrait = getRandomStoryCharacterPortraitId("Sheilfer");
    assert.ok(sheilferPool.includes(portrait));
  }
  const yachiruPool = ["18", "20", "21", "23", "27", "30", "35"];
  for (let i = 0; i < 20; i++) {
    const portrait = getRandomStoryCharacterPortraitId("Yachiru");
    assert.ok(yachiruPool.includes(portrait));
  }
});

