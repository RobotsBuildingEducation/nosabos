// Authored target-language material for the focused curriculum repair pass.
// These entries replace agenda IDs whose actual subject changed; aliases on
// capability-only rewrites continue to reuse their existing localized data.

const SPECS = {
  range31: ["lesson-a1-4-1", "vocabulary-treinta-y-uno-cuarenta-cincuenta-1", "Numbers thirty-one, forty, and fifty"],
  agreement31: ["lesson-a1-4-1", "grammar-agreement-treinta-y-un-libros-treinta-y-una-casas-3", "Use thirty-one naturally before nouns"],
  numberPrices: ["lesson-a1-4-2", "realtime-practice-numbers-31-100-with-prices-totals-and-chang-1", "Practice numbers 31-100 with prices, totals, and change"],
  numberContext: ["lesson-a1-4-3", "realtime-use-numbers-31-100-to-state-prices-scores-totals-and-1", "Use numbers 31-100 to state prices, scores, totals, and quantities"],
  classOne: ["lesson-a1-12-1", "vocabulary-el-libro-el-cuaderno-el-boligrafo-el-lapiz-1", "Book, notebook, pen, and pencil"],
  classTwo: ["lesson-a1-12-1", "vocabulary-la-mochila-el-escritorio-la-pizarra-2", "Backpack, desk, and board"],
  classThree: ["lesson-a1-12-1", "vocabulary-el-ordenador-computadora-la-pantalla-el-teclado-3", "Computer, screen, and keyboard"],
  appointmentRead: ["lesson-a1-7-3", "reading-read-two-schedules-and-identify-a-mutually-available-1", "Read two schedules and identify a mutually available appointment time"],
  appointmentSpeak: ["lesson-a1-7-3", "realtime-arrange-confirm-and-reschedule-an-appointment-using--1", "Arrange, confirm, and reschedule an appointment using dates and times"],
  billRead: ["lesson-a1-11-3", "reading-read-an-itemized-restaurant-bill-and-verify-the-item-1", "Read an itemized restaurant bill and verify the items, total, and change"],
  billSpeak: ["lesson-a1-11-3", "realtime-ask-for-the-bill-clarify-a-charge-choose-a-payment-m-1", "Ask for the bill, clarify a charge, choose a payment method, and close politely"],
  fitnessRead: ["lesson-a2-9-3", "reading-read-a-fitness-plan-and-identify-its-activity-freque-1", "Read a fitness plan and identify its activity, frequency, and goal"],
  fitnessSpeak: ["lesson-a2-9-3", "realtime-state-a-fitness-goal-and-explain-what-activity-you-w-1", "State a fitness goal and explain what activity you will do and how often"],
  dreamJobRead: ["lesson-a2-16-3", "reading-read-two-job-profiles-and-identify-which-one-matches-1", "Read two job profiles and identify which one matches a person's interests and why"],
  dreamJobSpeak: ["lesson-a2-16-3", "realtime-describe-a-dream-job-and-explain-the-tasks-workplace-1", "Describe a dream job and explain the tasks, workplace, and qualities you want"],
  learningRead: ["lesson-a2-17-3", "reading-read-a-learner-progress-note-and-identify-strengths--1", "Read a learner progress note and identify strengths, challenges, and the next goal"],
  learningSpeak: ["lesson-a2-17-3", "realtime-describe-your-learning-progress-and-set-one-specific-1", "Describe your learning progress and set one specific study goal"],
  scienceRead: ["lesson-b2-7-3", "reading-read-predictions-about-an-emerging-technology-and-di-1", "Read predictions about an emerging technology and distinguish evidence from speculation"],
  scienceSpeak: ["lesson-b2-7-3", "realtime-predict-how-a-scientific-advance-could-affect-daily--1", "Predict how a scientific advance could affect daily life and defend the prediction"],
  civicRead: ["lesson-b2-10-3", "reading-read-a-community-proposal-and-identify-a-concrete-ac-1", "Read a community proposal and identify a concrete action citizens can take"],
  civicSpeak: ["lesson-b2-10-3", "realtime-propose-a-civic-action-explain-its-benefit-and-respo-1", "Propose a civic action, explain its benefit, and respond to one concern"],
  leadRead: ["lesson-c1-6-3", "reading-read-a-team-proposal-and-identify-its-priorities-ris-1", "Read a team proposal and identify its priorities, risks, and responsibilities"],
  leadSpeak: ["lesson-c1-6-3", "realtime-lead-a-short-meeting-by-framing-the-goal-inviting-in-1", "Lead a short meeting by framing the goal, inviting input, and assigning next steps"],
};

const FORM_KEYS = new Set([
  "range31",
  "agreement31",
  "classOne",
  "classTwo",
  "classThree",
]);

const DATA = {
  en: {
    forms: { range31: "thirty-one, forty, fifty", agreement31: "thirty-one + noun", classOne: "book, notebook, pen, pencil", classTwo: "backpack, desk, board", classThree: "computer, screen, keyboard" },
    examples: {
      range31: "Thirty-one, forty, fifty.", agreement31: "Thirty-one books and thirty-one chairs.", numberPrices: "It costs forty-seven dollars; the total is eighty-three.", numberContext: "The score is seventy-two, and there are sixty-four tickets.",
      classOne: "The notebook and pencil are on the desk.", classTwo: "My backpack is beside the board.", classThree: "The computer screen and keyboard are on the desk.",
      appointmentRead: "Sam is free Tuesday at three, and Lee is free then too.", appointmentSpeak: "Can we meet Tuesday at three? Could we move it to four?",
      billRead: "The bill lists two meals for thirty dollars and five dollars in change.", billSpeak: "The bill, please. What is this charge? I'll pay by card.",
      fitnessRead: "Her plan is to swim three times a week so she can improve her endurance.", fitnessSpeak: "My goal is to run five kilometers, so I will train three times a week.",
      dreamJobRead: "The design role fits Ana because she enjoys creative teamwork.", dreamJobSpeak: "My dream job is teaching in a small school because I want creative, people-focused work.",
      learningRead: "Reading is her strength, speaking is still difficult, and her next goal is one conversation a day.", learningSpeak: "I understand more now; my next goal is to speak for ten minutes every day.",
      scienceRead: "The battery already works in the lab, but claims about replacing gasoline remain speculative.", scienceSpeak: "This advance could reduce household energy costs because it stores power more efficiently.",
      civicRead: "Residents can attend the council meeting and volunteer for the neighborhood cleanup.", civicSpeak: "I propose a monthly cleanup; it improves the park, though we must address volunteer safety.",
      leadRead: "The proposal prioritizes launch quality, assigns Maya to testing, and identifies schedule risk.", leadSpeak: "Our goal is a safe launch. What concerns do you see? Maya will own testing by Friday.",
    },
  },
  de: {
    forms: { range31: "einunddreißig, vierzig, fünfzig", agreement31: "einunddreißig + Substantiv", classOne: "Buch, Heft, Kugelschreiber, Bleistift", classTwo: "Rucksack, Schreibtisch, Tafel", classThree: "Computer, Bildschirm, Tastatur" },
    examples: {
      range31: "Einunddreißig, vierzig, fünfzig.", agreement31: "Einunddreißig Bücher und einunddreißig Stühle.", numberPrices: "Es kostet siebenundvierzig Euro; die Summe ist dreiundachtzig.", numberContext: "Der Punktestand ist zweiundsiebzig, und es gibt vierundsechzig Karten.",
      classOne: "Das Heft und der Bleistift liegen auf dem Schreibtisch.", classTwo: "Mein Rucksack steht neben der Tafel.", classThree: "Bildschirm und Tastatur stehen beim Computer.",
      appointmentRead: "Sam kann am Dienstag um drei, und Lee hat dann auch Zeit.", appointmentSpeak: "Können wir uns Dienstag um drei treffen? Können wir den Termin auf vier verschieben?",
      billRead: "Die Rechnung enthält zwei Gerichte für dreißig Euro und fünf Euro Rückgeld.", billSpeak: "Die Rechnung, bitte. Was ist diese Gebühr? Ich zahle mit Karte.",
      fitnessRead: "Sie will dreimal pro Woche schwimmen, um ihre Ausdauer zu verbessern.", fitnessSpeak: "Mein Ziel sind fünf Kilometer; deshalb trainiere ich dreimal pro Woche.",
      dreamJobRead: "Die Designstelle passt zu Ana, weil sie kreative Teamarbeit mag.", dreamJobSpeak: "Mein Traumberuf ist Lehrerin an einer kleinen Schule, weil ich kreativ mit Menschen arbeiten möchte.",
      learningRead: "Lesen ist ihre Stärke, Sprechen fällt ihr schwer, und ihr nächstes Ziel ist ein Gespräch pro Tag.", learningSpeak: "Ich verstehe jetzt mehr; mein nächstes Ziel sind täglich zehn Minuten Sprechen.",
      scienceRead: "Die Batterie funktioniert bereits im Labor, aber der Ersatz von Benzin bleibt Spekulation.", scienceSpeak: "Diese Entwicklung könnte Energiekosten senken, weil sie Strom effizienter speichert.",
      civicRead: "Die Einwohner können zur Ratssitzung gehen und bei der Reinigung des Viertels helfen.", civicSpeak: "Ich schlage eine monatliche Reinigung vor; sie verbessert den Park, aber wir müssen die Sicherheit klären.",
      leadRead: "Der Vorschlag priorisiert Qualität, gibt Maya die Tests und nennt den Zeitplan als Risiko.", leadSpeak: "Unser Ziel ist ein sicherer Start. Welche Bedenken gibt es? Maya übernimmt die Tests bis Freitag.",
    },
  },
  el: {
    forms: { range31: "τριάντα ένα, σαράντα, πενήντα", agreement31: "τριάντα ένα + ουσιαστικό", classOne: "βιβλίο, τετράδιο, στυλό, μολύβι", classTwo: "τσάντα, θρανίο, πίνακας", classThree: "υπολογιστής, οθόνη, πληκτρολόγιο" },
    examples: {
      range31: "Τριάντα ένα, σαράντα, πενήντα.", agreement31: "Τριάντα ένα βιβλία και τριάντα μία καρέκλες.", numberPrices: "Κοστίζει σαράντα επτά ευρώ· το σύνολο είναι ογδόντα τρία.", numberContext: "Το σκορ είναι εβδομήντα δύο και υπάρχουν εξήντα τέσσερα εισιτήρια.",
      classOne: "Το τετράδιο και το μολύβι είναι πάνω στο θρανίο.", classTwo: "Η τσάντα μου είναι δίπλα στον πίνακα.", classThree: "Η οθόνη και το πληκτρολόγιο είναι στο γραφείο.",
      appointmentRead: "Ο Σαμ είναι ελεύθερος την Τρίτη στις τρεις και η Λι επίσης.", appointmentSpeak: "Μπορούμε να συναντηθούμε την Τρίτη στις τρεις; Μπορούμε να το αλλάξουμε για τις τέσσερις;",
      billRead: "Ο λογαριασμός γράφει δύο γεύματα για τριάντα ευρώ και πέντε ευρώ ρέστα.", billSpeak: "Τον λογαριασμό, παρακαλώ. Τι είναι αυτή η χρέωση; Θα πληρώσω με κάρτα.",
      fitnessRead: "Το σχέδιό της είναι να κολυμπά τρεις φορές την εβδομάδα για καλύτερη αντοχή.", fitnessSpeak: "Στόχος μου είναι να τρέξω πέντε χιλιόμετρα, γι' αυτό θα προπονούμαι τρεις φορές την εβδομάδα.",
      dreamJobRead: "Η θέση σχεδιασμού ταιριάζει στην Άνα επειδή της αρέσει η δημιουργική ομαδική εργασία.", dreamJobSpeak: "Η δουλειά των ονείρων μου είναι να διδάσκω σε μικρό σχολείο και να δουλεύω δημιουργικά με ανθρώπους.",
      learningRead: "Η ανάγνωση είναι το δυνατό της σημείο, η ομιλία παραμένει δύσκολη και ο επόμενος στόχος είναι μία συζήτηση τη μέρα.", learningSpeak: "Καταλαβαίνω περισσότερα τώρα· ο επόμενος στόχος μου είναι να μιλάω δέκα λεπτά κάθε μέρα.",
      scienceRead: "Η μπαταρία λειτουργεί ήδη στο εργαστήριο, αλλά η αντικατάσταση της βενζίνης παραμένει υπόθεση.", scienceSpeak: "Η πρόοδος αυτή μπορεί να μειώσει το κόστος ενέργειας επειδή αποθηκεύει ρεύμα πιο αποδοτικά.",
      civicRead: "Οι κάτοικοι μπορούν να πάνε στο συμβούλιο και να βοηθήσουν στον καθαρισμό της γειτονιάς.", civicSpeak: "Προτείνω μηνιαίο καθαρισμό· ωφελεί το πάρκο, αλλά πρέπει να φροντίσουμε την ασφάλεια.",
      leadRead: "Η πρόταση δίνει προτεραιότητα στην ποιότητα, αναθέτει τις δοκιμές στη Μάγια και σημειώνει τον κίνδυνο καθυστέρησης.", leadSpeak: "Στόχος μας είναι μια ασφαλής έναρξη. Τι ανησυχίες έχετε; Η Μάγια αναλαμβάνει τις δοκιμές ως την Παρασκευή.",
    },
  },
  fr: {
    forms: { range31: "trente et un, quarante, cinquante", agreement31: "trente et un / trente et une + nom", classOne: "livre, cahier, stylo, crayon", classTwo: "sac à dos, bureau, tableau", classThree: "ordinateur, écran, clavier" },
    examples: {
      range31: "Trente et un, quarante, cinquante.", agreement31: "Trente et un livres et trente et une chaises.", numberPrices: "Cela coûte quarante-sept euros ; le total est de quatre-vingt-trois.", numberContext: "Le score est de soixante-douze et il y a soixante-quatre billets.",
      classOne: "Le cahier et le crayon sont sur le bureau.", classTwo: "Mon sac à dos est près du tableau.", classThree: "L'écran et le clavier sont sur le bureau.",
      appointmentRead: "Sam est libre mardi à trois heures, et Lee aussi.", appointmentSpeak: "On peut se voir mardi à trois heures ? Peut-on déplacer le rendez-vous à quatre heures ?",
      billRead: "L'addition indique deux repas pour trente euros et cinq euros de monnaie.", billSpeak: "L'addition, s'il vous plaît. À quoi correspond ce montant ? Je paie par carte.",
      fitnessRead: "Son programme prévoit de nager trois fois par semaine pour améliorer son endurance.", fitnessSpeak: "Mon objectif est de courir cinq kilomètres ; je m'entraînerai trois fois par semaine.",
      dreamJobRead: "Le poste de design convient à Ana parce qu'elle aime le travail créatif en équipe.", dreamJobSpeak: "Mon métier idéal est d'enseigner dans une petite école pour travailler de façon créative avec les autres.",
      learningRead: "La lecture est son point fort, l'oral reste difficile et son prochain objectif est une conversation par jour.", learningSpeak: "Je comprends davantage ; mon prochain objectif est de parler dix minutes chaque jour.",
      scienceRead: "La batterie fonctionne déjà en laboratoire, mais le remplacement de l'essence reste hypothétique.", scienceSpeak: "Cette avancée pourrait réduire les coûts d'énergie car elle stocke mieux l'électricité.",
      civicRead: "Les habitants peuvent assister au conseil et participer au nettoyage du quartier.", civicSpeak: "Je propose un nettoyage mensuel ; il améliore le parc, mais il faut assurer la sécurité des bénévoles.",
      leadRead: "La proposition privilégie la qualité, confie les tests à Maya et signale un risque de calendrier.", leadSpeak: "Notre objectif est un lancement sûr. Quelles sont vos préoccupations ? Maya dirigera les tests avant vendredi.",
    },
  },
  ga: {
    forms: { range31: "tríocha a haon, daichead, caoga", agreement31: "tríocha a haon + ainmfhocal", classOne: "leabhar, leabhar nótaí, peann, peann luaidhe", classTwo: "mála droma, deasc, clár", classThree: "ríomhaire, scáileán, méarchlár" },
    examples: {
      range31: "Tríocha a haon, daichead, caoga.", agreement31: "Tríocha a haon leabhar agus tríocha a haon cathaoir.", numberPrices: "Cosnaíonn sé daichead a seacht euro; is é ochtó a trí an t-iomlán.", numberContext: "Is é seachtó a dó an scór agus tá seasca a ceathair ticéad ann.",
      classOne: "Tá an leabhar nótaí agus an peann luaidhe ar an deasc.", classTwo: "Tá mo mhála droma in aice leis an gclár.", classThree: "Tá an scáileán agus an méarchlár ar an deasc.",
      appointmentRead: "Tá Sam saor Dé Máirt ag a trí agus tá Lee saor ansin freisin.", appointmentSpeak: "An féidir linn bualadh Dé Máirt ag a trí? An féidir an coinne a athrú go dtí a ceathair?",
      billRead: "Tá dhá bhéile ar an mbille ar thríocha euro agus cúig euro mar shóinseáil.", billSpeak: "An bille, le do thoil. Cad é an táille seo? Íocfaidh mé le cárta.",
      fitnessRead: "Tá sé mar aidhm aici snámh trí huaire sa tseachtain chun seasmhacht a fheabhsú.", fitnessSpeak: "Is é mo sprioc cúig chiliméadar a rith, mar sin traenálfaidh mé trí huaire sa tseachtain.",
      dreamJobRead: "Oireann an post dearaidh d'Ana mar is maith léi obair chruthaitheach foirne.", dreamJobSpeak: "Is é mo phost aislingeach múineadh i scoil bheag agus obair chruthaitheach le daoine.",
      learningRead: "Is láidreacht í an léitheoireacht, tá an chaint deacair fós, agus is é comhrá amháin sa lá an chéad sprioc eile.", learningSpeak: "Tuigim níos mó anois; is é mo chéad sprioc eile labhairt ar feadh deich nóiméad gach lá.",
      scienceRead: "Oibríonn an cadhnra sa tsaotharlann cheana, ach níl in ionadú peitril ach tuairimíocht fós.", scienceSpeak: "D'fhéadfadh an dul chun cinn seo costas fuinnimh a laghdú mar stórálann sé cumhacht níos éifeachtaí.",
      civicRead: "Is féidir le cónaitheoirí freastal ar an gcruinniú comhairle agus cabhrú leis an nglanadh ceantair.", civicSpeak: "Molaim glanadh míosúil; feabhsaíonn sé an pháirc, ach caithfimid sábháilteacht a réiteach.",
      leadRead: "Tugann an moladh tús áite don cháilíocht, sannann sé tástáil do Maya agus aithníonn sé riosca ama.", leadSpeak: "Is é ár sprioc seoladh sábháilte. Cad iad na hábhair imní? Beidh Maya i gceannas ar an tástáil faoin Aoine.",
    },
  },
  it: {
    forms: { range31: "trentuno, quaranta, cinquanta", agreement31: "trentuno / trentun + nome", classOne: "libro, quaderno, penna, matita", classTwo: "zaino, scrivania, lavagna", classThree: "computer, schermo, tastiera" },
    examples: {
      range31: "Trentuno, quaranta, cinquanta.", agreement31: "Trentun libri e trentuna sedie.", numberPrices: "Costa quarantasette euro; il totale è ottantatré.", numberContext: "Il punteggio è settantadue e ci sono sessantaquattro biglietti.",
      classOne: "Il quaderno e la matita sono sulla scrivania.", classTwo: "Il mio zaino è accanto alla lavagna.", classThree: "Lo schermo e la tastiera sono sulla scrivania.",
      appointmentRead: "Sam è libero martedì alle tre e anche Lee è disponibile.", appointmentSpeak: "Possiamo vederci martedì alle tre? Possiamo spostare l'appuntamento alle quattro?",
      billRead: "Il conto indica due pasti per trenta euro e cinque euro di resto.", billSpeak: "Il conto, per favore. Cos'è questo addebito? Pago con la carta.",
      fitnessRead: "Il suo piano è nuotare tre volte alla settimana per migliorare la resistenza.", fitnessSpeak: "Il mio obiettivo è correre cinque chilometri, quindi mi allenerò tre volte alla settimana.",
      dreamJobRead: "Il ruolo nel design è adatto ad Ana perché ama il lavoro creativo di squadra.", dreamJobSpeak: "Il lavoro dei miei sogni è insegnare in una piccola scuola e lavorare creativamente con le persone.",
      learningRead: "La lettura è il suo punto forte, parlare è ancora difficile e il prossimo obiettivo è una conversazione al giorno.", learningSpeak: "Ora capisco di più; il mio prossimo obiettivo è parlare dieci minuti ogni giorno.",
      scienceRead: "La batteria funziona già in laboratorio, ma sostituire la benzina resta un'ipotesi.", scienceSpeak: "Questo progresso potrebbe ridurre i costi energetici perché immagazzina energia meglio.",
      civicRead: "I residenti possono partecipare al consiglio e aiutare nella pulizia del quartiere.", civicSpeak: "Propongo una pulizia mensile; migliora il parco, ma dobbiamo garantire la sicurezza.",
      leadRead: "La proposta dà priorità alla qualità, assegna i test a Maya e segnala un rischio di calendario.", leadSpeak: "Il nostro obiettivo è un lancio sicuro. Quali dubbi avete? Maya gestirà i test entro venerdì.",
    },
  },
  ja: {
    forms: { range31: "三十一、四十、五十", agreement31: "三十一 + 助数詞", classOne: "本、ノート、ペン、鉛筆", classTwo: "リュック、机、黒板", classThree: "コンピューター、画面、キーボード" },
    examples: {
      range31: "三十一、四十、五十。", agreement31: "本が三十一冊、椅子が三十一脚あります。", numberPrices: "四十七円で、合計は八十三円です。", numberContext: "得点は七十二点で、切符は六十四枚あります。",
      classOne: "ノートと鉛筆は机の上にあります。", classTwo: "リュックは黒板のそばにあります。", classThree: "画面とキーボードは机の上にあります。",
      appointmentRead: "サムは火曜日の三時が空いていて、リーも同じ時間が空いています。", appointmentSpeak: "火曜日の三時に会えますか。予約を四時に変更できますか。",
      billRead: "伝票には二つの食事が三十円、おつりが五円と書かれています。", billSpeak: "お会計をお願いします。この料金は何ですか。カードで払います。",
      fitnessRead: "持久力を上げるため、週に三回泳ぐ計画です。", fitnessSpeak: "目標は五キロ走ることなので、週に三回練習します。",
      dreamJobRead: "アナは創造的なチーム作業が好きなので、デザインの仕事が合っています。", dreamJobSpeak: "私の理想の仕事は小さな学校で教え、人と創造的に働くことです。",
      learningRead: "読解は得意ですが、会話はまだ難しく、次の目標は一日一回話すことです。", learningSpeak: "前より理解できます。次の目標は毎日十分話すことです。",
      scienceRead: "電池は研究室ですでに動きますが、ガソリンを置き換えるという話はまだ推測です。", scienceSpeak: "この進歩は電力を効率よく蓄えるため、家庭のエネルギー費を下げるかもしれません。",
      civicRead: "住民は議会に参加し、地域の清掃活動を手伝うことができます。", civicSpeak: "月一回の清掃を提案します。公園が良くなりますが、参加者の安全も考える必要があります。",
      leadRead: "提案は品質を優先し、テストをマヤに任せ、日程のリスクを示しています。", leadSpeak: "目標は安全な公開です。心配な点はありますか。マヤは金曜日までにテストを担当します。",
    },
  },
  nl: {
    forms: { range31: "eenendertig, veertig, vijftig", agreement31: "eenendertig + zelfstandig naamwoord", classOne: "boek, schrift, pen, potlood", classTwo: "rugzak, bureau, bord", classThree: "computer, scherm, toetsenbord" },
    examples: {
      range31: "Eenendertig, veertig, vijftig.", agreement31: "Eenendertig boeken en eenendertig stoelen.", numberPrices: "Het kost zevenenveertig euro; het totaal is drieëntachtig.", numberContext: "De score is tweeënzeventig en er zijn vierenzestig kaartjes.",
      classOne: "Het schrift en het potlood liggen op het bureau.", classTwo: "Mijn rugzak staat naast het bord.", classThree: "Het scherm en toetsenbord staan op het bureau.",
      appointmentRead: "Sam kan dinsdag om drie uur en Lee is dan ook vrij.", appointmentSpeak: "Kunnen we dinsdag om drie uur afspreken? Kunnen we de afspraak naar vier uur verzetten?",
      billRead: "De rekening vermeldt twee maaltijden voor dertig euro en vijf euro wisselgeld.", billSpeak: "De rekening, alstublieft. Wat is deze toeslag? Ik betaal met pin.",
      fitnessRead: "Haar plan is drie keer per week zwemmen om haar uithoudingsvermogen te verbeteren.", fitnessSpeak: "Mijn doel is vijf kilometer lopen, dus ik train drie keer per week.",
      dreamJobRead: "De ontwerpfunctie past bij Ana omdat ze graag creatief samenwerkt.", dreamJobSpeak: "Mijn droombaan is lesgeven op een kleine school en creatief met mensen werken.",
      learningRead: "Lezen is haar sterke punt, spreken blijft moeilijk en haar volgende doel is één gesprek per dag.", learningSpeak: "Ik begrijp nu meer; mijn volgende doel is elke dag tien minuten spreken.",
      scienceRead: "De batterij werkt al in het lab, maar benzine vervangen blijft speculatie.", scienceSpeak: "Deze vooruitgang kan energiekosten verlagen doordat stroom efficiënter wordt opgeslagen.",
      civicRead: "Bewoners kunnen de raadsvergadering bijwonen en helpen met de buurtschoonmaak.", civicSpeak: "Ik stel een maandelijkse schoonmaak voor; het park wordt beter, maar veiligheid vraagt aandacht.",
      leadRead: "Het voorstel geeft prioriteit aan kwaliteit, wijst testen toe aan Maya en noemt planningsrisico.", leadSpeak: "Ons doel is een veilige lancering. Welke zorgen zijn er? Maya leidt de tests tot vrijdag.",
    },
  },
  pl: {
    forms: { range31: "trzydzieści jeden, czterdzieści, pięćdziesiąt", agreement31: "trzydzieści jeden + rzeczownik", classOne: "książka, zeszyt, długopis, ołówek", classTwo: "plecak, biurko, tablica", classThree: "komputer, ekran, klawiatura" },
    examples: {
      range31: "Trzydzieści jeden, czterdzieści, pięćdziesiąt.", agreement31: "Trzydzieści jeden książek i trzydzieści jeden krzeseł.", numberPrices: "Kosztuje czterdzieści siedem euro; razem osiemdziesiąt trzy.", numberContext: "Wynik to siedemdziesiąt dwa, a biletów jest sześćdziesiąt cztery.",
      classOne: "Zeszyt i ołówek są na biurku.", classTwo: "Mój plecak jest obok tablicy.", classThree: "Ekran i klawiatura są na biurku.",
      appointmentRead: "Sam ma czas we wtorek o trzeciej i Lee również.", appointmentSpeak: "Możemy spotkać się we wtorek o trzeciej? Czy możemy przełożyć spotkanie na czwartą?",
      billRead: "Rachunek obejmuje dwa posiłki za trzydzieści euro i pięć euro reszty.", billSpeak: "Rachunek, proszę. Co to za opłata? Zapłacę kartą.",
      fitnessRead: "Jej plan to pływanie trzy razy w tygodniu, aby poprawić wytrzymałość.", fitnessSpeak: "Moim celem jest przebiec pięć kilometrów, więc będę ćwiczyć trzy razy w tygodniu.",
      dreamJobRead: "Praca projektowa pasuje do Any, bo lubi kreatywną pracę zespołową.", dreamJobSpeak: "Moja wymarzona praca to nauczanie w małej szkole i twórcza praca z ludźmi.",
      learningRead: "Czytanie jest jej mocną stroną, mówienie nadal trudnością, a kolejny cel to jedna rozmowa dziennie.", learningSpeak: "Teraz rozumiem więcej; moim kolejnym celem jest mówić dziesięć minut dziennie.",
      scienceRead: "Bateria działa już w laboratorium, ale zastąpienie benzyny pozostaje spekulacją.", scienceSpeak: "Ten postęp może obniżyć koszty energii, bo wydajniej magazynuje prąd.",
      civicRead: "Mieszkańcy mogą uczestniczyć w posiedzeniu rady i pomóc w sprzątaniu dzielnicy.", civicSpeak: "Proponuję comiesięczne sprzątanie; poprawi park, ale musimy zadbać o bezpieczeństwo.",
      leadRead: "Propozycja stawia na jakość, powierza testy Mai i wskazuje ryzyko harmonogramu.", leadSpeak: "Naszym celem jest bezpieczny start. Jakie są obawy? Maja poprowadzi testy do piątku.",
    },
  },
  pt: {
    forms: { range31: "trinta e um, quarenta, cinquenta", agreement31: "trinta e um / trinta e uma + substantivo", classOne: "livro, caderno, caneta, lápis", classTwo: "mochila, escrivaninha, quadro", classThree: "computador, tela, teclado" },
    examples: {
      range31: "Trinta e um, quarenta, cinquenta.", agreement31: "Trinta e um livros e trinta e uma cadeiras.", numberPrices: "Custa quarenta e sete reais; o total é oitenta e três.", numberContext: "O placar é setenta e dois e há sessenta e quatro ingressos.",
      classOne: "O caderno e o lápis estão sobre a escrivaninha.", classTwo: "Minha mochila está ao lado do quadro.", classThree: "A tela e o teclado estão sobre a escrivaninha.",
      appointmentRead: "Sam está livre terça-feira às três, e Lee também.", appointmentSpeak: "Podemos nos encontrar terça às três? Podemos mudar o compromisso para as quatro?",
      billRead: "A conta mostra duas refeições por trinta reais e cinco reais de troco.", billSpeak: "A conta, por favor. O que é esta cobrança? Vou pagar com cartão.",
      fitnessRead: "O plano dela é nadar três vezes por semana para melhorar a resistência.", fitnessSpeak: "Minha meta é correr cinco quilômetros, então vou treinar três vezes por semana.",
      dreamJobRead: "A vaga de design combina com Ana porque ela gosta de trabalho criativo em equipe.", dreamJobSpeak: "Meu emprego dos sonhos é ensinar em uma escola pequena e trabalhar criativamente com pessoas.",
      learningRead: "Leitura é seu ponto forte, falar ainda é difícil e a próxima meta é uma conversa por dia.", learningSpeak: "Agora entendo mais; minha próxima meta é falar dez minutos todos os dias.",
      scienceRead: "A bateria já funciona no laboratório, mas substituir a gasolina ainda é especulação.", scienceSpeak: "Esse avanço pode reduzir o custo de energia porque armazena eletricidade com mais eficiência.",
      civicRead: "Os moradores podem participar da reunião do conselho e ajudar na limpeza do bairro.", civicSpeak: "Proponho uma limpeza mensal; ela melhora o parque, mas precisamos cuidar da segurança.",
      leadRead: "A proposta prioriza qualidade, atribui os testes a Maya e aponta risco no cronograma.", leadSpeak: "Nosso objetivo é um lançamento seguro. Que preocupações existem? Maya cuidará dos testes até sexta.",
    },
  },
  ru: {
    forms: { range31: "тридцать один, сорок, пятьдесят", agreement31: "тридцать один / тридцать одна + существительное", classOne: "книга, тетрадь, ручка, карандаш", classTwo: "рюкзак, парта, доска", classThree: "компьютер, экран, клавиатура" },
    examples: {
      range31: "Тридцать один, сорок, пятьдесят.", agreement31: "Тридцать одна книга и тридцать один стул.", numberPrices: "Это стоит сорок семь рублей; итог — восемьдесят три.", numberContext: "Счёт — семьдесят два, и есть шестьдесят четыре билета.",
      classOne: "Тетрадь и карандаш лежат на парте.", classTwo: "Мой рюкзак стоит рядом с доской.", classThree: "Экран и клавиатура стоят на столе.",
      appointmentRead: "Сэм свободен во вторник в три, и Ли тоже.", appointmentSpeak: "Можем встретиться во вторник в три? Можно перенести встречу на четыре?",
      billRead: "В счёте два блюда на тридцать рублей и пять рублей сдачи.", billSpeak: "Счёт, пожалуйста. Что это за плата? Я заплачу картой.",
      fitnessRead: "Она планирует плавать три раза в неделю, чтобы улучшить выносливость.", fitnessSpeak: "Моя цель — пробежать пять километров, поэтому я буду тренироваться три раза в неделю.",
      dreamJobRead: "Работа дизайнера подходит Ане, потому что ей нравится творческая работа в команде.", dreamJobSpeak: "Работа моей мечты — преподавать в маленькой школе и творчески работать с людьми.",
      learningRead: "Чтение — её сильная сторона, говорить пока трудно, а следующая цель — один разговор в день.", learningSpeak: "Теперь я понимаю больше; моя следующая цель — говорить десять минут каждый день.",
      scienceRead: "Батарея уже работает в лаборатории, но замена бензина пока остаётся предположением.", scienceSpeak: "Это достижение может снизить расходы на энергию, потому что эффективнее хранит электричество.",
      civicRead: "Жители могут прийти на заседание совета и помочь с уборкой района.", civicSpeak: "Предлагаю ежемесячную уборку; она улучшит парк, но нужно обеспечить безопасность.",
      leadRead: "Предложение ставит качество на первое место, поручает тесты Майе и отмечает риск сроков.", leadSpeak: "Наша цель — безопасный запуск. Какие есть опасения? Майя отвечает за тесты до пятницы.",
    },
  },
};

function buildLanguageOverrides({ forms, examples }) {
  const lessons = {};
  Object.entries(SPECS).forEach(([key, [lessonId, itemId, goal]]) => {
    if (!examples[key]) throw new Error(`Missing repair example for ${key}`);
    const entry = {
      concept: FORM_KEYS.has(key) ? forms[key] : goal,
      examples: [examples[key]],
    };
    if (FORM_KEYS.has(key)) entry.forms = [forms[key]];
    lessons[lessonId] = { ...(lessons[lessonId] || {}), [itemId]: entry };
  });
  return lessons;
}

export const REPAIR_TARGET_OVERRIDES = Object.fromEntries(
  Object.entries(DATA).map(([lang, data]) => [lang, buildLanguageOverrides(data)]),
);
