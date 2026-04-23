import { translateFlashcardConceptToHindi } from "./flashcards/hindiLocalizer.js";

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .replace(/[¿¡]/g, "")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");

const compactWhitespace = (value) =>
  String(value || "")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s+/g, " ")
    .trim();

const capitalizeFirst = (value) => {
  if (!value) return value;
  return value.charAt(0).toLocaleUpperCase("hi-IN") + value.slice(1);
};

const applySourceCase = (source, translation) => {
  if (!source || !translation) return translation;
  const trimmed = String(source).trim();
  const first = trimmed.charAt(0);
  if (
    first &&
    first === first.toLocaleUpperCase("en-US") &&
    /[A-ZÀ-ÖØ-Þ]/u.test(first)
  ) {
    return capitalizeFirst(translation);
  }
  return translation;
};

const escapeRegex = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const LETTER_CLASS = "A-Za-zÀ-ÖØ-öø-ÿ";

const replaceToken = (text, source, translation) => {
  const pattern = new RegExp(
    `(^|[^${LETTER_CLASS}])(${escapeRegex(source)})(?=$|[^${LETTER_CLASS}])`,
    "giu",
  );
  return text.replace(pattern, (_, prefix) => `${prefix}${translation}`);
};

const replacePhrase = (text, source, translation) =>
  text.replace(new RegExp(escapeRegex(source), "giu"), translation);

const EXACT_NAME_TRANSLATIONS = {
  [normalizeKey("Lange IJ")]: "लंबा IJ",
  [normalizeKey("Griekse ij")]: "ग्रीक ij",
  [normalizeKey("E met trema")]: "ट्रेमा वाला E",
  [normalizeKey("I met trema")]: "ट्रेमा वाला I",
  [normalizeKey("Silent Letters")]: "मूक अक्षर",
  [normalizeKey("Word Stress")]: "शब्द बल",
  [normalizeKey("TH (voiced)")]: "TH (स्वरयुक्त)",
  [normalizeKey("TH (unvoiced)")]: "TH (अस्वर)",
  [normalizeKey("Nasal AN/EN")]: "नासिक्य AN/EN",
  [normalizeKey("Nasal ON")]: "नासिक्य ON",
  [normalizeKey("Nasal IN")]: "नासिक्य IN",
  [normalizeKey("Nasal UN")]: "नासिक्य UN",
};

const NAME_PATTERNS = [
  [/^(.+) with acute accent$/i, (letter) => `एक्यूट वाला ${letter}`],
  [/^(.+) with grave accent$/i, (letter) => `ग्रेव वाला ${letter}`],
  [/^(.+) with circumflex$/i, (letter) => `सर्कमफ्लेक्स वाला ${letter}`],
  [/^(.+) with diaeresis$/i, (letter) => `ट्रेमा वाला ${letter}`],
  [/^(.+) with umlaut$/i, (letter) => `उमलाउट वाला ${letter}`],
  [/^(.+) with cedilla$/i, (letter) => `सेडिला वाला ${letter}`],
  [/^(.+) with tilde$/i, (letter) => `टिल्डे वाला ${letter}`],
  [/^Nasal (.+)$/i, (value) => `नासिक्य ${value}`],
];

const PHRASE_REPLACEMENTS = [
  [
    "Pronounced separately from adjacent vowel",
    "पास वाले स्वर से अलग उच्चारित",
  ],
  [
    "Same rules as Spanish and Portuguese.",
    "स्पेनिश और पुर्तगाली जैसे ही नियम।",
  ],
  ["Same as English", "अंग्रेज़ी जैसा"],
  ["Same as Spanish", "स्पेनिश जैसा"],
  ["Same as Portuguese", "पुर्तगाली जैसा"],
  ["Same as Italian", "इतालवी जैसा"],
  ["Same as French", "फ़्रेंच जैसा"],
  ["Same as German", "जर्मन जैसा"],
  ["Same as Dutch", "डच जैसा"],
  ["Same as Polish", "पोलिश जैसा"],
  ["Same as Russian", "रूसी जैसा"],
  ["Same as Greek", "ग्रीक जैसा"],
  ["Same as Irish", "आयरिश जैसा"],
  ["Same as Japanese", "जापानी जैसा"],
  ["Same as Nahuatl", "नाहुआत्ल जैसा"],
  ["Same as Yucatec Maya", "युकातेक़ माया जैसा"],
  ["Same as U", "U जैसा"],
  ["Same as A", "A जैसा"],
  ["Same as I", "I जैसा"],
  ["Same as U - only used in 'où'", "U जैसा — यह केवल 'où' में उपयोग होता है"],
  [
    "Same sound as I. Circumflex marks historical spelling change.",
    "ध्वनि I जैसी ही है। सर्कमफ्लेक्स पुराने वर्तनी-परिवर्तन को दिखाता है।",
  ],
  [
    "Only appears in 'où' (where) to distinguish from 'ou' (or).",
    "यह केवल 'où' (जहाँ) में आता है, ताकि उसे 'ou' (या) से अलग किया जा सके।",
  ],
  [
    "Same sound as U. Marks historical spelling.",
    "ध्वनि U जैसी ही है। यह पुराने वर्तनी-रूप को दिखाता है।",
  ],
  [
    "Called 'Greek I'. Same sound as I.",
    "इसे 'ग्रीक I' कहा जाता है। इसकी ध्वनि I जैसी ही है।",
  ],
  [
    "Clear L like Spanish, not dark L like end of English words.",
    "स्पेनिश जैसी साफ़ L, अंग्रेज़ी शब्दों के अंत वाली गहरी L नहीं।",
  ],
  [
    "Guttural 'R' from back of throat",
    "गले के पीछे से निकलने वाली कंठ्य 'R' ध्वनि",
  ],
  [
    "French R is uvular—back of tongue near uvula. Not rolled! Like gargling gently.",
    "फ़्रेंच R यूवुलर होती है—जीभ का पिछला हिस्सा यूवुला के पास रहता है। इसे रोल न करें; हल्की गरारे जैसी ध्वनि बनती है।",
  ],
  [
    "Say 'ee' but round your lips tightly. NOT like Spanish U! This is uniquely French.",
    "'ee' कहें, लेकिन होंठों को कसकर गोल रखें। यह स्पेनिश U जैसा नहीं है; यह खास फ़्रेंच ध्वनि है।",
  ],
  ["U pronounced separately", "U को अलग उच्चारित करें"],
  [
    "Rare in French. Separates U from other vowels.",
    "फ़्रेंच में यह दुर्लभ है। यह U को दूसरे स्वरों से अलग करता है।",
  ],
  [
    "Nasal 'eh' - like 'an' in 'sang' but nasal",
    "नासिक्य 'eh' — 'sang' के 'an' जैसा, लेकिन नासिक्य",
  ],
  [
    "Open mouth like saying 'eh', air through nose.",
    "मुंह को 'eh' बोलने जैसा खोलें और हवा को नाक से निकलने दें।",
  ],
  [
    "Say 'eh' but round your lips. Like a rounded 'uh'.",
    "'eh' कहें, लेकिन होंठों को गोल रखें। यह गोल 'uh' जैसा लगता है।",
  ],
  [
    "Tréma means 'pronounce me separately!' 'Noël' = 'no-el', not 'noel'.",
    "ट्रेमा का मतलब है 'मुझे अलग उच्चारित करें!' 'Noël' = 'नो-एल', 'नोएल' नहीं।",
  ],
  [
    "Separates I from other vowels. 'Naïf' = 'na-eef', not 'nife'.",
    "यह I को दूसरे स्वरों से अलग करता है। 'Naïf' = 'ना-ईफ़', 'नाइफ़' नहीं।",
  ],
  ["Same as Spanish Ñ!", "स्पेनिश Ñ जैसा!"],
  ["Same as Spanish", "स्पेनिश जैसा"],
  ["Like Spanish", "स्पेनिश जैसा"],
  ["Like English", "अंग्रेज़ी जैसा"],
  ["Like French", "फ़्रेंच जैसा"],
  ["Like German", "जर्मन जैसा"],
  ["Like Portuguese", "पुर्तगाली जैसा"],
  ["Like Italian", "इतालवी जैसा"],
  ["Like Dutch", "डच जैसा"],
  ["Like Polish", "पोलिश जैसा"],
  ["Like Russian", "रूसी जैसा"],
  ["Like Greek", "ग्रीक जैसा"],
  ["Like Irish", "आयरिश जैसा"],
  ["Like Japanese", "जापानी जैसा"],
  ["Like Nahuatl", "नाहुआत्ल जैसा"],
  ["Like Yucatec Maya", "युकातेक़ माया जैसा"],
  ["Similar to", "के समान"],
  ["Pronounced like", "की तरह उच्चारित"],
  ["At the end of a word", "शब्द के अंत में"],
  ["At the end of words", "शब्दों के अंत में"],
  ["At the end of a syllable", "अक्षर के अंत में"],
  ["At the end of syllables", "अक्षरों के अंत में"],
  ["At the beginning of a word", "शब्द की शुरुआत में"],
  ["At the beginning of words", "शब्दों की शुरुआत में"],
  ["At the beginning", "शुरुआत में"],
  ["At the end", "अंत में"],
  ["Between vowels", "स्वरों के बीच"],
  ["Before e/i", "e/i से पहले"],
  ["Before a/o/u", "a/o/u से पहले"],
  ["Before front vowels", "आगे वाले स्वरों से पहले"],
  ["After n", "n के बाद"],
  ["After m", "m के बाद"],
  ["With rounded lips", "होंठ गोल करके"],
  ["With spread lips", "होंठ फैलाकर"],
  ["Keep lips rounded", "होंठ गोल रखें"],
  ["Tip of tongue", "जीभ का सिरा"],
  ["Front of tongue", "जीभ का आगे का हिस्सा"],
  ["Back of tongue", "जीभ का पिछला हिस्सा"],
  ["Soft palate", "मुलायम तालु"],
  ["Hard palate", "कठोर तालु"],
  ["Air through nose", "हवा नाक से"],
  ["Air goes through the nose", "हवा नाक से गुजरती है"],
  ["Air goes through nose", "हवा नाक से गुजरती है"],
  ["Through the nose", "नाक से"],
  ["Usually silent", "आमतौर पर मूक"],
  ["Always silent", "हमेशा मूक"],
  ["Never silent", "कभी मूक नहीं"],
  ["Not silent", "मूक नहीं"],
  ["Stress this syllable", "इस अक्षर पर ज़ोर दें"],
  ["Stress this word", "इस शब्द पर ज़ोर दें"],
  [
    "Used mostly in borrowed words",
    "मुख्य रूप से उधार लिए गए शब्दों में उपयोग होता है",
  ],
  [
    "Used mostly in foreign words",
    "मुख्य रूप से विदेशी शब्दों में उपयोग होता है",
  ],
  ["Used in loanwords", "उधार लिए गए शब्दों में उपयोग होता है"],
  ["Used in native words", "मूल शब्दों में उपयोग होता है"],
  ["Rare in native words", "मूल शब्दों में दुर्लभ"],
  ["Mainly in borrowed words", "मुख्य रूप से उधार लिए गए शब्दों में"],
  ["Common in", "में आम"],
  ["Used in", "में उपयोग होता है"],
  ["Found in", "में मिलता है"],
];

const EXACT_INSTRUCTION_TRANSLATIONS = Object.fromEntries(
  [
    ["A breath of air from the throat", "गले से निकली हल्की सांस"],
    [
      "A brief catch or pause in the throat",
      "गले में बहुत छोटा रुकाव या अटकाव",
    ],
    [
      "A soft 'gh', like the 'ch' in Spanish 'lago'",
      "मुलायम 'gh' ध्वनि, स्पेनिश 'lago' के 'ch' जैसी",
    ],
    ["Always 's' sound", "हमेशा 's' की ध्वनि"],
    [
      "Between 'i' in 'bit' and 'oo' in 'book'",
      "'bit' के 'i' और 'book' के 'oo' के बीच की ध्वनि",
    ],
    [
      "Between English light and dark L",
      "अंग्रेज़ी के हल्के और गहरे L के बीच की ध्वनि",
    ],
    ["Both K and N are pronounced", "K और N दोनों उच्चारित होते हैं"],
    ["Clear L (Spanish-like)", "साफ़ L (स्पेनिश जैसा)"],
    [
      "Closed 'e' like 'ay' in 'say' without the glide",
      "बंद 'e' ध्वनि, 'say' के 'ay' जैसी लेकिन बिना फिसलन के",
    ],
    [
      "Closed 'o' like 'oh' but pure, no diphthong",
      "बंद 'o' ध्वनि, 'oh' जैसी लेकिन शुद्ध, बिना द्विस्वर के",
    ],
    ["Closed 'oh' sound", "बंद 'oh' ध्वनि"],
    [
      "Closed E like 'ay' without diphthong, stressed",
      "ज़ोर वाला बंद E, 'ay' जैसा लेकिन बिना द्विस्वर के",
    ],
    ["Closed O, stressed (less common)", "ज़ोर वाला बंद O (कम सामान्य)"],
    [
      "Final -li after L (and in many nouns)",
      "L के बाद अंतिम -li (और कई संज्ञाओं में)",
    ],
    [
      "Guttural sound from back of throat, like clearing throat",
      "गले के पीछे से निकली कंठ्य ध्वनि, जैसे गला साफ़ करते समय",
    ],
    [
      "Hard 'ch' - like clearing throat, made at back of mouth",
      "कठोर 'ch' ध्वनि, गला साफ़ करने जैसी, मुंह के पीछे बनती है",
    ],
    [
      "Like 'a' in 'cat', 'hat', 'map' - mouth wide open",
      "'cat', 'hat', 'map' के 'a' जैसी ध्वनि — मुंह खूब खोलें",
    ],
    ["Like 'a' in 'father' (open)", "'father' के 'a' जैसी खुली ध्वनि"],
    [
      "Like 'a' in 'father' - always consistent",
      "'father' के 'a' जैसी ध्वनि — हमेशा एक जैसी",
    ],
    [
      "Like 'a' in 'father', 'car', 'hot' - open back vowel",
      "'father', 'car', 'hot' के 'a' जैसी खुली पिछली स्वर ध्वनि",
    ],
    [
      "Like 'd' in 'dog', but softer between vowels (like 'th' in 'the')",
      "'dog' के 'd' जैसी, लेकिन स्वरों के बीच अधिक नरम हो जाती है",
    ],
    [
      "Like 'e' in 'bed' - always consistent",
      "'bed' के 'e' जैसी ध्वनि — हमेशा एक जैसी",
    ],
    [
      "Like 'e' in 'bed', but pure and steady",
      "'bed' के 'e' जैसी, लेकिन शुद्ध और स्थिर",
    ],
    ["Like 'ee' (in borrowed words)", "उधार लिए गए शब्दों में 'ee' जैसी ध्वनि"],
    [
      "Like 'ee' in 'see' - always consistent",
      "'see' के 'ee' जैसी ध्वनि — हमेशा एक जैसी",
    ],
    ["Like 'ee' in borrowed words", "उधार लिए गए शब्दों में 'ee' जैसी ध्वनि"],
    [
      "Like 'f' in native words; like 'v' in foreign words",
      "मूल शब्दों में 'f' जैसी, विदेशी शब्दों में 'v' जैसी",
    ],
    ["Like 'g' in 'go' - always hard", "'go' के 'g' जैसी ध्वनि — हमेशा कठोर"],
    ["Like 'k' (in borrowed words)", "उधार लिए गए शब्दों में 'k' जैसी ध्वनि"],
    [
      "Like 'k' - almost always followed by U",
      "'k' जैसी ध्वनि — लगभग हमेशा U के साथ",
    ],
    ["Like 'k' - always followed by U", "'k' जैसी ध्वनि — हमेशा U के साथ"],
    [
      "Like 'k' - always followed by U (que, qui)",
      "'k' जैसी ध्वनि — हमेशा U के साथ (que, qui)",
    ],
    ["Like 'k' - always with U", "'k' जैसी ध्वनि — हमेशा U के साथ"],
    ["Like 'ks' (in borrowed words)", "उधार लिए गए शब्दों में 'ks' जैसी ध्वनि"],
    ["Like 'kv' - always with U", "'kv' जैसी ध्वनि — हमेशा U के साथ"],
    [
      "Like 'l' at start of 'love', 'let', 'light' - tongue tip touches ridge",
      "'love', 'let', 'light' की शुरुआत वाले 'l' जैसी — जीभ का सिरा ridge को छूता है",
    ],
    [
      "Like 'l' in 'love' - tongue touches roof behind teeth",
      "'love' के 'l' जैसी — जीभ दांतों के पीछे तालु को छूती है",
    ],
    [
      "Like 'l' in 'love'; like 'w' at end of syllables in Brazil",
      "'love' के 'l' जैसी; ब्राज़ील में अक्षर के अंत में 'w' जैसी",
    ],
    [
      "Like 'm' in 'mother'; nasalizes vowel at end of syllable",
      "'mother' के 'm' जैसी; अक्षर के अंत में स्वर को नासिक्य बनाती है",
    ],
    [
      "Like 'n' in 'no'; nasalizes vowel at end of syllable",
      "'no' के 'n' जैसी; अक्षर के अंत में स्वर को नासिक्य बनाती है",
    ],
    [
      "Like 'o' in 'more' but shorter - always consistent",
      "'more' के 'o' जैसी लेकिन छोटी — हमेशा एक जैसी",
    ],
    [
      "Like 'oo' in 'moon' - always consistent",
      "'moon' के 'oo' जैसी ध्वनि — हमेशा एक जैसी",
    ],
    [
      "Like 's' in 'sun' (always unvoiced)",
      "'sun' के 's' जैसी ध्वनि (हमेशा अव्यंजित)",
    ],
    ["Like 's' in 'sun' - always", "'sun' के 's' जैसी ध्वनि — हमेशा"],
    [
      "Like 'shp' and 'sht' at beginning of words",
      "शब्दों की शुरुआत में 'shp' और 'sht' जैसी",
    ],
    ["Like 'ss' - always voiceless 's'", "'ss' जैसी — हमेशा अव्यंजित 's'"],
    [
      "Like 't' in 'water', 'better', 'butter' - sounds like a quick D",
      "'water', 'better', 'butter' के 't' जैसी — जल्दी से बोले गए D जैसी",
    ],
    [
      "Like 'th' in 'the', 'this', 'that' - tongue between teeth, voiced",
      "अंग्रेज़ी की नरम 'th' ध्वनि जैसी — जीभ दांतों के बीच रहती है और आवाज़ के साथ बोली जाती है",
    ],
    [
      "Like 'w' in 'water' (only in borrowed words)",
      "'water' के 'w' जैसी ध्वनि (केवल उधार लिए गए शब्दों में)",
    ],
    [
      "Like 'w' or 'v' (in borrowed words)",
      "उधार लिए गए शब्दों में 'w' या 'v' जैसी ध्वनि",
    ],
    [
      "Like 'y' in 'yes' (in borrowed words)",
      "उधार लिए गए शब्दों में 'yes' के 'y' जैसी ध्वनि",
    ],
    ["Long 'aw' sound like in 'law'", "'law' के 'aw' जैसी लंबी ध्वनि"],
    ["Long 'ay' sound like in 'say'", "'say' के 'ay' जैसी लंबी ध्वनि"],
    ["Long 'ee' sound like in 'see'", "'see' के 'ee' जैसी लंबी ध्वनि"],
    ["Long 'oh' sound like in 'go'", "'go' के 'oh' जैसी लंबी ध्वनि"],
    ["Long 'oo' sound like in 'moon'", "'moon' के 'oo' जैसी लंबी ध्वनि"],
    [
      "No sound—prevents softening and adds a break",
      "कोई ध्वनि नहीं — मुलायमपन रोकती है और हल्का विराम जोड़ती है",
    ],
    [
      "No sound—softens the consonant before it",
      "कोई ध्वनि नहीं — अपने पहले वाले व्यंजन को मुलायम करती है",
    ],
    ["Open 'a' like in 'father'", "'father' के 'a' जैसी खुली ध्वनि"],
    [
      "Open 'aw' or closed 'oh' depending on context",
      "संदर्भ के अनुसार खुली 'aw' या बंद 'oh' ध्वनि",
    ],
    [
      "Open 'aw' or closed 'oh' depending on word",
      "शब्द के अनुसार खुली 'aw' या बंद 'oh' ध्वनि",
    ],
    [
      "Open 'aw' or closed 'oh'; often 'oo' when unstressed",
      "खुली 'aw' या बंद 'oh' ध्वनि; बिना ज़ोर के अक्सर 'oo' जैसी",
    ],
    ["Open 'e' like 'e' in 'bed'", "'bed' के 'e' जैसी खुली ध्वनि"],
    [
      "Open 'eh' or closed 'ay' depending on word",
      "शब्द के अनुसार खुली 'eh' या बंद 'ay' ध्वनि",
    ],
    [
      "Open 'eh' or closed 'ay' depending on word; often 'ee' at end",
      "शब्द के अनुसार खुली 'eh' या बंद 'ay' ध्वनि; अंत में अक्सर 'ee' जैसी",
    ],
    ["Open 'o' like 'aw' in 'law'", "'law' के 'aw' जैसी खुली 'o' ध्वनि"],
    [
      "Open A, marks stress on final syllable",
      "खुला A; अंतिम अक्षर पर ज़ोर दिखाता है",
    ],
    [
      "Open E like 'e' in 'bed', stressed",
      "'bed' के 'e' जैसी खुली E ध्वनि, ज़ोर के साथ",
    ],
    ["Open O like 'aw', stressed", "'aw' जैसी खुली O ध्वनि, ज़ोर के साथ"],
    [
      "Open stressed 'a' like 'a' in 'father'",
      "'father' के 'a' जैसी खुली, ज़ोर वाली 'a' ध्वनि",
    ],
    ["P and F together quickly", "P और F को जल्दी से साथ बोलें"],
    [
      "Reduced, closed 'a' - less open than Á",
      "घटी हुई, बंद 'a' ध्वनि — Á से कम खुली",
    ],
    ["Rounded 'o' (never diphthong)", "गोल 'o' ध्वनि (कभी द्विस्वर नहीं)"],
    [
      "Same as A, but marks stressed syllable",
      "A जैसी ही ध्वनि, लेकिन ज़ोर वाले अक्षर को दिखाती है",
    ],
    [
      "Same as E, but marks stressed syllable",
      "E जैसी ही ध्वनि, लेकिन ज़ोर वाले अक्षर को दिखाती है",
    ],
    [
      "Same as I, but marks stressed syllable",
      "I जैसी ही ध्वनि, लेकिन ज़ोर वाले अक्षर को दिखाती है",
    ],
    [
      "Same as O, but marks stressed syllable",
      "O जैसी ही ध्वनि, लेकिन ज़ोर वाले अक्षर को दिखाती है",
    ],
    [
      "Same as U - only used in 'où'",
      "U जैसी ध्वनि — केवल 'où' में उपयोग होती है",
    ],
    [
      "Same as U, but marks stressed syllable",
      "U जैसी ही ध्वनि, लेकिन ज़ोर वाले अक्षर को दिखाती है",
    ],
    ["Same guttural sound as G", "G जैसी ही कंठ्य ध्वनि"],
    [
      "Short 'a' like in 'cat' or long 'aw' like in 'law'",
      "'cat' की छोटी 'a' या 'law' की लंबी 'aw' जैसी ध्वनि",
    ],
    ["Short 'e' like in 'bet'", "'bet' के 'e' जैसी छोटी ध्वनि"],
    ["Short 'i' like in 'bit'", "'bit' के 'i' जैसी छोटी ध्वनि"],
    ["Short 'o' like in 'hot'", "'hot' के 'o' जैसी छोटी ध्वनि"],
    ["Short 'u' like in 'put'", "'put' के 'u' जैसी छोटी ध्वनि"],
    [
      "Short: like 'u' in French 'tu'; Long (uu): same but longer",
      "छोटी ध्वनि: फ़्रेंच 'tu' के 'u' जैसी; लंबी (uu): वही ध्वनि, बस अधिक लंबी",
    ],
    [
      "Soft 'ch' - like hissing cat, made at front of mouth",
      "मुलायम 'ch' ध्वनि — फुसफुसाती बिल्ली जैसी, मुंह के आगे बनती है",
    ],
    [
      "Soft 'sh' - between 's' and 'sh'",
      "मुलायम 'sh' ध्वनि — 's' और 'sh' के बीच",
    ],
    [
      "Stressed syllables are LOUDER, LONGER, and HIGHER in pitch",
      "ज़ोर वाले अक्षर अधिक तेज़, अधिक लंबे और ऊंची पिच वाले होते हैं",
    ],
    [
      "The 'uh' in 'about', 'banana', 'sofa' - neutral, unstressed",
      "'about', 'banana', 'sofa' का 'uh' — तटस्थ, बिना ज़ोर की ध्वनि",
    ],
    ["The N is often dropped in speech", "बोलचाल में N अक्सर गिर जाता है"],
    [
      "A buzzy 'zh' sound; keep it voiced and smooth.",
      "गूंजती 'zh' ध्वनि; इसे स्वरयुक्त और मुलायम रखें।",
    ],
    [
      "A light trill; practice with quick taps like in Spanish 'pero'.",
      "हल्की trill ध्वनि; स्पेनिश 'pero' जैसी तेज़ हल्की टकों के साथ अभ्यास करें।",
    ],
    [
      "A voiced consonant; vibrate the vocal cords lightly.",
      "यह स्वरयुक्त व्यंजन है; स्वर-तंतुओं में हल्का कंपन रखें।",
    ],
    [
      "Accent shows which syllable is stressed. Sound doesn't change, just emphasis.",
      "उच्चारण-चिह्न बताता है कि किस अक्षर पर ज़ोर है। ध्वनि नहीं बदलती, केवल ज़ोर बदलता है।",
    ],
    [
      "Acute accent marks stress AND open quality. Very open sound.",
      "एक्यूट चिह्न ज़ोर और खुली गुणवत्ता दोनों दिखाता है। बहुत खुली ध्वनि।",
    ],
    [
      "Adds a light 'y' before the vowel; softens the preceding consonant.",
      "स्वर से पहले हल्की 'y' ध्वनि जोड़ता है; पिछले व्यंजन को मुलायम करता है।",
    ],
    [
      "After a, o, u, au: hard CH. Like Scottish 'loch' or Spanish J.",
      "a, o, u, au के बाद कठोर CH ध्वनि आती है। स्कॉटिश 'loch' या स्पेनिश J जैसी।",
    ],
    [
      "After e, i, ä, ö, ü, and consonants: soft CH. Like a breathy 'sh' but further forward.",
      "e, i, ä, ö, ü और व्यंजनों के बाद मुलायम CH ध्वनि आती है। यह सांस भरी 'sh' जैसी है, लेकिन थोड़ा आगे बनती है।",
    ],
    [
      "Air goes through nose AND mouth. Unique Portuguese sound! 'Irmã' = sister.",
      "हवा नाक और मुंह दोनों से निकलती है। यह पुर्तगाली की खास ध्वनि है। 'Irmã' = बहन।",
    ],
    [
      "Also breaks diphthongs: 'día' has two syllables (dí-a), not one.",
      "यह द्विस्वर भी तोड़ता है: 'día' में एक नहीं, दो अक्षर हैं (dí-a)।",
    ],
    [
      "Always 'clear L' like at start of English words, never 'dark L'.",
      "हमेशा साफ़ L ध्वनि, जैसे अंग्रेज़ी शब्दों की शुरुआत में; कभी गहरी 'dark L' नहीं।",
    ],
    ["Always /ʃ/ in Náhuat.", "नाहुआत में यह हमेशा /ʃ/ ध्वनि देता है।"],
    ["Always a clear 'ee' sound.", "हमेशा साफ़ 'ee' ध्वनि।"],
    [
      "Always appears as QUE or QUI. The U is silent. 'Que' = 'ke'.",
      "यह हमेशा QUE या QUI के रूप में आता है। U मूक रहती है। 'Que' = 'ke'।",
    ],
    [
      "Always closed O. 'Hôtel' has closed O sound.",
      "हमेशा बंद O ध्वनि। 'Hôtel' में बंद O है।",
    ],
    [
      "Always hard G, never soft like in 'gem'.",
      "हमेशा कठोर G; 'gem' जैसा मुलायम नहीं।",
    ],
    [
      "Always hard G. With H (gh), it's a guttural sound or silent.",
      "G हमेशा कठोर रहता है। H (gh) के साथ यह कंठ्य ध्वनि बनता है या मूक हो जाता है।",
    ],
    [
      "Always hard like K, never soft. With H (ch), sounds like German 'ch'.",
      "हमेशा K की तरह कठोर, कभी मुलायम नहीं। H (ch) के साथ यह जर्मन 'ch' जैसा सुनाई देता है।",
    ],
    [
      "Always pronounced 'ts', never like 'k' or 's' alone.",
      "हमेशा 'ts' की तरह उच्चारित होता है; केवल 'k' या केवल 's' जैसा नहीं।",
    ],
    [
      "Always stressed; dots are sometimes omitted in print—listen for the 'yo'.",
      "इस पर हमेशा ज़ोर रहता है; छपाई में बिंदु कभी-कभी छोड़ दिए जाते हैं — 'yo' ध्वनि पर ध्यान दें।",
    ],
    [
      "Always trilled! Single R = light trill, RR = strong trill. Like Spanish R.",
      "हमेशा trill के साथ! एकल R = हल्की trill, RR = मज़बूत trill। स्पेनिश R जैसी।",
    ],
    [
      "Always unvoiced like 's' in 'sun', never like 'z' in 'zoo'.",
      "हमेशा 'sun' के 's' जैसी अव्यंजित ध्वनि, 'zoo' के 'z' जैसी कभी नहीं।",
    ],
    [
      "Always unvoiced, like English S in 'sun'.",
      "हमेशा अव्यंजित, अंग्रेज़ी 'sun' के S जैसी।",
    ],
    [
      "As consonant: like English Y. The word 'y' (and) sounds like Spanish 'i'.",
      "व्यंजन के रूप में यह अंग्रेज़ी Y जैसी है। अलग शब्द 'y' का उच्चारण स्पेनिश 'i' जैसा होता है।",
    ],
    [
      "At end of syllable, M nasalizes the vowel: 'bem' = 'bẽ' (nasal).",
      "अक्षर के अंत में M स्वर को नासिक्य बनाता है: 'bem' = 'bẽ' (नासिक्य)।",
    ],
    [
      "At end of syllable, N nasalizes the vowel. Silent itself.",
      "अक्षर के अंत में N स्वर को नासिक्य बनाता है। स्वयं मूक रहता है।",
    ],
    [
      "At start of word: like English B. Between vowels: lips don't fully close.",
      "शब्द की शुरुआत में यह अंग्रेज़ी B जैसी है। स्वरों के बीच होंठ पूरी तरह बंद नहीं होते।",
    ],
    [
      "At the start of syllables, L is 'clear'. Similar to Spanish L.",
      "अक्षरों की शुरुआत में L साफ़ सुनाई देती है। स्पेनिश L जैसी।",
    ],
    [
      "Avoid diphthongs; keep the vowel short and clean.",
      "द्विस्वर से बचें; स्वर को छोटा और साफ़ रखें।",
    ],
    [
      "Back of the tongue touches the soft palate.",
      "जीभ का पिछला हिस्सा मुलायम तालु को छूता है।",
    ],
    [
      "Back of tongue touches soft palate. Air goes through nose. Never add a 'g' sound after!",
      "जीभ का पिछला हिस्सा मुलायम तालु को छूता है। हवा नाक से निकलती है। इसके बाद कभी 'g' ध्वनि न जोड़ें!",
    ],
    [
      "Between English W and V. More like V than W.",
      "यह अंग्रेज़ी W और V के बीच है, लेकिन V के अधिक करीब है।",
    ],
    [
      "Between vowels, D sounds almost like English 'th' in 'the'.",
      "स्वरों के बीच D अंग्रेज़ी की नरम 'th' ध्वनि के करीब सुनाई देती है।",
    ],
    [
      "Blend a quick 't' and 's' together.",
      "तेज़ 't' और 's' को साथ मिलाकर बोलें।",
    ],
    [
      "Both OU and AU make the same sound in Dutch.",
      "डच में OU और AU दोनों एक ही ध्वनि देते हैं।",
    ],
    [
      "Both short and long U are like English 'oo', just different lengths.",
      "छोटी और लंबी दोनों U अंग्रेज़ी 'oo' जैसी हैं, फर्क केवल लंबाई का है।",
    ],
    [
      "CH and G make the same guttural sound!",
      "CH और G दोनों एक ही कंठ्य ध्वनि देते हैं!",
    ],
    [
      "Can sound like m/n/ŋ depending on following sounds; counts as its own mora.",
      "आगे आने वाली ध्वनि के अनुसार यह m/n/ŋ जैसा सुन सकता है; इसे अपनी अलग mora गिना जाता है।",
    ],
    [
      "Classic nasal—use it to feel the rhythm of Japanese mora timing.",
      "यह मूल नासिक्य ध्वनि है — इससे जापानी mora की लय महसूस करें।",
    ],
    [
      "Clear L sound, tongue touches upper teeth ridge.",
      "साफ़ L ध्वनि; जीभ ऊपर के दांतों के पीछे वाले ridge को छूती है।",
    ],
    [
      "Clear L, like Spanish. Never dark L like English 'full'.",
      "स्पेनिश जैसी साफ़ L ध्वनि। अंग्रेज़ी 'full' जैसी गहरी L कभी नहीं।",
    ],
    [
      "Close both lips, then release with voice.",
      "दोनों होंठ बंद करें, फिर आवाज़ के साथ खोलें।",
    ],
    [
      "Closed A, less common. Found in words like 'câmera'.",
      "बंद A ध्वनि, कम सामान्य। 'câmera' जैसे शब्दों में मिलती है।",
    ],
    [
      "Closed E at end of words. 'Perché' (why/because) has closed E.",
      "शब्दों के अंत में बंद E ध्वनि। 'Perché' (why/because) में बंद E है।",
    ],
    [
      "Closed E, mouth less open. 'Você' has closed E.",
      "बंद E ध्वनि; मुंह कम खुलता है। 'Você' में बंद E है।",
    ],
    [
      "Closed E. Always pronounced, never silent. 'Été' = 'ay-tay'.",
      "बंद E ध्वनि। यह हमेशा उच्चारित होती है, कभी मूक नहीं। 'Été' = 'ay-tay'।",
    ],
    [
      "Closed O accent is rare. Most words use Ò.",
      "बंद O वाला उच्चारण-चिह्न दुर्लभ है। अधिकतर शब्द Ò का उपयोग करते हैं।",
    ],
    [
      "Closed O, lips more rounded. 'Avô' (grandfather) vs 'avó' (grandmother).",
      "बंद O ध्वनि; होंठ अधिक गोल होते हैं। 'Avô' (grandfather) और 'avó' (grandmother) का अंतर याद रखें।",
    ],
    [
      "Crisp and unaspirated—less puff of air than English.",
      "स्पष्ट और बिना aspiration के — अंग्रेज़ी से कम हवा निकलती है।",
    ],
    [
      "Crisp s; pair with ざ for the voiced partner.",
      "स्पष्ट s ध्वनि; स्वरयुक्त जोड़ी समझने के लिए ざ के साथ तुलना करें।",
    ],
    [
      "Dental D, tongue touches back of teeth.",
      "दंतीय D ध्वनि; जीभ दांतों के पीछे लगती है।",
    ],
    [
      "Dental D, tongue touches back of upper teeth.",
      "दंतीय D ध्वनि; जीभ ऊपर के दांतों के पीछे लगती है।",
    ],
    [
      "Dental T, unaspirated. Tongue touches back of teeth.",
      "दंतीय T ध्वनि, बिना aspiration के। जीभ दांतों के पीछे लगती है।",
    ],
    [
      "Dental T, unaspirated. Tongue touches teeth.",
      "दंतीय T ध्वनि, बिना aspiration के। जीभ दांतों को छूती है।",
    ],
    ["Dental/alveolar, Spanish-like.", "दंतीय/अल्वियोलर ध्वनि, स्पेनिश जैसी।"],
    [
      "Different from W! Bite your lower lip gently and hum.",
      "यह W से अलग है! निचले होंठ को हल्के से काटें और गुनगुनाएं।",
    ],
    [
      "Drop your jaw low and spread lips slightly. Doesn't exist in Spanish!",
      "जबड़ा नीचे गिराएं और होंठ थोड़ा फैलाएं। यह ध्वनि स्पेनिश में नहीं है!",
    ],
    [
      "Dutch R varies by region! Uvular (French-like) is common in the west.",
      "डच R क्षेत्र के अनुसार बदलता है। पश्चिम में यूवुलर (फ़्रेंच जैसी) R आम है।",
    ],
    [
      "Dutch has short and long vowels. Short A is different from English!",
      "डच में छोटे और लंबे स्वर दोनों होते हैं। छोटी A अंग्रेज़ी से अलग है!",
    ],
    [
      "EI always = 'eye' sound. 'Mein' = 'mine'. Very consistent!",
      "EI हमेशा 'eye' जैसी ध्वनि देता है। 'Mein' = 'mine'। यह बहुत नियमित है।",
    ],
    [
      "EI and IJ sound the same! Spelling difference is historical.",
      "EI और IJ एक जैसी सुनाई देते हैं! वर्तनी का अंतर ऐतिहासिक है।",
    ],
    [
      "EU and ÄU both = 'oy' sound! 'Deutsch' = 'Doytsh', 'Häuser' = 'Hoyzer'.",
      "EU और ÄU दोनों 'oy' जैसी ध्वनि देते हैं! 'Deutsch' = 'Doytsh', 'Häuser' = 'Hoyzer'।",
    ],
    [
      "English is stress-timed. Stressed syllables stand out. PHOtograph vs phoTOGrapher.",
      "अंग्रेज़ी की लय ज़ोर वाले अक्षरों पर आधारित होती है। ज़ोर वाले अक्षर साफ़ उभरकर सुनाई देते हैं। PHOtograph बनाम phoTOGrapher देखें।",
    ],
    ["Feel vibration in the lips.", "होंठों में कंपन महसूस करें।"],
    [
      "Final sigma uses the ς shape.",
      "अंतिम sigma के लिए ς रूप इस्तेमाल होता है।",
    ],
    [
      "French A is between English 'cat' and 'father'. Keep it pure.",
      "फ़्रेंच A अंग्रेज़ी 'cat' और 'father' के बीच की ध्वनि है। इसे शुद्ध रखें।",
    ],
    [
      "G before e/i makes the same sound as J (Spanish J sound).",
      "e/i से पहले G वही ध्वनि देता है जो J देती है (स्पेनिश J ध्वनि)।",
    ],
    [
      "German has short and long vowels. Length changes meaning!",
      "जर्मन में छोटे और लंबे स्वर होते हैं। लंबाई से अर्थ बदल सकता है!",
    ],
    [
      "Glide + vowel; also softens the consonant before it.",
      "यह स्वर से पहले हल्की 'y' ध्वनि जोड़ता है; अपने पहले वाले व्यंजन को भी मुलायम करता है।",
    ],
    [
      "H is always silent! 'Hola' sounds like 'ola'. Never pronounce it.",
      "H हमेशा मूक होती है! 'Hola' 'ola' जैसा सुनाई देता है। इसे कभी न बोलें।",
    ],
    [
      "H often follows consonants to show lenition (softening). Changes the sound completely.",
      "H अक्सर व्यंजनों के बाद lenition (मुलायमपन) दिखाने के लिए आती है। इससे ध्वनि पूरी तरह बदल सकती है।",
    ],
    [
      "Hard G—avoid the English 'j' sound you get before e/i.",
      "कठोर G रखें — e/i से पहले अंग्रेज़ी जैसी 'j' ध्वनि न आने दें।",
    ],
    [
      "Hiragana (あ) and Katakana (ア) share the same sound.",
      "हिरागाना (あ) और काताकाना (ア) एक ही ध्वनि साझा करते हैं।",
    ],
    [
      "Humming helps—feel vibration in the lips.",
      "गुनगुनाने से मदद मिलती है — होंठों में कंपन महसूस करें।",
    ],
    [
      "In Brazil, final L sounds like W: 'Brasil' = 'Brasiw'. Portugal keeps the L.",
      "ब्राज़ील में शब्दांत L अक्सर W जैसी सुनाई देती है: 'Brasil' = 'Brasiw'। पुर्तगाल में L बनी रहती है।",
    ],
    [
      "In German words, Y sounds like Ü. In foreign words, varies.",
      "जर्मन शब्दों में Y अक्सर Ü जैसी सुनाई देती है। विदेशी शब्दों में इसका उच्चारण बदल सकता है।",
    ],
    [
      "In Spain: tongue between teeth like 'th' in 'think'. Latin America: like S.",
      "स्पेन में जीभ दांतों के बीच रहती है, 'think' के 'th' जैसी। लैटिन अमेरिका में यह S जैसी सुनाई देती है।",
    ],
    [
      "In Spanish, B and V sound identical! Don't use English V sound.",
      "स्पेनिश में B और V एक जैसी सुनाई देती हैं! अंग्रेज़ी वाली V ध्वनि न प्रयोग करें।",
    ],
    [
      "In most countries: like Y. In Argentina/Uruguay: like 'sh' or 'zh'.",
      "ज़्यादातर देशों में यह Y जैसी सुनाई देती है। अर्जेंटीना/उरुग्वे में 'sh' या 'zh' जैसी।",
    ],
    [
      "It's T + SH combined quickly. Tongue starts at the ridge, then pulls back.",
      "यह T + SH को जल्दी से मिलाकर बनती है। जीभ पहले ridge पर जाती है, फिर पीछे हटती है।",
    ],
    ["Keep it open and steady.", "इसे खुला और स्थिर रखें।"],
    [
      "Keep it short—avoid the English 'yee'.",
      "इसे छोटा रखें — अंग्रेज़ी 'yee' जैसी ध्वनि से बचें।",
    ],
    [
      "Keep it voiced; feel the vibration.",
      "इसे स्वरयुक्त रखें; कंपन महसूस करें।",
    ],
    [
      "Keep lips rounded and tense; don't let it drift toward English 'you'.",
      "होंठ गोल और तने रखें; इसे अंग्रेज़ी 'you' की ओर न जाने दें।",
    ],
    [
      "Keep lips rounded and the vowel steady.",
      "होंठ गोल रखें और स्वर को स्थिर रखें।",
    ],
    [
      "Keep the tongue high and the airflow soft.",
      "जीभ ऊंची रखें और हवा का बहाव मुलायम रखें।",
    ],
    ["Keep the vowel open and steady.", "स्वर को खुला और स्थिर रखें।"],
    [
      "Keep the vowel steady and clear; it does not change.",
      "स्वर को स्थिर और साफ़ रखें; यह नहीं बदलता।",
    ],
    [
      "Less puff than English; pair with が for voiced contrast.",
      "अंग्रेज़ी से कम हवा निकलती है; स्वरयुक्त अंतर समझने के लिए が के साथ तुलना करें।",
    ],
    [
      "Let the sound come from the throat, not the lips.",
      "ध्वनि को होंठों से नहीं, गले से आने दें।",
    ],
    [
      "Light touch of teeth to lip; pair with В to feel voiced/unvoiced.",
      "दांतों को होंठ से हल्के से लगाएं; स्वरयुक्त और अव्यंजित अंतर महसूस करने के लिए В के साथ तुलना करें।",
    ],
    [
      "Like breathing on glasses to clean them. Very light, no friction.",
      "जैसे चश्मा साफ़ करने के लिए उस पर हल्की सांस छोड़ते हैं। बहुत हल्की ध्वनि, बिना घर्षण के।",
    ],
    [
      "Like the 's' in 'measure' or 'vision'.",
      "'measure' या 'vision' के 's' जैसी ध्वनि।",
    ],
    [
      "Lips rounded but relaxed. Shorter and less tense than 'oo' in 'moon'.",
      "होंठ गोल रखें, लेकिन ढीले। 'moon' के 'oo' से छोटी और कम तनी हुई ध्वनि।",
    ],
    [
      "Makes the U audible in güe/güi: 'pingüino' = pin-GWI-no, not 'pin-GI-no'.",
      "यह güe/güi में U को सुनाई देने योग्य बनाता है: 'pingüino' = pin-GWI-no, 'pin-GI-no' नहीं।",
    ],
    [
      "Marks stress. Same sound as unstressed I, just emphasized.",
      "यह ज़ोर दिखाता है। ध्वनि बिना-ज़ोर वाली I जैसी ही है, बस अधिक उभरी हुई।",
    ],
    [
      "Marks stress. Same sound as unstressed U.",
      "यह ज़ोर दिखाता है। ध्वनि बिना-ज़ोर वाली U जैसी ही है।",
    ],
    [
      "Mostly in borrowed words. Native Dutch uses K or S.",
      "यह अधिकतर उधार लिए गए शब्दों में आता है। मूल डच में K या S का उपयोग होता है।",
    ],
    [
      "Nasalized 'e'. At word end, often just sounds like regular 'e'.",
      "नासिक्य 'e' ध्वनि। शब्द के अंत में यह अक्सर सामान्य 'e' जैसी सुनाई देती है।",
    ],
    [
      "One of the few remaining W-syllables; also a topic particle as 'は'.",
      "यह बचे हुए कुछ W-स्वरांशों में से एक है; विषय-सूचक particle के रूप में 'は' भी 'wa' पढ़ा जाता है।",
    ],
    [
      "One of the first vowels learners hear; pair with O to notice stress.",
      "सीखने वाले सबसे पहले जिन स्वरों को सुनते हैं, उनमें से एक। ज़ोर का अंतर समझने के लिए O के साथ तुलना करें।",
    ],
    [
      "Only YA/YU/YO exist—no yi/ye entries.",
      "केवल YA/YU/YO रूप होते हैं — yi/ye नहीं होते।",
    ],
    [
      "Only appears at end of words. 'Città', 'papà', 'perché no? → Sì!'",
      "यह केवल शब्दों के अंत में आता है। उदाहरण: 'Città', 'papà', 'perché no? → Sì!'।",
    ],
    [
      "Only appears before a, o, u. Makes 's' sound: 'coração' = 'corassão'.",
      "यह केवल a, o, u से पहले आता है। 's' ध्वनि देता है: 'coração' = 'corassão'।",
    ],
    [
      "Only at end of words. 'Così' (so/thus), 'lì' (there).",
      "यह केवल शब्दों के अंत में आता है। 'Così' (so/thus), 'lì' (there)।",
    ],
    [
      "Only at end of words. 'Più' (more), 'gioventù' (youth).",
      "यह केवल शब्दों के अंत में आता है। 'Più' (more), 'gioventù' (youth)।",
    ],
    ["Only in borrowed words.", "यह केवल उधार लिए गए शब्दों में आता है।"],
    [
      "Only in borrowed words. Native Dutch uses KW.",
      "यह केवल उधार लिए गए शब्दों में आता है। मूल डच में KW का उपयोग होता है।",
    ],
    [
      "Only in borrowed words. Native words use C or QU.",
      "यह केवल उधार लिए गए शब्दों में आता है। मूल शब्दों में C या QU का उपयोग होता है।",
    ],
    [
      "Only in borrowed words. Sounds like I.",
      "यह केवल उधार लिए गए शब्दों में आता है। इसकी ध्वनि I जैसी होती है।",
    ],
    [
      "Only in foreign words. Native Dutch uses IJ.",
      "यह केवल विदेशी शब्दों में आता है। मूल डच में IJ का उपयोग होता है।",
    ],
    [
      "Only in foreign words. Native Italian uses C or CH.",
      "यह केवल विदेशी शब्दों में आता है। मूल इतालवी में C या CH का उपयोग होता है।",
    ],
    [
      "Only in foreign words. Pronounced like English W or Spanish U.",
      "यह केवल विदेशी शब्दों में आता है। इसका उच्चारण अंग्रेज़ी W या स्पेनिश U जैसा होता है।",
    ],
    [
      "Only in foreign words: 'jeans', 'jazz'. Native Italian uses I or GI.",
      "यह केवल विदेशी शब्दों में आता है: 'jeans', 'jazz'। मूल इतालवी में I या GI का उपयोग होता है।",
    ],
    [
      "Only in foreign words: 'taxi', 'extra'.",
      "यह केवल विदेशी शब्दों में आता है: 'taxi', 'extra'।",
    ],
    [
      "Only in foreign words: 'weekend', 'web'. Italians often say 'v' instead.",
      "यह केवल विदेशी शब्दों में आता है: 'weekend', 'web'। इतालवी बोलने वाले अक्सर इसकी जगह 'v' कहते हैं।",
    ],
    [
      "Only in foreign words: 'yoga', 'yogurt'.",
      "यह केवल विदेशी शब्दों में आता है: 'yoga', 'yogurt'।",
    ],
    [
      "Only used in borrowed words (kilo, karate). Usually spelled with C or QU.",
      "यह केवल उधार लिए गए शब्दों (kilo, karate) में आता है। आम तौर पर इसे C या QU से लिखा जाता है।",
    ],
    [
      "Open E at end of words. 'È' means 'is'. 'Caffè' has open E.",
      "शब्दों के अंत में खुली E ध्वनि। 'È' का अर्थ 'is' है। 'Caffè' में खुली E है।",
    ],
    [
      "Open E, mouth more open than Ê. 'Café' has open E.",
      "खुली E ध्वनि; मुंह Ê से अधिक खुलता है। 'Café' में खुली E है।",
    ],
    [
      "Open E. More open than É. 'Père' = 'pair'.",
      "खुली E ध्वनि। यह É से अधिक खुली है। उदाहरण: 'Père'।",
    ],
    [
      "Open O at end of words. 'Però' (but/however).",
      "शब्दों के अंत में खुली O ध्वनि। 'Però' (but/however)।",
    ],
    [
      "Open O before certain consonants, closed O at end of syllables.",
      "कुछ व्यंजनों से पहले खुली O ध्वनि, और अक्षरों के अंत में बंद O ध्वनि।",
    ],
    ["Open O sound, rounded lips.", "खुली O ध्वनि, होंठ गोल रखें।"],
    [
      "Open O, more like 'aw'. Mouth open wider than Ô.",
      "खुली O ध्वनि, 'aw' के अधिक करीब। मुंह Ô से अधिक खुलता है।",
    ],
    [
      "Open mouth wide, tongue low and back. Similar to Spanish 'a' but deeper.",
      "मुंह खूब खोलें, जीभ नीचे और पीछे रखें। यह स्पेनिश 'a' जैसी है, लेकिन अधिक गहरी।",
    ],
    [
      "Open vowel, similar to English 'ah'.",
      "खुली स्वर ध्वनि, अंग्रेज़ी 'ah' जैसी।",
    ],
    [
      "Pair with С (S) to feel the voiced vs. unvoiced contrast.",
      "स्वरयुक्त और अव्यंजित अंतर महसूस करने के लिए С (S) के साथ तुलना करें।",
    ],
    [
      "Palatal L. Tongue middle touches roof of mouth. Like Italian 'gl' in 'famiglia'.",
      "तालव्य L ध्वनि। जीभ का मध्य भाग तालु को छूता है। इतालवी 'famiglia' के 'gl' जैसी।",
    ],
    [
      "Place the tongue lightly between the teeth.",
      "जीभ को हल्के से दांतों के बीच रखें।",
    ],
    [
      "Place tongue at the ridge behind teeth; pairs with soft vowels to lighten it.",
      "जीभ को दांतों के पीछे वाले ridge पर रखें; मुलायम स्वरों के साथ यह और हल्की हो जाती है।",
    ],
    [
      "Place tongue between teeth and vibrate vocal cords. Feel the buzz!",
      "जीभ को दांतों के बीच रखें और स्वर-तंतुओं में कंपन करें। वह भनभनाहट महसूस करें!",
    ],
    [
      "Polish J is always like English Y, never like English J.",
      "पोलिश J हमेशा अंग्रेज़ी Y जैसी होती है, अंग्रेज़ी J जैसी कभी नहीं।",
    ],
    [
      "Pure and open, like Spanish A. Never changes.",
      "शुद्ध और खुली ध्वनि, स्पेनिश A जैसी। यह नहीं बदलती।",
    ],
    [
      "Pure rounded sound, never becomes 'oh-oo' like in English 'go'.",
      "शुद्ध गोल ध्वनि; यह अंग्रेज़ी 'go' जैसी 'oh-oo' नहीं बनती।",
    ],
    [
      "Pure rounded sound. Never changes. Silent in QUE, QUI, GUE, GUI.",
      "शुद्ध गोल ध्वनि। यह नहीं बदलती। QUE, QUI, GUE, GUI में मूक रहती है।",
    ],
    [
      "Pure sound, never changes. Shorter than English 'ee'.",
      "शुद्ध ध्वनि, जो नहीं बदलती। यह अंग्रेज़ी 'ee' से छोटी है।",
    ],
    [
      "QU = 'kw' sound. The U is always pronounced: 'quando' = 'kwan-do'.",
      "QU = 'kw' ध्वनि। इसमें U हमेशा बोली जाती है: 'quando' = 'kwan-do'।",
    ],
    [
      "Quick flap—between English r and l.",
      "तेज़ हल्की flap ध्वनि — अंग्रेज़ी r और l के बीच।",
    ],
    [
      "Relax everything! Mouth slightly open, tongue in middle. Common in stressed syllables.",
      "सब कुछ ढीला छोड़ें! मुंह थोड़ा खुला रखें, जीभ बीच में रहे। यह ज़ोर वाले अक्षरों में आम है।",
    ],
    [
      "Relax your tongue and jaw. It's between 'ee' and 'eh'. Most common English vowel!",
      "जीभ और जबड़े को ढीला रखें। यह 'ee' और 'eh' के बीच की ध्वनि है। अंग्रेज़ी की सबसे सामान्य स्वर ध्वनियों में से एक!",
    ],
    [
      "Remember the particle exception: は is pronounced 'wa' in grammar.",
      "particle वाले अपवाद को याद रखें: व्याकरण में は का उच्चारण 'wa' होता है।",
    ],
    ["Replaces z and soft c.", "यह z और मुलायम c की जगह लेता है।"],
    ["Represents the breathy H sound.", "यह सांसभरी H ध्वनि को दर्शाता है।"],
    [
      "Round lips slightly, tongue behind the ridge. Like telling someone to be quiet: 'shhh!'",
      "होंठ थोड़ा गोल करें और जीभ को ridge के पीछे रखें। जैसे किसी को चुप कराते हुए 'shhh!' कहते हैं।",
    ],
    [
      "Round your lips and keep the sound short.",
      "होंठ गोल करें और ध्वनि को छोटा रखें।",
    ],
    [
      "Round your lips and pull tongue back. Like saying 'oh' but more open.",
      "होंठ गोल करें और जीभ को पीछे खींचें। 'oh' कहने जैसा, लेकिन अधिक खुला।",
    ],
    [
      "Same as English M. Lips close together.",
      "अंग्रेज़ी M जैसी ध्वनि। होंठ आपस में बंद होते हैं।",
    ],
    [
      "Same as English N. Tongue touches ridge behind upper teeth.",
      "अंग्रेज़ी N जैसी ध्वनि। जीभ ऊपर के दांतों के पीछे वाले ridge को छूती है।",
    ],
    [
      "Same position as CH, but add voice. Feel your throat vibrate!",
      "CH वाली ही स्थिति रखें, लेकिन आवाज़ जोड़ें। गले का कंपन महसूस करें!",
    ],
    [
      "Same rules as Spanish. Use Ç for 's' sound before a/o/u.",
      "नियम स्पेनिश जैसे ही हैं। a/o/u से पहले 's' ध्वनि के लिए Ç का उपयोग करें।",
    ],
    [
      "Same sound as A. Used to distinguish words: 'a' (has) vs 'à' (to/at).",
      "A जैसी ही ध्वनि। शब्दों में भेद करने के लिए उपयोग होती है: 'a' (has) बनाम 'à' (to/at)।",
    ],
    [
      "Same sound as È. Circumflex often marks a historical 's': 'forêt' was 'forest'.",
      "È जैसी ही ध्वनि। circumflex अक्सर पुराने 's' को दर्शाता है: 'forêt' पहले 'forest' था।",
    ],
    [
      "Same sound as Ó. Rounded lips, 'oo' sound.",
      "Ó जैसी ही ध्वनि। होंठ गोल रखें, 'oo' जैसी ध्वनि।",
    ],
    [
      "Same tongue position as voiced TH, but whisper it—no vocal cord vibration.",
      "स्वरयुक्त TH वाली ही जीभ की स्थिति रखें, लेकिन इसे फुसफुसाकर बोलें — स्वर-तंतुओं में कंपन नहीं होना चाहिए।",
    ],
    [
      "Same vowel as eta/iota in modern Greek.",
      "आधुनिक ग्रीक में यह eta/iota जैसी ही स्वर ध्वनि है।",
    ],
    [
      "Say 'ah' while air goes through nose. The N is NOT pronounced!",
      "'ah' कहें और हवा नाक से निकलने दें। N का उच्चारण नहीं होता!",
    ],
    [
      "Seen mostly in borrowed words; adds a tiny pause before 'yo/ye/yu/ya'.",
      "यह अधिकतर उधार लिए गए शब्दों में मिलता है; 'yo/ye/yu/ya' से पहले बहुत छोटा विराम जोड़ता है।",
    ],
    [
      "Short E sound. One of the slender vowels (e, i).",
      "छोटी E ध्वनि। यह पतले स्वरों (e, i) में से एक है।",
    ],
    [
      "Short I sound, between 'ee' and 'i' in 'bit'.",
      "छोटी I ध्वनि, 'ee' और 'bit' के 'i' के बीच।",
    ],
    [
      "Short O is more open. Long O (oo) has no diphthong.",
      "छोटी O अधिक खुली होती है। लंबी O (oo) में द्विस्वर नहीं होता।",
    ],
    ["Short and bright vowel.", "छोटी और चमकीली स्वर ध्वनि।"],
    ["Short and pure.", "छोटी और शुद्ध ध्वनि।"],
    ["Short, open 'e' sound.", "छोटी, खुली 'e' ध्वनि।"],
    [
      "Silent like in Spanish. Only matters in digraphs: ch, lh, nh.",
      "स्पेनिश की तरह मूक। इसका महत्व केवल digraphs में होता है: ch, lh, nh।",
    ],
    [
      "Single R = one quick tap. Like American 'butter' or 'water'.",
      "एकल R = एक तेज़ tap। अमेरिकी 'butter' या 'water' जैसी ध्वनि।",
    ],
    [
      "Smile slightly and keep the tongue high.",
      "हल्की मुस्कान रखें और जीभ ऊंची रखें।",
    ],
    [
      "Smile wide and raise your tongue high. This is closer to Spanish 'i'.",
      "चौड़ी मुस्कान रखें और जीभ को ऊंचा उठाएं। यह स्पेनिश 'i' के करीब है।",
    ],
    [
      "Softer than English 'ch'. Tongue touches palate lightly.",
      "अंग्रेज़ी 'ch' से मुलायम। जीभ तालु को हल्के से छूती है।",
    ],
    [
      "Sounds like U, not O! Same as Polish U.",
      "यह O नहीं, U जैसी सुनाई देती है! पोलिश U जैसी ही ध्वनि।",
    ],
    [
      "Spanish A never changes sound. Keep it open and consistent.",
      "स्पेनिश A अपनी ध्वनि नहीं बदलती। इसे खुला और स्थिर रखें।",
    ],
    [
      "Spanish E is always the same sound, never silent. Purer than English E.",
      "स्पेनिश E हमेशा एक ही ध्वनि देती है, कभी मूक नहीं होती। अंग्रेज़ी E से अधिक शुद्ध।",
    ],
    [
      "Spanish uses ¡ at the start and ! at the end of exclamations.",
      "स्पेनिश में विस्मयादिबोधक वाक्य के शुरू में ¡ और अंत में ! लगाया जाता है।",
    ],
    [
      "Spanish uses ¿ at the start and ? at the end of questions.",
      "स्पेनिश में प्रश्नवाचक वाक्य के शुरू में ¿ और अंत में ? लगाया जाता है।",
    ],
    [
      "Standard D sound, tongue touches behind upper teeth.",
      "मानक D ध्वनि; जीभ ऊपर के दांतों के पीछे लगती है।",
    ],
    [
      "Standard German R is uvular (French-like). After vowels often becomes 'uh'.",
      "मानक जर्मन R यूवुलर (फ़्रेंच जैसी) होती है। स्वरों के बाद यह अक्सर 'uh' जैसी सुनाई देती है।",
    ],
    ["Standard S sound, always voiceless.", "मानक S ध्वनि, हमेशा अव्यंजित।"],
    [
      "Standard T sound, tongue touches teeth.",
      "मानक T ध्वनि; जीभ दांतों को छूती है।",
    ],
    [
      "Start with lips rounded like saying 'oo', then open quickly. Not like V!",
      "होंठों को 'oo' कहने जैसा गोल रखकर शुरू करें, फिर जल्दी से खोलें। यह V जैसी नहीं है!",
    ],
    [
      "Start with mouth open, round lips at the end. Say 'ah-oo' quickly.",
      "मुंह खोलकर शुरू करें, अंत में होंठ गोल करें। 'ah-oo' जल्दी से बोलें।",
    ],
    [
      "Start with mouth open, then glide to a smile. Two sounds in one!",
      "मुंह खोलकर शुरू करें, फिर मुस्कान की ओर फिसलें। एक में दो ध्वनियां!",
    ],
    [
      "Start with mouth wide open, end with a smile. Say 'ah-ee' quickly.",
      "मुंह खूब खोलकर शुरू करें, अंत में मुस्कान पर खत्म करें। 'ah-ee' जल्दी से बोलें।",
    ],
    [
      "Stressed A is open. Unstressed A in Brazil often sounds like 'uh'.",
      "ज़ोर वाली A खुली होती है। ब्राज़ील में बिना-ज़ोर वाली A अक्सर 'uh' जैसी सुनाई देती है।",
    ],
    [
      "Stronger than English H. Friction from the back of throat.",
      "यह अंग्रेज़ी H से मजबूत है। घर्षण गले के पीछे से आता है।",
    ],
    [
      "THE Dutch sound! Like German 'ch' in 'Bach' but voiced. Practice gargling!",
      "यह डच की खास ध्वनि है! जर्मन 'Bach' के 'ch' जैसी, लेकिन स्वरयुक्त। गरारा करने जैसा अभ्यास करें!",
    ],
    [
      "Tap the tongue just behind the teeth for a clean sound.",
      "साफ़ ध्वनि के लिए जीभ को दांतों के ठीक पीछे हल्के से थपथपाएं।",
    ],
    ["Tap the tongue lightly.", "जीभ को हल्के से थपथपाएं।"],
    [
      "The fada (accent) always lengthens the vowel. Á sounds like 'aw'.",
      "fada (accent) हमेशा स्वर को लंबा करता है। Á 'aw' जैसी सुनाई देती है।",
    ],
    [
      "The fada lengthens E to an 'ay' sound.",
      "fada, E को लंबी 'ay' ध्वनि बना देता है।",
    ],
    [
      "The fada lengthens O to a long 'oh' sound.",
      "fada, O को लंबी 'oh' ध्वनि बना देता है।",
    ],
    [
      "The fada lengthens U to a long 'oo' sound.",
      "fada, U को लंबी 'oo' ध्वनि बना देता है।",
    ],
    [
      "The fada makes it a long 'ee' sound.",
      "fada इसे लंबी 'ee' ध्वनि बना देता है।",
    ],
    [
      "The most common greeting. Literally 'God to you'. Response: 'Dia is Muire duit'.",
      "यह सबसे सामान्य अभिवादन है। इसका शाब्दिक अर्थ है 'ईश्वर तुम्हारे साथ'। उत्तर: 'Dia is Muire duit'।",
    ],
    [
      "The most common sound in English! Completely relax mouth. Appears in unstressed syllables.",
      "यह अंग्रेज़ी की सबसे सामान्य ध्वनि है! मुंह को पूरी तरह ढीला रखें। यह बिना-ज़ोर वाले अक्षरों में आती है।",
    ],
    [
      "The most complex French letter! Often silent at end of words.",
      "यह फ़्रेंच का सबसे जटिल अक्षर है! शब्दों के अंत में यह अक्सर मूक होता है।",
    ],
    [
      "Think of the pause in the middle of 'uh-oh'.",
      "'uh-oh' के बीच वाले छोटे विराम के बारे में सोचें।",
    ],
    [
      "This is the Dutch way to write the 'oo' sound!",
      "यह डच में 'oo' ध्वनि लिखने का तरीका है!",
    ],
    [
      "This is the sound Spanish speakers expect from 'U'. French U is different!",
      "यह वही ध्वनि है जिसकी अपेक्षा स्पेनिश बोलने वाले U से करते हैं। फ़्रेंच U अलग होती है!",
    ],
    [
      "Three sounds: open É (bed), closed Ê (day without diphthong), final E often like 'ee'.",
      "तीन ध्वनियां होती हैं: खुली É ('bed' जैसी), बंद Ê ('day' जैसी लेकिन बिना द्विस्वर के), और अंतिम E अक्सर 'ee' जैसी।",
    ],
    [
      "Three sounds: open Ó (law), closed Ô (go), unstressed often like 'oo'.",
      "तीन ध्वनियां होती हैं: खुली Ó ('law' जैसी), बंद Ô ('go' जैसी), और बिना-ज़ोर की ध्वनि अक्सर 'oo' जैसी।",
    ],
    ["Tongue just behind the teeth.", "जीभ दांतों के ठीक पीछे रखें।"],
    [
      "Tongue touches back of upper teeth (dental). No puff of air.",
      "जीभ ऊपर के दांतों के पीछे लगती है (दंतीय ध्वनि)। हवा का तेज़ झोंका नहीं निकलता।",
    ],
    [
      "Tongue touches ridge behind teeth.",
      "जीभ दांतों के पीछे वाले ridge को छूती है।",
    ],
    [
      "Tongue touches upper teeth; softer than English.",
      "जीभ ऊपर के दांतों को छूती है; यह अंग्रेज़ी से मुलायम ध्वनि है।",
    ],
    [
      "Tongue vibrates multiple times against the ridge. Practice: 'butter-butter-butter' fast!",
      "जीभ ridge से कई बार टकराकर कंपन करती है। अभ्यास करें: 'butter-butter-butter' जल्दी-जल्दी कहें!",
    ],
    [
      "Touch just behind the teeth; less air than English 't'.",
      "दांतों के ठीक पीछे स्पर्श करें; अंग्रेज़ी 't' से कम हवा निकलती है।",
    ],
    [
      "Touch the tongue tip to the ridge behind the teeth; keep it light.",
      "जीभ का सिरा दांतों के पीछे वाले ridge से हल्के से लगाएं; इसे हल्का रखें।",
    ],
    [
      "Touch the tongue tip to the teeth or ridge.",
      "जीभ का सिरा दांतों या ridge से लगाएं।",
    ],
    [
      "Traditionally distinct from IN, now often sounds the same.",
      "परंपरागत रूप से यह IN से अलग माना जाता था, लेकिन अब अक्सर एक जैसी सुनाई देती है।",
    ],
    [
      "Trema shows E is separate syllable: 'geëerd' = ge-eerd (honored).",
      "trema दिखाता है कि E को अलग बोला जाता है: 'geëerd' = ge-eerd।",
    ],
    [
      "Two sounds: open E (bed) and closed E (say without diphthong). Regional variation.",
      "दो ध्वनियां होती हैं: खुली E ('bed' जैसी) और बंद E ('say' जैसी लेकिन बिना द्विस्वर के)। क्षेत्रीय अंतर हो सकता है।",
    ],
    [
      "Two sounds: open O and closed O. Regional variation exists.",
      "दो ध्वनियां होती हैं: खुली O और बंद O। क्षेत्रीय भिन्नता मौजूद है।",
    ],
    [
      "Unique Russian sound—pull the tongue back; don't let it become 'ee'.",
      "यह रूसी की खास ध्वनि है — जीभ को पीछे खींचें; इसे 'ee' न बनने दें।",
    ],
    [
      "Unique to Spanish! Middle of tongue touches roof of mouth. Like 'ny' together.",
      "यह स्पेनिश की खास ध्वनि है! जीभ का मध्य भाग तालु को छूता है। 'ny' जैसी।",
    ],
    [
      "Unlike English, pronounce the K! 'Knie' = 'K-nee' (knee).",
      "अंग्रेज़ी के विपरीत, यहाँ K का उच्चारण करें! 'Knie' = 'K-nee' (knee)।",
    ],
    [
      "Unlike Spanish, B and V are distinct sounds in Portuguese.",
      "स्पेनिश के विपरीत, पुर्तगाली में B और V अलग ध्वनियां हैं।",
    ],
    [
      "Unlike Spanish/Italian R, never tap or trill. Tongue floats in the middle of mouth.",
      "स्पेनिश/इतालवी R के विपरीत, इसे tap या trill न करें। जीभ मुंह के बीच में ढीली रहती है।",
    ],
    [
      "Unlike Е, it doesn't add a 'y' glide and doesn't soften consonants.",
      "Е के विपरीत, यह 'y' glide नहीं जोड़ती और व्यंजनों को मुलायम नहीं करती।",
    ],
    [
      "Unstressed E at end often sounds like schwa (uh): 'Katze' = 'Katz-uh'.",
      "अंत में बिना-ज़ोर वाली E अक्सर schwa ('uh') जैसी सुनाई देती है: 'Katze' = 'Katz-uh'।",
    ],
    [
      "Used as a toast. Literally means 'health'.",
      "इसे toast/cheers के रूप में इस्तेमाल किया जाता है। शाब्दिक अर्थ है 'स्वास्थ्य'।",
    ],
    [
      "Used to mark stress or distinguish words: 'el' (the) vs 'él' (he).",
      "यह ज़ोर दिखाने या शब्दों में अंतर करने के लिए उपयोग होती है: 'el' बनाम 'él'।",
    ],
    [
      "Used with some animates: sitlal- + -in → sitlatin.",
      "कुछ सजीव संज्ञाओं के साथ इसका उपयोग होता है: sitlal- + -in → sitlatin।",
    ],
    [
      "Voiced like English Z. In Belgium often sounds like S.",
      "अंग्रेज़ी Z की तरह स्वरयुक्त। बेल्जियम में यह अक्सर S जैसी सुनाई देती है।",
    ],
    [
      "Ä is A with two dots (Umlaut). Sounds like E! 'Männer' = men.",
      "Ä, A पर दो बिंदुओं (umlaut) वाला रूप है। यह E जैसी सुनाई देती है! 'Männer' = men।",
    ],
    [
      "Like 'u' in 'cup', 'but', 'fun' - relaxed central vowel",
      "'cup', 'but', 'fun' के 'u' जैसी ढीली केंद्रीय स्वर ध्वनि",
    ],
    [
      "Round lips throughout, but they get tighter at the end.",
      "पूरी ध्वनि के दौरान होंठ गोल रखें, लेकिन अंत में वे और कस जाते हैं।",
    ],
    [
      "Start with rounded lips, end with a smile.",
      "शुरुआत होंठ गोल रखकर करें और अंत हल्की मुस्कान के साथ करें।",
    ],
    [
      "Round lips slightly, tongue behind the ridge. Like telling someone to be quiet: 'shhh!'",
      "होंठ थोड़े गोल करें और जीभ को दांतों के पीछे वाले उभरे हिस्से के पीछे रखें। जैसे किसी को चुप कराते हुए 'shhh!' कहते हैं।",
    ],
    [
      "It's T + SH combined quickly. Tongue starts at the ridge, then pulls back.",
      "यह T + SH को जल्दी से मिलाकर बनती है। जीभ दांतों के पीछे वाले उभरे हिस्से से शुरू होकर पीछे खिंचती है।",
    ],
    [
      "Same as SH but with voice. Rare in English, usually spelled with S or G.",
      "यह SH जैसी ही ध्वनि है, लेकिन आवाज़ के साथ। अंग्रेज़ी में यह दुर्लभ है और आमतौर पर S या G से लिखी जाती है।",
    ],
    [
      "Like 'l' at end of 'ball', 'full', 'milk' - back of tongue raised",
      "'ball', 'full', 'milk' के अंत वाले 'l' जैसी — जीभ का पिछला हिस्सा उठा रहता है।",
    ],
    [
      "Like 'l' at start of 'love', 'let', 'light' - tongue tip touches ridge",
      "'love', 'let', 'light' की शुरुआत वाले 'l' जैसी — जीभ का सिरा दांतों के पीछे वाले उभरे हिस्से को छूता है।",
    ],
    [
      "English has many silent letters from historical spelling. K in 'knee', W in 'write', B in 'doubt'.",
      "ऐतिहासिक वर्तनी की वजह से अंग्रेज़ी में कई मूक अक्षर हैं। 'knee' में K, 'write' में W, और 'doubt' में B।",
    ],
    [
      "Like 'b' in 'boy', but softer between vowels",
      "'boy' के 'b' जैसी, लेकिन स्वरों के बीच नरम।",
    ],
    [
      "Same as English N. Tongue touches ridge behind upper teeth.",
      "अंग्रेज़ी N जैसी ध्वनि। जीभ ऊपर के दांतों के पीछे वाले उभरे हिस्से को छूती है।",
    ],
    [
      "Like 'ks' or 's' or 'h' depending on word",
      "शब्द के अनुसार 'ks', 's' या 'h' जैसी ध्वनि।",
    ],
    [
      "Less common, but used in words like 'menú', 'Perú'.",
      "यह कम आम है, लेकिन 'menú' और 'Perú' जैसे शब्दों में उपयोग होती है।",
    ],
    [
      "No sound - marks beginning of question",
      "इसकी कोई ध्वनि नहीं होती — यह प्रश्न की शुरुआत दिखाता है।",
    ],
    [
      "No sound - marks beginning of exclamation",
      "इसकी कोई ध्वनि नहीं होती — यह विस्मयादिबोधक वाक्य की शुरुआत दिखाता है।",
    ],
    [
      "Like 'a' in 'father' when stressed; reduced when unstressed",
      "ज़ोर होने पर 'father' के 'a' जैसी; बिना ज़ोर के ध्वनि घटी हुई हो जाती है।",
    ],
    [
      "Pure sound like Spanish I. Consistent throughout.",
      "स्पेनिश I जैसी शुद्ध ध्वनि। पूरी तरह एकसमान रहती है।",
    ],
    [
      "Varies: 'h' sound at start/after consonant; tap between vowels",
      "स्थिति के अनुसार बदलती है: शुरुआत में या व्यंजन के बाद 'h' जैसी; स्वरों के बीच tap जैसी।",
    ],
    [
      "In Brazil: often like 'h'. In Portugal: guttural. NOT a trill like Spanish!",
      "ब्राज़ील में यह अक्सर 'h' जैसी सुनाई देती है। पुर्तगाल में यह कंठ्य होती है। यह स्पेनिश की तरह trill नहीं है!",
    ],
    [
      "Like 's' at start; like 'z' between vowels; like 'sh' in Rio",
      "शुरुआत में 's' जैसी, स्वरों के बीच 'z' जैसी, और रियो में 'sh' जैसी।",
    ],
    [
      "Between vowels S = 'z' sound. In Rio/Portugal end of word S = 'sh'.",
      "स्वरों के बीच S = 'z' ध्वनि। रियो/पुर्तगाल में शब्द के अंत पर S = 'sh'।",
    ],
    [
      "Pure sound like Spanish U. Consistent.",
      "स्पेनिश U जैसी शुद्ध ध्वनि। हमेशा एकसमान।",
    ],
    [
      "Can be 'sh', 'ks', 'z', or 's' depending on word",
      "शब्द के अनुसार 'sh', 'ks', 'z' या 's' जैसी ध्वनि हो सकती है।",
    ],
    [
      "Most common: 'sh' (xícara). Also 'ks' (táxi), 'z' (exame), 's' (próximo).",
      "सबसे आम ध्वनि 'sh' है (xícara)। इसके अलावा 'ks' (táxi), 'z' (exame), और 's' (próximo) भी हो सकती है।",
    ],
    [
      "Like 'z' in 'zoo'; like 'sh' at end of word in Rio",
      "'zoo' के 'z' जैसी; रियो में शब्द के अंत पर 'sh' जैसी।",
    ],
    [
      "Nasal 'a' - like 'ung' in 'sung' but with 'a' sound",
      "नासिक्य 'a' — 'sung' के 'ung' जैसी, लेकिन 'a' की ध्वनि के साथ।",
    ],
    [
      "Nasal 'o' - like 'own' but with nasality",
      "नासिक्य 'o' — 'own' जैसी, लेकिन नासिक्य गूंज के साथ।",
    ],
    ["Stressed 'i' like 'ee' in 'see'", "ज़ोर वाली 'i', 'see' के 'ee' जैसी।"],
    ["Stressed 'u' like 'oo' in 'moon'", "ज़ोर वाली 'u', 'moon' के 'oo' जैसी।"],
    ["Like 'a' in 'father' but shorter", "'father' के 'a' जैसी, लेकिन छोटी।"],
    [
      "Unstressed: often silent or 'uh'; stressed: 'eh'",
      "बिना ज़ोर के यह अक्सर मूक या 'uh' जैसी होती है; ज़ोर होने पर 'eh' जैसी।",
    ],
    [
      "Like 'ay' in 'say' but shorter, no diphthong",
      "'say' के 'ay' जैसी, लेकिन छोटी और बिना द्विस्वर के।",
    ],
    ["Pure sound, like Spanish I.", "स्पेनिश I जैसी शुद्ध ध्वनि।"],
    [
      "Like 's' at start; like 'z' between vowels",
      "शुरुआत में 's' जैसी, स्वरों के बीच 'z' जैसी।",
    ],
    [
      "Dental T. Often silent at end of words: 'petit' = 'puh-tee'.",
      "दंतीय T ध्वनि। शब्दों के अंत में यह अक्सर मूक होती है: 'petit' = 'puh-tee'।",
    ],
    [
      "Like 'v' or 'w' depending on word origin",
      "शब्द की उत्पत्ति के अनुसार 'v' या 'w' जैसी ध्वनि।",
    ],
    [
      "'ks', 'gz', 's', or 'z' depending on word",
      "शब्द के अनुसार 'ks', 'gz', 's' या 'z' जैसी ध्वनि।",
    ],
    [
      "Usually 'ks'. In 'examen' = 'gz'. At word end often silent.",
      "आमतौर पर 'ks'। 'examen' में 'gz'। शब्द के अंत में यह अक्सर मूक होती है।",
    ],
    [
      "Voiced like English Z. Often silent at end of words.",
      "अंग्रेज़ी Z जैसी स्वरयुक्त ध्वनि। शब्दों के अंत में यह अक्सर मूक होती है।",
    ],
    [
      "Traditionally longer/deeper A. Modern French: often same as A.",
      "परंपरागत रूप से यह लंबी/गहरी A थी। आधुनिक फ़्रेंच में यह अक्सर सामान्य A जैसी सुनाई देती है।",
    ],
    [
      "Silent! But changes C, G, SC sounds: 'che' = 'ke', 'ghe' = 'ge'.",
      "यह मूक है, लेकिन C, G, SC की ध्वनियां बदल देती है: 'che' = 'ke', 'ghe' = 'ge'।",
    ],
    [
      "Like 's' (unvoiced) or 'z' (voiced) depending on position",
      "स्थिति के अनुसार 's' (अव्यंजित) या 'z' (स्वरयुक्त) जैसी ध्वनि।",
    ],
    ["Stressed I, like 'ee' in 'see'", "ज़ोर वाली I, 'see' के 'ee' जैसी।"],
    [
      "Open O at end of words. 'Però' (but/however).",
      "शब्दों के अंत में खुली O ध्वनि। उदाहरण: 'Però'।",
    ],
    ["Stressed U, like 'oo' in 'moon'", "ज़ोर वाली U, 'moon' के 'oo' जैसी।"],
    [
      "Only at end of words. 'Più' (more), 'gioventù' (youth).",
      "यह केवल शब्दों के अंत में आती है। उदाहरण: 'Più', 'gioventù'।",
    ],
    [
      "Like 'b' in 'boy'; at end of word sounds like 'p'",
      "'boy' के 'b' जैसी; शब्द के अंत में 'p' जैसी सुनाई देती है।",
    ],
    [
      "Like 'd' in 'dog'; at end of word sounds like 't'",
      "'dog' के 'd' जैसी; शब्द के अंत में 't' जैसी सुनाई देती है।",
    ],
    [
      "Short: like 'e' in 'bed'; Long (ee): like 'ay' without glide",
      "छोटी ध्वनि: 'bed' के 'e' जैसी; लंबी (ee): 'ay' जैसी, बिना अतिरिक्त फिसलन के।",
    ],
    [
      "Unstressed E often becomes schwa (uh). Very common!",
      "बिना ज़ोर वाली E अक्सर schwa ('uh') बन जाती है। यह बहुत आम है!",
    ],
    [
      "Short: like 'o' in 'pot'; Long (oo): like 'oh' but pure",
      "छोटी ध्वनि: 'pot' के 'o' जैसी; लंबी (oo): 'oh' जैसी, लेकिन शुद्ध।",
    ],
    [
      "Like 'v' in 'very' but with rounded lips",
      "'very' के 'v' जैसी, लेकिन होंठ गोल करके।",
    ],
    [
      "Unique Dutch diphthong - 'ow' with rounded lips",
      "डच की खास द्विस्वर ध्वनि — होंठ गोल करके बोले जाने वाली 'ow'।",
    ],
    [
      "Start with 'ah', move to rounded 'u'. No English equivalent! 'Huis' = house.",
      "'ah' से शुरू करें और गोल 'u' पर जाएं। अंग्रेज़ी में इसका सीधा समकक्ष नहीं है! 'Huis' = घर।",
    ],
    [
      "Say 'ay' but round your lips. Like French 'eu'.",
      "'ay' कहें, लेकिन होंठ गोल रखें। फ़्रेंच 'eu' जैसी।",
    ],
    [
      "Alone, C is rare in German. Usually part of CH, CK, or in foreign words.",
      "अकेला C जर्मन में दुर्लभ है। यह आमतौर पर CH, CK का हिस्सा होता है या विदेशी शब्दों में आता है।",
    ],
    [
      "Like 'g' in 'go'; at end often like 'k' or 'ch'",
      "'go' के 'g' जैसी; शब्द के अंत में यह अक्सर 'k' या 'ch' जैसी हो जाती है।",
    ],
    [
      "Like 'h' in 'hello' at start; silent after vowels (lengthens them)",
      "शुरुआत में 'hello' के 'h' जैसी; स्वरों के बाद मूक रहती है और उन्हें लंबा करती है।",
    ],
    [
      "Long I often spelled IE: 'Liebe' (love).",
      "लंबी I ध्वनि अक्सर IE से लिखी जाती है: 'Liebe' (प्रेम)।",
    ],
    [
      "Same as English K, but unaspirated.",
      "अंग्रेज़ी K जैसी, लेकिन बिना aspiration के।",
    ],
    [
      "Short: like 'o' in 'pot'; Long: like 'oh' but pure",
      "छोटी ध्वनि: 'pot' के 'o' जैसी; लंबी ध्वनि: 'oh' जैसी, लेकिन शुद्ध।",
    ],
    [
      "Long O has no diphthong—keep it pure, unlike English 'go'.",
      "लंबी O में द्विस्वर नहीं होता — इसे शुद्ध रखें, अंग्रेज़ी 'go' की तरह नहीं।",
    ],
    [
      "Like 'z' before vowels; like 's' at end or before consonants",
      "स्वरों से पहले 'z' जैसी; शब्द के अंत में या व्यंजन से पहले 's' जैसी।",
    ],
    [
      "V in German words = F sound! 'Vater' = 'Fater'. Foreign words keep V sound.",
      "जर्मन शब्दों में V = F ध्वनि! 'Vater' = 'Fater'। विदेशी शब्दों में V की ध्वनि बनी रहती है।",
    ],
    [
      "Like 'e' but with rounded lips - French EU",
      "'e' जैसी, लेकिन होंठ गोल करके — फ़्रेंच EU जैसी।",
    ],
    [
      "Say 'ay' but round your lips! No English equivalent. Like French 'deux'.",
      "'ay' कहें, लेकिन होंठ गोल रखें! अंग्रेज़ी में इसका सीधा समकक्ष नहीं है। फ़्रेंच 'deux' जैसी।",
    ],
    [
      "Like 'ee' but with rounded lips - French U",
      "'ee' जैसी, लेकिन होंठ गोल करके — फ़्रेंच U जैसी।",
    ],
    [
      "Say 'ee' but round your lips tightly! Like French 'tu'.",
      "'ee' कहें, लेकिन होंठ कसकर गोल रखें! फ़्रेंच 'tu' जैसी।",
    ],
    [
      "ß = 'ss' but after long vowels. 'Straße' has long A, 'Masse' has short A.",
      "ß = 'ss', लेकिन यह लंबे स्वरों के बाद आता है। 'Straße' में लंबी A है, जबकि 'Masse' में छोटी A।",
    ],
    [
      "At word start: SP = 'shp', ST = 'sht'. 'Sprechen' = 'Shprekhen', 'Stein' = 'Shtain'.",
      "शब्द की शुरुआत में SP = 'shp' और ST = 'sht'। 'Sprechen' = 'Shprekhen', 'Stein' = 'Shtain'।",
    ],
    [
      "Lips stay relaxed; sometimes whispered between consonants.",
      "होंठ ढीले रखें; कभी-कभी व्यंजनों के बीच यह फुसफुसाहट जैसी सुनाई देती है।",
    ],
    [
      "A clean mid-vowel; don't add a glide.",
      "यह साफ़ मध्य स्वर ध्वनि है; इसमें अतिरिक्त glide न जोड़ें।",
    ],
    ["Like 'o' in 'organ'", "'organ' के 'o' जैसी ध्वनि।"],
    [
      "Rounded but short—avoid diphthonging to 'oh-oo'.",
      "होंठ गोल रखें, लेकिन ध्वनि छोटी रखें — इसे 'oh-oo' जैसा द्विस्वर न बनने दें।",
    ],
    [
      "'ka' with light, unaspirated k",
      "'ka' — हल्की, बिना aspiration वाली k के साथ।",
    ],
    [
      "'ha' (sometimes read 'wa' as a particle)",
      "'ha' (particle के रूप में कभी-कभी 'wa' पढ़ा जाता है)।",
    ],
    [
      "Light nasal; pairs with ま/も to practice length control.",
      "हल्की नासिक्य ध्वनि; ま/も के साथ अभ्यास करने से लंबाई का नियंत्रण सीखने में मदद मिलती है।",
    ],
    ["Like 'a' in 'car', stressed", "ज़ोर होने पर 'car' के 'a' जैसी।"],
    [
      "After a consonant, it softens it slightly: 'me' → 'meh' with a glide.",
      "व्यंजन के बाद यह उसे थोड़ा मुलायम करती है: 'me' → 'meh' जैसी हल्की glide के साथ।",
    ],
    [
      "Often appears at the end of diphthongs: 'ой', 'ай', 'ей'.",
      "यह अक्सर द्विस्वर के अंत में आती है: 'ой', 'ай', 'ей'।",
    ],
    [
      "Touch the tongue tip to the ridge behind the teeth; keep it light.",
      "जीभ का सिरा दांतों के पीछे वाले उभरे हिस्से से हल्के से लगाएं; स्पर्श हल्का रखें।",
    ],
    [
      "Place tongue at the ridge behind teeth; pairs with soft vowels to lighten it.",
      "जीभ को दांतों के पीछे वाले उभरे हिस्से पर रखें; मुलायम स्वरों के साथ यह और हल्की हो जाती है।",
    ],
    [
      "Like 'o' in 'more' when stressed; like 'a' in 'car' when unstressed",
      "ज़ोर होने पर 'more' के 'o' जैसी, और बिना ज़ोर के 'car' के 'a' जैसी।",
    ],
    [
      "Russian O reduces in unstressed positions—listen for this shift early.",
      "बिना ज़ोर की स्थिति में रूसी O छोटी या बदली हुई सुनाई देती है — इस बदलाव को शुरू से सुनना सीखें।",
    ],
    [
      "A quick 'ts' burst; avoid turning it into 'tsss'.",
      "तेज़ 'ts' जैसी फटती ध्वनि; इसे 'tsss' में न बदलें।",
    ],
    [
      "Unlike Е, it doesn't add a 'y' glide and doesn't soften consonants.",
      "Е के विपरीत, यह 'y' जैसी फिसलन नहीं जोड़ती और व्यंजनों को मुलायम नहीं करती।",
    ],
    [
      "Think of it as a softness marker; changes pronunciation but not a vowel.",
      "इसे मुलायमपन बताने वाले चिह्न की तरह समझें; यह उच्चारण बदलता है, स्वर नहीं है।",
    ],
    ["Soft, clean N.", "मुलायम और साफ़ N ध्वनि।"],
    ["Like 'o' in 'more'", "'more' के 'o' जैसी ध्वनि।"],
    [
      "Soft 'ch' - like 'ch' in 'cheese' but softer",
      "मुलायम 'ch' ध्वनि — 'cheese' के 'ch' जैसी, लेकिन और नरम।",
    ],
    [
      "Clear L sound, tongue touches upper teeth ridge.",
      "साफ़ L ध्वनि; जीभ ऊपर के दांतों के पीछे वाले उभरे हिस्से को छूती है।",
    ],
    [
      "Voiced version of ś. Like 'zh' but softer.",
      "यह ś का स्वरयुक्त रूप है। 'zh' जैसी, लेकिन और नरम।",
    ],
    [
      "Short A is common. Can be broad (back) or slender (front) depending on context.",
      "छोटी A बहुत आम है। संदर्भ के अनुसार यह broad (पीछे) या slender (सामने) हो सकती है।",
    ],
    [
      "Like 'b' in 'boy', but 'v' when lenited (bh)",
      "'boy' के 'b' जैसी, लेकिन lenited (bh) होने पर 'v' जैसी।",
    ],
    ["Pure sound; never silent.", "शुद्ध ध्वनि; कभी मूक नहीं।"],
    ["Like 'ee' in 'see' (short, pure)", "'see' के 'ee' जैसी (छोटी और शुद्ध)।"],
    [
      "Breathy 'h' (like Spanish ‘j’ but lighter)",
      "सांसभरी 'h' ध्वनि (स्पेनिश ‘j’ जैसी, लेकिन हल्की)।",
    ],
    [
      "Tongue touches ridge behind teeth.",
      "जीभ दांतों के पीछे वाले उभरे हिस्से को छूती है।",
    ],
    [
      "Iconic sound; some communities write final -t, but you’ll hear TL.",
      "यह बहुत पहचान वाली ध्वनि है; कुछ समुदाय अंतिम -t लिखते हैं, लेकिन सुनने में TL आता है।",
    ],
    [
      "Common absolutive after vowels: a- + -t → at.",
      "स्वरों के बाद आने वाला सामान्य absolutive: a- + -t → at।",
    ],
    [
      "Like 'o' in 'go' but without a glide",
      "'go' के 'o' जैसी, लेकिन बिना glide के।",
    ],
    [
      "Touch the tongue tip to the teeth or ridge.",
      "जीभ का सिरा दांतों या उनके पीछे वाले उभरे हिस्से से लगाएं।",
    ],
    [
      "Air flows through a narrow channel then releases.",
      "हवा पहले एक संकरे रास्ते से गुजरती है, फिर खुलकर निकलती है।",
    ],
    [
      "Unlike Spanish/Italian R, never tap or trill. Tongue floats in the middle of mouth.",
      "स्पेनिश/इतालवी R के विपरीत, इसे हल्की थपकी या कंपित ध्वनि की तरह न बोलें। जीभ मुंह के बीच में ढीली रहती है।",
    ],
    [
      "Like 'i' in 'bit', 'sit', 'fish' - relaxed, short",
      "'bit', 'sit', 'fish' के 'i' जैसी ढीली और छोटी ध्वनि।",
    ],
    [
      "Like 'oo' in 'book', 'put', 'good' - relaxed rounded",
      "'book', 'put', 'good' के 'oo' जैसी ढीली, गोल ध्वनि।",
    ],
    [
      "Single tap of tongue (like 't' in American 'butter')",
      "जीभ का एक हल्का थपका, अमेरिकी 'butter' के 't' जैसी ध्वनि।",
    ],
    [
      "Single R = one quick tap. Like American 'butter' or 'water'.",
      "एकल R में जीभ का एक तेज़ हल्का थपका होता है। यह अमेरिकी 'butter' या 'water' जैसी सुनाई देती है।",
    ],
    [
      "Tongue vibrates multiple times against the ridge. Practice: 'butter-butter-butter' fast!",
      "जीभ दांतों के पीछे वाले उभरे हिस्से से कई बार टकराकर कंपन करती है। अभ्यास के लिए 'butter-butter-butter' जल्दी-जल्दी कहें!",
    ],
    [
      "Initial R or RR = 'h' sound (like English H). Between vowels = tap like Spanish.",
      "शुरुआती R या RR = 'h' ध्वनि (अंग्रेज़ी H जैसी)। स्वरों के बीच यह स्पेनिश जैसी हल्की थपकी वाली ध्वनि देती है।",
    ],
    ["Pure sound like Spanish I.", "स्पेनिश I जैसी शुद्ध ध्वनि।"],
    ["Pure sound like Spanish U.", "स्पेनिश U जैसी शुद्ध ध्वनि।"],
    [
      "Closed E at end of words. 'Perché' (why/because) has closed E.",
      "शब्दों के अंत में बंद E ध्वनि। 'Perché' में बंद E है।",
    ],
    [
      "Short I is very short. Long I is spelled 'ie'.",
      "छोटी I बहुत छोटी होती है। लंबी I अक्सर 'ie' से लिखी जाती है।",
    ],
    [
      "A clean mid-vowel; don't add a glide.",
      "यह साफ़ मध्य स्वर ध्वनि है; इसमें अतिरिक्त फिसलन वाली ध्वनि न जोड़ें।",
    ],
    [
      "'ha' (sometimes read 'wa' as a particle)",
      "'ha' (व्याकरणिक कण के रूप में कभी-कभी 'wa' पढ़ा जाता है)।",
    ],
    [
      "Remember the particle exception: は is pronounced 'wa' in grammar.",
      "कण वाले इस अपवाद को याद रखें: व्याकरण में は का उच्चारण 'wa' होता है।",
    ],
    ["Single-tap 'ra/la'", "एक हल्की थपकी वाली 'ra/la' ध्वनि।"],
    [
      "One of the few remaining W-syllables; also a topic particle as 'は'.",
      "यह बचे हुए कुछ W-स्वरांशों में से एक है; विषय-सूचक कण के रूप में 'は' भी 'wa' पढ़ा जाता है।",
    ],
    [
      "After a consonant, it softens it slightly: 'me' → 'meh' with a glide.",
      "व्यंजन के बाद यह उसे थोड़ा मुलायम करती है: 'me' → 'meh' जैसी हल्की फिसलन के साथ।",
    ],
    [
      "Less air than English 'p'; think of a softer tap.",
      "अंग्रेज़ी 'p' से कम हवा निकलती है; इसे और हल्की थपकी जैसी ध्वनि समझें।",
    ],
    [
      "Short A is common. Can be broad (back) or slender (front) depending on context.",
      "छोटी A बहुत आम है। संदर्भ के अनुसार यह पीछे वाली या आगे वाली ध्वनि हो सकती है।",
    ],
    [
      "Like 'b' in 'boy', but 'v' when lenited (bh)",
      "'boy' के 'b' जैसी, लेकिन मुलायम bh रूप में 'v' जैसी।",
    ],
    [
      "Like 'd' in 'dog', or 'j' sound when slender",
      "'dog' के 'd' जैसी, या आगे वाली ध्वनि में 'j' जैसी।",
    ],
    [
      "Broad D is like English. Slender D (before e, i) has a 'j' quality.",
      "पीछे वाली D अंग्रेज़ी जैसी होती है। आगे वाली D (e, i से पहले) में 'j' जैसी गुणवत्ता आती है।",
    ],
    [
      "Standard F sound. When lenited (fh), it's silent!",
      "सामान्य F ध्वनि। मुलायम fh रूप में यह मूक हो जाती है!",
    ],
    [
      "Short I. A slender vowel that affects surrounding consonants.",
      "छोटी I। यह आगे वाली स्वर ध्वनि है, जो आसपास के व्यंजनों को प्रभावित करती है।",
    ],
    [
      "Like 'l' in 'love', or palatalized when slender",
      "'love' के 'l' जैसी, या आगे वाली ध्वनि में तालव्य।",
    ],
    [
      "Broad L is like English. Slender L is lighter, tongue higher.",
      "पीछे वाली L अंग्रेज़ी जैसी होती है। आगे वाली L हल्की होती है और जीभ अधिक ऊपर रहती है।",
    ],
    [
      "Broad N is standard. Slender N is lighter, almost like 'ny'.",
      "पीछे वाली N सामान्य है। आगे वाली N हल्की होती है, लगभग 'ny' जैसी।",
    ],
    [
      "Short O. A broad vowel (a, o, u).",
      "छोटी O। यह पीछे वाली स्वर ध्वनि है (a, o, u)।",
    ],
    ["Rolled R, or tap", "लुढ़कती R, या एक हल्की थपकी वाली R।"],
    [
      "Can be rolled or tapped. Slender R is lighter.",
      "यह लुढ़काई जा सकती है या हल्की थपकी जैसी बोली जा सकती है। आगे वाली R अधिक हल्की होती है।",
    ],
    [
      "Like 's' in 'sun', or 'sh' when slender",
      "'sun' के 's' जैसी, या आगे वाली ध्वनि में 'sh' जैसी।",
    ],
    [
      "Broad S is like English S. Slender S (before e, i) sounds like 'sh'!",
      "पीछे वाली S अंग्रेज़ी S जैसी है। आगे वाली S (e, i से पहले) 'sh' जैसी सुनाई देती है!",
    ],
    [
      "Like 't' in 'top', or 'ch' when slender",
      "'top' के 't' जैसी, या आगे वाली ध्वनि में 'ch' जैसी।",
    ],
    [
      "Broad T is standard. Slender T (before e, i) has a 'ch' quality.",
      "पीछे वाली T सामान्य है। आगे वाली T (e, i से पहले) में 'ch' जैसी गुणवत्ता आती है।",
    ],
    ["Short U. A broad vowel.", "छोटी U। यह पीछे वाली स्वर ध्वनि है।"],
    [
      "Common absolutive after vowels: a- + -t → at.",
      "स्वरों के बाद आने वाला सामान्य अंतिम प्रत्यय: a- + -t → at।",
    ],
    [
      "Like 'o' in 'go' but without a glide",
      "'go' के 'o' जैसी, लेकिन बिना अतिरिक्त फिसलन के।",
    ],
    [
      "At the end of syllables, L becomes 'dark'. Back of tongue rises toward soft palate.",
      "अक्षरों के अंत में L गहरी सुनाई देती है। जीभ का पिछला हिस्सा मुलायम तालु की ओर उठता है।",
    ],
    [
      "In American English, T between vowels becomes a quick flap—like Spanish R!",
      "अमेरिकी अंग्रेज़ी में स्वरों के बीच T एक तेज़ हल्की थपकी वाली ध्वनि बन जाती है — स्पेनिश R जैसी।",
    ],
    [
      "Rolled/trilled R - multiple taps of tongue",
      "लुढ़कती / कंपित R — जीभ की कई तेज़ थपकियों के साथ।",
    ],
    [
      "Connect words! 'Les amis' = 'lay-za-mee'. Final S becomes Z.",
      "शब्दों को जोड़कर बोलें! 'Les amis' = 'lay-za-mee'। अंतिम S, Z जैसी हो जाती है।",
    ],
    ["Rolled/trilled R", "लुढ़कती / कंपित R ध्वनि।"],
    [
      "Always trilled! Single R = light trill, RR = strong trill. Like Spanish R.",
      "इसे हमेशा कंपन के साथ बोलें! एकल R = हल्की कंपन, RR = मज़बूत कंपन। स्पेनिश R जैसी।",
    ],
    [
      "Final B becomes P: 'heb' sounds like 'hep'. Called 'final devoicing'.",
      "शब्दांत पर B, P जैसी हो जाती है: 'heb' लगभग 'hep' सुनाई देता है। इसे शब्दांत अव्यंजनिकरण कहा जाता है।",
    ],
    [
      "Final D becomes T: 'goed' sounds like 'goot'.",
      "शब्दांत पर D, T जैसी हो जाती है: 'goed' लगभग 'goot' सुनाई देता है।",
    ],
    [
      "In standard Dutch = V sound. In southern dialects = F sound.",
      "मानक डच में यह V ध्वनि देती है। दक्षिणी बोलियों में यह F जैसी सुनाई देती है।",
    ],
    [
      "Standard: S + guttural G. Belgium/some areas: just S.",
      "मानक रूप में यह S + कंठ्य G जैसी सुनाई देती है। बेल्जियम और कुछ क्षेत्रों में केवल S जैसी।",
    ],
    [
      "Final B becomes P: 'ab' sounds like 'ap'. Called Auslautverhärtung.",
      "शब्दांत पर B, P जैसी हो जाती है: 'ab' लगभग 'ap' सुनाई देता है। इसे Auslautverhärtung कहा जाता है।",
    ],
    [
      "Final D becomes T: 'Hund' sounds like 'Hunt'.",
      "शब्दांत पर D, T जैसी हो जाती है: 'Hund' लगभग 'Hunt' सुनाई देता है।",
    ],
    [
      "Final G: 'k' in most dialects, 'ch' in some northern regions.",
      "अंतिम G अधिकतर बोलियों में 'k' जैसी, और कुछ उत्तरी क्षेत्रों में 'ch' जैसी सुनाई देती है।",
    ],
    ["Rolled/trill 'r'", "लुढ़कती / कंपित 'r' ध्वनि।"],
    [
      "A light trill; practice with quick taps like in Spanish 'pero'.",
      "हल्की कंपित ध्वनि; स्पेनिश 'pero' जैसी तेज़ हल्की जीभ-थपकियों के साथ अभ्यास करें।",
    ],
    ["Rolled or tapped 'r'", "लुढ़कती या हल्की थपकी वाली 'r' ध्वनि।"],
    ["Standard B sound, same as English.", "मानक B ध्वनि, अंग्रेज़ी जैसी।"],
    ["Standard F sound.", "मानक F ध्वनि।"],
    ["Standard K sound.", "मानक K ध्वनि।"],
    ["Standard M sound.", "मानक M ध्वनि।"],
    ["Standard N sound.", "मानक N ध्वनि।"],
    ["Standard P sound.", "मानक P ध्वनि।"],
    ["Rolled R - like Spanish R", "लुढ़कती R — स्पेनिश R जैसी।"],
    [
      "Trilled/rolled R, tongue vibrates against roof of mouth.",
      "कंपित / लुढ़कती R; जीभ मुंह की छत से टकराकर कंपन करती है।",
    ],
    [
      "B alone is like English B. With H (bh), it becomes 'v' or 'w' sound.",
      "अकेली B अंग्रेज़ी B जैसी होती है। H (bh) के साथ यह 'v' या 'w' जैसी ध्वनि बन जाती है।",
    ],
    [
      "Standard M sound. With H (mh), becomes 'v' or 'w'.",
      "मानक M ध्वनि। H (mh) के साथ यह 'v' या 'w' जैसी हो जाती है।",
    ],
    [
      "Standard P. With H (ph), becomes 'f' sound.",
      "मानक P ध्वनि। H (ph) के साथ यह 'f' जैसी हो जाती है।",
    ],
    [
      "Varies: 'h' sound at start/after consonant; tap between vowels",
      "स्थिति के अनुसार बदलती है: शुरुआत में या व्यंजन के बाद 'h' जैसी; स्वरों के बीच हल्की थपकी जैसी।",
    ],
    [
      "In Brazil: often like 'h'. In Portugal: guttural. NOT a trill like Spanish!",
      "ब्राज़ील में यह अक्सर 'h' जैसी सुनाई देती है। पुर्तगाल में यह कंठ्य होती है। यह स्पेनिश की तरह कंपित R नहीं है!",
    ],
    [
      "Short: like 'e' in 'bed'; Long: like 'ay' without glide",
      "छोटी ध्वनि: 'bed' के 'e' जैसी; लंबी ध्वनि: 'ay' जैसी, बिना अतिरिक्त फिसलन के।",
    ],
  ].map(([source, translation]) => [normalizeKey(source), translation]),
);

const TOKEN_REPLACEMENTS = [
  ["letters", "अक्षर"],
  ["letter", "अक्षर"],
  ["sounds", "ध्वनियां"],
  ["sound", "ध्वनि"],
  ["vowels", "स्वर"],
  ["vowel", "स्वर"],
  ["consonants", "व्यंजन"],
  ["consonant", "व्यंजन"],
  ["voiced", "स्वरयुक्त"],
  ["voiceless", "अस्वर"],
  ["silent", "मूक"],
  ["nasal", "नासिक्य"],
  ["tongue", "जीभ"],
  ["lips", "होंठ"],
  ["teeth", "दांत"],
  ["nose", "नाक"],
  ["mouth", "मुंह"],
  ["throat", "गला"],
  ["voice", "आवाज़"],
  ["air", "हवा"],
  ["stress", "ज़ोर"],
  ["word", "शब्द"],
  ["words", "शब्द"],
  ["before", "से पहले"],
  ["after", "के बाद"],
  ["between", "के बीच"],
  ["with", "के साथ"],
  ["without", "बिना"],
  ["near", "के पास"],
  ["front", "सामने"],
  ["back", "पीछे"],
  ["long", "लंबा"],
  ["short", "छोटा"],
  ["soft", "मुलायम"],
  ["hard", "कठोर"],
  ["rounded", "गोल"],
  ["english", "अंग्रेज़ी"],
  ["spanish", "स्पेनिश"],
  ["french", "फ़्रेंच"],
  ["german", "जर्मन"],
  ["italian", "इतालवी"],
  ["portuguese", "पुर्तगाली"],
  ["dutch", "डच"],
  ["polish", "पोलिश"],
  ["russian", "रूसी"],
  ["greek", "ग्रीक"],
  ["irish", "आयरिश"],
  ["japanese", "जापानी"],
];

const finalizeInstruction = (value) => compactWhitespace(value);

export const translateAlphabetMeaningToHindi = (meaning) => {
  if (!meaning) return "";
  if (typeof meaning === "string") {
    return translateFlashcardConceptToHindi(meaning) || meaning;
  }

  const source =
    meaning.hi ||
    meaning.en ||
    meaning.es ||
    meaning.pt ||
    meaning.it ||
    meaning.fr ||
    meaning.ja ||
    "";

  return source ? translateFlashcardConceptToHindi(source) || source : "";
};

export const translateAlphabetNameToHindi = (value, letter = null) => {
  const source = String(value || "").trim();
  if (!source) return "";
  if (/^[A-ZÀ-ÖØ-Þ]$/u.test(source)) return "";

  if (letter?.type === "phrase") {
    const phraseMeaning = translateAlphabetMeaningToHindi(
      letter.practiceWordMeaning,
    );
    if (phraseMeaning) return phraseMeaning;
  }

  const direct = EXACT_NAME_TRANSLATIONS[normalizeKey(source)];
  if (direct) return applySourceCase(source, direct);

  const flashcardTranslation = translateFlashcardConceptToHindi(source);
  if (flashcardTranslation && flashcardTranslation !== source) {
    return flashcardTranslation;
  }

  for (const [pattern, format] of NAME_PATTERNS) {
    const match = source.match(pattern);
    if (match) {
      return applySourceCase(source, format(match[1]));
    }
  }

  return "";
};

export const translateAlphabetInstructionToHindi = (instruction) => {
  const source = String(instruction || "").trim();
  if (!source) return "";

  const exact = EXACT_INSTRUCTION_TRANSLATIONS[normalizeKey(source)];
  if (exact) return applySourceCase(source, exact);

  let translated = source;

  for (const [phrase, replacement] of PHRASE_REPLACEMENTS) {
    translated = replacePhrase(translated, phrase, replacement);
  }

  translated = translated
    .replace(
      /\blike\s+'([^']+)'\s+in\s+'([^']+)'/giu,
      (_, sound, word) => `'${word}' के '${sound}' जैसा`,
    )
    .replace(
      /\bsame as\s+'([^']+)'\s+in\s+'([^']+)'/giu,
      (_, sound, word) => `'${word}' के '${sound}' जैसा`,
    )
    .replace(
      /\blike\s+'([^']+)'\s+before\s+([A-Za-z/]+)/giu,
      (_, sound, context) => `${context} से पहले '${sound}' जैसा`,
    )
    .replace(
      /\b([A-Za-z]+)\s+before\s+([A-Za-z/]+)\s*=\s*'([^']+)'\s+sound/giu,
      (_, letter, context, sound) =>
        `${context} से पहले ${letter} = '${sound}' ध्वनि`,
    )
    .replace(
      /\bsame rules as\s+([A-Za-z]+)\s+and\s+([A-Za-z]+)/giu,
      (_, first, second) => `${first} और ${second} जैसे ही नियम`,
    )
    .replace(
      /\bsame as\s+([A-Za-z]+)\s+([A-Za-zÀ-ÖØ-öø-ÿ'/-]+)/giu,
      (_, first, second) => `${first} ${second} जैसा`,
    )
    .replace(
      /\bsame as\s+([A-Za-zÀ-ÖØ-öø-ÿ'/-]+)/giu,
      (_, value) => `${value} जैसा`,
    )
    .replace(/\blike\s+'([^']+)'/giu, (_, sound) => `'${sound}' जैसा`);

  for (const [token, replacement] of TOKEN_REPLACEMENTS) {
    translated = replaceToken(translated, token, replacement);
  }

  translated = translated
    .replace(/\bSay\b/gu, "कहें")
    .replace(/\bUse\b/gu, "उपयोग करें")
    .replace(/\bKeep\b/gu, "रखें")
    .replace(/\bPut\b/gu, "रखें")
    .replace(/\bTouch(es|)\b/gu, "छूता है")
    .replace(/\bPronounce\b/gu, "उच्चारित करें")
    .replace(/\bDon'?t pronounce\b/giu, "उच्चारण न करें")
    .replace(/\bThink of\b/gu, "ऐसे सोचें")
    .replace(/\bMore\b/gu, "अधिक")
    .replace(/\bLess\b/gu, "कम");

  translated = finalizeInstruction(translated);

  return translated || source;
};

const addHindiAlphabetCopy = (letter) => {
  if (!letter || typeof letter !== "object") return letter;

  const sourceSound = letter.sound || letter.soundEs || "";
  const sourceTip = letter.tip || letter.tipEs || "";
  const practiceWordMeaning = letter.practiceWordMeaning || {};

  return {
    ...letter,
    nameHi: letter.nameHi || translateAlphabetNameToHindi(letter.name, letter),
    soundHi: letter.soundHi || translateAlphabetInstructionToHindi(sourceSound),
    tipHi: letter.tipHi || translateAlphabetInstructionToHindi(sourceTip),
    practiceWordMeaning: {
      ...practiceWordMeaning,
      hi:
        practiceWordMeaning.hi ||
        translateAlphabetMeaningToHindi(practiceWordMeaning),
    },
  };
};

export const withHindiAlphabetSupport = (letters = []) =>
  Array.isArray(letters) ? letters.map(addHindiAlphabetCopy) : letters;
