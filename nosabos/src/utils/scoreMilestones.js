// Capability landmarks follow the skill-tree themes and the things learners
// practice in cards, Tutor, conversations, reading, stories, and games. They
// describe the current Score estimate, rather than certifying mastery.
export const SCORE_MILESTONES = Object.freeze([
  {
    score: 1, level: "Pre-A1", icon: "star", modes: ["lesson", "flashcards"],
    en: "Getting started", es: "Primeros pasos", de: "Erste Schritte", fr: "Premiers pas",
    it: "Primi passi", pt: "Primeiros passos", ja: "はじめの一歩", zh: "起步出发",
    ru: "Первые шаги", ar: "البداية", hi: "शुरुआती कदम",
  },
  {
    score: 2, level: "Pre-A1", icon: "spark", modes: ["flashcards", "phonics"],
    en: "Recognize a greeting", es: "Reconocer un saludo", de: "Eine Begrüßung erkennen", fr: "Reconnaître une salutation",
    it: "Riconoscere un saluto", pt: "Reconhecer uma saudação", ja: "挨拶を聞き分ける", zh: "识别问候语",
    ru: "Распознавать приветствие", ar: "التعرف على التحية", hi: "अभिवादन पहचानना",
  },
  {
    score: 4, level: "Pre-A1", icon: "voice", modes: ["tutor", "realtime"],
    en: "Say hello and your name", es: "Saludar y decir tu nombre", de: "Grüßen und Namen nennen", fr: "Saluer et dire ton prénom",
    it: "Salutare e dire il tuo nome", pt: "Cumprimentar e dizer seu nome", ja: "挨拶と自己紹介", zh: "打招呼并说出姓名",
    ru: "Поздороваться и назвать имя", ar: "التحية وذكر اسمك", hi: "नमस्ते और अपना नाम कहना",
  },
  {
    score: 6, level: "Pre-A1", icon: "heart", modes: ["tutor", "flashcards"],
    en: "Use polite everyday replies", es: "Usar respuestas cotidianas de cortesía", de: "Höfliche Alltagsantworten nutzen", fr: "Utiliser des formules de politesse",
    it: "Usare risposte di cortesia comuni", pt: "Usar respostas de cortesia comuns", ja: "丁寧な日常の返事を使う", zh: "日常礼貌回复",
    ru: "Вежливо отвечать в быту", ar: "استخدام ردود مهذبة يومية", hi: "रोजमर्रा के विनम्र उत्तर देना",
  },
  {
    score: 9, level: "Pre-A1", icon: "people", modes: ["lesson", "flashcards"],
    en: "Name people and familiar things", es: "Nombrar personas y cosas conocidas", de: "Personen und Dinge benennen", fr: "Nommer personnes et objets familiers",
    it: "Nominare persone e cose familiari", pt: "Nomear pessoas e coisas familiares", ja: "身近な人や物を言う", zh: "说出身边的人和物",
    ru: "Называть людей и знакомые вещи", ar: "تسمية الأشخاص والأشياء المألوفة", hi: "लोगों और परिचित चीजों के नाम लेना",
  },
  {
    score: 12, level: "Pre-A1", icon: "ear", modes: ["tutor", "stories"],
    en: "Follow a tiny spoken exchange", es: "Seguir un intercambio oral breve", de: "Kurze gesprochene Sätze verstehen", fr: "Suivre un court échange oral",
    it: "Seguire un breve scambio parlato", pt: "Acompanhar uma breve conversa oral", ja: "短い会話を聞き取る", zh: "听懂简短口语对话",
    ru: "Понимать короткий диалог на слух", ar: "متابعة حوار منطوق قصير", hi: "छोटी बातचीत को समझना",
  },
  {
    score: 14, level: "Pre-A1", icon: "book", modes: ["reading", "game"],
    en: "Read short everyday phrases", es: "Leer frases cotidianas breves", de: "Kurze Alltagsphrasen lesen", fr: "Lire de courtes phrases du quotidien",
    it: "Leggere brevi frasi quotidiane", pt: "Ler frases curtas do dia a dia", ja: "短い日常フレーズを読む", zh: "阅读简短日常短语",
    ru: "Читать короткие простые фразы", ar: "قراءة عبارات يومية قصيرة", hi: "रोजमर्रा के छोटे वाक्य पढ़ना",
  },
  {
    score: 18, level: "A1", icon: "calendar", modes: ["lesson", "flashcards"],
    en: "Use common everyday words", es: "Usar palabras cotidianas comunes", de: "Alltägliche Wörter anwenden", fr: "Utiliser des mots courants",
    it: "Usare parole comuni di tutti i giorni", pt: "Usar palavras comuns do cotidiano", ja: "よく使う日常の単語を使う", zh: "使用常用日常词汇",
    ru: "Использовать простые обиходные слова", ar: "استخدام كلمات شائعة يومية", hi: "रोजमर्रा के आम शब्द प्रयोग करना",
  },
  {
    score: 21, level: "A1", icon: "food", modes: ["tutor", "game"],
    en: "Order food and drinks", es: "Pedir comida y bebidas", de: "Essen und Getränke bestellen", fr: "Commander à boire et à manger",
    it: "Ordinare cibo e bevande", pt: "Pedir comida e bebidas", ja: "食べ物や飲み物を注文する", zh: "点餐和点饮品",
    ru: "Заказывать еду и напитки", ar: "طلب الطعام والشراب", hi: "खाना और पीना ऑर्डर करना",
  },
  {
    score: 25, level: "A1", icon: "home", modes: ["lesson", "stories"],
    en: "Describe home and family", es: "Describir tu hogar y familia", de: "Zuhause und Familie beschreiben", fr: "Décrire sa maison et sa famille",
    it: "Descrivere casa e famiglia", pt: "Descrever sua casa e família", ja: "家や家族について説明する", zh: "描述家和家人",
    ru: "Описывать дом и семью", ar: "وصف المنزل والعائلة", hi: "घर और परिवार का वर्णन करना",
  },
  {
    score: 28, level: "A1", icon: "note", modes: ["reading", "tutor"],
    en: "Understand simple messages", es: "Entender mensajes sencillos", de: "Einfache Nachrichten verstehen", fr: "Comprendre des messages simples",
    it: "Comprendere messaggi semplici", pt: "Entender mensagens simples", ja: "簡単なメッセージを理解する", zh: "理解简单的信息",
    ru: "Понимать простые сообщения", ar: "فهم الرسائل البسيطة", hi: "सरल संदेश समझना",
  },
  {
    score: 32, level: "A2", icon: "voice", modes: ["tutor", "conversations"],
    en: "Keep a basic conversation going", es: "Mantener una conversación básica", de: "Ein einfaches Gespräch führen", fr: "Tenir une conversation simple",
    it: "Mantenere una conversazione base", pt: "Manter uma conversa básica", ja: "基本的な会話を続ける", zh: "进行基础对话交流",
    ru: "Поддерживать простой разговор", ar: "مواصلة محادثة بسيطة", hi: "बुनियादी बातचीत जारी रखना",
  },
  {
    score: 35, level: "A2", icon: "map", modes: ["tutor", "game"],
    en: "Shop and ask for directions", es: "Comprar y pedir indicaciones", de: "Einkaufen und nach dem Weg fragen", fr: "Faire des achats et demander son chemin",
    it: "Fare acquisti e chiedere indicazioni", pt: "Fazer compras e pedir direções", ja: "買い物や道案内を尋ねる", zh: "购物并问路",
    ru: "Делать покупки и спрашивать дорогу", ar: "التسوق والسؤال عن الاتجاهات", hi: "खरीदारी करना और रास्ता पूछना",
  },
  {
    score: 39, level: "A2", icon: "calendar", modes: ["lesson", "conversations"],
    en: "Make plans and share interests", es: "Hacer planes y compartir intereses", de: "Pläne machen und Interessen teilen", fr: "Faire des projets et parler de ses goûts",
    it: "Fare programmi e condividere interessi", pt: "Fazer planos e partilhar interesses", ja: "予定を立てて趣味を話す", zh: "制定计划并分享兴趣",
    ru: "Строить планы и делиться интересами", ar: "وضع الخطط ومشاركة الاهتمامات", hi: "योजनाएं बनाना और रुचियां बांटना",
  },
  {
    score: 42, level: "A2", icon: "story", modes: ["stories", "reading"],
    en: "Tell a simple past event", es: "Contar un hecho sencillo del pasado", de: "Von vergangenen Ereignissen erzählen", fr: "Raconter un événement passé simple",
    it: "Raccontare un semplice evento passato", pt: "Contar um evento simples do passado", ja: "過去の出来事を簡単に話す", zh: "叙述过去的简单事件",
    ru: "Рассказывать о событиях в прошлом", ar: "رواية حدث بسيط من الماضي", hi: "बीती हुई बात संक्षेप में बताना",
  },
  {
    score: 46, level: "B1", icon: "story", modes: ["stories", "tutor"],
    en: "Describe experiences in sequence", es: "Relatar experiencias en orden", de: "Erlebnisse chronologisch erzählen", fr: "Décrire des expériences dans l'ordre",
    it: "Descrivere esperienze in sequenza", pt: "Descrever experiências em sequência", ja: "順を追って体験を話す", zh: "按顺序描述经历",
    ru: "Последовательно описывать опыт", ar: "وصف التجارب بتسلسل", hi: "अनुभवों को क्रमबद्ध बताना",
  },
  {
    score: 49, level: "B1", icon: "voice", modes: ["tutor", "conversations"],
    en: "Give an opinion with reasons", es: "Dar una opinión con razones", de: "Meinung mit Begründung äußern", fr: "Donner un avis argumenté",
    it: "Esprimere un'opinione motivata", pt: "Dar uma opinião com justificativa", ja: "理由をつけて意見を述べる", zh: "表达观点并说明理由",
    ru: "Высказывать мнение с аргументами", ar: "إبداء الرأي مع ذكر الأسباب", hi: "कारण सहित राय देना",
  },
  {
    score: 53, level: "B1", icon: "compass", modes: ["lesson", "game"],
    en: "Compare options and give advice", es: "Comparar opciones y dar consejos", de: "Optionen vergleichen und raten", fr: "Comparer des options et conseiller",
    it: "Confrontare opzioni e dare consigli", pt: "Comparar opções e dar conselhos", ja: "選択肢を比べて助言する", zh: "比较选择并提供建议",
    ru: "Сравнивать варианты и советовать", ar: "مقارنة الخيارات وتقديم النصائح", hi: "विकल्पों की तुलना करना और सलाह देना",
  },
  {
    score: 56, level: "B1", icon: "book", modes: ["reading", "stories"],
    en: "Follow and retell a short story", es: "Seguir y resumir un relato breve", de: "Kurzgeschichte verstehen und nacherzählen", fr: "Comprendre et résumer un récit court",
    it: "Comprendere e riassumere un breve racconto", pt: "Seguir e recontar uma história curta", ja: "短い物語を理解して説明する", zh: "理解并复述简短故事",
    ru: "Понимать и пересказывать короткий рассказ", ar: "متابعة وإعادة سرد قصة قصيرة", hi: "छोटी कहानी समझना और दोहराना",
  },
  {
    score: 60, level: "B2", icon: "voice", modes: ["tutor", "conversations"],
    en: "Explain a detailed viewpoint", es: "Explicar un punto de vista detallado", de: "Einen Standpunkt detailliert erklären", fr: "Expliquer un point de vue détaillé",
    it: "Spiegare un punto di vista dettagliato", pt: "Explicar um ponto de vista detalhado", ja: "詳しい視点や考えを説明する", zh: "详细阐述个人观点",
    ru: "Подробно излагать свою точку зрения", ar: "شرح وجهة نظر مفصلة", hi: "विस्तार से अपना दृष्टिकोण समझाना",
  },
  {
    score: 63, level: "B2", icon: "work", modes: ["lesson", "tutor"],
    en: "Communicate in work situations", es: "Comunicarse en situaciones laborales", de: "Beruflich sicher kommunizieren", fr: "Communiquer en situation professionnelle",
    it: "Comunicare in ambito lavorativo", pt: "Comunicar-se em situações de trabalho", ja: "仕事の場面でやり取りする", zh: "在工作场合交流沟通",
    ru: "Общаться в рабочих ситуациях", ar: "التواصل في بيئات العمل", hi: "कामकाज के माहौल में बातचीत करना",
  },
  {
    score: 67, level: "B2", icon: "book", modes: ["reading", "stories"],
    en: "Read ideas beyond the literal", es: "Leer ideas más allá de lo literal", de: "Zwischen den Zeilen lesen", fr: "Lire entre les lignes",
    it: "Leggere oltre il senso letterale", pt: "Ler ideias além do sentido literal", ja: "行間や言外の意味を読み取る", zh: "理解字面背后的深层含义",
    ru: "Читать между строк", ar: "قراءة ما وراء المعنى الحرفي", hi: "शाब्दिक अर्थ से परे समझना",
  },
  {
    score: 70, level: "B2", icon: "people", modes: ["conversations", "game"],
    en: "Discuss social and cultural issues", es: "Debatir temas sociales y culturales", de: "Soziale und kulturelle Themen diskutieren", fr: "Débattre de sujets sociaux et culturels",
    it: "Discutere temi sociali e culturali", pt: "Debater questões sociais e culturais", ja: "社会や文化の話題を議論する", zh: "探讨社会与文化议题",
    ru: "Обсуждать социальные и культурные темы", ar: "مناقشة القضايا الاجتماعية والثقافية", hi: "सामाजिक और सांस्कृतिक मुद्दों पर चर्चा करना",
  },
  {
    score: 74, level: "C1", icon: "compass", modes: ["tutor", "lesson"],
    en: "Adapt your tone to the situation", es: "Adaptar el tono a cada situación", de: "Tonfall der Situation anpassen", fr: "Adapter son ton à la situation",
    it: "Adattare il tono alla situazione", pt: "Adaptar o tom à situação", ja: "状況に合わせて語調を変える", zh: "根据不同场合调整语气",
    ru: "Адаптировать тон к ситуации", ar: "ملاءمة النبرة مع الموقف", hi: "परिस्थिति के अनुसार लहजा बदलना",
  },
  {
    score: 77, level: "C1", icon: "voice", modes: ["conversations", "tutor"],
    en: "Build a nuanced argument", es: "Construir un argumento con matices", de: "Differenziert argumentieren", fr: "Développer un argument nuancé",
    it: "Costruire un'argomentazione sfumata", pt: "Construir um argumento com nuances", ja: "ニュアンスを込めて論理的に話す", zh: "构建细致入微的论点",
    ru: "Строить нюансированные аргументы", ar: "بناء حجة متوازنة ودقيقة", hi: "बारीकियों के साथ तर्क रखना",
  },
  {
    score: 81, level: "C1", icon: "book", modes: ["reading", "stories"],
    en: "Interpret complex texts", es: "Interpretar textos complejos", de: "Komplexe Texte interpretieren", fr: "Interpréter des textes complexes",
    it: "Interpretare testi complessi", pt: "Interpretar textos complexos", ja: "複雑な文章を読み解く", zh: "理解并阐释复杂文本",
    ru: "Интерпретировать сложные тексты", ar: "تفسير النصوص المعقدة", hi: "जटिल लेखों का अर्थ समझना",
  },
  {
    score: 84, level: "C1", icon: "note", modes: ["lesson", "tutor"],
    en: "Express precise, subtle ideas", es: "Expresar ideas precisas y sutiles", de: "Präzise und feine Gedanken ausdrücken", fr: "Exprimer des idées fines et précises",
    it: "Esprimere concetti precisi e sfumati", pt: "Expressar ideias precisas e sutis", ja: "精密で繊細な表現を使う", zh: "精准表达细腻微妙的想法",
    ru: "Выражать тонкие и точные мысли", ar: "التعبير عن أفكار دقيقة ودقيقة", hi: "सटीक और सूक्ष्म विचार व्यक्त करना",
  },
  {
    score: 89, level: "C2", icon: "spark", modes: ["stories", "conversations"],
    en: "Use idioms naturally", es: "Usar modismos con naturalidad", de: "Redewendungen natürlich verwenden", fr: "Utiliser des expressions avec naturel",
    it: "Usare espressioni idiomatiche con disinvoltura", pt: "Usar expressões idiomáticas naturalmente", ja: "慣用句を自然に使いこなす", zh: "自然运用成语与习语",
    ru: "Естественно использовать идиомы", ar: "استخدام التعابير الاصطلاحية بسلاسة", hi: "मुहावरों का स्वाभाविक प्रयोग करना",
  },
  {
    score: 92, level: "C2", icon: "voice", modes: ["tutor", "conversations"],
    en: "Shift style for any audience", es: "Cambiar de estilo según el público", de: "Stil an jedes Publikum anpassen", fr: "Adapter son style à tout public",
    it: "Modulare lo stile per ogni interlocutore", pt: "Ajustar o estilo para qualquer público", ja: "相手に応じてスタイルを切り替える", zh: "针对不同受众自如调整风格",
    ru: "Менять стиль под любую аудиторию", ar: "تغيير الأسلوب بحسب الجمهور", hi: "हर दर्शक के अनुसार शैली बदलना",
  },
  {
    score: 96, level: "C2", icon: "book", modes: ["reading", "lesson"],
    en: "Synthesize specialist information", es: "Sintetizar información especializada", de: "Fachinformationen prägnant zusammenfassen", fr: "Synthétiser des informations spécialisées",
    it: "Sintetizzare informazioni specialistiche", pt: "Sintetizar informações especializadas", ja: "専門的な情報を要約・統合する", zh: "综合提炼专业信息",
    ru: "Обобщать специализированную информацию", ar: "تلخيص المعلومات المتخصصة بدقة", hi: "विशेषज्ञ जानकारी का सार निकालना",
  },
  {
    score: 100, level: "C2", icon: "star", modes: ["lesson", "tutor", "conversations"],
    en: "Communicate with full precision", es: "Comunicarse con plena precisión", de: "Mit höchster Präzision kommunizieren", fr: "Communiquer avec une précision parfaite",
    it: "Comunicare con assoluta precisione", pt: "Comunicar-se com total precisão", ja: "完璧な精度で意思疎通する", zh: "完全精确地进行沟通表达",
    ru: "Общаться с предельной точностью", ar: "التواصل بمنتهى الدقة والوضوح", hi: "पूरी सटीकता से संवाद करना",
  },
]);

export function getScoreMilestoneProgress(score) {
  const numeric = score == null ? 0 : Number(score);
  const value = Number.isFinite(numeric) ? Math.max(0, Math.min(100, Math.round(numeric))) : 0;
  const reached = SCORE_MILESTONES.filter((milestone) => milestone.score <= value);
  return {
    score: value,
    reached,
    current: reached.at(-1) || null,
    next: SCORE_MILESTONES[reached.length] || null,
  };
}

export function getScoreMilestoneWindow(score) {
  const { reached } = getScoreMilestoneProgress(score);
  const visibleCount = Math.min(3, SCORE_MILESTONES.length);
  const start = Math.max(0, Math.min(reached.length - 2, SCORE_MILESTONES.length - visibleCount));
  return SCORE_MILESTONES.slice(start, start + visibleCount);
}
