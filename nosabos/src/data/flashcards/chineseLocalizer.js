/**
 * Adds Mandarin Chinese support-language concepts to flashcard payloads.
 */

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const EXACT_TRANSLATIONS = {
  hello: "你好",
  hi: "嗨",
  goodbye: "再见",
  bye: "拜拜",
  please: "请",
  "thank you": "谢谢",
  "you're welcome": "不客气",
  "excuse me": "打扰一下",
  sorry: "对不起",
  "i'm sorry": "对不起",
  yes: "是",
  no: "不是",
  maybe: "也许",
  okay: "好的",
  "how are you?": "你好吗？",
  "nice to meet you": "很高兴认识你",
  "have a good day": "祝你今天愉快",
  "see you later": "待会儿见",
  "see you soon": "很快见",
  "see you tomorrow": "明天见",
  "good morning": "早上好",
  "good afternoon": "下午好",
  "good evening": "晚上好",
  "good night": "晚安",
  "what's up?": "最近怎么样？",
  congratulations: "恭喜",
  "happy birthday": "生日快乐",
  "happy new year": "新年快乐",
  welcome: "欢迎",
  pardon: "请再说一遍",
  name: "名字",
  age: "年龄",
  from: "来自",
  where: "哪里",
  who: "谁",
  what: "什么",
  when: "什么时候",
  why: "为什么",
  how: "怎么",
  which: "哪一个",
  i: "我",
  you: "你",
  he: "他",
  she: "她",
  we: "我们",
  they: "他们",
  "my name is...": "我的名字是……",
  "i'm from...": "我来自……",
  "where are you from?": "你来自哪里？",
  "how old are you?": "你多大？",
  "this is my friend...": "这是我的朋友……",
  "i live in...": "我住在……",
  "i speak...": "我会说……",
  "do you speak english?": "你会说英语吗？",
  country: "国家",
  city: "城市",
  language: "语言",
  zero: "零",
  one: "一",
  two: "二",
  three: "三",
  four: "四",
  five: "五",
  six: "六",
  seven: "七",
  eight: "八",
  nine: "九",
  ten: "十",
  eleven: "十一",
  twelve: "十二",
  thirteen: "十三",
  fourteen: "十四",
  fifteen: "十五",
  sixteen: "十六",
  seventeen: "十七",
  eighteen: "十八",
  nineteen: "十九",
  twenty: "二十",
  today: "今天",
  tomorrow: "明天",
  yesterday: "昨天",
  now: "现在",
  later: "稍后",
  morning: "早上",
  afternoon: "下午",
  evening: "晚上",
  night: "夜晚",
  monday: "星期一",
  tuesday: "星期二",
  wednesday: "星期三",
  thursday: "星期四",
  friday: "星期五",
  saturday: "星期六",
  sunday: "星期日",
  food: "食物",
  water: "水",
  bread: "面包",
  milk: "牛奶",
  coffee: "咖啡",
  tea: "茶",
  rice: "米饭",
  meat: "肉",
  fish: "鱼",
  fruit: "水果",
  apple: "苹果",
  banana: "香蕉",
  orange: "橙子",
  vegetable: "蔬菜",
  salt: "盐",
  sugar: "糖",
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
  home: "家",
  house: "房子",
  room: "房间",
  kitchen: "厨房",
  bathroom: "洗手间",
  bedroom: "卧室",
  table: "桌子",
  chair: "椅子",
  door: "门",
  window: "窗户",
  book: "书",
  pen: "笔",
  pencil: "铅笔",
  paper: "纸",
  phone: "手机",
  computer: "电脑",
  school: "学校",
  work: "工作",
  teacher: "老师",
  student: "学生",
  friend: "朋友",
  family: "家庭",
  mother: "母亲",
  father: "父亲",
  mom: "妈妈",
  dad: "爸爸",
  brother: "兄弟",
  sister: "姐妹",
  grandfather: "祖父",
  grandmother: "祖母",
  child: "孩子",
  baby: "婴儿",
  boy: "男孩",
  girl: "女孩",
  man: "男人",
  woman: "女人",
  person: "人",
  big: "大",
  small: "小",
  good: "好",
  bad: "坏",
  new: "新",
  old: "旧",
  hot: "热",
  cold: "冷",
  happy: "开心",
  sad: "难过",
  tired: "累",
  sick: "生病",
  red: "红色",
  blue: "蓝色",
  green: "绿色",
  yellow: "黄色",
  black: "黑色",
  white: "白色",
  purple: "紫色",
  pink: "粉色",
  brown: "棕色",
  gray: "灰色",
  car: "汽车",
  bus: "公交车",
  train: "火车",
  taxi: "出租车",
  airport: "机场",
  station: "车站",
  ticket: "票",
  left: "左",
  right: "右",
  straight: "直走",
  "turn left": "向左转",
  "turn right": "向右转",
  "go straight": "直走",
  "where is the bathroom?": "洗手间在哪里？",
  "how much?": "多少钱？",
  "too expensive": "太贵了",
  "i would like...": "我想要……",
  "i'm hungry": "我饿了",
  "i'm thirsty": "我渴了",
  "the check, please": "请结账",
  "a table for two": "两人桌",
  "menu, please": "请给我菜单",
  vegetarian: "素食",
  spicy: "辣的",
  "no ice, please": "请不要冰",
  "to go": "打包",
  help: "帮助",
  "can you help me?": "你能帮我吗？",
  "i don't know": "我不知道",
  "i understand": "我明白",
  "i don't understand": "我不明白",
  "can you repeat that?": "你能重复一遍吗？",
  "can you speak more slowly?": "你能说慢一点吗？",
  "what does that mean?": "那是什么意思？",
  "how do you say...?": "……怎么说？",
  "i speak a little": "我会说一点",
  "i'm learning": "我正在学习",
  "good luck!": "祝你好运！",
  "take care": "保重",
  "by the way": "顺便说一下",
  "never mind": "没关系",
  "i agree": "我同意",
  "i disagree": "我不同意",
  "you're right": "你说得对",
  "that's true": "那是真的",
  really: "真的吗",
  "really?": "真的吗？",
  "of course": "当然",
  "no problem": "没问题",
  "it depends": "看情况",
  "i'm not sure": "我不确定",
  "maybe later": "也许稍后",
  "not now": "现在不",
  weather: "天气",
  future: "未来",
  education: "教育",
  culture: "文化",
  environment: "环境",
  technology: "科技",
  government: "政府",
  economy: "经济",
  art: "艺术",
  beauty: "美",
  goal: "目标",
  problem: "问题",
  solution: "解决方案",
  experience: "经历",
  memory: "记忆",
  story: "故事",
  emotion: "情绪",
  calm: "平静",
  relaxed: "放松",
  surprised: "惊讶",
  confused: "困惑",
  grateful: "感激",
  proud: "自豪",
  drink: "饮品",
  drinks: "饮品",
};

const CONNECTOR_TRANSLATIONS = {
  and: "和",
  or: "或",
  with: "带有",
  without: "没有",
  in: "在",
  by: "通过",
  from: "来自",
  about: "关于",
};

function singularize(value) {
  if (value.endsWith("ies")) return `${value.slice(0, -3)}y`;
  if (value.endsWith("es")) return value.slice(0, -2);
  if (value.endsWith("s")) return value.slice(0, -1);
  return value;
}

function translateWord(value) {
  const normalized = normalizeKey(value).replace(/[?!.,]/g, "");
  if (EXACT_TRANSLATIONS[normalized]) return EXACT_TRANSLATIONS[normalized];
  const singular = singularize(normalized);
  if (EXACT_TRANSLATIONS[singular]) return EXACT_TRANSLATIONS[singular];
  return "";
}

function translateFragment(value) {
  const source = String(value || "").trim();
  if (!source) return "";
  const exact = EXACT_TRANSLATIONS[normalizeKey(source)];
  if (exact) return exact;

  const normalized = normalizeKey(source).replace(/[?!.,]/g, "");
  if (!normalized.includes(" ")) return translateWord(normalized);

  const tokens = normalized.split(" ");
  const translatedTokens = tokens.map((token) => {
    if (CONNECTOR_TRANSLATIONS[token]) return CONNECTOR_TRANSLATIONS[token];
    return translateWord(token);
  });
  return translatedTokens.every(Boolean) ? translatedTokens.join("") : "";
}

function translatePartialFragment(value) {
  const normalized = normalizeKey(value).replace(/[?!.,]/g, "");
  const translatedTokens = normalized
    .split(/\s+/)
    .map((token) => translateWord(token))
    .filter(Boolean)
    .filter((token, index, list) => list.indexOf(token) === index);

  return translatedTokens.length ? translatedTokens.join("") : "";
}

const PATTERN_TRANSLATIONS = [
  [/^do you speak (.+)\?$/i, (_, lang) => `你会说${translateFragment(lang) || "这种语言"}吗？`],
  [/^do you have (.+)\?$/i, (_, item) => `你有${translateFragment(item) || "这个东西"}吗？`],
  [/^is there (.+)\?$/i, (_, item) => `有${translateFragment(item) || "这个东西"}吗？`],
  [/^where is (.+)\?$/i, (_, item) => `${translateFragment(item) || "这个地方"}在哪里？`],
  [/^i need (.+)$/i, (_, item) => `我需要${translateFragment(item) || "这个东西"}`],
  [/^i have (.+)$/i, (_, item) => `我有${translateFragment(item) || "这个东西"}`],
];

export const translateFlashcardConceptToChinese = (englishText) => {
  if (!englishText || typeof englishText !== "string") return englishText;

  const source = englishText.trim();
  const exact = EXACT_TRANSLATIONS[normalizeKey(source)];
  if (exact) return exact;

  for (const [pattern, translator] of PATTERN_TRANSLATIONS) {
    const match = source.match(pattern);
    if (match) {
      const translated = translator(...match);
      if (translated) return translated;
    }
  }

  const fragment = translateFragment(source);
  if (fragment) return fragment;

  return translatePartialFragment(source) || "词汇练习";
};

const addChineseConcept = (card) => {
  if (!card || typeof card !== "object") return card;
  if (!card.concept || typeof card.concept !== "object") return card;
  if (typeof card.concept.zh === "string") return card;
  return {
    ...card,
    concept: {
      ...card.concept,
      zh: translateFlashcardConceptToChinese(card.concept.en || card.concept.es),
    },
  };
};

export const withChineseFlashcardText = (cards = []) =>
  Array.isArray(cards) ? cards.map(addChineseConcept) : cards;
