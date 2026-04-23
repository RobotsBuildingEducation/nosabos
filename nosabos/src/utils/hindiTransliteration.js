const CONSONANT_CLUSTERS = [
  ["tion", "शन"],
  ["sion", "ज़न"],
  ["ture", "चर"],
  ["sure", "ज़र"],
  ["eigh", "ए"],
  ["igh", "आई"],
  ["ph", "फ"],
  ["sh", "श"],
  ["ch", "च"],
  ["th", "थ"],
  ["dh", "ध"],
  ["kh", "ख"],
  ["gh", "घ"],
  ["bh", "भ"],
  ["wh", "व"],
  ["qu", "क्व"],
  ["ck", "क"],
  ["ng", "ङ"],
  ["pr", "प्र"],
  ["br", "ब्र"],
  ["tr", "ट्र"],
  ["dr", "ड्र"],
  ["gr", "ग्र"],
  ["cr", "क्र"],
  ["fr", "फ्र"],
  ["pl", "प्ल"],
  ["bl", "ब्ल"],
  ["gl", "ग्ल"],
  ["cl", "क्ल"],
  ["fl", "फ्ल"],
  ["sl", "स्ल"],
  ["sm", "स्म"],
  ["sn", "स्न"],
  ["sp", "स्प"],
  ["st", "स्ट"],
  ["sk", "स्क"],
  ["sw", "स्व"],
  ["tw", "ट्व"],
  ["wr", "र"],
  ["kn", "न"],
  ["ps", "स"],
  ["ct", "क्ट"],
  ["pt", "प्ट"],
  ["xt", "क्स्ट"],
];

const SINGLE_CONSONANTS = {
  b: "ब",
  c: "क",
  d: "ड",
  f: "फ",
  g: "ग",
  h: "ह",
  j: "ज",
  k: "क",
  l: "ल",
  m: "म",
  n: "न",
  p: "प",
  q: "क",
  r: "र",
  s: "स",
  t: "ट",
  v: "व",
  w: "व",
  x: "क्स",
  y: "य",
  z: "ज़",
};

const VOWEL_CLUSTERS = [
  ["eau", { independent: "ओ", sign: "ो" }],
  ["aa", { independent: "आ", sign: "ा" }],
  ["ae", { independent: "ए", sign: "े" }],
  ["ai", { independent: "ऐ", sign: "ै" }],
  ["ay", { independent: "ए", sign: "े" }],
  ["au", { independent: "औ", sign: "ौ" }],
  ["ea", { independent: "ई", sign: "ी" }],
  ["ee", { independent: "ई", sign: "ी" }],
  ["ei", { independent: "ए", sign: "े" }],
  ["eu", { independent: "यू", sign: "्यू" }],
  ["ie", { independent: "ई", sign: "ी" }],
  ["oa", { independent: "ओ", sign: "ो" }],
  ["oe", { independent: "ओ", sign: "ो" }],
  ["oi", { independent: "ऑय", sign: "ॉय" }],
  ["oo", { independent: "ऊ", sign: "ू" }],
  ["ou", { independent: "औ", sign: "ौ" }],
  ["ow", { independent: "औ", sign: "ौ" }],
  ["oy", { independent: "ऑय", sign: "ॉय" }],
  ["ue", { independent: "यू", sign: "्यू" }],
  ["ui", { independent: "ुई", sign: "ुई" }],
  ["ar", { independent: "आर", sign: "ार" }],
  ["er", { independent: "अर", sign: "र" }],
  ["ir", { independent: "इर", sign: "िर" }],
  ["or", { independent: "ऑर", sign: "ॉर" }],
  ["ur", { independent: "उर", sign: "ुर" }],
  ["a", { independent: "अ", sign: "" }],
  ["e", { independent: "ए", sign: "े" }],
  ["i", { independent: "इ", sign: "ि" }],
  ["o", { independent: "ओ", sign: "ो" }],
  ["u", { independent: "उ", sign: "ु" }],
  ["y", { independent: "ई", sign: "ी" }],
];

const LETTER_PATTERN = /[A-Za-z]/;

function matchCluster(source, index, clusters) {
  const lower = source.slice(index).toLowerCase();
  return clusters.find(([pattern]) => lower.startsWith(pattern)) || null;
}

function transliterateToken(token) {
  if (!LETTER_PATTERN.test(token)) return token;

  const source = token.replace(/['’]/g, "");
  const lower = source.toLowerCase();
  let index = 0;
  let out = "";
  let previousWasConsonant = false;

  while (index < lower.length) {
    const char = lower[index];

    if (!/[a-z]/.test(char)) {
      out += source[index] || char;
      index += 1;
      previousWasConsonant = false;
      continue;
    }

    if (char === "e" && index === lower.length - 1 && out) {
      index += 1;
      previousWasConsonant = false;
      continue;
    }

    const vowelMatch = matchCluster(lower, index, VOWEL_CLUSTERS);
    if (vowelMatch) {
      const [cluster, value] = vowelMatch;
      out += previousWasConsonant ? value.sign : value.independent;
      index += cluster.length;
      previousWasConsonant = false;
      continue;
    }

    const consonantMatch = matchCluster(lower, index, CONSONANT_CLUSTERS);
    if (consonantMatch) {
      const [cluster, value] = consonantMatch;
      out += value;
      index += cluster.length;
      previousWasConsonant = true;
      continue;
    }

    const consonant = SINGLE_CONSONANTS[char];
    if (consonant) {
      out += consonant;
      index += 1;
      previousWasConsonant = true;
      continue;
    }

    out += source[index] || char;
    index += 1;
    previousWasConsonant = false;
  }

  return out || token;
}

export function transliterateLatinToHindi(text) {
  return String(text || "")
    .split(/(\s+|[^A-Za-z\s]+)/)
    .map((part) => transliterateToken(part))
    .join("");
}

export default transliterateLatinToHindi;
