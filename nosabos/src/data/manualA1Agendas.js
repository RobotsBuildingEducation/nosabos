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
    "Establish the meaning and situation for this exact phrase, then ask for one short recognition or production attempt",
  evidence: {
    type: "produce_or_choose",
    criteria: `The learner recognizes or understandably produces "${form}"`,
  },
  source: "manual-a1-agenda",
  spanishOnly: true,
});

const applicationItem = (lessonId, application, modes) => ({
  id: `manual-${lessonId}-application`,
  kind: application.kind || "communication",
  modes,
  label: application.label,
  goal: application.goal,
  targetConcept: application.goal,
  targetRole: "goal",
  targetForms: [],
  targetExamples: application.examples,
  activityBrief: application.activityBrief,
  evidence: {
    type: application.evidenceType || "scenario_response",
    criteria: application.evidence,
  },
  source: "manual-a1-agenda",
  spanishOnly: true,
});

const agenda = (forms, application) => ({ forms, application });

/**
 * Manual repairs for the two practice/application lessons in each A1 unit.
 * The first lesson in every unit already provides a concrete vocabulary and
 * grammar inventory. These agendas turn that inventory into bounded
 * comprehension and interaction rather than open-ended "practice/discuss"
 * prompts.
 */
export const MANUAL_A1_AGENDAS = Object.freeze({
  "lesson-a1-5-2": agenda(
    [
      "¿qué día es hoy?",
      "hoy es...",
      "mañana es...",
      "ayer fue...",
      "el lunes",
      "los lunes",
    ],
    {
      label: {
        en: "Say what day it is and distinguish one day from a weekly routine",
        es: "Di qué día es y distingue un día de una rutina semanal",
        pt: "Diga que dia é e diferencie um dia de uma rotina semanal",
        it: "Di che giorno è e distingui un giorno da una routine settimanale",
        fr: "Dis quel jour on est et distingue un jour d’une routine hebdomadaire",
        de: "Den Wochentag nennen und einen einzelnen Tag von einer Wochenroutine unterscheiden",
        ja: "曜日を言い、特定の一日と毎週の習慣を区別する",
        hi: "दिन बताएं और किसी एक दिन को साप्ताहिक दिनचर्या से अलग पहचानें",
        ar: "اذكر اليوم وميّز بين يوم واحد وروتين أسبوعي",
        zh: "说出星期几，并区分某一天和每周惯例",
      },
      goal:
        "Answer what day it is and distinguish one occurrence from a weekly routine",
      examples: ["Hoy es lunes.", "Los lunes estudio."],
      activityBrief:
        "Ask about today, yesterday, and tomorrow, then contrast one event on Monday with a recurring Monday routine",
      evidence:
        "The learner gives three correct day answers and uses el lunes and los lunes in the matching contexts",
    },
  ),
  "lesson-a1-5-3": agenda(
    [
      "el lunes voy a...",
      "el martes tengo...",
      "los miércoles...",
      "el fin de semana...",
      "esta semana",
      "la próxima semana",
    ],
    {
      label: {
        en: "Describe three plans on different days and ask one follow-up question",
        es: "Describe tres planes en días distintos y haz una pregunta de seguimiento",
        pt: "Descreva três planos em dias diferentes e faça uma pergunta de seguimento",
        it: "Descrivi tre programmi in giorni diversi e fai una domanda di approfondimento",
        fr: "Décris trois projets à des jours différents et pose une question de suivi",
        de: "Drei Pläne an verschiedenen Tagen beschreiben und eine Rückfrage stellen",
        ja: "異なる曜日の予定を3つ説明し、確認の質問を1つする",
        hi: "अलग-अलग दिनों की तीन योजनाएं बताएं और एक अगला सवाल पूछें",
        ar: "صِف ثلاث خطط في أيام مختلفة واطرح سؤال متابعة واحدًا",
        zh: "描述三个不同日期的计划，并提出一个后续问题",
      },
      goal:
        "Describe three weekly plans on different days and ask one follow-up question",
      examples: ["El lunes voy a trabajar.", "¿Y el martes?"],
      activityBrief:
        "Build a three-day weekly plan one day at a time, then require one question about the other person's week",
      evidence:
        "The learner states three understandable day-plus-plan combinations and asks one relevant day question",
    },
  ),
  "lesson-a1-6-2": agenda(
    [
      "¿cuándo es tu cumpleaños?",
      "mi cumpleaños es el...",
      "¿qué fecha es hoy?",
      "hoy es el...",
      "en enero",
      "el cinco de mayo",
    ],
    {
      label: {
        en: "Ask for and give today’s date and one birthday",
        es: "Pregunta y da la fecha de hoy y un cumpleaños",
        pt: "Pergunte e diga a data de hoje e um aniversário",
        it: "Chiedi e comunica la data di oggi e un compleanno",
        fr: "Demande et donne la date d’aujourd’hui et un anniversaire",
        de: "Nach dem heutigen Datum und einem Geburtstag fragen und beide nennen",
        ja: "今日の日付と誕生日を尋ねて答える",
        hi: "आज की तारीख और एक जन्मदिन पूछें और बताएं",
        ar: "اسأل عن تاريخ اليوم وعن عيد ميلاد واذكرهما",
        zh: "询问并说出今天的日期和一个生日",
      },
      goal: "Ask for and give today's date and one birthday",
      examples: ["Hoy es el cinco de mayo.", "Mi cumpleaños es el doce de junio."],
      activityBrief:
        "Exchange today's date and a fictional birthday, prompting the day and month separately if needed",
      evidence:
        "The learner asks or answers both date questions with an understandable day and month",
    },
  ),
  "lesson-a1-6-3": agenda(
    [
      "¿cuándo es...?",
      "es el...",
      "la cita es el...",
      "la fiesta es el...",
      "primero",
      "después",
    ],
    {
      label: {
        en: "Find the event and date in an invitation, then confirm the day",
        es: "Encuentra el evento y la fecha en una invitación y confirma el día",
        pt: "Encontre o evento e a data em um convite e confirme o dia",
        it: "Trova l’evento e la data in un invito, poi conferma il giorno",
        fr: "Trouve l’événement et la date dans une invitation, puis confirme le jour",
        de: "Ereignis und Datum in einer Einladung finden und den Tag bestätigen",
        ja: "招待状から行事と日付を見つけ、曜日を確認する",
        hi: "निमंत्रण में कार्यक्रम और तारीख खोजें, फिर दिन की पुष्टि करें",
        ar: "اعثر على المناسبة والتاريخ في دعوة ثم أكّد اليوم",
        zh: "从邀请中找出活动和日期，然后确认日期",
      },
      goal:
        "Identify an event and its date in a short invitation, then confirm the day",
      examples: ["La fiesta es el ocho de julio.", "Sí, es el sábado."],
      activityBrief:
        "Present a two-sentence invitation with one event and date, ask for both details, then run one confirmation turn",
      evidence:
        "The learner identifies the correct event and date and completes the confirmation",
      kind: "comprehension",
      evidenceType: "identify_and_respond",
    },
  ),
  "lesson-a1-7-2": agenda(
    [
      "¿qué hora es?",
      "es la una",
      "son las...",
      "y cuarto",
      "y media",
      "menos cuarto",
      "a las...",
    ],
    {
      label: {
        en: "Read a three-item schedule and say each time",
        es: "Lee un horario de tres actividades y di cada hora",
        pt: "Leia um horário de três atividades e diga cada hora",
        it: "Leggi un programma di tre attività e di’ ogni orario",
        fr: "Lis un programme de trois activités et donne chaque heure",
        de: "Einen Plan mit drei Terminen lesen und jede Uhrzeit nennen",
        ja: "3項目の予定表を読み、それぞれの時刻を言う",
        hi: "तीन गतिविधियों की समय-सारणी पढ़ें और हर समय बताएं",
        ar: "اقرأ جدولًا من ثلاثة بنود واذكر وقت كل واحد",
        zh: "阅读包含三项活动的日程并说出每个时间",
      },
      goal: "Read a three-item daily schedule and state each time",
      examples: ["La clase es a las dos y media.", "La cena es a las ocho."],
      activityBrief:
        "Present three familiar activities at an hour, half hour, and quarter hour, asking for one time at a time",
      evidence:
        "The learner correctly states all three scheduled times",
      kind: "comprehension",
      evidenceType: "identify",
    },
  ),
  "lesson-a1-7-3": agenda(
    [
      "¿a qué hora puedes?",
      "puedo a las...",
      "no puedo a las...",
      "¿te va bien...?",
      "sí, perfecto",
      "mejor a las...",
    ],
    {
      label: {
        en: "Arrange and reschedule one appointment in a short exchange",
        es: "Acuerda y cambia una cita en un intercambio breve",
        pt: "Marque e remarque um compromisso em uma conversa curta",
        it: "Fissa e sposta un appuntamento in un breve scambio",
        fr: "Fixe puis déplace un rendez-vous dans un court échange",
        de: "In einem kurzen Gespräch einen Termin vereinbaren und verschieben",
        ja: "短いやり取りで予約を決め、別の時間に変更する",
        hi: "छोटे संवाद में एक मुलाकात तय करें और उसका समय बदलें",
        ar: "حدّد موعدًا ثم غيّره في حوار قصير",
        zh: "在简短对话中安排并改约一次见面",
      },
      goal:
        "Arrange, reject, and confirm one appointment time in a short exchange",
      examples: ["¿Te va bien a las tres?", "No puedo. Mejor a las cuatro."],
      activityBrief:
        "Offer one appointment time, require a conflict and alternative, then confirm the new time",
      evidence:
        "The learner asks about a time, rejects one option, proposes another, and confirms it",
    },
  ),
  "lesson-a1-8-2": agenda(
    [
      "mi madre se llama...",
      "tengo ... hermanos",
      "este es mi...",
      "¿quién es...?",
      "¿tienes hermanos?",
      "vive en...",
    ],
    {
      label: {
        en: "Exchange three facts about close family members",
        es: "Intercambia tres datos sobre familiares cercanos",
        pt: "Troque três informações sobre familiares próximos",
        it: "Scambia tre informazioni sui familiari stretti",
        fr: "Échange trois informations sur des proches",
        de: "Drei Angaben über enge Familienmitglieder austauschen",
        ja: "近い家族について3つの情報をやり取りする",
        hi: "करीबी परिवार के सदस्यों के बारे में तीन बातें साझा करें",
        ar: "تبادل ثلاث معلومات عن أفراد الأسرة المقرّبين",
        zh: "交流关于近亲的三条信息",
      },
      goal: "Exchange three facts about close family members",
      examples: ["Mi madre se llama Ana.", "Tengo dos hermanos."],
      activityBrief:
        "Ask and answer about a name, number of siblings, and where one family member lives",
      evidence:
        "The learner gives three understandable family facts and answers or asks one family question",
    },
  ),
  "lesson-a1-8-3": agenda(
    [
      "es el hermano de...",
      "es la hija de...",
      "su madre",
      "sus primos",
      "¿quién es...?",
      "se llama...",
    ],
    {
      label: {
        en: "Identify three people from their family relationships",
        es: "Identifica a tres personas por sus relaciones familiares",
        pt: "Identifique três pessoas pelas relações familiares",
        it: "Identifica tre persone dalle loro relazioni familiari",
        fr: "Identifie trois personnes grâce à leurs liens familiaux",
        de: "Drei Personen anhand ihrer Familienbeziehungen erkennen",
        ja: "家族関係から3人を特定する",
        hi: "पारिवारिक संबंधों से तीन लोगों की पहचान करें",
        ar: "حدّد ثلاثة أشخاص من خلال علاقاتهم العائلية",
        zh: "根据家庭关系识别三个人",
      },
      goal: "Identify three people from a short family-tree description",
      examples: ["Luis es el hermano de Ana.", "¿Quién es la madre de Luis?"],
      activityBrief:
        "Describe a four-person family tree with three explicit relationships, then ask who each person is",
      evidence:
        "The learner correctly identifies three people or relationships",
      kind: "comprehension",
      evidenceType: "identify",
    },
  ),
  "lesson-a1-9-2": agenda(
    [
      "¿de qué color es?",
      "es rojo / roja",
      "son rojos / rojas",
      "un círculo azul",
      "una mesa blanca",
      "claro / oscuro",
    ],
    {
      label: {
        en: "Describe three objects using the correct color ending",
        es: "Describe tres objetos usando la terminación correcta del color",
        pt: "Descreva três objetos usando a terminação correta da cor",
        it: "Descrivi tre oggetti usando la desinenza corretta del colore",
        fr: "Décris trois objets avec la bonne terminaison de couleur",
        de: "Drei Gegenstände mit der richtigen Farbendung beschreiben",
        ja: "色の語尾を正しく使って3つの物を説明する",
        hi: "रंग के सही रूप का उपयोग करके तीन वस्तुओं का वर्णन करें",
        ar: "صِف ثلاثة أشياء مستخدمًا النهاية الصحيحة للون",
        zh: "使用正确的颜色词尾描述三件物品",
      },
      goal:
        "Describe three familiar objects with color words that agree in gender and number",
      examples: ["La mesa es blanca.", "Los libros son rojos."],
      activityBrief:
        "Present one masculine singular, one feminine singular, and one plural object and ask for its color",
      evidence:
        "The learner gives three understandable descriptions with the correct color form",
    },
  ),
  "lesson-a1-9-3": agenda(
    [
      "el libro rojo",
      "la puerta roja",
      "los libros rojos",
      "las puertas rojas",
      "¿de qué color son?",
    ],
    {
      label: {
        en: "Match four color forms to singular and plural nouns",
        es: "Relaciona cuatro formas de color con sustantivos singulares y plurales",
        pt: "Associe quatro formas de cor a substantivos singulares e plurais",
        it: "Abbina quattro forme di colore a nomi singolari e plurali",
        fr: "Associe quatre formes de couleur à des noms singuliers et pluriels",
        de: "Vier Farbformen Singular- und Pluralnomen zuordnen",
        ja: "4つの色の形を単数・複数の名詞に合わせる",
        hi: "रंग के चार रूपों को एकवचन और बहुवचन संज्ञाओं से मिलाएं",
        ar: "طابق أربعة أشكال للألوان مع أسماء مفردة وجمع",
        zh: "将四种颜色形式与单复数名词配对",
      },
      goal:
        "Match masculine, feminine, singular, and plural color forms to familiar nouns",
      examples: ["el libro rojo", "las puertas rojas"],
      activityBrief:
        "Give four noun phrases with the color ending missing and ask for the matching form one at a time",
      evidence:
        "The learner supplies the correct color form in at least three of four noun phrases",
      kind: "comprehension",
      evidenceType: "produce_or_choose",
    },
  ),
  "lesson-a1-10-2": agenda(
    [
      "tengo hambre",
      "tengo sed",
      "quiero...",
      "me gusta...",
      "no me gusta...",
      "para beber...",
    ],
    {
      label: {
        en: "Choose a meal and drink, then state one preference",
        es: "Elige una comida y una bebida y expresa una preferencia",
        pt: "Escolha uma refeição e uma bebida e diga uma preferência",
        it: "Scegli un pasto e una bevanda, poi esprimi una preferenza",
        fr: "Choisis un repas et une boisson, puis exprime une préférence",
        de: "Eine Mahlzeit und ein Getränk wählen und eine Vorliebe nennen",
        ja: "食事と飲み物を選び、好みを1つ述べる",
        hi: "एक भोजन और पेय चुनें, फिर एक पसंद बताएं",
        ar: "اختر وجبة وشرابًا ثم اذكر تفضيلًا واحدًا",
        zh: "选择一份餐食和饮料，然后表达一个偏好",
      },
      goal: "Choose one familiar food and drink and state one preference",
      examples: ["Quiero pan y café.", "Me gusta la fruta."],
      activityBrief:
        "Offer a small breakfast or lunch choice, elicit one food and drink, then ask what the learner likes",
      evidence:
        "The learner chooses one food and drink and gives one understandable like or dislike",
    },
  ),
  "lesson-a1-10-3": agenda(
    [
      "mi comida favorita es...",
      "me gusta...",
      "me gustan...",
      "prefiero...",
      "no como...",
      "¿qué te gusta?",
    ],
    {
      label: {
        en: "Exchange two food preferences and one dislike",
        es: "Intercambia dos preferencias de comida y algo que no te gusta",
        pt: "Troque duas preferências alimentares e algo de que não gosta",
        it: "Scambia due preferenze alimentari e un cibo che non piace",
        fr: "Échange deux préférences alimentaires et un aliment que tu n’aimes pas",
        de: "Zwei Essensvorlieben und eine Abneigung austauschen",
        ja: "食べ物の好みを2つと苦手なものを1つ伝え合う",
        hi: "खाने की दो पसंद और एक नापसंद साझा करें",
        ar: "تبادل تفضيلين للطعام وشيئًا واحدًا لا تحبه",
        zh: "交流两个食物偏好和一个不喜欢的食物",
      },
      goal:
        "Exchange two food preferences and one dislike using singular and plural forms",
      examples: ["Me gusta el pescado.", "Me gustan las frutas."],
      activityBrief:
        "Ask about a favorite food, a plural food category, and one disliked food, then reverse roles for one question",
      evidence:
        "The learner uses me gusta and me gustan appropriately and states one dislike",
    },
  ),
  "lesson-a1-11-2": agenda(
    [
      "para mí...",
      "quería...",
      "me pone...",
      "¿qué desea?",
      "¿algo más?",
      "la cuenta, por favor",
    ],
    {
      label: {
        en: "Order one dish and one drink, then ask for the bill",
        es: "Pide un plato y una bebida y luego solicita la cuenta",
        pt: "Peça um prato e uma bebida e depois peça a conta",
        it: "Ordina un piatto e una bevanda, poi chiedi il conto",
        fr: "Commande un plat et une boisson, puis demande l’addition",
        de: "Ein Gericht und ein Getränk bestellen und danach um die Rechnung bitten",
        ja: "料理と飲み物を注文し、その後会計を頼む",
        hi: "एक व्यंजन और पेय मंगाएं, फिर बिल मांगें",
        ar: "اطلب طبقًا وشرابًا ثم اطلب الحساب",
        zh: "点一道菜和一杯饮料，然后索要账单",
      },
      goal: "Order one dish and one drink and ask for the bill politely",
      examples: ["Para mí, el pescado.", "La cuenta, por favor."],
      activityBrief:
        "Run a waiter-customer exchange with one dish, one drink, an anything-else turn, and a bill request",
      evidence:
        "The learner orders both items, responds to ¿algo más?, and asks for the bill",
    },
  ),
  "lesson-a1-11-3": agenda(
    [
      "¿me trae la cuenta?",
      "creo que hay un error",
      "¿cuánto es?",
      "pago con tarjeta",
      "pago en efectivo",
      "el cambio",
      "gracias",
    ],
    {
      label: {
        en: "Check a bill, clarify one charge, and choose how to pay",
        es: "Revisa una cuenta, aclara un cargo y elige cómo pagar",
        pt: "Confira uma conta, esclareça uma cobrança e escolha como pagar",
        it: "Controlla il conto, chiarisci un addebito e scegli come pagare",
        fr: "Vérifie l’addition, clarifie un montant et choisis comment payer",
        de: "Eine Rechnung prüfen, einen Posten klären und die Zahlungsart wählen",
        ja: "会計を確認し、1つの料金について尋ね、支払い方法を選ぶ",
        hi: "बिल जांचें, एक शुल्क स्पष्ट करें और भुगतान का तरीका चुनें",
        ar: "راجع الحساب واستوضح رسمًا واحدًا واختر طريقة الدفع",
        zh: "核对账单、澄清一项收费并选择付款方式",
      },
      goal: "Check a simple bill, clarify one charge, and choose how to pay",
      examples: ["Creo que hay un error.", "Pago con tarjeta."],
      activityBrief:
        "Present a three-item bill with one unexpected charge, answer one clarification, and ask for card or cash",
      evidence:
        "The learner identifies or questions the unexpected charge and states a payment method",
    },
  ),
  "lesson-a1-12-2": agenda(
    [
      "¿qué es esto?",
      "esto es...",
      "¿dónde está...?",
      "está en...",
      "hay...",
      "no hay...",
    ],
    {
      label: {
        en: "Identify and locate three classroom objects",
        es: "Identifica y ubica tres objetos del aula",
        pt: "Identifique e localize três objetos da sala de aula",
        it: "Identifica e localizza tre oggetti dell’aula",
        fr: "Identifie et situe trois objets de la classe",
        de: "Drei Gegenstände im Klassenzimmer erkennen und lokalisieren",
        ja: "教室の物を3つ特定し、場所を言う",
        hi: "कक्षा की तीन वस्तुओं को पहचानें और उनका स्थान बताएं",
        ar: "حدّد ثلاثة أشياء في الفصل واذكر أماكنها",
        zh: "识别并指出三件教室物品的位置",
      },
      goal: "Identify and locate three familiar classroom objects",
      examples: ["Esto es un cuaderno.", "El lápiz está en la mochila."],
      activityBrief:
        "Present three classroom objects, ask what each is, then ask where two of them are",
      evidence:
        "The learner names three objects and gives two understandable locations",
    },
  ),
  "lesson-a1-12-3": agenda(
    ["este", "esta", "ese", "esa", "aquí", "allí", "¿qué es eso?"],
    {
      label: {
        en: "Distinguish and name two nearby and two distant objects",
        es: "Distingue y nombra dos objetos cercanos y dos lejanos",
        pt: "Diferencie e nomeie dois objetos próximos e dois distantes",
        it: "Distingui e nomina due oggetti vicini e due lontani",
        fr: "Distingue et nomme deux objets proches et deux éloignés",
        de: "Zwei nahe und zwei entfernte Gegenstände unterscheiden und benennen",
        ja: "近くの物2つと遠くの物2つを区別して名前を言う",
        hi: "पास की दो और दूर की दो वस्तुओं को अलग पहचानें और नाम बताएं",
        ar: "ميّز وسمِّ شيئين قريبين وشيئين بعيدين",
        zh: "区分并说出两个近处和两个远处的物品",
      },
      goal:
        "Distinguish and name two nearby and two distant classroom objects",
      examples: ["Este libro está aquí.", "Esa mochila está allí."],
      activityBrief:
        "Contrast masculine and feminine classroom objects in near and far positions, one object at a time",
      evidence:
        "The learner chooses an appropriate demonstrative for at least three of four objects",
    },
  ),
  "lesson-a1-13-2": agenda(
    [
      "¿dónde está...?",
      "está en...",
      "encima de",
      "debajo de",
      "al lado de",
      "entre",
    ],
    {
      label: {
        en: "Ask for and give the location of three household objects",
        es: "Pregunta y da la ubicación de tres objetos de la casa",
        pt: "Pergunte e diga a localização de três objetos da casa",
        it: "Chiedi e indica la posizione di tre oggetti di casa",
        fr: "Demande et indique l’emplacement de trois objets de la maison",
        de: "Nach dem Ort von drei Haushaltsgegenständen fragen und ihn angeben",
        ja: "家の物3つの場所を尋ねて答える",
        hi: "घर की तीन वस्तुओं का स्थान पूछें और बताएं",
        ar: "اسأل عن مكان ثلاثة أشياء في المنزل واذكره",
        zh: "询问并说明三件家居物品的位置",
      },
      goal: "Ask for and give the location of three household objects",
      examples: ["¿Dónde está la llave?", "Está encima de la mesa."],
      activityBrief:
        "Place three familiar objects in different rooms or positions and alternate asking and answering where they are",
      evidence:
        "The learner asks one location question and gives three correct location phrases",
    },
  ),
  "lesson-a1-13-3": agenda(
    [
      "en la cocina hay...",
      "la cama está...",
      "a la derecha de",
      "a la izquierda de",
      "delante de",
      "detrás de",
    ],
    {
      label: {
        en: "Describe two rooms and the location of their furniture",
        es: "Describe dos habitaciones y la ubicación de sus muebles",
        pt: "Descreva dois cômodos e a localização dos móveis",
        it: "Descrivi due stanze e la posizione dei mobili",
        fr: "Décris deux pièces et l’emplacement de leurs meubles",
        de: "Zwei Räume und die Position ihrer Möbel beschreiben",
        ja: "2つの部屋と家具の位置を説明する",
        hi: "दो कमरों और उनके फर्नीचर के स्थान का वर्णन करें",
        ar: "صِف غرفتين ومواقع الأثاث فيهما",
        zh: "描述两个房间及其中家具的位置",
      },
      goal: "Describe two rooms and locate at least one piece of furniture in each",
      examples: ["En la cocina hay una mesa.", "El sofá está delante de la ventana."],
      activityBrief:
        "Build a tiny two-room floor plan and ask for one room item and one relative furniture position in each room",
      evidence:
        "The learner names both rooms and gives two understandable furniture locations",
    },
  ),
  "lesson-a1-14-2": agenda(
    [
      "busco...",
      "quiero probarme...",
      "¿tiene esta...?",
      "¿qué talla?",
      "me queda bien",
      "me queda mal",
      "¿cuánto cuesta?",
    ],
    {
      label: {
        en: "Ask for one clothing item by color and size",
        es: "Pide una prenda por color y talla",
        pt: "Peça uma peça de roupa por cor e tamanho",
        it: "Chiedi un capo indicando colore e taglia",
        fr: "Demande un vêtement en précisant la couleur et la taille",
        de: "Nach einem Kleidungsstück in einer bestimmten Farbe und Größe fragen",
        ja: "色とサイズを指定して服を1着頼む",
        hi: "रंग और आकार के अनुसार एक कपड़ा मांगें",
        ar: "اطلب قطعة ملابس بلون ومقاس محددين",
        zh: "按颜色和尺码询问一件衣物",
      },
      goal:
        "Ask for, try on, and evaluate one clothing item by color and size",
      examples: ["Busco una chaqueta azul.", "Me queda bien."],
      activityBrief:
        "Run a shop exchange requiring an item, color, size, try-on response, and price question",
      evidence:
        "The learner requests a specific item, answers the fit question, and asks the price",
    },
  ),
  "lesson-a1-14-3": agenda(
    [
      "llevo...",
      "me pongo...",
      "combina con...",
      "para el frío...",
      "para trabajar...",
      "mi ropa favorita...",
    ],
    {
      label: {
        en: "Choose and describe outfits for two situations",
        es: "Elige y describe ropa para dos situaciones",
        pt: "Escolha e descreva roupas para duas situações",
        it: "Scegli e descrivi abiti per due situazioni",
        fr: "Choisis et décris des tenues pour deux situations",
        de: "Kleidung für zwei Situationen auswählen und beschreiben",
        ja: "2つの場面に合う服装を選んで説明する",
        hi: "दो परिस्थितियों के लिए कपड़े चुनें और उनका वर्णन करें",
        ar: "اختر وصِف ملابس لموقفين",
        zh: "为两个场景选择并描述服装",
      },
      goal: "Choose and describe an appropriate outfit for two simple situations",
      examples: ["Para el frío, me pongo un abrigo.", "Llevo una camisa azul para trabajar."],
      activityBrief:
        "Give one weather context and one everyday event, asking what the learner wears and one color detail",
      evidence:
        "The learner chooses suitable clothing and describes one item in each situation",
    },
  ),
  "lesson-a1-15-2": agenda(
    [
      "me levanto",
      "me ducho",
      "me visto",
      "desayuno",
      "voy a...",
      "a las...",
    ],
    {
      label: {
        en: "Describe a four-step morning routine with a time",
        es: "Describe una rutina matutina de cuatro pasos con una hora",
        pt: "Descreva uma rotina matinal de quatro etapas com um horário",
        it: "Descrivi una routine mattutina di quattro fasi con un orario",
        fr: "Décris une routine du matin en quatre étapes avec une heure",
        de: "Eine Morgenroutine mit vier Schritten und einer Uhrzeit beschreiben",
        ja: "時刻を入れて4段階の朝の習慣を説明する",
        hi: "समय के साथ सुबह की चार चरणों वाली दिनचर्या बताएं",
        ar: "صِف روتينًا صباحيًا من أربع خطوات مع ذكر وقت",
        zh: "描述包含时间的四步晨间日常",
      },
      goal: "Describe a four-step morning routine and include at least one time",
      examples: ["Me levanto a las siete.", "Después, me ducho."],
      activityBrief:
        "Prompt the learner through waking, washing, dressing, eating, and leaving, then ask for one time",
      evidence:
        "The learner produces four ordered morning actions and one understandable time",
    },
  ),
  "lesson-a1-15-3": agenda(
    [
      "por la mañana",
      "luego",
      "después",
      "por la tarde",
      "por la noche",
      "antes de dormir",
    ],
    {
      label: {
        en: "Put five daily events in order from morning to night",
        es: "Ordena cinco actividades diarias de la mañana a la noche",
        pt: "Coloque cinco atividades diárias em ordem da manhã à noite",
        it: "Metti in ordine cinque attività quotidiane dalla mattina alla sera",
        fr: "Mets cinq activités quotidiennes dans l’ordre du matin au soir",
        de: "Fünf tägliche Ereignisse vom Morgen bis zum Abend ordnen",
        ja: "朝から夜までの5つの日課を順番に並べる",
        hi: "सुबह से रात तक की पांच दैनिक गतिविधियों को क्रम में रखें",
        ar: "رتّب خمسة أنشطة يومية من الصباح إلى الليل",
        zh: "按从早到晚的顺序排列五项日常活动",
      },
      goal:
        "Sequence five daily events from morning to night using time-of-day connectors",
      examples: ["Por la mañana desayuno.", "Después trabajo.", "Por la noche ceno."],
      activityBrief:
        "Give five familiar routine actions out of order and ask the learner to rebuild the day with connectors",
      evidence:
        "The learner places all five events in a logical order and uses at least three time connectors",
      kind: "comprehension",
      evidenceType: "sequence_and_produce",
    },
  ),
  "lesson-a1-16-2": agenda(
    [
      "en primavera...",
      "en verano...",
      "en otoño...",
      "en invierno...",
      "hace...",
      "está...",
    ],
    {
      label: {
        en: "Compare the weather in two seasons",
        es: "Compara el tiempo en dos estaciones",
        pt: "Compare o tempo em duas estações",
        it: "Confronta il tempo in due stagioni",
        fr: "Compare le temps pendant deux saisons",
        de: "Das Wetter in zwei Jahreszeiten vergleichen",
        ja: "2つの季節の天気を比べる",
        hi: "दो ऋतुओं के मौसम की तुलना करें",
        ar: "قارن الطقس في فصلين",
        zh: "比较两个季节的天气",
      },
      goal: "Describe and compare the weather in two different seasons",
      examples: ["En verano hace calor.", "En invierno hace frío."],
      activityBrief:
        "Choose two contrasting seasons and ask for one weather expression in each plus one preferred season",
      evidence:
        "The learner gives an appropriate weather description for both seasons and states a preference",
    },
  ),
  "lesson-a1-16-3": agenda(
    [
      "¿qué tiempo hace en...?",
      "en ... hace...",
      "hoy",
      "mañana",
      "la temperatura",
      "... grados",
    ],
    {
      label: {
        en: "Compare two city forecasts and choose a destination",
        es: "Compara el pronóstico de dos ciudades y elige un destino",
        pt: "Compare a previsão de duas cidades e escolha um destino",
        it: "Confronta le previsioni di due città e scegli una destinazione",
        fr: "Compare les prévisions de deux villes et choisis une destination",
        de: "Die Vorhersagen für zwei Städte vergleichen und ein Reiseziel wählen",
        ja: "2都市の天気予報を比べ、行き先を選ぶ",
        hi: "दो शहरों के मौसम पूर्वानुमान की तुलना करें और एक गंतव्य चुनें",
        ar: "قارن توقعات الطقس لمدينتين واختر وجهة",
        zh: "比较两个城市的天气预报并选择目的地",
      },
      goal:
        "Compare today's or tomorrow's weather in two cities and choose one destination",
      examples: ["En Madrid hace sol y hay veinte grados.", "Prefiero Madrid."],
      activityBrief:
        "Present two one-day city forecasts with different conditions and temperatures, then ask which city the learner chooses",
      evidence:
        "The learner identifies one condition in each city and gives an understandable choice",
      kind: "comprehension",
      evidenceType: "compare_and_choose",
    },
  ),
  "lesson-a1-17-2": agenda(
    [
      "¿te gusta...?",
      "me gusta...",
      "me gustan...",
      "me encanta...",
      "a mí también",
      "a mí tampoco",
    ],
    {
      label: {
        en: "Exchange three preferences and respond with también or tampoco",
        es: "Intercambia tres preferencias y responde con también o tampoco",
        pt: "Troque três preferências e responda com también ou tampoco",
        it: "Scambia tre preferenze e rispondi con también o tampoco",
        fr: "Échange trois préférences et réponds avec también ou tampoco",
        de: "Drei Vorlieben austauschen und mit también oder tampoco reagieren",
        ja: "好みを3つ伝え合い、también または tampoco で反応する",
        hi: "तीन पसंद साझा करें और también या tampoco से जवाब दें",
        ar: "تبادل ثلاثة تفضيلات وردّ باستخدام también أو tampoco",
        zh: "交流三个偏好，并用 también 或 tampoco 回应",
      },
      goal:
        "Exchange three likes or dislikes and react with también or tampoco",
      examples: ["Me gusta leer. — A mí también.", "No me gusta correr. — A mí tampoco."],
      activityBrief:
        "Ask about three familiar activities or things, requiring one agreement with también and one with tampoco",
      evidence:
        "The learner states three preferences and uses también and tampoco in matching contexts",
    },
  ),
  "lesson-a1-17-3": agenda(
    [
      "mi ... favorito / favorita es...",
      "prefiero...",
      "odio...",
      "me gusta + infinitivo",
      "me gustan + plural",
      "porque...",
    ],
    {
      label: {
        en: "Explain two favorites and one dislike",
        es: "Explica dos cosas favoritas y algo que no te gusta",
        pt: "Explique duas coisas favoritas e algo de que não gosta",
        it: "Spiega due cose preferite e una cosa che non piace",
        fr: "Explique deux choses préférées et une chose que tu n’aimes pas",
        de: "Zwei Favoriten und eine Abneigung erklären",
        ja: "好きなもの2つと嫌いなもの1つを説明する",
        hi: "दो पसंदीदा चीज़ें और एक नापसंद समझाएं",
        ar: "اشرح شيئين مفضلين وشيئًا واحدًا لا تحبه",
        zh: "说明两个最喜欢的事物和一个不喜欢的事物",
      },
      goal:
        "Explain two favorites and one dislike using a noun, a plural, or an infinitive",
      examples: ["Mi comida favorita es la pizza.", "Me gusta bailar porque es divertido."],
      activityBrief:
        "Ask for a favorite food or object, a favorite activity, and one dislike, prompting a short porque reason once",
      evidence:
        "The learner states all three preferences and gives one understandable reason",
    },
  ),
  "lesson-a1-18-2": agenda(
    [
      "¿qué...?",
      "¿quién...?",
      "¿dónde...?",
      "¿cuándo...?",
      "¿cómo...?",
      "¿por qué...?",
      "¿cuánto...?",
    ],
    {
      label: {
        en: "Ask five different information questions in a short interview",
        es: "Haz cinco preguntas de información distintas en una entrevista breve",
        pt: "Faça cinco perguntas de informação diferentes em uma entrevista curta",
        it: "Fai cinque domande informative diverse in una breve intervista",
        fr: "Pose cinq questions d’information différentes dans un court entretien",
        de: "In einem kurzen Interview fünf verschiedene Informationsfragen stellen",
        ja: "短いインタビューで異なる情報質問を5つする",
        hi: "छोटे साक्षात्कार में पांच अलग-अलग जानकारी वाले प्रश्न पूछें",
        ar: "اطرح خمسة أسئلة معلومات مختلفة في مقابلة قصيرة",
        zh: "在简短采访中提出五个不同的信息问题",
      },
      goal: "Ask five different information questions in a short interview",
      examples: ["¿Dónde vives?", "¿Cuándo trabajas?", "¿Por qué estudias español?"],
      activityBrief:
        "Run a five-question interview, requiring a different question word each time and answering each in one short sentence",
      evidence:
        "The learner forms five understandable questions with five different question words",
    },
  ),
  "lesson-a1-18-3": agenda(
    [
      "¿cómo te llamas?",
      "¿de dónde eres?",
      "¿dónde vives?",
      "¿qué te gusta?",
      "¿cuándo...?",
      "¿por qué...?",
    ],
    {
      label: {
        en: "Complete a five-question personal-information exchange",
        es: "Completa un intercambio de cinco preguntas de información personal",
        pt: "Complete uma troca de cinco perguntas de informação pessoal",
        it: "Completa uno scambio di cinque domande personali",
        fr: "Complète un échange de cinq questions personnelles",
        de: "Einen Austausch mit fünf Fragen zu persönlichen Angaben abschließen",
        ja: "個人情報について5つ質問するやり取りを完成させる",
        hi: "व्यक्तिगत जानकारी के पांच प्रश्नों वाला संवाद पूरा करें",
        ar: "أكمل حوارًا من خمسة أسئلة عن المعلومات الشخصية",
        zh: "完成包含五个个人信息问题的交流",
      },
      goal:
        "Complete a five-question exchange about name, origin, home, preferences, and routine",
      examples: ["¿De dónde eres? — Soy de México.", "¿Qué te gusta? — Me gusta la música."],
      activityBrief:
        "Conduct a five-question personal-information exchange with one short answer per question, then switch roles for the final question",
      evidence:
        "The learner asks or answers five relevant personal-information questions understandably",
    },
  ),
});

const buildAgenda = (lessonId, spec, modes) => [
  ...spec.forms.map((form, index) => formItem(lessonId, index, form, modes)),
  applicationItem(lessonId, spec.application, modes),
];

export function getManualA1AgendaItems(lesson, { modes = null } = {}) {
  const lessonId = typeof lesson === "string" ? lesson : lesson?.id;
  const spec = MANUAL_A1_AGENDAS[lessonId];
  if (!spec) return [];
  const lessonModes =
    modes ||
    (typeof lesson === "object" && Array.isArray(lesson?.modes)
      ? lesson.modes
      : ["vocabulary", "realtime"]);
  return buildAgenda(lessonId, spec, lessonModes);
}
