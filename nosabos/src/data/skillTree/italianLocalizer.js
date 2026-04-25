/**
 * Adds Italian support-language copy to the CEFR skill-tree payloads.
 *
 * The level files intentionally keep their original authored English/Spanish
 * data intact. This pass fills the `it` field for repeated lesson shapes so
 * cards, units, and lesson modals can use the same `{ en, es, it }` reader.
 */

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const lowerFirst = (value) => {
  if (!value) return value;
  return value.charAt(0).toLocaleLowerCase("it-IT") + value.slice(1);
};

const capitalizeFirst = (value) => {
  if (!value) return value;
  return value.charAt(0).toLocaleUpperCase("it-IT") + value.slice(1);
};

const TEXT_TRANSLATIONS = {
  "100 must-know words and phrases to start fast":
    "100 parole e frasi indispensabili per iniziare rapidamente",
  "20 everyday verbs and short requests to get things done":
    "20 verbi quotidiani e richieste brevi per cavartela",
  "20 words for time, transport, and finding your way":
    "20 parole per tempo, trasporti e orientamento",
  "a guided tour of all learning modules":
    "Un tour guidato di tutti i moduli di apprendimento",
  "abstract concepts": "Concetti astratti",
  "academic writing": "Scrittura accademica",
  "accent and usage": "Accento e uso",
  achievements: "Risultati",
  "actions & essentials": "Azioni ed elementi essenziali",
  "active citizenship": "Cittadinanza attiva",
  "add 20 words for names, family, and moving around":
    "Aggiungi 20 parole per nomi, famiglia e spostamenti",
  "additional phrases for gracious communication":
    "Altre frasi per comunicare con cortesia",
  "additional gracious phrases": "Altre frasi cortesi",
  "advanced discourse": "Discorso avanzato",
  "advanced expressions": "Espressioni avanzate",
  "advanced greetings": "Saluti avanzati",
  "advanced if clauses": "Periodi ipotetici avanzati",
  "advanced idioms": "Modi di dire avanzati",
  "adventure awaits": "L'avventura ti aspetta",
  "analyzing texts": "Analisi dei testi",
  "apologize and get attention politely":
    "Chiedi scusa e richiama l'attenzione con educazione",
  "apologize politely": "Chiedi scusa con educazione",
  "appearance words": "Parole sull'aspetto",
  "apply larger numbers in real-life contexts":
    "Applica i numeri più grandi in contesti reali",
  "apply numbers to phone numbers and ages":
    "Applica i numeri a numeri di telefono ed età",
  "appropriate language": "Linguaggio appropriato",
  "artistic language": "Linguaggio artistico",
  "artistic movements": "Movimenti artistici",
  "arts & literature": "Arte e letteratura",
  "ask others what their name is": "Chiedi agli altri come si chiamano",
  "ask others their name": "Chiedi agli altri il loro nome",
  "ask questions": "Fai domande",
  "asking names": "Chiedere i nomi",
  "asking questions": "Fare domande",
  "at home": "A casa",
  "at the doctor's": "Dal medico",
  "at the market": "Al mercato",
  "at the restaurant": "Al ristorante",
  "at the store": "Al negozio",
  "athletic activities": "Attività sportive",
  "background actions": "Azioni di sfondo",
  "balanced living": "Vita equilibrata",
  "bargain hunting": "A caccia di occasioni",
  "basic questions": "Domande di base",
  "basic food and drink vocabulary": "Vocabolario di base su cibo e bevande",
  "basic food vocabulary": "Vocabolario alimentare di base",
  "basic greetings and farewells for any situation":
    "Saluti e congedi di base per ogni situazione",
  "basic greetings and farewells": "Saluti e congedi di base",
  "before it happened": "Prima che accadesse",
  "better or worse": "Meglio o peggio",
  "big numbers in context": "Numeri grandi nel contesto",
  "black, white & neutral": "Nero, bianco e neutri",
  "body and health": "Corpo e salute",
  "body parts": "Parti del corpo",
  "booking a trip": "Prenotare un viaggio",
  "building arguments": "Costruire argomentazioni",
  "business communication": "Comunicazione aziendale",
  "business etiquette": "Galateo professionale",
  "business spanish": "Spagnolo commerciale",
  "buy things": "Compra cose",
  "buying groceries": "Fare la spesa",
  "calendar basics": "Basi del calendario",
  "career words": "Parole sulle professioni",
  "celebrating diversity": "Celebrare la diversità",
  "civic engagement": "Impegno civico",
  "civic topics": "Temi civici",
  clothing: "Abbigliamento",
  "coherent arguments": "Argomentazioni coerenti",
  "collaborative ideas": "Idee collaborative",
  colors: "Colori",
  "colors & shapes": "Colori e forme",
  "colors everywhere": "Colori ovunque",
  "common irregular verbs": "Verbi irregolari comuni",
  "common household items": "Oggetti domestici comuni",
  "common objects": "Oggetti comuni",
  comparisons: "Confronti",
  "complete counting to ten: 6, 7, 8, 9, 10":
    "Completa il conteggio fino a dieci: 6, 7, 8, 9, 10",
  "complete counting to ten": "Completa il conteggio fino a dieci",
  "complete mastery": "Padronanza completa",
  "complete the introduction with polite expressions":
    "Completa la presentazione con espressioni cortesi",
  "complete the introduction": "Completa la presentazione",
  "complete your color palette": "Completa la tua tavolozza di colori",
  "complete your palette": "Completa la tua tavolozza",
  "complex communication": "Comunicazione complessa",
  "complex conditionals": "Condizionali complessi",
  "complex emotions": "Emozioni complesse",
  "complex ideas": "Idee complesse",
  "complex moods": "Stati d'animo complessi",
  "complex sentences": "Frasi complesse",
  "complex timelines": "Linee temporali complesse",
  "conditional would": "Condizionale con would",
  "connected life": "Vita connessa",
  "connecting ideas": "Collegare idee",
  "context matters": "Il contesto conta",
  "contrary to fact": "Contrario ai fatti",
  "corporate world": "Mondo aziendale",
  "count from zero to ten in spanish": "Conta da zero a dieci in spagnolo",
  "count from zero to ten": "Conta da zero a dieci",
  "count to twenty": "Conta fino a venti",
  "counting objects": "Contare oggetti",
  "counting to one hundred": "Contare fino a cento",
  "counting to twenty": "Contare fino a venti",
  "creative expression": "Espressione creativa",
  "critical analysis": "Analisi critica",
  "cross-cultural understanding": "Comprensione interculturale",
  "cultural ambassador": "Ambasciatore culturale",
  "cultural analysis": "Analisi culturale",
  "cultural expertise": "Competenza culturale",
  "cultural fluency": "Fluidità culturale",
  "cultural heritage": "Patrimonio culturale",
  "cultural intelligence": "Intelligenza culturale",
  "cultural mastery": "Padronanza culturale",
  "cultural navigator": "Navigatore culturale",
  "cultural practices": "Pratiche culturali",
  "cultural studies": "Studi culturali",
  "cultural works": "Opere culturali",
  "culture & traditions": "Cultura e tradizioni",
  "current events": "Attualità",
  "customs and festivals": "Usanze e feste",
  "daily activities": "Attività quotidiane",
  "daily routine": "Routine quotidiana",
  "daily schedule": "Programma giornaliero",
  "days of week": "Giorni della settimana",
  "debate & argumentation": "Dibattito e argomentazione",
  "deep culture": "Cultura profonda",
  "deep thinking": "Pensiero profondo",
  "describe visually": "Descrivi visivamente",
  "describing people": "Descrivere le persone",
  "describing places": "Descrivere i luoghi",
  "describing things": "Descrivere le cose",
  "detailed descriptions": "Descrizioni dettagliate",
  dialects: "Dialetti",
  "different careers": "Professioni diverse",
  "different ways to greet people": "Modi diversi per salutare le persone",
  "digital devices": "Dispositivi digitali",
  "digital life": "Vita digitale",
  directions: "Indicazioni",
  "discourse markers": "Marcatori discorsivi",
  "discussing problems": "Discutere problemi",
  "domain expertise": "Competenza specialistica",
  "doubt and desire": "Dubbio e desiderio",
  "dream destinations": "Mete da sogno",
  "dream job": "Lavoro dei sogni",
  "dreams and goals": "Sogni e obiettivi",
  "earlier actions": "Azioni precedenti",
  "educational topics": "Temi educativi",
  "elegant expression": "Espressione elegante",
  environment: "Ambiente",
  "essential courtesy expressions for polite communication":
    "Espressioni essenziali di cortesia per comunicare educatamente",
  "essential courtesy expressions": "Espressioni essenziali di cortesia",
  "essential single-word responses for any conversation":
    "Risposte essenziali di una parola per ogni conversazione",
  "essential single-word responses": "Risposte essenziali di una parola",
  "everyday items": "Oggetti quotidiani",
  "everyday starters": "Prime parole quotidiane",
  "executive presence": "Presenza professionale",
  "expand your color vocabulary": "Amplia il tuo vocabolario dei colori",
  "expand your palette": "Amplia la tua tavolozza",
  experiences: "Esperienze",
  "expert terminology": "Terminologia specialistica",
  "express dissatisfaction": "Esprimi insoddisfazione",
  "express uncertainty with simple phrases":
    "Esprimi incertezza con frasi semplici",
  "express uncertainty": "Esprimi incertezza",
  "expressing opinions": "Esprimere opinioni",
  "expressing preferences": "Esprimere preferenze",
  "expressing wishes": "Esprimere desideri",
  "farewell expressions": "Espressioni di congedo",
  "family members": "Membri della famiglia",
  "family relationships": "Relazioni familiari",
  "favorites and dislikes": "Preferiti e cose che non piacciono",
  "find your way": "Orientati",
  "finding your way": "Orientarsi",
  "fine distinctions": "Distinzioni sottili",
  "finish the tutorial by playing a short game review.":
    "Concludi il tutorial con un breve ripasso in forma di gioco.",
  "first words": "Prime parole",
  "fitness goals": "Obiettivi di fitness",
  "fluent expression": "Espressione fluente",
  "food & drinks": "Cibo e bevande",
  "food and drink": "Cibo e bevande",
  "food and drink items": "Cibi e bevande",
  "food vocabulary": "Vocabolario del cibo",
  "formal vs informal": "Formale e informale",
  "formal writing": "Scrittura formale",
  "four seasons": "Quattro stagioni",
  "free time": "Tempo libero",
  "free time fun": "Divertimento nel tempo libero",
  "fresh food shopping": "Acquisti di cibo fresco",
  "fresh produce": "Prodotti freschi",
  "from morning to night": "Dalla mattina alla sera",
  "future activities": "Attività future",
  "future intentions": "Intenzioni future",
  "future of science": "Futuro della scienza",
  "future plans": "Piani futuri",
  "future possibilities": "Possibilità future",
  "future tense": "Tempo futuro",
  "game review": "Ripasso con gioco",
  "getting around": "Spostarsi",
  "getting information": "Ottenere informazioni",
  "getting started": "Per iniziare",
  "giving advice": "Dare consigli",
  "going green": "Vivere in modo sostenibile",
  "grandparents, babies, and extended family":
    "Nonni, bambini e famiglia allargata",
  greetings: "Saluti",
  "greetings in context": "Saluti nel contesto",
  "had done": "Aveva fatto",
  "have done": "Ha fatto",
  "have you ever?": "Hai mai?",
  "he said that...": "Ha detto che...",
  headlines: "Titoli di giornale",
  "health & body": "Salute e corpo",
  "health & lifestyle": "Salute e stile di vita",
  "health concerns": "Problemi di salute",
  "healthy living": "Vita sana",
  "hello & goodbye": "Ciao e arrivederci",
  "hello and goodbye": "Ciao e arrivederci",
  "helpful suggestions": "Suggerimenti utili",
  "hobbies & interests": "Hobby e interessi",
  "holistic health": "Salute olistica",
  "how do i get there?": "Come ci arrivo?",
  "how do they look?": "Che aspetto hanno?",
  "how do you feel?": "Come ti senti?",
  "how's the weather?": "Com'è il tempo?",
  "hypothetical situations": "Situazioni ipotetiche",
  "i like, i love": "Mi piace, amo",
  "i think that...": "Penso che...",
  "i would...": "Vorrei...",
  "i'm hungry!": "Ho fame!",
  "i'm not satisfied": "Non sono soddisfatto",
  "idiomatic expressions": "Espressioni idiomatiche",
  "idioms and sayings": "Modi di dire e proverbi",
  "if i had...": "Se avessi...",
  "if i were you": "Se fossi in te",
  "if only...": "Se solo...",
  "imagining possibilities": "Immaginare possibilità",
  "important dates": "Date importanti",
  "improve your reading skills with a simple hello passage.":
    "Migliora le tue abilità di lettura con un semplice brano di saluto.",
  "in the classroom": "In classe",
  "in the house": "In casa",
  "informed citizen": "Cittadino informato",
  "interpreting culture": "Interpretare la cultura",
  introductions: "Presentazioni",
  "introduce yourself and ask others their names":
    "Presentati e chiedi agli altri come si chiamano",
  "introducing yourself": "Presentarsi",
  "irregular verbs": "Verbi irregolari",
  "is done by": "È fatto da",
  "it was done": "È stato fatto",
  "jobs & professions": "Lavori e professioni",
  "larger numbers": "Numeri più grandi",
  "last week": "La settimana scorsa",
  "leadership language": "Linguaggio della leadership",
  "learn different ways to greet people":
    "Impara modi diversi per salutare le persone",
  "learn essential greetings and farewells":
    "Impara saluti e congedi essenziali",
  "learn farewell expressions for different situations":
    "Impara espressioni di congedo per situazioni diverse",
  "learn how to use the app and explore all features":
    "Impara a usare l'app ed esplora tutte le funzioni",
  "learn names of common household items":
    "Impara i nomi degli oggetti domestici comuni",
  "learn numbers 0-5": "Impara i numeri 0-5",
  "learn new words through interactive questions. practice saying 'hello'.":
    "Impara nuove parole con domande interattive. Esercitati a dire 'ciao'.",
  "learn new words with interactive questions. practice saying hello.":
    "Impara nuove parole con domande interattive. Esercitati a dire ciao.",
  "learn the days": "Impara i giorni",
  "learn the words for close family members":
    "Impara le parole per i familiari stretti",
  "learn to count from twenty-one to one hundred":
    "Impara a contare da ventuno a cento",
  "learn to count from zero to twenty": "Impara a contare da zero a venti",
  "learn to identify and name colors":
    "Impara a identificare e nominare i colori",
  "identify and name colors": "Identifica e nomina i colori",
  "learn to introduce yourself": "Impara a presentarti",
  "introduce yourself": "Presentati",
  "learn to introduce yourself and ask others' names":
    "Impara a presentarti e a chiedere il nome agli altri",
  "learn words for the people in your life":
    "Impara parole per le persone nella tua vita",
  "learn your first numbers: 0, 1, 2, 3, 4, 5":
    "Impara i tuoi primi numeri: 0, 1, 2, 3, 4, 5",
  "learning from life": "Imparare dalla vita",
  "learning journey": "Percorso di apprendimento",
  "left and right": "Sinistra e destra",
  "let's meet up!": "Incontriamoci!",
  "let's try this": "Proviamo così",
  "let's, why don't we": "Facciamo, perché non...",
  "life experiences": "Esperienze di vita",
  "life stories": "Storie di vita",
  "likely or unlikely": "Probabile o improbabile",
  "likes & dislikes": "Mi piace e non mi piace",
  "linguistic diversity": "Diversità linguistica",
  "link vocabulary and grammar from the unit in a guided scenario.":
    "Collega vocabolario e grammatica dell'unità in uno scenario guidato.",
  "literary analysis": "Analisi letteraria",
  "literary criticism": "Critica letteraria",
  "literary devices": "Strumenti letterari",
  "literary techniques": "Tecniche letterarie",
  "making appointments": "Prendere appuntamenti",
  "making change": "Dare il resto",
  "making comparisons": "Fare confronti",
  "making complaints": "Fare reclami",
  "making plans": "Fare piani",
  "making predictions": "Fare previsioni",
  "making suggestions": "Fare suggerimenti",
  "market day": "Giorno di mercato",
  "master greeting etiquette and social niceties":
    "Padroneggia l'etichetta dei saluti e le cortesie sociali",
  "master formal and informal greetings":
    "Padroneggia i saluti formali e informali",
  "master grammar rules through exercises. practice greeting patterns.":
    "Padroneggia le regole grammaticali con esercizi. Pratica gli schemi di saluto.",
  "master rhetoric": "Padroneggiare la retorica",
  "master the most important words in any language":
    "Padroneggia le parole più importanti in qualsiasi lingua",
  "mastery of detail": "Padronanza del dettaglio",
  "maybe and i don't know": "Forse e non lo so",
  "maybe and perhaps": "Forse e magari",
  "maybe, might": "Forse, potrebbe",
  "media & news": "Media e notizie",
  "medical terms": "Termini medici",
  "medical visits": "Visite mediche",
  "meeting someone new": "Incontrare una persona nuova",
  "memorable moments": "Momenti memorabili",
  "mixed conditionals": "Condizionali misti",
  "monday to sunday": "Da lunedì a domenica",
  "months & dates": "Mesi e date",
  "more colors": "Altri colori",
  "more family": "Altra famiglia",
  "more, less, equal": "Più, meno, uguale",
  "my day": "La mia giornata",
  "my family": "La mia famiglia",
  "my family tree": "Il mio albero genealogico",
  "my favorite foods": "I miei cibi preferiti",
  "my neighborhood": "Il mio quartiere",
  "my story": "La mia storia",
  "my wardrobe": "Il mio guardaroba",
  "name everyday things around you": "Nomina le cose quotidiane intorno a te",
  "name everyday things": "Nomina le cose quotidiane",
  "narrate events": "Racconta eventi",
  "native idioms": "Modi di dire da madrelingua",
  "native phrases": "Frasi da madrelingua",
  "native-like skills": "Abilità da madrelingua",
  "nature and ecology": "Natura ed ecologia",
  "near-native fluency": "Fluidità quasi nativa",
  "news and media": "Notizie e media",
  "nice to meet you": "Piacere di conoscerti",
  "nuanced meaning": "Significato sfumato",
  numbers: "Numeri",
  "numbers 0-10": "Numeri 0-10",
  "numbers 0-20": "Numeri 0-20",
  "numbers 21-100": "Numeri 21-100",
  objects: "Oggetti",
  "objects around us": "Oggetti intorno a noi",
  "once upon a time": "C'era una volta",
  "order food": "Ordina da mangiare",
  "ordering a meal": "Ordinare un pasto",
  "our planet": "Il nostro pianeta",
  "passive voice": "Voce passiva",
  "past continuous": "Passato continuo",
  "past perfect": "Trapassato prossimo",
  "past subjunctive": "Congiuntivo passato",
  "past tense irregular": "Passato irregolare",
  "past tense regular": "Passato regolare",
  "paying the bill": "Pagare il conto",
  "people & family": "Persone e famiglia",
  "people and family words": "Parole su persone e famiglia",
  "people & places": "Persone e luoghi",
  "people around me": "Persone intorno a me",
  "perfect fluency": "Fluidità perfetta",
  "personal items": "Oggetti personali",
  "persuasive language": "Linguaggio persuasivo",
  "persuasive skills": "Abilità persuasive",
  "persuasive techniques": "Tecniche persuasive",
  "philosophical ideas": "Idee filosofiche",
  "phone numbers and ages": "Numeri di telefono ed età",
  "physical descriptions": "Descrizioni fisiche",
  "places around town": "Luoghi in città",
  "planning ahead": "Pianificare in anticipo",
  "planning your week": "Pianificare la settimana",
  "playing sports": "Fare sport",
  "please & thank you": "Per favore e grazie",
  "please and thank you": "Per favore e grazie",
  "polite conversations": "Conversazioni cortesi",
  "polite expressions": "Espressioni cortesi",
  "political discourse": "Discorso politico",
  "politics & society": "Politica e società",
  "powerful speech": "Discorso efficace",
  "practice greetings in real conversations":
    "Pratica i saluti in conversazioni reali",
  "practice greetings in real-life situations":
    "Pratica i saluti in situazioni reali",
  "practice in real situations": "Pratica in situazioni reali",
  "practice introductions in real conversations":
    "Pratica le presentazioni in conversazioni reali",
  "practice numbers in everyday situations":
    "Pratica i numeri in situazioni quotidiane",
  "practice speaking with realtime conversations. say hello to complete this activity.":
    "Pratica il parlato con conversazioni in tempo reale. Di' ciao per completare questa attività.",
  "practice using larger numbers with prices and money":
    "Pratica i numeri più grandi con prezzi e denaro",
  "practice with interactive stories that say hello.":
    "Pratica con storie interattive che dicono ciao.",
  "pre-a1 foundations": "Fondamenti Pre-A1",
  "precise meaning": "Significato preciso",
  predictions: "Previsioni",
  preferences: "Preferenze",
  "present perfect": "Present perfect",
  "prices and money": "Prezzi e denaro",
  "primary colors": "Colori primari",
  probability: "Probabilità",
  "problem solving": "Risoluzione dei problemi",
  "professional communication": "Comunicazione professionale",
  "professional fields": "Ambiti professionali",
  "professional language": "Linguaggio professionale",
  "professional meetings": "Riunioni professionali",
  "professional tone": "Tono professionale",
  "question words": "Parole interrogative",
  "quick responses": "Risposte rapide",
  "quoting others": "Citare gli altri",
  "rainbow colors": "Colori dell'arcobaleno",
  "react naturally in conversations":
    "Reagisci in modo naturale nelle conversazioni",
  "react naturally": "Reagisci in modo naturale",
  "recent events": "Eventi recenti",
  "red, blue, yellow - the building blocks": "Rosso, blu, giallo: le basi",
  "red, blue, yellow": "Rosso, blu, giallo",
  "refined language": "Linguaggio raffinato",
  "regional variations": "Variazioni regionali",
  "register switching": "Cambio di registro",
  "registers of speech": "Registri linguistici",
  responses: "Risposte",
  "regular past verbs": "Verbi regolari al passato",
  "relative clauses": "Frasi relative",
  "reported speech": "Discorso indiretto",
  "research papers": "Articoli di ricerca",
  "resolving issues": "Risolvere problemi",
  "respectful debate": "Dibattito rispettoso",
  "restaurant words": "Parole da ristorante",
  "retelling stories": "Raccontare di nuovo storie",
  "rhetorical devices": "Figure retoriche",
  "rooms and furniture": "Stanze e mobili",
  "rooms of the house": "Stanze della casa",
  "round out 100 words with connectors, feelings, and quick questions":
    "Completa 100 parole con connettori, emozioni e domande rapide",
  "saving earth": "Salvare la Terra",
  "say your name and origin": "Di' il tuo nome e la tua provenienza",
  "saying goodbye": "Dire arrivederci",
  "saying hello": "Dire ciao",
  "saying your name": "Dire il tuo nome",
  "scheduling events": "Programmare eventi",
  "scholarly language": "Linguaggio accademico",
  "school & education": "Scuola e istruzione",
  "school life": "Vita scolastica",
  "science & innovation": "Scienza e innovazione",
  "scientific terms": "Termini scientifici",
  "scientific topics": "Temi scientifici",
  "setting the scene": "Impostare la scena",
  "share personal information and ask about others":
    "Condividi informazioni personali e chiedi degli altri",
  "sharing experiences": "Condividere esperienze",
  "sharing interests": "Condividere interessi",
  "sharing views": "Condividere punti di vista",
  "she said that...": "Ha detto che...",
  "shopping & money": "Shopping e denaro",
  "shopping for clothes": "Comprare vestiti",
  "short targeted drills to consolidate the unit language before the quiz.":
    "Brevi esercizi mirati per consolidare la lingua dell'unità prima del quiz.",
  "should and shouldn't": "Dovrebbe e non dovrebbe",
  "should, must": "Dovrebbe, deve",
  "six to ten": "Da sei a dieci",
  "smart shopping": "Shopping intelligente",
  "social arrangements": "Accordi sociali",
  "social glue & questions": "Cortesie sociali e domande",
  "social issues": "Questioni sociali",
  "society and issues": "Società e questioni",
  "society today": "La società oggi",
  "something's wrong": "C'è qualcosa che non va",
  "sophisticated logic": "Logica sofisticata",
  "sorry and excuse me": "Scusa e permesso",
  "sound natural": "Parla in modo naturale",
  "speaking like a native": "Parlare come un madrelingua",
  "specialized vocabulary": "Vocabolario specialistico",
  "sports & exercise": "Sport ed esercizio fisico",
  "staying active": "Restare attivi",
  "story elements": "Elementi della storia",
  "style control": "Controllo dello stile",
  "stylistic mastery": "Padronanza stilistica",
  "subjunctive past": "Congiuntivo passato",
  "subjunctive present": "Congiuntivo presente",
  "subtle nuances": "Sfumature sottili",
  superlatives: "Superlativi",
  "taking the bus": "Prendere l'autobus",
  "talk about locations": "Parla di posizioni",
  "talk about weather": "Parla del tempo",
  "talking about family": "Parlare della famiglia",
  "technical terms": "Termini tecnici",
  "technological advances": "Progressi tecnologici",
  "technology basics": "Tecnologia di base",
  "tell me about yourself": "Parlami di te",
  "telling stories": "Raccontare storie",
  "telling time": "Dire l'ora",
  "test your ability to respond appropriately":
    "Metti alla prova la tua capacità di rispondere in modo appropriato",
  "test response skills": "Metti alla prova le abilità di risposta",
  "test your color recognition skills":
    "Metti alla prova la tua capacità di riconoscere i colori",
  "test color knowledge": "Metti alla prova la conoscenza dei colori",
  "test your counting skills from 0 to 10":
    "Metti alla prova la tua capacità di contare da 0 a 10",
  "test counting 0-10": "Metti alla prova il conteggio 0-10",
  "test your greeting and farewell skills":
    "Metti alla prova le tue abilità con saluti e congedi",
  "test greeting skills": "Metti alla prova le abilità di saluto",
  "test your introduction skills":
    "Metti alla prova le tue abilità di presentazione",
  "test introduction skills": "Metti alla prova le abilità di presentazione",
  "test your polite expression skills":
    "Metti alla prova le tue espressioni cortesi",
  "test polite expressions": "Metti alla prova le espressioni cortesi",
  "the magic words that open doors everywhere":
    "Le parole magiche che aprono porte ovunque",
  "the most important words": "Le parole più importanti",
  "test object vocabulary": "Metti alla prova il vocabolario degli oggetti",
  "magic words that open doors": "Parole magiche che aprono porte",
  "theoretical discussion": "Discussione teorica",
  "things at home": "Cose in casa",
  "things you carry with you every day": "Le cose che porti con te ogni giorno",
  "things you carry daily": "Cose che porti ogni giorno",
  "time, travel & directions": "Tempo, viaggi e indicazioni",
  "tomorrow's world": "Il mondo di domani",
  transportation: "Trasporti",
  "travel & tourism": "Viaggi e turismo",
  "travel options": "Opzioni di viaggio",
  "traveling abroad": "Viaggiare all'estero",
  "trip planning": "Pianificare un viaggio",
  "twelve months": "Dodici mesi",
  "use numbers to count everyday things":
    "Usa i numeri per contare cose quotidiane",
  "use numbers to count things": "Usa i numeri per contare le cose",
  "using numbers daily": "Usare i numeri ogni giorno",
  "using technology": "Usare la tecnologia",
  "visiting the doctor": "Andare dal medico",
  "was doing": "Stava facendo",
  weather: "Tempo meteorologico",
  "weather reports": "Previsioni del tempo",
  wellness: "Benessere",
  "wellness choices": "Scelte di benessere",
  "what day is it?": "Che giorno è?",
  "what did you do?": "Che cosa hai fatto?",
  "what do you do?": "Che lavoro fai?",
  "what do you enjoy?": "Che cosa ti piace?",
  "what is this?": "Che cos'è?",
  "what time is it?": "Che ore sono?",
  "what to wear": "Cosa indossare",
  "what will you do?": "Che cosa farai?",
  "what you wear": "Cosa indossi",
  "what's your name?": "Come ti chiami?",
  "when's your birthday?": "Quando è il tuo compleanno?",
  "where is it?": "Dov'è?",
  "while it was happening": "Mentre stava accadendo",
  "who, which, that": "Chi, quale, che",
  "why don't we?": "Perché non...?",
  "will do": "Farà",
  "winning debates": "Vincere dibattiti",
  "words for friends, children, and people you see every day":
    "Parole per amici, bambini e persone che vedi ogni giorno",
  "workplace language": "Linguaggio sul lavoro",
  "yes and no": "Sì e no",
  "yes, no & basic responses": "Sì, no e risposte di base",
  "yesterday's actions": "Azioni di ieri",
  "your day": "La tua giornata",
  "your family": "La tua famiglia",
  "your first 20 high-frequency words for greetings and basics":
    "Le tue prime 20 parole ad alta frequenza per saluti e basi",
  "your very first words": "Le tue primissime parole",
  "zero to five": "Da zero a cinque",
};

const translateTopic = (topic, { sentence = false } = {}) => {
  const translated =
    TEXT_TRANSLATIONS[normalizeKey(topic)] || String(topic || "");
  return sentence ? lowerFirst(translated) : capitalizeFirst(translated);
};

export const translateSkillTreeText = (englishText) => {
  if (!englishText || typeof englishText !== "string") return englishText;

  const direct = TEXT_TRANSLATIONS[normalizeKey(englishText)];
  if (direct) return direct;

  let match = englishText.match(/^Learn key vocabulary for (.+)$/);
  if (match) {
    return `Impara il vocabolario chiave per ${translateTopic(match[1], {
      sentence: true,
    })}`;
  }

  match = englishText.match(/^Practice (.+) in conversation$/);
  if (match) {
    return `Pratica ${translateTopic(match[1], {
      sentence: true,
    })} in conversazione`;
  }

  match = englishText.match(/^Apply (.+) skills$/);
  if (match) {
    return `Applica le abilità di ${translateTopic(match[1], {
      sentence: true,
    })}`;
  }

  match = englishText.match(/^Test your knowledge of (.+)$/);
  if (match) {
    return `Metti alla prova le tue conoscenze su ${translateTopic(match[1], {
      sentence: true,
    })}`;
  }

  match = englishText.match(/^Review (.+) by playing an interactive game$/);
  if (match) {
    return `Ripassa ${translateTopic(match[1], {
      sentence: true,
    })} giocando a un gioco interattivo`;
  }

  match = englishText.match(/^(.+) Quiz$/);
  if (match) return `Quiz su ${translateTopic(match[1])}`;

  match = englishText.match(/^(.+) Skill Builder$/);
  if (match) return `Sviluppo abilità: ${translateTopic(match[1])}`;

  match = englishText.match(/^(.+) Integrated Practice$/);
  if (match) return `Pratica integrata: ${translateTopic(match[1])}`;

  return englishText;
};

const addItalianText = (value) => {
  if (Array.isArray(value)) return value.map(addItalianText);
  if (!value || typeof value !== "object") return value;

  const localized = Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, addItalianText(child)]),
  );

  if (
    typeof value.en === "string" &&
    typeof value.es === "string" &&
    typeof value.it !== "string"
  ) {
    localized.it = translateSkillTreeText(value.en);
  }

  return localized;
};

export const withItalianSkillTreeText = (skillTree) =>
  addItalianText(skillTree);
