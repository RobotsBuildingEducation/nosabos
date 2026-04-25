/**
 * Adds Mandarin Chinese support-language copy to skill-tree payloads.
 */

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const TEXT_TRANSLATIONS = {
  "getting started": "开始使用",
  "learn how to use the app and explore all features":
    "学习如何使用应用并探索所有功能",
  "a guided tour of all learning modules": "所有学习模块的引导导览",
  "learn words for the people in your life": "学习生活中人物的词语",
  "learn the words for close family members": "学习亲近家庭成员的词语",
  "grandparents, babies, and extended family": "祖父母、婴儿和扩展家庭",
  "words for friends, children, and people you see every day":
    "学习朋友、孩子和每天见到的人物词语",
  "test your knowledge of people and family words":
    "测试你对人物和家庭词语的掌握",
  "learn numbers 0-5": "学习数字 0-5",
  "add numbers 6-10": "学习数字 6-10",
  "use numbers with objects": "用数字描述物品",
  "test number skills": "测试数字技能",
  "react naturally": "自然回应",
  "test greeting skills": "测试问候技能",
  "expand your palette": "扩展颜色词汇",
  "introduce yourself": "介绍自己",
  "learn new words with interactive questions. practice saying hello.":
    "通过互动问题学习新词，并练习打招呼。",
  "master grammar rules through exercises. practice greeting patterns.":
    "通过练习掌握语法规则，并练习问候句型。",
  "improve your reading skills with a simple hello passage.":
    "通过一段简单问候短文提升阅读能力。",
  "practice with interactive stories that say hello.":
    "通过包含问候的互动故事进行练习。",
  "practice speaking with realtime conversations. say hello to complete this activity.":
    "通过实时会话练习口语，说出问候即可完成活动。",
  "first words": "最初的词语",
  "people & family": "人物与家庭",
  "my family": "我的家庭",
  "more family": "更多家庭成员",
  "people around me": "我身边的人",
  "people & family quiz": "人物与家庭测验",
  "numbers 0-10": "数字 0-10",
  "zero to five": "零到五",
  "six to ten": "六到十",
  "counting objects": "数物品",
  "numbers quiz": "数字测验",
  "hello & goodbye": "问候与告别",
  "hello and goodbye": "问候与告别",
  "saying hello": "打招呼",
  "saying goodbye": "说再见",
  "greetings in context": "情境问候",
  "greetings quiz": "问候测验",
  "yes, no & basic responses": "是、不是与基础回应",
  "yes and no": "是和不是",
  "maybe and i don't know": "也许和我不知道",
  "quick responses": "快速回应",
  "responses quiz": "回应测验",
  "please & thank you": "请与谢谢",
  "please and thank you": "请与谢谢",
  "sorry and excuse me": "抱歉与打扰一下",
  "polite expressions": "礼貌表达",
  "courtesy quiz": "礼貌测验",
  "common objects": "常见物品",
  "things at home": "家里的东西",
  "personal items": "个人物品",
  "food and drink items": "食物和饮品",
  "objects quiz": "物品测验",
  colors: "颜色",
  "primary colors": "基本颜色",
  "more colors": "更多颜色",
  "black, white & neutral": "黑色、白色与中性色",
  "colors quiz": "颜色测验",
  "what's your name?": "你叫什么名字？",
  "saying your name": "说出你的名字",
  "asking names": "询问名字",
  "nice to meet you": "很高兴认识你",
  "introductions quiz": "介绍测验",
  "pre-a1 foundations": "Pre-A1 基础",
  "everyday starters": "日常入门",
  "people & places": "人物与地点",
  "actions & essentials": "动作与必备表达",
  "time, travel & directions": "时间、旅行与方向",
  "question words": "疑问词",
  "days of week": "星期",
  "months & dates": "月份与日期",
  "telling time": "表达时间",
  "family members": "家庭成员",
  "family relationships": "家庭关系",
  "colors & shapes": "颜色与形状",
  "food & drinks": "食物与饮品",
  "daily routine": "日常安排",
  "likes & dislikes": "喜欢与不喜欢",
  "basic questions": "基础问题",
  "describing people": "描述人物",
  "describing places": "描述地点",
  "shopping & money": "购物与金钱",
  "making plans": "制定计划",
  "hobbies & interests": "爱好与兴趣",
  "sports & exercise": "运动与锻炼",
  "telling stories": "讲故事",
  "future plans": "未来计划",
  "health & body": "健康与身体",
  "jobs & professions": "工作与职业",
  "school & education": "学校与教育",
  "technology basics": "科技基础",
  "present perfect": "现在完成时",
  "past continuous": "过去进行时",
  "future tense": "将来时",
  "giving advice": "给建议",
  "making suggestions": "提出建议",
  "conditional would": "would 条件表达",
  "if i were you": "如果我是你",
  "travel & tourism": "旅行与旅游",
  "culture & traditions": "文化与传统",
  "media & news": "媒体与新闻",
  "expressing opinions": "表达观点",
  "making complaints": "提出投诉",
  "past perfect": "过去完成时",
  "passive voice": "被动语态",
  "reported speech": "转述语",
  "relative clauses": "关系从句",
  "formal vs informal": "正式与非正式",
  "business spanish": "商务西班牙语",
  "science & innovation": "科学与创新",
  "social issues": "社会议题",
  "arts & literature": "艺术与文学",
  "cultural analysis": "文化分析",
  "politics & society": "政治与社会",
  "abstract concepts": "抽象概念",
  "subjunctive present": "现在虚拟式",
  "subjunctive past": "过去虚拟式",
  "complex conditionals": "复杂条件句",
  "idiomatic expressions": "习惯表达",
  "academic writing": "学术写作",
  "professional communication": "专业沟通",
  "debate & argumentation": "辩论与论证",
  "literary techniques": "文学技巧",
  "advanced discourse": "高级话语",
  "native idioms": "母语者习语",
  "regional variations": "地区差异",
  "stylistic mastery": "风格掌握",
  "rhetorical devices": "修辞手法",
  "specialized vocabulary": "专业词汇",
  "subtle nuances": "细微差别",
  "cultural expertise": "文化能力",
  "near-native fluency": "接近母语流利度",
  "complete mastery": "完全掌握",
  vocabulary: "词汇",
  grammar: "语法",
  reading: "阅读",
  stories: "故事",
  realtime: "实时对话",
  "game review": "游戏复习",
  "conversation practice": "会话练习",
  "final quiz": "最终测验",
  "learn new words through interactive questions.":
    "通过互动问题学习新词。",
  "master grammar rules through exercises.":
    "通过练习掌握语法规则。",
  "improve your reading skills by following along with passages.":
    "通过跟读文章提升阅读能力。",
  "practice with interactive stories by reading and speaking sentence by sentence.":
    "通过逐句朗读和表达练习互动故事。",
  "practice speaking with realtime conversations.":
    "通过实时对话练习口语。",
  "review what you learned by playing an interactive game.":
    "通过互动游戏复习所学内容。",
  "finish the tutorial by playing a short game review.":
    "通过一个简短游戏复习完成教程。",
  "the learner says hello.": "学习者说出问候语。",
  "the learner says hello to you.": "学习者向你问好。",
};

const WORD_TRANSLATIONS = {
  absolute: "绝对",
  actions: "动作",
  advanced: "进阶",
  advice: "建议",
  analysis: "分析",
  app: "应用",
  asking: "询问",
  babies: "婴儿",
  basic: "基础",
  body: "身体",
  business: "商务",
  children: "孩子",
  close: "亲近",
  colors: "颜色",
  common: "常见",
  communication: "沟通",
  complex: "复杂",
  concepts: "概念",
  context: "语境",
  conversation: "会话",
  conversations: "会话",
  counting: "数数",
  cultural: "文化",
  culture: "文化",
  daily: "日常",
  dates: "日期",
  describing: "描述",
  directions: "方向",
  drink: "饮品",
  drinks: "饮品",
  education: "教育",
  essentials: "必备表达",
  everyday: "日常",
  exercise: "锻炼",
  exercises: "练习",
  expand: "扩展",
  explore: "探索",
  extended: "扩展家庭",
  family: "家庭",
  features: "功能",
  food: "食物",
  formal: "正式表达",
  friends: "朋友",
  future: "未来",
  grandparents: "祖父母",
  grammar: "语法",
  greeting: "问候",
  greetings: "问候",
  health: "健康",
  hobbies: "爱好",
  home: "家庭",
  idioms: "习语",
  informal: "非正式表达",
  introductions: "自我介绍",
  items: "物品",
  jobs: "工作",
  key: "关键",
  language: "语言",
  life: "生活",
  members: "成员",
  modules: "模块",
  money: "金钱",
  months: "月份",
  names: "名字",
  neutral: "中性色",
  numbers: "数字",
  objects: "物品",
  opinions: "观点",
  palette: "色彩",
  people: "人物",
  personal: "个人",
  places: "地点",
  plans: "计划",
  polite: "礼貌",
  politics: "政治",
  prices: "价格",
  questions: "问题",
  quiz: "测验",
  reading: "阅读",
  recognition: "识别",
  responses: "回应",
  routine: "日常安排",
  school: "学校",
  science: "科学",
  shopping: "购物",
  simple: "简单",
  skills: "技能",
  social: "社会",
  sports: "运动",
  starters: "入门表达",
  stories: "故事",
  technology: "科技",
  time: "时间",
  tour: "导览",
  travel: "旅行",
  use: "使用",
  vocabulary: "词汇",
  words: "词语",
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "about",
  "all",
  "around",
  "by",
  "for",
  "how",
  "in",
  "new",
  "of",
  "the",
  "through",
  "to",
  "with",
  "your",
]);

const PATTERN_TRANSLATORS = [
  [/^(.+) Quiz$/i, (topic) => `${translateSkillTreeTextToChinese(topic)}测验`],
  [/^Learn key vocabulary for (.+)$/i, (topic) => `学习${translateSkillTreeTextToChinese(topic)}的关键词汇`],
  [/^Practice (.+) in conversation$/i, (topic) => `在会话中练习${translateSkillTreeTextToChinese(topic)}`],
  [/^Practice (.+) in real conversations$/i, (topic) => `在真实会话中练习${translateSkillTreeTextToChinese(topic)}`],
  [/^Practice using (.+) in conversation$/i, (topic) => `在会话中练习使用${translateSkillTreeTextToChinese(topic)}`],
  [/^Practice (.+) in a real situation$/i, (topic) => `在真实情境中练习${translateSkillTreeTextToChinese(topic)}`],
  [/^Apply (.+) skills$/i, (topic) => `运用${translateSkillTreeTextToChinese(topic)}技能`],
  [/^Test your knowledge of (.+)$/i, (topic) => `测试你对${translateSkillTreeTextToChinese(topic)}的掌握`],
  [/^Review (.+) by playing an interactive game$/i, (topic) => `通过互动游戏复习${translateSkillTreeTextToChinese(topic)}`],
  [/^Learn to (.+)$/i, (topic) => `学习${translateSkillTreeTextToChinese(topic)}`],
  [/^Have a conversation about (.+)$/i, (topic) => `围绕${translateSkillTreeTextToChinese(topic)}进行会话`],
  [/^Answer questions about (.+)$/i, (topic) => `回答关于${translateSkillTreeTextToChinese(topic)}的问题`],
  [/^Start a conversation about (.+)$/i, (topic) => `开始关于${translateSkillTreeTextToChinese(topic)}的会话`],
  [/^Use (.+) in a real situation$/i, (topic) => `在真实情境中使用${translateSkillTreeTextToChinese(topic)}`],
  [/^Combine: (.+) and (.+)$/i, (first, second) => `组合练习：${translateSkillTreeTextToChinese(first)}和${translateSkillTreeTextToChinese(second)}`],
  [/^Use what you learned: (.+) \+ (.+)$/i, (first, second) => `运用所学：${translateSkillTreeTextToChinese(first)} + ${translateSkillTreeTextToChinese(second)}`],
  [/^Real-world practice: (.+)$/i, (topic) => `真实生活练习：${translateSkillTreeTextToChinese(topic)}`],
  [/^User demonstrates use of (.+) in context$/i, (topic) => `用户在语境中展示${translateSkillTreeTextToChinese(topic)}的用法`],
  [/^User uses (.+) correctly in context$/i, (topic) => `用户在语境中正确使用${translateSkillTreeTextToChinese(topic)}`],
  [/^User demonstrates correct use of (.+)$/i, (topic) => `用户正确展示${translateSkillTreeTextToChinese(topic)}的用法`],
];

const fallbackSkillTreeTextToChinese = (source) => {
  const normalized = normalizeKey(source)
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ");

  const translatedTerms = normalized
    .split(/\s+/)
    .filter((word) => word && !STOP_WORDS.has(word))
    .map((word) => WORD_TRANSLATIONS[word])
    .filter(Boolean)
    .filter((word, index, list) => list.indexOf(word) === index);

  const topic = translatedTerms.join("与");
  if (!topic) return "学习主题";

  if (/^learn\b/i.test(source)) return `学习${topic}`;
  if (/^practice\b/i.test(source)) return `练习${topic}`;
  if (/^test\b/i.test(source)) return `测试${topic}掌握情况`;
  if (/^review\b/i.test(source)) return `复习${topic}`;
  if (/^read\b/i.test(source)) return `阅读${topic}`;
  if (/^describe\b/i.test(source)) return `描述${topic}`;
  if (/^ask\b|^asking\b/i.test(source)) return `询问${topic}`;
  if (/^tell\b/i.test(source)) return `讲述${topic}`;

  return topic.length <= 12 ? topic : `学习${topic}`;
};

export const translateSkillTreeTextToChinese = (value) => {
  const source = String(value || "").trim();
  if (!source) return source;

  const translated = TEXT_TRANSLATIONS[normalizeKey(source)];
  if (translated) return translated;

  for (const [pattern, translate] of PATTERN_TRANSLATORS) {
    const match = source.match(pattern);
    if (match) return translate(...match.slice(1));
  }

  return fallbackSkillTreeTextToChinese(source);
};

const addChineseText = (value) => {
  if (Array.isArray(value)) return value.map(addChineseText);
  if (!value || typeof value !== "object") return value;

  const next = {};
  for (const [key, child] of Object.entries(value)) {
    next[key] = addChineseText(child);
  }

  if (
    typeof value.en === "string" &&
    typeof value.es === "string" &&
    typeof value.zh !== "string"
  ) {
    next.zh = translateSkillTreeTextToChinese(value.en);
  }

  if (
    typeof value.successCriteria === "string" &&
    typeof value.successCriteria_zh !== "string"
  ) {
    next.successCriteria_zh = translateSkillTreeTextToChinese(
      value.successCriteria,
    );
  }

  return next;
};

export const withChineseSkillTreeText = (skillTree = []) =>
  addChineseText(skillTree);
