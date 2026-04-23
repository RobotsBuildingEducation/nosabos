import { translateFlashcardConceptToArabic } from "./flashcards/arabicLocalizer.js";

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const stripDiacritics = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "");

const normalizeComparableKey = (value) => normalizeKey(stripDiacritics(value));

const compactWhitespace = (value) =>
  String(value || "")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s+/g, " ")
    .trim();

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

const LATIN_LETTER_NAME_TRANSLATIONS = {
  a: "إيه",
  b: "بي",
  c: "سي",
  d: "دي",
  e: "إي",
  f: "إف",
  g: "جي",
  h: "إتش",
  i: "آي",
  j: "جاي",
  k: "كاي",
  l: "إل",
  m: "إم",
  n: "إن",
  o: "أو",
  p: "بي",
  q: "كيو",
  r: "آر",
  s: "إس",
  t: "تي",
  u: "يو",
  v: "في",
  w: "دبليو",
  x: "إكس",
  y: "واي",
  z: "زد",
};

const EXACT_NAME_TOKEN_TRANSLATIONS = {
  [normalizeKey("Eñe")]: "إينييه",
  [normalizeKey("Eł")]: "إيو",
  [normalizeKey("Eń")]: "إين",
  [normalizeKey("Żet")]: "جيت",
  [normalizeKey("Zède")]: "زيد",
  [normalizeKey("É / Ê")]: "إي / إيه",
  [normalizeKey("Ó / Ô")]: "أو / أوه",
};

const EXACT_ALPHABET_MEANING_TRANSLATIONS = {
  [normalizeKey("Hello")]: "أهلًا",
  [normalizeKey("Hello!")]: "أهلًا!",
  [normalizeKey("Cheers/Health")]: "في صحتك",
  [normalizeKey("Health")]: "الصحة",
  [normalizeKey("French")]: "الفرنسية",
  [normalizeKey("German")]: "الألمانية",
  [normalizeKey("Irish (language)")]: "اللغة الأيرلندية",
  [normalizeKey("Italy")]: "إيطاليا",
  [normalizeKey("Japan")]: "اليابان",
  [normalizeKey("Maya (language/people)")]: "المايا (لغة/شعب)",
  [normalizeKey("Nahuatl language")]: "لغة الناواتل",
  [normalizeKey("above")]: "فوق",
  [normalizeKey("apple")]: "تفاحة",
  [normalizeKey("avocado")]: "أفوكادو",
  [normalizeKey("badly")]: "بشكل سيئ",
  [normalizeKey("banana")]: "موز",
  [normalizeKey("beetle")]: "خنفساء",
  [normalizeKey("bicycle")]: "دراجة",
  [normalizeKey("bird")]: "طائر",
  [normalizeKey("but/however")]: "لكن/مع ذلك",
  [normalizeKey("butterfly")]: "فراشة",
  [normalizeKey("cabbage soup")]: "شوربة كرنب",
  [normalizeKey("café")]: "مقهى",
  [normalizeKey("camera")]: "كاميرا",
  [normalizeKey("cent")]: "سنت",
  [normalizeKey("cherry blossom")]: "زهر الكرز",
  [normalizeKey("chili pepper")]: "فلفل حار",
  [normalizeKey("clock")]: "ساعة",
  [normalizeKey("color/flower")]: "لون/زهرة",
  [normalizeKey("companion/friend")]: "رفيق/صديق",
  [normalizeKey("cow")]: "بقرة",
  [normalizeKey("deer")]: "غزال",
  [normalizeKey("dice")]: "نرد",
  [normalizeKey("dog")]: "كلب",
  [normalizeKey("eagle")]: "نسر",
  [normalizeKey("earth")]: "الأرض",
  [normalizeKey("earth/land")]: "الأرض/اليابسة",
  [normalizeKey("egoist")]: "أناني",
  [normalizeKey("eighth")]: "الثامن",
  [normalizeKey("flour")]: "دقيق",
  [normalizeKey("flower/nose")]: "زهرة/أنف",
  [normalizeKey("frog")]: "ضفدع",
  [normalizeKey("from/of")]: "من/لـ",
  [normalizeKey("garden")]: "حديقة",
  [normalizeKey("gift")]: "هدية",
  [normalizeKey("gnocchi")]: "نيوكي",
  [normalizeKey("hand")]: "يد",
  [normalizeKey("hand/arm")]: "يد/ذراع",
  [normalizeKey("hearts")]: "قلوب",
  [normalizeKey("hedgehog")]: "قنفذ",
  [normalizeKey("hello/goodbye")]: "أهلًا/مع السلامة",
  [normalizeKey("his/her")]: "له/لها",
  [normalizeKey("honored")]: "مُشرَّف",
  [normalizeKey("horse")]: "حصان",
  [normalizeKey("is (location/state)")]: "يكون (المكان/الحالة)",
  [normalizeKey("jaguar")]: "جاكوار",
  [normalizeKey("jeans")]: "جينز",
  [normalizeKey("kilogram")]: "كيلوجرام",
  [normalizeKey("king")]: "ملك",
  [normalizeKey("kiwi")]: "كيوي",
  [normalizeKey("knee")]: "ركبة",
  [normalizeKey("knight")]: "فارس",
  [normalizeKey("land/country")]: "أرض/بلد",
  [normalizeKey("last")]: "الأخير",
  [normalizeKey("lemon")]: "ليمون",
  [normalizeKey("long")]: "طويل",
  [normalizeKey("man")]: "رجل",
  [normalizeKey("mess/chaos")]: "فوضى/خربطة",
  [normalizeKey("more")]: "أكثر",
  [normalizeKey("moth")]: "عثة",
  [normalizeKey("mother (respectful)")]: "الأم (باحترام)",
  [normalizeKey("naive")]: "ساذج",
  [normalizeKey("needle")]: "إبرة",
  [normalizeKey("next year")]: "السنة الجاية",
  [normalizeKey("nose")]: "أنف",
  [normalizeKey("object")]: "غرض",
  [normalizeKey("oh/alas")]: "آه/يا للأسف",
  [normalizeKey("olive")]: "زيتون",
  [normalizeKey("one/a")]: "واحد/أداة نكرة",
  [normalizeKey("over/about")]: "فوق/عن",
  [normalizeKey("pizza")]: "بيتزا",
  [normalizeKey("place/square")]: "مكان/ساحة",
  [normalizeKey("quiz")]: "اختبار",
  [normalizeKey("rose")]: "وردة",
  [normalizeKey("sacred force/god")]: "قوة مقدسة/إله",
  [normalizeKey("school")]: "مدرسة",
  [normalizeKey("screen")]: "شاشة",
  [normalizeKey("sea")]: "بحر",
  [normalizeKey("shoe")]: "حذاء",
  [normalizeKey("sit")]: "اجلس",
  [normalizeKey("so/thus")]: "لذا/وهكذا",
  [normalizeKey("source")]: "مصدر",
  [normalizeKey("south")]: "الجنوب",
  [normalizeKey("spaghetti")]: "سباجيتي",
  [normalizeKey("speech/language")]: "كلام/لغة",
  [normalizeKey("star (animate form)")]: "نجمة (صيغة حيّة)",
  [normalizeKey("stone")]: "حجر",
  [normalizeKey("style")]: "أسلوب",
  [normalizeKey("subway")]: "مترو",
  [normalizeKey("sun/day")]: "شمس/يوم",
  [normalizeKey("sweet")]: "حلو",
  [normalizeKey("that/what")]: "ذلك/ماذا",
  [normalizeKey("the")]: "الـ",
  [normalizeKey("the (article)")]: "أداة التعريف",
  [normalizeKey("the friends")]: "الأصدقاء",
  [normalizeKey("theater")]: "مسرح",
  [normalizeKey("through/door")]: "عبر/باب",
  [normalizeKey("time/weather")]: "وقت/طقس",
  [normalizeKey("to be / his")]: "يكون / له",
  [normalizeKey("to read/learn")]: "يقرأ/يتعلم",
  [normalizeKey("town")]: "بلدة",
  [normalizeKey("type/guy")]: "نوع/شخص",
  [normalizeKey("umbrella")]: "شمسية",
  [normalizeKey("wagon")]: "عربة",
  [normalizeKey("watermelon")]: "بطيخ",
  [normalizeKey("wave")]: "موجة",
  [normalizeKey("web")]: "شبكة",
  [normalizeKey("well/good")]: "جيد/كويس",
  [normalizeKey("what/that")]: "ماذا/ذلك",
  [normalizeKey("why/because")]: "لماذا/لأن",
  [normalizeKey("wind (root form)")]: "ريح (صيغة الجذر)",
  [normalizeKey("woman/Mrs.")]: "امرأة/السيدة",
  [normalizeKey("wood")]: "خشب",
  [normalizeKey("world")]: "عالم",
  [normalizeKey("writing")]: "كتابة",
  [normalizeKey("year")]: "سنة",
  [normalizeKey("yogurt")]: "زبادي",
  [normalizeKey("you (formal)")]: "حضرتك",
  [normalizeKey("zoo")]: "حديقة حيوان",
};

const NAME_TOKEN_TRANSLATIONS = {
  [normalizeComparableKey("alpha")]: "ألفا",
  [normalizeComparableKey("beta")]: "بيتا",
  [normalizeComparableKey("gamma")]: "جاما",
  [normalizeComparableKey("delta")]: "دلتا",
  [normalizeComparableKey("epsilon")]: "إبسيلون",
  [normalizeComparableKey("eta")]: "إيتا",
  [normalizeComparableKey("theta")]: "ثيتا",
  [normalizeComparableKey("iota")]: "أيوتا",
  [normalizeComparableKey("kappa")]: "كابا",
  [normalizeComparableKey("lambda")]: "لامبدا",
  [normalizeComparableKey("mu")]: "مو",
  [normalizeComparableKey("nu")]: "نو",
  [normalizeComparableKey("omicron")]: "أوميكرون",
  [normalizeComparableKey("omega")]: "أوميغا",
  [normalizeComparableKey("phi")]: "فاي",
  [normalizeComparableKey("pi")]: "باي",
  [normalizeComparableKey("psi")]: "بساي",
  [normalizeComparableKey("rho")]: "رو",
  [normalizeComparableKey("sigma")]: "سيغما",
  [normalizeComparableKey("tau")]: "تاو",
  [normalizeComparableKey("upsilon")]: "أبسيلون",
  [normalizeComparableKey("xi")]: "كساي",
  [normalizeComparableKey("zeta")]: "زيتا",
  [normalizeComparableKey("kha")]: "خا",
  [normalizeComparableKey("sha")]: "شا",
  [normalizeComparableKey("shcha")]: "شتشا",
  [normalizeComparableKey("zhe")]: "ژه",
  [normalizeComparableKey("bee")]: "بي",
  [normalizeComparableKey("bi")]: "بي",
  [normalizeComparableKey("be")]: "بيه",
  [normalizeComparableKey("ce")]: "سيه",
  [normalizeComparableKey("che")]: "تشيه",
  [normalizeComparableKey("chi")]: "كي",
  [normalizeComparableKey("ci")]: "تشي",
  [normalizeComparableKey("cu")]: "كو",
  [normalizeComparableKey("de")]: "ديه",
  [normalizeComparableKey("dee")]: "دي",
  [normalizeComparableKey("di")]: "دي",
  [normalizeComparableKey("ef")]: "إف",
  [normalizeComparableKey("efe")]: "إفه",
  [normalizeComparableKey("effe")]: "إفه",
  [normalizeComparableKey("eif")]: "إيف",
  [normalizeComparableKey("el")]: "إل",
  [normalizeComparableKey("ele")]: "إل",
  [normalizeComparableKey("elle")]: "إل",
  [normalizeComparableKey("eil")]: "إيل",
  [normalizeComparableKey("em")]: "إم",
  [normalizeComparableKey("eme")]: "إم",
  [normalizeComparableKey("emme")]: "إم",
  [normalizeComparableKey("eim")]: "إيم",
  [normalizeComparableKey("en")]: "إن",
  [normalizeComparableKey("ene")]: "إن",
  [normalizeComparableKey("enne")]: "إن",
  [normalizeComparableKey("ein")]: "إين",
  [normalizeComparableKey("er")]: "إر",
  [normalizeComparableKey("ere")]: "إري",
  [normalizeComparableKey("erre")]: "إري",
  [normalizeComparableKey("ear")]: "إير",
  [normalizeComparableKey("es")]: "إس",
  [normalizeComparableKey("ese")]: "إس",
  [normalizeComparableKey("esse")]: "إس",
  [normalizeComparableKey("eis")]: "إيش",
  [normalizeComparableKey("ge")]: "جيه",
  [normalizeComparableKey("gee")]: "جي",
  [normalizeComparableKey("gi")]: "جي",
  [normalizeComparableKey("hache")]: "هاتشي",
  [normalizeComparableKey("heis")]: "هيش",
  [normalizeComparableKey("igrek")]: "إيغريك",
  [normalizeComparableKey("iks")]: "إكس",
  [normalizeComparableKey("ixe")]: "إيش",
  [normalizeComparableKey("jot")]: "يوت",
  [normalizeComparableKey("jota")]: "خوتا",
  [normalizeComparableKey("ka")]: "كا",
  [normalizeComparableKey("ku")]: "كو",
  [normalizeComparableKey("kuu")]: "كوو",
  [normalizeComparableKey("ma")]: "ما",
  [normalizeComparableKey("na")]: "نا",
  [normalizeComparableKey("ra")]: "را",
  [normalizeComparableKey("sa")]: "سا",
  [normalizeComparableKey("ta")]: "تا",
  [normalizeComparableKey("te")]: "تيه",
  [normalizeComparableKey("tee")]: "تي",
  [normalizeComparableKey("pe")]: "بيه",
  [normalizeComparableKey("pee")]: "بي",
  [normalizeComparableKey("que")]: "كيه",
  [normalizeComparableKey("ve")]: "فيه",
  [normalizeComparableKey("vee")]: "في",
  [normalizeComparableKey("vi")]: "في",
  [normalizeComparableKey("vu")]: "فو",
  [normalizeComparableKey("wa")]: "وا",
  [normalizeComparableKey("wee")]: "وي",
  [normalizeComparableKey("wu")]: "وو",
  [normalizeComparableKey("ya")]: "يا",
  [normalizeComparableKey("ye")]: "يي",
  [normalizeComparableKey("yo")]: "يو",
  [normalizeComparableKey("yu")]: "يو",
  [normalizeComparableKey("ze")]: "زي",
  [normalizeComparableKey("eszett")]: "إسيت",
  [normalizeComparableKey("scharfes")]: "الحادة",
  [normalizeComparableKey("fau")]: "فاو",
  [normalizeComparableKey("eu")]: "أو",
  [normalizeComparableKey("ei")]: "إي",
  [normalizeComparableKey("ou")]: "أو",
  [normalizeComparableKey("au")]: "أو",
  [normalizeComparableKey("oe")]: "أو إي",
  [normalizeComparableKey("oi")]: "أوي",
  [normalizeComparableKey("ui")]: "يو آي",
  [normalizeComparableKey("ie")]: "آي إي",
  [normalizeComparableKey("ng")]: "إن جي",
  [normalizeComparableKey("ch")]: "سي إتش",
  [normalizeComparableKey("sh")]: "إس إتش",
  [normalizeComparableKey("zh")]: "زد إتش",
  [normalizeComparableKey("th")]: "تي إتش",
  [normalizeComparableKey("ts")]: "تي إس",
  [normalizeComparableKey("kn")]: "كي إن",
  [normalizeComparableKey("sc")]: "إس سي",
  [normalizeComparableKey("sch")]: "إس سي إتش",
  [normalizeComparableKey("sp")]: "إس بي",
  [normalizeComparableKey("st")]: "إس تي",
  [normalizeComparableKey("gl")]: "جي إل",
  [normalizeComparableKey("gn")]: "جي إن",
  [normalizeComparableKey("pf")]: "بي إف",
  [normalizeComparableKey("aw")]: "أو",
  [normalizeComparableKey("ay")]: "إيه",
  [normalizeComparableKey("ow")]: "أاو",
  [normalizeComparableKey("oy")]: "أوي",
};

const LATIN_NAME_SEQUENCE_REPLACEMENTS = [
  ["sch", "ش"],
  ["sh", "ش"],
  ["ch", "تش"],
  ["gh", "غ"],
  ["kh", "خ"],
  ["ph", "ف"],
  ["th", "ث"],
  ["zh", "ژ"],
  ["ts", "تس"],
  ["ps", "بس"],
  ["gn", "ني"],
  ["gli", "لي"],
  ["qu", "كو"],
  ["rr", "ر"],
  ["ll", "ل"],
  ["ng", "نج"],
  ["ou", "أو"],
  ["au", "أو"],
  ["oi", "أوي"],
  ["oo", "وو"],
  ["ee", "يي"],
  ["ay", "إي"],
  ["ow", "أاو"],
  ["oy", "أوي"],
];

const LATIN_CHAR_TRANSLITERATIONS = {
  a: "ا",
  b: "ب",
  c: "ك",
  d: "د",
  e: "ي",
  f: "ف",
  g: "ج",
  h: "ه",
  i: "ي",
  j: "ج",
  k: "ك",
  l: "ل",
  m: "م",
  n: "ن",
  o: "و",
  p: "ب",
  q: "ك",
  r: "ر",
  s: "س",
  t: "ت",
  u: "و",
  v: "ف",
  w: "و",
  x: "كس",
  y: "ي",
  z: "ز",
};

const transliterateLatinTokenToArabic = (token) => {
  let transliterated = stripDiacritics(token).toLowerCase();
  for (const [source, replacement] of LATIN_NAME_SEQUENCE_REPLACEMENTS) {
    transliterated = transliterated.replaceAll(source, replacement);
  }

  let result = "";
  for (const char of transliterated) {
    if (/[a-z]/.test(char)) {
      result += LATIN_CHAR_TRANSLITERATIONS[char] || "";
    } else {
      result += char;
    }
  }

  return compactWhitespace(result);
};

const translateAlphabetNameTokenToArabic = (token) => {
  const source = String(token || "").trim();
  if (!source) return "";

  const direct = EXACT_NAME_TOKEN_TRANSLATIONS[normalizeKey(source)];
  if (direct) return direct;

  if (/^[A-ZÀ-ÖØ-Þ]$/u.test(source)) {
    return LATIN_LETTER_NAME_TRANSLATIONS[normalizeComparableKey(source)] || "";
  }

  const comparable = NAME_TOKEN_TRANSLATIONS[normalizeComparableKey(source)];
  if (comparable) return comparable;

  if (/^[A-Z]{2,4}$/u.test(stripDiacritics(source))) {
    return stripDiacritics(source)
      .toLowerCase()
      .split("")
      .map((char) => LATIN_LETTER_NAME_TRANSLATIONS[char] || "")
      .filter(Boolean)
      .join(" ");
  }

  if (/^[A-Za-zÀ-ÖØ-öø-ÿ]+$/u.test(source)) {
    return transliterateLatinTokenToArabic(source);
  }

  return "";
};

const translateCompositeAlphabetNameToArabic = (value) => {
  const source = String(value || "").trim();
  if (!source) return "";

  const parts = source.split(/(\s+|\/|&|\+|-|\(|\))/g).filter(Boolean);
  let changed = false;

  const translated = parts
    .map((part) => {
      if (/^\s+$/u.test(part)) return part;
      if (part === "&") return " و ";
      if (part === "/") return " / ";
      if (part === "+") return " + ";
      if (part === "-") return " - ";
      if (part === "(" || part === ")") return part;

      const mapped = translateAlphabetNameTokenToArabic(part);
      if (mapped) {
        changed = true;
        return mapped;
      }
      return part;
    })
    .join("");

  const candidate = compactWhitespace(translated);
  if (!changed || /[A-Za-zÀ-ÖØ-öø-ÿ]/u.test(candidate)) {
    return "";
  }
  return candidate;
};

const EXACT_NAME_TRANSLATIONS = {
  [normalizeKey("Lange IJ")]: "آي جاي الطويلة",
  [normalizeKey("Griekse ij")]: "آي جاي اليونانية",
  [normalizeKey("E met trema")]: "E بتريما",
  [normalizeKey("I met trema")]: "I بتريما",
  [normalizeKey("Silent Letters")]: "حروف صامتة",
  [normalizeKey("Word Stress")]: "نبرة الكلمة",
  [normalizeKey("TH (voiced)")]: "TH مجهور",
  [normalizeKey("TH (unvoiced)")]: "TH مهموس",
  [normalizeKey("Nasal AN/EN")]: "AN/EN أنفية",
  [normalizeKey("Nasal ON")]: "ON أنفية",
  [normalizeKey("Nasal IN")]: "IN أنفية",
  [normalizeKey("Nasal UN")]: "UN أنفية",
  [normalizeKey("Hello")]: "أهلًا",
  [normalizeKey("Cheers/Health")]: "في صحتك",
  [normalizeKey("Clear L")]: "L واضحة",
  [normalizeKey("Dark L")]: "L غامقة",
  [normalizeKey("Double Consonants")]: "حروف ساكنة مزدوجة",
  [normalizeKey("Soft sign")]: "علامة التليين",
  [normalizeKey("Hard sign")]: "العلامة الصلبة",
  [normalizeKey("Schwa")]: "شِوا",
  [normalizeKey("Saltillo")]: "سالتيّو",
  [normalizeKey("Glottal stop (')")]: "وقفة حنجرية",
  [normalizeKey("Liaison")]: "ربط النطق",
  [normalizeKey("Final -en")]: "النهاية -en",
  [normalizeKey("Flap T")]: "T رفرفة",
  [normalizeKey("Long E")]: "E طويلة",
  [normalizeKey("Long I")]: "I طويلة",
  [normalizeKey("Long O")]: "O طويلة",
  [normalizeKey("Long OO")]: "OO طويلة",
  [normalizeKey("Short A")]: "A قصيرة",
  [normalizeKey("Short I")]: "I قصيرة",
  [normalizeKey("Short OO")]: "OO قصيرة",
  [normalizeKey("Short U")]: "U قصيرة",
  [normalizeKey("A-Umlaut")]: "إيه بأوملاوت",
  [normalizeKey("O-Umlaut")]: "أو بأوملاوت",
  [normalizeKey("U-Umlaut")]: "يو بأوملاوت",
  [normalizeKey("A accent aigu")]: "إيه بأكسنت حاد",
  [normalizeKey("A accent grave")]: "إيه بأكسنت غليظ",
  [normalizeKey("A accent circonflexe")]: "إيه بسيركمفلكس",
  [normalizeKey("E accent aigu")]: "إي بأكسنت حاد",
  [normalizeKey("E accent grave")]: "إي بأكسنت غليظ",
  [normalizeKey("E accent circonflexe")]: "إي بسيركمفلكس",
  [normalizeKey("I accent circonflexe")]: "آي بسيركمفلكس",
  [normalizeKey("O accent circonflexe")]: "أو بسيركمفلكس",
  [normalizeKey("U accent circonflexe")]: "يو بسيركمفلكس",
  [normalizeKey("U accent grave")]: "يو بأكسنت غليظ",
  [normalizeKey("Signo de interrogación invertido")]: "علامة استفهام مقلوبة",
  [normalizeKey("Signo de exclamación invertido")]: "علامة تعجب مقلوبة",
  [normalizeKey("Eszett / scharfes S")]: "إسيت / إس الحادة",
  [normalizeKey("J / soft G")]: "جاي / G رخوة",
  [normalizeKey("T (ending)")]: "تي في النهاية",
  [normalizeKey("Li (ending)")]: "لي في النهاية",
  [normalizeKey("In (ending)")]: "إن في النهاية",
  [normalizeKey("EI vs IJ")]: "إي آي مقابل آي جاي",
  [normalizeKey("EI / IJ")]: "إي آي / آي جاي",
  [normalizeKey("EU & ÄU")]: "أو و أوي",
  [normalizeKey("OU / AU")]: "أو / أو",
  [normalizeKey("SP & ST (at start)")]: "إس بي و إس تي في البداية",
  [normalizeKey("SC (before E/I)")]: "إس سي قبل E/I",
  [normalizeKey("GL (before I)")]: "جي إل قبل I",
  [normalizeKey("C + H")]: "سي + إتش",
  [normalizeKey("G + H")]: "جي + إتش",
  [normalizeKey("Vi / Vu")]: "في / فو",
  [normalizeKey("Ye / E")]: "يي / إي",
  [normalizeKey("Ye / I griega")]: "يي / آي اليونانية",
  [normalizeKey("I grec")]: "آي اليونانية",
  [normalizeKey("I greca")]: "آي اليونانية",
  [normalizeKey("I griega")]: "آي اليونانية",
  [normalizeKey("Ipsilon / I greca")]: "إيبسيلون / آي اليونانية",
};

const NAME_PATTERNS = [
  [/^(.+) with acute accent$/i, (letter) => `${letter.toUpperCase()} بأكسنت حاد`],
  [/^(.+) with grave accent$/i, (letter) => `${letter.toUpperCase()} بأكسنت غليظ`],
  [/^(.+) with circumflex$/i, (letter) => `${letter.toUpperCase()} بسيركمفلكس`],
  [/^(.+) with diaeresis$/i, (letter) => `${letter.toUpperCase()} بتريما`],
  [/^(.+) with umlaut$/i, (letter) => `${letter.toUpperCase()} بأوملاوت`],
  [/^(.+) with cedilla$/i, (letter) => `${letter.toUpperCase()} بسيديلا`],
  [/^(.+) with tilde$/i, (letter) => `${letter.toUpperCase()} بتيلدا`],
  [/^(.+)\s+fada$/i, (letter) => `${letter.toUpperCase()} بفادا`],
  [/^(.+)\s+ogonek$/i, (letter) => `${letter.toUpperCase()} بأوجونيك`],
  [/^Nasal (.+)$/i, (value) => `${value} أنفية`],
  [/^([A-Z])\s+con acento$/i, (letter) => `${translateAlphabetNameTokenToArabic(letter)} بأكسنت`],
  [/^([A-Z])\s+con accento$/i, (letter) => `${translateAlphabetNameTokenToArabic(letter)} بأكسنت`],
  [/^([A-Z])\s+agudo$/i, (letter) => `${translateAlphabetNameTokenToArabic(letter)} حاد`],
  [/^([A-Z])\s+circunflexo$/i, (letter) => `${translateAlphabetNameTokenToArabic(letter)} بسيركمفلكس`],
  [/^([A-Z])\s+accent aigu$/i, (letter) => `${translateAlphabetNameTokenToArabic(letter)} بأكسنت حاد`],
  [/^([A-Z])\s+accent grave$/i, (letter) => `${translateAlphabetNameTokenToArabic(letter)} بأكسنت غليظ`],
  [/^([A-Z])\s+accent circonflexe$/i, (letter) => `${translateAlphabetNameTokenToArabic(letter)} بسيركمفلكس`],
  [/^([A-Z])\s+tréma$/i, (letter) => `${translateAlphabetNameTokenToArabic(letter)} بتريما`],
  [/^([A-Z])\s+til\s*\/\s*([A-Za-z]+)$/i, (letter) => `${translateAlphabetNameTokenToArabic(letter)} بتيلدا / أنفية`],
  [/^([A-Z])\s+aperta con accento$/i, (letter) => `${translateAlphabetNameTokenToArabic(letter)} بأكسنت مفتوح`],
  [/^([A-Z])\s+chiusa con accento$/i, (letter) => `${translateAlphabetNameTokenToArabic(letter)} بأكسنت مقفول`],
  [/^([A-Z])-Umlaut$/i, (letter) => `${translateAlphabetNameTokenToArabic(letter)} بأوملاوت`],
  [/^(.+)\s+\(ending\)$/i, (value) => `${translateAlphabetNameTokenToArabic(value)} في النهاية`],
  [/^(.+)\s+\(before\s+([^)]+)\)$/i, (value, context) => `${translateAlphabetNameTokenToArabic(value)} قبل ${context}`],
  [/^(.+)\s+\(at start\)$/i, (value) => `${translateAlphabetNameTokenToArabic(value)} في البداية`],
];

const EXACT_INSTRUCTION_TRANSLATIONS = {
  "same as english b.": "زي حرف B في الإنجليزي.",
  "same as english m.": "زي حرف M في الإنجليزي.",
  "same as english n.": "زي حرف N في الإنجليزي.",
  "same as english f.": "زي حرف F في الإنجليزي.",
  "same as english": "زي الإنجليزي.",
  "same as spanish": "زي الإسباني.",
  "same as portuguese": "زي البرتغالي.",
  "same as italian": "زي الإيطالي.",
  "same as french": "زي الفرنسي.",
  "same as german": "زي الألماني.",
  "same as dutch": "زي الهولندي.",
  "same as polish": "زي البولندي.",
  "same as russian": "زي الروسي.",
  "same as greek": "زي اليوناني.",
  "same as irish": "زي الأيرلندي.",
  "same as japanese": "زي الياباني.",
  "same as nahuatl": "زي الناواتل.",
  "same as yucatec maya": "زي المايا اليوكاتيكية.",
  "same as u.": "نفس صوت U.",
  "same sound as u. marks historical spelling.":
    "نفس صوت U. وبتوضح تهجئة تاريخية.",
  "same sound as i. circumflex marks historical spelling change.":
    "نفس صوت I. والسيركمفلكس بيوضح تغيير إملائي قديم.",
  "pronounced separately from adjacent vowel":
    "يتنطق لوحده بعيد عن الحركة اللي جنبه",
  "pronounced separately from previous vowel":
    "يتنطق لوحده بعيد عن الحركة اللي قبله",
  "guttural sound from back of throat, like clearing throat":
    "صوت حلقي من آخر الزور، كأنك بتنحنح",
  "same as spanish and portuguese.": "نفسه في الإسباني والبرتغالي.",
  "only in borrowed words.": "بيظهر غالبًا في الكلمات الدخيلة.",
  "used in borrowed words": "بيستخدم في الكلمات الدخيلة",
  "used in foreign words": "بيستخدم في الكلمات الأجنبية",
  "always silent": "دايمًا صامت",
  "usually silent": "غالبًا صامت",
  "never silent": "مش صامت أبدًا",
  "at the end of a word": "في آخر الكلمة",
  "at the end of words": "في آخر الكلمات",
  "at the beginning of a word": "في أول الكلمة",
  "at the beginning of words": "في أول الكلمات",
  "between vowels": "بين الحركات",
  "before e/i": "قبل e/i",
  "before a/o/u": "قبل a/o/u",
  "before front vowels": "قبل الحركات الأمامية",
  "with rounded lips": "مع تدوير الشفايف",
  "keep lips rounded": "خلي الشفايف مدوّرة",
  "air through nose": "الهوا يطلع من الأنف",
  "open sound": "صوت مفتوح",
  "closed sound": "صوت مقفول",
  "soft sound": "صوت لين",
  "hard sound": "صوت قوي",
  "short sound": "صوت قصير",
  "long sound": "صوت طويل",
  "stress this syllable": "شد النبرة على المقطع ده",
  "stress this word": "شد النبرة على الكلمة دي",
  "a breath of air from the throat": "نَفَس هوا من الزور",
  "round lips into a tight circle, then release":
    "لفّ شفايفك على شكل دايرة ضيقة وبعد كده فكّها",
  "upper teeth touch lower lip, voiced":
    "الأسنان العليا تلمس الشفة السفلى مع صوت مجهور",
  "different from w! bite your lower lip gently and hum.":
    "مختلف عن W! عض شفتك السفلى بهدوء وطلّع طنين خفيف.",
  "the 'uh' in 'about', 'banana', 'sofa' - neutral, unstressed":
    "صوت 'uh' زي اللي في 'about' و'banana' و'sofa' — صوت محايد ومن غير نبرة",
  "the most common sound in english! completely relax mouth. appears in unstressed syllables.":
    "ده أكتر صوت شائع في الإنجليزي! ريّح بقك تمامًا. بيظهر في المقاطع اللي من غير نبرة.",
  "like 'aw' in 'law', 'caught', 'thought' - rounded back vowel":
    "زي 'aw' في 'law' و'caught' و'thought' — حركة خلفية مدوّرة",
  "like 'sh' in 'she', 'ship', 'fish' - tongue pulled back":
    "زي 'sh' في 'she' و'ship' و'fish' — اللسان راجع لورا",
  "like 'j' in 'jump', 'g' in 'gentle' - voiced ch":
    "زي 'j' في 'jump' و'g' في 'gentle' — CH مجهورة",
  "like 's' in 'measure', 'vision', 'beige' - voiced sh":
    "زي 's' في 'measure' و'vision' و'beige' — SH مجهورة",
  "same tongue position as voiced th, but whisper it—no vocal cord vibration.":
    "نفس وضع اللسان في TH المجهورة، لكن انطقه بهمس من غير اهتزاز في الأحبال الصوتية.",
  "in american english, t between vowels becomes a quick flap—like spanish r!":
    "في الإنجليزي الأمريكي، حرف T بين الحركات بيتحوّل لرفرفة سريعة — شبه R الإسبانية.",
  "stressed syllables are louder, longer, and higher in pitch":
    "المقاطع المشددة بتبقى أعلى وأطول ونبرتها أعلى",
  "english is stress-timed. stressed syllables stand out. photograph vs photographer.":
    "الإنجليزي بيعتمد على النبرة. المقاطع المشددة بتبان بوضوح. PHOtograph مقابل phoTOGrapher.",
  "like 'e' in 'bed' - always consistent":
    "زي 'e' في 'bed' — ثابتة دايمًا",
  "spanish e is always the same sound, never silent. purer than english e.":
    "حرف E في الإسباني دايمًا نفس الصوت ومش بيبقى صامت. أنقى من E الإنجليزية.",
  "like 'g' in 'go' before a/o/u; like 'h' in 'hot' before e/i":
    "زي 'g' في 'go' قبل a/o/u، وزي 'h' في 'hot' قبل e/i",
  "g before e/i makes the same sound as j (spanish j sound).":
    "حرف G قبل e/i بيدي نفس صوت J (صوت J الإسباني).",
  "like 'l' in 'love' - tongue touches roof behind teeth":
    "زي 'l' في 'love' — اللسان بيلمس سقف الحلق ورا الأسنان",
  "always 'clear l' like at start of english words, never 'dark l'.":
    "دايمًا L واضحة زي أول الكلمات الإنجليزية، ومش L غامقة أبدًا.",
  "same as b in spanish! lips together.":
    "زي B في الإسباني! الشفايف تقفل على بعض.",
  "in spanish, b and v sound identical! don't use english v sound.":
    "في الإسباني B وV نفس الصوت! ما تستخدمش صوت V الإنجليزي.",
  "accent shows which syllable is stressed. sound doesn't change, just emphasis.":
    "الأكسنت بتحدد أنهي مقطع عليه نبرة. الصوت نفسه ما بيتغيرش، بس التأكيد.",
  "used to mark stress or distinguish words: 'el' (the) vs 'él' (he).":
    "بتستخدم علشان تحدد النبرة أو تفرّق بين الكلمات: 'el' و'él'.",
  "also breaks diphthongs: 'día' has two syllables (dí-a), not one.":
    "وكمان بتفصل الديفثونج: 'día' فيها مقطعين (dí-a) مش مقطع واحد.",
  "common in past tense: 'habló' (he/she spoke), 'comió' (he/she ate).":
    "شائعة في الماضي: 'habló' و'comió'.",
  "less common, but used in words like 'menú', 'perú'.":
    "أقل شيوعًا، لكنها بتستخدم في كلمات زي 'menú' و'Perú'.",
  "makes the u audible in güe/güi: 'pingüino' = pin-gwi-no, not 'pin-gi-no'.":
    "بتخلّي حرف U مسموع في güe/güi: 'pingüino' = pin-GWI-no مش 'pin-GI-no'.",
  "same rules as spanish. use ç for 's' sound before a/o/u.":
    "نفس قواعد الإسباني. استخدم Ç لصوت 's' قبل a/o/u.",
  "silent like in spanish. only matters in digraphs: ch, lh, nh.":
    "صامت زي الإسباني. أهميته بس في digraphs زي ch وlh وnh.",
  "in brazil, final l sounds like w: 'brasil' = 'brasiw'. portugal keeps the l.":
    "في البرازيل L في آخر الكلمة بتبقى شبه W: 'Brasil' = 'Brasiw'. في البرتغال بتفضل L.",
  "can be 'sh', 'ks', 'z', or 's' depending on word":
    "ممكن يبقى 'sh' أو 'ks' أو 'z' أو 's' حسب الكلمة",
  "most common: 'sh' (xícara). also 'ks' (táxi), 'z' (exame), 's' (próximo).":
    "الأكثر شيوعًا 'sh' زي (xícara). وممكن كمان 'ks' أو 'z' أو 's'.",
  "only in borrowed words. sounds like i.":
    "بيظهر بس في الكلمات الدخيلة، وصوته زي I.",
  "stressed 'i' like 'ee' in 'see'":
    "حرف I مشدد زي 'ee' في 'see'",
  "marks stress. same sound as unstressed i, just emphasized.":
    "بيحدد النبرة. نفس صوت I غير المشدد، بس بتأكيد أكتر.",
  "stressed 'u' like 'oo' in 'moon'":
    "حرف U مشدد زي 'oo' في 'moon'",
  "marks stress. same sound as unstressed u.":
    "بيحدد النبرة. نفس صوت U غير المشدد.",
  "tréma means 'pronounce me separately!' 'noël' = 'no-el', not 'noel'.":
    "التريما معناها 'انطقني لوحدي!' 'Noël' = 'no-el' مش 'noel'.",
  "clear l like spanish, not dark l like end of english words.":
    "L واضحة زي الإسباني، ومش L غامقة زي آخر الكلمات الإنجليزية.",
  "french r is uvular—back of tongue near uvula. not rolled! like gargling gently.":
    "الـR الفرنسي صوت يوڤولار — آخر اللسان قريب من اللهاة. مش متدحرج! شبه غرغرة خفيفة.",
  "only appears in 'où' (where) to distinguish from 'ou' (or).":
    "بتظهر بس في 'où' (where) علشان تفرّقها عن 'ou' (or).",
  "same sound as u. marks historical spelling.":
    "نفس صوت U. وبتوضح تهجئة تاريخية.",
  "like 'th' in 'the', 'this', 'that' - tongue between teeth, voiced":
    "زي 'th' في 'the' و'this' و'that' — اللسان بين الأسنان وصوته مجهور",
  "like 't' in 'water', 'better', 'butter' - sounds like a quick d":
    "زي 't' في 'water' و'better' و'butter' — شبه D سريعة",
  "like 'o' in 'more' but shorter - always consistent":
    "زي 'o' في 'more' لكن أقصر — ثابتة دايمًا",
  "like 'y' in 'yes' (most regions) or 'j' in 'judge' (argentina)":
    "زي 'y' في 'yes' في أغلب المناطق أو 'j' في 'judge' في الأرجنتين",
  "like 's' in latin america; like 'th' in spain":
    "زي 's' في أمريكا اللاتينية، وزي 'th' في إسبانيا",
  "pronounced u in güe, güi (normally u is silent)":
    "حرف U بيتنطق في GÜE وGÜI (مع إن U عادة صامت)",
  "like 'l' in 'love'; like 'w' at end of syllables in brazil":
    "زي 'l' في 'love'، وزي 'w' في آخر المقاطع في البرازيل",
  "like 't' in 'stop' (dental, unaspirated)":
    "زي 't' في 'stop' (أسناني ومن غير نفس قوي)",
  "like 'ks' or 's' or 'h' depending on word":
    "ممكن يبقى 'ks' أو 's' أو 'h' حسب الكلمة",
  "no sound - marks beginning of exclamation":
    "مفيش صوت — وبيحدد بداية التعجب",
  "can be 'sh', 'ks', 'z', or 's' depending on word":
    "ممكن يبقى 'sh' أو 'ks' أو 'z' أو 's' حسب الكلمة",
  "start with lips rounded like saying 'oo', then open quickly. not like v!":
    "ابدأ وشفايفك مدوّرة زي 'oo'، وبعد كده افتح بسرعة. مش زي V!",
  "round your lips and pull tongue back. like saying 'oh' but more open.":
    "دوّر شفايفك وارجع لسانك لورا. زي 'oh' لكن أفتح شوية.",
  "round lips slightly, tongue behind the ridge. like telling someone to be quiet: 'shhh!'":
    "دوّر شفايفك شوية وخلي لسانك ورا اللثة. زي لما بتقول لحد 'shhh!'.",
  "same position as ch, but add voice. feel your throat vibrate!":
    "نفس وضع CH، لكن ضيف صوت. حسّ باهتزاز زورك!",
  "same as sh but with voice. rare in english, usually spelled with s or g.":
    "نفس SH لكن بصوت مجهور. نادر في الإنجليزي وغالبًا بيتكتب بـ S أو G.",
  "like breathing on glasses to clean them. very light, no friction.":
    "زي لما تنفخ على النضارة علشان تنظفها. خفيف جدًا ومن غير احتكاك.",
  "in most countries: like y. in argentina/uruguay: like 'sh' or 'zh'.":
    "في أغلب البلاد زي Y. وفي الأرجنتين/أوروجواي زي 'sh' أو 'zh'.",
  "pure rounded sound, never becomes 'oh-oo' like in english 'go'.":
    "صوت مدوّر صافي، وما بيتحوّلش لـ 'oh-oo' زي كلمة 'go'.",
  "single r = one quick tap. like american 'butter' or 'water'.":
    "حرف R الواحد = خبطة سريعة واحدة. زي 'butter' أو 'water' بالأمريكي.",
  "in spain: tongue between teeth like 'th' in 'think'. latin america: like s.":
    "في إسبانيا اللسان بين الأسنان زي 'th' في 'think'. وفي أمريكا اللاتينية زي S.",
  "same as a, but marks stressed syllable":
    "نفس صوت A، لكنه بيحدد المقطع المشدد",
  "same as e, but marks stressed syllable":
    "نفس صوت E، لكنه بيحدد المقطع المشدد",
  "same as i, but marks stressed syllable":
    "نفس صوت I، لكنه بيحدد المقطع المشدد",
  "same as o, but marks stressed syllable":
    "نفس صوت O، لكنه بيحدد المقطع المشدد",
  "same as u, but marks stressed syllable":
    "نفس صوت U، لكنه بيحدد المقطع المشدد",
  "like 'e' in 'bed' (same as è)":
    "زي 'e' في 'bed' (نفس صوت È)",
  "same as i - 'ee'":
    "نفس صوت I — 'ee'",
  "same as u - only used in 'où'":
    "نفس صوت U — وبيظهر بس في 'où'",
  "same as u":
    "نفس صوت U",
  "called 'greek i'. same sound as i.":
    "اسمه 'Greek I'. نفس صوت I.",
  "same sound as è. circumflex often marks a historical 's': 'forêt' was 'forest'.":
    "نفس صوت È. والسيركمفلكس غالبًا بيوضح إن كان فيه حرف 's' قديم: 'forêt' كانت 'forest'.",
  "same as a":
    "نفس صوت A",
  "same sound as a. used to distinguish words: 'a' (has) vs 'à' (to/at).":
    "نفس صوت A. وبتستخدم للتفريق بين الكلمات: 'a' و'à'.",
  "slightly longer, back a":
    "A أطول شوية وخلفية",
  "traditionally longer/deeper a. modern french: often same as a.":
    "تقليديًا A أطول وأعمق. وفي الفرنسي الحديث غالبًا نفس صوت A.",
  "nasal 'eh' - like 'an' in 'sang' but nasal":
    "صوت 'eh' أنفي — زي 'an' في 'sang' لكن من الأنف",
  "open mouth like saying 'eh', air through nose.":
    "افتح بقك كأنك بتقول 'eh' وخلي الهوا يطلع من الأنف.",
  "nasal 'uh' - merging with in in modern french":
    "صوت 'uh' أنفي — وبيبقى قريب من IN في الفرنسي الحديث",
  "traditionally distinct from in, now often sounds the same.":
    "تقليديًا كان مختلف عن IN، لكن دلوقتي غالبًا صوته بقى شبهه.",
  "rounded 'eh' - like german ö":
    "صوت 'eh' مدوّر — زي Ö الألمانية",
  "say 'eh' but round your lips. like a rounded 'uh'.":
    "قول 'eh' لكن دوّر شفايفك. شبه 'uh' مدوّرة.",
  "rolled/trilled r":
    "R متدحرجة",
  "always trilled! single r = light trill, rr = strong trill. like spanish r.":
    "R هنا دايمًا متدحرجة! الـR الواحدة خفيفة والـRR قوية، زي R الإسبانية.",
  "held longer, with brief pause":
    "بتتقال أطول شوية مع وقفة قصيرة",
  "italian doubles are pronounced longer! 'fatto' vs 'fato', 'nonna' vs 'nona'. meaning changes!":
    "الحروف المزدوجة في الإيطالي بتتنطق أطول! 'fatto' غير 'fato' و'nonna' غير 'nona'، والمعنى بيتغير.",
  "varies: uvular (back), rolling, or american-style":
    "ممكن تبقى يوڤولار من الخلف، أو متدحرجة، أو على الطريقة الأمريكية",
  "dutch r varies by region! uvular (french-like) is common in the west.":
    "حرف R في الهولندي بيختلف حسب المنطقة! واليوڤولار (زي الفرنسي) شائع في الغرب.",
  "dental t, unaspirated.":
    "حرف T أسناني ومن غير نفس قوي.",
  "short: like 'u' in french 'tu'; long (uu): same but longer":
    "القصير: زي 'u' في 'tu' الفرنسية. والطويل (uu): نفس الصوت لكن أطول.",
  "not like english 'oo'! say 'ee' with rounded lips. unique sound!":
    "مش زي 'oo' في الإنجليزي! قول 'ee' مع تدوير الشفايف. صوت مميز.",
  "between english w and v. more like v than w.":
    "بين W وV في الإنجليزي، لكنه أقرب لـ V.",
  "like 'z' in 'zoo' (or like 's' in some dialects)":
    "زي 'z' في 'zoo' (وأحيانًا زي 's' في بعض اللهجات)",
  "voiced like english z. in belgium often sounds like s.":
    "صوته مجهور زي Z الإنجليزية. وفي بلجيكا أحيانًا يبقى شبه S.",
  "trema shows e is separate syllable: 'geëerd' = ge-eerd (honored).":
    "التريما بتوضح إن E مقطع منفصل: 'geëerd' = ge-eerd.",
  "trema separates vowels: 'egoïst' = e-go-ist.":
    "التريما بتفصل الحركات: 'egoïst' = e-go-ist.",
  "both ou and au make the same sound in dutch.":
    "OU وAU بيدوا نفس الصوت في الهولندي.",
  "ei and ij sound the same! spelling difference is historical.":
    "EI وIJ نفس الصوت! والفرق في الكتابة تاريخي.",
  "same guttural sound as g":
    "نفس الصوت الحلقي بتاع G",
  "ch and g make the same guttural sound!":
    "CH وG بيدوا نفس الصوت الحلقي!",
  "short: like 'e' in 'bed'; long: like 'ay' without glide":
    "القصير: زي 'e' في 'bed'. والطويل: زي 'ay' من غير انزلاق.",
  "unstressed e at end often sounds like schwa (uh): 'katze' = 'katz-uh'.":
    "حرف E غير المشدد في الآخر غالبًا بيبقى شبه schwa 'uh': 'Katze' = 'Katz-uh'.",
  "uvular r from back of throat, or vocalized to 'uh'":
    "R يوڤولار من آخر الزور، أو أحيانًا تبقى شبه 'uh'",
  "standard german r is uvular (french-like). after vowels often becomes 'uh'.":
    "الـR القياسية في الألماني يوڤولار (زي الفرنسي). وبعد الحركات غالبًا بتبقى شبه 'uh'.",
  "'dee-ah gwit' - god be with you":
    "'دي-اه جويت' — الله يكون معك",
  "'slawn-cha' - health!":
    "'سلون-خا' — في صحتك!",
  "'ha' (sometimes read 'wa' as a particle)":
    "'ها' (وأحيانًا تُقرأ 'وا' لما تبقى أداة)",
  "'ma'":
    "'ما'",
  "'na'":
    "'نا'",
  "'ta' with a dental t":
    "'تا' مع حرف T أسناني",
  "'wa'":
    "'وا'",
  "'ya'":
    "'يا'",
  "a soft 'gh', like the 'ch' in spanish 'lago'":
    "غين خفيفة، زي 'ch' في الإسبانية 'lago'",
  "animate noun ending":
    "نهاية اسم للكائن الحي",
  "clear l (spanish-like)":
    "L واضحة (زي الإسباني)",
  "dental t, unaspirated":
    "حرف T أسناني ومن غير نفس قوي",
  "glottal stop (brief catch)":
    "وقفة حنجرية (قفلة سريعة)",
  "hard 'ch' - like clearing throat, made at back of mouth":
    "صوت 'ch' قوي، زي التنحنح، وبيطلع من آخر الفم",
  "like 'd' in 'dog', or 'j' sound when slender":
    "زي 'd' في 'dog'، أو زي صوت 'j' لما يبقى رفيع",
  "like 'h' in 'hello', or modifies consonants (lenition)":
    "زي 'h' في 'hello'، أو بيغيّر نطق الحروف الساكنة (لينيشن)",
  "like 'l' in 'love', or palatalized when slender":
    "زي 'l' في 'love'، أو يبقى محنكي لما يبقى رفيع",
  "like 's' in 'sun', or 'sh' when slender":
    "زي 's' في 'sun'، أو 'sh' لما يبقى رفيع",
  "like 't' in 'top', or 'ch' when slender":
    "زي 't' في 'top'، أو 'ch' لما يبقى رفيع",
  "long 'aw' sound like in 'law'":
    "صوت 'aw' طويل زي 'law'",
  "long 'ay' sound like in 'say'":
    "صوت 'ay' طويل زي 'say'",
  "long 'ee' sound like in 'see'":
    "صوت 'ee' طويل زي 'see'",
  "long 'oh' sound like in 'go'":
    "صوت 'oh' طويل زي 'go'",
  "long 'oo' sound like in 'moon'":
    "صوت 'oo' طويل زي 'moon'",
  "open 'a' like in 'father'":
    "صوت 'a' مفتوح زي 'father'",
  "rolled/trill 'r'":
    "R متدحرجة",
  "short 'a' like in 'cat' or long 'aw' like in 'law'":
    "صوت 'a' قصير زي 'cat' أو 'aw' طويل زي 'law'",
  "short 'e' like in 'bet'":
    "صوت 'e' قصير زي 'bet'",
  "short 'i' like in 'bit'":
    "صوت 'i' قصير زي 'bit'",
  "short 'o' like in 'hot'":
    "صوت 'o' قصير زي 'hot'",
  "short 'u' like in 'put'":
    "صوت 'u' قصير زي 'put'",
  "single-tap 'ra/la'":
    "خبطة واحدة سريعة 'ra/la'",
  "soft 'ch' - like hissing cat, made at front of mouth":
    "صوت 'ch' خفيف، زي فحيح القطة، وبيطلع من قدام الفم",
  "voiceless lateral affricate":
    "صوت احتكاكي جانبي مهموس",
  "in german words, y sounds like ü. in foreign words, varies.":
    "في الكلمات الألمانية Y بتاخد صوت Ü. وفي الكلمات الأجنبية ممكن يختلف.",
  "ä is a with two dots (umlaut). sounds like e! 'männer' = men.":
    "Ä هي A بنقطتين (أوملاوت). وصوتها قريب من E! 'Männer' = رجال.",
  "after e, i, ä, ö, ü, and consonants: soft ch. like a breathy 'sh' but further forward.":
    "بعد e وi وä وö وü وبعد الحروف الساكنة: CH خفيفة، زي 'sh' نفسية لكنها لقدّام أكتر.",
  "after a, o, u, au: hard ch. like scottish 'loch' or spanish j.":
    "بعد a وo وu وau: CH قوية، زي 'loch' الاسكتلندية أو J الإسبانية.",
  "hiragana (あ) and katakana (ア) share the same sound.":
    "الهيراغانا (あ) والكاتاكانا (ア) ليهم نفس الصوت.",
  "can sound like m/n/ŋ depending on following sounds; counts as its own mora.":
    "ممكن تتنطق m أو n أو ŋ حسب الصوت اللي بعدها، وبتتحسب مورا لوحدها.",
  "a light trill; practice with quick taps like in spanish 'pero'.":
    "رعشة خفيفة؛ اتدرّب عليها بخبطات سريعة زي الإسباني 'pero'.",
  "crisp, unaspirated k.":
    "حرف K واضح ومن غير نفس قوي.",
  "blend k + s smoothly.":
    "ادمج K وS بسلاسة.",
  "unaspirated p.":
    "حرف P من غير نفس قوي.",
  "crisp t without aspiration.":
    "حرف T واضح ومن غير نفس قوي.",
  "same vowel as eta/iota in modern greek.":
    "نفس الحركة بتاعة Eta وIota في اليوناني الحديث.",
  "blend p + s together.":
    "ادمج P وS مع بعض.",
  "nasalized 'e'. at word end, often just sounds like regular 'e'.":
    "صوت 'e' أنفي. وفي آخر الكلمة غالبًا بيبقى زي 'e' العادية.",
  "always hard g, never soft like in 'gem'.":
    "حرف G دايمًا قوي، ومش ناعم زي 'gem'.",
  "sounds like u, not o! same as polish u.":
    "صوته زي U مش O! ونفس صوت U البولندية.",
  "same sound as ó. rounded lips, 'oo' sound.":
    "نفس صوت Ó. دوّر شفايفك وخليه صوت 'oo'.",
  "like the 's' in 'measure' or 'vision'.":
    "زي صوت 's' في 'measure' أو 'vision'.",
  "short a is common. can be broad (back) or slender (front) depending on context.":
    "A القصيرة شائعة. وممكن تبقى عريضة (خلفية) أو رفيعة (أمامية) حسب السياق.",
  "always hard like k, never soft. with h (ch), sounds like german 'ch'.":
    "دايمًا قوي زي K، ومش ناعم أبدًا. ومع H (ch) يبقى زي 'ch' الألمانية.",
  "broad d is like english. slender d (before e, i) has a 'j' quality.":
    "D العريضة زي الإنجليزي. والـD الرفيعة (قبل e وi) فيها لمسة 'j'.",
  "short e sound. one of the slender vowels (e, i).":
    "صوت E قصير. ودي واحدة من الحركات الرفيعة (e وi).",
  "h often follows consonants to show lenition (softening). changes the sound completely.":
    "حرف H بييجي بعد الحروف الساكنة كتير علشان يوضح اللينيشن (التليين)، وبيغيّر الصوت تمامًا.",
  "short i. a slender vowel that affects surrounding consonants.":
    "I قصيرة، وهي حركة رفيعة بتأثر على الحروف اللي حواليها.",
  "broad l is like english. slender l is lighter, tongue higher.":
    "L العريضة زي الإنجليزي، والـL الرفيعة أخف واللسان فيها أعلى.",
  "broad n is standard. slender n is lighter, almost like 'ny'.":
    "N العريضة هي العادية، والـN الرفيعة أخف وشبه 'ny'.",
  "short o. a broad vowel (a, o, u).":
    "O قصيرة، ودي حركة عريضة (a وo وu).",
  "can be rolled or tapped. slender r is lighter.":
    "ممكن تتدحرج أو تبقى خبطة سريعة. والـR الرفيعة أخف.",
  "broad s is like english s. slender s (before e, i) sounds like 'sh'!":
    "S العريضة زي S الإنجليزية. والـS الرفيعة (قبل e وi) صوتها زي 'sh'!",
  "broad t is standard. slender t (before e, i) has a 'ch' quality.":
    "T العريضة هي العادية. والـT الرفيعة (قبل e وi) فيها لمسة 'ch'.",
  "short u. a broad vowel.":
    "U قصيرة، ودي حركة عريضة.",
  "write **kw** (not cu/uc).":
    "اكتب **kw** (مش cu/uc).",
  "replaces hu/uh.":
    "بتاخد مكان hu/uh.",
  "dental/alveolar, spanish-like.":
    "أسناني/لثوي، وزيه زي الإسباني.",
  "replaces tz.":
    "بتاخد مكان tz.",
  "write with apostrophe (ʼ). changes meaning.":
    "اكتبها بعلامة أبستروف (ʼ). وده بيغيّر المعنى.",
  "kal- + -li → kali.":
    "kal- + -li → kali.",
  "english is stress-timed. stressed syllables stand out. photograph vs photographer.":
    "الإنجليزي بيعتمد على النبرة. المقاطع المشددة بتبان بوضوح. 'فوتوجراف' مقابل 'فوتوجرافر'.",
  "makes the u audible in güe/güi: 'pingüino' = pin-gwi-no, not 'pin-gi-no'.":
    "بتخلّي حرف U مسموع في güe/güi: 'pingüino' = 'pin-gwi-no' مش 'pin-gi-no'.",
  "silent like in spanish. only matters in digraphs: ch, lh, nh.":
    "صامت زي الإسباني. أهميته بس في تركيبات الحروف زي 'ch' و'lh' و'nh'.",
  "most common: 'sh' (xícara). also 'ks' (táxi), 'z' (exame), 's' (próximo).":
    "الأكثر شيوعًا 'sh' زي 'xícara'. وممكن كمان 'ks' في 'táxi' أو 'z' في 'exame' أو 's' في 'próximo'.",
  "only appears in 'où' (where) to distinguish from 'ou' (or).":
    "بتظهر بس في 'où' علشان تفرّقها عن 'ou'.",
  "trema shows e is separate syllable: 'geëerd' = ge-eerd (honored).":
    "التريما بتوضح إن E مقطع منفصل: 'geëerd' = 'ge-eerd'.",
  "trema separates vowels: 'egoïst' = e-go-ist.":
    "التريما بتفصل الحركات: 'egoïst' = 'e-go-ist'.",
  "unstressed e at end often sounds like schwa (uh): 'katze' = 'katz-uh'.":
    "حرف E غير المشدد في الآخر غالبًا بيبقى شبه 'schwa' أو 'uh': 'Katze' = 'Katz-uh'.",
  "same vowel as eta/iota in modern greek.":
    "نفس الحركة بتاعة إيتا وأيوتا في اليوناني الحديث.",
  "kal- + -li → kali.":
    "'kal-' + '-li' = 'kali'.",
};

const PHRASE_REPLACEMENTS = [
  ["Same as English", "زي الإنجليزي"],
  ["Same as Spanish", "زي الإسباني"],
  ["Same as Portuguese", "زي البرتغالي"],
  ["Same as Italian", "زي الإيطالي"],
  ["Same as French", "زي الفرنسي"],
  ["Same as German", "زي الألماني"],
  ["Same as Dutch", "زي الهولندي"],
  ["Same as Polish", "زي البولندي"],
  ["Same as Russian", "زي الروسي"],
  ["Same as Greek", "زي اليوناني"],
  ["Same as Irish", "زي الأيرلندي"],
  ["Same as Japanese", "زي الياباني"],
  ["Same as Nahuatl", "زي الناواتل"],
  ["Same as Yucatec Maya", "زي المايا اليوكاتيكية"],
  ["Like English", "زي الإنجليزي"],
  ["Like Spanish", "زي الإسباني"],
  ["Like French", "زي الفرنسي"],
  ["Like German", "زي الألماني"],
  ["Like Portuguese", "زي البرتغالي"],
  ["Like Italian", "زي الإيطالي"],
  ["Like Dutch", "زي الهولندي"],
  ["Like Polish", "زي البولندي"],
  ["Like Russian", "زي الروسي"],
  ["Like Greek", "زي اليوناني"],
  ["Like Irish", "زي الأيرلندي"],
  ["Like Japanese", "زي الياباني"],
  ["At the end of a word", "في آخر الكلمة"],
  ["At the end of words", "في آخر الكلمات"],
  ["At the end of a syllable", "في آخر المقطع"],
  ["At the end of syllables", "في آخر المقاطع"],
  ["At the beginning of a word", "في أول الكلمة"],
  ["At the beginning of words", "في أول الكلمات"],
  ["At the beginning", "في البداية"],
  ["At the end", "في النهاية"],
  ["Between vowels", "بين الحركات"],
  ["Before e/i", "قبل e/i"],
  ["Before a/o/u", "قبل a/o/u"],
  ["Before front vowels", "قبل الحركات الأمامية"],
  ["After n", "بعد n"],
  ["After m", "بعد m"],
  ["With rounded lips", "مع تدوير الشفايف"],
  ["With spread lips", "والشفايف مفرودة"],
  ["Keep lips rounded", "خلي الشفايف مدوّرة"],
  ["Tip of tongue", "طرف اللسان"],
  ["Front of tongue", "مقدمة اللسان"],
  ["Back of tongue", "آخر اللسان"],
  ["Soft palate", "الحنك الرخو"],
  ["Hard palate", "الحنك الصلب"],
  ["Air through nose", "الهوا من الأنف"],
  ["Air goes through nose", "الهوا بيطلع من الأنف"],
  ["Through the nose", "من الأنف"],
  ["Usually silent", "غالبًا صامت"],
  ["Always silent", "دايمًا صامت"],
  ["Never silent", "مش صامت أبدًا"],
  ["Not silent", "مش صامت"],
  ["Stress this syllable", "شد النبرة على المقطع ده"],
  ["Stress this word", "شد النبرة على الكلمة دي"],
  ["Used mostly in borrowed words", "بيستخدم غالبًا في الكلمات الدخيلة"],
  ["Used mostly in foreign words", "بيستخدم غالبًا في الكلمات الأجنبية"],
  ["Pronounced like", "يتنطق زي"],
  ["Similar to", "شبه"],
  ["Used in", "بيتستخدم في"],
  ["Found in", "بيظهر في"],
  ["Open mouth", "افتح بقك"],
  ["Round your lips", "دوّر شفايفك"],
  ["Keep the vowel open and steady", "خلي الحركة مفتوحة وثابتة"],
  ["Round lips into a tight circle", "لفّ شفايفك على شكل دايرة ضيقة"],
  ["Upper teeth touch lower lip", "الأسنان العليا تلمس الشفة السفلى"],
  ["tongue between teeth", "اللسان بين الأسنان"],
  ["no voice", "من غير صوت"],
  ["tongue pulled back", "اللسان راجع لورا"],
  ["voiced CH", "CH مجهورة"],
  ["voiced SH", "SH مجهورة"],
  ["back of throat", "آخر الزور"],
  ["completely relax mouth", "ريّح بقك تمامًا"],
  ["appears in unstressed syllables", "بيظهر في المقاطع غير المشددة"],
  ["always consistent", "ثابتة دايمًا"],
  ["tongue touches roof behind teeth", "اللسان بيلمس سقف الحلق ورا الأسنان"],
  ["Same rules as Spanish and Portuguese.", "نفس قواعد الإسباني والبرتغالي."],
  ["used to mark stress", "بتستخدم علشان تحدد النبرة"],
  ["same sound as unstressed I", "نفس صوت I غير المشدد"],
  ["same sound as unstressed U", "نفس صوت U غير المشدد"],
  ["No sound", "مفيش صوت"],
  ["marks beginning of exclamation", "وبيحدد بداية التعجب"],
  ["marks beginning of question", "وبيحدد بداية السؤال"],
  ["most regions", "أغلب المناطق"],
  ["Latin America", "أمريكا اللاتينية"],
  ["Argentina", "الأرجنتين"],
  ["Spain", "إسبانيا"],
  ["Brazil", "البرازيل"],
  ["Portugal", "البرتغال"],
  ["Native words", "الكلمات الأصلية"],
  ["borrowed words", "الكلمات الدخيلة"],
  ["historical spelling", "تهجئة تاريخية"],
  ["stressed syllables", "المقاطع المشددة"],
  ["dental, unaspirated", "أسناني ومن غير نفس قوي"],
];

const TOKEN_REPLACEMENTS = [
  ["word", "كلمة"],
  ["words", "كلمات"],
  ["letter", "حرف"],
  ["letters", "حروف"],
  ["sound", "صوت"],
  ["sounds", "أصوات"],
  ["vowel", "حركة"],
  ["vowels", "حركات"],
  ["consonant", "حرف ساكن"],
  ["consonants", "حروف ساكنة"],
  ["silent", "صامت"],
  ["always", "دايمًا"],
  ["never", "أبدًا"],
  ["before", "قبل"],
  ["after", "بعد"],
  ["beginning", "البداية"],
  ["end", "النهاية"],
  ["open", "مفتوح"],
  ["closed", "مقفول"],
  ["short", "قصير"],
  ["long", "طويل"],
  ["soft", "لين"],
  ["hard", "قوي"],
  ["rounded", "مدوّر"],
  ["lips", "الشفايف"],
  ["tongue", "اللسان"],
  ["mouth", "البق"],
  ["nose", "الأنف"],
  ["air", "الهوا"],
  ["english", "الإنجليزي"],
  ["spanish", "الإسباني"],
  ["portuguese", "البرتغالي"],
  ["italian", "الإيطالي"],
  ["french", "الفرنسي"],
  ["german", "الألماني"],
  ["dutch", "الهولندي"],
  ["polish", "البولندي"],
  ["russian", "الروسي"],
  ["greek", "اليوناني"],
  ["irish", "الأيرلندي"],
  ["japanese", "الياباني"],
  ["nahuatl", "الناواتل"],
  ["maya", "المايا"],
  ["stress", "نبرة"],
  ["accent", "أكسنت"],
  ["voiced", "مجهور"],
  ["unvoiced", "مهموس"],
  ["guttural", "حلقي"],
  ["the", ""],
  ["or", "أو"],
  ["and", "و"],
  ["this", "ده"],
  ["that", "ده"],
  ["these", "دول"],
  ["those", "دول"],
  ["very", "جدا"],
  ["small", "صغيرة"],
  ["large", "كبيرة"],
  ["wide", "واسع"],
  ["starts", "يبدأ"],
  ["start", "ابدأ"],
  ["rises", "يرتفع"],
  ["toward", "نحو"],
  ["back", "الخلف"],
  ["almost", "تقريبًا"],
  ["used", "مستخدم"],
  ["use", "استخدم"],
  ["native", "أصلي"],
  ["borrowed", "دخيل"],
  ["spelled", "مكتوب"],
  ["origin", "أصل"],
  ["people", "ناس"],
  ["article", "أداة"],
  ["exclamation", "تعجب"],
  ["question", "سؤال"],
  ["questions", "أسئلة"],
  ["combined", "مركب"],
  ["then", "بعدين"],
  ["pulls", "يسحب"],
  ["puff", "دفعة هوا"],
  ["tight", "مشدودة"],
  ["tense", "مشدود"],
  ["glides", "ينزلق"],
  ["pronounced", "يتنطق"],
  ["aren't", "مش"],
  ["historical", "تاريخي"],
  ["spelling", "إملاء"],
  ["varies", "بيختلف"],
  ["countries", "بلاد"],
  ["depends", "بيعتمد"],
  ["depending", "حسب"],
  ["round", "دوّر"],
  ["release", "فك"],
  ["upper", "علوية"],
  ["lower", "سفلى"],
  ["teeth", "أسنان"],
  ["touch", "يلمس"],
  ["neutral", "محايد"],
  ["unstressed", "غير مشدد"],
  ["consistent", "ثابت"],
  ["quick", "سريع"],
  ["whisper", "همس"],
  ["vibration", "اهتزاز"],
  ["vocal", "صوتي"],
  ["cord", "وتر"],
  ["pitch", "نبرة"],
  ["american", "أمريكي"],
  ["depends", "يعتمد"],
  ["depending", "حسب"],
  ["region", "منطقة"],
  ["regions", "مناطق"],
  ["most", "أغلب"],
  ["common", "شائع"],
  ["rare", "نادر"],
  ["light", "خفيف"],
  ["behind", "ورا"],
  ["roof", "سقف"],
  ["distinguish", "يفرّق"],
  ["mark", "يحدد"],
  ["marks", "يحدد"],
  ["emphasis", "تأكيد"],
  ["only", "فقط"],
  ["appears", "بتظهر"],
  ["different", "مختلف"],
  ["final", "أخير"],
  ["usually", "غالبًا"],
  ["through", "من خلال"],
  ["tight", "ضيقة"],
  ["circle", "دايرة"],
  ["bite", "عض"],
  ["gently", "برفق"],
  ["hum", "طنين"],
  ["release", "افتح"],
  ["pulled", "راجع"],
  ["common", "شائع"],
];

const RESIDUAL_LATIN_WORD_TRANSLATIONS = {
  in: "في",
  of: "بتاع",
  at: "في",
  but: "لكن",
  it: "هو",
  with: "مع",
  is: "هو",
  to: "لـ",
  from: "من",
  keep: "خلي",
  than: "من",
  touches: "بيلمس",
  touch: "يلمس",
  pure: "صافي",
  often: "غالبًا",
  unaspirated: "من غير نفس قوي",
  not: "مش",
  no: "مفيش",
  standard: "عادي",
  stressed: "مشدد",
  nasal: "أنفي",
  has: "فيه",
  less: "أقل",
  foreign: "أجنبية",
  for: "علشان",
  ridge: "اللثة",
  when: "لما",
  diphthong: "ديفثونج",
  diphthongs: "ديفثونجات",
  tap: "خبطة",
  smile: "ابتسامة",
  slightly: "شوية",
  as: "كـ",
  uses: "بيستخدم",
  on: "على",
  both: "الاتنين",
  feel: "حس",
  without: "من غير",
  glide: "ينزلق",
  changes: "بيتغير",
  some: "بعض",
  together: "مع بعض",
  by: "حسب",
  dental: "أسناني",
  are: "بيبقوا",
  makes: "بيعمل",
  make: "اعمل",
  more: "أكتر",
  clear: "واضح",
  middle: "النص",
  relaxed: "مسترخي",
  relax: "ريّح",
  two: "اتنين",
  rolled: "متدحرجة",
  syllable: "مقطع",
  syllables: "مقاطع",
  one: "واحد",
  quickly: "بسرعة",
  unique: "مميز",
  alone: "لوحده",
  shorter: "أقصر",
  add: "ضيف",
  separate: "منفصل",
  pronounce: "انطق",
  followed: "متبوع بـ",
  practice: "اتدرّب",
  regional: "إقليمي",
  variation: "اختلاف",
  dialects: "لهجات",
  close: "اقفل",
  high: "عالي",
  low: "واطي",
  spread: "افرد",
  raise: "ارفع",
  drop: "نزّل",
  jaw: "الفك",
  central: "وسطي",
  throughout: "طول الوقت",
  tighter: "أضيق",
  raised: "مرفوع",
  formerly: "زمان",
  strong: "قوي",
  stronger: "أقوى",
  friction: "احتكاك",
  fully: "تمامًا",
  distinct: "مختلف",
  exactly: "بالضبط",
  itself: "لوحده",
  quality: "جودة",
  initial: "في البداية",
  final: "في النهاية",
  breathy: "نفَسي",
  counts: "بتتحسب",
  count: "احسب",
  own: "لوحده",
  mora: "مورا",
  plural: "جمع",
  context: "السياق",
  pair: "قارن",
  pairs: "أزواج",
  called: "اسمها",
  means: "معناها",
  mostly: "غالبًا",
  speech: "الكلام",
  length: "الطول",
  dark: "غامقة",
  bright: "فاتحة",
  version: "نسخة",
  lenited: "ملين",
  literally: "حرفيًا",
  replaces: "بياخد مكان",
  replace: "استبدل",
  place: "حط",
  your: "",
  vibrate: "اهز",
  cords: "الأحبال",
  buzz: "طنين",
  curl: "لف",
  floats: "بيفضل",
  between: "بين",
  closer: "أقرب",
  everything: "كل حاجة",
  short: "قصير",
  long: "طويل",
  soft: "خفيف",
  hard: "قوي",
  straightforward: "مباشر",
  because: "علشان",
  only: "فقط",
};

const localizeResidualLatinText = (text) =>
  String(text || "")
    .split(/('(?:[^']*)'|"(?:[^"]*)")/g)
    .map((segment) => {
      if (!segment || /^'(?:[^']*)'$/.test(segment) || /^"(?:[^"]*)"$/.test(segment)) {
        return segment;
      }

      return segment.replace(/[A-Za-zÀ-ÖØ-öø-ÿ]+/gu, (word) => {
        const normalized = normalizeComparableKey(word);
        const translated =
          RESIDUAL_LATIN_WORD_TRANSLATIONS[normalized] ||
          translateAlphabetNameTokenToArabic(word) ||
          transliterateLatinTokenToArabic(word);
        return translated || word;
      });
    })
    .join("");

const SOURCE_LEAK_PATTERN =
  /\b(?:same|like|before|after|sound|word|words|letter|letters|vowel|vowels|consonant|consonants|english|spanish|portuguese|italian|french|german|dutch|polish|russian|greek|irish|japanese|nahuatl|maya|silent|stress|accent|rounded|tongue|lips|mouth|nose|air|voiced|unvoiced|guttural|slender|broad|lenition|tréma|trema)\b/i;

const finalizeInstruction = (value, source) => {
  const candidate = compactWhitespace(value);
  if (!candidate) return "";
  if (normalizeKey(candidate) === normalizeKey(source)) return "";
  if (SOURCE_LEAK_PATTERN.test(candidate)) return "";
  return candidate;
};

export const translateAlphabetMeaningToArabic = (meaning) => {
  if (!meaning) return "";
  if (typeof meaning === "string") {
    const exact = EXACT_ALPHABET_MEANING_TRANSLATIONS[normalizeKey(meaning)];
    return exact || translateFlashcardConceptToArabic(meaning) || meaning;
  }

  const source =
    meaning.ar ||
    meaning.en ||
    meaning.es ||
    meaning.pt ||
    meaning.it ||
    meaning.fr ||
    meaning.ja ||
    meaning.hi ||
    "";

  if (!source) return "";

  const exact = EXACT_ALPHABET_MEANING_TRANSLATIONS[normalizeKey(source)];
  return exact || translateFlashcardConceptToArabic(source) || source;
};

export const translateAlphabetNameToArabic = (value, letter = null) => {
  const source = String(value || "").trim();
  if (!source) return "";

  if (letter?.type === "phrase") {
    const phraseMeaning = translateAlphabetMeaningToArabic(
      letter.practiceWordMeaning,
    );
    if (phraseMeaning) return phraseMeaning;
  }

  const direct = EXACT_NAME_TRANSLATIONS[normalizeKey(source)];
  if (direct) return direct;

  const flashcardTranslation = translateFlashcardConceptToArabic(source);
  if (flashcardTranslation && flashcardTranslation !== source) {
    return flashcardTranslation;
  }

  for (const [pattern, format] of NAME_PATTERNS) {
    const match = source.match(pattern);
    if (match) return format(...match.slice(1));
  }

  return translateCompositeAlphabetNameToArabic(source);
};

export const translateAlphabetInstructionToArabic = (instruction) => {
  const source = String(instruction || "").trim();
  if (!source) return "";

  const exact = EXACT_INSTRUCTION_TRANSLATIONS[normalizeKey(source)];
  if (exact) return exact;

  let translated = source;

  for (const [phrase, replacement] of PHRASE_REPLACEMENTS) {
    translated = replacePhrase(translated, phrase, replacement);
  }

  translated = translated
    .replace(
      /\blike\s+'([^']+)'\s+in\s+'([^']+)'/giu,
      (_, sound, word) => `زي '${sound}' في '${word}'`,
    )
    .replace(
      /\bsame as\s+'([^']+)'\s+in\s+'([^']+)'/giu,
      (_, sound, word) => `زي '${sound}' في '${word}'`,
    )
    .replace(/\blike\s+'([^']+)'/giu, (_, sound) => `زي '${sound}'`)
    .replace(/\bsay\s+'([^']+)'/giu, (_, sound) => `قول '${sound}'`)
    .replace(/\bbefore\s+([A-Za-z/]+)/giu, (_, context) => `قبل ${context}`);

  for (const [token, replacement] of TOKEN_REPLACEMENTS) {
    translated = replaceToken(translated, token, replacement);
  }

  translated = localizeResidualLatinText(translated);

  return finalizeInstruction(translated, source);
};

const addArabicAlphabetCopy = (letter) => {
  if (!letter || typeof letter !== "object") return letter;

  const sourceSound = letter.sound || letter.soundEs || "";
  const sourceTip = letter.tip || letter.tipEs || "";
  const practiceWordMeaning = letter.practiceWordMeaning || {};

  return {
    ...letter,
    nameAr: letter.nameAr || translateAlphabetNameToArabic(letter.name, letter),
    soundAr: letter.soundAr || translateAlphabetInstructionToArabic(sourceSound),
    tipAr: letter.tipAr || translateAlphabetInstructionToArabic(sourceTip),
    practiceWordMeaning: {
      ...practiceWordMeaning,
      ar:
        practiceWordMeaning.ar ||
        translateAlphabetMeaningToArabic(practiceWordMeaning),
    },
  };
};

export const withArabicAlphabetSupport = (letters = []) =>
  Array.isArray(letters) ? letters.map(addArabicAlphabetCopy) : letters;
