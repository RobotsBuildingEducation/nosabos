import { LANDING_PAGE_AR_STATIC } from "./landingPageArStatic.js";
import { LANDING_PAGE_DE_STATIC } from "./landingPageDeStatic.js";
import { LANDING_PAGE_HI_STATIC } from "./landingPageHiStatic.js";
import { LANDING_PAGE_PT_STATIC } from "./landingPagePtStatic.js";
import { LANDING_PAGE_ZH_STATIC } from "./landingPageZhStatic.js";

export const landingPageTranslations = {
  en: {
    nav_signin: "Sign In",
    hero_title: "Your Personal",
    hero_title_accent: "Language Tutor",
    hero_subtitle:
      "A personal language tutor that follows structured paths, remembers your mistakes and turns them into tomorrow’s practice.",
    cta_start: "Start Learning",
    cta_signin: "Sign In With Secret Key",
    create_secret_key_detected_prefix: "Secret key detected. Use ",
    create_secret_key_detected_action: "Sign In With Key",
    create_secret_key_detected_suffix: " instead.",
    languages_label: "LANGUAGES",
    languages_title: "Practice in",
    languages_title_accent: "12 Languages",
    languages_stable: "Stable",
    languages_beta: "Beta",
    languages_alpha: "Alpha",
    features_label: "CAPABILITIES",
    features_title: "Everything You Need to",
    features_title_accent: "Become Fluent",
    feature_tutor: "Tutor",
    feature_tutor_desc:
      "A complete end-to-end real-time tutor that adapts to your level and helps you learn.",
    feature_memory: "Memory System",
    feature_memory_desc:
      "Remembers your mistakes, goals, and progress, then turns them into focused review.",
    feature_journey: "Journey",
    feature_journey_desc:
      "Store voice notes across your learning milestones to listen to your progress over time.",
    feature_daily_quests: "Today’s Focus",
    feature_daily_quests_desc:
      "Get a personalized daily mix of practice, review, and rewards.",
    feature_companion: "Learning Companion",
    feature_companion_desc:
      "Raise a companion that grows stronger as you learn.",
    feature_conversations: "Customizable Conversations",
    feature_conversations_desc:
      "Choose the scenario, role, difficulty, and goals so every speaking session fits what you want to practice.",
    feature_stories: "Interactive Stories",
    feature_stories_desc:
      "Engaging narratives that invite you to read aloud, summarize, and role-play in your target language.",
    feature_reading: "Reading Practice",
    feature_reading_desc:
      "Subject-focused lectures expanding your vocabulary and cultural knowledge through comprehension exercises.",
    feature_grammar: "Grammar Book",
    feature_grammar_desc:
      "Quick rule references, concept drills, and adaptive review sets that strengthen your foundation.",
    feature_skilltree: "Lessons",
    feature_skilltree_desc:
      "Structured learning paths that build your abilities step by step with clear progress visualization.",
    feature_flashcards: "Vocabulary",
    feature_flashcards_desc:
      "Practice new words based on your level and various common situations.",
    feature_goals: "Daily Goals",
    feature_goals_desc:
      "Personalized targets tracking your progress and celebrating streaks to keep you motivated.",
    feature_notes: "Generate Notes",
    feature_notes_desc:
      "Create comprehensive study notes from your lessons to review later.",
    feature_immersion: "Immersion",
    feature_immersion_desc:
      "Complete tasks outside of the app to immerse and practice the language.",
    feature_score: "Score",
    feature_score_desc:
      "An adaptive rating model that tracks your true ability on every answer and dynamically adapts question difficulty.",
    feature_elo: "Score",
    feature_elo_desc:
      "An adaptive rating model that tracks your true ability on every answer and dynamically adapts question difficulty.",
    feature_achievements: "Cross-Platform Achievements",
    feature_achievements_desc:
      "Earn verified completion awards and milestone badges that sync seamlessly across devices and platforms.",
    feature_teams: "Learning Teams",
    feature_teams_desc:
      "Form study squads with friends to share daily goals, streaks, companion growth, and progress in real time.",
    feature_global_feed: "Global Feed",
    feature_global_feed_desc:
      "Discover notes, study updates, and tips shared by learners worldwide on the decentralized network.",
    feature_assistant: "Personal Assistant",
    feature_assistant_desc:
      "Get personalized guidance and recommendations when you need help.",
    feature_flashcards_spaced: "Flashcard Drills",
    feature_flashcards_spaced_desc:
      "Master 1,000+ words and phrases with spaced repetition flashcards organized by CEFR level from beginner to advanced.",
    feature_game_review: "Game Review RPG",
    feature_game_review_desc:
      "Explore quest-driven worlds, talk to NPCs, and collect items—all in your target language—to review vocabulary from your lessons.",
    feature_proficiency_test: "Proficiency Test",
    feature_proficiency_test_desc:
      "Have a 10-exchange voice conversation with intelligence that adapts in real time to place you at your exact CEFR level.",
    feature_phonics: "Phonics",
    feature_phonics_desc:
      "Practice words and sounds with our Alphabet bootcamp mode to master pronunciation from the ground up.",

    value_label: "Why Us",
    value_title: "Learning That",
    value_title_accent: "Actually Works",
    value_1:
      "Intelligence that adapts in real-time—conversations, exercises, and feedback adjust to your exact level",
    value_2:
      "Six practice modes for every learning style: speaking, reading, writing, listening, grammar, and vocabulary",
    value_3:
      "Structured CEFR progression from A1 beginner to C2 mastery with 324 lessons and clear milestones",
    value_4:
      "Real-time pronunciation coaching that listens, corrects, and builds your confidence to speak",
    scholarship_label: "GIVE BACK",
    scholarship_title: "Create Scholarships",
    scholarship_title_accent: "With Learning",
    scholarship_desc:
      "The mission of Robots Building Education is to create transformative education technology.",
    scholarship_note:
      "We let users opt-in to creating a small wallet that lets you send Bitcoin to recipients every time you make progress in the app.",
    faq_label: "QUESTIONS",
    faq_title: "Frequently Asked",
    faq_q1: "What happens when I create an account?",
    faq_a1:
      "We generate a secure key that unlocks your personal study space. Keep it safe—it's the only way to sign in from another device.",
    faq_q2: "Do I need to know anything about blockchains or Nostr?",
    faq_a2:
      "No. We take care of the technical details for you. All you need is your key to come back to your lessons.",
    faq_q3: "Which languages can I practice?",
    faq_a3:
      "You can practice any of the languages listed above. We’ll continue adding more over time.",
    faq_q4: "Is there a cost?",
    faq_a4:
      "The core practice tools are free. Some advanced labs may require scholarships or paid access.",
    cta_final_title: "Let's get started",
    cta_final_accent: "",
    cta_final_subtitle:
      "Create your secure profile in seconds, save your key, and unlock a world of language learning.",
    placeholder_name: "Your display name",
    footer_brand: "Piyali",
    footer_tagline: "Making language learning accessible to everyone.",
    signin_title: "Welcome Back",
    signin_subtitle:
      "Paste the secret key you saved when you created your account.",
    signin_placeholder: "Enter your secret key",
    signin_button: "Sign In",
    signin_extension: "Sign In With NIP-07 Extension",
    signin_or: "or",
    signin_error_invalid_key:
      "Invalid secret key. Please check it and try again.",
    signin_error_extension: "Extension sign-in failed. Please try again.",
    signin_error_generic: "Sign in failed. Please try again.",
    back_button: "Back",
    language_nl: "Dutch",
    language_en: "English",
    language_fr: "French",
    language_de: "German",
    language_it: "Italian",
    language_hi: "Hindi",
    language_ar: "Egyptian Arabic",
    language_zh: "Mandarin Chinese",
    language_pt: "Portuguese",
    language_es: "Spanish",
    language_nah: "Eastern Huasteca Nahuatl",
    language_yua: "Yucatec Maya",
    language_el: "Greek",
    language_ja: "Japanese",
    language_ru: "Russian",
    language_pl: "Polish",
    language_ga: "Irish",
  },
  es: {
    nav_signin: "Iniciar Sesión",
    hero_title: "Tu Tutor",
    hero_title_accent: "Lingüístico Personal",
    hero_subtitle:
      "Un tutor personal de idiomas que sigue rutas estructuradas, recuerda tus errores y los convierte en la práctica de mañana.",
    cta_start: "Comienza",
    cta_signin: "Iniciar sesión con clave secreta",
    create_secret_key_detected_prefix: "Clave secreta detectada. Usa ",
    create_secret_key_detected_action: "Iniciar sesión con clave",
    create_secret_key_detected_suffix: " en su lugar.",
    languages_label: "IDIOMAS",
    languages_title: "Practica en",
    languages_title_accent: "12 Idiomas",
    languages_stable: "Estable",
    languages_beta: "Beta",
    languages_alpha: "Alfa",
    features_label: "CAPACIDADES",
    features_title: "Todo lo que Necesitas para",
    features_title_accent: "Ser Fluido",
    feature_tutor: "Tutor",
    feature_tutor_desc:
      "Un tutor completo en tiempo real, de principio a fin, que se adapta a tu nivel y te ayuda a aprender.",
    feature_memory: "Sistema de Memoria",
    feature_memory_desc:
      "Recuerda tus errores, metas y avances para convertirlos en repasos enfocados.",
    feature_journey: "Camino",
    feature_journey_desc:
      "Guarda notas de voz en tus hitos de aprendizaje para escuchar tu progreso con el tiempo.",
    feature_daily_quests: "Enfoque de hoy",
    feature_daily_quests_desc:
      "Recibe cada día una mezcla personalizada de práctica, repaso y recompensas.",
    feature_companion: "Compañero de Aprendizaje",
    feature_companion_desc:
      "Cuida un compañero que se fortalece mientras aprendes.",
    feature_conversations: "Conversaciones Personalizables",
    feature_conversations_desc:
      "Elige el escenario, el rol, la dificultad y los objetivos para que cada sesión de habla se ajuste a lo que quieres practicar.",
    feature_stories: "Historias Interactivas",
    feature_stories_desc:
      "Narrativas envolventes que te invitan a leer en voz alta, resumir y actuar en tu idioma objetivo.",
    feature_reading: "Práctica de Lectura",
    feature_reading_desc:
      "Lecturas enfocadas que amplían tu vocabulario y conocimiento cultural.",
    feature_grammar: "Laboratorios de Gramática",
    feature_grammar_desc:
      "Referencias rápidas, ejercicios conceptuales y sets de repaso adaptativos.",
    feature_skilltree: "Lecciones",
    feature_skilltree_desc:
      "Rutas de aprendizaje estructuradas que construyen tus habilidades paso a paso.",
    feature_flashcards: "Ejercicios de Vocabulario",

    feature_flashcards_desc:
      "Aprende y practica nuevas palabras según tu nivel y situaciones reales.",
    feature_goals: "Metas Diarias",
    feature_goals_desc:
      "Objetivos personalizados que rastrean tu progreso y celebran tus rachas.",
    feature_notes: "Generar Notas",
    feature_notes_desc:
      "Crea notas de estudio de tus lecciones para revisarlas más tarde.",
    feature_immersion: "Inmersión",
    feature_immersion_desc:
      "Completa tareas fuera de la app para sumergirte y practicar el idioma.",
    feature_score: "Puntuación",
    feature_score_desc:
      "Un modelo de calificación adaptativo que mide tu dominio real en cada respuesta y adapta la dificultad de los ejercicios.",
    feature_elo: "Puntuación",
    feature_elo_desc:
      "Un modelo de calificación adaptativo que mide tu dominio real en cada respuesta y adapta la dificultad de los ejercicios.",
    feature_achievements: "Logros Multiplataforma",
    feature_achievements_desc:
      "Obtén insignias y recompensas verificadas de finalización que se sincronizan sin problemas entre dispositivos.",
    feature_teams: "Equipos de Aprendizaje",
    feature_teams_desc:
      "Crea grupos de estudio con amigos para compartir metas diarias, rachas, crecimiento del compañero y progreso en tiempo real.",
    feature_global_feed: "Feed Global",
    feature_global_feed_desc:
      "Descubre notas, avances y consejos compartidos por estudiantes de todo el mundo en la red descentralizada.",
    feature_assistant: "Asistente Personal",
    feature_assistant_desc:
      "Obtén orientación y recomendaciones personalizadas cuando las necesites.",

    feature_flashcards_spaced: "Tarjetas Inteligentes",
    feature_flashcards_spaced_desc:
      "Domina más de 1,000 palabras y frases con tarjetas de repetición espaciada organizadas por nivel CEFR.",
    feature_game_review: "Repaso RPG",
    feature_game_review_desc:
      "Explora mundos con misiones, habla con NPCs y recolecta objetos—todo en tu idioma objetivo—para repasar el vocabulario de tus lecciones.",
    feature_proficiency_test: "Prueba de Nivel",
    feature_proficiency_test_desc:
      "Mantén una conversación de voz de 10 intercambios con inteligencia que se adapta en tiempo real para ubicarte en tu nivel CEFR exacto.",
    feature_phonics: "Fonética",
    feature_phonics_desc:
      "Practica palabras y sonidos con nuestro modo de Alfabeto para dominar la pronunciación desde cero.",
    value_label: "Por qué nosotros",
    value_title: "Aprendizaje que",
    value_title_accent: "Realmente Funciona",
    value_1:
      "Inteligencia que se adapta en tiempo real—conversaciones, ejercicios y retroalimentación ajustados a tu nivel exacto",
    value_2:
      "Seis modos de práctica para cada estilo de aprendizaje: hablar, leer, escribir, escuchar, gramática y vocabulario",
    value_3:
      "Progresión CEFR estructurada de A1 principiante a C2 maestría con 324 lecciones y hitos claros",
    value_4:
      "Entrenamiento de pronunciación en tiempo real que escucha, corrige y construye tu confianza para hablar",
    scholarship_label: "CONTRIBUYE",
    scholarship_title: "Crea Becas",
    scholarship_title_accent: "Aprendiendo",
    scholarship_desc:
      "La misión de Robots Building Education es crear tecnología educativa transformadora.",
    scholarship_note:
      "Permitimos que los usuarios opten por crear una pequeña billetera que envía Bitcoin a destinatarios cada vez que progresan en la app.",
    faq_label: "PREGUNTAS",
    faq_title: "Preguntas Frecuentes",
    faq_q1: "¿Qué pasa cuando creo una cuenta?",
    faq_a1:
      "Generamos una llave segura que desbloquea tu espacio de estudio personal. Guárdala bien—es la única forma de iniciar sesión desde otro dispositivo.",
    faq_q2: "¿Necesito saber algo sobre blockchains o Nostr?",
    faq_a2:
      "No. Nos encargamos de los detalles técnicos. Solo necesitas tu llave para volver a tus lecciones.",
    faq_q3: "¿Qué idiomas puedo practicar?",
    faq_a3:
      "Puedes practicar cualquiera de los idiomas de la lista anterior. Seguiremos agregando más con el tiempo.",
    faq_q4: "¿Tiene costo?",
    faq_a4:
      "Las herramientas principales son gratuitas. Algunos laboratorios avanzados pueden requerir becas o acceso de pago.",
    cta_final_title: "Empecemos",
    cta_final_accent: "",
    cta_final_subtitle:
      "Crea tu perfil seguro en segundos, guarda tu llave y desbloquea un mundo de aprendizaje.",
    placeholder_name: "Tu nombre para mostrar",
    footer_brand: "Piyali",
    footer_tagline: "Haciendo el aprendizaje de idiomas accesible para todos.",
    signin_title: "Bienvenido de Nuevo",
    signin_subtitle:
      "Pega la llave secreta que guardaste cuando creaste tu cuenta.",
    signin_placeholder: "Ingresa tu llave secreta",
    signin_button: "Iniciar Sesión",
    signin_extension: "Iniciar sesión con extensión NIP-07",
    signin_or: "o",
    signin_error_invalid_key:
      "Llave secreta no válida. Revísala e inténtalo de nuevo.",
    signin_error_extension:
      "No se pudo iniciar sesión con la extensión. Inténtalo de nuevo.",
    signin_error_generic: "No se pudo iniciar sesión. Inténtalo de nuevo.",
    back_button: "Regresar",
    language_nl: "Holandés",
    language_en: "Inglés",
    language_fr: "Francés",
    language_de: "Alemán",
    language_it: "Italiano",
    language_hi: "Hindi",
    language_ar: "Árabe egipcio",
    language_zh: "Chino mandarín",
    language_pt: "Portugués",
    language_es: "Español",
    language_nah: "Náhuatl huasteco oriental",
    language_yua: "Maya yucateco",
    language_el: "Griego",
    language_ja: "Japonés",
    language_ru: "Ruso",
    language_pl: "Polaco",
    language_ga: "Irlandés",
  },
  it: {
    nav_signin: "Accedi",
    hero_title: "Il Tuo Tutor",
    hero_title_accent: "Linguistico Personale",
    hero_subtitle:
      "Un tutor linguistico personale che segue percorsi strutturati, ricorda i tuoi errori e li trasforma nella pratica di domani.",
    cta_start: "Inizia",
    cta_signin: "Accedi con la chiave segreta",
    create_secret_key_detected_prefix: "Chiave segreta rilevata. Usa ",
    create_secret_key_detected_action: "Accedi con la chiave",
    create_secret_key_detected_suffix: " invece.",
    languages_label: "LINGUE",
    languages_title: "Pratica in",
    languages_title_accent: "12 Lingue",
    languages_stable: "Stabile",
    languages_beta: "Beta",
    languages_alpha: "Alfa",
    features_label: "FUNZIONALITÀ",
    features_title: "Tutto ciò che ti serve per",
    features_title_accent: "Diventare Fluente",
    feature_tutor: "Tutor",
    feature_tutor_desc:
      "Un tutor completo in tempo reale, dall'inizio alla fine, che si adatta al tuo livello e ti aiuta a imparare.",
    feature_memory: "Sistema di Memoria",
    feature_memory_desc:
      "Ricorda errori, obiettivi e progressi e li trasforma in ripassi mirati.",
    feature_journey: "Percorso",
    feature_journey_desc:
      "Salva note vocali lungo i tuoi traguardi per ascoltare i tuoi progressi nel tempo.",
    feature_daily_quests: "Focus di oggi",
    feature_daily_quests_desc:
      "Ricevi ogni giorno pratica, ripasso e ricompense su misura.",
    feature_companion: "Compagno di Apprendimento",
    feature_companion_desc:
      "Fai crescere un compagno che diventa più forte mentre impari.",
    feature_conversations: "Conversazioni Personalizzabili",
    feature_conversations_desc:
      "Scegli scenario, ruolo, difficoltà e obiettivi, così ogni sessione orale si adatta a ciò che vuoi praticare.",
    feature_stories: "Storie Interattive",
    feature_stories_desc:
      "Narrazioni coinvolgenti che ti invitano a leggere ad alta voce, riassumere e fare role-play nella tua lingua target.",
    feature_reading: "Pratica di Lettura",
    feature_reading_desc:
      "Lezioni tematiche che ampliano il vocabolario e le conoscenze culturali con esercizi di comprensione.",
    feature_grammar: "Libro di Grammatica",
    feature_grammar_desc:
      "Riferimenti rapidi alle regole, esercizi concettuali e set di revisione adattivi per rafforzare le basi.",
    feature_skilltree: "Lezioni",
    feature_skilltree_desc:
      "Percorsi di apprendimento strutturati che costruiscono le abilità passo dopo passo con una visualizzazione chiara dei progressi.",
    feature_flashcards: "Vocabolario",
    feature_flashcards_desc:
      "Pratica nuove parole in base al tuo livello e a situazioni quotidiane.",
    feature_goals: "Obiettivi Giornalieri",
    feature_goals_desc:
      "Target personalizzati che monitorano i progressi e celebrano le serie per mantenerti motivato.",
    feature_notes: "Genera Note",
    feature_notes_desc:
      "Crea note di studio complete dalle tue lezioni da rivedere in seguito.",
    feature_immersion: "Immersione",
    feature_immersion_desc:
      "Completa attività fuori dall'app per immergerti e praticare la lingua.",
    feature_score: "Punteggio",
    feature_score_desc:
      "Un sistema di valutazione adattivo che misura la tua vera abilità a ogni risposta e adatta dinamicamente la difficoltà.",
    feature_elo: "Punteggio",
    feature_elo_desc:
      "Un sistema di valutazione adattivo che misura la tua vera abilità a ogni risposta e adatta dinamicamente la difficoltà.",
    feature_achievements: "Obiettivi Multipiattaforma",
    feature_achievements_desc:
      "Ottieni badge e premi di completamento verificati sincronizzati perfettamente tra tutti i dispositivi.",
    feature_teams: "Squadre di Apprendimento",
    feature_teams_desc:
      "Crea gruppi di studio con amici per condividere obiettivi giornalieri, serie, crescita del compagno e progressi in tempo reale.",
    feature_global_feed: "Feed Globale",
    feature_global_feed_desc:
      "Scopri note, aggiornamenti e suggerimenti condivisi da studenti di tutto il mondo sulla rete decentralizzata.",
    feature_assistant: "Assistente Personale",
    feature_assistant_desc:
      "Ottieni guida e raccomandazioni personalizzate quando ne hai bisogno.",
    feature_flashcards_spaced: "Flashcard di Ripetizione",
    feature_flashcards_spaced_desc:
      "Padroneggia oltre 1.000 parole e frasi con flashcard a ripetizione spaziata organizzate per livello CEFR, dal principiante all'avanzato.",
    feature_game_review: "Gioco RPG di Revisione",
    feature_game_review_desc:
      "Esplora mondi con missioni, parla con PNG e raccogli oggetti — tutto nella tua lingua target — per ripassare il vocabolario delle lezioni.",
    feature_proficiency_test: "Test di Livello",
    feature_proficiency_test_desc:
      "Sostieni una conversazione vocale di 10 scambi con un'intelligenza che si adatta in tempo reale per collocarti al tuo livello CEFR esatto.",
    feature_phonics: "Fonetica",
    feature_phonics_desc:
      "Pratica parole e suoni con la modalità Alfabeto per padroneggiare la pronuncia dalle basi.",
    value_label: "Perché noi",
    value_title: "Apprendimento che",
    value_title_accent: "Funziona Davvero",
    value_1:
      "Intelligenza che si adatta in tempo reale — conversazioni, esercizi e feedback adeguati al tuo livello esatto",
    value_2:
      "Sei modalità di pratica per ogni stile: parlato, lettura, scrittura, ascolto, grammatica e vocabolario",
    value_3:
      "Progressione CEFR strutturata da A1 principiante a C2 maestria con 324 lezioni e traguardi chiari",
    value_4:
      "Coaching della pronuncia in tempo reale che ascolta, corregge e costruisce la tua fiducia nel parlare",
    scholarship_label: "DAI QUALCOSA IN CAMBIO",
    scholarship_title: "Crea Borse di Studio",
    scholarship_title_accent: "con l'Apprendimento",
    scholarship_desc:
      "La missione di Robots Building Education è creare tecnologia educativa trasformativa.",
    scholarship_note:
      "Permettiamo agli utenti di scegliere di creare un piccolo portafoglio che invia Bitcoin ai destinatari ogni volta che fanno progressi nell'app.",
    faq_label: "DOMANDE",
    faq_title: "Domande Frequenti",
    faq_q1: "Cosa succede quando creo un account?",
    faq_a1:
      "Generiamo una chiave sicura che sblocca il tuo spazio di studio personale. Conservala bene — è l'unico modo per accedere da un altro dispositivo.",
    faq_q2: "Devo sapere qualcosa su blockchain o Nostr?",
    faq_a2:
      "No. Ci occupiamo noi dei dettagli tecnici. Hai solo bisogno della tua chiave per tornare alle lezioni.",
    faq_q3: "Quali lingue posso praticare?",
    faq_a3:
      "Puoi esercitarti in una qualsiasi delle lingue elencate sopra. Continueremo ad aggiungerne altre nel tempo.",
    faq_q4: "Ha un costo?",
    faq_a4:
      "Gli strumenti principali sono gratuiti. Alcuni laboratori avanzati potrebbero richiedere borse di studio o accesso a pagamento.",
    cta_final_title: "Iniziamo",
    cta_final_accent: "",
    cta_final_subtitle:
      "Crea il tuo profilo sicuro in pochi secondi, salva la chiave e sblocca un mondo di apprendimento linguistico.",
    placeholder_name: "Il tuo nome visualizzato",
    footer_brand: "Piyali",
    footer_tagline: "Rendere l'apprendimento delle lingue accessibile a tutti.",
    signin_title: "Bentornato",
    signin_subtitle:
      "Incolla la chiave segreta che hai salvato quando hai creato il tuo account.",
    signin_placeholder: "Inserisci la tua chiave segreta",
    signin_button: "Accedi",
    signin_extension: "Accedi con l'estensione NIP-07",
    signin_or: "o",
    signin_error_invalid_key:
      "Chiave segreta non valida. Controllala e riprova.",
    signin_error_extension: "Accesso con estensione non riuscito. Riprova.",
    signin_error_generic: "Accesso non riuscito. Riprova.",
    back_button: "Indietro",
    language_nl: "Olandese",
    language_en: "Inglese",
    language_fr: "Francese",
    language_de: "Tedesco",
    language_it: "Italiano",
    language_hi: "Hindi",
    language_ar: "Arabo egiziano",
    language_zh: "Cinese mandarino",
    language_pt: "Portoghese",
    language_es: "Spagnolo",
    language_nah: "Nahuatl huasteco orientale",
    language_yua: "Maya yucateco",
    language_el: "Greco",
    language_ja: "Giapponese",
    language_ru: "Russo",
    language_pl: "Polacco",
    language_ga: "Irlandese",
  },
};

landingPageTranslations.pt = {
  ...landingPageTranslations.en,
  ...LANDING_PAGE_PT_STATIC,
};
landingPageTranslations.de = {
  ...landingPageTranslations.en,
  ...LANDING_PAGE_DE_STATIC,
};
landingPageTranslations.hi = {
  ...landingPageTranslations.en,
  ...LANDING_PAGE_HI_STATIC,
};
landingPageTranslations.zh = {
  ...landingPageTranslations.en,
  ...LANDING_PAGE_ZH_STATIC,
};
landingPageTranslations.ar = {
  ...landingPageTranslations.en,
  ...LANDING_PAGE_AR_STATIC,
};

landingPageTranslations.fr = {
  ...landingPageTranslations.en,
  nav_signin: "Connexion",
  hero_title: "Ton Tuteur",
  hero_title_accent: "Linguistique Personnel",
  hero_subtitle:
    "Un tuteur linguistique personnel qui suit des parcours structurés, mémorise tes erreurs et les transforme en exercices pour le lendemain.",
  cta_start: "Commencer",
  cta_signin: "Se connecter avec une clé secrète",
  create_secret_key_detected_prefix: "Clé secrète détectée. Utilise ",
  create_secret_key_detected_action: "Se connecter avec une clé",
  create_secret_key_detected_suffix: " à la place.",
  languages_label: "LANGUES",
  languages_title: "Pratique en",
  languages_title_accent: "12 Langues",
  languages_stable: "Stable",
  languages_beta: "Beta",
  languages_alpha: "Alpha",
  features_label: "FONCTIONNALITES",
  features_title: "Tout ce qu'il faut pour",
  features_title_accent: "Devenir Fluide",
  feature_tutor: "Tuteur",
  feature_tutor_desc:
    "Un tuteur complet en temps reel, de bout en bout, qui s'adapte a ton niveau et t'aide a apprendre.",
  feature_memory: "Systeme de Memoire",
  feature_memory_desc:
    "Memorise tes erreurs, tes objectifs et tes progres pour creer des revisions ciblees.",
  feature_journey: "Parcours",
  feature_journey_desc:
    "Enregistre des notes vocales a chaque etape pour ecouter tes progres au fil du temps.",
  feature_daily_quests: "Focus du jour",
  feature_daily_quests_desc:
    "Reçois chaque jour un programme personnalise de pratique, revision et recompenses.",
  feature_companion: "Compagnon d'Apprentissage",
  feature_companion_desc:
    "Fais grandir un compagnon qui devient plus fort a mesure que tu apprends.",
  feature_conversations: "Conversations Personnalisables",
  feature_conversations_desc:
    "Choisis le scenario, le role, la difficulte et les objectifs pour que chaque session orale corresponde a ce que tu veux pratiquer.",
  feature_stories: "Histoires Interactives",
  feature_stories_desc:
    "Des recits engageants qui t'invitent a lire a voix haute, resumer et jouer des roles dans ta langue cible.",
  feature_reading: "Pratique de Lecture",
  feature_reading_desc:
    "Des lectures thematiques qui developpent ton vocabulaire et ta culture avec des exercices de comprehension.",
  feature_grammar: "Livre de Grammaire",
  feature_grammar_desc:
    "References rapides, exercices de notions et revisions adaptatives pour renforcer tes bases.",
  feature_skilltree: "Leçons",
  feature_skilltree_desc:
    "Des parcours structures qui construisent tes competences etape par etape avec une visualisation claire des progres.",
  feature_flashcards: "Vocabulaire",
  feature_flashcards_desc:
    "Pratique de nouveaux mots selon ton niveau et des situations courantes.",
  feature_goals: "Objectifs Quotidiens",
  feature_goals_desc:
    "Des cibles personnalisees qui suivent tes progres et celebrent tes series.",
  feature_notes: "Generer des Notes",
  feature_notes_desc:
    "Cree des notes d'etude completes depuis tes lecons pour les revoir plus tard.",
  feature_immersion: "Immersion",
  feature_immersion_desc:
    "Complete des taches hors de l'app pour t'immerger et pratiquer la langue.",
  feature_score: "Score",
  feature_score_desc:
    "Un modèle d'évaluation adaptatif qui évalue votre maîtrise réelle à chaque réponse et ajuste la difficulté en continu.",
  feature_elo: "Score",
  feature_elo_desc:
    "Un modèle d'évaluation adaptatif qui évalue votre maîtrise réelle à chaque réponse et ajuste la difficulté en continu.",
  feature_achievements: "Succès Multiplateforme",
  feature_achievements_desc:
    "Débloquez des récompenses et des badges de complétion vérifiés synchronisés en toute fluidité entre vos appareils.",
  feature_teams: "Équipes d'Apprentissage",
  feature_teams_desc:
    "Créez des groupes d'étude avec vos amis pour partager vos objectifs quotidiens, séries, évolution du compagnon et progrès en temps réel.",
  feature_global_feed: "Fil d'Actualité Mondial",
  feature_global_feed_desc:
    "Découvrez des notes, actualités d'apprentissage et astuces partagées par des apprenants du monde entier sur le réseau décentralisé.",
  feature_assistant: "Assistant Personnel",
  feature_assistant_desc:
    "Obtiens une aide et des recommandations personnalisees quand tu en as besoin.",
  feature_flashcards_spaced: "Flashcards Espacees",
  feature_flashcards_spaced_desc:
    "Maitrise plus de 1 000 mots et phrases avec des flashcards a repetition espacee par niveau CEFR.",
  feature_game_review: "RPG de Revision",
  feature_game_review_desc:
    "Explore des mondes a quetes, parle a des PNJ et collecte des objets dans ta langue cible pour reviser le vocabulaire.",
  feature_proficiency_test: "Test de Niveau",
  feature_proficiency_test_desc:
    "Passe une conversation vocale de 10 echanges avec une intelligence qui s'adapte en temps reel pour te placer au bon niveau CEFR.",
  feature_phonics: "Phonetique",
  feature_phonics_desc:
    "Pratique les sons et les mots avec le mode Alphabet pour maitriser la prononciation depuis les bases.",
  value_label: "Pourquoi nous",
  value_title: "Un apprentissage qui",
  value_title_accent: "Fonctionne Vraiment",
  value_1:
    "Une intelligence qui s'adapte en temps reel - conversations, exercices et retours ajustes a ton niveau exact",
  value_2:
    "Six modes de pratique pour tous les styles : parler, lire, ecrire, ecouter, grammaire et vocabulaire",
  value_3:
    "Progression CEFR structuree de A1 debutant a C2 maitrise avec 324 lecons et jalons clairs",
  value_4:
    "Coaching de prononciation en temps reel qui ecoute, corrige et renforce ta confiance a l'oral",
  scholarship_label: "REDONNER",
  scholarship_title: "Creer des Bourses",
  scholarship_title_accent: "en Apprenant",
  scholarship_desc:
    "La mission de Robots Building Education est de creer une technologie educative transformative.",
  scholarship_note:
    "Nous permettons aux utilisateurs de choisir de creer un petit portefeuille qui envoie du Bitcoin a des beneficiaires chaque fois qu'ils progressent dans l'app.",
  faq_label: "QUESTIONS",
  faq_title: "Questions Frequentes",
  faq_q1: "Que se passe-t-il quand je cree un compte ?",
  faq_a1:
    "Nous generons une cle securisee qui debloque ton espace d'etude personnel. Garde-la bien : c'est le seul moyen de te connecter depuis un autre appareil.",
  faq_q2: "Dois-je connaitre les blockchains ou Nostr ?",
  faq_a2:
    "Non. Nous gerons les details techniques pour toi. Tu as seulement besoin de ta cle pour revenir a tes lecons.",
  faq_q3: "Quelles langues puis-je pratiquer ?",
  faq_a3:
    "Tu peux pratiquer toutes les langues presentees ci-dessus. Nous continuerons a en ajouter au fil du temps.",
  faq_q4: "Est-ce payant ?",
  faq_a4:
    "Les outils principaux sont gratuits. Certains laboratoires avances peuvent demander une bourse ou un acces payant.",
  cta_final_title: "C'est parti",
  cta_final_accent: "",
  cta_final_subtitle:
    "Cree ton profil securise en quelques secondes, sauvegarde ta cle et debloque un monde d'apprentissage linguistique.",
  placeholder_name: "Ton nom d'affichage",
  footer_tagline: "Rendre l'apprentissage des langues accessible a tous.",
  signin_title: "Bon retour",
  signin_subtitle:
    "Colle la cle secrete que tu as sauvegardee lors de la creation du compte.",
  signin_placeholder: "Saisis ta clé secrète",
  signin_button: "Connexion",
  signin_extension: "Se connecter avec l’extension NIP-07",
  signin_or: "ou",
  signin_error_invalid_key: "Cle secrete invalide. Verifie-la et reessaie.",
  signin_error_extension: "La connexion avec l'extension a echoue. Reessaie.",
  signin_error_generic: "Connexion impossible. Reessaie.",
  back_button: "Retour",
  language_nl: "Néerlandais",
  language_en: "Anglais",
  language_fr: "Français",
  language_de: "Allemand",
  language_it: "Italien",
  language_hi: "Hindi",
  language_ar: "Arabe egyptien",
  language_zh: "Chinois mandarin",
  language_pt: "Portugais",
  language_es: "Espagnol",
  language_nah: "Nahuatl huastèque oriental",
  language_yua: "Maya yucatèque",
  language_el: "Grec",
  language_ja: "Japonais",
  language_ru: "Russe",
  language_pl: "Polonais",
  language_ga: "Irlandais",
};

landingPageTranslations.ja = {
  ...landingPageTranslations.en,
  nav_signin: "サインイン",
  hero_title: "あなた専用の",
  hero_title_accent: "言語チューター",
  hero_subtitle:
    "体系的な学習パスに沿って進み、間違いを覚えて翌日の練習に活かす、あなた専属の言語チューターです。",
  cta_start: "学習を始める",
  cta_signin: "シークレットキーでサインイン",
  create_secret_key_detected_prefix: "シークレットキーが検出されました。",
  create_secret_key_detected_action: "キーでサインイン",
  create_secret_key_detected_suffix: "を使用してください。",
  languages_label: "言語",
  languages_title: "練習できる",
  languages_title_accent: "12言語",
  languages_stable: "安定版",
  languages_beta: "ベータ",
  languages_alpha: "アルファ",
  features_label: "機能",
  features_title: "流暢さに必要な",
  features_title_accent: "すべて",
  feature_tutor: "チューター",
  feature_tutor_desc:
    "あなたのレベルに適応し、学習を支える完全なエンドツーエンドのリアルタイムチューターです。",
  feature_memory: "記憶システム",
  feature_memory_desc: "間違いや目標、進捗を記憶し、必要な復習に変えます。",
  feature_journey: "歩み",
  feature_journey_desc: "マイルストーンごとに音声メモを保存し、自分の声の成長と進捗を聞き比べることができます。",
  feature_daily_quests: "今日のフォーカス",
  feature_daily_quests_desc:
    "練習・復習・報酬を組み合わせた毎日のプランを届けます。",
  feature_companion: "学習コンパニオン",
  feature_companion_desc: "学ぶほど強く育つコンパニオンと一緒に進みます。",
  feature_conversations: "カスタマイズ会話",
  feature_conversations_desc:
    "場面、役割、難易度、目標を選び、練習したい内容に合ったスピーキングセッションを作れます。",
  feature_stories: "インタラクティブストーリー",
  feature_stories_desc:
    "音読、要約、ロールプレイを通じて練習できる魅力的な物語です。",
  feature_reading: "読解練習",
  feature_reading_desc:
    "テーマ別の読解で語彙と文化知識を広げ、理解問題で確認します。",
  feature_grammar: "文法ブック",
  feature_grammar_desc:
    "短いルール解説、概念ドリル、適応型復習で基礎を強化します。",
  feature_skilltree: "レッスン",
  feature_skilltree_desc:
    "段階的な学習パスと進捗の見える化で、着実に力を伸ばします。",
  feature_flashcards: "語彙",
  feature_flashcards_desc:
    "レベルやよくある場面に合わせて新しい単語を練習します。",
  feature_goals: "日次目標",
  feature_goals_desc: "毎日のXP目標と進捗トラッキングで学習習慣を育てます。",
  feature_notes: "ノート生成",
  feature_notes_desc:
    "レッスン内容から、あとで見返せる学習ノートを自動で作成します。",
  feature_immersion: "イマージョン",
  feature_immersion_desc:
    "アプリの外でも課題に取り組み、言語に浸りながら実践練習します。",
  feature_score: "スコア",
  feature_score_desc:
    "回答ごとに真の実力を測定し、問題の難易度をリアルタイムに最適化する適応型レート評価モデル。",
  feature_elo: "スコア",
  feature_elo_desc:
    "回答ごとに真の実力を測定し、問題の難易度をリアルタイムに最適化する適応型レート評価モデル。",
  feature_achievements: "クロスプラットフォーム実績",
  feature_achievements_desc:
    "複数のデバイスやプラットフォーム間でシームレスに同期される、検証済みの修了バッジと実績を獲得。",
  feature_teams: "学習チーム",
  feature_teams_desc:
    "仲間とスタディグループを結成し、毎日の目標やストリーク、コンパニオンの成長、進捗をリアルタイムに共有できます。",
  feature_global_feed: "グローバルフィード",
  feature_global_feed_desc:
    "分散型ネットワーク上で世界中の学習者が共有する学習ノートや成果、ヒントを発見できます。",
  feature_assistant: "パーソナルアシスタント",
  feature_assistant_desc:
    "困ったときに、あなたに合った案内やおすすめを受け取れます。",
  feature_flashcards_spaced: "フラッシュカード演習",
  feature_flashcards_spaced_desc:
    "CEFRレベル別に整理された間隔反復フラッシュカードで、1,000以上の単語や表現を身につけます。",
  feature_game_review: "RPG復習",
  feature_game_review_desc:
    "クエスト型の世界を探索し、NPCと話し、アイテムを集めながら、学習中の言語でレッスン語彙を復習します。",
  feature_proficiency_test: "レベル判定テスト",
  feature_proficiency_test_desc:
    "知能との10往復の音声会話で、リアルタイムに適応しながらあなたのCEFRレベルを正確に判定します。",
  feature_phonics: "フォニックス",
  feature_phonics_desc:
    "アルファベット・ブートキャンプで単語と音を練習し、発音を基礎から身につけます。",
  value_label: "選ばれる理由",
  value_title: "練習を",
  value_title_accent: "実際の成長へ",
  value_1:
    "リアルタイムに適応する知能。会話、練習、フィードバックがあなたの今のレベルに合わせて変化します。",
  value_2:
    "話す、読む、書く、聞く、文法、語彙の6つの練習モードで、学び方に合わせて学べます。",
  value_3:
    "A1の初級からC2の習熟まで、324レッスンと明確なマイルストーンで進むCEFR学習パスです。",
  value_4: "聞き取り、修正し、話す自信を育てるリアルタイム発音コーチングです。",
  value_adaptive: "適応型",
  value_adaptive_desc: "練習はあなたのレベル、回答、目標に合わせて変化します。",
  value_voice: "音声対応",
  value_voice_desc: "話して、聞いて、すぐにフィードバックを受け取れます。",
  value_private: "自分のキー",
  value_private_desc: "自分のアカウントキーでプロフィールと進捗に戻れます。",
  scholarship_label: "ミッション",
  scholarship_title: "学びで",
  scholarship_title_accent: "奨学金をつくる",
  scholarship_desc:
    "Robots Building Educationのミッションは、人生を変える教育テクノロジーをつくることです。",
  scholarship_note:
    "ユーザーは小さなウォレットの作成を選択でき、アプリで進歩するたびに受取人へBitcoinを送れるようになります。",
  scholarship_cta: "詳しく見る",
  faq_label: "FAQ",
  faq_title: "よくある質問",
  faq_q1: "何を練習できますか？",
  faq_a1: "会話、語彙、文法、読解、ストーリー、発音などを練習できます。",
  faq_q2: "キーについて知る必要がありますか？",
  faq_a2:
    "いいえ。技術的な部分はこちらで処理します。レッスンに戻るには保存したキーだけが必要です。",
  faq_q3: "どの言語を練習できますか？",
  faq_a3:
    "上に表示されている言語を練習できます。今後も対応言語を追加していきます。",
  faq_q4: "料金はかかりますか？",
  faq_a4:
    "主要ツールは無料です。一部の高度なラボは奨学金または有料アクセスが必要な場合があります。",
  cta_final_title: "はじめましょう",
  cta_final_accent: "",
  cta_final_subtitle:
    "数秒で安全なプロフィールを作り、キーを保存して、言語学習の世界を開きましょう。",
  placeholder_name: "表示名",
  footer_brand: "Piyali",
  footer_tagline: "誰でも言語学習にアクセスできるように。",
  signin_title: "おかえりなさい",
  signin_subtitle:
    "アカウント作成時に保存したシークレットキーを貼り付けてください。",
  signin_placeholder: "秘密鍵を入力してください",
  signin_button: "サインイン",
  signin_extension: "NIP-07拡張機能でサインイン",
  signin_or: "または",
  signin_error_invalid_key:
    "シークレットキーが無効です。確認してもう一度お試しください。",
  signin_error_extension:
    "拡張機能でのサインインに失敗しました。もう一度お試しください。",
  signin_error_generic: "サインインに失敗しました。もう一度お試しください。",
  back_button: "戻る",
  language_nl: "オランダ語",
  language_en: "英語",
  language_fr: "フランス語",
  language_de: "ドイツ語",
  language_it: "イタリア語",
  language_hi: "ヒンディー語",
  language_ar: "エジプトアラビア語",
  language_zh: "中国語（普通話）",
  language_pt: "ポルトガル語",
  language_es: "スペイン語",
  language_nah: "東ワステカ・ナワトル語",
  language_yua: "ユカテコ・マヤ語",
  language_el: "ギリシャ語",
  language_ja: "日本語",
  language_ru: "ロシア語",
  language_pl: "ポーランド語",
  language_ga: "アイルランド語",
};
