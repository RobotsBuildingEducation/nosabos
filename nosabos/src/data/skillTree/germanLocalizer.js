/**
 * Adds German support-language copy to CEFR skill-tree payloads.
 *
 * The source lesson files keep their authored English/Spanish data. This pass
 * fills `de` fields at load time so support-language readers do not fall back
 * to English when the app UI is German.
 */

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const lowerFirst = (value) => {
  if (!value) return value;
  return value.charAt(0).toLocaleLowerCase("de-DE") + value.slice(1);
};

const capitalizeFirst = (value) => {
  if (!value) return value;
  return value.charAt(0).toLocaleUpperCase("de-DE") + value.slice(1);
};

const TEXT_TRANSLATIONS = {
  "100 must-know words and phrases to start fast":
    "100 wichtige Wörter und Sätze für einen schnellen Start",
  "20 everyday verbs and short requests to get things done":
    "20 Alltagsverben und kurze Bitten, um Dinge zu erledigen",
  "20 words for time, transport, and finding your way":
    "20 Wörter für Zeit, Verkehr und Orientierung",
  "learn basic introductions": "Lerne einfache Vorstellungen",
  "abstract concepts": "Abstrakte Konzepte",
  "academic writing": "Akademisches Schreiben",
  "accent and usage": "Akzent und Gebrauch",
  achievements: "Erfolge",
  "actions & essentials": "Handlungen und Grundlagen",
  "active citizenship": "Aktive Bürgerschaft",
  "add 20 words for names, family, and moving around":
    "Füge 20 Wörter für Namen, Familie und Fortbewegung hinzu",
  "additional phrases for gracious communication":
    "Weitere Sätze für höfliche Kommunikation",
  "additional gracious phrases": "Weitere höfliche Sätze",
  "advanced discourse": "Fortgeschrittener Diskurs",
  "advanced expressions": "Fortgeschrittene Ausdrücke",
  "advanced greetings": "Fortgeschrittene Begrüßungen",
  "advanced if clauses": "Fortgeschrittene Wenn-Sätze",
  "advanced idioms": "Fortgeschrittene Redewendungen",
  "adventure awaits": "Das Abenteuer wartet",
  "analyzing texts": "Texte analysieren",
  "apologize and get attention politely":
    "Sich entschuldigen und höflich Aufmerksamkeit bekommen",
  "apologize politely": "Sich höflich entschuldigen",
  "appearance words": "Wörter zum Aussehen",
  "apply larger numbers in real-life contexts":
    "Größere Zahlen in echten Situationen anwenden",
  "apply numbers to phone numbers and ages":
    "Zahlen für Telefonnummern und Alter anwenden",
  "appropriate language": "Angemessene Sprache",
  "artistic language": "Künstlerische Sprache",
  "artistic movements": "Künstlerische Bewegungen",
  "arts & literature": "Kunst und Literatur",
  "ask others what their name is": "Andere nach ihrem Namen fragen",
  "ask others their name": "Andere nach dem Namen fragen",
  "ask questions": "Fragen stellen",
  "asking names": "Nach Namen fragen",
  "asking questions": "Fragen stellen",
  "at home": "Zu Hause",
  "at the doctor's": "Beim Arzt",
  "at the market": "Auf dem Markt",
  "at the restaurant": "Im Restaurant",
  "at the store": "Im Geschäft",
  "athletic activities": "Sportliche Aktivitäten",
  "background actions": "Hintergrundhandlungen",
  "balanced living": "Ausgewogen leben",
  "bargain hunting": "Schnäppchen suchen",
  "basic questions": "Grundlegende Fragen",
  "basic food and drink vocabulary":
    "Grundwortschatz zu Essen und Getränken",
  "basic food vocabulary": "Grundwortschatz zu Essen",
  "basic greetings and farewells for any situation":
    "Grundlegende Begrüßungen und Abschiede für jede Situation",
  "basic greetings and farewells": "Begrüßungen und Abschiede",
  "before it happened": "Bevor es passiert ist",
  "better or worse": "Besser oder schlechter",
  "big numbers in context": "Große Zahlen im Kontext",
  "black, white & neutral": "Schwarz, Weiß und Neutraltöne",
  "body and health": "Körper und Gesundheit",
  "body parts": "Körperteile",
  "booking a trip": "Eine Reise buchen",
  "building arguments": "Argumente aufbauen",
  "business communication": "Geschäftskommunikation",
  "business etiquette": "Geschäftsetikette",
  "business spanish": "Geschäftsspanisch",
  "buy things": "Dinge kaufen",
  "buying groceries": "Lebensmittel einkaufen",
  "calendar basics": "Kalendergrundlagen",
  "career words": "Berufswörter",
  "celebrating diversity": "Vielfalt feiern",
  "civic engagement": "Gesellschaftliches Engagement",
  "civic topics": "Gesellschaftliche Themen",
  clothing: "Kleidung",
  "coherent arguments": "Schlüssige Argumente",
  "collaborative ideas": "Gemeinsame Ideen",
  colors: "Farben",
  "colors & shapes": "Farben und Formen",
  "colors everywhere": "Farben überall",
  "common household items": "Häufige Haushaltsgegenstände",
  "common irregular verbs": "Häufige unregelmäßige Verben",
  "common objects": "Häufige Gegenstände",
  comparisons: "Vergleiche",
  "complete counting to ten: 6, 7, 8, 9, 10":
    "Zählen bis zehn abschließen: 6, 7, 8, 9, 10",
  "complete counting to ten": "Zählen bis zehn abschließen",
  "complete mastery": "Vollständige Beherrschung",
  "complete the introduction with polite expressions":
    "Die Vorstellung mit höflichen Ausdrücken vervollständigen",
  "complete the introduction": "Die Vorstellung vervollständigen",
  "complete your color palette": "Deine Farbpalette vervollständigen",
  "complete your palette": "Deine Palette vervollständigen",
  "complex communication": "Komplexe Kommunikation",
  "complex conditionals": "Komplexe Bedingungssätze",
  "complex emotions": "Komplexe Gefühle",
  "complex ideas": "Komplexe Ideen",
  "complex moods": "Komplexe Stimmungen",
  "complex sentences": "Komplexe Sätze",
  "complex timelines": "Komplexe Zeitlinien",
  "conditional would": "Konditional mit would",
  "connected life": "Vernetztes Leben",
  "connecting ideas": "Ideen verbinden",
  "context matters": "Der Kontext zählt",
  "contrary to fact": "Entgegen den Tatsachen",
  "corporate world": "Unternehmenswelt",
  "count from zero to ten in spanish": "Auf Spanisch von null bis zehn zählen",
  "count from zero to ten": "Von null bis zehn zählen",
  "count from eleven to thirty": "Von elf bis dreißig zählen",
  "counting from eleven to thirty": "Von elf bis dreißig zählen",
  "counting objects": "Gegenstände zählen",
  "counting to one hundred": "Bis hundert zählen",
  "counting to twenty": "Bis zwanzig zählen",
  "creative expression": "Kreativer Ausdruck",
  "critical analysis": "Kritische Analyse",
  "cross-cultural understanding": "Interkulturelles Verständnis",
  "cultural ambassador": "Kulturbotschafter",
  "cultural analysis": "Kulturanalyse",
  "cultural expertise": "Kulturelle Kompetenz",
  "cultural fluency": "Kulturelle Gewandtheit",
  "cultural heritage": "Kulturelles Erbe",
  "cultural intelligence": "Kulturelle Intelligenz",
  "cultural mastery": "Kulturelle Meisterschaft",
  "cultural navigator": "Kultureller Navigator",
  "cultural practices": "Kulturelle Praktiken",
  "cultural studies": "Kulturstudien",
  "cultural works": "Kulturelle Werke",
  "culture & traditions": "Kultur und Traditionen",
  "current events": "Aktuelle Ereignisse",
  "customs and festivals": "Bräuche und Feste",
  "daily activities": "Tägliche Aktivitäten",
  "daily routine": "Tagesablauf",
  "daily schedule": "Tagesplan",
  "days of week": "Wochentage",
  "debate & argumentation": "Debatte und Argumentation",
  "deep culture": "Tiefere Kultur",
  "deep thinking": "Tiefes Denken",
  "describe visually": "Visuell beschreiben",
  "describing people": "Menschen beschreiben",
  "describing places": "Orte beschreiben",
  "describing things": "Dinge beschreiben",
  "detailed descriptions": "Detaillierte Beschreibungen",
  dialects: "Dialekte",
  "different careers": "Verschiedene Berufe",
  "different ways to greet people": "Verschiedene Arten, Menschen zu grüßen",
  "digital devices": "Digitale Geräte",
  "digital life": "Digitales Leben",
  directions: "Wegbeschreibungen",
  "discourse markers": "Diskursmarker",
  "discussing problems": "Probleme besprechen",
  "domain expertise": "Fachkompetenz",
  "doubt and desire": "Zweifel und Wunsch",
  "dream destinations": "Traumziele",
  "dream job": "Traumberuf",
  "dreams and goals": "Träume und Ziele",
  "earlier actions": "Frühere Handlungen",
  "educational topics": "Bildungsthemen",
  "elegant expression": "Eleganter Ausdruck",
  environment: "Umwelt",
  "essential courtesy expressions for polite communication":
    "Wichtige Höflichkeitsausdrücke für höfliche Kommunikation",
  "essential courtesy expressions": "Wichtige Höflichkeitsausdrücke",
  "essential single-word responses for any conversation":
    "Wichtige Ein-Wort-Antworten für jedes Gespräch",
  "essential single-word responses": "Wichtige Ein-Wort-Antworten",
  "everyday items": "Alltagsgegenstände",
  "everyday starters": "Alltägliche Einstiege",
  "executive presence": "Souveränes Auftreten",
  "expand your color vocabulary": "Deinen Farbwortschatz erweitern",
  "expand your palette": "Deine Palette erweitern",
  experiences: "Erfahrungen",
  "expert terminology": "Fachterminologie",
  "express dissatisfaction": "Unzufriedenheit ausdrücken",
  "express uncertainty with simple phrases":
    "Unsicherheit mit einfachen Sätzen ausdrücken",
  "express uncertainty": "Unsicherheit ausdrücken",
  "expressing opinions": "Meinungen ausdrücken",
  "expressing preferences": "Vorlieben ausdrücken",
  "expressing wishes": "Wünsche ausdrücken",
  "farewell expressions": "Abschiedsformeln",
  "family members": "Familienmitglieder",
  "family relationships": "Familienbeziehungen",
  "favorites and dislikes": "Vorlieben und Abneigungen",
  "find your way": "Dich zurechtfinden",
  "finding your way": "Sich zurechtfinden",
  "fine distinctions": "Feine Unterschiede",
  "finish the tutorial by playing a short game review.":
    "Beende das Tutorial mit einer kurzen Spielwiederholung.",
  "first words": "Erste Wörter",
  "fitness goals": "Fitnessziele",
  "fluent expression": "Flüssiger Ausdruck",
  "food & drinks": "Essen und Getränke",
  "food and drink": "Essen und Getränke",
  "food and drink items": "Speisen und Getränke",
  "food vocabulary": "Wortschatz zu Essen",
  "formal vs informal": "Formell und informell",
  "formal writing": "Formelles Schreiben",
  "four seasons": "Vier Jahreszeiten",
  "free time": "Freizeit",
  "free time fun": "Freizeitspaß",
  "fresh food shopping": "Frische Lebensmittel einkaufen",
  "fresh produce": "Frische Produkte",
  "from morning to night": "Von morgens bis abends",
  "future activities": "Zukünftige Aktivitäten",
  "future intentions": "Zukünftige Absichten",
  "future of science": "Zukunft der Wissenschaft",
  "future plans": "Zukunftspläne",
  "future possibilities": "Zukünftige Möglichkeiten",
  "future tense": "Zukunftsform",
  "game review": "Spielwiederholung",
  "getting around": "Unterwegs sein",
  "getting information": "Informationen bekommen",
  "getting started": "Erste Schritte",
  "giving advice": "Ratschläge geben",
  "going green": "Nachhaltiger leben",
  "grandparents, babies, and extended family":
    "Großeltern, Babys und weitere Familie",
  greetings: "Begrüßungen",
  "greetings in context": "Begrüßungen im Kontext",
  "had done": "Hatte gemacht",
  "have done": "Hat gemacht",
  "have you ever?": "Hast du jemals?",
  "he said that...": "Er sagte, dass...",
  headlines: "Schlagzeilen",
  "health & body": "Gesundheit und Körper",
  "health & lifestyle": "Gesundheit und Lebensstil",
  "health concerns": "Gesundheitsprobleme",
  "healthy living": "Gesund leben",
  "hello & goodbye": "Hallo und Tschüss",
  "hello and goodbye": "Hallo und Tschüss",
  "helpful suggestions": "Hilfreiche Vorschläge",
  "hobbies & interests": "Hobbys und Interessen",
  "holistic health": "Ganzheitliche Gesundheit",
  "how do i get there?": "Wie komme ich dorthin?",
  "i am...": "Ich bin...",
  "i am from...": "Ich komme aus...",
  "i think that...": "Ich denke, dass...",
  "if only": "Wenn doch nur",
  "imagining possibilities": "Möglichkeiten vorstellen",
  "improve your reading skills with a simple hello passage.":
    "Verbessere dein Lesen mit einem einfachen Begrüßungstext.",
  "in the city": "In der Stadt",
  "informed citizen": "Informierter Bürger",
  "integrated practice": "Integrierte Übung",
  "intellectual discussion": "Intellektuelle Diskussion",
  introductions: "Vorstellungen",
  "introduce yourself": "Stell dich vor",
  "it was done": "Es wurde gemacht",
  "key vocabulary": "Wichtiger Wortschatz",
  "language diversity": "Sprachliche Vielfalt",
  "learn farewells": "Abschiede lernen",
  "learn key vocabulary for conditional would":
    "Wichtigen Wortschatz für den Konditional mit would lernen",
  "learn new words with interactive questions. practice saying hello.":
    "Lerne neue Wörter mit interaktiven Fragen. Übe, Hallo zu sagen.",
  "learn to count from twenty-one to one hundred":
    "Lerne, von einundzwanzig bis hundert zu zählen",
  "learn to count from eleven to thirty":
    "Lerne, von elf bis dreißig zu zählen",
  "numbers 11-30": "Zahlen 11-30",
  "numbers 11-30 quiz": "Quiz zu den Zahlen 11-30",
  "test your knowledge of numbers 11-30":
    "Teste dein Wissen über die Zahlen von 11 bis 30",
  "learn to count from zero to ten": "Lerne, von null bis zehn zu zählen",
  "learn to introduce yourself": "Lerne, dich vorzustellen",
  "lesson": "Lektion",
  "link vocabulary and grammar from the unit in a guided scenario.":
    "Verbinde Wortschatz und Grammatik der Einheit in einem geführten Szenario.",
  "literary analysis": "Literarische Analyse",
  "literary techniques": "Literarische Techniken",
  "medical visits": "Arztbesuche",
  "money and prices": "Geld und Preise",
  "more family": "Mehr Familie",
  "my family": "Meine Familie",
  "my favorite foods": "Meine Lieblingsspeisen",
  "name everyday things": "Alltagsdinge benennen",
  "names and introductions": "Namen und Vorstellungen",
  "numbers": "Zahlen",
  "numbers in life": "Zahlen im Alltag",
  "people & family": "Menschen und Familie",
  "people around me": "Menschen um mich herum",
  "planning your week": "Deine Woche planen",
  "polite conversations": "Höfliche Gespräche",
  "polite expressions": "Höfliche Ausdrücke",
  "practice in real situations": "In echten Situationen üben",
  "practice numbers in everyday situations": "Zahlen im Alltag üben",
  "practice basic introductions in a realtime tutoring session.":
    "Übe einfache Vorstellungen in einer Echtzeit-Tutorsitzung.",
  "practice with interactive stories that say hello.":
    "Übe mit interaktiven Geschichten, die Hallo sagen.",
  "question words": "Fragewörter",
  "read and discuss": "Lesen und besprechen",
  "real-life practice": "Praxis im echten Leben",
  "review by playing": "Mit einem Spiel wiederholen",
  "rooms and furniture": "Zimmer und Möbel",
  "short targeted drills to consolidate the unit language before the quiz.":
    "Kurze gezielte Übungen, um die Sprache der Einheit vor dem Quiz zu festigen.",
  "skill builder": "Fertigkeitentraining",
  "small talk": "Small Talk",
  "test your knowledge": "Dein Wissen testen",
  "things at home": "Dinge zu Hause",
  "time, travel & directions": "Zeit, Reisen und Wegbeschreibungen",
  "travel & tourism": "Reisen und Tourismus",
  "trip planning": "Reiseplanung",
  "use numbers to count everyday things":
    "Zahlen verwenden, um Alltagsdinge zu zählen",
  "use numbers to count things": "Zahlen verwenden, um Dinge zu zählen",
  "using numbers daily": "Zahlen täglich verwenden",
  "visiting the doctor": "Beim Arzt",
  weather: "Wetter",
  "what day is it?": "Welcher Tag ist heute?",
  "what is this?": "Was ist das?",
  "what time is it?": "Wie spät ist es?",
  "what's your name?": "Wie heißt du?",
  "where is it?": "Wo ist es?",
  "words for friends, children, and people you see every day":
    "Wörter für Freunde, Kinder und Menschen, die du jeden Tag siehst",
  "workplace language": "Sprache am Arbeitsplatz",
  "yes and no": "Ja und Nein",
  "yes, no & basic responses": "Ja, Nein und grundlegende Antworten",
  "your family": "Deine Familie",
  "your first 20 high-frequency words for greetings and basics":
    "Deine ersten 20 häufigen Wörter für Begrüßungen und Grundlagen",
  "your very first words": "Deine allerersten Wörter",
  "zero to five": "Null bis fünf",
};

const SUPPLEMENTAL_TEXT_TRANSLATIONS = {
  "Courtesy Quiz": "Höflichkeits-Quiz",
  "How Do They Look?": "Wie sehen sie aus?",
  "How Do You Feel?": "Wie fühlst du dich?",
  "Hypothetical Situations": "Hypothetische Situationen",
  "I Like, I Love": "Ich mag, ich liebe",
  "I would...": "Ich würde...",
  "I'm Hungry!": "Ich habe Hunger!",
  "I'm Not Satisfied": "Ich bin nicht zufrieden",
  "If I Were You": "Wenn ich du wäre",
  "If I had...": "Wenn ich hätte...",
  "If Only...": "Wenn doch nur...",
  "Important Dates": "Wichtige Daten",
  "Introducing Yourself": "Sich vorstellen",
  "Introducing Yourself Quiz": "Sich-vorstellen-Quiz",
  "Irregular verbs": "Unregelmäßige Verben",
  "Is done by": "Wird gemacht von",
  "Jobs & Professions": "Jobs und Berufe",
  "Jobs & Professions Quiz": "Jobs-und-Berufe-Quiz",
  "Last Week": "Letzte Woche",
  "Learning Journey": "Lernreise",
  "Let's Meet Up!": "Lass uns treffen!",
  "Let's Try This": "Lass uns das versuchen",
  "Let's, why don't we": "Lass uns, warum nicht",
  "Likely or Unlikely": "Wahrscheinlich oder unwahrscheinlich",
  "Likes & Dislikes": "Vorlieben und Abneigungen",
  "Likes & Dislikes Quiz": "Vorlieben-und-Abneigungen-Quiz",
  "Linguistic Diversity": "Sprachliche Vielfalt",
  "Literary Criticism": "Literaturkritik",
  "Literary Devices": "Literarische Mittel",
  "Making Appointments": "Termine vereinbaren",
  "Making Change": "Wechselgeld geben",
  "Making Comparisons": "Vergleiche bilden",
  "Making Complaints": "Beschwerden äußern",
  "Making Complaints Quiz": "Beschwerden-Quiz",
  "Making Plans": "Pläne machen",
  "Making Plans Quiz": "Pläne-machen-Quiz",
  "Making Predictions": "Vorhersagen treffen",
  "Making Suggestions": "Vorschläge machen",
  "Making Suggestions Quiz": "Vorschläge-Quiz",
  "Market Day": "Markttag",
  "Master Rhetoric": "Rhetorik meistern",
  "Maybe, might": "Vielleicht, könnte",
  "Media & News": "Medien und Nachrichten",
  "Media & News Quiz": "Medien-und-Nachrichten-Quiz",
  "Medical Terms": "Medizinische Begriffe",
  "Meeting Someone New": "Jemand Neues kennenlernen",
  "Memorable Moments": "Unvergessliche Momente",
  "Mixed Conditionals": "Gemischte Konditionalsätze",
  "Months & Dates": "Monate und Daten",
  "Months & Dates Quiz": "Monate-und-Daten-Quiz",
  "More, less, equal": "Mehr, weniger, gleich",
  "My Day": "Mein Tag",
  "My Neighborhood": "Meine Nachbarschaft",
  "My Story": "Meine Geschichte",
  "My Wardrobe": "Mein Kleiderschrank",
  "Narrate events": "Ereignisse erzählen",
  "Native Idioms": "Muttersprachliche Redewendungen",
  "Native Idioms Quiz": "Muttersprachliche-Redewendungen-Quiz",
  "Native Phrases": "Muttersprachliche Sätze",
  "Near-Native Fluency": "Fast muttersprachliche Flüssigkeit",
  "Near-Native Fluency Quiz": "Fast-muttersprachliche-Flüssigkeit-Quiz",
  "Nuanced Meaning": "Nuancierte Bedeutung",
  "Objects Around Us": "Gegenstände um uns herum",
  "Objects Quiz": "Gegenstände-Quiz",
  "Our Planet": "Unser Planet",
  "Passive Voice": "Passiv",
  "Passive Voice Quiz": "Passiv-Quiz",
  "Past Continuous": "Verlaufsform der Vergangenheit",
  "Past Continuous Quiz": "Vergangenheitsverlaufsform-Quiz",
  "Past Perfect": "Plusquamperfekt",
  "Past Perfect Quiz": "Plusquamperfekt-Quiz",
  "Past Tense Irregular": "Unregelmäßige Vergangenheit",
  "Past Tense Irregular Quiz": "Unregelmäßige-Vergangenheit-Quiz",
  "Past Tense Regular": "Regelmäßige Vergangenheit",
  "Past Tense Regular Quiz": "Regelmäßige-Vergangenheit-Quiz",
  "Past subjunctive": "Vergangenheits-Konkjunktiv",
  "Perfect Fluency": "Perfekte Flüssigkeit",
  "Personal Items": "Persönliche Gegenstände",
  "Persuasive Techniques": "Überzeugungstechniken",
  "Persuasive techniques": "Überzeugungstechniken",
  "Philosophical Ideas": "Philosophische Ideen",
  "Physical descriptions": "Körperliche Beschreibungen",
  "Places Around Town": "Orte in der Stadt",
  "Planning Ahead": "Vorausplanen",
  "Playing Sports": "Sport treiben",
  "Please & Thank You": "Bitte und Danke",
  "Political Discourse": "Politischer Diskurs",
  "Politics & Society": "Politik und Gesellschaft",
  "Politics & Society Quiz": "Politik-und-Gesellschaft-Quiz",
  "Powerful Speech": "Ausdrucksstarke Rede",
  "Pre-A1 Foundations": "Pre-A1-Grundlagen",
  "Precise Meaning": "Präzise Bedeutung",
  "Predictions": "Vorhersagen",
  "Preferences": "Vorlieben",
  "Present Perfect": "Perfekt",
  "Present Perfect Quiz": "Perfekt-Quiz",
  "Probability": "Wahrscheinlichkeit",
  "Probability Quiz": "Wahrscheinlichkeits-Quiz",
  "Problem Solving": "Problemlösung",
  "Professional Fields": "Berufsfelder",
  "Professional Meetings": "Berufliche Besprechungen",
  "Professional Tone": "Professioneller Ton",
  "Quick Responses": "Schnelle Antworten",
  "Quoting Others": "Andere zitieren",
  "Recent Events": "Aktuelle Ereignisse",
  "Regional Variations": "Regionale Varianten",
  "Regional Variations Quiz": "Regionale-Varianten-Quiz",
  "Register switching": "Registerwechsel",
  "React naturally": "Natürlich reagieren",
  "Red, blue, yellow": "Rot, blau, gelb",
  "Regular past verbs": "Regelmäßige Vergangenheitsverben",
  "Relative Clauses": "Relativsätze",
  "Relative Clauses Quiz": "Relativsätze-Quiz",
  "Reported Speech": "Indirekte Rede",
  "Reported Speech Quiz": "Indirekte-Rede-Quiz",
  "Research Papers": "Forschungsarbeiten",
  "Resolving Issues": "Probleme lösen",
  "Respectful Debate": "Respektvolle Debatte",
  "Responses Quiz": "Antworten-Quiz",
  "Rhetorical Devices": "Rhetorische Mittel",
  "Rhetorical Devices Quiz": "Rhetorische-Mittel-Quiz",
  "Saving Earth": "Die Erde retten",
  "Saying Goodbye": "Abschied nehmen",
  "Saying Hello": "Hallo sagen",
  "Scheduling Events": "Veranstaltungen planen",
  "School & Education": "Schule und Bildung",
  "School & Education Quiz": "Schule-und-Bildung-Quiz",
  "Science & Innovation": "Wissenschaft und Innovation",
  "Science & Innovation Quiz": "Wissenschaft-und-Innovation-Quiz",
  "Scientific Terms": "Wissenschaftliche Begriffe",
  "Scientific topics": "Wissenschaftliche Themen",
  "Sharing Experiences": "Erfahrungen teilen",
  "Sharing Interests": "Interessen teilen",
  "Sharing Views": "Ansichten teilen",
  "She Said That...": "Sie sagte, dass...",
  "Shopping & Money": "Einkaufen und Geld",
  "Shopping & Money Quiz": "Einkaufen-und-Geld-Quiz",
  "Should, must": "Sollte, muss",
  "Smart Shopping": "Clever einkaufen",
  "Social Issues": "Soziale Themen",
  "Social Issues Quiz": "Soziale-Themen-Quiz",
  "Social arrangements": "Soziale Verabredungen",
  "Society Today": "Gesellschaft heute",
  "Something's Wrong": "Etwas stimmt nicht",
  "Sophisticated Logic": "Anspruchsvolle Logik",
  "Sound Natural": "Natürlich klingen",
  "Sports & Exercise": "Sport und Bewegung",
  "Sports & Exercise Quiz": "Sport-und-Bewegung-Quiz",
  "Staying Active": "Aktiv bleiben",
  "Story Elements": "Geschichtenelemente",
  "Style control": "Stilkontrolle",
  "Stylistic Mastery": "Stilistische Meisterschaft",
  "Stylistic Mastery Quiz": "Stilistische-Meisterschaft-Quiz",
  "Subjunctive Past": "Konjunktiv der Vergangenheit",
  "Subjunctive Past Quiz": "Vergangenheits-Konjunktiv-Quiz",
  "Subjunctive Present": "Konjunktiv der Gegenwart",
  "Subjunctive Present Quiz": "Gegenwarts-Konjunktiv-Quiz",
  "Subtle Nuances": "Feine Nuancen",
  "Subtle Nuances Quiz": "Feine-Nuancen-Quiz",
  "Superlatives": "Superlative",
  "Technical terms": "Technische Begriffe",
  "Technological Advances": "Technologische Fortschritte",
  "Technology Basics": "Technologie-Grundlagen",
  "Technology Basics Quiz": "Technologie-Grundlagen-Quiz",
  "Theoretical Discussion": "Theoretische Diskussion",
  "Tomorrow's World": "Die Welt von morgen",
  "Transportation": "Verkehr",
  "Transportation Quiz": "Verkehrs-Quiz",
  "Traveling abroad": "Auslandsreisen",
  "Twelve Months": "Zwölf Monate",
  "Using Technology": "Technologie nutzen",
  "Was doing": "War gerade dabei",
  "Weather Reports": "Wetterberichte",
  "Wellness": "Wohlbefinden",
  "Wellness Choices": "Gesundheitsentscheidungen",
  "What Did You Do?": "Was hast du gemacht?",
  "What Do You Do?": "Was machst du beruflich?",
  "What Do You Enjoy?": "Was macht dir Spaß?",
  "What Will You Do?": "Was wirst du tun?",
  "What you wear": "Was du trägst",
  "While It Was Happening": "Während es geschah",
  "Who, Which, That": "Wer, welcher, das",
  "Who, which, that": "Wer, welcher, das",
  "Why Don't We?": "Warum tun wir nicht?",
  "Will do": "Werde tun",
  "Winning Debates": "Debatten gewinnen",
};

Object.assign(
  TEXT_TRANSLATIONS,
  Object.fromEntries(
    Object.entries(SUPPLEMENTAL_TEXT_TRANSLATIONS).map(([key, value]) => [
      normalizeKey(key),
      value,
    ]),
  ),
);

const TERM_TRANSLATIONS = {
  a: "ein",
  about: "über",
  actions: "Handlungen",
  advanced: "fortgeschrittene",
  and: "und",
  apply: "anwenden",
  at: "bei",
  basic: "grundlegende",
  body: "Körper",
  business: "Geschäft",
  colors: "Farben",
  communication: "Kommunikation",
  conversation: "Gespräch",
  conversations: "Gespräche",
  count: "zählen",
  counting: "Zählen",
  culture: "Kultur",
  daily: "täglich",
  describe: "beschreiben",
  describing: "Beschreiben",
  digital: "digital",
  expressions: "Ausdrücke",
  family: "Familie",
  food: "Essen",
  for: "für",
  future: "Zukunft",
  game: "Spiel",
  grammar: "Grammatik",
  greetings: "Begrüßungen",
  health: "Gesundheit",
  in: "in",
  integrated: "integriert",
  language: "Sprache",
  learn: "lernen",
  lesson: "Lektion",
  life: "Leben",
  numbers: "Zahlen",
  of: "von",
  people: "Menschen",
  polite: "höflich",
  practice: "Übung",
  questions: "Fragen",
  quiz: "Quiz",
  reading: "Lesen",
  review: "Wiederholung",
  skill: "Fertigkeit",
  skills: "Fertigkeiten",
  spanish: "Spanisch",
  stories: "Geschichten",
  test: "testen",
  the: "der",
  things: "Dinge",
  time: "Zeit",
  to: "zu",
  travel: "Reisen",
  vocabulary: "Wortschatz",
  words: "Wörter",
  workplace: "Arbeitsplatz",
  your: "dein",
};

const translateFallback = (source) => {
  const words = String(source || "").split(/(\b)/);
  const translated = words
    .map((part) => {
      const key = normalizeKey(part);
      return TERM_TRANSLATIONS[key] || part;
    })
    .join("")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
  return translated && translated !== source ? translated : "Lerninhalt";
};

const translateTopic = (topic, { sentence = false } = {}) => {
  const translated =
    TEXT_TRANSLATIONS[normalizeKey(topic)] || translateFallback(topic);
  return sentence ? lowerFirst(translated) : capitalizeFirst(translated);
};

export const translateSkillTreeTextToGerman = (englishText) => {
  if (!englishText || typeof englishText !== "string") return englishText;

  const direct = TEXT_TRANSLATIONS[normalizeKey(englishText)];
  if (direct) return direct;

  let match = englishText.match(/^Learn key vocabulary for (.+)$/);
  if (match) {
    return `Lerne wichtigen Wortschatz für ${translateTopic(match[1], {
      sentence: true,
    })}`;
  }

  match = englishText.match(/^Practice (.+) in conversation$/);
  if (match) {
    return `Übe ${translateTopic(match[1], {
      sentence: true,
    })} im Gespräch`;
  }

  match = englishText.match(/^Apply (.+) skills$/);
  if (match) {
    return `Wende Fertigkeiten zu ${translateTopic(match[1], {
      sentence: true,
    })} an`;
  }

  match = englishText.match(/^Test your knowledge of (.+)$/);
  if (match) {
    return `Teste dein Wissen über ${translateTopic(match[1], {
      sentence: true,
    })}`;
  }

  match = englishText.match(/^Review (.+) by playing an interactive game$/);
  if (match) {
    return `Wiederhole ${translateTopic(match[1], {
      sentence: true,
    })} mit einem interaktiven Spiel`;
  }

  match = englishText.match(/^(.+) Quiz$/);
  if (match) return `${translateTopic(match[1])}-Quiz`;

  match = englishText.match(/^(.+) Skill Builder$/);
  if (match) return `Fertigkeitentraining: ${translateTopic(match[1])}`;

  match = englishText.match(/^(.+) Integrated Practice$/);
  if (match) return `Integrierte Übung: ${translateTopic(match[1])}`;

  return translateFallback(englishText);
};

const addGermanText = (value) => {
  if (Array.isArray(value)) return value.map(addGermanText);
  if (!value || typeof value !== "object") return value;

  const localized = Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, addGermanText(child)]),
  );

  if (
    typeof value.en === "string" &&
    typeof value.es === "string" &&
    typeof value.de !== "string"
  ) {
    localized.de = translateSkillTreeTextToGerman(value.en);
  }

  if (typeof value.successCriteria === "string" && !localized.successCriteria_de) {
    localized.successCriteria_de = translateSkillTreeTextToGerman(
      value.successCriteria,
    );
  }

  return localized;
};

export const withGermanSkillTreeText = (skillTree) => addGermanText(skillTree);
