/**
 * Adds French support-language copy to skill-tree payloads.
 *
 * The source lesson data keeps its authored English/Spanish content. This pass
 * adds a `fr` field anywhere the shared readers expect `{ en, es, ... }`.
 */

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const capitalizeFirst = (value) => {
  if (!value) return value;
  return value.charAt(0).toLocaleUpperCase("fr-FR") + value.slice(1);
};

const lowerFirst = (value) => {
  if (!value) return value;
  return value.charAt(0).toLocaleLowerCase("fr-FR") + value.slice(1);
};

const TEXT_TRANSLATIONS = {
  "getting started": "Pour commencer",
  "first words": "Premiers mots",
  "basic greetings and farewells": "Salutations et formules de base",
  "greetings": "Salutations",
  "actions & essentials": "Actions et essentiels",
  "everyday starters": "Premiers mots du quotidien",
  "basic questions": "Questions de base",
  "asking questions": "Poser des questions",
  "food & drinks": "Nourriture et boissons",
  "food and drink": "Nourriture et boissons",
  "colors": "Couleurs",
  "colors & shapes": "Couleurs et formes",
  "family members": "Membres de la famille",
  "family relationships": "Relations familiales",
  "days of week": "Jours de la semaine",
  "calendar basics": "Bases du calendrier",
  "at home": "A la maison",
  "at the restaurant": "Au restaurant",
  "at the market": "Au marche",
  "at the store": "Au magasin",
  "body and health": "Corps et sante",
  "body parts": "Parties du corps",
  "getting around": "Se deplacer",
  "directions": "Directions",
  "travel": "Voyage",
  "transport": "Transport",
  "clothing": "Vetements",
  "daily routine": "Routine quotidienne",
  "free time": "Temps libre",
  "weather": "Meteo",
  "work and school": "Travail et ecole",
  "education": "Education",
  "business spanish": "Espagnol professionnel",
  "business communication": "Communication professionnelle",
  "cultural heritage": "Patrimoine culturel",
  "culture & traditions": "Culture et traditions",
  "current events": "Actualite",
  "arts & literature": "Arts et litterature",
  "advanced discourse": "Discours avance",
  "advanced expressions": "Expressions avancees",
  "advanced greetings": "Salutations avancees",
  "complete mastery": "Maitrise complete",
  "game review": "Revision par le jeu",
  "conversation practice": "Pratique de conversation",
  "grammar": "Grammaire",
  "vocabulary": "Vocabulaire",
  "reading": "Lecture",
  "stories": "Histoires",
  "realtime": "Temps reel",
  "learn new words through interactive questions.":
    "Apprends de nouveaux mots avec des questions interactives.",
  "master grammar rules through exercises.":
    "Maitrise les regles de grammaire avec des exercices.",
  "improve your reading skills by following along with passages.":
    "Ameliore ta lecture en suivant des textes.",
  "practice with interactive stories by reading and speaking sentence by sentence.":
    "Pratique avec des histoires interactives en lisant et parlant phrase par phrase.",
  "practice speaking with realtime conversations.":
    "Pratique l'oral avec des conversations en temps reel.",
  "review what you learned by playing an interactive game.":
    "Revise ce que tu as appris avec un jeu interactif.",
  "finish the tutorial by playing a short game review.":
    "Termine le tutoriel avec une courte revision sous forme de jeu.",
  "the learner says hello.": "L'apprenant dit bonjour.",
  "the learner says hello to you.": 'L\'apprenant te dit "bonjour".',
};

Object.assign(TEXT_TRANSLATIONS, {
  "additional phrases for gracious communication":
    "Phrases supplementaires pour communiquer avec courtoisie",
  "apologize and get attention politely":
    "S'excuser et attirer l'attention poliment",
  "asking names": "Demander les noms",
  "ask others what their name is": "Demande aux autres comment ils s'appellent",
  "basic food and drink vocabulary": "Vocabulaire de base des aliments et boissons",
  "basic greetings and farewells for any situation":
    "Salutations et formules d'adieu de base pour toute situation",
  "black, white & neutral": "Noir, blanc et neutres",
  "colors everywhere": "Des couleurs partout",
  "complete counting to ten: 6, 7, 8, 9, 10":
    "Complete le comptage jusqu'a dix : 6, 7, 8, 9, 10",
  "complete the introduction with polite expressions":
    "Complete la presentation avec des expressions polies",
  "complete your color palette": "Complete ta palette de couleurs",
  "counting objects": "Compter des objets",
  "essential courtesy expressions for polite communication":
    "Expressions essentielles de courtoisie pour communiquer poliment",
  "essential single-word responses for any conversation":
    "Reponses essentielles en un mot pour toute conversation",
  "expand your color vocabulary": "Elargis ton vocabulaire des couleurs",
  "express uncertainty with simple phrases":
    "Exprime l'incertitude avec des phrases simples",
  "food and drink items": "Aliments et boissons",
  "grandparents, babies, and extended family":
    "Grands-parents, bebes et famille elargie",
  "greetings in context": "Salutations en contexte",
  "hello & goodbye": "Bonjour et au revoir",
  "improve your reading skills with a simple hello passage.":
    "Ameliore tes competences de lecture avec un court texte de salutation.",
  "introduce yourself and ask others their names":
    "Presente-toi et demande le nom des autres",
  "learn different ways to greet people":
    "Apprends differentes facons de saluer les gens",
  "learn farewell expressions for different situations":
    "Apprends des formules d'adieu pour differentes situations",
  "learn names of common household items":
    "Apprends les noms d'objets courants de la maison",
  "learn the words for close family members":
    "Apprends les mots pour les membres proches de la famille",
  "learn to identify and name colors":
    "Apprends a identifier et nommer les couleurs",
  "learn to introduce yourself":
    "Apprends a te presenter",
  "learn words for the people in your life":
    "Apprends les mots pour les personnes de ta vie",
  "learn your first numbers: 0, 1, 2, 3, 4, 5":
    "Apprends tes premiers nombres : 0, 1, 2, 3, 4, 5",
  "master the most important words in any language":
    "Maitrise les mots les plus importants dans n'importe quelle langue",
  "maybe and i don't know": "Peut-etre et je ne sais pas",
  "more colors": "Plus de couleurs",
  "more family": "Plus de famille",
  "name everyday things around you":
    "Nomme les objets du quotidien autour de toi",
  "nice to meet you": "Enchante",
  "numbers 0-10": "Nombres 0-10",
  "personal items": "Objets personnels",
  "please & thank you": "S'il te plait et merci",
  "please and thank you": "S'il te plait et merci",
  "polite expressions": "Expressions polies",
  "practice greetings in real-life situations":
    "Pratique les salutations dans des situations reelles",
  "practice speaking with realtime conversations. say hello to complete this activity.":
    "Pratique l'oral avec des conversations en temps reel. Dis bonjour pour terminer cette activite.",
  "practice with interactive stories that say hello.":
    "Pratique avec des histoires interactives qui disent bonjour.",
  "primary colors": "Couleurs primaires",
  "react naturally in conversations": "Reagis naturellement en conversation",
  "red, blue, yellow - the building blocks":
    "Rouge, bleu, jaune : les bases",
  "saying goodbye": "Dire au revoir",
  "saying hello": "Dire bonjour",
  "saying your name": "Dire ton nom",
  "six to ten": "Six a dix",
  "sorry and excuse me": "Desole et excuse-moi",
  "test your ability to respond appropriately":
    "Teste ta capacite a repondre correctement",
  "test your color recognition skills":
    "Teste ta reconnaissance des couleurs",
  "test your counting skills from 0 to 10":
    "Teste tes competences de comptage de 0 a 10",
  "test your greeting and farewell skills":
    "Teste tes salutations et formules d'adieu",
  "test your introduction skills": "Teste tes presentations",
  "test your polite expression skills":
    "Teste tes expressions polies",
  "test your knowledge of common objects":
    "Teste ta connaissance des objets courants",
  "test your knowledge of people and family words":
    "Teste ta connaissance des mots pour les personnes et la famille",
  "the magic words that open doors everywhere":
    "Les mots magiques qui ouvrent des portes partout",
  "use numbers to count everyday things":
    "Utilise les nombres pour compter des objets du quotidien",
  "words for friends, children, and people you see every day":
    "Mots pour les amis, les enfants et les gens que tu vois tous les jours",
  "yes and no": "Oui et non",
  "100 must-know words and phrases to start fast":
    "100 mots et phrases indispensables pour commencer vite",
  "20 everyday verbs and short requests to get things done":
    "20 verbes du quotidien et demandes courtes pour agir",
  "20 words for time, transport, and finding your way":
    "20 mots pour le temps, les transports et l'orientation",
  "a guided tour of all learning modules":
    "Une visite guidee de tous les modules d'apprentissage",
  "abstract concepts": "Concepts abstraits",
  "academic writing": "Ecriture academique",
  "accent and usage": "Accent et usage",
  "achievements": "Realisations",
  "active citizenship": "Citoyennete active",
  "add 20 words for names, family, and moving around":
    "Ajoute 20 mots pour les noms, la famille et les deplacements",
  "advanced idioms": "Idiomes avances",
  "adventure awaits": "L'aventure t'attend",
  "analyzing texts": "Analyse de textes",
  "appearance words": "Mots d'apparence",
  "appropriate language": "Langage approprie",
  "artistic language": "Langage artistique",
  "artistic movements": "Mouvements artistiques",
  "athletic activities": "Activites sportives",
  "background actions": "Actions de fond",
  "balanced living": "Vie equilibree",
  "bargain hunting": "Chasse aux bonnes affaires",
  "before it happened": "Avant que cela arrive",
  "better or worse": "Mieux ou pire",
  "big numbers in context": "Grands nombres en contexte",
  "booking a trip": "Reservation d'un voyage",
  "building arguments": "Construction d'arguments",
  "business etiquette": "Etiquette professionnelle",
  "career words": "Mots des metiers",
  "celebrating diversity": "Celebrer la diversite",
  "civic engagement": "Engagement citoyen",
  "civic topics": "Sujets civiques",
  "coherent arguments": "Arguments coherents",
  "collaborative ideas": "Idees collaboratives",
  "common household items": "Objets courants de la maison",
  "common objects": "Objets courants",
  "complex conditionals": "Conditionnels complexes",
  "complex communication": "Communication complexe",
  "complex emotions": "Emotions complexes",
  "complex ideas": "Idees complexes",
  "complex moods": "Modes complexes",
  "complex sentences": "Phrases complexes",
  "complex timelines": "Chronologies complexes",
  "conditional would": "Conditionnel avec would",
  "connected life": "Vie connectee",
  "connecting ideas": "Relier les idees",
  "context matters": "Le contexte compte",
  "contrary to fact": "Contraire aux faits",
  "corporate world": "Monde de l'entreprise",
  "count from zero to ten in spanish": "Compte de zero a dix en espagnol",
  "count to twenty": "Compte jusqu'a vingt",
  "counting to one hundred": "Compter jusqu'a cent",
  "counting to twenty": "Compter jusqu'a vingt",
  "creative expression": "Expression creative",
  "critical analysis": "Analyse critique",
  "cross-cultural understanding": "Compréhension interculturelle",
  "cultural ambassador": "Ambassadeur culturel",
  "cultural analysis": "Analyse culturelle",
  "cultural expertise": "Expertise culturelle",
  "cultural fluency": "Aisance culturelle",
  "cultural intelligence": "Intelligence culturelle",
  "cultural mastery": "Maitrise culturelle",
  "cultural navigator": "Navigateur culturel",
  "cultural practices": "Pratiques culturelles",
  "cultural studies": "Etudes culturelles",
  "cultural works": "Oeuvres culturelles",
  "customs and festivals": "Coutumes et festivals",
  "daily activities": "Activites quotidiennes",
  "daily schedule": "Emploi du temps quotidien",
  "debate & argumentation": "Debat et argumentation",
  "deep culture": "Culture profonde",
  "deep thinking": "Reflexion approfondie",
  "describe visually": "Decrire visuellement",
  "describing people": "Decrire les personnes",
  "describing places": "Decrire les lieux",
  "describing things": "Decrire les choses",
  "detailed descriptions": "Descriptions detaillees",
  "dialects": "Dialectes",
  "different careers": "Differentes carrieres",
  "digital devices": "Appareils numeriques",
  "digital life": "Vie numerique",
  "discourse markers": "Marqueurs discursifs",
  "discussing problems": "Discuter des problemes",
  "domain expertise": "Expertise specialisee",
  "doubt and desire": "Doute et desir",
  "dream destinations": "Destinations de reve",
  "dream job": "Metier de reve",
  "dreams and goals": "Reves et objectifs",
  "earlier actions": "Actions anterieures",
  "educational topics": "Sujets educatifs",
  "elegant expression": "Expression elegante",
  "environment": "Environnement",
  "everyday items": "Objets du quotidien",
  "executive presence": "Presence professionnelle",
  "experiences": "Experiences",
  "expert terminology": "Terminologie specialisee",
  "express dissatisfaction": "Exprimer une insatisfaction",
  "expressing opinions": "Exprimer des opinions",
  "expressing preferences": "Exprimer des preferences",
  "expressing wishes": "Exprimer des souhaits",
  "family members": "Membres de la famille",
  "fine distinctions": "Distinctions subtiles",
  "fitness goals": "Objectifs de forme",
  "fluent expression": "Expression fluide",
  "formal vs informal": "Formel et informel",
  "formal writing": "Ecriture formelle",
  "four seasons": "Quatre saisons",
  "free time fun": "Loisirs amusants",
  "fresh food shopping": "Achats de produits frais",
  "fresh produce": "Produits frais",
  "future activities": "Activites futures",
  "future intentions": "Intentions futures",
  "future of science": "Avenir de la science",
  "future plans": "Projets futurs",
  "future possibilities": "Possibilites futures",
  "future tense": "Futur",
  "going green": "Vivre plus ecologique",
  "had done": "Avait fait",
  "have done": "A fait",
  "have you ever?": "As-tu deja ?",
  "he said that...": "Il a dit que...",
  "headlines": "Gros titres",
  "health & body": "Sante et corps",
  "health & lifestyle": "Sante et mode de vie",
  "health concerns": "Preoccupations de sante",
  "healthy living": "Vie saine",
  "helpful suggestions": "Suggestions utiles",
  "hobbies & interests": "Loisirs et interets",
  "holistic health": "Sante globale",
  "if i had...": "Si j'avais...",
  "if i were you": "Si j'etais toi",
  "if only...": "Si seulement...",
  "imagining possibilities": "Imaginer des possibilites",
  "important dates": "Dates importantes",
  "in the classroom": "En classe",
  "in the house": "Dans la maison",
  "informed citizen": "Citoyen informe",
  "interpersing culture": "Interpreter la culture",
  "interpreting culture": "Interpreter la culture",
  "introducing yourself": "Se presenter",
  "is done by": "Est fait par",
  "learn how to use the app and explore all features":
    "Apprends a utiliser l'app et explore toutes les fonctionnalites",
  "learn new words with interactive questions. practice saying hello.":
    "Apprends de nouveaux mots avec des questions interactives. Entraine-toi a dire bonjour.",
  "learn new words through interactive questions. practice saying 'hello'.":
    "Apprends de nouveaux mots avec des questions interactives. Entraine-toi a dire bonjour.",
  "leadership language": "Langage du leadership",
  "learning journey": "Parcours d'apprentissage",
  "left and right": "Gauche et droite",
  "let's meet up!": "Retrouvons-nous !",
  "let's try this": "Essayons ceci",
  "let's, why don't we": "Faisons..., pourquoi ne pas...",
  "life experiences": "Experiences de vie",
  "life stories": "Histoires de vie",
  "linguistic diversity": "Diversite linguistique",
  "literary analysis": "Analyse litteraire",
  "literary criticism": "Critique litteraire",
  "literary devices": "Procedés litteraires",
  "literary techniques": "Techniques litteraires",
  "making appointments": "Prendre rendez-vous",
  "making change": "Creer le changement",
  "making comparisons": "Faire des comparaisons",
  "making complaints": "Faire des reclamations",
  "making plans": "Faire des projets",
  "making predictions": "Faire des predictions",
  "making suggestions": "Faire des suggestions",
  "market day": "Jour de marche",
  "master grammar rules through exercises. practice greeting patterns.":
    "Maitrise les regles de grammaire avec des exercices. Entraine-toi aux modeles de salutation.",
  "master rhetoric": "Maitriser la rhetorique",
  "media & news": "Medias et actualites",
  "meeting someone new": "Rencontrer quelqu'un",
  "memorable moments": "Moments memorables",
  "mixed conditionals": "Conditionnels mixtes",
  "months & dates": "Mois et dates",
  "more, less, equal": "Plus, moins, egal",
  "my day": "Ma journee",
  "my family": "Ma famille",
  "my family tree": "Mon arbre familial",
  "my favorite foods": "Mes aliments preferes",
  "my neighborhood": "Mon quartier",
  "my story": "Mon histoire",
  "my wardrobe": "Ma garde-robe",
  "native idioms": "Idiomes natifs",
  "native phrases": "Phrases naturelles",
  "native-like skills": "Competences quasi natives",
  "near-native fluency": "Aisance quasi native",
  "news and media": "Actualites et medias",
  "nuanced meaning": "Sens nuance",
  "objects around us": "Objets autour de nous",
  "once upon a time": "Il etait une fois",
  "order food": "Commander a manger",
  "ordering a meal": "Commander un repas",
  "our planet": "Notre planete",
  "past continuous": "Passe continu",
  "past perfect": "Plus-que-parfait",
  "past subjunctive": "Subjonctif passe",
  "past tense irregular": "Passe irregulier",
  "past tense regular": "Passe regulier",
  "passive voice": "Voix passive",
  "paying the bill": "Payer l'addition",
  "people & family": "Personnes et famille",
  "people & places": "Personnes et lieux",
  "people around me": "Les gens autour de moi",
  "perfect fluency": "Aisance parfaite",
  "persuasive language": "Langage persuasif",
  "persuasive skills": "Competences persuasives",
  "persuasive techniques": "Techniques persuasives",
  "philosophical ideas": "Idees philosophiques",
  "physical descriptions": "Descriptions physiques",
  "places around town": "Lieux en ville",
  "planning ahead": "Planifier a l'avance",
  "planning your week": "Planifier ta semaine",
  "playing sports": "Faire du sport",
  "political discourse": "Discours politique",
  "politics & society": "Politique et societe",
  "polite conversations": "Conversations polies",
  "powerful speech": "Discours puissant",
  "precise meaning": "Sens precis",
  "predictions": "Predictions",
  "present perfect": "Present perfect",
  "professional communication": "Communication professionnelle",
  "professional fields": "Domaines professionnels",
  "professional meetings": "Reunions professionnelles",
  "professional tone": "Ton professionnel",
  "probability": "Probabilite",
  "problem solving": "Resolution de problemes",
  "quick responses": "Reponses rapides",
  "quoting others": "Citer les autres",
  "refined language": "Langage raffine",
  "regional variations": "Variations regionales",
  "register switching": "Changement de registre",
  "registers of speech": "Registres de langue",
  "relative clauses": "Propositions relatives",
  "reported speech": "Discours rapporte",
  "research papers": "Articles de recherche",
  "resolving issues": "Resoudre des problemes",
  "respectful debate": "Debat respectueux",
  "restaurant words": "Mots du restaurant",
  "retelling stories": "Raconter des histoires",
  "rhetorical devices": "Figures rhetoriques",
  "rooms and furniture": "Pieces et meubles",
  "rooms of the house": "Pieces de la maison",
  "saving earth": "Sauver la Terre",
  "scheduling events": "Planifier des evenements",
  "scholarly language": "Langage savant",
  "school & education": "Ecole et education",
  "school life": "Vie scolaire",
  "science & innovation": "Science et innovation",
  "scientific terms": "Termes scientifiques",
  "scientific topics": "Sujets scientifiques",
  "setting the scene": "Planter le decor",
  "sharing experiences": "Partager des experiences",
  "sharing interests": "Partager ses interets",
  "sharing views": "Partager des points de vue",
  "shopping & money": "Achats et argent",
  "shopping for clothes": "Acheter des vetements",
  "should and shouldn't": "Ce qu'il faut et ne faut pas faire",
  "should, must": "Devrait, doit",
  "social arrangements": "Organisation sociale",
  "social glue & questions": "Lien social et questions",
  "social issues": "Questions sociales",
  "society and issues": "Societe et enjeux",
  "society today": "La societe aujourd'hui",
  "something's wrong": "Quelque chose ne va pas",
  "sophisticated logic": "Logique sophistiquee",
  "sound natural": "Parler naturellement",
  "speaking like a native": "Parler comme un natif",
  "specialized vocabulary": "Vocabulaire specialise",
  "sports & exercise": "Sport et exercice",
  "staying active": "Rester actif",
  "story elements": "Elements d'histoire",
  "style control": "Maitrise du style",
  "stylistic mastery": "Maitrise stylistique",
  "subjunctive past": "Subjonctif passe",
  "subjunctive present": "Subjonctif present",
  "subtle nuances": "Nuances subtiles",
  "superlatives": "Superlatifs",
  "taking the bus": "Prendre le bus",
  "talk about locations": "Parler des lieux",
  "talk about weather": "Parler de la meteo",
  "talking about family": "Parler de la famille",
  "technical terms": "Termes techniques",
  "technology basics": "Bases de la technologie",
  "technological advances": "Avancees technologiques",
  "telling stories": "Raconter des histoires",
  "telling time": "Dire l'heure",
  "theoretical discussion": "Discussion theorique",
  "things at home": "Choses a la maison",
  "things you carry with you every day":
    "Les choses que tu portes avec toi chaque jour",
  "time, travel & directions": "Temps, voyage et directions",
  "tomorrow's world": "Le monde de demain",
  "transportation": "Transports",
  "travel & tourism": "Voyage et tourisme",
  "travel options": "Options de transport",
  "traveling abroad": "Voyager a l'etranger",
  "trip planning": "Planification de voyage",
  "using numbers daily": "Utiliser les nombres au quotidien",
  "using technology": "Utiliser la technologie",
  "was doing": "Etait en train de faire",
  "weather reports": "Bulletins meteo",
  "wellness": "Bien-etre",
  "wellness choices": "Choix de bien-etre",
  "what day is it?": "Quel jour sommes-nous ?",
  "what did you do?": "Qu'as-tu fait ?",
  "what do you do?": "Que fais-tu dans la vie ?",
  "what do you enjoy?": "Qu'est-ce que tu aimes ?",
  "what time is it?": "Quelle heure est-il ?",
  "what's your name?": "Comment tu t'appelles ?",
  "what to wear": "Que porter",
  "what will you do?": "Que feras-tu ?",
  "what you wear": "Ce que tu portes",
  "where is it?": "Ou est-ce ?",
  "while it was happening": "Pendant que cela se passait",
  "who, which, that": "Qui, lequel, que",
  "why don't we?": "Pourquoi ne pas... ?",
  "will do": "Fera",
  "winning debates": "Gagner des debats",
  "workplace language": "Langage professionnel",
  "yes, no & basic responses": "Oui, non et reponses de base",
  "yesterday's actions": "Actions d'hier",
  "zero to five": "Zero a cinq",
  "the learner names at least two extended family members.":
    "L'apprenant nomme au moins deux membres de la famille elargie.",
  "the learner uses people vocabulary to describe someone.":
    "L'apprenant utilise le vocabulaire des personnes pour decrire quelqu'un.",
  "the learner counts at least three objects using correct numbers.":
    "L'apprenant compte au moins trois objets avec les bons nombres.",
  "the learner uses at least two different farewell expressions.":
    "L'apprenant utilise au moins deux formules d'adieu differentes.",
  "the learner uses at least two uncertainty expressions.":
    "L'apprenant utilise au moins deux expressions d'incertitude.",
  "the learner uses apology and attention phrases appropriately.":
    "L'apprenant utilise correctement les excuses et les formules pour attirer l'attention.",
  "the learner uses at least two polite expressions naturally.":
    "L'apprenant utilise naturellement au moins deux expressions polies.",
  "the learner names at least two food or drink items.":
    "L'apprenant nomme au moins deux aliments ou boissons.",
  "the learner names at least three colors in conversation.":
    "L'apprenant nomme au moins trois couleurs en conversation.",
  "the learner uses at least three color words including neutral colors.":
    "L'apprenant utilise au moins trois mots de couleur, y compris des couleurs neutres.",
  "the learner asks for the other person's name using an appropriate phrase.":
    "L'apprenant demande le nom de l'autre personne avec une phrase appropriee.",
});

Object.assign(TEXT_TRANSLATIONS, {
  "advanced if clauses": "Propositions conditionnelles avancees",
  "at the doctor's": "Chez le medecin",
  "buy things": "Acheter des choses",
  "buying groceries": "Faire les courses",
  "common irregular verbs": "Verbes irreguliers courants",
  "find your way": "Trouve ton chemin",
  "finding your way": "Trouver son chemin",
  "hello and goodbye": "Bonjour et au revoir",
  "how do i get there?": "Comment y aller ?",
  "how do they look?": "A quoi ressemblent-ils ?",
  "how do you feel?": "Comment te sens-tu ?",
  "hypothetical situations": "Situations hypothetiques",
  "i think that...": "Je pense que...",
  "i would...": "Je voudrais...",
  "i'm not satisfied": "Je ne suis pas satisfait",
  "idiomatic expressions": "Expressions idiomatiques",
  "idioms and sayings": "Idiomes et dictons",
  "irregular verbs": "Verbes irreguliers",
  "it was done": "Cela a ete fait",
  "jobs & professions": "Emplois et professions",
  "larger numbers": "Nombres plus grands",
  "last week": "La semaine derniere",
  "learn essential greetings and farewells":
    "Apprends les salutations et formules d'adieu essentielles",
  "learn the days": "Apprends les jours",
  "learning from life": "Apprendre de la vie",
  "master greeting etiquette and social niceties":
    "Maitrise l'etiquette des salutations et les codes sociaux",
  "mastery of detail": "Maitrise du detail",
  "maybe and perhaps": "Peut-etre et peut-etre bien",
  "medical terms": "Termes medicaux",
  "medical visits": "Visites medicales",
  "narrate events": "Raconter des evenements",
  "nature and ecology": "Nature et ecologie",
  "numbers 0-20": "Nombres 0-20",
  "numbers 21-100": "Nombres 21-100",
  "phone numbers and ages": "Numeros de telephone et ages",
  "pre-a1 foundations": "Fondations Pre-A1",
  "prices and money": "Prix et argent",
  "professional language": "Langage professionnel",
  "recent events": "Evenements recents",
  "regular past verbs": "Verbes reguliers au passe",
  "round out 100 words with connectors, feelings, and quick questions":
    "Complete 100 mots avec des connecteurs, des sentiments et des questions rapides",
  "say your name and origin": "Dis ton nom et ton origine",
  "share personal information and ask about others":
    "Partage des informations personnelles et pose des questions aux autres",
  "she said that...": "Elle a dit que...",
  "smart shopping": "Achats malins",
  "tell me about yourself": "Parle-moi de toi",
  "visiting the doctor": "Aller chez le medecin",
  "your first 20 high-frequency words for greetings and basics":
    "Tes 20 premiers mots frequents pour les salutations et les bases",
  "your very first words": "Tes tout premiers mots",
  "practice numbers in everyday situations":
    "Pratique les nombres dans des situations quotidiennes",
  "apply numbers to phone numbers and ages":
    "Applique les nombres aux numeros de telephone et aux ages",
  "practice using larger numbers with prices and money":
    "Pratique les grands nombres avec les prix et l'argent",
  "apply larger numbers in real-life contexts":
    "Applique les grands nombres dans des contextes reels",
  "likely or unlikely": "Probable ou improbable",
  "ask questions": "Poser des questions",
  "basic food vocabulary": "Vocabulaire alimentaire de base",
  "comparisons": "Comparaisons",
  "directions": "Itineraires",
  "experiences": "Experiences vecues",
  "favorites and dislikes": "Favoris et aversions",
  "food vocabulary": "Vocabulaire alimentaire",
  "from morning to night": "Du matin au soir",
  "getting information": "Obtenir des informations",
  "giving advice": "Donner des conseils",
  "how's the weather?": "Quel temps fait-il ?",
  "i like, i love": "J'aime, j'adore",
  "i'm hungry!": "J'ai faim !",
  "likes & dislikes": "Gouts et aversions",
  "maybe, might": "Peut-etre, il se peut",
  "monday to sunday": "De lundi a dimanche",
  "preferences": "Préférences",
  "predictions": "Predictions futures",
  "question words": "Mots interrogatifs",
  "rainbow colors": "Couleurs de l'arc-en-ciel",
  "twelve months": "Douze mois",
  "what is this?": "Qu'est-ce que c'est ?",
  "when's your birthday?": "C'est quand ton anniversaire ?",
  "your day": "Ta journee",
  "your family": "Ta famille",
});

const PATTERN_TRANSLATORS = [
  [
    /^Learn key vocabulary for (.+)$/i,
    (topic) => `Apprends le vocabulaire essentiel pour ${lowerFirst(translateSkillTreeTextToFrench(topic))}`,
  ],
  [
    /^Practice (.+) in conversation$/i,
    (topic) => `Pratique ${lowerFirst(translateSkillTreeTextToFrench(topic))} en conversation`,
  ],
  [
    /^Apply (.+) skills$/i,
    (topic) => `Mets en pratique tes competences en ${lowerFirst(translateSkillTreeTextToFrench(topic))}`,
  ],
  [
    /^Test your knowledge of (.+)$/i,
    (topic) => `Teste tes connaissances sur ${lowerFirst(translateSkillTreeTextToFrench(topic))}`,
  ],
  [
    /^Review (.+) by playing an interactive game$/i,
    (topic) => `Revise ${lowerFirst(translateSkillTreeTextToFrench(topic))} avec un jeu interactif`,
  ],
  [
    /^(.+) Quiz$/i,
    (topic) => `Quiz : ${translateSkillTreeTextToFrench(topic)}`,
  ],
  [
    /^Learn to (.+)$/i,
    (topic) => `Apprends a ${lowerFirst(translateSkillTreeTextToFrench(topic))}`,
  ],
  [
    /^Practice (.+) in real conversations$/i,
    (topic) => `Pratique ${lowerFirst(translateSkillTreeTextToFrench(topic))} dans de vraies conversations`,
  ],
];

export const translateSkillTreeTextToFrench = (value) => {
  const source = String(value || "").trim();
  if (!source) return source;
  const translated = TEXT_TRANSLATIONS[normalizeKey(source)];
  if (!translated) {
    for (const [pattern, translate] of PATTERN_TRANSLATORS) {
      const match = source.match(pattern);
      if (match) return translate(match[1]);
    }
    return source;
  }
  return source.charAt(0) === source.charAt(0).toLocaleUpperCase("en-US")
    ? capitalizeFirst(translated)
    : translated;
};

const addFrenchText = (value) => {
  if (Array.isArray(value)) return value.map(addFrenchText);
  if (!value || typeof value !== "object") return value;

  const next = {};
  for (const [key, child] of Object.entries(value)) {
    next[key] = addFrenchText(child);
  }

  if (
    typeof value.en === "string" &&
    typeof value.es === "string" &&
    typeof value.fr !== "string"
  ) {
    next.fr = translateSkillTreeTextToFrench(value.en);
  }

  if (
    typeof value.successCriteria === "string" &&
    typeof value.successCriteria_fr !== "string"
  ) {
    const translated = translateSkillTreeTextToFrench(value.successCriteria);
    if (translated && translated !== value.successCriteria) {
      next.successCriteria_fr = translated;
    }
  }

  return next;
};

export const withFrenchSkillTreeText = (skillTree) => addFrenchText(skillTree);
