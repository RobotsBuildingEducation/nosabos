import { PORTUGUESE_SKILLTREE_TEXT_MAP } from "./portugueseTextMap.js";

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .replace(/[¿¡]/g, "")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");

const compactWhitespace = (value) => String(value || "").replace(/\s+/g, " ").trim();

const capitalizeFirst = (value) => {
  if (!value) return value;
  return value.charAt(0).toLocaleUpperCase("pt-BR") + value.slice(1);
};

const lowerFirst = (value) => {
  if (!value) return value;
  return value.charAt(0).toLocaleLowerCase("pt-BR") + value.slice(1);
};

const applySourceCase = (source, value) => {
  const normalizedSource = String(source || "").trim();
  if (!normalizedSource) return value;
  if (normalizedSource === normalizedSource.toLocaleUpperCase("pt-BR")) {
    return value.toLocaleUpperCase("pt-BR");
  }
  if (normalizedSource === normalizedSource.toLocaleLowerCase("pt-BR")) {
    return lowerFirst(value);
  }
  return capitalizeFirst(value);
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const PORTUGUESE_SKILLTREE_EXACT = {
  [normalizeKey("Learn how to use the app and explore all features")]:
    "Aprenda a usar o aplicativo e explore todos os recursos",
  [normalizeKey("A guided tour of all learning modules")]:
    "Um tour guiado por todos os módulos de aprendizagem",
  [normalizeKey("Getting Started")]: "Primeiros passos",
  [normalizeKey("Learn new words with interactive questions. Practice saying hello.")]:
    "Aprenda novas palavras com perguntas interativas. Pratique dizer olá.",
  [normalizeKey("Master grammar rules through exercises. Practice greeting patterns.")]:
    "Domine as regras gramaticais com exercícios. Pratique padrões de saudação.",
  [normalizeKey("Improve your reading skills with a simple hello passage.")]:
    "Melhore suas habilidades de leitura com um texto simples de saudação.",
  [normalizeKey("Practice with interactive stories that say hello.")]:
    "Pratique com histórias interativas que dizem olá.",
  [normalizeKey("Practice speaking with realtime conversations. Say hello to complete this activity.")]:
    "Pratique a fala com conversas em tempo real. Diga olá para concluir esta atividade.",
  [normalizeKey("Finish the tutorial by playing a short game review.")]:
    "Conclua o tutorial jogando uma breve revisão em forma de jogo.",
  [normalizeKey("People & Family")]: "Pessoas e família",
  [normalizeKey("My Family")]: "Minha família",
  [normalizeKey("People Around Me")]: "Pessoas ao meu redor",
  [normalizeKey("Game Review")]: "Revisão em jogo",
  [normalizeKey("Things at Home")]: "Coisas em casa",
  [normalizeKey("Food and Drink Items")]: "Comidas e bebidas",
  [normalizeKey("Colors")]: "Cores",
  [normalizeKey("What's Your Name?")]: "Como você se chama?",
  [normalizeKey("Pre-A1 Foundations")]: "Fundamentos do Pré-A1",
  [normalizeKey("People & Places")]: "Pessoas e lugares",
  [normalizeKey("Actions & Essentials")]: "Ações e fundamentos",
  [normalizeKey("Time, Travel & Directions")]: "Tempo, viagens e direções",
  [normalizeKey("Hello and Goodbye")]: "Olá e tchau",
  [normalizeKey("Meeting Someone New")]: "Conhecendo alguém novo",
  [normalizeKey("Using Numbers Daily")]: "Usando números no dia a dia",
  [normalizeKey("Phone Numbers and Ages")]: "Números de telefone e idades",
  [normalizeKey("Prices and Money")]: "Preços e dinheiro",
  [normalizeKey("Big Numbers in Context")]: "Números grandes em contexto",
  [normalizeKey("Days of Week")]: "Dias da semana",
  [normalizeKey("Monday to Sunday")]: "De segunda a domingo",
  [normalizeKey("What Day Is It?")]: "Que dia é?",
  [normalizeKey("Planning Your Week")]: "Planejando sua semana",
  [normalizeKey("Months & Dates")]: "Meses e datas",
  [normalizeKey("Twelve Months")]: "Doze meses",
  [normalizeKey("Important Dates")]: "Datas importantes",
  [normalizeKey("Telling Time")]: "Dizendo as horas",
  [normalizeKey("What Time Is It?")]: "Que horas são?",
  [normalizeKey("What time is it?")]: "Que horas são?",
  [normalizeKey("Making Appointments")]: "Marcando compromissos",
  [normalizeKey("My Family Tree")]: "Minha árvore genealógica",
  [normalizeKey("Talking About Family")]: "Falando sobre a família",
  [normalizeKey("Colors & Shapes")]: "Cores e formas",
  [normalizeKey("Rainbow Colors")]: "Cores do arco-íris",
  [normalizeKey("Colors Everywhere")]: "Cores por toda parte",
  [normalizeKey("Food & Drinks")]: "Comidas e bebidas",
  [normalizeKey("I'm Hungry!")]: "Estou com fome!",
  [normalizeKey("My Favorite Foods")]: "Minhas comidas favoritas",
  [normalizeKey("At the Restaurant")]: "No restaurante",
  [normalizeKey("Order food")]: "Peça comida",
  [normalizeKey("Ordering a Meal")]: "Pedindo uma refeição",
  [normalizeKey("Paying the Bill")]: "Pagando a conta",
  [normalizeKey("What Is This?")]: "O que é isso?",
  [normalizeKey("Objects Around Us")]: "Objetos ao nosso redor",
  [normalizeKey("In the House")]: "Na casa",
  [normalizeKey("Rooms of the House")]: "Cômodos da casa",
  [normalizeKey("Where Is It?")]: "Onde está?",
  [normalizeKey("At Home")]: "Em casa",
  [normalizeKey("What to Wear")]: "O que vestir",
  [normalizeKey("Shopping for Clothes")]: "Comprando roupas",
  [normalizeKey("Smart Shopping")]: "Compras inteligentes",
  [normalizeKey("Buying Groceries")]: "Comprando mantimentos",
  [normalizeKey("My Wardrobe")]: "Meu guarda-roupa",
  [normalizeKey("From Morning to Night")]: "Da manhã à noite",
  [normalizeKey("Weather")]: "Clima",
  [normalizeKey("How's the Weather?")]: "Como está o clima?",
  [normalizeKey("Weather Reports")]: "Relatórios do clima",
  [normalizeKey("I Like, I Love")]: "Eu gosto, eu adoro",
  [normalizeKey("Expressing Preferences")]: "Expressando preferências",
  [normalizeKey("Asking Questions")]: "Fazendo perguntas",
  [normalizeKey("Getting Information")]: "Obtendo informações",
  [normalizeKey("Describing People")]: "Descrevendo pessoas",
  [normalizeKey("How Do They Look?")]: "Como eles se parecem?",
  [normalizeKey("Describing Places")]: "Descrevendo lugares",
  [normalizeKey("How Do I Get There?")]: "Como chego lá?",
  [normalizeKey("Yesterday's Actions")]: "Ações de ontem",
  [normalizeKey("How Do You Feel?")]: "Como você se sente?",
  [normalizeKey("At the Doctor's")]: "No médico",
  [normalizeKey("Trip Planning")]: "Planejando viagens",
  [normalizeKey("Social Glue & Questions")]: "Conexões sociais e perguntas",
  [normalizeKey("Polite Conversations")]: "Conversas educadas",
  [normalizeKey("Introducing Yourself")]: "Apresentando-se",
  [normalizeKey("Tell Me About Yourself")]: "Fale sobre você",
  [normalizeKey("Introducing Yourself Quiz")]: "Teste de apresentações",
  [normalizeKey("Count from zero to ten in Spanish")]:
    "Conte do zero ao dez em espanhol",
  [normalizeKey("Learn your first numbers: 0, 1, 2, 3, 4, 5")]:
    "Aprenda seus primeiros números: 0, 1, 2, 3, 4, 5",
  [normalizeKey("Complete counting to ten: 6, 7, 8, 9, 10")]:
    "Complete a contagem até dez: 6, 7, 8, 9, 10",
  [normalizeKey("Use numbers to count everyday things")]:
    "Use números para contar coisas do dia a dia",
  [normalizeKey("Test your counting skills from 0 to 10")]:
    "Teste sua capacidade de contar de 0 a 10",
  [normalizeKey("Basic greetings and farewells for any situation")]:
    "Saudações e despedidas básicas para qualquer situação",
  [normalizeKey("Learn different ways to greet people")]:
    "Aprenda diferentes maneiras de cumprimentar as pessoas",
  [normalizeKey("Learn farewell expressions for different situations")]:
    "Aprenda expressões de despedida para diferentes situações",
  [normalizeKey("Practice greetings in real-life situations")]:
    "Pratique saudações em situações reais",
  [normalizeKey("Test your greeting and farewell skills")]:
    "Teste suas habilidades com saudações e despedidas",
  [normalizeKey("Essential single-word responses for any conversation")]:
    "Respostas essenciais de uma palavra para qualquer conversa",
  [normalizeKey("Master the most important words in any language")]:
    "Domine as palavras mais importantes de qualquer idioma",
  [normalizeKey("Express uncertainty with simple phrases")]:
    "Expresse incerteza com frases simples",
  [normalizeKey("React naturally in conversations")]:
    "Reaja naturalmente em conversas",
  [normalizeKey("Test your ability to respond appropriately")]:
    "Teste sua capacidade de responder adequadamente",
  [normalizeKey("Essential courtesy expressions for polite communication")]:
    "Expressões essenciais de cortesia para uma comunicação educada",
  [normalizeKey("The magic words that open doors everywhere")]:
    "As palavras mágicas que abrem portas em qualquer lugar",
  [normalizeKey("Apologize and get attention politely")]:
    "Peça desculpas e chame a atenção com educação",
  [normalizeKey("Additional phrases for gracious communication")]:
    "Frases adicionais para uma comunicação gentil",
  [normalizeKey("Test your polite expression skills")]:
    "Teste suas habilidades com expressões educadas",
  [normalizeKey("Name everyday things around you")]:
    "Dê nome às coisas do dia a dia ao seu redor",
  [normalizeKey("Learn names of common household items")]:
    "Aprenda os nomes de objetos comuns da casa",
  [normalizeKey("Things you carry with you every day")]:
    "Coisas que você carrega todos os dias",
  [normalizeKey("Basic food and drink vocabulary")]:
    "Vocabulário básico de comida e bebida",
  [normalizeKey("Test your knowledge of common objects")]:
    "Teste seus conhecimentos sobre objetos comuns",
  [normalizeKey("Learn to identify and name colors")]:
    "Aprenda a identificar e nomear cores",
  [normalizeKey("Red, blue, yellow - the building blocks")]:
    "Vermelho, azul e amarelo: os blocos fundamentais",
  [normalizeKey("Expand your color vocabulary")]:
    "Amplie seu vocabulário de cores",
  [normalizeKey("Complete your color palette")]:
    "Complete sua paleta de cores",
  [normalizeKey("Test your color recognition skills")]:
    "Teste suas habilidades de reconhecimento de cores",
  [normalizeKey("Introduce yourself and ask others their names")]:
    "Apresente-se e pergunte os nomes das outras pessoas",
  [normalizeKey("Ask others what their name is")]:
    "Pergunte aos outros qual é o nome deles",
  [normalizeKey("Complete the introduction with polite expressions")]:
    "Complete a apresentação com expressões educadas",
  [normalizeKey("Test your introduction skills")]:
    "Teste suas habilidades de apresentação",
  [normalizeKey("Master greeting etiquette and social niceties")]:
    "Domine a etiqueta das saudações e as gentilezas sociais",
  [normalizeKey("Say your name and origin")]:
    "Diga seu nome e sua origem",
  [normalizeKey("Learn to introduce yourself and ask others' names")]:
    "Aprenda a se apresentar e perguntar o nome dos outros",
  [normalizeKey("Practice introductions in real conversations")]:
    "Pratique apresentações em conversas reais",
  [normalizeKey("Share personal information and ask about others")]:
    "Compartilhe informações pessoais e pergunte sobre os outros",
  [normalizeKey("Test your knowledge of introducing yourself")]:
    "Teste seus conhecimentos sobre apresentações",
  [normalizeKey("Review Introducing Yourself by playing an interactive game")]:
    "Revise apresentações jogando um jogo interativo",
  [normalizeKey("Learn words for the people in your life")]:
    "Aprenda palavras para as pessoas da sua vida",
  [normalizeKey("Learn the words for close family members")]:
    "Aprenda as palavras para os familiares próximos",
  [normalizeKey("Numbers 0-10")]: "Números 0-10",
  [normalizeKey("Counting Objects")]: "Contando objetos",
  [normalizeKey("Personal Items")]: "Itens pessoais",
  [normalizeKey("100 must-know words and phrases to start fast")]:
    "100 palavras e frases indispensáveis para começar rápido",
  [normalizeKey("Everyday Starters")]: "Começos do dia a dia",
  [normalizeKey("Your first 20 high-frequency words for greetings and basics")]:
    "Suas primeiras 20 palavras de alta frequência para saudações e noções básicas",
  [normalizeKey("Add 20 words for names, family, and moving around")]:
    "Adicione 20 palavras para nomes, família e deslocamentos",
  [normalizeKey("20 words for time, transport, and finding your way")]:
    "20 palavras para tempo, transporte e orientação",
  [normalizeKey("Round out 100 words with connectors, feelings, and quick questions")]:
    "Complete 100 palavras com conectores, sentimentos e perguntas rápidas",
  [normalizeKey("Your very first words")]: "Suas primeiras palavras",
  [normalizeKey("Numbers 0-20")]: "Números 0-20",
  [normalizeKey("Count to twenty")]: "Conte até vinte",
  [normalizeKey("Counting to Twenty")]: "Contando até vinte",
  [normalizeKey("Learn to count from zero to twenty")]:
    "Aprenda a contar do zero ao vinte",
  [normalizeKey("Numbers 21-100")]: "Números 21-100",
  [normalizeKey("Larger numbers")]: "Números maiores",
  [normalizeKey("Counting to One Hundred")]: "Contando até cem",
  [normalizeKey("Learn to count from twenty-one to one hundred")]:
    "Aprenda a contar de vinte e um até cem",
  [normalizeKey("Restaurant Words")]: "Palavras do restaurante",
  [normalizeKey("Learn key vocabulary for at the restaurant")]:
    "Aprenda o vocabulário-chave do restaurante",
  [normalizeKey("Practice at the restaurant in conversation")]:
    "Pratique situações no restaurante em conversação",
  [normalizeKey("Apply at the restaurant skills")]:
    "Aplique as habilidades do restaurante",
  [normalizeKey("Everyday items")]: "Itens do dia a dia",
  [normalizeKey("Everyday Items")]: "Itens do dia a dia",
  [normalizeKey("Question Words")]: "Palavras interrogativas",
  [normalizeKey("Fresh food shopping")]: "Compras de alimentos frescos",
  [normalizeKey("Learn key vocabulary for at the market")]:
    "Aprenda o vocabulário-chave do mercado",
  [normalizeKey("Fresh Produce")]: "Produtos frescos",
  [normalizeKey("Practice at the market in conversation")]:
    "Pratique situações no mercado em conversação",
  [normalizeKey("Apply at the market skills")]:
    "Aplique as habilidades do mercado",
  [normalizeKey("Transportation")]: "Transporte",
  [normalizeKey("Getting around")]: "Locomoção",
  [normalizeKey("Getting Around")]: "Deslocando-se",
  [normalizeKey("Find your way")]: "Encontre seu caminho",
  [normalizeKey("Technology Basics")]: "Tecnologia básica",
  [normalizeKey("Digital life")]: "Vida digital",
  [normalizeKey("Digital Devices")]: "Dispositivos digitais",
  [normalizeKey("Learn key vocabulary for technology basics")]:
    "Aprenda o vocabulário-chave de tecnologia básica",
  [normalizeKey("Using Technology")]: "Usando tecnologia",
  [normalizeKey("Practice technology basics in conversation")]:
    "Pratique tecnologia básica em conversação",
  [normalizeKey("Connected Life")]: "Vida conectada",
  [normalizeKey("Apply technology basics skills")]:
    "Aplique as habilidades de tecnologia básica",
  [normalizeKey("Technology Basics Quiz")]: "Teste de tecnologia básica",
  [normalizeKey("Test your knowledge of technology basics")]:
    "Teste seus conhecimentos sobre tecnologia básica",
  [normalizeKey("Review Technology Basics by playing an interactive game")]:
    "Revise tecnologia básica jogando um jogo interativo",
  [normalizeKey("Medical visits")]: "Consultas médicas",
  [normalizeKey("Medical Terms")]: "Termos médicos",
  [normalizeKey("Learn key vocabulary for at the doctor's")]:
    "Aprenda o vocabulário-chave do consultório médico",
  [normalizeKey("Practice at the doctor's in conversation")]:
    "Pratique situações no médico em conversação",
  [normalizeKey("Apply at the doctor's skills")]:
    "Aplique as habilidades do consultório médico",
  [normalizeKey("Will do")]: "Eu farei",
  [normalizeKey("Should, must")]: "Deveria, deve",
  [normalizeKey("Scientific topics")]: "Temas científicos",
  [normalizeKey("Wellness")]: "Bem-estar",
  [normalizeKey("Workplace language")]: "Linguagem do ambiente de trabalho",
};

const SPANISH_LIKE_EXACT = {
  [normalizeKey("Cero a cinco")]: "Zero a cinco",
  [normalizeKey("Seis a diez")]: "Seis a dez",
  [normalizeKey("Qué Día Es?")]: "Que dia é?",
  [normalizeKey("Qué Hora Es?")]: "Que horas são?",
  [normalizeKey("Qué Es Esto?")]: "O que é isso?",
  [normalizeKey("Dónde Está?")]: "Onde está?",
  [normalizeKey("Cómo está el clima?")]: "Como está o clima?",
  [normalizeKey("Cómo Se Ven?")]: "Como eles se parecem?",
  [normalizeKey("Cómo Llego Ahí?")]: "Como chego lá?",
  [normalizeKey("Cómo Te Sientes?")]: "Como você se sente?",
  [normalizeKey("Tengo Hambre!")]: "Estou com fome!",
  [normalizeKey("Mis Comidas Favoritas")]: "Minhas comidas favoritas",
  [normalizeKey("Haciendo Citas")]: "Marcando compromissos",
  [normalizeKey("Haciendo Perguntas")]: "Fazendo perguntas",
  [normalizeKey("Obteniendo Informação")]: "Obtendo informações",
  [normalizeKey("Cuartos da casa")]: "Cômodos da casa",
  [normalizeKey("Qué Ponerse")]: "O que vestir",
  [normalizeKey("Meu Guardarropa")]: "Meu guarda-roupa",
  [normalizeKey("Reportes do clima")]: "Relatórios do clima",
  [normalizeKey("Acções de ayer")]: "Ações de ontem",
  [normalizeKey("Planeando Viajes")]: "Planejando viagens",
  [normalizeKey("Pide comida")]: "Peça comida",
  [normalizeKey("Pidiendo una comida")]: "Pedindo uma refeição",
  [normalizeKey("Pagando la conta")]: "Pagando a conta",
  [normalizeKey("En Casa")]: "Em casa",
  [normalizeKey("Lo que vistes")]: "O que você veste",
  [normalizeKey("Comprando Ropa")]: "Comprando roupas",
  [normalizeKey("Cómo te llamas?")]: "Como você se chama?",
  [normalizeKey("Decir Tu Nome")]: "Dizer seu nome",
  [normalizeKey("Preguntar Nomes")]: "Perguntar nomes",
  [normalizeKey("Saudações en contexto")]: "Saudações em contexto",
};

const SPANISH_LIKE_PHRASE_REPLACEMENTS = [
  ["Aprenda vocabulário chave para ", "Aprenda o vocabulário-chave de "],
  ["Aprenda vocabulário-chave para ", "Aprenda o vocabulário-chave de "],
  ["Teste seus conhecimentos de ", "Teste seus conhecimentos sobre "],
  ["Teste seu conhecimento de ", "Teste seus conhecimentos sobre "],
  ["Aplique habilidades de ", "Aplique as habilidades de "],
  ["Aplica habilidades de ", "Aplique as habilidades de "],
  ["en el restaurante en conversación", "no restaurante em conversação"],
  ["en el mercado en conversación", "no mercado em conversação"],
  ["en el médico en conversación", "no médico em conversação"],
  ["habilidades de en el restaurante", "as habilidades do restaurante"],
  ["habilidades de en el mercado", "as habilidades do mercado"],
  ["habilidades de en el médico", "as habilidades do consultório médico"],
  ["Practica ", "Pratique "],
  ["Practica", "Pratique"],
  ["Aplica ", "Aplique "],
  ["Aplica", "Aplique"],
  [" en conversação", " em conversação"],
  [" en conversación", " em conversação"],
  [" en conversas reales", " em conversas reais"],
  [" en contextos da vida real", " em contextos da vida real"],
  [" a meu ao redor", " ao meu redor"],
  [" a nuestro ao redor", " ao nosso redor"],
  ["não restaurante", "no restaurante"],
  ["não mercado", "no mercado"],
  ["não médico", "no médico"],
  ["da casa", "da casa"],
  [" de la ", " da "],
  [" de la", " da"],
  [" de el ", " do "],
  [" de el", " do"],
  [" y ", " e "],
];

const SPANISH_LIKE_TOKEN_TRANSLATIONS = {
  academia: "academia",
  académica: "acadêmica",
  acciones: "ações",
  aplicación: "aplicação",
  abstractos: "abstratos",
  acções: "ações",
  adiós: "tchau",
  ahí: "lá",
  ao: "ao",
  arranques: "começos",
  artículos: "itens",
  ayer: "ontem",
  básicos: "básicos",
  bienestar: "bem-estar",
  buscando: "procurando",
  casi: "quase",
  ciencia: "ciência",
  colores: "cores",
  comunes: "comuns",
  complexos: "complexos",
  complejos: "complexos",
  compra: "compra",
  comprando: "comprando",
  compras: "compras",
  conceptos: "conceitos",
  consejos: "conselhos",
  continuo: "contínuo",
  cuerpo: "corpo",
  cuartos: "cômodos",
  decir: "dizer",
  debería: "deveria",
  debe: "deve",
  deportes: "esportes",
  describiendo: "descrevendo",
  describir: "descrever",
  días: "dias",
  dinero: "dinheiro",
  discurso: "discurso",
  dónde: "onde",
  edades: "idades",
  empezar: "começar",
  espanhol: "espanhol",
  escritura: "escrita",
  está: "está",
  experiencias: "experiências",
  expresar: "expressar",
  expresões: "expressões",
  familiares: "familiares",
  fechas: "datas",
  fome: "fome",
  frecuencia: "frequência",
  frescos: "frescos",
  futuros: "futuros",
  gustos: "preferências",
  haciendo: "fazendo",
  hambre: "fome",
  haré: "farei",
  hasta: "até",
  imprescindibles: "indispensáveis",
  historias: "histórias",
  indirecto: "indireto",
  irregulares: "irregulares",
  laboral: "laboral",
  lenguaje: "linguagem",
  llego: "chego",
  medios: "mídia",
  modismos: "idiomatismos",
  moverte: "se locomover",
  nombres: "nomes",
  negocios: "negócios",
  notícias: "notícias",
  noticias: "notícias",
  opiniones: "opiniões",
  orientarte: "se orientar",
  pasatiempos: "passatempos",
  palabras: "palavras",
  pasos: "passos",
  perfecto: "perfeito",
  personas: "pessoas",
  pidiendo: "pedindo",
  planes: "planos",
  pluscuamperfecto: "pretérito mais-que-perfeito",
  primera: "primeira",
  primeras: "primeiras",
  primeros: "primeiros",
  práctico: "prático",
  precios: "preços",
  pregntar: "perguntar",
  preguntar: "perguntar",
  preguntas: "perguntas",
  perguntas: "perguntas",
  problemas: "questões",
  profesional: "profissional",
  quejas: "reclamações",
  qué: "que",
  rápidas: "rápidas",
  reales: "reais",
  regionales: "regionais",
  reportes: "relatórios",
  ropa: "roupa",
  rutina: "rotina",
  salud: "saúde",
  sociales: "sociais",
  subjuntivo: "subjuntivo",
  suma: "adicione",
  telefono: "telefone",
  teléfono: "telefone",
  tecnología: "tecnologia",
  tecnologia: "tecnologia",
  temas: "temas",
  trabajos: "trabalhos",
  tradições: "tradições",
  variações: "variações",
  veintiuno: "vinte e um",
  veinte: "vinte",
  viajes: "viagens",
  voz: "voz",
  cero: "zero",
  cien: "cem",
  y: "e",
};

const SPANISH_LIKE_TOKEN_PATTERN = new RegExp(
  `(?:^|[^\\p{L}\\p{M}])(${Object.keys(SPANISH_LIKE_TOKEN_TRANSLATIONS)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join("|")})(?=$|[^\\p{L}\\p{M}])`,
  "giu",
);

const OBVIOUS_SPANISH_LEAK_PATTERN = new RegExp(
  [
    "Practica",
    "Aplica",
    "Colores",
    "Preguntar",
    "Pidiendo",
    "Haciendo",
    "Primeros",
    "Pasos",
    "Qué",
    "Cómo",
    "Dónde",
    "palabras",
    "hasta",
    "Artículos",
    "conversación",
    "tecnología",
    "Precios",
    "Días",
    "Fechas",
    "gustos",
    "Hambre",
    "Guardarro?pa",
    "Cuartos",
    "Reportes",
    "ayer",
    "viajes",
    "sociales",
    "indirecto",
    "negocios",
    "ciencia",
    "medios",
    "comida y bebidas",
    "personas y",
    "Cómo está el clima",
    "Qué Hora",
    "Qué Día",
    "Dónde Está",
    "Me Gusta",
    "Me Encanta",
    "Lenguaje",
    "Haré",
    "Bienestar",
  ]
    .map(escapeRegex)
    .join("|"),
  "iu",
);

const translateSpanishLikeText = (source) => {
  if (!source || typeof source !== "string") return null;

  const normalizedSource = normalizeKey(source);
  if (SPANISH_LIKE_EXACT[normalizedSource]) {
    return SPANISH_LIKE_EXACT[normalizedSource];
  }

  let translated = compactWhitespace(source);

  SPANISH_LIKE_PHRASE_REPLACEMENTS.forEach(([needle, replacement]) => {
    translated = translated.replaceAll(needle, replacement);
  });

  translated = translated.replace(
    SPANISH_LIKE_TOKEN_PATTERN,
    (match, token, offset, full) => {
      const prefix =
        offset > 0 && /[^\p{L}\p{M}]/u.test(full.charAt(offset - 1))
          ? full.charAt(offset - 1)
          : "";
      const replacement = SPANISH_LIKE_TOKEN_TRANSLATIONS[
        token.toLocaleLowerCase("pt-BR")
      ];
      const translatedToken = applySourceCase(token, replacement || token);
      return `${prefix}${translatedToken}`;
    },
  );

  translated = translated
    .replace(/\bdo restaurante\b/giu, "do restaurante")
    .replace(/\bda casa\b/giu, "da casa")
    .replace(/\bdo médico\b/giu, "do médico")
    .replace(/\bde restaurante\b/giu, "do restaurante")
    .replace(/\bde médico\b/giu, "do médico")
    .replace(/\bde mercado\b/giu, "do mercado");

  return compactWhitespace(translated);
};

const getMapCandidate = (value) => {
  if (!value) return null;
  return PORTUGUESE_SKILLTREE_TEXT_MAP[normalizeKey(value)] || null;
};

const getSafePortugueseCandidate = (
  englishText,
  _spanishText,
  candidate,
  { allowEnglishMatch = false } = {},
) => {
  if (!candidate || typeof candidate !== "string") return null;
  const cleaned = compactWhitespace(candidate);
  if (!cleaned) return null;
  if (!allowEnglishMatch && normalizeKey(cleaned) === normalizeKey(englishText)) {
    return null;
  }
  if (OBVIOUS_SPANISH_LEAK_PATTERN.test(cleaned)) {
    return null;
  }
  return cleaned;
};

const shouldReplacePortugueseText = (englishText, portugueseText) => {
  if (typeof portugueseText !== "string") return true;
  const cleaned = compactWhitespace(portugueseText);
  if (!cleaned) return true;
  if (normalizeKey(cleaned) === normalizeKey(englishText)) return true;
  return OBVIOUS_SPANISH_LEAK_PATTERN.test(cleaned);
};

export const translateSkillTreeTextToPortuguese = (
  englishText,
  spanishText = englishText,
) => {
  const source = spanishText || englishText;
  if (!source || typeof source !== "string") return englishText;

  const candidates = [
    PORTUGUESE_SKILLTREE_EXACT[normalizeKey(englishText)],
    PORTUGUESE_SKILLTREE_EXACT[normalizeKey(source)],
    translateSpanishLikeText(getMapCandidate(source)),
    translateSpanishLikeText(source),
  ];

  for (const candidate of candidates) {
    const safeCandidate = getSafePortugueseCandidate(
      englishText,
      source,
      candidate,
    );
    if (safeCandidate) return safeCandidate;
  }

  return englishText;
};

const addPortugueseText = (value) => {
  if (Array.isArray(value)) return value.map(addPortugueseText);
  if (!value || typeof value !== "object") return value;

  const localized = Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, addPortugueseText(child)]),
  );

  if (
    typeof value.en === "string" &&
    typeof value.es === "string" &&
    shouldReplacePortugueseText(value.en, value.pt)
  ) {
    localized.pt = translateSkillTreeTextToPortuguese(value.en, value.es);
  }

  const successCriteriaSource =
    value.successCriteria_pt ||
    value.successCriteria_es ||
    value.successCriteria ||
    null;
  if (
    typeof successCriteriaSource === "string" &&
    shouldReplacePortugueseText(
      value.successCriteria,
      value.successCriteria_pt,
    )
  ) {
    localized.successCriteria_pt = translateSkillTreeTextToPortuguese(
      value.successCriteria,
      value.successCriteria_es || successCriteriaSource,
    );
  }

  return localized;
};

export const withPortugueseSkillTreeText = (skillTree) =>
  addPortugueseText(skillTree);
