export const COMMUNITY_RESOURCE_LANGUAGE_CODES = ["nah", "yua"];

export const COMMUNITY_LANGUAGE_RESOURCES = {
  nah: {
    dictionaries: [
      {
        name: "Online Nahuatl Dictionary",
        url: "https://nahuatl.wired-humanities.org/",
      },
      {
        name: "Gran Diccionario Náhuatl",
        url: "https://gdn.iib.unam.mx/",
      },
    ],
    creatorsTeachers: [],
    courses: [],
  },
  yua: {
    dictionaries: [],
    creatorsTeachers: [],
    courses: [],
  },
};

export function isCommunityResourceLanguage(code) {
  return COMMUNITY_RESOURCE_LANGUAGE_CODES.includes(
    String(code || "")
      .trim()
      .toLowerCase(),
  );
}
