const FORM_LABEL_PREFIXES = Object.freeze({
  en: "Use in context",
  es: "Usa en contexto",
  pt: "Use em contexto",
  it: "Usa nel contesto",
  fr: "Utilise en contexte",
  de: "Im Kontext verwenden",
  ja: "文脈の中で使う",
  hi: "संदर्भ में उपयोग करें",
  ar: "استخدم في السياق",
  zh: "在语境中使用",
});

const MANUAL_APPLICATION_LABELS = Object.freeze({
  "lesson-pre-a1-1-2": {
    pt: "Identifique e nomeie dois membros da família extensa",
    it: "Identifica e nomina due membri della famiglia allargata",
    fr: "Identifie et nomme deux membres de la famille élargie",
    de: "Zwei Mitglieder der erweiterten Familie erkennen und benennen",
    ja: "親戚を2人見分けて名前を言う",
    hi: "विस्तृत परिवार के दो सदस्यों को पहचानें और नाम बताएं",
    ar: "تعرّف على فردين من العائلة الممتدة وسمِّهما",
    zh: "识别并说出两位大家庭成员",
  },
  "lesson-pre-a1-1-3": {
    pt: "Identifique uma pessoa conhecida com mi + palavra de pessoa",
    it: "Identifica una persona conosciuta con mi + parola di persona",
    fr: "Identifie une personne connue avec mi + mot désignant une personne",
    de: "Eine vertraute Person mit mi + Personenwort benennen",
    ja: "mi＋人を表す単語で身近な人を1人示す",
    hi: "mi + व्यक्ति-सूचक शब्द से किसी परिचित व्यक्ति को पहचानें",
    ar: "حدّد شخصًا مألوفًا باستخدام mi + كلمة تدل على شخص",
    zh: "用 mi + 人物词指认一位熟悉的人",
  },
  "lesson-pre-a1-2-2": {
    pt: "Reconheça e diga quantidades de seis a dez",
    it: "Riconosci e pronuncia quantità da sei a dieci",
    fr: "Reconnais et dis des quantités de six à dix",
    de: "Mengen von sechs bis zehn erkennen und nennen",
    ja: "6から10までの数量を見分けて言う",
    hi: "छह से दस तक की मात्राओं को पहचानें और बोलें",
    ar: "تعرّف على الكميات من ستة إلى عشرة وقلها",
    zh: "识别并说出六到十的数量",
  },
  "lesson-pre-a1-2-3": {
    pt: "Responda a ¿cuántos hay? com um número e um objeto",
    it: "Rispondi a ¿cuántos hay? con un numero e un oggetto",
    fr: "Réponds à ¿cuántos hay? avec un nombre et un objet",
    de: "¿cuántos hay? mit einer Zahl und einem Gegenstand beantworten",
    ja: "¿cuántos hay? に数字と物で答える",
    hi: "¿cuántos hay? का उत्तर एक संख्या और वस्तु से दें",
    ar: "أجب عن ¿cuántos hay? بعدد وشيء",
    zh: "用数字和物品回答 ¿cuántos hay?",
  },
  "lesson-pre-a1-3-2": {
    pt: "Escolha uma despedida para mais tarde hoje ou amanhã",
    it: "Scegli un saluto per più tardi oggi o per domani",
    fr: "Choisis une formule d’au revoir pour plus tard ou demain",
    de: "Eine Verabschiedung für später heute oder morgen wählen",
    ja: "今日または明日に合う別れの表現を選ぶ",
    hi: "आज बाद में या कल के लिए विदाई का वाक्यांश चुनें",
    ar: "اختر عبارة وداع لوقت لاحق اليوم أو للغد",
    zh: "选择适合今天稍后或明天的告别语",
  },
  "lesson-pre-a1-3-3": {
    pt: "Complete uma troca de saudação e bem-estar",
    it: "Completa uno scambio di saluti e domande sul benessere",
    fr: "Complète un échange de salutations et de nouvelles",
    de: "Einen Begrüßungs- und Befindlichkeitsaustausch vervollständigen",
    ja: "挨拶と調子を尋ねるやり取りを完成させる",
    hi: "अभिवादन और हाल-चाल का संवाद पूरा करें",
    ar: "أكمل تبادلًا للتحية والسؤال عن الحال",
    zh: "完成一段问候和询问近况的对话",
  },
  "lesson-pre-a1-4-2": {
    pt: "Escolha uma frase de dúvida ou falta de compreensão",
    it: "Scegli una frase per esprimere dubbio o mancata comprensione",
    fr: "Choisis une phrase de doute ou d’incompréhension",
    de: "Eine Wendung für Unsicherheit oder fehlendes Verständnis wählen",
    ja: "不確かさや理解できないことを表す表現を選ぶ",
    hi: "अनिश्चितता या समझ न आने के लिए वाक्यांश चुनें",
    ar: "اختر عبارة للشك أو لعدم الفهم",
    zh: "选择表达不确定或不理解的短语",
  },
  "lesson-pre-a1-4-3": {
    pt: "Reaja naturalmente a uma boa notícia, uma má notícia e uma instrução",
    it: "Reagisci in modo naturale a una buona notizia, una cattiva notizia e un’istruzione",
    fr: "Réagis naturellement à une bonne nouvelle, une mauvaise nouvelle et une consigne",
    de: "Natürlich auf gute Nachrichten, schlechte Nachrichten und eine Anweisung reagieren",
    ja: "良い知らせ、悪い知らせ、指示に自然に反応する",
    hi: "अच्छी खबर, बुरी खबर और निर्देश पर स्वाभाविक प्रतिक्रिया दें",
    ar: "تفاعل بصورة طبيعية مع خبر جيد وخبر سيئ وتعليمات",
    zh: "自然回应好消息、坏消息和指令",
  },
  "lesson-pre-a1-5-2": {
    pt: "Escolha uma desculpa ou frase para chamar a atenção conforme a situação",
    it: "Scegli una scusa o una frase per richiamare l’attenzione adatta alla situazione",
    fr: "Choisis une excuse ou une formule pour attirer l’attention selon la situation",
    de: "Eine passende Entschuldigung oder Aufmerksamkeitsformel wählen",
    ja: "状況に合う謝罪または呼びかけの表現を選ぶ",
    hi: "स्थिति के अनुसार माफ़ी या ध्यान आकर्षित करने वाला वाक्यांश चुनें",
    ar: "اختر عبارة اعتذار أو لفت انتباه تناسب الموقف",
    zh: "根据情境选择道歉语或引起注意的短语",
  },
  "lesson-pre-a1-5-3": {
    pt: "Complete dois pares diferentes de agradecimento e resposta",
    it: "Completa due coppie diverse di ringraziamento e risposta",
    fr: "Complète deux échanges différents de remerciement et de réponse",
    de: "Zwei verschiedene Dankes- und Antwortpaare vervollständigen",
    ja: "異なる感謝と返答の組み合わせを2つ完成させる",
    hi: "धन्यवाद और उत्तर के दो अलग-अलग जोड़े पूरे करें",
    ar: "أكمل زوجين مختلفين من الشكر والرد",
    zh: "完成两组不同的感谢与回应",
  },
  "lesson-pre-a1-6-2": {
    pt: "Identifique qual objeto pessoal está presente ou ausente",
    it: "Identifica quale oggetto personale è presente o manca",
    fr: "Identifie l’objet personnel présent ou manquant",
    de: "Erkennen, welcher persönliche Gegenstand vorhanden ist oder fehlt",
    ja: "ある持ち物とない持ち物を見分ける",
    hi: "पहचानें कि कौन-सी निजी वस्तु मौजूद है या गायब है",
    ar: "حدّد الغرض الشخصي الموجود أو المفقود",
    zh: "识别哪件个人物品存在或缺失",
  },
  "lesson-pre-a1-6-3": {
    pt: "Peça uma comida e uma bebida usando por favor",
    it: "Ordina un cibo e una bevanda usando por favor",
    fr: "Commande un aliment et une boisson avec por favor",
    de: "Ein Essen und ein Getränk mit por favor bestellen",
    ja: "por favor を使って食べ物と飲み物を1つずつ注文する",
    hi: "por favor के साथ एक खाद्य वस्तु और एक पेय मंगाएं",
    ar: "اطلب طعامًا وشرابًا باستخدام por favor",
    zh: "用 por favor 点一种食物和一种饮料",
  },
  "lesson-pre-a1-7-2": {
    pt: "Identifique quatro cores adicionais em objetos conhecidos",
    it: "Identifica quattro colori aggiuntivi su oggetti familiari",
    fr: "Identifie quatre couleurs supplémentaires sur des objets familiers",
    de: "Vier weitere Farben an vertrauten Gegenständen erkennen",
    ja: "身近な物にある4つの追加の色を見分ける",
    hi: "परिचित वस्तुओं पर चार अतिरिक्त रंग पहचानें",
    ar: "حدّد أربعة ألوان إضافية على أشياء مألوفة",
    zh: "识别熟悉物品上的四种其他颜色",
  },
  "lesson-pre-a1-7-3": {
    pt: "Escolha e nomeie uma cor neutra",
    it: "Scegli e nomina un colore neutro",
    fr: "Choisis et nomme une couleur neutre",
    de: "Eine neutrale Farbe wählen und benennen",
    ja: "中間色を選んで名前を言う",
    hi: "एक तटस्थ रंग चुनें और उसका नाम बताएं",
    ar: "اختر لونًا محايدًا واذكر اسمه",
    zh: "选择并说出一种中性色",
  },
  "lesson-pre-a1-8-2": {
    pt: "Pergunte o nome de um colega e de um adulto",
    it: "Chiedi il nome a un coetaneo e a un adulto",
    fr: "Demande son nom à un camarade et à un adulte",
    de: "Einen Gleichaltrigen und einen Erwachsenen nach dem Namen fragen",
    ja: "同年代の人と大人に名前を尋ねる",
    hi: "किसी हमउम्र और किसी वयस्क से उनका नाम पूछें",
    ar: "اسأل شخصًا من أقرانك وشخصًا بالغًا عن اسمهما",
    zh: "询问同龄人和成年人的姓名",
  },
  "lesson-pre-a1-8-3": {
    pt: "Complete duas trocas de prazer em conhecer",
    it: "Completa due scambi per dire piacere di conoscerti",
    fr: "Complète deux échanges pour dire enchanté",
    de: "Zwei Kennenlern-Austausche vervollständigen",
    ja: "「はじめまして」のやり取りを2つ完成させる",
    hi: "मिलकर खुशी हुई वाले दो संवाद पूरे करें",
    ar: "أكمل حوارين للتعبير عن سرور اللقاء",
    zh: "完成两段“很高兴认识你”的对话",
  },
  "lesson-a1-1-2": {
    pt: "Complete um encontro de quatro turnos com as frases exigidas",
    it: "Completa un incontro di quattro turni con le frasi richieste",
    fr: "Complète une rencontre en quatre tours avec les phrases demandées",
    de: "Ein Kennenlernen in vier Gesprächszügen mit den vorgegebenen Wendungen abschließen",
    ja: "指定された表現で4ターンの初対面会話を完成させる",
    hi: "आवश्यक वाक्यांशों के साथ चार बारी की मुलाकात पूरी करें",
    ar: "أكمل لقاءً من أربع مداخلات باستخدام العبارات المطلوبة",
    zh: "使用指定短语完成四轮初次见面对话",
  },
  "lesson-a1-1-3": {
    pt: "Escolha linguagem informal ou cortês para dois primeiros encontros",
    it: "Scegli un linguaggio informale o cortese per due primi incontri",
    fr: "Choisis un registre familier ou poli pour deux premières rencontres",
    de: "Für zwei erste Begegnungen lockere oder höfliche Sprache wählen",
    ja: "2つの初対面場面でくだけた表現か丁寧な表現を選ぶ",
    hi: "दो पहली मुलाकातों के लिए अनौपचारिक या विनम्र भाषा चुनें",
    ar: "اختر لغة عفوية أو مهذبة لموقفين من اللقاء الأول",
    zh: "为两个初次见面场景选择随意或礼貌的表达",
  },
  "lesson-a1-3-2": {
    pt: "Use os números 11–30 para quantidades e um preço",
    it: "Usa i numeri 11–30 per quantità e un prezzo",
    fr: "Utilise les nombres 11–30 pour des quantités et un prix",
    de: "Die Zahlen 11–30 für Mengen und einen Preis verwenden",
    ja: "11～30の数字を数量と価格に使う",
    hi: "मात्राओं और एक कीमत के लिए 11–30 की संख्याओं का उपयोग करें",
    ar: "استخدم الأعداد 11–30 للكميات ولسعر واحد",
    zh: "使用11–30表示数量和一个价格",
  },
  "lesson-a1-3-3": {
    pt: "Pergunte e diga uma idade e um número de telefone curto",
    it: "Chiedi e comunica un’età e un breve numero di telefono",
    fr: "Demande et donne un âge et un numéro de téléphone court",
    de: "Nach einem Alter und einer kurzen Telefonnummer fragen und beides angeben",
    ja: "年齢と短い電話番号を尋ねて答える",
    hi: "उम्र और छोटा फ़ोन नंबर पूछें और बताएं",
    ar: "اسأل عن عمر ورقم هاتف قصير واذكرهما",
    zh: "询问并说出年龄和简短电话号码",
  },
  "lesson-a1-4-2": {
    pt: "Pergunte um preço e entenda o total e o troco",
    it: "Chiedi un prezzo e comprendi il totale e il resto",
    fr: "Demande un prix et comprends le total et la monnaie",
    de: "Nach einem Preis fragen und Gesamtbetrag und Wechselgeld verstehen",
    ja: "価格を尋ね、合計とお釣りを理解する",
    hi: "कीमत पूछें और कुल राशि व बाकी पैसे समझें",
    ar: "اسأل عن السعر وافهم المجموع والباقي",
    zh: "询问价格并理解总价和找零",
  },
  "lesson-a1-4-3": {
    pt: "Associe os números 31–100 a pontuações, pessoas, preços e objetos",
    it: "Abbina i numeri 31–100 a punteggi, persone, prezzi e oggetti",
    fr: "Associe les nombres 31–100 à des scores, personnes, prix et objets",
    de: "Die Zahlen 31–100 Punkten, Personen, Preisen und Gegenständen zuordnen",
    ja: "31～100の数字を得点、人数、価格、物の数に対応させる",
    hi: "31–100 की संख्याओं को अंक, लोग, कीमतें और वस्तुओं से मिलाएं",
    ar: "طابق الأعداد 31–100 مع النقاط والأشخاص والأسعار والأشياء",
    zh: "将31–100与分数、人数、价格和物品数量配对",
  },
  "lesson-pre-a1-f-1": {
    pt: "Escolha uma frase inicial para saudação, cortesia ou resposta",
    it: "Scegli una frase iniziale per salutare, essere cortese o rispondere",
    fr: "Choisis une phrase de base pour saluer, être poli ou répondre",
    de: "Eine erste Wendung zum Begrüßen, für Höflichkeit oder zum Antworten wählen",
    ja: "挨拶、丁寧表現、返答に使う基本フレーズを選ぶ",
    hi: "अभिवादन, शिष्टाचार या उत्तर के लिए शुरुआती वाक्यांश चुनें",
    ar: "اختر عبارة أساسية للتحية أو المجاملة أو الرد",
    zh: "选择用于问候、礼貌表达或回应的入门短语",
  },
  "lesson-pre-a1-f-2": {
    pt: "Identifique uma pessoa e um lugar com aquí ou allí",
    it: "Identifica una persona e un luogo con aquí o allí",
    fr: "Identifie une personne et un lieu avec aquí ou allí",
    de: "Eine Person und einen Ort mit aquí oder allí benennen",
    ja: "aquí または allí を使って人と場所を示す",
    hi: "aquí या allí से एक व्यक्ति और स्थान को पहचानें",
    ar: "حدّد شخصًا ومكانًا باستخدام aquí أو allí",
    zh: "用 aquí 或 allí 指认一个人和一个地点",
  },
  "lesson-pre-a1-f-3": {
    pt: "Expresse um desejo e uma necessidade imediata",
    it: "Esprimi un desiderio e un bisogno immediato",
    fr: "Exprime un souhait et un besoin immédiat",
    de: "Einen Wunsch und ein unmittelbares Bedürfnis ausdrücken",
    ja: "欲しいものと今必要なものを1つずつ表現する",
    hi: "एक इच्छा और एक तत्काल आवश्यकता व्यक्त करें",
    ar: "عبّر عن رغبة واحدة وحاجة فورية واحدة",
    zh: "表达一个愿望和一个即时需求",
  },
  "lesson-pre-a1-f-4": {
    pt: "Siga uma indicação de tempo e uma direção simples",
    it: "Segui un’indicazione di tempo e una direzione semplice",
    fr: "Suis une indication de temps et une direction simple",
    de: "Einem Zeithinweis und einer einfachen Richtungsangabe folgen",
    ja: "時間の合図と簡単な方向指示に従う",
    hi: "समय के एक संकेत और एक सरल दिशा-निर्देश का पालन करें",
    ar: "اتبع إشارة زمنية واحدة واتجاهًا بسيطًا واحدًا",
    zh: "遵循一个时间提示和一个简单方向指示",
  },
});

const formItem = (lessonId, index, form, modes) => ({
  id: `manual-${lessonId}-form-${index + 1}`,
  kind: "vocabulary",
  modes,
  label: Object.fromEntries(
    Object.entries(FORM_LABEL_PREFIXES).map(([lang, prefix]) => [
      lang,
      `${prefix}: ${form}`,
    ]),
  ),
  goal: `Recognize and produce "${form}"`,
  targetConcept: form,
  targetRole: "form",
  targetForms: [form],
  targetExamples: [form],
  activityBrief:
    "Give the meaning and one tiny situation for this exact word or phrase, then ask for one recognition or production attempt",
  evidence: {
    type: "produce_or_choose",
    criteria: `The learner recognizes or understandably produces "${form}"`,
  },
  source: "manual-pre-a1-agenda",
  spanishOnly: true,
});

const capabilityItem = (lessonId, spec, modes) => ({
  id: `manual-${lessonId}-application`,
  kind: spec.kind || "communication",
  modes,
  label: {
    en: spec.en,
    es: spec.es,
    ...MANUAL_APPLICATION_LABELS[lessonId],
  },
  goal: spec.goal,
  targetConcept: spec.goal,
  targetRole: "goal",
  targetForms: [],
  targetExamples: spec.examples || [],
  activityBrief: spec.activityBrief,
  evidence: {
    type: spec.evidenceType || "scenario_response",
    criteria: spec.evidence,
  },
  source: "manual-pre-a1-agenda",
  spanishOnly: true,
});

const agenda = (forms, application) => ({ forms, application });

/**
 * Hand-reviewed Spanish agendas for the lessons whose old objectives described
 * an activity but did not identify the language to teach. The first lesson in
 * each unit already behaves like "My Family": concrete vocabulary followed by
 * a small use pattern. These repairs bring the later lessons to that standard.
 */
export const MANUAL_PRE_A1_AGENDAS = Object.freeze({
  "lesson-pre-a1-1-2": agenda(
    ["abuelo", "abuela", "bebé", "tío", "tía"],
    {
      en: "Identify and name two extended-family members",
      es: "Identifica y nombra a dos familiares",
      goal: "Identify and name at least two extended-family members",
      examples: ["Es mi abuela.", "Es mi tío."],
      activityBrief:
        "Show or describe two family relationships and ask the learner to name them",
      evidence:
        "The learner correctly names at least two extended-family members",
    },
  ),
  "lesson-pre-a1-1-3": agenda(
    ["amigo", "amiga", "vecino", "vecina", "niño", "niña"],
    {
      en: "Identify one familiar person with mi + person word",
      es: "Identifica a una persona con mi + palabra de persona",
      goal: "Identify one familiar person using mi plus a people word",
      examples: ["Mi amiga.", "Mi vecino."],
      activityBrief:
        "Present one familiar person and help the learner identify the relationship with a two-word chunk",
      evidence:
        "The learner produces an understandable mi plus person phrase",
    },
  ),
  "lesson-pre-a1-2-2": agenda(
    ["seis", "siete", "ocho", "nueve", "diez"],
    {
      en: "Recognize and say quantities from six to ten",
      es: "Reconoce y di cantidades del seis al diez",
      goal: "Recognize and produce quantities from six to ten",
      examples: ["seis libros", "nueve sillas"],
      activityBrief:
        "Present three small quantities from six to ten and ask the learner to identify or say each number",
      evidence:
        "The learner correctly recognizes or produces at least three numbers from six to ten",
    },
  ),
  "lesson-pre-a1-2-3": agenda(
    ["un libro", "dos libros", "tres sillas", "cuatro mesas", "¿cuántos hay?"],
    {
      en: "Answer ¿cuántos hay? with a number and an object",
      es: "Responde ¿cuántos hay? con un número y un objeto",
      goal: "Answer a quantity question with a number and a familiar object",
      examples: ["Dos libros.", "Cuatro mesas."],
      activityBrief:
        "Ask one quantity question at a time about familiar objects and elicit a number-plus-object answer",
      evidence:
        "The learner gives two understandable number-plus-object answers",
    },
  ),
  "lesson-pre-a1-3-2": agenda(
    ["adiós", "hasta luego", "hasta mañana", "nos vemos", "chao"],
    {
      en: "Choose a farewell for later today or tomorrow",
      es: "Elige una despedida para más tarde o mañana",
      goal: "Choose an appropriate farewell for two simple time contexts",
      examples: ["Hasta luego.", "Hasta mañana."],
      activityBrief:
        "Give a later-today context and a tomorrow context, asking for one appropriate farewell in each",
      evidence:
        "The learner chooses an appropriate farewell in both contexts",
    },
  ),
  "lesson-pre-a1-3-3": agenda(
    ["hola", "¿cómo estás?", "bien, gracias", "¿y tú?", "bienvenido"],
    {
      en: "Complete a greeting and wellbeing exchange",
      es: "Completa un saludo y un intercambio de bienestar",
      goal: "Complete a short greeting and wellbeing exchange",
      examples: ["Hola. ¿Cómo estás?", "Bien, gracias. ¿Y tú?"],
      activityBrief:
        "Run a three-turn arrival exchange using a greeting, a wellbeing question, and a short response",
      evidence:
        "The learner supplies the appropriate greeting or response in three consecutive turns",
    },
  ),
  "lesson-pre-a1-4-2": agenda(
    ["no sé", "quizás", "tal vez", "más o menos", "no entiendo"],
    {
      en: "Choose a phrase for uncertainty or lack of understanding",
      es: "Elige una frase de duda o falta de comprensión",
      goal: "Distinguish uncertainty from not knowing and not understanding",
      examples: ["Quizás.", "No sé.", "No entiendo."],
      activityBrief:
        "Give one maybe, one unknown, and one comprehension situation and ask for the matching short response",
      evidence:
        "The learner chooses an appropriate response for at least two different situations",
    },
  ),
  "lesson-pre-a1-4-3": agenda(
    ["entiendo", "claro", "vale", "bien", "mal", "qué bien"],
    {
      en: "React naturally to good news, bad news, and an instruction",
      es: "Reacciona a una buena noticia, una mala noticia y una instrucción",
      goal: "Use three different short reactions in matching contexts",
      examples: ["¡Qué bien!", "Mal.", "Vale."],
      activityBrief:
        "Give three tiny contexts—good news, bad news, and a simple instruction—and elicit a different reaction",
      evidence:
        "The learner gives three context-appropriate short reactions",
    },
  ),
  "lesson-pre-a1-5-2": agenda(
    ["perdón", "lo siento", "disculpe", "con permiso"],
    {
      en: "Choose an apology or attention phrase for the situation",
      es: "Elige una disculpa o frase de atención según la situación",
      goal: "Distinguish apologizing, getting attention, and passing by",
      examples: ["Lo siento.", "Disculpe.", "Con permiso."],
      activityBrief:
        "Give one bumping-into-someone situation, one attention situation, and one passing-by situation",
      evidence:
        "The learner chooses the appropriate phrase in at least two different situations",
    },
  ),
  "lesson-pre-a1-5-3": agenda(
    ["muchas gracias", "de nada", "no hay problema", "con gusto", "no es nada"],
    {
      en: "Complete two different thank-you and response pairs",
      es: "Completa dos pares distintos de agradecimiento y respuesta",
      goal: "Complete two courtesy exchanges using different responses",
      examples: ["Muchas gracias. — De nada.", "Gracias. — Con gusto."],
      activityBrief:
        "Model one thank-you exchange, then prompt two new exchanges that require different courtesy responses",
      evidence:
        "The learner completes two exchanges with two different appropriate courtesy responses",
    },
  ),
  "lesson-pre-a1-6-2": agenda(
    ["llave", "teléfono", "cartera", "bolso", "libro", "lápiz"],
    {
      en: "Identify which personal item is present or missing",
      es: "Identifica qué objeto personal está o falta",
      goal: "Identify familiar personal items in a bag or missing-item context",
      examples: ["Mi teléfono.", "Falta la llave."],
      activityBrief:
        "Describe a bag with three familiar items, then ask which item is present or missing",
      evidence:
        "The learner correctly identifies at least three personal items",
      kind: "comprehension",
      evidenceType: "identify",
    },
  ),
  "lesson-pre-a1-6-3": agenda(
    ["agua", "café", "té", "leche", "pan", "comida"],
    {
      en: "Order one food and one drink with por favor",
      es: "Pide una comida y una bebida con por favor",
      goal: "Order one familiar food and one familiar drink politely",
      examples: ["Café, por favor.", "Pan, por favor."],
      activityBrief:
        "Offer a tiny café menu and ask the learner to request one drink and one food item",
      evidence:
        "The learner makes two understandable item-plus-por-favor requests",
    },
  ),
  "lesson-pre-a1-7-2": agenda(
    ["verde", "naranja", "morado", "rosa"],
    {
      en: "Identify four additional colors on familiar objects",
      es: "Identifica cuatro colores adicionales en objetos conocidos",
      goal: "Identify and name four additional colors",
      examples: ["libro verde", "mesa naranja"],
      activityBrief:
        "Pair each new color with a familiar object and ask the learner to identify the color",
      evidence:
        "The learner correctly names at least three of the four colors",
    },
  ),
  "lesson-pre-a1-7-3": agenda(
    ["negro", "blanco", "gris", "marrón"],
    {
      en: "Choose and name a neutral color",
      es: "Elige y nombra un color neutro",
      goal: "Recognize and use black, white, gray, and brown",
      examples: ["puerta blanca", "mesa marrón"],
      activityBrief:
        "Present familiar objects in neutral colors and ask the learner to name or choose the color",
      evidence:
        "The learner correctly uses at least three neutral color words",
    },
  ),
  "lesson-pre-a1-8-2": agenda(
    ["¿cómo te llamas?", "¿cómo se llama?", "¿y tú?", "tu nombre"],
    {
      en: "Ask a peer and an adult for their name",
      es: "Pregunta el nombre de un compañero y de un adulto",
      goal: "Ask for a name using one casual and one polite question",
      examples: ["¿Cómo te llamas?", "¿Cómo se llama?"],
      activityBrief:
        "Present one peer and one adult context and ask the learner to choose and produce the appropriate name question",
      evidence:
        "The learner produces the casual and polite name questions in the matching contexts",
    },
  ),
  "lesson-pre-a1-8-3": agenda(
    ["mucho gusto", "encantado", "encantada", "igualmente", "un placer"],
    {
      en: "Complete two nice-to-meet-you exchanges",
      es: "Completa dos intercambios de mucho gusto",
      goal: "Use and respond to a nice-to-meet-you expression",
      examples: ["Mucho gusto. — Igualmente.", "Encantada. — Un placer."],
      activityBrief:
        "Run two first-meeting closings and require a greeting response rather than another introduction",
      evidence:
        "The learner appropriately opens or responds to two nice-to-meet-you exchanges",
    },
  ),
  "lesson-a1-1-2": agenda(
    [
      "hola",
      "me llamo",
      "¿cómo te llamas?",
      "mucho gusto",
      "¿cómo estás?",
      "bien, gracias",
      "hasta luego",
    ],
    {
      en: "Complete a four-turn meeting with the required phrases",
      es: "Completa un encuentro de cuatro turnos con las frases requeridas",
      goal: "Complete a four-turn first meeting using a greeting, names, wellbeing, and a closing",
      examples: [
        "Hola. Me llamo Ana.",
        "Mucho gusto. ¿Cómo estás?",
        "Bien, gracias. Hasta luego.",
      ],
      activityBrief:
        "Run exactly four short turns: greeting, name exchange, wellbeing exchange, and closing; prompt only the missing phrase",
      evidence:
        "The learner completes all four stages with an understandable required phrase",
    },
  ),
  "lesson-a1-1-3": agenda(
    [
      "hola",
      "buenos días",
      "¿cómo estás?",
      "¿cómo está usted?",
      "¿cómo te llamas?",
      "¿cómo se llama?",
    ],
    {
      en: "Choose casual or polite language for two first meetings",
      es: "Elige lenguaje casual o cortés para dos encuentros",
      goal: "Distinguish casual and polite greeting and name questions",
      examples: ["Hola. ¿Cómo estás?", "Buenos días. ¿Cómo está usted?"],
      activityBrief:
        "Present a peer context and an adult-stranger context, requiring the matching greeting and question in each",
      evidence:
        "The learner chooses the appropriate register in both contexts",
    },
  ),
  "lesson-a1-3-2": agenda(
    ["hay doce", "hay veinte", "son quince", "cuesta veinticinco", "¿cuántos hay?"],
    {
      en: "Use numbers 11–30 for quantities and a price",
      es: "Usa los números 11–30 para cantidades y un precio",
      goal: "State two quantities and one price using numbers 11–30",
      examples: ["Hay doce libros.", "Cuesta veinticinco."],
      activityBrief:
        "Ask two how-many questions and one simple price question using authored numbers from 11 to 30",
      evidence:
        "The learner produces two correct quantities and one understandable price",
    },
  ),
  "lesson-a1-3-3": agenda(
    ["mi número es", "¿cuál es tu número?", "tengo veinte años", "¿cuántos años tienes?"],
    {
      en: "Ask for and give an age and a short phone number",
      es: "Pregunta y da una edad y un número de teléfono corto",
      goal: "Ask for and give one age and one short phone number",
      examples: ["Tengo veinte años.", "Mi número es 21 15 30."],
      activityBrief:
        "Use fictional information: exchange one age and one short grouped phone number",
      evidence:
        "The learner asks for or gives both an age and a short phone number",
    },
  ),
  "lesson-a1-4-2": agenda(
    ["¿cuánto cuesta?", "cuesta cuarenta", "son cincuenta pesos", "cambio, por favor"],
    {
      en: "Ask a price and understand the total and change",
      es: "Pregunta un precio y entiende el total y el cambio",
      goal: "Ask for a price, state a total, and request change",
      examples: ["¿Cuánto cuesta?", "Son cincuenta pesos."],
      activityBrief:
        "Run a tiny purchase with one price question, one total from 31 to 100, and one change request",
      evidence:
        "The learner completes the price question and responds correctly to the total",
    },
  ),
  "lesson-a1-4-3": agenda(
    ["treinta puntos", "sesenta personas", "noventa pesos", "cien libros"],
    {
      en: "Match numbers 31–100 to scores, people, prices, and objects",
      es: "Relaciona números 31–100 con puntos, personas, precios y objetos",
      goal: "Interpret and produce numbers 31–100 in four concrete contexts",
      examples: ["Sesenta personas.", "Noventa pesos."],
      activityBrief:
        "Present a score, a headcount, a price, and an object quantity; ask for one number phrase at a time",
      evidence:
        "The learner correctly interprets or produces at least three of the four number phrases",
    },
  ),
  "lesson-pre-a1-f-1": agenda(
    ["hola", "buenos días", "adiós", "gracias", "por favor", "sí", "no", "no sé"],
    {
      en: "Choose a starter phrase for greeting, courtesy, or response",
      es: "Elige una frase inicial de saludo, cortesía o respuesta",
      goal: "Use high-frequency starter phrases in matching situations",
      examples: ["Buenos días.", "Sí, por favor.", "No sé."],
      activityBrief:
        "Cycle through a greeting, a polite request, a yes/no choice, and an unknown-answer situation",
      evidence:
        "The learner gives an appropriate phrase in four different starter situations",
    },
  ),
  "lesson-pre-a1-f-2": agenda(
    ["mamá", "papá", "amigo", "casa", "escuela", "trabajo", "aquí", "allí"],
    {
      en: "Identify a person and a place with aquí or allí",
      es: "Identifica una persona y un lugar con aquí o allí",
      goal: "Identify familiar people and places using here and there",
      examples: ["Mamá está aquí.", "La escuela está allí."],
      activityBrief:
        "Present two familiar people and two familiar places, asking where each one is",
      evidence:
        "The learner correctly identifies at least one person and two places",
    },
  ),
  "lesson-pre-a1-f-3": agenda(
    ["quiero", "necesito", "tengo", "voy", "ayuda", "agua", "comida", "baño"],
    {
      en: "Express one want and one immediate need",
      es: "Expresa un deseo y una necesidad inmediata",
      goal: "Use quiero or necesito with an immediate essential",
      examples: ["Quiero agua.", "Necesito ayuda."],
      activityBrief:
        "Give one choice situation and one help situation, eliciting a two-word want or need phrase",
      evidence:
        "The learner produces one understandable quiero phrase and one necesito phrase",
    },
  ),
  "lesson-pre-a1-f-4": agenda(
    [
      "hoy",
      "mañana",
      "ahora",
      "aquí",
      "allí",
      "izquierda",
      "derecha",
      "recto",
      "autobús",
      "taxi",
    ],
    {
      en: "Follow one time cue and one simple direction",
      es: "Sigue una indicación de tiempo y una dirección sencilla",
      goal: "Recognize basic time, transport, and direction words",
      examples: ["Ahora, a la derecha.", "Taxi aquí."],
      activityBrief:
        "Give one when choice, one transport choice, and two one-step directions",
      evidence:
        "The learner correctly responds to a time cue, a transport word, and two directions",
    },
  ),
});

const buildAgenda = (lessonId, spec, modes) => [
  ...spec.forms.map((form, index) => formItem(lessonId, index, form, modes)),
  capabilityItem(lessonId, spec.application, modes),
];

export function getManualPreA1AgendaItems(lesson, { modes = null } = {}) {
  const lessonId = typeof lesson === "string" ? lesson : lesson?.id;
  const spec = MANUAL_PRE_A1_AGENDAS[lessonId];
  if (!spec) return [];
  const lessonModes =
    modes ||
    (typeof lesson === "object" && Array.isArray(lesson?.modes)
      ? lesson.modes
      : ["vocabulary", "realtime"]);
  return buildAgenda(lessonId, spec, lessonModes);
}
