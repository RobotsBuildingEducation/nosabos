// Localized review/practice task-format sentences for the Tutor.
//
// These sentences are instructions TO the tutor model, one per turn — and on
// gpt-realtime-2.1-mini, English-authored format sentences kept surfacing as
// spoken English inside support-language lessons ("Give a one-word
// fill-in-the-blank…" became "Now write the missing word in English." in a
// Spanish-support session). An English rule about speaking Spanish loses to
// English material; the durable fix is handing the model its per-turn content
// already written in the support language. Same mechanism as
// openaiTutorLanguageAnchor.js.
//
// Index order MUST stay identical across languages (the rotation is keyed by
// turn count), and phrased for SPEECH — ask the learner to say things, never
// to write. English entries remain the source wording for Gemini and the
// fallback for unlisted codes.

export const TUTOR_TASK_FORMATS_GENERAL = {
  en: [
    "Ask one tiny meaning-check question about the current lesson concept.",
    "Give a fill-in-the-blank prompt using a current lesson phrase.",
    "Offer two short choices and ask the learner to pick the correct one.",
    "Ask the learner to transform or personalize a current lesson phrase.",
    "Set up a tiny realistic scenario and ask for one short reply.",
    "Ask the learner to combine two already covered lesson concepts.",
  ],
  es: [
    "Haz una pequeña pregunta para comprobar el significado del concepto actual de la lección.",
    "Propón una frase de la lección para completar diciendo la palabra que falta.",
    "Ofrece dos opciones cortas y pide al estudiante que elija la correcta.",
    "Pide al estudiante que transforme o personalice una frase de la lección.",
    "Plantea una situación realista muy breve y pide una respuesta corta.",
    "Pide al estudiante que combine dos conceptos ya vistos en la lección.",
  ],
  pt: [
    "Faça uma pequena pergunta para verificar o significado do conceito atual da lição.",
    "Proponha uma frase da lição para completar dizendo a palavra que falta.",
    "Ofereça duas opções curtas e peça ao aluno que escolha a correta.",
    "Peça ao aluno que transforme ou personalize uma frase da lição.",
    "Crie uma situação realista bem curta e peça uma resposta breve.",
    "Peça ao aluno que combine dois conceitos já vistos na lição.",
  ],
  fr: [
    "Pose une petite question pour vérifier le sens du concept actuel de la leçon.",
    "Propose une phrase de la leçon à compléter en disant le mot manquant.",
    "Propose deux choix courts et demande à l'élève de choisir le bon.",
    "Demande à l'élève de transformer ou de personnaliser une phrase de la leçon.",
    "Mets en place une toute petite situation réaliste et demande une réponse courte.",
    "Demande à l'élève de combiner deux notions déjà vues dans la leçon.",
  ],
  it: [
    "Fai una piccola domanda per verificare il significato del concetto attuale della lezione.",
    "Proponi una frase della lezione da completare dicendo la parola mancante.",
    "Offri due opzioni brevi e chiedi allo studente di scegliere quella corretta.",
    "Chiedi allo studente di trasformare o personalizzare una frase della lezione.",
    "Prepara una piccolissima situazione realistica e chiedi una risposta breve.",
    "Chiedi allo studente di combinare due concetti già visti nella lezione.",
  ],
  de: [
    "Stelle eine kleine Verständnisfrage zum aktuellen Konzept der Lektion.",
    "Gib einen Lückensatz mit einer Phrase aus der Lektion vor; das fehlende Wort wird gesprochen.",
    "Biete zwei kurze Möglichkeiten an und lass den Lernenden die richtige wählen.",
    "Bitte den Lernenden, eine Phrase aus der Lektion umzuformen oder zu personalisieren.",
    "Baue eine winzige realistische Situation auf und bitte um eine kurze Antwort.",
    "Bitte den Lernenden, zwei bereits behandelte Konzepte der Lektion zu kombinieren.",
  ],
  ja: [
    "今のレッスンの概念について、意味を確認する小さな質問をひとつしてください。",
    "レッスンのフレーズを使った穴埋めをひとつ出し、足りない語を言ってもらってください。",
    "短い選択肢をふたつ出して、正しいほうを選んでもらってください。",
    "レッスンのフレーズを変形するか、自分のことに置き換えて言ってもらってください。",
    "ごく小さな現実的な場面を設定して、短い返事を求めてください。",
    "すでに学んだふたつの内容を組み合わせて言ってもらってください。",
  ],
  zh: [
    "就当前课程概念提一个小小的意思确认问题。",
    "用课程中的短语出一道填空，让学员说出缺少的词。",
    "给出两个简短选项，让学员选出正确的一个。",
    "请学员改写课程中的短语，或结合自己的情况来说。",
    "设置一个很小的真实场景，请学员做出简短回应。",
    "请学员把已学过的两个内容组合起来说。",
  ],
  ru: [
    "Задай один маленький вопрос на понимание текущего понятия урока.",
    "Дай задание с пропуском по фразе из урока — пропущенное слово нужно сказать.",
    "Предложи два коротких варианта и попроси ученика выбрать правильный.",
    "Попроси ученика изменить или персонализировать фразу из урока.",
    "Создай крошечную реалистичную ситуацию и попроси короткий ответ.",
    "Попроси ученика соединить два уже пройденных понятия урока.",
  ],
  ar: [
    "اطرح سؤالًا صغيرًا للتحقق من معنى المفهوم الحالي في الدرس.",
    "قدّم جملة من الدرس لإكمالها بقول الكلمة الناقصة.",
    "اعرض خيارين قصيرين واطلب من المتعلم اختيار الصحيح.",
    "اطلب من المتعلم تحويل جملة من الدرس أو جعلها شخصية.",
    "جهّز موقفًا واقعيًا صغيرًا جدًا واطلب ردًا قصيرًا.",
    "اطلب من المتعلم دمج مفهومين سبق تعلمهما في الدرس.",
  ],
  hi: [
    "पाठ की मौजूदा अवधारणा के अर्थ की जाँच के लिए एक छोटा प्रश्न पूछें।",
    "पाठ के किसी वाक्यांश से रिक्त स्थान का अभ्यास दें — छूटा हुआ शब्द बोलकर बताना है।",
    "दो छोटे विकल्प दें और शिक्षार्थी से सही विकल्प चुनने को कहें।",
    "शिक्षार्थी से पाठ के किसी वाक्यांश को बदलने या अपने बारे में कहने को कहें।",
    "एक बहुत छोटी वास्तविक स्थिति बनाएँ और छोटा उत्तर माँगें।",
    "शिक्षार्थी से पहले सीखी दो चीज़ों को जोड़कर कहने को कहें।",
  ],
};

export const TUTOR_TASK_FORMATS_PRE_A1 = {
  en: [
    "Ask one yes/no meaning check about the current word or phrase.",
    "Give a one-word fill-in-the-blank using the current lesson item.",
    "Offer two familiar words and ask the learner to choose one.",
    "Give one tiny scenario whose answer is the current 1-3 word phrase.",
  ],
  es: [
    "Haz una pregunta de sí o no sobre el significado de la palabra o frase actual.",
    "Pide completar diciendo una sola palabra que falta del elemento actual de la lección.",
    "Ofrece dos palabras conocidas y pide al estudiante que elija una.",
    "Plantea una situación muy pequeña cuya respuesta sea la frase actual de 1 a 3 palabras.",
  ],
  pt: [
    "Faça uma pergunta de sim ou não sobre o significado da palavra ou frase atual.",
    "Peça para completar dizendo uma única palavra que falta do item atual da lição.",
    "Ofereça duas palavras conhecidas e peça ao aluno que escolha uma.",
    "Crie uma situação bem pequena cuja resposta seja a frase atual de 1 a 3 palavras.",
  ],
  fr: [
    "Pose une question par oui ou non sur le sens du mot ou de la phrase en cours.",
    "Fais compléter en disant un seul mot manquant de l'élément actuel de la leçon.",
    "Propose deux mots connus et demande à l'élève d'en choisir un.",
    "Propose une toute petite situation dont la réponse est la phrase actuelle de 1 à 3 mots.",
  ],
  it: [
    "Fai una domanda sì o no sul significato della parola o frase attuale.",
    "Fai completare dicendo una sola parola mancante dell'elemento attuale della lezione.",
    "Offri due parole conosciute e chiedi allo studente di sceglierne una.",
    "Proponi una situazione piccolissima la cui risposta sia la frase attuale di 1-3 parole.",
  ],
  de: [
    "Stelle eine Ja-oder-Nein-Frage zur Bedeutung des aktuellen Wortes oder Ausdrucks.",
    "Lass ein einzelnes fehlendes Wort des aktuellen Lerninhalts sprechen und ergänzen.",
    "Biete zwei vertraute Wörter an und lass den Lernenden eines wählen.",
    "Gib eine winzige Situation vor, deren Antwort die aktuelle Phrase aus 1-3 Wörtern ist.",
  ],
  ja: [
    "今の単語やフレーズの意味について、はい・いいえで答える質問をしてください。",
    "今の学習項目から一語だけの穴埋めを出し、その語を言ってもらってください。",
    "よく知っているふたつの単語を出して、ひとつ選んでもらってください。",
    "答えが今の1〜3語のフレーズになる、ごく小さな場面を出してください。",
  ],
  zh: [
    "就当前单词或短语的意思提一个是非问题。",
    "用当前学习内容出一道只填一个词的填空，让学员说出来。",
    "给出两个熟悉的单词，让学员选择一个。",
    "给出一个很小的场景，答案就是当前的1至3个词的短语。",
  ],
  ru: [
    "Задай вопрос «да или нет» о значении текущего слова или фразы.",
    "Попроси сказать одно пропущенное слово из текущего материала урока.",
    "Предложи два знакомых слова и попроси ученика выбрать одно.",
    "Дай крошечную ситуацию, ответом на которую будет текущая фраза из 1-3 слов.",
  ],
  ar: [
    "اطرح سؤال نعم أو لا عن معنى الكلمة أو العبارة الحالية.",
    "اطلب إكمال كلمة واحدة ناقصة من عنصر الدرس الحالي بقولها.",
    "اعرض كلمتين مألوفتين واطلب من المتعلم اختيار واحدة.",
    "قدّم موقفًا صغيرًا جدًا تكون إجابته العبارة الحالية من كلمة إلى ثلاث كلمات.",
  ],
  hi: [
    "मौजूदा शब्द या वाक्यांश के अर्थ पर हाँ या नहीं वाला एक प्रश्न पूछें।",
    "पाठ की मौजूदा सामग्री से केवल एक छूटा हुआ शब्द बोलकर भरवाएँ।",
    "दो जाने-पहचाने शब्द दें और शिक्षार्थी से एक चुनने को कहें।",
    "एक बहुत छोटी स्थिति दें जिसका उत्तर मौजूदा 1-3 शब्दों का वाक्यांश हो।",
  ],
};

function normalizeLangKey(code = "") {
  return String(code || "")
    .trim()
    .toLowerCase()
    .split(/[-_]/)[0];
}

export function getLocalizedTutorTaskFormatSentence(
  turnCount = 0,
  selectedLevel = "A1",
  supportCode = "en",
) {
  const pool =
    selectedLevel === "Pre-A1"
      ? TUTOR_TASK_FORMATS_PRE_A1
      : TUTOR_TASK_FORMATS_GENERAL;
  const list = pool[normalizeLangKey(supportCode)] || pool.en;
  const index =
    Math.abs(Number.isFinite(turnCount) ? turnCount : 0) % list.length;
  return list[index];
}
