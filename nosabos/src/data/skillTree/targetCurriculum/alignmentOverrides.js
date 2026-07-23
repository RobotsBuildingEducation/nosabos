// Focused authored replacements for lessons whose canonical objectives were
// realigned after the bulk target-curriculum generation. Keeping these in one
// reviewable layer prevents old generated agenda IDs from silently detaching
// localized examples when an objective is corrected.

const SPECS = {
  n11: ["lesson-a1-3-1", "vocabulary-once-doce-trece-catorce-quince-1", "Numbers eleven through fifteen"],
  n16: ["lesson-a1-3-1", "vocabulary-dieciseis-diecisiete-dieciocho-diecinueve-veinte-2", "Numbers sixteen through twenty"],
  n21: ["lesson-a1-3-1", "vocabulary-veintiuno-veintidos-treinta-3", "Numbers twenty-one through thirty"],
  there: ["lesson-a1-3-1", "grammar-hay-number-hay-trece-libros-1", "Use a number to say how many there are"],
  twentyOne: ["lesson-a1-3-1", "grammar-veintiuno-vs-veintiun-veintiuna-2", "Use twenty-one naturally before nouns"],
  howMany: ["lesson-a1-3-1", "grammar-cuantos-cuantas-hay-3", "Ask how many there are"],
  daily: ["lesson-a1-3-2", "realtime-practice-numbers-11-30-with-hay-and-cuantos-hay-1", "Practice numbers 11-30 to count and ask how many there are"],
  numberStory: ["lesson-a1-3-2", "stories-read-a-short-text-with-numbers-and-discuss-the-quant-1", "Read a short text with numbers and discuss the quantities"],
  phoneRead: ["lesson-a1-3-3", "reading-read-a-contact-card-and-identify-a-phone-number-and--1", "Read a contact card and identify a phone number and an age"],
  phoneSpeak: ["lesson-a1-3-3", "realtime-ask-for-and-give-a-phone-number-and-an-age-1", "Ask for and give a phone number and an age"],
  dreamRead: ["lesson-a2-2-3", "reading-read-two-destination-descriptions-and-identify-what--1", "Read two destination descriptions and identify what makes each place appealing"],
  dreamSpeak: ["lesson-a2-2-3", "realtime-describe-a-dream-destination-and-explain-what-the-pl-1", "Describe a dream destination and explain what the place is like"],
  healthyRead: ["lesson-a2-14-3", "reading-read-a-simple-healthy-routine-and-identify-habits-th-1", "Read a simple healthy routine and identify habits that support wellbeing"],
  healthySpeak: ["lesson-a2-14-3", "realtime-describe-healthy-habits-for-food-movement-rest-and-s-1", "Describe healthy habits for food, movement, rest, and sleep"],
  movementSpeak: ["lesson-b2-9-2", "realtime-compare-two-artistic-movements-and-explain-a-definin-1", "Compare two artistic movements and explain a defining feature of each"],
  movementRead: ["lesson-b2-9-2", "stories-read-about-an-artistic-movement-and-identify-its-per-1", "Read about an artistic movement and identify its period, style, and influence"],
  cultureRead: ["lesson-b2-9-3", "reading-read-a-cultural-text-or-artwork-description-and-iden-1", "Read a cultural text or artwork description and identify the values and context it reflects"],
  cultureSpeak: ["lesson-b2-9-3", "realtime-analyze-how-a-work-reflects-its-cultural-and-histori-1", "Analyze how a work reflects its cultural and historical context"],
  holisticRead: ["lesson-b2-11-3", "reading-read-a-wellness-plan-and-identify-how-sleep-nutritio-1", "Read a wellness plan and identify how sleep, nutrition, movement, and stress affect one another"],
  holisticSpeak: ["lesson-b2-11-3", "realtime-discuss-a-wellbeing-plan-that-supports-both-physical-1", "Discuss a wellbeing plan that supports both physical and mental health"],
  emotionRead: ["lesson-c1-2-3", "reading-read-a-reflection-and-identify-how-past-subjunctive--1", "Read a reflection and identify how past-subjunctive forms express regret or desire"],
  emotionSpeak: ["lesson-c1-2-3", "realtime-express-regret-wishes-and-emotional-reactions-about--1", "Express regret, wishes, and emotional reactions about unreal past situations"],
  artisticRead: ["lesson-c2-3-3", "reading-read-a-literary-passage-and-identify-imagery-rhythm--1", "Read a literary passage and identify imagery, rhythm, and deliberate stylistic choices"],
  artisticSpeak: ["lesson-c2-3-3", "realtime-create-a-short-expressive-description-using-imagery--1", "Create a short expressive description using imagery and figurative language"],
};

const EXACT_FORM_KEYS = new Set([
  "n11",
  "n16",
  "n21",
  "there",
  "twentyOne",
  "howMany",
]);

const DATA = {
  en: {
    forms: {
      n11: "eleven, twelve, thirteen, fourteen, fifteen",
      n16: "sixteen, seventeen, eighteen, nineteen, twenty",
      n21: "twenty-one, twenty-two... thirty",
      there: "there are + number",
      twentyOne: "twenty-one + noun",
      howMany: "how many are there?",
    },
    examples: {
      n11: "Eleven, twelve, thirteen, fourteen, fifteen.", n16: "Sixteen, seventeen, eighteen, nineteen, twenty.", n21: "Twenty-one, twenty-two, twenty-three... thirty.",
      there: "There are thirteen books.", twentyOne: "There are twenty-one books.", howMany: "How many chairs are there?",
      daily: "How many chairs are there? There are twenty-three.", numberStory: "There are twenty-seven students in the class.",
      phoneRead: "Maya — age 24 — phone 555-013-2424.", phoneSpeak: "What's your phone number? I'm twenty-four years old.",
      dreamRead: "The island is quiet and warm, while the mountain town has forests and cool air.", dreamSpeak: "My dream destination is Kyoto because it is historic, walkable, and full of gardens.",
      healthyRead: "Leo sleeps eight hours, walks every day, and cooks balanced meals.", healthySpeak: "I protect my sleep, eat regular meals, and move every day.",
      movementSpeak: "Impressionism captures changing light, while Cubism breaks subjects into geometric forms.", movementRead: "Impressionism emerged in nineteenth-century France and influenced modern painting through visible brushwork and light.",
      cultureRead: "The mural's public setting and working-class figures reflect the social ideals of its era.", cultureSpeak: "The novel reflects postwar uncertainty through its fragmented structure and displaced characters.",
      holisticRead: "Poor sleep raises stress, which reduces motivation to exercise and makes regular meals harder.", holisticSpeak: "My plan combines sleep, movement, social connection, and time to manage stress.",
      emotionRead: "She wished she had spoken sooner and regretted that fear had kept her silent.", emotionSpeak: "I wish I had listened; I regret that I let the opportunity pass.",
      artisticRead: "The repeated soft consonants slow the line, while the moonlit road becomes an image of uncertainty.", artisticSpeak: "The city woke beneath a silver blanket of rain.",
    },
  },
  de: {
    forms: {
      n11: "elf, zwölf, dreizehn, vierzehn, fünfzehn",
      n16: "sechzehn, siebzehn, achtzehn, neunzehn, zwanzig",
      n21: "einundzwanzig, zweiundzwanzig... dreißig",
      there: "es gibt + Zahl",
      twentyOne: "einundzwanzig + Substantiv",
      howMany: "wie viele gibt es?",
    },
    examples: {
      n11: "Elf, zwölf, dreizehn, vierzehn, fünfzehn.", n16: "Sechzehn, siebzehn, achtzehn, neunzehn, zwanzig.", n21: "Einundzwanzig, zweiundzwanzig, dreiundzwanzig... dreißig.",
      there: "Es gibt dreizehn Bücher.", twentyOne: "Es gibt einundzwanzig Bücher.", howMany: "Wie viele Stühle gibt es?",
      daily: "Wie viele Stühle gibt es? Es gibt dreiundzwanzig.", numberStory: "In der Klasse sind siebenundzwanzig Schüler.",
      phoneRead: "Maya — 24 Jahre — Telefon 555-013-2424.", phoneSpeak: "Wie lautet deine Telefonnummer? Ich bin vierundzwanzig Jahre alt.",
      dreamRead: "Die Insel ist ruhig und warm, während der Bergort Wälder und kühle Luft bietet.", dreamSpeak: "Mein Traumziel ist Kyoto, weil die Stadt historisch, fußgängerfreundlich und voller Gärten ist.",
      healthyRead: "Leo schläft acht Stunden, geht täglich spazieren und kocht ausgewogene Mahlzeiten.", healthySpeak: "Ich achte auf meinen Schlaf, esse regelmäßig und bewege mich jeden Tag.",
      movementSpeak: "Der Impressionismus fängt wechselndes Licht ein, der Kubismus zerlegt Motive in geometrische Formen.", movementRead: "Der Impressionismus entstand im Frankreich des 19. Jahrhunderts und beeinflusste mit Licht und sichtbarem Pinselstrich die moderne Malerei.",
      cultureRead: "Der öffentliche Ort des Wandbilds und seine Arbeiterfiguren spiegeln die sozialen Ideale der Epoche wider.", cultureSpeak: "Der Roman spiegelt die Unsicherheit der Nachkriegszeit durch seine fragmentierte Struktur wider.",
      holisticRead: "Schlechter Schlaf erhöht den Stress, senkt die Lust auf Bewegung und erschwert regelmäßige Mahlzeiten.", holisticSpeak: "Mein Plan verbindet Schlaf, Bewegung, soziale Kontakte und Zeit zum Stressabbau.",
      emotionRead: "Sie wünschte, sie hätte früher gesprochen, und bedauerte, dass die Angst sie schweigen ließ.", emotionSpeak: "Ich wünschte, ich hätte zugehört; ich bereue, dass ich die Gelegenheit verstreichen ließ.",
      artisticRead: "Die sanften Konsonanten verlangsamen die Zeile, während der mondhelle Weg zum Bild der Ungewissheit wird.", artisticSpeak: "Die Stadt erwachte unter einer silbernen Decke aus Regen.",
    },
  },
  el: {
    forms: {
      n11: "έντεκα, δώδεκα, δεκατρία, δεκατέσσερα, δεκαπέντε",
      n16: "δεκαέξι, δεκαεπτά, δεκαοκτώ, δεκαεννέα, είκοσι",
      n21: "είκοσι ένα, είκοσι δύο... τριάντα",
      there: "υπάρχουν + αριθμός",
      twentyOne: "είκοσι ένα + ουσιαστικό",
      howMany: "πόσα υπάρχουν;",
    },
    examples: {
      n11: "Έντεκα, δώδεκα, δεκατρία, δεκατέσσερα, δεκαπέντε.", n16: "Δεκαέξι, δεκαεπτά, δεκαοκτώ, δεκαεννέα, είκοσι.", n21: "Είκοσι ένα, είκοσι δύο, είκοσι τρία... τριάντα.",
      there: "Υπάρχουν δεκατρία βιβλία.", twentyOne: "Υπάρχουν είκοσι ένα βιβλία.", howMany: "Πόσες καρέκλες υπάρχουν;",
      daily: "Πόσες καρέκλες υπάρχουν; Υπάρχουν είκοσι τρεις.", numberStory: "Υπάρχουν είκοσι επτά μαθητές στην τάξη.",
      phoneRead: "Μάγια — 24 ετών — τηλέφωνο 555-013-2424.", phoneSpeak: "Ποιος είναι ο αριθμός σου; Είμαι είκοσι τεσσάρων ετών.",
      dreamRead: "Το νησί είναι ήσυχο και ζεστό, ενώ το ορεινό χωριό έχει δάση και δροσερό αέρα.", dreamSpeak: "Ονειρεύομαι να πάω στο Κιότο γιατί είναι ιστορικό και γεμάτο κήπους.",
      healthyRead: "Ο Λέο κοιμάται οκτώ ώρες, περπατά κάθε μέρα και μαγειρεύει ισορροπημένα γεύματα.", healthySpeak: "Φροντίζω τον ύπνο μου, τρώω τακτικά και κινούμαι κάθε μέρα.",
      movementSpeak: "Ο ιμπρεσιονισμός αποτυπώνει το φως, ενώ ο κυβισμός χωρίζει τα θέματα σε γεωμετρικά σχήματα.", movementRead: "Ο ιμπρεσιονισμός εμφανίστηκε στη Γαλλία τον 19ο αιώνα και επηρέασε τη μοντέρνα ζωγραφική.",
      cultureRead: "Η δημόσια θέση της τοιχογραφίας και οι εργατικές μορφές αντανακλούν τα κοινωνικά ιδανικά της εποχής.", cultureSpeak: "Το μυθιστόρημα αντανακλά τη μεταπολεμική αβεβαιότητα μέσα από την αποσπασματική δομή του.",
      holisticRead: "Ο κακός ύπνος αυξάνει το άγχος και δυσκολεύει την άσκηση και τα τακτικά γεύματα.", holisticSpeak: "Το σχέδιό μου συνδυάζει ύπνο, κίνηση, κοινωνική επαφή και διαχείριση άγχους.",
      emotionRead: "Ευχόταν να είχε μιλήσει νωρίτερα και μετάνιωνε που ο φόβος την κράτησε σιωπηλή.", emotionSpeak: "Μακάρι να είχα ακούσει· μετανιώνω που άφησα την ευκαιρία να περάσει.",
      artisticRead: "Τα απαλά σύμφωνα επιβραδύνουν τον στίχο και ο φεγγαρόλουστος δρόμος γίνεται εικόνα αβεβαιότητας.", artisticSpeak: "Η πόλη ξύπνησε κάτω από μια ασημένια κουβέρτα βροχής.",
    },
  },
  fr: {
    forms: {
      n11: "onze, douze, treize, quatorze, quinze",
      n16: "seize, dix-sept, dix-huit, dix-neuf, vingt",
      n21: "vingt et un, vingt-deux... trente",
      there: "il y a + nombre",
      twentyOne: "vingt et un / vingt et une",
      howMany: "combien y en a-t-il ?",
    },
    examples: {
      n11: "Onze, douze, treize, quatorze, quinze.", n16: "Seize, dix-sept, dix-huit, dix-neuf, vingt.", n21: "Vingt et un, vingt-deux, vingt-trois... trente.",
      there: "Il y a treize livres.", twentyOne: "Il y a vingt et un livres et vingt et une chaises.", howMany: "Combien y a-t-il de chaises ?",
      daily: "Combien y a-t-il de chaises ? Il y en a vingt-trois.", numberStory: "Il y a vingt-sept élèves dans la classe.",
      phoneRead: "Maya — 24 ans — téléphone 555-013-2424.", phoneSpeak: "Quel est ton numéro de téléphone ? J'ai vingt-quatre ans.",
      dreamRead: "L'île est calme et chaude, tandis que le village de montagne offre des forêts et de l'air frais.", dreamSpeak: "Ma destination de rêve est Kyoto parce que la ville est historique et pleine de jardins.",
      healthyRead: "Léo dort huit heures, marche chaque jour et prépare des repas équilibrés.", healthySpeak: "Je protège mon sommeil, je mange régulièrement et je bouge tous les jours.",
      movementSpeak: "L'impressionnisme saisit la lumière changeante, tandis que le cubisme décompose les sujets en formes géométriques.", movementRead: "L'impressionnisme est né en France au XIXe siècle et a influencé la peinture moderne par sa lumière et ses touches visibles.",
      cultureRead: "L'emplacement public de la fresque et ses figures ouvrières reflètent les idéaux sociaux de l'époque.", cultureSpeak: "Le roman reflète l'incertitude de l'après-guerre par sa structure fragmentée.",
      holisticRead: "Un mauvais sommeil augmente le stress, réduit l'envie de bouger et complique les repas réguliers.", holisticSpeak: "Mon plan associe sommeil, mouvement, liens sociaux et temps pour gérer le stress.",
      emotionRead: "Elle aurait voulu parler plus tôt et regrettait que la peur l'ait réduite au silence.", emotionSpeak: "J'aurais aimé écouter ; je regrette d'avoir laissé passer l'occasion.",
      artisticRead: "Les consonnes douces ralentissent le vers, tandis que la route au clair de lune devient une image d'incertitude.", artisticSpeak: "La ville s'est éveillée sous une couverture d'argent tissée par la pluie.",
    },
  },
  ga: {
    forms: {
      n11: "a haon déag, a dó dhéag, a trí déag, a ceathair déag, a cúig déag",
      n16: "a sé déag, a seacht déag, a hocht déag, a naoi déag, fiche",
      n21: "fiche a haon, fiche a dó... tríocha",
      there: "tá + uimhir + ann",
      twentyOne: "fiche a haon + ainmfhocal",
      howMany: "cé mhéad atá ann?",
    },
    examples: {
      n11: "A haon déag, a dó dhéag, a trí déag, a ceathair déag, a cúig déag.", n16: "A sé déag, a seacht déag, a hocht déag, a naoi déag, fiche.", n21: "Fiche a haon, fiche a dó, fiche a trí... tríocha.",
      there: "Tá trí leabhar déag ann.", twentyOne: "Tá fiche a haon leabhar ann.", howMany: "Cé mhéad cathaoir atá ann?",
      daily: "Cé mhéad cathaoir atá ann? Tá fiche a trí ann.", numberStory: "Tá seacht ndalta is fiche sa rang.",
      phoneRead: "Maya — 24 bliain d'aois — fón 555-013-2424.", phoneSpeak: "Cad é d'uimhir fóin? Tá mé ceithre bliana is fiche d'aois.",
      dreamRead: "Tá an t-oileán ciúin agus te, ach tá foraoisí agus aer fionnuar sa bhaile sléibhe.", dreamSpeak: "Is é Kyoto ceann scríbe mo bhrionglóidí mar tá sé stairiúil agus lán de ghairdíní.",
      healthyRead: "Codlaíonn Leo ocht n-uaire, siúlann sé gach lá agus cócarálann sé béilí cothromaithe.", healthySpeak: "Tugaim aire do mo chodladh, ithim go rialta agus bím ag bogadh gach lá.",
      movementSpeak: "Gabhann an tImpriseanachas solas athraitheach, agus briseann an Ciúbachas ábhair ina gcruthanna geoiméadracha.", movementRead: "Tháinig an tImpriseanachas chun cinn sa Fhrainc sa naoú haois déag agus chuaigh sé i bhfeidhm ar an bpéintéireacht nua-aimseartha.",
      cultureRead: "Léiríonn suíomh poiblí na múrmhaisiúcháin agus na hoibrithe inti idéil shóisialta na linne.", cultureSpeak: "Léiríonn an t-úrscéal éiginnteacht na tréimhse iarchogaidh trína struchtúr briste.",
      holisticRead: "Méadaíonn drochchodladh strus agus déanann sé aclaíocht agus béilí rialta níos deacra.", holisticSpeak: "Cuimsíonn mo phlean codladh, gluaiseacht, ceangal sóisialta agus am chun strus a bhainistiú.",
      emotionRead: "Ba mhian léi gur labhair sí níos luaithe agus bhí aiféala uirthi gur choinnigh eagla ina tost í.", emotionSpeak: "Is trua nár éist mé; tá aiféala orm gur lig mé don deis imeacht.",
      artisticRead: "Moillíonn na consain bhoga an líne agus éiríonn bóthar faoi sholas na gealaí ina íomhá den éiginnteacht.", artisticSpeak: "Dhúisigh an chathair faoi bhrat airgid báistí.",
    },
  },
  it: {
    forms: {
      n11: "undici, dodici, tredici, quattordici, quindici",
      n16: "sedici, diciassette, diciotto, diciannove, venti",
      n21: "ventuno, ventidue... trenta",
      there: "ci sono + numero",
      twentyOne: "ventuno / ventun + nome",
      howMany: "quanti ce ne sono?",
    },
    examples: {
      n11: "Undici, dodici, tredici, quattordici, quindici.", n16: "Sedici, diciassette, diciotto, diciannove, venti.", n21: "Ventuno, ventidue, ventitré... trenta.",
      there: "Ci sono tredici libri.", twentyOne: "Ci sono ventun libri.", howMany: "Quante sedie ci sono?",
      daily: "Quante sedie ci sono? Ce ne sono ventitré.", numberStory: "Ci sono ventisette studenti nella classe.",
      phoneRead: "Maya — 24 anni — telefono 555-013-2424.", phoneSpeak: "Qual è il tuo numero di telefono? Ho ventiquattro anni.",
      dreamRead: "L'isola è tranquilla e calda, mentre il paese di montagna offre boschi e aria fresca.", dreamSpeak: "La mia destinazione da sogno è Kyoto perché è storica e piena di giardini.",
      healthyRead: "Leo dorme otto ore, cammina ogni giorno e cucina pasti equilibrati.", healthySpeak: "Proteggo il sonno, mangio regolarmente e mi muovo ogni giorno.",
      movementSpeak: "L'impressionismo cattura la luce mutevole, mentre il cubismo scompone i soggetti in forme geometriche.", movementRead: "L'impressionismo nacque nella Francia dell'Ottocento e influenzò la pittura moderna con luce e pennellate visibili.",
      cultureRead: "La collocazione pubblica del murale e le figure operaie riflettono gli ideali sociali dell'epoca.", cultureSpeak: "Il romanzo riflette l'incertezza del dopoguerra attraverso la sua struttura frammentata.",
      holisticRead: "Dormire male aumenta lo stress, riduce la voglia di muoversi e rende più difficili i pasti regolari.", holisticSpeak: "Il mio piano unisce sonno, movimento, relazioni sociali e tempo per gestire lo stress.",
      emotionRead: "Avrebbe voluto parlare prima e rimpiangeva che la paura l'avesse fatta tacere.", emotionSpeak: "Vorrei aver ascoltato; rimpiango di aver lasciato passare l'occasione.",
      artisticRead: "Le consonanti morbide rallentano il verso, mentre la strada al chiaro di luna diventa immagine d'incertezza.", artisticSpeak: "La città si svegliò sotto una coperta d'argento tessuta dalla pioggia.",
    },
  },
  ja: {
    forms: {
      n11: "十一、十二、十三、十四、十五",
      n16: "十六、十七、十八、十九、二十",
      n21: "二十一、二十二…三十",
      there: "数 + あります",
      twentyOne: "二十一 + 助数詞",
      howMany: "いくつありますか",
    },
    examples: {
      n11: "十一、十二、十三、十四、十五。", n16: "十六、十七、十八、十九、二十。", n21: "二十一、二十二、二十三…三十。",
      there: "本が十三冊あります。", twentyOne: "本が二十一冊あります。", howMany: "椅子はいくつありますか。",
      daily: "椅子はいくつありますか。二十三脚あります。", numberStory: "クラスには二十七人の生徒がいます。",
      phoneRead: "マヤ、24歳、電話番号555-013-2424。", phoneSpeak: "電話番号は何番ですか。私は二十四歳です。",
      dreamRead: "島は静かで暖かく、山の町には森と涼しい空気があります。", dreamSpeak: "私の憧れの旅行先は京都です。歴史があり、庭園が多いからです。",
      healthyRead: "レオは八時間眠り、毎日歩き、栄養バランスのよい食事を作ります。", healthySpeak: "睡眠を大切にし、規則正しく食べ、毎日体を動かします。",
      movementSpeak: "印象派は移ろう光を捉え、キュビスムは対象を幾何学的な形に分解します。", movementRead: "印象派は十九世紀のフランスで生まれ、光と筆触によって近代絵画に影響を与えました。",
      cultureRead: "公共の場に描かれた壁画と労働者の姿は、その時代の社会的理想を反映しています。", cultureSpeak: "その小説は断片的な構成によって戦後の不安を映し出しています。",
      holisticRead: "睡眠不足はストレスを高め、運動する意欲と規則的な食事を妨げます。", holisticSpeak: "私の計画は睡眠、運動、人とのつながり、ストレス管理を組み合わせています。",
      emotionRead: "彼女はもっと早く話せばよかったと思い、恐れのために黙っていたことを後悔しました。", emotionSpeak: "聞いておけばよかったです。機会を逃したことを後悔しています。",
      artisticRead: "柔らかな子音が行の流れを遅くし、月明かりの道が不確かさのイメージになります。", artisticSpeak: "街は銀色の雨の毛布の下で目を覚ました。",
    },
  },
  nl: {
    forms: {
      n11: "elf, twaalf, dertien, veertien, vijftien",
      n16: "zestien, zeventien, achttien, negentien, twintig",
      n21: "eenentwintig, tweeëntwintig... dertig",
      there: "er zijn + getal",
      twentyOne: "eenentwintig + zelfstandig naamwoord",
      howMany: "hoeveel zijn er?",
    },
    examples: {
      n11: "Elf, twaalf, dertien, veertien, vijftien.", n16: "Zestien, zeventien, achttien, negentien, twintig.", n21: "Eenentwintig, tweeëntwintig, drieëntwintig... dertig.",
      there: "Er zijn dertien boeken.", twentyOne: "Er zijn eenentwintig boeken.", howMany: "Hoeveel stoelen zijn er?",
      daily: "Hoeveel stoelen zijn er? Er zijn er drieëntwintig.", numberStory: "Er zitten zevenentwintig leerlingen in de klas.",
      phoneRead: "Maya — 24 jaar — telefoon 555-013-2424.", phoneSpeak: "Wat is je telefoonnummer? Ik ben vierentwintig jaar oud.",
      dreamRead: "Het eiland is rustig en warm, terwijl het bergdorp bossen en koele lucht heeft.", dreamSpeak: "Mijn droombestemming is Kyoto omdat de stad historisch en vol tuinen is.",
      healthyRead: "Leo slaapt acht uur, wandelt elke dag en kookt evenwichtige maaltijden.", healthySpeak: "Ik bescherm mijn slaap, eet regelmatig en beweeg elke dag.",
      movementSpeak: "Het impressionisme vangt veranderend licht, terwijl het kubisme onderwerpen in geometrische vormen breekt.", movementRead: "Het impressionisme ontstond in het negentiende-eeuwse Frankrijk en beïnvloedde de moderne schilderkunst met licht en zichtbare penseelstreken.",
      cultureRead: "De openbare plek van de muurschildering en de arbeidersfiguren weerspiegelen de sociale idealen van die tijd.", cultureSpeak: "De roman weerspiegelt de naoorlogse onzekerheid door zijn gefragmenteerde structuur.",
      holisticRead: "Slecht slapen verhoogt stress, vermindert de zin om te bewegen en bemoeilijkt regelmatige maaltijden.", holisticSpeak: "Mijn plan combineert slaap, beweging, sociaal contact en tijd om stress te beheersen.",
      emotionRead: "Ze wenste dat ze eerder had gesproken en betreurde dat angst haar stil had gehouden.", emotionSpeak: "Ik wou dat ik had geluisterd; ik heb spijt dat ik de kans liet voorbijgaan.",
      artisticRead: "De zachte medeklinkers vertragen de regel, terwijl de maanverlichte weg een beeld van onzekerheid wordt.", artisticSpeak: "De stad ontwaakte onder een zilveren deken van regen.",
    },
  },
  pl: {
    forms: {
      n11: "jedenaście, dwanaście, trzynaście, czternaście, piętnaście",
      n16: "szesnaście, siedemnaście, osiemnaście, dziewiętnaście, dwadzieścia",
      n21: "dwadzieścia jeden, dwadzieścia dwa... trzydzieści",
      there: "jest/są + liczba",
      twentyOne: "dwadzieścia jeden + rzeczownik",
      howMany: "ile jest?",
    },
    examples: {
      n11: "Jedenaście, dwanaście, trzynaście, czternaście, piętnaście.", n16: "Szesnaście, siedemnaście, osiemnaście, dziewiętnaście, dwadzieścia.", n21: "Dwadzieścia jeden, dwadzieścia dwa, dwadzieścia trzy... trzydzieści.",
      there: "Jest trzynaście książek.", twentyOne: "Jest dwadzieścia jeden książek.", howMany: "Ile jest krzeseł?",
      daily: "Ile jest krzeseł? Są dwadzieścia trzy.", numberStory: "W klasie jest dwudziestu siedmiu uczniów.",
      phoneRead: "Maya — 24 lata — telefon 555-013-2424.", phoneSpeak: "Jaki jest twój numer telefonu? Mam dwadzieścia cztery lata.",
      dreamRead: "Wyspa jest spokojna i ciepła, a górskie miasteczko ma lasy i chłodne powietrze.", dreamSpeak: "Moim wymarzonym celem jest Kioto, bo jest historyczne i pełne ogrodów.",
      healthyRead: "Leo śpi osiem godzin, codziennie spaceruje i gotuje zbilansowane posiłki.", healthySpeak: "Dbam o sen, jem regularnie i ruszam się każdego dnia.",
      movementSpeak: "Impresjonizm uchwyca zmienne światło, a kubizm rozbija tematy na geometryczne formy.", movementRead: "Impresjonizm powstał w dziewiętnastowiecznej Francji i wpłynął na malarstwo nowoczesne światłem oraz widocznym pociągnięciem pędzla.",
      cultureRead: "Publiczne miejsce muralu i postacie robotników odzwierciedlają ideały społeczne epoki.", cultureSpeak: "Powieść odzwierciedla powojenną niepewność poprzez fragmentaryczną strukturę.",
      holisticRead: "Zły sen zwiększa stres, osłabia chęć do ruchu i utrudnia regularne posiłki.", holisticSpeak: "Mój plan łączy sen, ruch, kontakty społeczne i czas na radzenie sobie ze stresem.",
      emotionRead: "Żałowała, że nie odezwała się wcześniej, i że strach kazał jej milczeć.", emotionSpeak: "Żałuję, że nie posłuchałem i pozwoliłem, by okazja minęła.",
      artisticRead: "Miękkie spółgłoski spowalniają wers, a oświetlona księżycem droga staje się obrazem niepewności.", artisticSpeak: "Miasto obudziło się pod srebrnym kocem deszczu.",
    },
  },
  pt: {
    forms: {
      n11: "onze, doze, treze, catorze, quinze",
      n16: "dezesseis, dezessete, dezoito, dezenove, vinte",
      n21: "vinte e um, vinte e dois... trinta",
      there: "há/tem + número",
      twentyOne: "vinte e um / vinte e uma",
      howMany: "quantos há?",
    },
    examples: {
      n11: "Onze, doze, treze, catorze, quinze.", n16: "Dezesseis, dezessete, dezoito, dezenove, vinte.", n21: "Vinte e um, vinte e dois, vinte e três... trinta.",
      there: "Há treze livros.", twentyOne: "Há vinte e um livros e vinte e uma cadeiras.", howMany: "Quantas cadeiras há?",
      daily: "Quantas cadeiras há? Há vinte e três.", numberStory: "Há vinte e sete alunos na turma.",
      phoneRead: "Maya — 24 anos — telefone 555-013-2424.", phoneSpeak: "Qual é o seu número de telefone? Tenho vinte e quatro anos.",
      dreamRead: "A ilha é tranquila e quente, enquanto a cidade serrana tem florestas e ar fresco.", dreamSpeak: "Meu destino dos sonhos é Kyoto porque a cidade é histórica e cheia de jardins.",
      healthyRead: "Leo dorme oito horas, caminha todos os dias e prepara refeições equilibradas.", healthySpeak: "Cuido do meu sono, como regularmente e me movimento todos os dias.",
      movementSpeak: "O impressionismo capta a luz mutável, enquanto o cubismo divide os temas em formas geométricas.", movementRead: "O impressionismo surgiu na França do século XIX e influenciou a pintura moderna com luz e pinceladas visíveis.",
      cultureRead: "O lugar público do mural e as figuras de trabalhadores refletem os ideais sociais da época.", cultureSpeak: "O romance reflete a incerteza do pós-guerra por meio de sua estrutura fragmentada.",
      holisticRead: "Dormir mal aumenta o estresse, reduz a vontade de se mover e dificulta refeições regulares.", holisticSpeak: "Meu plano combina sono, movimento, conexão social e tempo para controlar o estresse.",
      emotionRead: "Ela desejava ter falado antes e lamentava que o medo a tivesse mantido em silêncio.", emotionSpeak: "Eu gostaria de ter escutado; lamento ter deixado a oportunidade passar.",
      artisticRead: "As consoantes suaves desaceleram o verso, enquanto a estrada ao luar vira uma imagem de incerteza.", artisticSpeak: "A cidade acordou sob um cobertor prateado de chuva.",
    },
  },
  ru: {
    forms: {
      n11: "одиннадцать, двенадцать, тринадцать, четырнадцать, пятнадцать",
      n16: "шестнадцать, семнадцать, восемнадцать, девятнадцать, двадцать",
      n21: "двадцать один, двадцать два... тридцать",
      there: "есть + число",
      twentyOne: "двадцать один / двадцать одна",
      howMany: "сколько здесь?",
    },
    examples: {
      n11: "Одиннадцать, двенадцать, тринадцать, четырнадцать, пятнадцать.", n16: "Шестнадцать, семнадцать, восемнадцать, девятнадцать, двадцать.", n21: "Двадцать один, двадцать два, двадцать три... тридцать.",
      there: "Здесь тринадцать книг.", twentyOne: "Здесь двадцать одна книга.", howMany: "Сколько здесь стульев?",
      daily: "Сколько здесь стульев? Здесь двадцать три.", numberStory: "В классе двадцать семь учеников.",
      phoneRead: "Майя — 24 года — телефон 555-013-2424.", phoneSpeak: "Какой у тебя номер телефона? Мне двадцать четыре года.",
      dreamRead: "Остров тихий и тёплый, а в горном городе есть леса и прохладный воздух.", dreamSpeak: "Я мечтаю поехать в Киото, потому что это исторический город с множеством садов.",
      healthyRead: "Лео спит восемь часов, каждый день гуляет и готовит сбалансированную еду.", healthySpeak: "Я берегу сон, регулярно ем и каждый день двигаюсь.",
      movementSpeak: "Импрессионизм передаёт меняющийся свет, а кубизм разбивает предметы на геометрические формы.", movementRead: "Импрессионизм возник во Франции XIX века и повлиял на современную живопись светом и заметными мазками.",
      cultureRead: "Общественное место фрески и фигуры рабочих отражают социальные идеалы эпохи.", cultureSpeak: "Роман отражает послевоенную неопределённость через фрагментарную структуру.",
      holisticRead: "Плохой сон усиливает стресс, снижает желание двигаться и мешает регулярно питаться.", holisticSpeak: "Мой план объединяет сон, движение, общение и время для управления стрессом.",
      emotionRead: "Она хотела бы заговорить раньше и сожалела, что страх заставил её молчать.", emotionSpeak: "Жаль, что я не послушал; я сожалею, что упустил возможность.",
      artisticRead: "Мягкие согласные замедляют строку, а лунная дорога становится образом неопределённости.", artisticSpeak: "Город проснулся под серебряным одеялом дождя.",
    },
  },
};

function buildLanguageOverrides({ forms, examples }) {
  const lessons = {};
  Object.entries(SPECS).forEach(([key, [lessonId, itemId, goal]]) => {
    if (!examples[key]) {
      throw new Error(`Missing alignment example for ${key}`);
    }
    const entry = {
      concept: EXACT_FORM_KEYS.has(key) ? forms[key] : goal,
      examples: [examples[key]],
    };
    if (EXACT_FORM_KEYS.has(key)) entry.forms = [forms[key]];
    lessons[lessonId] = { ...(lessons[lessonId] || {}), [itemId]: entry };
  });
  return lessons;
}

export const ALIGNMENT_TARGET_OVERRIDES = Object.fromEntries(
  Object.entries(DATA).map(([lang, data]) => [lang, buildLanguageOverrides(data)]),
);

