export const REVIEW_WORLD_ID = "lessonWorld";

const SUPPORTED_DECOR_KINDS = [
  "grass_tuft",
  "flower_patch",
  "stones",
  "wood_scraps",
  "paper_bits",
  "confetti",
  "leaf_litter",
  "floor_marks",
  "book_pages",
];

const SUPPORTED_OBJECT_TYPES = [
  "tree",
  "bench",
  "counter",
  "stove",
  "fridge",
  "shelf",
  "register",
  "freezer",
  "tv",
  "sofa",
  "plant",
  "table",
  "lamp",
  "sign",
  "gate",
  "speaker",
  "balloons",
  "desk",
  "bookshelf",
  "suitcaseStack",
  "house",
  "building",
  "pavilion",
  "greenhouse",
  "doorway",
];

const OBJECT_TYPE_ALIASES = {
  books: "bookshelf",
  bookshelf: "bookshelf",
  bookshelves: "bookshelf",
  couch: "sofa",
  sofa: "sofa",
  television: "tv",
  luggage: "suitcaseStack",
  suitcase: "suitcaseStack",
  suitcases: "suitcaseStack",
  suitcase_stack: "suitcaseStack",
  luggage_stack: "suitcaseStack",
  plant: "plant",
  potted_plant: "plant",
  pottedplant: "plant",
  house: "house",
  home: "house",
  apartment: "building",
  apartments: "building",
  building: "building",
  buildings: "building",
  storefront: "building",
  shop: "building",
  office: "building",
  pavilion: "pavilion",
  gazebo: "pavilion",
  shelter: "pavilion",
  greenhouse: "greenhouse",
  conservatory: "greenhouse",
  doorway: "doorway",
  door: "doorway",
  archway: "doorway",
  room: "doorway",
};

const DEFAULT_ZONE_BY_TYPE = {
  tree: "edge",
  bench: "interior",
  counter: "edge",
  stove: "edge",
  fridge: "edge",
  shelf: "edge",
  register: "edge",
  freezer: "edge",
  tv: "edge",
  sofa: "center",
  plant: "interior",
  table: "center",
  lamp: "interior",
  sign: "entrance",
  gate: "entrance",
  speaker: "center",
  balloons: "corner",
  desk: "interior",
  bookshelf: "edge",
  suitcaseStack: "interior",
  house: "entrance",
  building: "entrance",
  pavilion: "entrance",
  greenhouse: "entrance",
  doorway: "entrance",
};

const FILLER_TERM_RE = /(review|comprehensive|mastery|conversation|structures|game|practice|lesson)/i;

const WORLD_BLUEPRINTS = [
  {
    id: "home",
    area: "indoor",
    emoji: "🛋️",
    keywords: [
      "house",
      "home",
      "family",
      "daily routine",
      "routine",
      "common objects",
      "clothing",
    ],
    names: {
      en: ["Cozy Living Room", "Family Apartment", "Neighborhood Home"],
      es: ["Sala Acogedora", "Apartamento Familiar", "Casa del Barrio"],
      it: ["Salotto Accogliente", "Appartamento di Famiglia", "Casa del Quartiere"],
      fr: ["Salon douillet", "Appartement familial", "Maison du quartier"],
      ja: ["居心地のよいリビング", "家族のアパート", "近所の家"],
    },
    summary: {
      en: "a warm home full of everyday objects and lived-in details",
      es: "un hogar calido lleno de objetos cotidianos y detalles reales",
      fr: "un foyer chaleureux rempli d'objets quotidiens et de details vecus",
      ja: "日常の物と暮らしの細部が詰まった温かい家",
    },
    decorKinds: ["wood_scraps", "paper_bits"],
    suggestedObjects: [
      { type: "sofa", zone: "center" },
      { type: "tv", zone: "edge" },
      { type: "table", zone: "center" },
      { type: "lamp", zone: "corner" },
      { type: "plant", zone: "interior" },
      { type: "bookshelf", zone: "edge" },
    ],
    gatherTheme: "home",
    tileTheme: {
      groundColors: [[0xc89b6d, 0xb78456, 0xd4aa7b]],
      groundDetail: "wood_floor",
      pathColors: [[0xa86f43, 0x9b643b]],
      pathDetail: "rug",
      wallColors: [[0xd9c6ae, 0xcbb79d]],
      blockColors: [[0x8b7355, 0x9a7f61]],
      blockDetail: "wall",
      accentColors: [[0xb66aa1, 0xc987b4]],
      accentDetail: "rug",
      objectColors: [[0x8b7355, 0x755d44]],
      objectDetail: "wood_floor",
    },
  },
  {
    id: "market",
    area: "indoor",
    emoji: "🍽️",
    keywords: [
      "food",
      "drinks",
      "restaurant",
      "kitchen",
      "cook",
      "meal",
      "shopping",
      "store",
    ],
    names: {
      en: ["Busy Food Hall", "Neighborhood Kitchen", "Market Cafe"],
      es: ["Comedor Animado", "Cocina del Barrio", "Cafe del Mercado"],
      it: ["Sala da Pranzo Animata", "Cucina del Quartiere", "Caffe del Mercato"],
      fr: ["Halle gourmande animee", "Cuisine du quartier", "Cafe du marche"],
      ja: ["にぎやかなフードホール", "近所のキッチン", "市場カフェ"],
    },
    summary: {
      en: "a lively food space with counters, appliances, and practical props",
      es: "un espacio de comida con mostradores, aparatos y objetos utiles",
      fr: "un espace de restauration vivant avec comptoirs, appareils et accessoires pratiques",
      ja: "カウンター、調理器具、実用的な小物がある活気ある食の空間",
    },
    decorKinds: ["paper_bits", "floor_marks"],
    suggestedObjects: [
      { type: "counter", zone: "edge" },
      { type: "stove", zone: "edge" },
      { type: "fridge", zone: "edge" },
      { type: "shelf", zone: "edge" },
      { type: "table", zone: "center" },
      { type: "plant", zone: "interior" },
      { type: "sign", zone: "entrance" },
    ],
    gatherTheme: "market",
    tileTheme: {
      groundColors: [[0xdad7d1, 0xcecabf]],
      groundDetail: "tile_floor",
      pathColors: [[0xb68c55, 0xc39962]],
      pathDetail: "mat",
      wallColors: [[0xf0e6d6, 0xe2d3bd]],
      blockColors: [[0x9f8054, 0x866845]],
      blockDetail: "wall",
      accentColors: [[0xc45b34, 0xdea15f]],
      accentDetail: "produce",
      objectColors: [[0x8f6b3f, 0x755532]],
      objectDetail: "wood_floor",
    },
  },
  {
    id: "library",
    area: "indoor",
    emoji: "📚",
    keywords: [
      "book",
      "books",
      "library",
      "reading",
      "writing",
      "literature",
      "academic",
      "school",
    ],
    names: {
      en: ["Quiet Library Hall", "Reading Room", "Writers' Archive"],
      es: ["Sala de Biblioteca", "Sala de Lectura", "Archivo de Escritores"],
      it: ["Sala della Biblioteca", "Sala di Lettura", "Archivio degli Scrittori"],
      fr: ["Salle de bibliotheque", "Salle de lecture", "Archives des ecrivains"],
      ja: ["静かな図書館ホール", "読書室", "作家のアーカイブ"],
    },
    summary: {
      en: "a book-filled study space with shelves, desks, and reading corners",
      es: "un espacio de estudio con estantes, escritorios y rincones de lectura",
      fr: "un espace d'etude rempli de livres avec etageres, bureaux et coins lecture",
      ja: "本棚、机、読書コーナーが並ぶ本に囲まれた学習空間",
    },
    decorKinds: ["book_pages", "paper_bits"],
    suggestedObjects: [
      { type: "bookshelf", zone: "edge" },
      { type: "bookshelf", zone: "edge" },
      { type: "desk", zone: "interior" },
      { type: "table", zone: "center" },
      { type: "lamp", zone: "interior" },
      { type: "sign", zone: "entrance" },
      { type: "plant", zone: "corner" },
    ],
    gatherTheme: "library",
    tileTheme: {
      groundColors: [[0xb98857, 0xa77446, 0xc69869]],
      groundDetail: "wood_floor",
      pathColors: [[0x8f3a3a, 0x6f2833]],
      pathDetail: "rug",
      wallColors: [[0xdacfb9, 0xcabda5]],
      blockColors: [[0x6b4d2f, 0x7d5d40]],
      blockDetail: "wall",
      accentColors: [[0xd8c18f, 0xcaa86a]],
      accentDetail: "rug",
      objectColors: [[0x7e6042, 0x65492e]],
      objectDetail: "wood_floor",
    },
  },
  {
    id: "transit",
    area: "urban",
    emoji: "✈️",
    keywords: [
      "travel",
      "airport",
      "directions",
      "transport",
      "trip",
      "passport",
      "ticket",
      "map",
    ],
    names: {
      en: ["International Terminal", "Transit Concourse", "Travel Hub"],
      es: ["Terminal Internacional", "Pasillo de Transito", "Centro de Viaje"],
      it: ["Terminal Internazionale", "Corridoio di Transito", "Centro Viaggi"],
      fr: ["Terminal international", "Hall de transit", "Centre de voyage"],
      ja: ["国際ターミナル", "乗り継ぎコンコース", "旅行ハブ"],
    },
    summary: {
      en: "an international travel space with gates, signs, and waiting areas",
      es: "un espacio de viaje internacional con puertas, letreros y zonas de espera",
      fr: "un espace de voyage international avec portes, panneaux et zones d'attente",
      ja: "ゲート、案内表示、待合エリアがある国際的な旅行空間",
    },
    decorKinds: ["floor_marks", "paper_bits"],
    suggestedObjects: [
      { type: "bench", zone: "interior" },
      { type: "bench", zone: "interior" },
      { type: "sign", zone: "entrance" },
      { type: "gate", zone: "entrance" },
      { type: "counter", zone: "edge" },
      { type: "register", zone: "edge" },
      { type: "suitcaseStack", zone: "interior" },
    ],
    gatherTheme: "transit",
    tileTheme: {
      groundColors: [[0xd5dde5, 0xc9d3dd]],
      groundDetail: "tile_floor",
      pathColors: [[0x7c8b99, 0x6f7d8a]],
      pathDetail: "runway",
      wallColors: [[0xaeb9c4, 0x9caab7]],
      blockColors: [[0x8093a5, 0x6e8092]],
      blockDetail: "wall",
      accentColors: [[0xf0f4f8, 0xdbe5ef]],
      accentDetail: "linoleum",
      objectColors: [[0x8da0b1, 0x738999]],
      objectDetail: "tile_floor",
    },
  },
  {
    id: "nature",
    area: "outdoor",
    emoji: "🌲",
    keywords: [
      "weather",
      "park",
      "forest",
      "nature",
      "animal",
      "garden",
      "health",
      "exercise",
    ],
    names: {
      en: ["Forest Path", "Garden Walk", "Park Clearing"],
      es: ["Sendero del Bosque", "Paseo del Jardin", "Claro del Parque"],
      it: ["Sentiero del Bosco", "Passeggiata nel Giardino", "Radura del Parco"],
      fr: ["Sentier forestier", "Promenade du jardin", "Clairiere du parc"],
      ja: ["森の小道", "庭の散歩道", "公園の広場"],
    },
    summary: {
      en: "an open natural area with winding paths, greenery, and landmarks",
      es: "una zona natural abierta con senderos, vegetacion y puntos de referencia",
      fr: "un espace naturel ouvert avec chemins sinueux, verdure et reperes",
      ja: "曲がりくねった道、緑、目印がある開けた自然エリア",
    },
    decorKinds: ["grass_tuft", "flower_patch", "leaf_litter", "stones"],
    suggestedObjects: [
      { type: "tree", zone: "edge" },
      { type: "tree", zone: "corner" },
      { type: "tree", zone: "edge" },
      { type: "bench", zone: "interior" },
      { type: "sign", zone: "entrance" },
      { type: "plant", zone: "interior" },
    ],
    gatherTheme: "nature",
    tileTheme: {
      groundColors: [[0x6da84d, 0x5e9a42, 0x7bb55a]],
      groundDetail: "grass",
      pathColors: [[0xc8a96e, 0xbf9d63]],
      pathDetail: "dirt",
      wallColors: [[0x7e6a53, 0x6b5946]],
      blockColors: [[0x4b8f38, 0x3f7f2f]],
      blockDetail: "grass",
      accentColors: [[0x6da84d, 0x8bcf68]],
      accentDetail: "flower",
      objectColors: [[0x5d7f44, 0x4c6c39]],
      objectDetail: "grass",
    },
  },
  {
    id: "civic",
    area: "urban",
    emoji: "🏛️",
    keywords: [
      "business",
      "professional",
      "formal",
      "politics",
      "society",
      "debate",
      "social issues",
      "government",
    ],
    names: {
      en: ["Civic Hall", "Conference Atrium", "Public Forum"],
      es: ["Salon Civico", "Atrio de Conferencias", "Foro Publico"],
      it: ["Sala Civica", "Atrio Conferenze", "Foro Pubblico"],
      fr: ["Salle civique", "Atrium de conference", "Forum public"],
      ja: ["市民ホール", "会議アトリウム", "公開フォーラム"],
    },
    summary: {
      en: "a polished public space with desks, signs, and formal meeting points",
      es: "un espacio publico elegante con escritorios, letreros y zonas formales",
      fr: "un espace public soigne avec bureaux, panneaux et points de rencontre formels",
      ja: "机、案内表示、フォーマルな集会場所がある整った公共空間",
    },
    decorKinds: ["paper_bits", "floor_marks", "stones"],
    suggestedObjects: [
      { type: "desk", zone: "interior" },
      { type: "table", zone: "center" },
      { type: "lamp", zone: "interior" },
      { type: "sign", zone: "entrance" },
      { type: "bookshelf", zone: "edge" },
      { type: "speaker", zone: "center" },
      { type: "plant", zone: "corner" },
    ],
    gatherTheme: "civic",
    tileTheme: {
      groundColors: [[0xd5d1c7, 0xc7c2b8]],
      groundDetail: "tile_floor",
      pathColors: [[0xa79b8a, 0x958877]],
      pathDetail: "gravel",
      wallColors: [[0xb9b2a5, 0xa59b8c]],
      blockColors: [[0x8c8375, 0x766d60]],
      blockDetail: "wall",
      accentColors: [[0x6f8095, 0x8395ad]],
      accentDetail: "linoleum",
      objectColors: [[0x76695a, 0x615446]],
      objectDetail: "wood_floor",
    },
  },
  {
    id: "lab",
    area: "indoor",
    emoji: "🔬",
    keywords: [
      "science",
      "innovation",
      "technology",
      "research",
      "experiment",
      "analysis",
    ],
    names: {
      en: ["Research Lab", "Innovation Studio", "Science Workshop"],
      es: ["Laboratorio de Investigacion", "Estudio de Innovacion", "Taller Cientifico"],
      it: ["Laboratorio di Ricerca", "Studio di Innovazione", "Laboratorio Scientifico"],
      fr: ["Laboratoire de recherche", "Studio d'innovation", "Atelier scientifique"],
      ja: ["研究ラボ", "イノベーションスタジオ", "科学ワークショップ"],
    },
    summary: {
      en: "a clean technical space with equipment, storage, and study stations",
      es: "un espacio tecnico con equipo, almacenamiento y estaciones de trabajo",
      fr: "un espace technique propre avec equipement, rangement et postes d'etude",
      ja: "設備、収納、学習ステーションがある清潔な技術空間",
    },
    decorKinds: ["floor_marks", "paper_bits"],
    suggestedObjects: [
      { type: "freezer", zone: "edge" },
      { type: "shelf", zone: "edge" },
      { type: "desk", zone: "interior" },
      { type: "table", zone: "center" },
      { type: "lamp", zone: "interior" },
      { type: "sign", zone: "entrance" },
    ],
    gatherTheme: "lab",
    tileTheme: {
      groundColors: [[0xdfe6ec, 0xd1dbe3]],
      groundDetail: "linoleum",
      pathColors: [[0x9fb3c7, 0x8ea2b7]],
      pathDetail: "tile_floor",
      wallColors: [[0xbfcbd7, 0xafbcc9]],
      blockColors: [[0x8ca0b4, 0x768b9f]],
      blockDetail: "wall",
      accentColors: [[0xc9eef2, 0xb5dfe5]],
      accentDetail: "linoleum",
      objectColors: [[0x8ea0aa, 0x74868f]],
      objectDetail: "tile_floor",
    },
  },
  {
    id: "festival",
    area: "urban",
    emoji: "🎉",
    keywords: [
      "culture",
      "music",
      "art",
      "party",
      "celebration",
      "social",
      "community",
    ],
    names: {
      en: ["Festival Plaza", "Celebration Terrace", "Street Party"],
      es: ["Plaza del Festival", "Terraza de Celebracion", "Fiesta en la Calle"],
      it: ["Piazza del Festival", "Terrazza delle Celebrazioni", "Festa in Strada"],
      fr: ["Place du festival", "Terrasse des celebrations", "Fete de rue"],
      ja: ["祭りの広場", "お祝いテラス", "ストリートパーティー"],
    },
    summary: {
      en: "a colorful social space with sound, decorations, and event energy",
      es: "un espacio social colorido con sonido, decoracion y energia de evento",
      fr: "un espace social colore avec musique, decorations et energie d'evenement",
      ja: "音、飾り、イベントの熱気に満ちた色鮮やかな交流空間",
    },
    decorKinds: ["confetti", "flower_patch", "paper_bits"],
    suggestedObjects: [
      { type: "speaker", zone: "center" },
      { type: "balloons", zone: "corner" },
      { type: "table", zone: "center" },
      { type: "bench", zone: "interior" },
      { type: "sign", zone: "entrance" },
      { type: "plant", zone: "interior" },
    ],
    gatherTheme: "festival",
    tileTheme: {
      groundColors: [[0xd0bf9b, 0xc3b08b]],
      groundDetail: "gravel",
      pathColors: [[0xc56b5d, 0xe08c65]],
      pathDetail: "mat",
      wallColors: [[0xaf8ea2, 0x9b7a90]],
      blockColors: [[0x7c5973, 0x684962]],
      blockDetail: "wall",
      accentColors: [[0xffd166, 0xff8fab, 0x7dd3fc]],
      accentDetail: "flower",
      objectColors: [[0x8b6e50, 0x715840]],
      objectDetail: "wood_floor",
    },
  },
];

const WORLD_BLUEPRINTS_PT = [
  {
    names: ["Sala Aconchegante", "Apartamento da Família", "Casa do Bairro"],
    summary: "um lar acolhedor cheio de objetos do dia a dia e detalhes reais",
  },
  {
    names: ["Refeitório Animado", "Cozinha do Bairro", "Café do Mercado"],
    summary: "um espaço de comida com balcões, aparelhos e objetos úteis",
  },
  {
    names: ["Sala da Biblioteca", "Sala de Leitura", "Arquivo dos Escritores"],
    summary: "um espaço de estudo com estantes, mesas e cantinhos de leitura",
  },
  {
    names: ["Terminal Internacional", "Corredor de Trânsito", "Centro de Viagem"],
    summary: "um espaço de viagem internacional com portões, placas e áreas de espera",
  },
  {
    names: ["Trilha da Floresta", "Passeio do Jardim", "Clareira do Parque"],
    summary: "uma área natural aberta com trilhas, vegetação e pontos de referência",
  },
  {
    names: ["Salão Cívico", "Átrio de Conferências", "Fórum Público"],
    summary: "um espaço público elegante com mesas, placas e áreas formais",
  },
  {
    names: ["Laboratório de Pesquisa", "Estúdio de Inovação", "Oficina Científica"],
    summary: "um espaço técnico com equipamentos, armazenamento e estações de trabalho",
  },
  {
    names: ["Praça do Festival", "Terraço da Celebração", "Festa na Rua"],
    summary: "um espaço social colorido com som, decoração e energia de evento",
  },
];

WORLD_BLUEPRINTS.forEach((blueprint, index) => {
  const pt = WORLD_BLUEPRINTS_PT[index];
  if (!pt) return;
  blueprint.names.pt = blueprint.names.pt || pt.names;
  blueprint.summary.pt = blueprint.summary.pt || pt.summary;
});

const GATHER_POOLS_BY_THEME = {
  home: {
    es: {
      correct: [
        { name: "la llave dorada", hint: "Busca cerca de los muebles.", sprite: "key" },
        { name: "el libro antiguo", hint: "Mira junto al estante.", sprite: "book" },
        { name: "la carta sellada", hint: "Revisa cerca de la puerta.", sprite: "letter" },
      ],
      decoys: [
        { name: "el jarron roto", sprite: "vase" },
        { name: "la cuchara vieja", sprite: "spoon" },
        { name: "el boton suelto", sprite: "button" },
        { name: "la vela derretida", sprite: "candle" },
        { name: "el reloj parado", sprite: "clock" },
        { name: "la taza agrietada", sprite: "cup" },
        { name: "el cojin viejo", sprite: "cushion" },
        { name: "el marco vacio", sprite: "frame" },
        { name: "las tijeras oxidadas", sprite: "scissors" },
        { name: "la moneda antigua", sprite: "coin" },
      ],
    },
    en: {
      correct: [
        { name: "the golden key", hint: "Look near the furniture.", sprite: "key" },
        { name: "the old book", hint: "Check beside the shelf.", sprite: "book" },
        { name: "the sealed letter", hint: "Search near the door.", sprite: "letter" },
      ],
      decoys: [
        { name: "the broken vase", sprite: "vase" },
        { name: "the old spoon", sprite: "spoon" },
        { name: "the loose button", sprite: "button" },
        { name: "the melted candle", sprite: "candle" },
        { name: "the stopped clock", sprite: "clock" },
        { name: "the cracked cup", sprite: "cup" },
        { name: "the old cushion", sprite: "cushion" },
        { name: "the empty frame", sprite: "frame" },
        { name: "the rusty scissors", sprite: "scissors" },
        { name: "the old coin", sprite: "coin" },
      ],
    },
  },
  market: {
    es: {
      correct: [
        { name: "la botella fria", hint: "Busca cerca del refrigerador.", sprite: "bottle" },
        { name: "la cuchara limpia", hint: "Revisa junto a la mesa.", sprite: "spoon" },
        { name: "la taza favorita", hint: "Mira cerca del mostrador.", sprite: "cup" },
      ],
      decoys: [
        { name: "el recibo arrugado", sprite: "receipt" },
        { name: "el folleto viejo", sprite: "brochure" },
        { name: "la tarjeta doblada", sprite: "card" },
        { name: "la moneda perdida", sprite: "coin" },
        { name: "el mapa doblado", sprite: "map" },
        { name: "el boton suelto", sprite: "button" },
        { name: "la botella vacia", sprite: "bottle" },
        { name: "la taza agrietada", sprite: "cup" },
        { name: "la cuchara vieja", sprite: "spoon" },
        { name: "la vela derretida", sprite: "candle" },
      ],
    },
    en: {
      correct: [
        { name: "the cold bottle", hint: "Look near the fridge.", sprite: "bottle" },
        { name: "the clean spoon", hint: "Check beside the table.", sprite: "spoon" },
        { name: "the favorite cup", hint: "Search near the counter.", sprite: "cup" },
      ],
      decoys: [
        { name: "the crumpled receipt", sprite: "receipt" },
        { name: "the old brochure", sprite: "brochure" },
        { name: "the folded card", sprite: "card" },
        { name: "the lost coin", sprite: "coin" },
        { name: "the folded map", sprite: "map" },
        { name: "the loose button", sprite: "button" },
        { name: "the empty bottle", sprite: "bottle" },
        { name: "the cracked cup", sprite: "cup" },
        { name: "the old spoon", sprite: "spoon" },
        { name: "the melted candle", sprite: "candle" },
      ],
    },
  },
  library: {
    es: {
      correct: [
        { name: "el libro de referencia", hint: "Busca junto a los estantes.", sprite: "book" },
        { name: "la tarjeta de biblioteca", hint: "Revisa sobre un escritorio.", sprite: "card" },
        { name: "la nota doblada", hint: "Mira cerca de la lampara.", sprite: "letter" },
      ],
      decoys: [
        { name: "la moneda antigua", sprite: "coin" },
        { name: "las tijeras oxidadas", sprite: "scissors" },
        { name: "el marco vacio", sprite: "frame" },
        { name: "la botella vacia", sprite: "bottle" },
        { name: "el mapa doblado", sprite: "map" },
        { name: "el folleto viejo", sprite: "brochure" },
        { name: "el recibo arrugado", sprite: "receipt" },
        { name: "la taza agrietada", sprite: "cup" },
        { name: "el reloj parado", sprite: "clock" },
        { name: "el boton suelto", sprite: "button" },
      ],
    },
    en: {
      correct: [
        { name: "the reference book", hint: "Look beside the shelves.", sprite: "book" },
        { name: "the library card", hint: "Check on top of a desk.", sprite: "card" },
        { name: "the folded note", hint: "Search near the lamp.", sprite: "letter" },
      ],
      decoys: [
        { name: "the old coin", sprite: "coin" },
        { name: "the rusty scissors", sprite: "scissors" },
        { name: "the empty frame", sprite: "frame" },
        { name: "the empty bottle", sprite: "bottle" },
        { name: "the folded map", sprite: "map" },
        { name: "the old brochure", sprite: "brochure" },
        { name: "the crumpled receipt", sprite: "receipt" },
        { name: "the cracked cup", sprite: "cup" },
        { name: "the stopped clock", sprite: "clock" },
        { name: "the loose button", sprite: "button" },
      ],
    },
  },
  transit: {
    es: {
      correct: [
        { name: "el pasaporte perdido", hint: "Alguien lo dejo en una banca.", sprite: "passport" },
        { name: "la etiqueta de equipaje", hint: "Busca cerca del mostrador.", sprite: "tag" },
        { name: "el boleto valido", hint: "Mira junto a la puerta.", sprite: "ticket" },
      ],
      decoys: [
        { name: "el recibo arrugado", sprite: "receipt" },
        { name: "la tarjeta vencida", sprite: "card" },
        { name: "el folleto viejo", sprite: "brochure" },
        { name: "los audifonos rotos", sprite: "headphones" },
        { name: "la botella vacia", sprite: "bottle" },
        { name: "el mapa doblado", sprite: "map" },
        { name: "la maleta rota", sprite: "suitcase" },
        { name: "el llavero perdido", sprite: "keychain" },
        { name: "las gafas de sol", sprite: "sunglasses" },
        { name: "el cargador viejo", sprite: "charger" },
      ],
    },
    en: {
      correct: [
        { name: "the lost passport", hint: "Someone left it on a bench.", sprite: "passport" },
        { name: "the luggage tag", hint: "Look near the counter.", sprite: "tag" },
        { name: "the valid ticket", hint: "Search beside the gate.", sprite: "ticket" },
      ],
      decoys: [
        { name: "the crumpled receipt", sprite: "receipt" },
        { name: "the expired card", sprite: "card" },
        { name: "the old brochure", sprite: "brochure" },
        { name: "the broken headphones", sprite: "headphones" },
        { name: "the empty bottle", sprite: "bottle" },
        { name: "the folded map", sprite: "map" },
        { name: "the broken suitcase", sprite: "suitcase" },
        { name: "the lost keychain", sprite: "keychain" },
        { name: "the sunglasses", sprite: "sunglasses" },
        { name: "the old charger", sprite: "charger" },
      ],
    },
  },
  nature: {
    es: {
      correct: [
        { name: "la flor rara", hint: "Crece entre los arboles.", sprite: "flower" },
        { name: "la piedra brillante", hint: "Esta escondida en el camino.", sprite: "stone" },
        { name: "la pluma azul", hint: "Busca cerca del banco.", sprite: "feather" },
      ],
      decoys: [
        { name: "la hoja seca", sprite: "leaf" },
        { name: "la rama torcida", sprite: "branch" },
        { name: "el caracol vacio", sprite: "shell" },
        { name: "la bellota", sprite: "acorn" },
        { name: "el hongo rojo", sprite: "mushroom" },
        { name: "la pina caida", sprite: "pinecone" },
        { name: "la mariposa seca", sprite: "butterfly" },
        { name: "el nido abandonado", sprite: "nest" },
        { name: "la rana de piedra", sprite: "frog_statue" },
        { name: "la semilla extrana", sprite: "seed" },
      ],
    },
    en: {
      correct: [
        { name: "the rare flower", hint: "It grows among the trees.", sprite: "flower" },
        { name: "the shiny stone", hint: "It is hidden on the path.", sprite: "stone" },
        { name: "the blue feather", hint: "Look near the bench.", sprite: "feather" },
      ],
      decoys: [
        { name: "the dry leaf", sprite: "leaf" },
        { name: "the crooked branch", sprite: "branch" },
        { name: "the empty shell", sprite: "shell" },
        { name: "the acorn", sprite: "acorn" },
        { name: "the red mushroom", sprite: "mushroom" },
        { name: "the fallen pinecone", sprite: "pinecone" },
        { name: "the dried butterfly", sprite: "butterfly" },
        { name: "the abandoned nest", sprite: "nest" },
        { name: "the stone frog", sprite: "frog_statue" },
        { name: "the strange seed", sprite: "seed" },
      ],
    },
  },
  civic: {
    es: {
      correct: [
        { name: "la credencial oficial", hint: "Busca sobre una mesa.", sprite: "card" },
        { name: "el informe doblado", hint: "Revisa cerca del escritorio.", sprite: "brochure" },
        { name: "la carta firmada", hint: "Mira junto al letrero.", sprite: "letter" },
      ],
      decoys: [
        { name: "el recibo arrugado", sprite: "receipt" },
        { name: "el cargador viejo", sprite: "charger" },
        { name: "la botella vacia", sprite: "bottle" },
        { name: "el mapa doblado", sprite: "map" },
        { name: "las gafas de sol", sprite: "sunglasses" },
        { name: "los audifonos rotos", sprite: "headphones" },
        { name: "la moneda antigua", sprite: "coin" },
        { name: "el libro viejo", sprite: "book" },
        { name: "el reloj parado", sprite: "clock" },
        { name: "el boton suelto", sprite: "button" },
      ],
    },
    en: {
      correct: [
        { name: "the official badge", hint: "Look on top of a table.", sprite: "card" },
        { name: "the folded report", hint: "Check near the desk.", sprite: "brochure" },
        { name: "the signed letter", hint: "Search beside the sign.", sprite: "letter" },
      ],
      decoys: [
        { name: "the crumpled receipt", sprite: "receipt" },
        { name: "the old charger", sprite: "charger" },
        { name: "the empty bottle", sprite: "bottle" },
        { name: "the folded map", sprite: "map" },
        { name: "the sunglasses", sprite: "sunglasses" },
        { name: "the broken headphones", sprite: "headphones" },
        { name: "the old coin", sprite: "coin" },
        { name: "the old book", sprite: "book" },
        { name: "the stopped clock", sprite: "clock" },
        { name: "the loose button", sprite: "button" },
      ],
    },
  },
  lab: {
    es: {
      correct: [
        { name: "el cargador rapido", hint: "Busca cerca del equipo.", sprite: "charger" },
        { name: "la tarjeta tecnica", hint: "Mira sobre una mesa.", sprite: "card" },
        { name: "la botella sellada", hint: "Revisa junto al congelador.", sprite: "bottle" },
      ],
      decoys: [
        { name: "el folleto viejo", sprite: "brochure" },
        { name: "el mapa doblado", sprite: "map" },
        { name: "el recibo arrugado", sprite: "receipt" },
        { name: "las gafas de sol", sprite: "sunglasses" },
        { name: "la moneda antigua", sprite: "coin" },
        { name: "el libro viejo", sprite: "book" },
        { name: "el boton suelto", sprite: "button" },
        { name: "la taza agrietada", sprite: "cup" },
        { name: "el reloj parado", sprite: "clock" },
        { name: "el llavero perdido", sprite: "keychain" },
      ],
    },
    en: {
      correct: [
        { name: "the fast charger", hint: "Look near the equipment.", sprite: "charger" },
        { name: "the technical card", hint: "Search on top of a table.", sprite: "card" },
        { name: "the sealed bottle", hint: "Check beside the freezer.", sprite: "bottle" },
      ],
      decoys: [
        { name: "the old brochure", sprite: "brochure" },
        { name: "the folded map", sprite: "map" },
        { name: "the crumpled receipt", sprite: "receipt" },
        { name: "the sunglasses", sprite: "sunglasses" },
        { name: "the old coin", sprite: "coin" },
        { name: "the old book", sprite: "book" },
        { name: "the loose button", sprite: "button" },
        { name: "the cracked cup", sprite: "cup" },
        { name: "the stopped clock", sprite: "clock" },
        { name: "the lost keychain", sprite: "keychain" },
      ],
    },
  },
  festival: {
    es: {
      correct: [
        { name: "el boleto brillante", hint: "Busca cerca del escenario.", sprite: "ticket" },
        { name: "los audifonos buenos", hint: "Mira junto al altavoz.", sprite: "headphones" },
        { name: "la moneda especial", hint: "Revisa cerca de una mesa.", sprite: "coin" },
      ],
      decoys: [
        { name: "la botella vacia", sprite: "bottle" },
        { name: "el folleto viejo", sprite: "brochure" },
        { name: "las gafas de sol", sprite: "sunglasses" },
        { name: "el recibo arrugado", sprite: "receipt" },
        { name: "el cargador viejo", sprite: "charger" },
        { name: "el mapa doblado", sprite: "map" },
        { name: "la tarjeta perdida", sprite: "card" },
        { name: "el llavero perdido", sprite: "keychain" },
        { name: "la taza agrietada", sprite: "cup" },
        { name: "el boton suelto", sprite: "button" },
      ],
    },
    en: {
      correct: [
        { name: "the shiny ticket", hint: "Look near the stage.", sprite: "ticket" },
        { name: "the good headphones", hint: "Check beside the speaker.", sprite: "headphones" },
        { name: "the special coin", hint: "Search near a table.", sprite: "coin" },
      ],
      decoys: [
        { name: "the empty bottle", sprite: "bottle" },
        { name: "the old brochure", sprite: "brochure" },
        { name: "the sunglasses", sprite: "sunglasses" },
        { name: "the crumpled receipt", sprite: "receipt" },
        { name: "the old charger", sprite: "charger" },
        { name: "the folded map", sprite: "map" },
        { name: "the lost card", sprite: "card" },
        { name: "the lost keychain", sprite: "keychain" },
        { name: "the cracked cup", sprite: "cup" },
        { name: "the loose button", sprite: "button" },
      ],
    },
  },
};

function safeHex(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.trim().replace(/^#/, "");
    const parsed = Number.parseInt(cleaned, 16);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function clampInt(value, min, max, fallback) {
  const num = Number.isFinite(Number(value)) ? Number(value) : fallback;
  return Math.max(min, Math.min(max, Math.round(num)));
}

function uniqueStrings(items = []) {
  return Array.from(
    new Set(
      items
        .filter(Boolean)
        .map((item) => String(item).trim())
        .filter(Boolean),
    ),
  );
}

function pickRandom(list = []) {
  return list[Math.floor(Math.random() * list.length)];
}

function normalizeObjectType(type) {
  const raw = String(type || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
  if (!raw) return null;
  const aliased = OBJECT_TYPE_ALIASES[raw] || raw;
  return SUPPORTED_OBJECT_TYPES.includes(aliased) ? aliased : null;
}

function normalizeObjectSpec(spec) {
  if (!spec) return null;
  if (typeof spec === "string") {
    const type = normalizeObjectType(spec);
    if (!type) return null;
    return { type, zone: DEFAULT_ZONE_BY_TYPE[type] || "interior" };
  }
  const type = normalizeObjectType(spec.type || spec.name || spec.object);
  if (!type) return null;
  return {
    type,
    zone: String(spec.zone || DEFAULT_ZONE_BY_TYPE[type] || "interior"),
    tx: spec.tx,
    ty: spec.ty,
  };
}

function pickCoreLessonTerm(lessonTerms = []) {
  const filtered = uniqueStrings(lessonTerms).filter(
    (term) => !FILLER_TERM_RE.test(term),
  );
  return filtered.sort((a, b) => b.length - a.length)[0] || "everyday language";
}

export function buildLessonWorldSeed(lessonTerms = [], { mapId = REVIEW_WORLD_ID } = {}) {
  if (mapId !== REVIEW_WORLD_ID) return null;

  const normalizedTerms = uniqueStrings(lessonTerms).map((term) =>
    String(term).toLowerCase(),
  );
  const joined = normalizedTerms.join(" ");
  const coreTerm = pickCoreLessonTerm(lessonTerms);

  let bestScore = -1;
  let bestBlueprint = WORLD_BLUEPRINTS[0];

  WORLD_BLUEPRINTS.forEach((blueprint) => {
    const score = blueprint.keywords.reduce((total, keyword) => {
      if (joined.includes(keyword)) return total + 3;
      return total;
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      bestBlueprint = blueprint;
    }
  });

  return {
    ...bestBlueprint,
    coreTerm,
    promptHint: `Lesson focus: ${coreTerm}. Invent a unique ${bestBlueprint.area} world that naturally fits that subject.`,
  };
}

function sanitizeDecorKinds(kinds) {
  return uniqueStrings(kinds).filter((kind) =>
    SUPPORTED_DECOR_KINDS.includes(String(kind)),
  );
}

function mergeObjectPlans(seedObjects = [], rawObjects = []) {
  const normalizedSeed = seedObjects.map(normalizeObjectSpec).filter(Boolean);
  const normalizedRaw = rawObjects.map(normalizeObjectSpec).filter(Boolean);
  if (!normalizedRaw.length) return normalizedSeed.slice(0, 10);

  const merged = [...normalizedRaw];
  while (merged.length < 6 && normalizedSeed.length > merged.length) {
    merged.push(normalizedSeed[merged.length]);
  }
  return merged.slice(0, 10);
}

export function buildScenarioEnvironment(
  rawEnvironment,
  lessonTerms = [],
  mapId = REVIEW_WORLD_ID,
) {
  const seed = buildLessonWorldSeed(lessonTerms, { mapId });
  if (!seed) return null;

  const rawDecorKinds = sanitizeDecorKinds(rawEnvironment?.decorKinds || []);
  const rawObjects = Array.isArray(rawEnvironment?.keyObjects)
    ? rawEnvironment.keyObjects
    : Array.isArray(rawEnvironment?.objects)
      ? rawEnvironment.objects
      : [];

  const details = uniqueStrings(rawEnvironment?.details || rawEnvironment?.landmarks).slice(
    0,
    6,
  );

  const themeLabelEn =
    String(rawEnvironment?.themeLabel?.en || rawEnvironment?.name?.en || "")
      .trim() || pickRandom(seed.names.en);
  const themeLabelEs =
    String(rawEnvironment?.themeLabel?.es || rawEnvironment?.name?.es || "")
      .trim() || pickRandom(seed.names.es);
  const themeLabelIt =
    String(rawEnvironment?.themeLabel?.it || rawEnvironment?.name?.it || "")
      .trim() || pickRandom(seed.names.it || seed.names.en);
  const themeLabelFr =
    String(rawEnvironment?.themeLabel?.fr || rawEnvironment?.name?.fr || "")
      .trim() || pickRandom(seed.names.fr || seed.names.en);
  const themeLabelJa =
    String(rawEnvironment?.themeLabel?.ja || rawEnvironment?.name?.ja || "")
      .trim() || pickRandom(seed.names.ja || seed.names.en);

  return {
    blueprintId: seed.id,
    area: seed.area,
    emoji: String(rawEnvironment?.emoji || seed.emoji).trim() || seed.emoji,
    names: {
      en: themeLabelEn,
      es: themeLabelEs,
      it: themeLabelIt,
      fr: themeLabelFr,
      ja: themeLabelJa,
    },
    summary: {
      en:
        String(rawEnvironment?.summary?.en || rawEnvironment?.summary || "").trim() ||
        seed.summary.en,
      es:
        String(rawEnvironment?.summary?.es || "").trim() || seed.summary.es,
      it:
        String(rawEnvironment?.summary?.it || "").trim() ||
        seed.summary.it ||
        seed.summary.en,
      fr:
        String(rawEnvironment?.summary?.fr || "").trim() ||
        seed.summary.fr ||
        seed.summary.en,
      ja:
        String(rawEnvironment?.summary?.ja || "").trim() ||
        seed.summary.ja ||
        seed.summary.en,
    },
    details,
    decorKinds: rawDecorKinds.length ? rawDecorKinds : seed.decorKinds,
    suggestedObjects: mergeObjectPlans(seed.suggestedObjects, rawObjects),
    gatherTheme: seed.gatherTheme,
    tileTheme: seed.tileTheme,
    promptHint: seed.promptHint,
  };
}

export function buildDynamicTileLibrary(environment) {
  const theme = environment?.tileTheme || WORLD_BLUEPRINTS[0].tileTheme;
  return {
    0: {
      name: "ground",
      solid: false,
      colors: theme.groundColors,
      detail: theme.groundDetail,
    },
    1: {
      name: "path",
      solid: false,
      colors: theme.pathColors,
      detail: theme.pathDetail,
    },
    2: {
      name: "void",
      solid: true,
      void: true,
      colors: theme.wallColors,
      detail: "wall",
    },
    3: {
      name: "barrier",
      solid: true,
      colors: theme.blockColors,
      detail: theme.blockDetail,
    },
    4: {
      name: "obstacle",
      solid: true,
      colors: theme.accentColors,
      detail: theme.accentDetail,
    },
    5: {
      name: "decor",
      solid: false,
      colors: theme.accentColors,
      detail: theme.accentDetail,
    },
    6: {
      name: "furniture",
      solid: true,
      colors: theme.objectColors,
      detail: theme.objectDetail,
    },
  };
}

function randomPositionForZone(zone, mapWidth, mapHeight) {
  const centerX = Math.floor(mapWidth / 2);
  const centerY = Math.floor(mapHeight / 2);

  switch (zone) {
    case "edge": {
      const side = Math.floor(Math.random() * 4);
      if (side === 0) return { tx: 1 + Math.floor(Math.random() * (mapWidth - 2)), ty: 1 };
      if (side === 1) {
        return {
          tx: 1 + Math.floor(Math.random() * (mapWidth - 2)),
          ty: mapHeight - 2,
        };
      }
      if (side === 2) return { tx: 1, ty: 1 + Math.floor(Math.random() * (mapHeight - 2)) };
      return {
        tx: mapWidth - 2,
        ty: 1 + Math.floor(Math.random() * (mapHeight - 2)),
      };
    }
    case "corner": {
      const corners = [
        { tx: 2, ty: 2 },
        { tx: mapWidth - 3, ty: 2 },
        { tx: 2, ty: mapHeight - 3 },
        { tx: mapWidth - 3, ty: mapHeight - 3 },
      ];
      return pickRandom(corners);
    }
    case "entrance":
      return {
        tx: clampInt(centerX + Math.floor((Math.random() - 0.5) * 4), 2, mapWidth - 3, centerX),
        ty: mapHeight - 3,
      };
    case "center":
      return {
        tx: clampInt(centerX + Math.floor((Math.random() - 0.5) * 6), 2, mapWidth - 3, centerX),
        ty: clampInt(centerY + Math.floor((Math.random() - 0.5) * 4), 2, mapHeight - 3, centerY),
      };
    default:
      return {
        tx: 2 + Math.floor(Math.random() * Math.max(1, mapWidth - 4)),
        ty: 2 + Math.floor(Math.random() * Math.max(1, mapHeight - 4)),
      };
  }
}

function findOpenObjectPosition(zone, mapWidth, mapHeight, occupied) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const pos = randomPositionForZone(zone, mapWidth, mapHeight);
    if (!occupied.has(`${pos.tx},${pos.ty}`)) return pos;
  }
  return null;
}

export function normalizeScenarioObjects(
  rawObjects,
  environment,
  mapWidth,
  mapHeight,
  occupiedTiles = [],
) {
  const occupied = new Set(occupiedTiles.map(({ tx, ty }) => `${tx},${ty}`));
  const plan = Array.isArray(rawObjects) && rawObjects.length
    ? mergeObjectPlans(environment?.suggestedObjects || [], rawObjects)
    : (environment?.suggestedObjects || []).map(normalizeObjectSpec).filter(Boolean);

  const placed = [];

  plan.forEach((item) => {
    const spec = normalizeObjectSpec(item);
    if (!spec) return;

    let tx = Number.isFinite(Number(spec.tx))
      ? clampInt(spec.tx, 1, mapWidth - 2, 2)
      : null;
    let ty = Number.isFinite(Number(spec.ty))
      ? clampInt(spec.ty, 1, mapHeight - 2, 2)
      : null;

    if (tx == null || ty == null || occupied.has(`${tx},${ty}`)) {
      const fallbackPos = findOpenObjectPosition(
        spec.zone || DEFAULT_ZONE_BY_TYPE[spec.type] || "interior",
        mapWidth,
        mapHeight,
        occupied,
      );
      if (!fallbackPos) return;
      tx = fallbackPos.tx;
      ty = fallbackPos.ty;
    }

    occupied.add(`${tx},${ty}`);
    placed.push({
      type: spec.type,
      tx,
      ty,
      solid: true,
    });
  });

  return placed.slice(0, 12);
}

function setTile(map, mapWidth, mapHeight, x, y, value) {
  if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight) return;
  map[y * mapWidth + x] = value;
}

function sprinkleDecor(map, mapWidth, mapHeight, chance = 0.1) {
  for (let y = 1; y < mapHeight - 1; y++) {
    for (let x = 1; x < mapWidth - 1; x++) {
      const idx = y * mapWidth + x;
      if (map[idx] !== 0 || Math.random() > chance) continue;
      map[idx] = 5;
    }
  }
}

function drawIndoorLayout(map, mapWidth, mapHeight) {
  const centerX = Math.floor(mapWidth / 2);
  const centerY = Math.floor(mapHeight / 2);
  for (let x = 1; x < mapWidth - 1; x++) setTile(map, mapWidth, mapHeight, x, centerY, 1);
  for (let y = 1; y < mapHeight - 1; y++) setTile(map, mapWidth, mapHeight, centerX, y, 1);
  for (let x = 2; x < mapWidth - 2; x += 4) {
    setTile(map, mapWidth, mapHeight, x, 2, 5);
    setTile(map, mapWidth, mapHeight, x, mapHeight - 3, 5);
  }
}

function drawUrbanLayout(map, mapWidth, mapHeight) {
  const midY = Math.floor(mapHeight / 2);
  const leftStreet = Math.floor(mapWidth / 3);
  const rightStreet = Math.floor((mapWidth * 2) / 3);
  for (let x = 1; x < mapWidth - 1; x++) setTile(map, mapWidth, mapHeight, x, midY, 1);
  for (let y = 1; y < mapHeight - 1; y++) {
    setTile(map, mapWidth, mapHeight, leftStreet, y, 1);
    setTile(map, mapWidth, mapHeight, rightStreet, y, 1);
  }
  for (let x = leftStreet - 1; x <= rightStreet + 1; x++) {
    for (let y = midY - 1; y <= midY + 1; y++) setTile(map, mapWidth, mapHeight, x, y, 5);
  }
}

function drawOutdoorLayout(map, mapWidth, mapHeight) {
  let y = Math.floor(mapHeight / 2);
  for (let x = 1; x < mapWidth - 1; x++) {
    if (x % 4 === 0) y = clampInt(y + (Math.random() > 0.5 ? 1 : -1), 2, mapHeight - 3, y);
    setTile(map, mapWidth, mapHeight, x, y, 1);
    if (Math.random() > 0.6) setTile(map, mapWidth, mapHeight, x, clampInt(y + 1, 1, mapHeight - 2, y), 1);
  }
  const centerX = Math.floor(mapWidth / 2);
  for (let pathY = 1; pathY < mapHeight - 1; pathY++) {
    if (Math.abs(pathY - y) < 2) continue;
    if (pathY % 2 === 0) setTile(map, mapWidth, mapHeight, centerX, pathY, 1);
  }
}

export function buildFallbackMapData({
  mapWidth,
  mapHeight,
  environment,
  playerStart,
  npcs,
  objects,
}) {
  const map = new Array(mapWidth * mapHeight).fill(0);

  for (let x = 0; x < mapWidth; x++) {
    setTile(map, mapWidth, mapHeight, x, 0, 2);
    setTile(map, mapWidth, mapHeight, x, mapHeight - 1, 2);
  }
  for (let y = 0; y < mapHeight; y++) {
    setTile(map, mapWidth, mapHeight, 0, y, 2);
    setTile(map, mapWidth, mapHeight, mapWidth - 1, y, 2);
  }

  if (environment?.area === "outdoor") {
    drawOutdoorLayout(map, mapWidth, mapHeight);
  } else if (environment?.area === "urban") {
    drawUrbanLayout(map, mapWidth, mapHeight);
  } else {
    drawIndoorLayout(map, mapWidth, mapHeight);
  }

  sprinkleDecor(map, mapWidth, mapHeight, environment?.area === "outdoor" ? 0.16 : 0.1);

  objects.forEach((object) => {
    if (!object?.solid) return;
    setTile(map, mapWidth, mapHeight, object.tx, object.ty, 6);
  });

  const safeTiles = [playerStart, ...(npcs || [])];
  safeTiles.forEach((entity) => {
    if (!entity) return;
    setTile(map, mapWidth, mapHeight, entity.x ?? entity.tx, entity.y ?? entity.ty, 1);
  });

  return map;
}

export function applyObjectCollisions(mapData, objects, mapWidth, mapHeight) {
  const base = Array.isArray(mapData) ? [...mapData] : [];
  if (base.length !== mapWidth * mapHeight) return base;
  objects.forEach((object) => {
    if (!object?.solid) return;
    setTile(base, mapWidth, mapHeight, object.tx, object.ty, 6);
  });
  return base;
}

export function getGatherPoolForEnvironment(environment) {
  const key = environment?.gatherTheme || environment?.blueprintId || "home";
  return GATHER_POOLS_BY_THEME[key] || GATHER_POOLS_BY_THEME.home;
}

export function getSupportedObjectTypes() {
  return [...SUPPORTED_OBJECT_TYPES];
}

export function getSupportedDecorKinds() {
  return [...SUPPORTED_DECOR_KINDS];
}

export function readEnvironmentAmbientColor(rawEnvironment, fallback = 0x1a1a2e) {
  return safeHex(rawEnvironment?.ambientColor || rawEnvironment?.palette?.ambient) || fallback;
}
