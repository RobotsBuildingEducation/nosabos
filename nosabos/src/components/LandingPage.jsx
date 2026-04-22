import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  motion,
  AnimatePresence,
} from "framer-motion";
import {
  FaComments,
  FaBookOpen,
  FaBook,
  FaFlask,
  FaPencilAlt,
  FaLayerGroup,
  FaStickyNote,
  FaUsers,
  FaCompass,
  FaRobot,
  FaMap,
  FaBullseye,
  FaVolumeUp,
  FaGamepad,
  FaMicrophone,
  FaMoon,
  FaSun,
} from "react-icons/fa";

import {
  Menu,
  MenuButton,
  MenuList,
  MenuOptionGroup,
  MenuItemOption,
  HStack,
  Text as ChakraText,
  Button as ChakraButton,
  IconButton,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import VoiceOrb from "./VoiceOrb";
import AnimatedBackground from "./AnimatedBackground";
import { MdSupportAgent } from "react-icons/md";
import { detectUserLanguage } from "../utils/languageDetection";
import { useDecentralizedIdentity } from "../hooks/useDecentralizedIdentity";
import useSoundSettings from "../hooks/useSoundSettings";
import { useThemeStore } from "../useThemeStore";
import {
  getPracticeLanguageOptions,
  getSupportLanguageOptions,
} from "../constants/languages";
import { LANDING_PAGE_PT_STATIC } from "../translations/landingPagePtStatic";
import selectSound from "../assets/select.mp3";
import submitActionSound from "../assets/submitaction.mp3";

// Minimal hook stubs for standalone demo - replace with your actual implementations

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

const theme = {
  colors: {
    bg: {
      deep: "var(--app-page-bg)",
      elevated: "var(--app-glass-bg)",
      glass: "var(--app-glass-bg-soft)",
      glow: "rgba(20, 184, 166, 0.08)",
    },
    text: {
      primary: "var(--app-text-primary)",
      secondary: "var(--app-text-secondary)",
      accent: "#2dd4bf",
      muted: "var(--app-text-muted)",
    },
    accent: {
      primary: "#14b8a6",
      secondary: "#0ea5e9",
      tertiary: "#a78bfa",
      warm: "#f97316",
    },
    border: {
      subtle: "var(--app-border)",
      accent: "rgba(20, 184, 166, 0.3)",
    },
  },
  fonts: {
    display: "'Playfair Display', Georgia, serif",
    body: "'DM Sans', -apple-system, sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  spacing: {
    section: "clamp(80px, 12vw, 160px)",
    container: "clamp(20px, 5vw, 80px)",
  },
};

const HERO_VOICE_ORB_STATES = ["idle", "listening", "speaking"];

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSLATIONS
// ═══════════════════════════════════════════════════════════════════════════════

const translations = {
  en: {
    nav_signin: "Sign In",
    hero_title: "Your Personal",
    hero_title_accent: "Language Tutor",
    hero_subtitle: "Use intelligent tools to practice and learn new languages.",
    cta_start: "Start Learning",
    cta_signin: "I Already Have A Key",
    languages_label: "LANGUAGES",
    languages_title: "Practice in",
    languages_title_accent: "14 Languages",
    languages_stable: "Stable",
    languages_beta: "Beta",
    languages_alpha: "Alpha",
    features_label: "CAPABILITIES",
    features_title: "Everything You Need to",
    features_title_accent: "Become Fluent",
    feature_conversations: "Real-Time Conversations",
    feature_conversations_desc:
      "Immersive dialogues that adapt to your level, coaching you through speaking and listening in real-time.",
    feature_stories: "Interactive Stories",
    feature_stories_desc:
      "Engaging narratives that invite you to read aloud, summarize, and role-play in your target language.",
    feature_reading: "Reading Practice",
    feature_reading_desc:
      "Subject-focused lectures expanding your vocabulary and cultural knowledge through comprehension exercises.",
    feature_grammar: "Grammar Book",
    feature_grammar_desc:
      "Quick rule references, concept drills, and adaptive review sets that strengthen your foundation.",
    feature_skilltree: "Skill Tree",
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
    feature_immersion: "Immersion Practice",
    feature_immersion_desc:
      "Complete tasks outside of the app to immerse and practice the language.",
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
      "Have a 10-exchange voice conversation with AI that adapts in real time to place you at your exact CEFR level.",
    feature_phonics: "Phonics",
    feature_phonics_desc:
      "Practice words and sounds with our Alphabet bootcamp mode to master pronunciation from the ground up.",

    value_label: "WHY NO SABOS",
    value_title: "Learning That",
    value_title_accent: "Actually Works",
    value_1:
      "AI that adapts in real-time—conversations, exercises, and feedback adjust to your exact level",
    value_2:
      "Six practice modes for every learning style: speaking, reading, writing, listening, grammar, and vocabulary",
    value_3:
      "Structured CEFR progression from A1 beginner to C2 mastery with 324 lessons and clear milestones",
    value_4:
      "Real-time pronunciation coaching that listens, corrects, and builds your confidence to speak",
    scholarship_label: "GIVE BACK",
    scholarship_title: "Create Scholarships",
    scholarship_title_accent: "with Bitcoin",
    scholarship_desc:
      "Top up your in-app Bitcoin wallet to help create scholarships through learning with",
    scholarship_link: "RobotsBuildingEducation.com",
    scholarship_note:
      "Choose a community identity in the app so every satoshi you spend supports real people.",
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
      "Start with Spanish, English, Portuguese, French, or Italian right away, then explore Nahuatl-inspired cultural modules.",
    faq_q4: "Is there a cost?",
    faq_a4:
      "The core practice tools are free. Some advanced labs may require scholarships or paid access.",
    cta_final_title: "Ready to Begin Your",
    cta_final_accent: "Language Journey?",
    cta_final_subtitle:
      "Create your secure profile in seconds, save your key, and unlock a world of language learning.",
    placeholder_name: "Your display name",
    footer_brand: "No Sabos",
    footer_tagline: "Making language learning accessible to everyone.",
    signin_title: "Welcome Back",
    signin_subtitle:
      "Paste the secret key you saved when you created your account.",
    signin_placeholder: "Paste your secret key",
    signin_button: "Sign In",
    signin_extension: "Sign in with Extension",
    signin_or: "or",
    back_button: "Back",
    language_nl: "Dutch",
    language_en: "English",
    language_fr: "French",
    language_de: "German",
    language_it: "Italian",
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
      "Usa herramientas inteligentes para practicar y aprender nuevos idiomas.",
    cta_start: "Comienza",
    cta_signin: "Tengo una Llave",
    languages_label: "IDIOMAS",
    languages_title: "Practica en",
    languages_title_accent: "14 Idiomas",
    languages_stable: "Estable",
    languages_beta: "Beta",
    languages_alpha: "Alfa",
    features_label: "CAPACIDADES",
    features_title: "Todo lo que Necesitas para",
    features_title_accent: "Ser Fluido",
    feature_conversations: "Conversaciones en Tiempo Real",
    feature_conversations_desc:
      "Diálogos inmersivos que se adaptan a tu nivel, guiándote en habla y escucha en tiempo real.",
    feature_stories: "Historias Interactivas",
    feature_stories_desc:
      "Narrativas envolventes que te invitan a leer en voz alta, resumir y actuar en tu idioma objetivo.",
    feature_reading: "Práctica de Lectura",
    feature_reading_desc:
      "Lecturas enfocadas que amplían tu vocabulario y conocimiento cultural.",
    feature_grammar: "Laboratorios de Gramática",
    feature_grammar_desc:
      "Referencias rápidas, ejercicios conceptuales y sets de repaso adaptativos.",
    feature_skilltree: "Árbol de Habilidades",
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
    feature_immersion: "Práctica de Inmersión",
    feature_immersion_desc:
      "Completa tareas fuera de la app para sumergirte y practicar el idioma.",
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
      "Mantén una conversación de voz de 10 intercambios con IA que se adapta en tiempo real para ubicarte en tu nivel CEFR exacto.",
    feature_phonics: "Fonética",
    feature_phonics_desc:
      "Practica palabras y sonidos con nuestro modo de Alfabeto para dominar la pronunciación desde cero.",
    value_label: "POR QUÉ NO SABOS",
    value_title: "Aprendizaje que",
    value_title_accent: "Realmente Funciona",
    value_1:
      "IA que se adapta en tiempo real—conversaciones, ejercicios y retroalimentación ajustados a tu nivel exacto",
    value_2:
      "Seis modos de práctica para cada estilo de aprendizaje: hablar, leer, escribir, escuchar, gramática y vocabulario",
    value_3:
      "Progresión CEFR estructurada de A1 principiante a C2 maestría con 324 lecciones y hitos claros",
    value_4:
      "Entrenamiento de pronunciación en tiempo real que escucha, corrige y construye tu confianza para hablar",
    scholarship_label: "CONTRIBUYE",
    scholarship_title: "Crea Becas",
    scholarship_title_accent: "con Bitcoin",
    scholarship_desc:
      "Recarga tu billetera de Bitcoin en la app para ayudar a crear becas a través del aprendizaje con",
    scholarship_link: "RobotsBuildingEducation.com",
    scholarship_note:
      "Elige una identidad comunitaria para que cada satoshi que gastes apoye a personas reales.",
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
      "Comienza con español, inglés, portugués, francés o italiano, luego explora módulos culturales inspirados en náhuatl.",
    faq_q4: "¿Tiene costo?",
    faq_a4:
      "Las herramientas principales son gratuitas. Algunos laboratorios avanzados pueden requerir becas o acceso de pago.",
    cta_final_title: "¿Listo para Comenzar tu",
    cta_final_accent: "Viaje Lingüístico?",
    cta_final_subtitle:
      "Crea tu perfil seguro en segundos, guarda tu llave y desbloquea un mundo de aprendizaje.",
    placeholder_name: "Tu nombre para mostrar",
    footer_brand: "No Sabos",
    footer_tagline: "Haciendo el aprendizaje de idiomas accesible para todos.",
    signin_title: "Bienvenido de Nuevo",
    signin_subtitle:
      "Pega la llave secreta que guardaste cuando creaste tu cuenta.",
    signin_placeholder: "Pega tu llave secreta",
    signin_button: "Iniciar Sesión",
    signin_extension: "Iniciar con Extensión",
    signin_or: "o",
    back_button: "Regresar",
    language_nl: "Holandés",
    language_en: "Inglés",
    language_fr: "Francés",
    language_de: "Alemán",
    language_it: "Italiano",
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
      "Usa strumenti intelligenti per praticare e imparare nuove lingue.",
    cta_start: "Inizia",
    cta_signin: "Ho già una Chiave",
    languages_label: "LINGUE",
    languages_title: "Pratica in",
    languages_title_accent: "14 Lingue",
    languages_stable: "Stabile",
    languages_beta: "Beta",
    languages_alpha: "Alfa",
    features_label: "FUNZIONALITÀ",
    features_title: "Tutto ciò che ti serve per",
    features_title_accent: "Diventare Fluente",
    feature_conversations: "Conversazioni in Tempo Reale",
    feature_conversations_desc:
      "Dialoghi immersivi che si adattano al tuo livello, guidandoti nel parlato e nell'ascolto in tempo reale.",
    feature_stories: "Storie Interattive",
    feature_stories_desc:
      "Narrazioni coinvolgenti che ti invitano a leggere ad alta voce, riassumere e fare role-play nella tua lingua target.",
    feature_reading: "Pratica di Lettura",
    feature_reading_desc:
      "Lezioni tematiche che ampliano il vocabolario e le conoscenze culturali con esercizi di comprensione.",
    feature_grammar: "Libro di Grammatica",
    feature_grammar_desc:
      "Riferimenti rapidi alle regole, esercizi concettuali e set di revisione adattivi per rafforzare le basi.",
    feature_skilltree: "Albero delle Abilità",
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
    feature_immersion: "Pratica di Immersione",
    feature_immersion_desc:
      "Completa attività fuori dall'app per immergerti e praticare la lingua.",
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
      "Sostieni una conversazione vocale di 10 scambi con un'IA che si adatta in tempo reale per collocarti al tuo livello CEFR esatto.",
    feature_phonics: "Fonetica",
    feature_phonics_desc:
      "Pratica parole e suoni con la modalità Alfabeto per padroneggiare la pronuncia dalle basi.",
    value_label: "PERCHÉ NO SABOS",
    value_title: "Apprendimento che",
    value_title_accent: "Funziona Davvero",
    value_1:
      "IA che si adatta in tempo reale — conversazioni, esercizi e feedback adeguati al tuo livello esatto",
    value_2:
      "Sei modalità di pratica per ogni stile: parlato, lettura, scrittura, ascolto, grammatica e vocabolario",
    value_3:
      "Progressione CEFR strutturata da A1 principiante a C2 maestria con 324 lezioni e traguardi chiari",
    value_4:
      "Coaching della pronuncia in tempo reale che ascolta, corregge e costruisce la tua fiducia nel parlare",
    scholarship_label: "DAI QUALCOSA IN CAMBIO",
    scholarship_title: "Crea Borse di Studio",
    scholarship_title_accent: "con Bitcoin",
    scholarship_desc:
      "Ricarica il tuo portafoglio Bitcoin nell'app per aiutare a creare borse di studio attraverso l'apprendimento con",
    scholarship_link: "RobotsBuildingEducation.com",
    scholarship_note:
      "Scegli un'identità comunitaria nell'app in modo che ogni satoshi che spendi supporti persone reali.",
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
      "Inizia subito con spagnolo, inglese, portoghese, francese o italiano, poi esplora i moduli culturali ispirati al nahuatl.",
    faq_q4: "Ha un costo?",
    faq_a4:
      "Gli strumenti principali sono gratuiti. Alcuni laboratori avanzati potrebbero richiedere borse di studio o accesso a pagamento.",
    cta_final_title: "Pronto a Iniziare il tuo",
    cta_final_accent: "Viaggio Linguistico?",
    cta_final_subtitle:
      "Crea il tuo profilo sicuro in pochi secondi, salva la chiave e sblocca un mondo di apprendimento linguistico.",
    placeholder_name: "Il tuo nome visualizzato",
    footer_brand: "No Sabos",
    footer_tagline: "Rendere l'apprendimento delle lingue accessibile a tutti.",
    signin_title: "Bentornato",
    signin_subtitle:
      "Incolla la chiave segreta che hai salvato quando hai creato il tuo account.",
    signin_placeholder: "Incolla la tua chiave segreta",
    signin_button: "Accedi",
    signin_extension: "Accedi con Estensione",
    signin_or: "o",
    back_button: "Indietro",
    language_nl: "Olandese",
    language_en: "Inglese",
    language_fr: "Francese",
    language_de: "Tedesco",
    language_it: "Italiano",
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

translations.pt = LANDING_PAGE_PT_STATIC;

translations.fr = {
  ...translations.en,
  nav_signin: "Connexion",
  hero_title: "Ton Tuteur",
  hero_title_accent: "Linguistique Personnel",
  hero_subtitle:
    "Utilise des outils intelligents pour pratiquer et apprendre de nouvelles langues.",
  cta_start: "Commencer",
  cta_signin: "J'ai deja une cle",
  languages_label: "LANGUES",
  languages_title: "Pratique en",
  languages_title_accent: "14 Langues",
  languages_stable: "Stable",
  languages_beta: "Beta",
  languages_alpha: "Alpha",
  features_label: "FONCTIONNALITES",
  features_title: "Tout ce qu'il faut pour",
  features_title_accent: "Devenir Fluide",
  feature_conversations: "Conversations en Temps Reel",
  feature_conversations_desc:
    "Des dialogues immersifs qui s'adaptent a ton niveau et t'accompagnent en expression orale et comprehension en temps reel.",
  feature_stories: "Histoires Interactives",
  feature_stories_desc:
    "Des recits engageants qui t'invitent a lire a voix haute, resumer et jouer des roles dans ta langue cible.",
  feature_reading: "Pratique de Lecture",
  feature_reading_desc:
    "Des lectures thematiques qui developpent ton vocabulaire et ta culture avec des exercices de comprehension.",
  feature_grammar: "Livre de Grammaire",
  feature_grammar_desc:
    "References rapides, exercices de notions et revisions adaptatives pour renforcer tes bases.",
  feature_skilltree: "Arbre de Competences",
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
  feature_immersion: "Pratique d'Immersion",
  feature_immersion_desc:
    "Complete des taches hors de l'app pour t'immerger et pratiquer la langue.",
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
    "Passe une conversation vocale de 10 echanges avec une IA qui s'adapte en temps reel pour te placer au bon niveau CEFR.",
  feature_phonics: "Phonetique",
  feature_phonics_desc:
    "Pratique les sons et les mots avec le mode Alphabet pour maitriser la prononciation depuis les bases.",
  value_label: "POURQUOI NO SABOS",
  value_title: "Un apprentissage qui",
  value_title_accent: "Fonctionne Vraiment",
  value_1:
    "Une IA qui s'adapte en temps reel - conversations, exercices et retours ajustes a ton niveau exact",
  value_2:
    "Six modes de pratique pour tous les styles : parler, lire, ecrire, ecouter, grammaire et vocabulaire",
  value_3:
    "Progression CEFR structuree de A1 debutant a C2 maitrise avec 324 lecons et jalons clairs",
  value_4:
    "Coaching de prononciation en temps reel qui ecoute, corrige et renforce ta confiance a l'oral",
  scholarship_label: "REDONNER",
  scholarship_title: "Creer des Bourses",
  scholarship_title_accent: "avec Bitcoin",
  scholarship_desc:
    "Recharge ton portefeuille Bitcoin dans l'app pour aider a creer des bourses grace a l'apprentissage avec",
  scholarship_note:
    "Choisis une identite communautaire dans l'app afin que chaque satoshi depense soutienne de vraies personnes.",
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
    "Commence avec l'espagnol, l'anglais, le portugais, le francais ou l'italien, puis explore les modules culturels inspires du nahuatl.",
  faq_q4: "Est-ce payant ?",
  faq_a4:
    "Les outils principaux sont gratuits. Certains laboratoires avances peuvent demander une bourse ou un acces payant.",
  cta_final_title: "Pret a commencer ton",
  cta_final_accent: "Voyage Linguistique ?",
  cta_final_subtitle:
    "Cree ton profil securise en quelques secondes, sauvegarde ta cle et debloque un monde d'apprentissage linguistique.",
  placeholder_name: "Ton nom d'affichage",
  footer_tagline: "Rendre l'apprentissage des langues accessible a tous.",
  signin_title: "Bon retour",
  signin_subtitle:
    "Colle la cle secrete que tu as sauvegardee lors de la creation du compte.",
  signin_placeholder: "Colle ta cle secrete",
  signin_button: "Connexion",
  signin_extension: "Connexion avec extension",
  signin_or: "ou",
  back_button: "Retour",
  language_nl: "Néerlandais",
  language_en: "Anglais",
  language_fr: "Français",
  language_de: "Allemand",
  language_it: "Italien",
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

translations.ja = {
  ...translations.en,
  nav_signin: "サインイン",
  hero_title: "あなた専用の",
  hero_title_accent: "言語チューター",
  hero_subtitle: "インテリジェントなツールで新しい言語を練習し、学びましょう。",
  cta_start: "学習を始める",
  cta_signin: "キーを持っています",
  languages_label: "言語",
  languages_title: "練習できる",
  languages_title_accent: "14言語",
  languages_stable: "安定版",
  languages_beta: "ベータ",
  languages_alpha: "アルファ",
  features_label: "機能",
  features_title: "流暢さに必要な",
  features_title_accent: "すべて",
  feature_conversations: "リアルタイム会話",
  feature_conversations_desc:
    "あなたのレベルに合わせた没入型の対話で、話す・聞く練習をリアルタイムにサポートします。",
  feature_stories: "インタラクティブストーリー",
  feature_stories_desc:
    "音読、要約、ロールプレイを通じて練習できる魅力的な物語です。",
  feature_reading: "読解練習",
  feature_reading_desc:
    "テーマ別の読解で語彙と文化知識を広げ、理解問題で確認します。",
  feature_grammar: "文法ブック",
  feature_grammar_desc:
    "短いルール解説、概念ドリル、適応型復習で基礎を強化します。",
  feature_skilltree: "スキルツリー",
  feature_skilltree_desc:
    "段階的な学習パスと進捗の見える化で、着実に力を伸ばします。",
  feature_flashcards: "語彙",
  feature_flashcards_desc:
    "レベルやよくある場面に合わせて新しい単語を練習します。",
  feature_goals: "日次目標",
  feature_goals_desc:
    "毎日のXP目標と進捗トラッキングで学習習慣を育てます。",
  feature_notes: "ノート生成",
  feature_notes_desc:
    "レッスン内容から、あとで見返せる学習ノートを自動で作成します。",
  feature_immersion: "没入型練習",
  feature_immersion_desc:
    "アプリの外でも課題に取り組み、言語に浸りながら実践練習します。",
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
    "AIとの10往復の音声会話で、リアルタイムに適応しながらあなたのCEFRレベルを正確に判定します。",
  feature_phonics: "フォニックス",
  feature_phonics_desc:
    "アルファベット・ブートキャンプで単語と音を練習し、発音を基礎から身につけます。",
  value_label: "学習のしくみ",
  value_title: "練習を",
  value_title_accent: "実際の成長へ",
  value_1:
    "リアルタイムに適応するAI。会話、練習、フィードバックがあなたの今のレベルに合わせて変化します。",
  value_2:
    "話す、読む、書く、聞く、文法、語彙の6つの練習モードで、学び方に合わせて学べます。",
  value_3:
    "A1の初級からC2の習熟まで、324レッスンと明確なマイルストーンで進むCEFR学習パスです。",
  value_4:
    "聞き取り、修正し、話す自信を育てるリアルタイム発音コーチングです。",
  value_adaptive: "適応型",
  value_adaptive_desc: "練習はあなたのレベル、回答、目標に合わせて変化します。",
  value_voice: "音声対応",
  value_voice_desc: "話して、聞いて、すぐにフィードバックを受け取れます。",
  value_private: "自分のキー",
  value_private_desc: "自分のアカウントキーでプロフィールと進捗に戻れます。",
  scholarship_label: "ミッション",
  scholarship_title: "Bitcoinで",
  scholarship_title_accent: "奨学金をつくる",
  scholarship_desc:
    "アプリ内のBitcoinウォレットにチャージして、学びを通じた奨学金づくりを支援しましょう。",
  scholarship_link: "RobotsBuildingEducation.com",
  scholarship_note:
    "アプリでコミュニティアイデンティティを選ぶと、使うサトシが実際の人々の支援につながります。",
  scholarship_cta: "詳しく見る",
  faq_label: "FAQ",
  faq_title: "よくある質問",
  faq_q1: "何を練習できますか？",
  faq_a1:
    "会話、語彙、文法、読解、ストーリー、発音などを練習できます。",
  faq_q2: "キーについて知る必要がありますか？",
  faq_a2:
    "いいえ。技術的な部分はこちらで処理します。レッスンに戻るには保存したキーだけが必要です。",
  faq_q3: "どの言語を練習できますか？",
  faq_a3:
    "スペイン語、英語、ポルトガル語、フランス語、イタリア語から始め、ナワトル語などの文化的モジュールも探索できます。",
  faq_q4: "料金はかかりますか？",
  faq_a4:
    "主要ツールは無料です。一部の高度なラボは奨学金または有料アクセスが必要な場合があります。",
  cta_final_title: "言語学習の旅を",
  cta_final_accent: "始めませんか？",
  cta_final_subtitle:
    "数秒で安全なプロフィールを作り、キーを保存して、言語学習の世界を開きましょう。",
  placeholder_name: "表示名",
  footer_brand: "No Sabos",
  footer_tagline: "誰でも言語学習にアクセスできるように。",
  signin_title: "おかえりなさい",
  signin_subtitle: "アカウント作成時に保存したシークレットキーを貼り付けてください。",
  signin_placeholder: "シークレットキーを貼り付け",
  signin_button: "サインイン",
  signin_extension: "拡張機能でサインイン",
  signin_or: "または",
  back_button: "戻る",
  language_nl: "オランダ語",
  language_en: "英語",
  language_fr: "フランス語",
  language_de: "ドイツ語",
  language_it: "イタリア語",
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

// ═══════════════════════════════════════════════════════════════════════════════
// LANGUAGE MENU COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const LanguageMenu = ({ lang, setLang, playSound }) => {
  const options = getSupportLanguageOptions({
    ui: translations[lang] || translations.en,
    uiLang: lang,
  });
  const selected = options.find((o) => o.value === lang) || options[0];

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
      <Menu autoSelect={false} isLazy>
        <MenuButton
          as={ChakraButton}
          rightIcon={<ChevronDownIcon />}
          variant="outline"
          size="sm"
          borderColor="var(--app-border)"
          bg="var(--app-glass-bg)"
          color="var(--app-text-primary)"
          _hover={{ bg: "var(--app-glass-bg-soft)" }}
          _active={{ bg: "var(--app-glass-bg-soft)" }}
          backdropFilter="blur(20px)"
          rounded="xl"
          px={4}
          py={5}
          minW="150px"
          textAlign="left"
          onClick={() => playSound(selectSound)}
        >
          <HStack spacing={2}>
            {selected?.flag}
            <ChakraText as="span" fontSize="sm" fontWeight="semibold">
              {selected?.label}
            </ChakraText>
          </HStack>
        </MenuButton>
        <MenuList
          borderColor="var(--app-border)"
          bg="var(--app-surface)"
          shadow="xl"
          minW="160px"
        >
          <MenuOptionGroup
            type="radio"
            value={lang}
            onChange={(value) => {
              playSound(selectSound);
              setLang(value);
            }}
          >
            {options.map((opt) => (
              <MenuItemOption
                key={opt.value}
                value={opt.value}
                bg="transparent"
                _hover={{ bg: "var(--app-surface-elevated)" }}
                _checked={{ fontWeight: "semibold" }}
                py={3}
              >
                <HStack spacing={2}>
                  {opt.flag}
                  <ChakraText as="span" fontSize="sm">
                    {opt.label}
                  </ChakraText>
                </HStack>
              </MenuItemOption>
            ))}
          </MenuOptionGroup>
        </MenuList>
      </Menu>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    html {
      scroll-behavior: smooth;
    }
    
    body {
      font-family: ${theme.fonts.body};
      background: ${theme.colors.bg.deep};
      color: ${theme.colors.text.primary};
      line-height: 1.6;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    ::selection {
      background: ${theme.colors.accent.primary};
      color: ${theme.colors.bg.deep};
    }
    
    input::placeholder {
      color: ${theme.colors.text.muted};
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(2deg); }
    }
    
    @keyframes pulse-glow {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.05); }
    }
    
    @keyframes gradient-shift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%) skewX(-15deg); }
      100% { transform: translateX(200%) skewX(-15deg); }
    }
    
    @keyframes orbit {
      0% { transform: rotate(0deg) translateX(150px) rotate(0deg); }
      100% { transform: rotate(360deg) translateX(150px) rotate(-360deg); }
    }
  `}</style>
);

// ═══════════════════════════════════════════════════════════════════════════════
// FLOATING LANGUAGE ELEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

const FloatingElements = () => {
  const words = [
    { text: "Hola", x: "15%", y: "20%", delay: 0 },
    { text: "Bonjour", x: "80%", y: "15%", delay: 1 },
    { text: "Ciao", x: "10%", y: "70%", delay: 2 },
    { text: "Olá", x: "85%", y: "60%", delay: 0.5 },
    { text: "Hello", x: "25%", y: "85%", delay: 1.5 },
    { text: "Pialli", x: "70%", y: "80%", delay: 2.5 },
    { text: "Hallo", x: "50%", y: "12%", delay: 1.8 },
    { text: "Привет", x: "35%", y: "10%", delay: 2.2 },
    { text: "こんにちは", x: "60%", y: "30%", delay: 1.2 },
    { text: "Guten Tag", x: "5%", y: "45%", delay: 2.8 },
    { text: "Cześć", x: "90%", y: "35%", delay: 0.8 },
    { text: "Dia dhuit", x: "40%", y: "65%", delay: 2.1 },
  ];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      {words.map((word, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: [0.1, 0.25, 0.1],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 6 + i,
            repeat: Infinity,
            delay: word.delay,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            left: word.x,
            top: word.y,
            fontFamily: theme.fonts.display,
            fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
            fontWeight: 500,
            color: theme.colors.accent.primary,
            opacity: 0.15,
            textShadow: `0 0 40px ${theme.colors.accent.primary}`,
          }}
        >
          {word.text}
        </motion.div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// LOGO COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const Logo = ({ size = 48 }) => (
  <motion.div
    style={{
      borderRadius: "16px",
      background: `linear-gradient(135deg, ${theme.colors.accent.primary} 0%, ${theme.colors.accent.secondary} 100%)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: `0 8px 32px rgba(20, 184, 166, 0.3)`,
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)",
        animation: "shimmer 3s infinite",
      }}
    />
    <span
      style={{
        fontSize: size * 0.22,
        fontFamily: theme.fonts.display,
        fontWeight: 700,
        color: "#030712",
        position: "relative",
        zIndex: 1,
        padding: 16,
      }}
    >
      No Sabos
    </span>
  </motion.div>
);

const ThemeModeToggle = ({ themeMode, onModeChange }) => {
  const isDark = themeMode === "dark";
  const isLightTheme = !isDark;
  const nextMode = isDark ? "light" : "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <IconButton
      type="button"
      aria-label={label}
      title={label}
      onClick={() => onModeChange(nextMode)}
      icon={isDark ? <FaMoon size={13} /> : <FaSun size={13} />}
      size="sm"
      minW="40px"
      h="40px"
      rounded="full"
      position="fixed"
      top="18px"
      right="20px"
      zIndex={120}
      bg={isLightTheme ? "transparent" : "var(--app-surface-elevated)"}
      color={isLightTheme ? "#33291f" : "var(--app-text-primary)"}
      border="1px solid"
      borderColor={
        isLightTheme ? "rgba(77, 58, 36, 0.34)" : "var(--app-border)"
      }
      boxShadow={isLightTheme ? "none" : "var(--app-shadow-soft)"}
      backdropFilter="blur(20px)"
      _hover={{
        bg: isLightTheme ? "rgba(77, 58, 36, 0.08)" : "var(--app-surface-muted)",
      }}
      _active={{
        bg: isLightTheme ? "rgba(77, 58, 36, 0.12)" : "var(--app-surface-muted)",
      }}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// BUTTON COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const Button = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  style = {},
  ...props
}) => {
  const variants = {
    primary: {
      background: `linear-gradient(135deg, ${theme.colors.accent.primary} 0%, #0d9488 100%)`,
      color: "#FFF",
      border: "none",
      boxShadow: `0 4px 24px rgba(20, 184, 166, 0.4)`,
    },
    secondary: {
      background: "transparent",
      color: theme.colors.text.primary,
      border: `1px solid ${theme.colors.border.accent}`,
      boxShadow: "none",
    },
    ghost: {
      background: "transparent",
      color: theme.colors.text.secondary,
      border: "none",
      boxShadow: "none",
    },
  };

  const sizes = {
    sm: { padding: "10px 20px", fontSize: "0.875rem" },
    md: { padding: "14px 32px", fontSize: "1rem" },
    lg: { padding: "18px 40px", fontSize: "1.125rem" },
  };

  const baseStyle = {
    ...variants[variant],
    ...sizes[size],
    fontFamily: theme.fonts.body,
    fontWeight: 600,
    borderRadius: "12px",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? "100%" : "auto",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.2s ease",
    position: "relative",
    overflow: "hidden",
    ...style,
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={disabled || loading ? undefined : onClick}
      style={baseStyle}
      {...props}
    >
      {loading ? (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{ display: "inline-block" }}
        >
          ⟳
        </motion.span>
      ) : (
        children
      )}
      {variant === "primary" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
            animation: "shimmer 2.5s infinite",
          }}
        />
      )}
    </motion.button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// INPUT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const Input = ({
  value,
  onChange,
  placeholder,
  type = "text",
  style = {},
  ...props
}) => (
  <motion.input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    whileFocus={{ scale: 1.01 }}
    style={{
      width: "100%",
      padding: "16px 20px",
      fontSize: "1rem",
      fontFamily: theme.fonts.body,
      background: theme.colors.bg.glass,
      border: `1px solid ${theme.colors.border.subtle}`,
      borderRadius: "12px",
      color: theme.colors.text.primary,
      outline: "none",
      transition: "all 0.2s ease",
      ...style,
    }}
    onFocus={(e) => {
      e.target.style.borderColor = theme.colors.accent.primary;
      e.target.style.boxShadow = `0 0 0 3px rgba(20, 184, 166, 0.1)`;
    }}
    onBlur={(e) => {
      e.target.style.borderColor = theme.colors.border.subtle;
      e.target.style.boxShadow = "none";
    }}
    {...props}
  />
);

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION LABEL
// ═══════════════════════════════════════════════════════════════════════════════

const SectionLabel = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "16px",
    }}
  >
    <span
      style={{
        width: "40px",
        height: "1px",
        background: `linear-gradient(90deg, transparent, ${theme.colors.accent.primary})`,
      }}
    />
    <span
      style={{
        fontFamily: theme.fonts.mono,
        fontSize: "0.75rem",
        fontWeight: 500,
        letterSpacing: "0.15em",
        color: theme.colors.accent.primary,
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
    <span
      style={{
        width: "40px",
        height: "1px",
        background: `linear-gradient(90deg, ${theme.colors.accent.primary}, transparent)`,
      }}
    />
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE CARD
// ═══════════════════════════════════════════════════════════════════════════════

const FeatureCard = ({ icon, title, description }) => (
  <div
    style={{
      padding: "clamp(16px, 3vw, 32px)",
      background: theme.colors.bg.elevated,
      borderRadius: "clamp(12px, 2vw, 24px)",
      border: `1px solid ${theme.colors.border.subtle}`,
      position: "relative",
      overflow: "hidden",
    }}
  >
    {/* Gradient accent */}
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        background: `linear-gradient(90deg, ${theme.colors.accent.primary}, ${theme.colors.accent.secondary})`,
        opacity: 0.8,
      }}
    />

    {/* Icon */}
    <div
      style={{
        width: "clamp(40px, 5vw, 56px)",
        height: "clamp(40px, 5vw, 56px)",
        borderRadius: "clamp(10px, 1.5vw, 16px)",
        background: theme.colors.bg.glow,
        border: `1px solid ${theme.colors.border.accent}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "clamp(10px, 2vw, 20px)",
        fontSize: "clamp(18px, 2vw, 24px)",
      }}
    >
      {icon}
    </div>

    <h3
      style={{
        fontFamily: theme.fonts.display,
        fontSize: "clamp(0.9rem, 1.5vw, 1.25rem)",
        fontWeight: 600,
        color: theme.colors.text.primary,
        marginBottom: "clamp(6px, 1vw, 12px)",
      }}
    >
      {title}
    </h3>

    <p
      style={{
        fontFamily: theme.fonts.body,
        fontSize: "clamp(0.8rem, 1.2vw, 0.95rem)",
        color: theme.colors.text.secondary,
        lineHeight: 1.7,
      }}
    >
      {description}
    </p>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ ITEM
// ═══════════════════════════════════════════════════════════════════════════════

const FAQItem = ({ question, answer, isOpen, onClick, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1 }}
    style={{
      borderBottom: `1px solid ${theme.colors.border.subtle}`,
      overflow: "hidden",
    }}
  >
    <motion.button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "24px 0",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        textAlign: "left",
      }}
    >
      <span
        style={{
          fontFamily: theme.fonts.display,
          fontSize: "1.125rem",
          fontWeight: 500,
          color: theme.colors.text.primary,
        }}
      >
        {question}
      </span>
      <motion.span
        animate={{ rotate: isOpen ? 45 : 0 }}
        style={{
          fontSize: "1.5rem",
          color: theme.colors.accent.primary,
          fontWeight: 300,
        }}
      >
        +
      </motion.span>
    </motion.button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p
            style={{
              paddingBottom: "24px",
              fontFamily: theme.fonts.body,
              fontSize: "1rem",
              color: theme.colors.text.secondary,
              lineHeight: 1.7,
            }}
          >
            {answer}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// SIGN IN VIEW
// ═══════════════════════════════════════════════════════════════════════════════

const SignInView = ({ copy, onBack, onSignIn, onExtension, hasExtension }) => {
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const playSound = useSoundSettings((s) => s.playSound);

  const handleSignIn = async () => {
    if (!secretKey.trim()) return;
    playSound(submitActionSound);
    setLoading(true);
    setError("");
    try {
      await onSignIn(secretKey);
    } catch (e) {
      setError(e.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        position: "relative",
        zIndex: 10,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: "440px",
          width: "100%",
          padding: "48px",
          background: theme.colors.bg.elevated,
          backdropFilter: "blur(40px)",
          borderRadius: "32px",
          border: `1px solid ${theme.colors.border.subtle}`,
        }}
      >
        <h1
          style={{
            fontFamily: theme.fonts.display,
            fontSize: "2rem",
            fontWeight: 600,
            textAlign: "center",
            marginBottom: "12px",
          }}
        >
          {copy.signin_title}
        </h1>

        <p
          style={{
            fontFamily: theme.fonts.body,
            fontSize: "1rem",
            color: theme.colors.text.secondary,
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          {copy.signin_subtitle}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder={copy.signin_placeholder}
            type="password"
          />

          {error && (
            <p
              style={{
                color: "#f87171",
                fontSize: "0.875rem",
                textAlign: "center",
              }}
            >
              {error}
            </p>
          )}

          <Button onClick={handleSignIn} loading={loading} fullWidth>
            {copy.signin_button} →
          </Button>

          {hasExtension && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  margin: "8px 0",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    background: theme.colors.border.subtle,
                  }}
                />
                <span
                  style={{
                    color: theme.colors.text.muted,
                    fontSize: "0.875rem",
                  }}
                >
                  {copy.signin_or}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    background: theme.colors.border.subtle,
                  }}
                />
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  playSound(selectSound);
                  onExtension();
                }}
                fullWidth
              >
                {copy.signin_extension}
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            onClick={() => {
              playSound(selectSound);
              onBack();
            }}
            fullWidth
            style={{ marginTop: "8px" }}
          >
            ← {copy.back_button}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN LANDING PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const LandingPage = ({ onAuthenticated }) => {
  const { generateNostrKeys, auth, authWithExtension, isNip07Available } =
    useDecentralizedIdentity();
  const playSound = useSoundSettings((s) => s.playSound);
  const themeMode = useThemeStore((s) => s.themeMode);
  const syncThemeMode = useThemeStore((s) => s.syncThemeMode);

  const [lang, setLang] = useState(() => {
    const detected = detectUserLanguage();
    // Save detected language to localStorage for App.jsx to use
    if (typeof window !== "undefined") {
      localStorage.setItem("appLanguage", detected);
    }
    return detected;
  });
  const [view, setView] = useState("landing");
  const [displayName, setDisplayName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(null);
  const [hasExtension, setHasExtension] = useState(false);
  const [heroVoiceOrbState] = useState(() => {
    const randomIndex = Math.floor(Math.random() * HERO_VOICE_ORB_STATES.length);
    return HERO_VOICE_ORB_STATES[randomIndex];
  });

  const copy = translations[lang] || translations.en;

  useEffect(() => {
    setHasExtension(isNip07Available());
    const timer = setTimeout(() => setHasExtension(isNip07Available()), 500);
    return () => clearTimeout(timer);
  }, [isNip07Available]);

  // Update localStorage when language changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("appLanguage", lang);
    }
  }, [lang]);

  const handleCreate = useCallback(async () => {
    if (displayName.trim().length < 2 || isCreating) return;
    playSound(submitActionSound);
    setIsCreating(true);
    try {
      await generateNostrKeys(displayName.trim());
      localStorage.setItem("displayName", displayName.trim());
      onAuthenticated?.();
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  }, [displayName, isCreating, generateNostrKeys, onAuthenticated, playSound]);

  const handleSignIn = useCallback(
    async (key) => {
      const result = await auth(key);
      if (!result) throw new Error("Invalid key");
      onAuthenticated?.();
    },
    [auth, onAuthenticated],
  );

  const handleExtension = useCallback(async () => {
    const result = await authWithExtension();
    if (!result) throw new Error("Extension sign-in failed");
    onAuthenticated?.();
  }, [authWithExtension, onAuthenticated]);

  const features = [
    {
      icon: <FaGamepad />,
      title: copy.feature_game_review,
      desc: copy.feature_game_review_desc,
    },
    {
      icon: <FaMicrophone />,
      title: copy.feature_proficiency_test,
      desc: copy.feature_proficiency_test_desc,
    },
    {
      icon: <FaComments />,
      title: copy.feature_conversations,
      desc: copy.feature_conversations_desc,
    },
    {
      icon: <FaBookOpen />,
      title: copy.feature_stories,
      desc: copy.feature_stories_desc,
    },
    {
      icon: <FaBook />,
      title: copy.feature_reading,
      desc: copy.feature_reading_desc,
    },
    {
      icon: <FaFlask />,
      title: copy.feature_grammar,
      desc: copy.feature_grammar_desc,
    },
    {
      icon: <FaPencilAlt />,
      title: copy.feature_flashcards,
      desc: copy.feature_flashcards_desc,
    },
    {
      icon: <FaLayerGroup />,
      title: copy.feature_flashcards_spaced,
      desc: copy.feature_flashcards_spaced_desc,
    },
    {
      icon: <FaStickyNote />,
      title: copy.feature_notes,
      desc: copy.feature_notes_desc,
    },
    {
      icon: <FaCompass />,
      title: copy.feature_immersion,
      desc: copy.feature_immersion_desc,
    },
    {
      icon: <MdSupportAgent />,
      title: copy.feature_assistant,
      desc: copy.feature_assistant_desc,
    },
    {
      icon: <FaMap />,
      title: copy.feature_skilltree,
      desc: copy.feature_skilltree_desc,
    },
    {
      icon: <FaBullseye />,
      title: copy.feature_goals,
      desc: copy.feature_goals_desc,
    },
    {
      icon: <FaVolumeUp />,
      title: copy.feature_phonics,
      desc: copy.feature_phonics_desc,
    },
  ];

  const faqs = [
    { q: copy.faq_q1, a: copy.faq_a1 },
    { q: copy.faq_q2, a: copy.faq_a2 },
    { q: copy.faq_q3, a: copy.faq_a3 },
    { q: copy.faq_q4, a: copy.faq_a4 },
  ];

  const values = [copy.value_1, copy.value_2, copy.value_3, copy.value_4];

  const handleThemeModeChange = useCallback(
    (nextMode) => {
      if (nextMode === themeMode) return;
      playSound(selectSound);
      syncThemeMode(nextMode);
    },
    [playSound, syncThemeMode, themeMode],
  );

  if (view === "signIn") {
    return (
      <>
        <GlobalStyles />
        <AnimatedBackground />
        <ThemeModeToggle
          themeMode={themeMode}
          onModeChange={handleThemeModeChange}
        />
        <SignInView
          copy={copy}
          onBack={() => setView("landing")}
          onSignIn={handleSignIn}
          onExtension={handleExtension}
          hasExtension={hasExtension}
        />
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <AnimatedBackground />

      <ThemeModeToggle
        themeMode={themeMode}
        onModeChange={handleThemeModeChange}
      />

      {/* Hero Section */}
      <section
        style={{
          minHeight: "auto",
          display: "flex",
          // alignItems: "center",
          justifyContent: "center",
          position: "relative",
          padding: "10px 24px 0px",
          overflow: "hidden",
        }}
      >
        <FloatingElements />

        <div
          style={{
            maxWidth: "800px",
            width: "100%",
            textAlign: "center",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* Robot Buddy Pro */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{ marginBottom: "16px" }}
          >
            <VoiceOrb state={heroVoiceOrbState} />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              fontFamily: theme.fonts.display,
              fontSize: "clamp(2rem, 6vw, 3.5rem)",
              fontWeight: 600,
              lineHeight: 1.1,
              marginBottom: "24px",
            }}
          >
            {copy.hero_title}
            <br />
            <span
              style={{
                background: `linear-gradient(135deg, ${theme.colors.accent.primary} 0%, ${theme.colors.accent.secondary} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {copy.hero_title_accent}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              fontFamily: theme.fonts.body,
              fontSize: "clamp(0.7rem, 1.2vw, 0.8rem)",
              color: theme.colors.text.secondary,
              maxWidth: "580px",
              margin: "0 auto 32px",
              lineHeight: 1.6,
            }}
          >
            {copy.hero_subtitle}
          </motion.p>

          {/* CTA Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              maxWidth: "440px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={copy.placeholder_name}
            />
            <Button
              onClick={handleCreate}
              loading={isCreating}
              disabled={displayName.trim().length < 2}
              fullWidth
              size="lg"
              variant="primary"
              color="white"
            >
              {copy.cta_start} →
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                playSound(selectSound);
                setView("signIn");
              }}
              fullWidth
            >
              {copy.cta_signin}
            </Button>

            {/* Language Menu */}
            <LanguageMenu lang={lang} setLang={setLang} playSound={playSound} />
          </motion.div>
        </div>
      </section>

      {/* Languages Section */}
      <section
        style={{
          padding: `${theme.spacing.section} 24px`,
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <SectionLabel>{copy.languages_label}</SectionLabel>
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "50px" }}
              transition={{ duration: 0.25 }}
              style={{
                fontFamily: theme.fonts.display,
                fontSize: "clamp(2rem, 5vw, 3rem)",
                fontWeight: 600,
                lineHeight: 1.2,
              }}
            >
              {copy.languages_title}
              <br />
              <span style={{ color: theme.colors.accent.primary }}>
                {copy.languages_title_accent}
              </span>
            </motion.h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(140px, 45%), 1fr))",
              gap: "16px",
              justifyItems: "center",
            }}
          >
            {getPracticeLanguageOptions({
              ui: translations[lang] || translations.en,
              uiLang: lang,
              includeTierTagInLabel: false,
            }).map(
              (langOption, i) => (
                <motion.div
                  key={langOption.value}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "50px" }}
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "20px 16px",
                    borderRadius: "16px",
                    background: theme.colors.bg.elevated,
                    border: `1px solid ${theme.colors.border.subtle}`,
                    width: "100%",
                    minHeight: "120px",
                  }}
                >
                  <div style={{ fontSize: "32px", lineHeight: 1 }}>
                    {langOption.flag}
                  </div>
                  <span
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      color: theme.colors.text.primary,
                      textAlign: "center",
                    }}
                  >
                    {langOption.label}
                  </span>
                  <span
                    style={{
                      fontFamily: theme.fonts.mono,
                      fontSize: "0.6rem",
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      visibility:
                        langOption.alpha || langOption.beta
                          ? "visible"
                          : "hidden",
                      color: langOption.alpha
                        ? theme.colors.accent.warm
                        : theme.colors.accent.tertiary,
                      background: langOption.alpha
                        ? "rgba(249, 115, 22, 0.12)"
                        : "rgba(167, 139, 250, 0.12)",
                      padding: "2px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    {langOption.alpha
                      ? copy.languages_alpha
                      : copy.languages_beta}
                  </span>
                </motion.div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        style={{
          padding: `${theme.spacing.section} 24px`,
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <SectionLabel>{copy.features_label}</SectionLabel>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                fontFamily: theme.fonts.display,
                fontSize: "clamp(2rem, 5vw, 3rem)",
                fontWeight: 600,
                lineHeight: 1.2,
              }}
            >
              {copy.features_title}
              <br />
              <span style={{ color: theme.colors.accent.primary }}>
                {copy.features_title_accent}
              </span>
            </motion.h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(280px, 45%), 1fr))",
              gap: "clamp(12px, 2vw, 24px)",
            }}
          >
            {features.map((f, i) => (
              <FeatureCard
                key={i}
                icon={f.icon}
                title={f.title}
                description={f.desc}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Value Props Section */}
      <section
        style={{
          padding: `${theme.spacing.section} 24px`,
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <SectionLabel>{copy.value_label}</SectionLabel>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                fontFamily: theme.fonts.display,
                fontSize: "clamp(2rem, 5vw, 3rem)",
                fontWeight: 600,
                lineHeight: 1.2,
              }}
            >
              {copy.value_title}
              <br />
              <span style={{ color: theme.colors.accent.primary }}>
                {copy.value_title_accent}
              </span>
            </motion.h2>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {values.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  padding: "24px 32px",
                  background: theme.colors.bg.elevated,
                  backdropFilter: "blur(20px)",
                  borderRadius: "16px",
                  border: `1px solid ${theme.colors.border.subtle}`,
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: `linear-gradient(135deg, ${theme.colors.accent.primary} 0%, ${theme.colors.accent.secondary} 100%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: "white",
                    textShadow: "0px 1px 1px black",
                    fontWeight: 700,
                    fontSize: "1.25rem",
                  }}
                >
                  {i + 1}
                </div>
                <p
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: "1.1rem",
                    color: theme.colors.text.primary,
                    lineHeight: 1.5,
                  }}
                >
                  {v}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Scholarship Section */}
      <section
        style={{
          padding: "60px 24px",
          position: "relative",
          zIndex: 10,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "32px",
            background: `linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%)`,
            borderRadius: "32px",
            border: `1px solid rgba(249, 115, 22, 0.2)`,
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Bitcoin decoration */}
          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "40px",
              fontSize: "80px",
              opacity: 0.1,
            }}
          >
            ₿
          </div>

          <SectionLabel>{copy.scholarship_label}</SectionLabel>

          <h2
            style={{
              fontFamily: theme.fonts.display,
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 600,
              lineHeight: 1.2,
              marginBottom: "24px",
            }}
          >
            {copy.scholarship_title}{" "}
            <span style={{ color: "#f97316" }}>
              {copy.scholarship_title_accent}
            </span>
          </h2>

          <p
            style={{
              fontFamily: theme.fonts.body,
              fontSize: "1.125rem",
              color: theme.colors.text.secondary,
              maxWidth: "600px",
              margin: "0 auto 16px",
              lineHeight: 1.7,
            }}
          >
            {copy.scholarship_desc}{" "}
            <a
              href="https://robotsbuildingeducation.com/learning"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: theme.colors.accent.primary,
                textDecoration: "underline",
              }}
            >
              {copy.scholarship_link}
            </a>
          </p>

          <p
            style={{
              fontFamily: theme.fonts.body,
              fontSize: "1rem",
              color: theme.colors.text.muted,
              fontStyle: "italic",
            }}
          >
            {copy.scholarship_note}
          </p>
        </motion.div>
      </section>

      {/* FAQ Section */}
      {/* <section
        style={{
          padding: `${theme.spacing.section} 24px`,
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <SectionLabel>{copy.faq_label}</SectionLabel>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                fontFamily: theme.fonts.display,
                fontSize: "clamp(2rem, 5vw, 3rem)",
                fontWeight: 600,
              }}
            >
              {copy.faq_title}
            </motion.h2>
          </div>

          <div>
            {faqs.map((faq, i) => (
              <FAQItem
                key={i}
                question={faq.q}
                answer={faq.a}
                isOpen={openFAQ === i}
                onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                index={i}
              />
            ))}
          </div>
        </div>
      </section> */}

      {/* Final CTA */}
      <section
        style={{
          padding: `${theme.spacing.section} 24px`,
          position: "relative",
          zIndex: 10,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            maxWidth: "700px",
            margin: "0 auto",
            textAlign: "center",
            padding: "80px 48px",
            background: theme.colors.bg.elevated,
            backdropFilter: "blur(40px)",
            borderRadius: "32px",
            border: `1px solid ${theme.colors.border.subtle}`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Glow effect */}
          <div
            style={{
              position: "absolute",
              top: "-50%",
              left: "-50%",
              width: "200%",
              height: "200%",
              background: `radial-gradient(circle at center, rgba(20, 184, 166, 0.1) 0%, transparent 50%)`,
              pointerEvents: "none",
            }}
          />

          <h2
            style={{
              fontFamily: theme.fonts.display,
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 600,
              lineHeight: 1.2,
              marginBottom: "16px",
              position: "relative",
            }}
          >
            {copy.cta_final_title}
            <br />
            <span style={{ color: theme.colors.accent.primary }}>
              {copy.cta_final_accent}
            </span>
          </h2>

          <p
            style={{
              fontFamily: theme.fonts.body,
              fontSize: "1.125rem",
              color: theme.colors.text.secondary,
              marginBottom: "40px",
              position: "relative",
            }}
          >
            {copy.cta_final_subtitle}
          </p>

          <div
            style={{
              maxWidth: "400px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              position: "relative",
            }}
          >
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={copy.placeholder_name}
            />
            <Button
              onClick={handleCreate}
              loading={isCreating}
              disabled={displayName.trim().length < 2}
              fullWidth
              size="lg"
            >
              {copy.cta_start} →
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                playSound(selectSound);
                setView("signIn");
              }}
              fullWidth
            >
              {copy.cta_signin}
            </Button>
          </div>
        </motion.div>
      </section>
    </>
  );
};

export default LandingPage;
