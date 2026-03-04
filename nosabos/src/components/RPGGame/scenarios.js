// ─── Scenario definitions ────────────────────────────────────────────────────
// Each scenario defines: map theme, tile types, procedural generation rules,
// NPC characters, decoration objects, and themed language questions.
//
// Tile legend per scenario:
//   0 = floor/ground (walkable)
//   1 = path/aisle (walkable, visual distinction)
//   2 = wall/water/boundary (solid)
//   3 = furniture/object A (solid, decorated)
//   4 = furniture/object B (solid, decorated)
//   5 = decoration A (walkable)
//   6 = decoration B (solid)
//   7 = special walkable

export const SCENARIOS = {
  // ─── Village ────────────────────────────────────────────────────────────
  village: {
    id: "village",
    name: { en: "Village Square", es: "Plaza del Pueblo" },
    tileSize: 32,
    mapWidth: 24,
    mapHeight: 18,
    playerStart: { x: 11, y: 9 },
    ambientColor: 0x87ceeb,
    tiles: {
      0: {
        name: "grass",
        solid: false,
        colors: [
          [0x5a9e3e, 0x4e8b36, 0x66ad48],
          [0x4e8b36, 0x5a9e3e, 0x448030],
        ],
        detail: "grass",
      },
      1: {
        name: "path",
        solid: false,
        colors: [
          [0xc8a96e, 0xbfa063, 0xd4b87a],
          [0xb89a5f, 0xc8a96e, 0xae9055],
        ],
        detail: "dirt",
      },
      2: {
        name: "water",
        solid: true,
        colors: [
          [0x3a7fd5, 0x2c6fbb, 0x4a8fe5],
          [0x2c6fbb, 0x3a7fd5, 0x5599ee],
        ],
        detail: "water",
      },
      3: {
        name: "tree",
        solid: true,
        colors: [[0x5a9e3e]],
        sprite: "tree",
      },
      4: {
        name: "house",
        solid: true,
        colors: [[0x5a9e3e]],
        sprite: "house",
      },
      5: { name: "flower", solid: false, colors: [[0x5a9e3e]], detail: "flower" },
      6: { name: "fence", solid: true, colors: [[0x5a9e3e]], sprite: "fence" },
    },
    generate(seed) {
      const W = this.mapWidth;
      const H = this.mapHeight;
      const map = new Array(W * H).fill(0);
      const set = (x, y, v) => {
        if (x >= 0 && x < W && y >= 0 && y < H) map[y * W + x] = v;
      };

      // Border trees
      for (let x = 0; x < W; x++) {
        set(x, 0, 3);
        set(x, H - 1, 3);
      }
      for (let y = 0; y < H; y++) {
        set(0, y, 3);
        set(W - 1, y, 3);
      }

      // Central crossroads path
      for (let x = 1; x < W - 1; x++) {
        set(x, 8, 1);
        set(x, 9, 1);
      }
      for (let y = 1; y < H - 1; y++) {
        set(11, y, 1);
        set(12, y, 1);
      }

      // Houses (2x2 clusters)
      const houses = [
        [3, 2],
        [19, 2],
        [3, 14],
        [19, 14],
      ];
      houses.forEach(([hx, hy]) => {
        set(hx, hy, 4);
        set(hx + 1, hy, 4);
        set(hx, hy + 1, 4);
        set(hx + 1, hy + 1, 4);
      });

      // Fenced gardens
      for (let x = 4; x <= 7; x++) {
        set(x, 5, 6);
        set(x, 7, 6);
      }
      set(4, 6, 6);
      set(7, 6, 6);
      set(5, 6, 5);
      set(6, 6, 5);

      for (let x = 16; x <= 19; x++) {
        set(x, 5, 6);
        set(x, 7, 6);
      }
      set(16, 6, 6);
      set(19, 6, 6);
      set(17, 6, 5);
      set(18, 6, 5);

      // Scatter flowers and extra trees
      const rng = mulberry32(seed);
      for (let i = 0; i < 20; i++) {
        const fx = 2 + Math.floor(rng() * (W - 4));
        const fy = 2 + Math.floor(rng() * (H - 4));
        if (map[fy * W + fx] === 0) {
          map[fy * W + fx] = rng() > 0.5 ? 5 : 0;
        }
      }
      // Extra trees along edges
      for (let i = 0; i < 8; i++) {
        const tx = 1 + Math.floor(rng() * 3);
        const ty = 2 + Math.floor(rng() * (H - 4));
        if (map[ty * W + tx] === 0) set(tx, ty, 3);
        const tx2 = W - 2 - Math.floor(rng() * 3);
        if (map[ty * W + tx2] === 0) set(tx2, ty, 3);
      }

      return map;
    },
    npcs: [
      { tx: 6, ty: 4, name: "Elder Rosa", presetIdx: 0 },
      { tx: 17, ty: 4, name: "Scholar Kai", presetIdx: 1 },
      { tx: 11, ty: 13, name: "Merchant Lina", presetIdx: 2 },
    ],
    questions: {
      es: [
        {
          prompt: "How do you say 'Hello' in Spanish?",
          options: ["Hola", "Adiós", "Gracias", "Por favor"],
          correct: 0,
        },
        {
          prompt: "How do you say 'Thank you' in Spanish?",
          options: ["De nada", "Gracias", "Lo siento", "Perdón"],
          correct: 1,
        },
        {
          prompt: "What does 'Buenos días' mean?",
          options: ["Good night", "Good morning", "Goodbye", "Good afternoon"],
          correct: 1,
        },
        {
          prompt: "How do you say 'Water' in Spanish?",
          options: ["Fuego", "Tierra", "Agua", "Aire"],
          correct: 2,
        },
        {
          prompt: "What does '¿Cómo estás?' mean?",
          options: [
            "What is your name?",
            "How are you?",
            "Where are you from?",
            "How old are you?",
          ],
          correct: 1,
        },
      ],
      en: [
        {
          prompt: "¿Cómo se dice 'Hola' en inglés?",
          options: ["Hello", "Goodbye", "Thanks", "Please"],
          correct: 0,
        },
        {
          prompt: "¿Cómo se dice 'Gracias' en inglés?",
          options: ["Sorry", "Thank you", "Please", "Welcome"],
          correct: 1,
        },
        {
          prompt: "¿Qué significa 'Good morning'?",
          options: ["Buenas noches", "Buenas tardes", "Buenos días", "Hasta luego"],
          correct: 2,
        },
      ],
      fr: [
        {
          prompt: "How do you say 'Hello' in French?",
          options: ["Bonjour", "Au revoir", "Merci", "S'il vous plaît"],
          correct: 0,
        },
        {
          prompt: "How do you say 'Thank you' in French?",
          options: ["De rien", "Merci", "Pardon", "Excusez-moi"],
          correct: 1,
        },
        {
          prompt: "What does 'Bonsoir' mean?",
          options: ["Good morning", "Good evening", "Goodbye", "Good night"],
          correct: 1,
        },
      ],
      ja: [
        {
          prompt: "How do you say 'Hello' in Japanese?",
          options: ["こんにちは", "さようなら", "ありがとう", "すみません"],
          correct: 0,
        },
        {
          prompt: "How do you say 'Thank you' in Japanese?",
          options: ["ごめんなさい", "ありがとう", "おねがいします", "どういたしまして"],
          correct: 1,
        },
        {
          prompt: "What does 'おはようございます' mean?",
          options: ["Good night", "Good morning", "Goodbye", "Good afternoon"],
          correct: 1,
        },
      ],
      nl: [
        {
          prompt: "How do you say 'Hello' in Dutch?",
          options: ["Hallo", "Tot ziens", "Dank je", "Alstublieft"],
          correct: 0,
        },
        {
          prompt: "How do you say 'Thank you' in Dutch?",
          options: ["Sorry", "Dank je", "Alstublieft", "Graag gedaan"],
          correct: 1,
        },
        {
          prompt: "What does 'Goedemorgen' mean?",
          options: ["Good night", "Good morning", "Goodbye", "Good afternoon"],
          correct: 1,
        },
      ],
    },
    greetings: {
      en: [
        "Hey traveler! Can you help me?",
        "Welcome! I have a question for you.",
        "Greetings! Test your knowledge!",
      ],
      es: [
        "¡Hola viajero! ¿Puedes ayudarme?",
        "¡Bienvenido! Tengo una pregunta para ti.",
        "¡Saludos! ¡Pon a prueba tu conocimiento!",
      ],
    },
  },

  // ─── Kitchen ────────────────────────────────────────────────────────────
  kitchen: {
    id: "kitchen",
    name: { en: "Kitchen", es: "Cocina" },
    tileSize: 32,
    mapWidth: 16,
    mapHeight: 12,
    playerStart: { x: 8, y: 8 },
    ambientColor: 0xfff8dc,
    tiles: {
      0: {
        name: "floor",
        solid: false,
        colors: [
          [0xdec9a0, 0xd4bf96, 0xe8d3aa],
          [0xc8b68a, 0xdec9a0, 0xbfad80],
        ],
        detail: "tile_floor",
      },
      1: {
        name: "rug",
        solid: false,
        colors: [
          [0xb85c3a, 0xa85230, 0xc86644],
          [0xa85230, 0xb85c3a, 0x984828],
        ],
        detail: "rug",
      },
      2: {
        name: "wall",
        solid: true,
        colors: [
          [0xf5e6c8, 0xeadcbe, 0xfff0d2],
          [0xeadcbe, 0xf5e6c8, 0xe0d2b4],
        ],
        detail: "wall",
      },
      3: {
        name: "counter",
        solid: true,
        colors: [[0x8b7355]],
        sprite: "counter",
      },
      4: {
        name: "stove",
        solid: true,
        colors: [[0x4a4a4a]],
        sprite: "stove",
      },
      5: { name: "mat", solid: false, colors: [[0x6b8e5a]], detail: "mat" },
      6: {
        name: "fridge",
        solid: true,
        colors: [[0xd0d0d0]],
        sprite: "fridge",
      },
    },
    generate(seed) {
      const W = this.mapWidth;
      const H = this.mapHeight;
      const map = new Array(W * H).fill(0);
      const set = (x, y, v) => {
        if (x >= 0 && x < W && y >= 0 && y < H) map[y * W + x] = v;
      };

      // Walls on top and sides
      for (let x = 0; x < W; x++) {
        set(x, 0, 2);
        set(x, 1, 2);
        set(x, H - 1, 2);
      }
      for (let y = 0; y < H; y++) {
        set(0, y, 2);
        set(W - 1, y, 2);
      }

      // Counter along top wall
      for (let x = 1; x < W - 1; x++) set(x, 2, 3);

      // Stove
      set(4, 2, 4);
      set(5, 2, 4);

      // Fridge in corner
      set(W - 2, 2, 6);
      set(W - 2, 3, 6);

      // Island counter in middle
      for (let x = 5; x <= 10; x++) set(x, 6, 3);

      // Rug near door
      for (let x = 6; x <= 9; x++) {
        set(x, 9, 1);
        set(x, 10, 1);
      }

      // Mat by sink area
      set(2, 3, 5);
      set(3, 3, 5);

      return map;
    },
    npcs: [
      { tx: 3, ty: 5, name: "Chef Marco", presetIdx: 0 },
      { tx: 12, ty: 5, name: "Sous Chef Yuki", presetIdx: 1 },
      { tx: 8, ty: 9, name: "Baker Amara", presetIdx: 2 },
    ],
    questions: {
      es: [
        {
          prompt: "How do you say 'Kitchen' in Spanish?",
          options: ["Cocina", "Baño", "Sala", "Comedor"],
          correct: 0,
        },
        {
          prompt: "What is 'Spoon' in Spanish?",
          options: ["Tenedor", "Cuchillo", "Cuchara", "Plato"],
          correct: 2,
        },
        {
          prompt: "How do you say 'To cook' in Spanish?",
          options: ["Comer", "Cocinar", "Beber", "Cortar"],
          correct: 1,
        },
        {
          prompt: "What does 'Horno' mean?",
          options: ["Fridge", "Oven", "Sink", "Stove"],
          correct: 1,
        },
        {
          prompt: "How do you say 'Salt' in Spanish?",
          options: ["Azúcar", "Pimienta", "Sal", "Aceite"],
          correct: 2,
        },
      ],
      en: [
        {
          prompt: "¿Cómo se dice 'Cocina' en inglés?",
          options: ["Kitchen", "Bathroom", "Bedroom", "Dining room"],
          correct: 0,
        },
        {
          prompt: "¿Cómo se dice 'Cuchara' en inglés?",
          options: ["Fork", "Knife", "Spoon", "Plate"],
          correct: 2,
        },
        {
          prompt: "¿Qué significa 'To cook'?",
          options: ["Comer", "Cocinar", "Beber", "Cortar"],
          correct: 1,
        },
      ],
      fr: [
        {
          prompt: "How do you say 'Kitchen' in French?",
          options: ["Cuisine", "Chambre", "Salon", "Salle de bain"],
          correct: 0,
        },
        {
          prompt: "What is 'Spoon' in French?",
          options: ["Fourchette", "Couteau", "Cuillère", "Assiette"],
          correct: 2,
        },
        {
          prompt: "How do you say 'To cook' in French?",
          options: ["Manger", "Cuisiner", "Boire", "Couper"],
          correct: 1,
        },
      ],
      ja: [
        {
          prompt: "How do you say 'Kitchen' in Japanese?",
          options: ["台所 (だいどころ)", "寝室 (しんしつ)", "風呂 (ふろ)", "居間 (いま)"],
          correct: 0,
        },
        {
          prompt: "What is 'Spoon' in Japanese?",
          options: ["フォーク", "ナイフ", "スプーン", "皿 (さら)"],
          correct: 2,
        },
        {
          prompt: "How do you say 'To cook' in Japanese?",
          options: ["食べる", "料理する", "飲む", "切る"],
          correct: 1,
        },
      ],
      nl: [
        {
          prompt: "How do you say 'Kitchen' in Dutch?",
          options: ["Keuken", "Badkamer", "Slaapkamer", "Woonkamer"],
          correct: 0,
        },
        {
          prompt: "What is 'Spoon' in Dutch?",
          options: ["Vork", "Mes", "Lepel", "Bord"],
          correct: 2,
        },
        {
          prompt: "How do you say 'To cook' in Dutch?",
          options: ["Eten", "Koken", "Drinken", "Snijden"],
          correct: 1,
        },
      ],
    },
    greetings: {
      en: [
        "Welcome to the kitchen! Quick quiz!",
        "Hey there, taste-tester! Answer this!",
        "Good to see you! Let me test your food vocab!",
      ],
      es: [
        "¡Bienvenido a la cocina! ¡Prueba rápida!",
        "¡Hola! ¡Responde esto!",
        "¡Me alegra verte! ¡Probemos tu vocabulario!",
      ],
    },
  },

  // ─── Grocery Store ─────────────────────────────────────────────────────
  grocery: {
    id: "grocery",
    name: { en: "Grocery Store", es: "Supermercado" },
    tileSize: 32,
    mapWidth: 20,
    mapHeight: 14,
    playerStart: { x: 10, y: 12 },
    ambientColor: 0xf0f0f0,
    tiles: {
      0: {
        name: "floor",
        solid: false,
        colors: [
          [0xe8e0d0, 0xded6c6, 0xf2ead8],
          [0xd4ccc0, 0xe8e0d0, 0xcac2b6],
        ],
        detail: "linoleum",
      },
      1: {
        name: "aisle",
        solid: false,
        colors: [
          [0xd0d8e0, 0xc6ced6, 0xdae2ea],
          [0xbcc4cc, 0xd0d8e0, 0xb2bac2],
        ],
        detail: "linoleum",
      },
      2: {
        name: "wall",
        solid: true,
        colors: [
          [0xb0b8c0, 0xa6aeb6, 0xbac2ca],
          [0x9ca4ac, 0xb0b8c0, 0x929aa2],
        ],
        detail: "wall",
      },
      3: {
        name: "shelf",
        solid: true,
        colors: [[0x8b6e50]],
        sprite: "shelf",
      },
      4: {
        name: "register",
        solid: true,
        colors: [[0x5a5a5a]],
        sprite: "register",
      },
      5: {
        name: "produce",
        solid: false,
        colors: [[0x6b9e3e]],
        detail: "produce",
      },
      6: {
        name: "freezer",
        solid: true,
        colors: [[0xc0d8e8]],
        sprite: "freezer",
      },
    },
    generate(seed) {
      const W = this.mapWidth;
      const H = this.mapHeight;
      const map = new Array(W * H).fill(0);
      const set = (x, y, v) => {
        if (x >= 0 && x < W && y >= 0 && y < H) map[y * W + x] = v;
      };

      // Walls
      for (let x = 0; x < W; x++) {
        set(x, 0, 2);
        set(x, H - 1, 2);
      }
      for (let y = 0; y < H; y++) {
        set(0, y, 2);
        set(W - 1, y, 2);
      }
      // Door opening
      set(9, H - 1, 0);
      set(10, H - 1, 0);

      // Freezer section along back wall
      for (let x = 1; x < W - 1; x++) set(x, 1, 6);

      // Shelf aisles (3 rows)
      for (let x = 2; x <= 7; x++) {
        set(x, 4, 3);
        set(x, 7, 3);
        set(x, 10, 3);
      }
      for (let x = 12; x <= 17; x++) {
        set(x, 4, 3);
        set(x, 7, 3);
        set(x, 10, 3);
      }

      // Aisles between shelves
      for (let y = 3; y <= 11; y++) {
        set(9, y, 1);
        set(10, y, 1);
      }

      // Checkout registers
      set(3, 12, 4);
      set(7, 12, 4);

      // Produce area
      set(15, 12, 5);
      set(16, 12, 5);

      return map;
    },
    npcs: [
      { tx: 4, ty: 6, name: "Cashier Sam", presetIdx: 0 },
      { tx: 14, ty: 6, name: "Stocker Mia", presetIdx: 1 },
      { tx: 10, ty: 3, name: "Manager Dev", presetIdx: 2 },
    ],
    questions: {
      es: [
        {
          prompt: "How do you say 'Bread' in Spanish?",
          options: ["Leche", "Pan", "Queso", "Huevo"],
          correct: 1,
        },
        {
          prompt: "What is 'Apple' in Spanish?",
          options: ["Naranja", "Plátano", "Manzana", "Uva"],
          correct: 2,
        },
        {
          prompt: "How do you say 'How much does it cost?' in Spanish?",
          options: [
            "¿Dónde está?",
            "¿Cuánto cuesta?",
            "¿Qué hora es?",
            "¿Cómo se llama?",
          ],
          correct: 1,
        },
        {
          prompt: "What does 'Leche' mean?",
          options: ["Lettuce", "Milk", "Meat", "Rice"],
          correct: 1,
        },
        {
          prompt: "How do you say 'Cart' in Spanish?",
          options: ["Bolsa", "Carrito", "Caja", "Estante"],
          correct: 1,
        },
      ],
      en: [
        {
          prompt: "¿Cómo se dice 'Pan' en inglés?",
          options: ["Bread", "Milk", "Cheese", "Egg"],
          correct: 0,
        },
        {
          prompt: "¿Cómo se dice 'Manzana' en inglés?",
          options: ["Orange", "Banana", "Apple", "Grape"],
          correct: 2,
        },
        {
          prompt: "¿Qué significa 'How much does it cost?'?",
          options: [
            "¿Dónde está?",
            "¿Cuánto cuesta?",
            "¿Qué hora es?",
            "¿Cómo se llama?",
          ],
          correct: 1,
        },
      ],
      fr: [
        {
          prompt: "How do you say 'Bread' in French?",
          options: ["Lait", "Pain", "Fromage", "Oeuf"],
          correct: 1,
        },
        {
          prompt: "What is 'Apple' in French?",
          options: ["Orange", "Banane", "Pomme", "Raisin"],
          correct: 2,
        },
        {
          prompt: "How do you say 'How much does it cost?' in French?",
          options: [
            "Où est-ce?",
            "Combien ça coûte?",
            "Quelle heure est-il?",
            "Comment vous appelez-vous?",
          ],
          correct: 1,
        },
      ],
      ja: [
        {
          prompt: "How do you say 'Bread' in Japanese?",
          options: ["牛乳 (ぎゅうにゅう)", "パン", "チーズ", "卵 (たまご)"],
          correct: 1,
        },
        {
          prompt: "What is 'Apple' in Japanese?",
          options: ["みかん", "バナナ", "りんご", "ぶどう"],
          correct: 2,
        },
        {
          prompt: "How do you say 'How much?' in Japanese?",
          options: ["どこですか?", "いくらですか?", "何時ですか?", "お名前は?"],
          correct: 1,
        },
      ],
      nl: [
        {
          prompt: "How do you say 'Bread' in Dutch?",
          options: ["Melk", "Brood", "Kaas", "Ei"],
          correct: 1,
        },
        {
          prompt: "What is 'Apple' in Dutch?",
          options: ["Sinaasappel", "Banaan", "Appel", "Druif"],
          correct: 2,
        },
        {
          prompt: "How do you say 'How much does it cost?' in Dutch?",
          options: [
            "Waar is het?",
            "Hoeveel kost het?",
            "Hoe laat is het?",
            "Hoe heet u?",
          ],
          correct: 1,
        },
      ],
    },
    greetings: {
      en: [
        "Welcome shopper! Quick question!",
        "Hey, can you help me stock these?",
        "Attention shoppers! Pop quiz!",
      ],
      es: [
        "¡Bienvenido! ¡Pregunta rápida!",
        "¡Oye! ¿Me ayudas con esto?",
        "¡Atención! ¡Cuestionario sorpresa!",
      ],
    },
  },

  // ─── Park ──────────────────────────────────────────────────────────────
  park: {
    id: "park",
    name: { en: "City Park", es: "Parque" },
    tileSize: 32,
    mapWidth: 22,
    mapHeight: 16,
    playerStart: { x: 11, y: 12 },
    ambientColor: 0x98d4e8,
    tiles: {
      0: {
        name: "grass",
        solid: false,
        colors: [
          [0x5a9e3e, 0x4e8b36, 0x66ad48],
          [0x4e8b36, 0x5a9e3e, 0x448030],
        ],
        detail: "grass",
      },
      1: {
        name: "path",
        solid: false,
        colors: [
          [0xc0b090, 0xb6a686, 0xcaba9a],
          [0xac9c7c, 0xc0b090, 0xa29272],
        ],
        detail: "gravel",
      },
      2: {
        name: "pond",
        solid: true,
        colors: [
          [0x4a9ad5, 0x3a8ac5, 0x5aaae5],
          [0x3a8ac5, 0x4a9ad5, 0x6abaee],
        ],
        detail: "water",
      },
      3: {
        name: "tree",
        solid: true,
        colors: [[0x5a9e3e]],
        sprite: "tree",
      },
      4: {
        name: "bench",
        solid: true,
        colors: [[0x8b6e50]],
        sprite: "bench",
      },
      5: { name: "flower", solid: false, colors: [[0x5a9e3e]], detail: "flower" },
      6: {
        name: "fountain",
        solid: true,
        colors: [[0x8899aa]],
        sprite: "fountain",
      },
    },
    generate(seed) {
      const W = this.mapWidth;
      const H = this.mapHeight;
      const map = new Array(W * H).fill(0);
      const set = (x, y, v) => {
        if (x >= 0 && x < W && y >= 0 && y < H) map[y * W + x] = v;
      };

      // Tree border
      for (let x = 0; x < W; x++) {
        set(x, 0, 3);
        set(x, H - 1, 3);
      }
      for (let y = 0; y < H; y++) {
        set(0, y, 3);
        set(W - 1, y, 3);
      }
      // Entrance
      set(10, H - 1, 0);
      set(11, H - 1, 0);

      // Winding path
      for (let x = 1; x < W - 1; x++) set(x, 12, 1);
      for (let y = 4; y <= 12; y++) {
        set(5, y, 1);
        set(16, y, 1);
      }
      for (let x = 5; x <= 16; x++) set(x, 4, 1);
      set(10, 12, 1);
      set(11, 12, 1);

      // Central fountain
      set(10, 7, 6);
      set(11, 7, 6);
      set(10, 8, 6);
      set(11, 8, 6);

      // Pond
      for (let x = 2; x <= 4; x++) {
        for (let y = 6; y <= 9; y++) set(x, y, 2);
      }

      // Benches along path
      set(7, 11, 4);
      set(14, 11, 4);
      set(7, 5, 4);
      set(14, 5, 4);

      // Flowers
      const rng = mulberry32(seed);
      for (let i = 0; i < 25; i++) {
        const fx = 2 + Math.floor(rng() * (W - 4));
        const fy = 2 + Math.floor(rng() * (H - 4));
        if (map[fy * W + fx] === 0) map[fy * W + fx] = 5;
      }

      // Extra trees
      const treeSpots = [
        [2, 2],
        [8, 3],
        [13, 3],
        [19, 2],
        [2, 13],
        [19, 13],
        [8, 9],
        [13, 9],
      ];
      treeSpots.forEach(([tx, ty]) => set(tx, ty, 3));

      return map;
    },
    npcs: [
      { tx: 6, ty: 8, name: "Jogger Elise", presetIdx: 0 },
      { tx: 15, ty: 8, name: "Artist Tomás", presetIdx: 1 },
      { tx: 10, ty: 5, name: "Ranger Priya", presetIdx: 2 },
    ],
    questions: {
      es: [
        {
          prompt: "How do you say 'Tree' in Spanish?",
          options: ["Flor", "Árbol", "Hierba", "Hoja"],
          correct: 1,
        },
        {
          prompt: "What is 'Bench' in Spanish?",
          options: ["Mesa", "Silla", "Banco", "Cama"],
          correct: 2,
        },
        {
          prompt: "How do you say 'The weather is nice' in Spanish?",
          options: [
            "Hace frío",
            "Está lloviendo",
            "Hace buen tiempo",
            "Está nublado",
          ],
          correct: 2,
        },
        {
          prompt: "What does 'Pájaro' mean?",
          options: ["Dog", "Cat", "Bird", "Fish"],
          correct: 2,
        },
        {
          prompt: "How do you say 'To walk' in Spanish?",
          options: ["Correr", "Caminar", "Nadar", "Saltar"],
          correct: 1,
        },
      ],
      en: [
        {
          prompt: "¿Cómo se dice 'Árbol' en inglés?",
          options: ["Flower", "Tree", "Grass", "Leaf"],
          correct: 1,
        },
        {
          prompt: "¿Cómo se dice 'Banco' en inglés?",
          options: ["Table", "Chair", "Bench", "Bed"],
          correct: 2,
        },
        {
          prompt: "¿Qué significa 'The weather is nice'?",
          options: ["Hace frío", "Está lloviendo", "Hace buen tiempo", "Está nublado"],
          correct: 2,
        },
      ],
      fr: [
        {
          prompt: "How do you say 'Tree' in French?",
          options: ["Fleur", "Arbre", "Herbe", "Feuille"],
          correct: 1,
        },
        {
          prompt: "What is 'Bench' in French?",
          options: ["Table", "Chaise", "Banc", "Lit"],
          correct: 2,
        },
        {
          prompt: "How do you say 'The weather is nice' in French?",
          options: ["Il fait froid", "Il pleut", "Il fait beau", "C'est nuageux"],
          correct: 2,
        },
      ],
      ja: [
        {
          prompt: "How do you say 'Tree' in Japanese?",
          options: ["花 (はな)", "木 (き)", "草 (くさ)", "葉 (は)"],
          correct: 1,
        },
        {
          prompt: "What is 'Bench' in Japanese?",
          options: ["テーブル", "椅子 (いす)", "ベンチ", "ベッド"],
          correct: 2,
        },
        {
          prompt: "How do you say 'The weather is nice' in Japanese?",
          options: ["寒いです", "雨が降っています", "いい天気です", "曇りです"],
          correct: 2,
        },
      ],
      nl: [
        {
          prompt: "How do you say 'Tree' in Dutch?",
          options: ["Bloem", "Boom", "Gras", "Blad"],
          correct: 1,
        },
        {
          prompt: "What is 'Bench' in Dutch?",
          options: ["Tafel", "Stoel", "Bank", "Bed"],
          correct: 2,
        },
        {
          prompt: "How do you say 'The weather is nice' in Dutch?",
          options: ["Het is koud", "Het regent", "Het is mooi weer", "Het is bewolkt"],
          correct: 2,
        },
      ],
    },
    greetings: {
      en: [
        "Beautiful day for a quiz!",
        "Hey there! Mind a quick question?",
        "Welcome to the park! Test yourself!",
      ],
      es: [
        "¡Hermoso día para un cuestionario!",
        "¡Hola! ¿Te importa una pregunta?",
        "¡Bienvenido al parque! ¡Ponte a prueba!",
      ],
    },
  },
};

export const SCENARIO_LIST = Object.keys(SCENARIOS);

// ─── Seeded RNG ──────────────────────────────────────────────────────────────
export function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
