// Authored item catalog for episode fetch/serve beats: pixel-art drawers in the
// same 16×16-grid style as the legacy gather sprites, plus display names in all
// ten app languages. Names favor natural citation forms (article included where
// a learner would hear one).

function makeHelpers(ctx, S) {
  const px = (x, y, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x * S, y * S, S, S);
  };
  const rect = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x * S, y * S, w * S, h * S);
  };
  const disc = (cx, cy, r, c) => {
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r + r * 0.3) px(cx + x, cy + y, c);
      }
    }
  };
  return { px, rect, disc };
}

const DRAWERS = {
  apple(ctx, S) {
    const { px, disc } = makeHelpers(ctx, S);
    disc(8, 9, 4, "#d33b2f");
    disc(6.5, 8, 1, "#f28a7d");
    px(8, 4, "#6d4a2f");
    px(9, 3, "#4c8f3a");
    px(10, 3, "#4c8f3a");
  },
  bread(ctx, S) {
    const { px, rect } = makeHelpers(ctx, S);
    rect(3, 7, 10, 5, "#c98a3b");
    rect(4, 6, 8, 1, "#e0a95c");
    px(5, 8, "#8f5f26");
    px(8, 9, "#8f5f26");
    px(11, 8, "#8f5f26");
  },
  cheese(ctx, S) {
    const { px, rect } = makeHelpers(ctx, S);
    rect(3, 8, 10, 4, "#f2c14e");
    rect(4, 6, 8, 2, "#f7d372");
    px(6, 9, "#c99a2e");
    px(10, 10, "#c99a2e");
    px(8, 7, "#c99a2e");
  },
  fish(ctx, S) {
    const { px, rect } = makeHelpers(ctx, S);
    rect(4, 8, 7, 3, "#5a8fc4");
    px(3, 9, "#5a8fc4");
    rect(11, 7, 2, 5, "#41729f");
    px(5, 9, "#0e2a45");
    px(6, 8, "#8fb7de");
  },
  milk(ctx, S) {
    const { rect } = makeHelpers(ctx, S);
    rect(6, 4, 4, 2, "#d9dee4");
    rect(5, 6, 6, 7, "#f4f7fa");
    rect(5, 8, 6, 2, "#7aa2c9");
  },
  egg(ctx, S) {
    const { disc } = makeHelpers(ctx, S);
    disc(8, 9, 3, "#f5ead8");
    disc(8, 7, 2, "#faf4e8");
  },
  tomato(ctx, S) {
    const { px, disc } = makeHelpers(ctx, S);
    disc(8, 9, 4, "#d9452c");
    px(8, 5, "#3f7d33");
    px(7, 4, "#3f7d33");
    px(9, 4, "#3f7d33");
    disc(6.5, 8, 1, "#ef8a70");
  },
  flower(ctx, S) {
    const { px, disc } = makeHelpers(ctx, S);
    px(8, 10, "#3f7d33");
    px(8, 11, "#3f7d33");
    px(8, 12, "#3f7d33");
    disc(8, 6, 2, "#d95bb1");
    px(8, 6, "#f2d14e");
    px(5, 6, "#d95bb1");
    px(11, 6, "#d95bb1");
    px(8, 3, "#d95bb1");
  },
  coffee(ctx, S) {
    const { px, rect } = makeHelpers(ctx, S);
    rect(5, 7, 6, 5, "#f4f7fa");
    rect(6, 8, 4, 3, "#5a3a24");
    px(11, 8, "#f4f7fa");
    px(12, 9, "#f4f7fa");
    px(11, 10, "#f4f7fa");
    px(7, 5, "#c4cdd6");
    px(9, 4, "#c4cdd6");
  },
  tea(ctx, S) {
    const { px, rect } = makeHelpers(ctx, S);
    rect(5, 8, 6, 4, "#e7ede9");
    rect(6, 9, 4, 2, "#9a7b3f");
    px(11, 9, "#e7ede9");
    px(12, 10, "#e7ede9");
    px(10, 6, "#f2f2f2");
    px(10, 5, "#8a8f94");
  },
  cake(ctx, S) {
    const { px, rect } = makeHelpers(ctx, S);
    rect(4, 8, 8, 4, "#efb7cd");
    rect(4, 7, 8, 1, "#fbe7ef");
    px(8, 5, "#f2d14e");
    px(8, 6, "#d95bb1");
    rect(3, 12, 10, 1, "#c4cdd6");
  },
  sandwich(ctx, S) {
    const { rect } = makeHelpers(ctx, S);
    rect(4, 6, 8, 2, "#e0a95c");
    rect(4, 8, 8, 1, "#4c8f3a");
    rect(4, 9, 8, 1, "#f2c14e");
    rect(4, 10, 8, 2, "#c98a3b");
  },
  juice(ctx, S) {
    const { px, rect } = makeHelpers(ctx, S);
    rect(6, 5, 4, 8, "#f2913d");
    rect(6, 5, 4, 2, "#f7b16b");
    px(9, 3, "#c4cdd6");
    px(9, 4, "#c4cdd6");
  },
  box(ctx, S) {
    const { rect } = makeHelpers(ctx, S);
    rect(4, 6, 8, 7, "#b9854a");
    rect(4, 6, 8, 2, "#a06e37");
    rect(7, 6, 2, 7, "#e6d3b3");
  },
  lamp(ctx, S) {
    const { px, rect } = makeHelpers(ctx, S);
    rect(6, 4, 4, 3, "#f2d14e");
    px(5, 6, "#f2d14e");
    px(10, 6, "#f2d14e");
    px(8, 7, "#6b7280");
    px(8, 8, "#6b7280");
    px(8, 9, "#6b7280");
    rect(6, 10, 4, 1, "#6b7280");
  },
  pillow(ctx, S) {
    const { px, rect } = makeHelpers(ctx, S);
    rect(4, 7, 8, 5, "#9db7e8");
    px(4, 7, "#c6d6f2");
    px(11, 7, "#c6d6f2");
    px(4, 11, "#7d99cc");
    px(11, 11, "#7d99cc");
  },
  mirror(ctx, S) {
    const { rect } = makeHelpers(ctx, S);
    rect(5, 4, 6, 9, "#8a6d3b");
    rect(6, 5, 4, 7, "#bfe3ea");
    rect(7, 6, 1, 3, "#eefafc");
  },
  key(ctx, S) {
    const { px, disc, rect } = makeHelpers(ctx, S);
    disc(6, 6, 2, "#d9b23c");
    px(6, 6, "#8a6d1f");
    rect(7, 7, 1, 5, "#d9b23c");
    px(8, 10, "#d9b23c");
    px(8, 12, "#d9b23c");
  },
  phone(ctx, S) {
    const { px, rect } = makeHelpers(ctx, S);
    rect(6, 4, 5, 9, "#2f3640");
    rect(7, 5, 3, 6, "#7fd4f2");
    px(8, 12, "#c4cdd6");
  },
  umbrella(ctx, S) {
    const { px, rect } = makeHelpers(ctx, S);
    rect(4, 5, 8, 2, "#c23b4e");
    rect(5, 4, 6, 1, "#c23b4e");
    px(4, 7, "#912a3a");
    px(7, 7, "#912a3a");
    px(10, 7, "#912a3a");
    rect(8, 7, 1, 5, "#6b7280");
    px(9, 12, "#6b7280");
  },
  wallet(ctx, S) {
    const { px, rect } = makeHelpers(ctx, S);
    rect(4, 7, 8, 5, "#7a4a21");
    rect(4, 7, 8, 1, "#5d3818");
    px(10, 9, "#d9b23c");
  },
  glasses(ctx, S) {
    const { px, disc } = makeHelpers(ctx, S);
    disc(5, 9, 2, "#2f3640");
    disc(11, 9, 2, "#2f3640");
    disc(5, 9, 1, "#9fd8e8");
    disc(11, 9, 1, "#9fd8e8");
    px(8, 9, "#2f3640");
  },
  suitcase(ctx, S) {
    const { rect } = makeHelpers(ctx, S);
    rect(4, 7, 9, 6, "#a2543a");
    rect(7, 5, 3, 2, "#7c3f2b");
    rect(4, 9, 9, 1, "#7c3f2b");
  },
  camera(ctx, S) {
    const { px, rect, disc } = makeHelpers(ctx, S);
    rect(4, 6, 9, 6, "#3d4451");
    disc(8, 9, 2, "#7fd4f2");
    px(12, 7, "#f2d14e");
    rect(5, 5, 3, 1, "#3d4451");
  },
  ticket(ctx, S) {
    const { px, rect } = makeHelpers(ctx, S);
    rect(3, 7, 10, 4, "#f2e3c2");
    px(3, 9, "#c4a86a");
    px(12, 9, "#c4a86a");
    rect(5, 8, 4, 1, "#8a6d3b");
    px(10, 9, "#c23b4e");
  },
  map(ctx, S) {
    const { px, rect } = makeHelpers(ctx, S);
    rect(4, 5, 9, 7, "#efe6c8");
    rect(4, 5, 3, 7, "#e2d4ac");
    rect(10, 5, 3, 7, "#e2d4ac");
    px(6, 7, "#c23b4e");
    px(9, 9, "#4c8f3a");
    px(8, 8, "#5a8fc4");
  },
  medicine(ctx, S) {
    const { px, rect } = makeHelpers(ctx, S);
    rect(6, 5, 4, 8, "#e8eef2");
    rect(6, 5, 4, 2, "#c23b4e");
    px(7, 9, "#c23b4e");
    px(8, 8, "#c23b4e");
    px(8, 10, "#c23b4e");
    px(9, 9, "#c23b4e");
  },
  bandage(ctx, S) {
    const { px, rect } = makeHelpers(ctx, S);
    rect(3, 8, 10, 3, "#e8c9a8");
    rect(6, 8, 4, 3, "#f2e3cd");
    px(7, 9, "#d1a679");
    px(8, 10, "#d1a679");
  },
  thermometer(ctx, S) {
    const { px, rect, disc } = makeHelpers(ctx, S);
    rect(7, 3, 2, 8, "#e8eef2");
    rect(7, 6, 2, 5, "#c23b4e");
    disc(8, 12, 2, "#c23b4e");
    px(10, 4, "#c4cdd6");
    px(10, 6, "#c4cdd6");
  },
  gift(ctx, S) {
    const { px, rect } = makeHelpers(ctx, S);
    rect(4, 7, 8, 6, "#5a8fc4");
    rect(7, 7, 2, 6, "#f2d14e");
    rect(4, 6, 8, 1, "#f2d14e");
    px(6, 4, "#f2d14e");
    px(9, 4, "#f2d14e");
    px(7, 5, "#f2d14e");
    px(8, 5, "#f2d14e");
  },
  candle(ctx, S) {
    const { px, rect } = makeHelpers(ctx, S);
    rect(7, 6, 2, 7, "#f4f0e4");
    px(8, 4, "#f2913d");
    px(8, 5, "#f2d14e");
    rect(5, 12, 6, 1, "#b9854a");
  },
  guitar(ctx, S) {
    const { px, rect, disc } = makeHelpers(ctx, S);
    disc(7, 10, 3, "#b9854a");
    disc(8, 7, 2, "#c9975c");
    px(7, 10, "#4a3219");
    rect(9, 3, 1, 5, "#6d4a2f");
    px(9, 2, "#3d2a17");
  },
  letter(ctx, S) {
    const { px, rect } = makeHelpers(ctx, S);
    rect(4, 6, 9, 6, "#f4f0e4");
    px(4, 6, "#c4b998");
    px(12, 6, "#c4b998");
    px(8, 9, "#c4b998");
    px(6, 8, "#c4b998");
    px(10, 8, "#c4b998");
    px(11, 10, "#c23b4e");
  },
  coin(ctx, S) {
    const { px, disc } = makeHelpers(ctx, S);
    disc(8, 8, 3, "#d9b23c");
    disc(8, 8, 2, "#f2d475");
    px(8, 8, "#a8842a");
  },
  watch(ctx, S) {
    const { px, rect, disc } = makeHelpers(ctx, S);
    rect(7, 3, 2, 3, "#6b7280");
    rect(7, 11, 2, 3, "#6b7280");
    disc(8, 8, 3, "#c4cdd6");
    disc(8, 8, 2, "#f4f7fa");
    px(8, 7, "#2f3640");
    px(9, 8, "#2f3640");
  },
  notebook(ctx, S) {
    const { px, rect } = makeHelpers(ctx, S);
    rect(5, 4, 7, 9, "#4c8f3a");
    rect(5, 4, 1, 9, "#2f5c22");
    rect(7, 6, 4, 1, "#dbe8d5");
    rect(7, 8, 4, 1, "#dbe8d5");
    px(7, 10, "#dbe8d5");
  },
};

// names: natural citation form per language (with article where one is heard).
export const ITEM_CATALOG = {
  apple: { names: { en: "the apple", es: "la manzana", pt: "a maçã", it: "la mela", fr: "la pomme", de: "der Apfel", ja: "りんご", hi: "सेब", ar: "التفاحة", zh: "苹果" }, categories: ["food"] },
  bread: { names: { en: "the bread", es: "el pan", pt: "o pão", it: "il pane", fr: "le pain", de: "das Brot", ja: "パン", hi: "रोटी", ar: "الخبز", zh: "面包" }, categories: ["food"] },
  cheese: { names: { en: "the cheese", es: "el queso", pt: "o queijo", it: "il formaggio", fr: "le fromage", de: "der Käse", ja: "チーズ", hi: "पनीर", ar: "الجبن", zh: "奶酪" }, categories: ["food"] },
  fish: { names: { en: "the fish", es: "el pescado", pt: "o peixe", it: "il pesce", fr: "le poisson", de: "der Fisch", ja: "魚", hi: "मछली", ar: "السمك", zh: "鱼" }, categories: ["food"] },
  milk: { names: { en: "the milk", es: "la leche", pt: "o leite", it: "il latte", fr: "le lait", de: "die Milch", ja: "牛乳", hi: "दूध", ar: "الحليب", zh: "牛奶" }, categories: ["food"] },
  egg: { names: { en: "the egg", es: "el huevo", pt: "o ovo", it: "l'uovo", fr: "l'œuf", de: "das Ei", ja: "卵", hi: "अंडा", ar: "البيضة", zh: "鸡蛋" }, categories: ["food"] },
  tomato: { names: { en: "the tomato", es: "el tomate", pt: "o tomate", it: "il pomodoro", fr: "la tomate", de: "die Tomate", ja: "トマト", hi: "टमाटर", ar: "الطماطم", zh: "西红柿" }, categories: ["food"] },
  flower: { names: { en: "the flower", es: "la flor", pt: "a flor", it: "il fiore", fr: "la fleur", de: "die Blume", ja: "花", hi: "फूल", ar: "الزهرة", zh: "花" }, categories: ["nature", "shopping"] },
  coffee: { names: { en: "the coffee", es: "el café", pt: "o café", it: "il caffè", fr: "le café", de: "der Kaffee", ja: "コーヒー", hi: "कॉफ़ी", ar: "القهوة", zh: "咖啡" }, categories: ["food", "restaurant"] },
  tea: { names: { en: "the tea", es: "el té", pt: "o chá", it: "il tè", fr: "le thé", de: "der Tee", ja: "お茶", hi: "चाय", ar: "الشاي", zh: "茶" }, categories: ["food", "restaurant"] },
  cake: { names: { en: "the cake", es: "el pastel", pt: "o bolo", it: "la torta", fr: "le gâteau", de: "der Kuchen", ja: "ケーキ", hi: "केक", ar: "الكعكة", zh: "蛋糕" }, categories: ["food", "restaurant"] },
  sandwich: { names: { en: "the sandwich", es: "el sándwich", pt: "o sanduíche", it: "il panino", fr: "le sandwich", de: "das Sandwich", ja: "サンドイッチ", hi: "सैंडविच", ar: "الساندويتش", zh: "三明治" }, categories: ["food", "restaurant"] },
  juice: { names: { en: "the juice", es: "el jugo", pt: "o suco", it: "il succo", fr: "le jus", de: "der Saft", ja: "ジュース", hi: "जूस", ar: "العصير", zh: "果汁" }, categories: ["food", "restaurant"] },
  box: { names: { en: "the box", es: "la caja", pt: "a caixa", it: "la scatola", fr: "la boîte", de: "die Kiste", ja: "箱", hi: "डिब्बा", ar: "الصندوق", zh: "箱子" }, categories: ["house"] },
  lamp: { names: { en: "the lamp", es: "la lámpara", pt: "a lâmpada", it: "la lampada", fr: "la lampe", de: "die Lampe", ja: "ランプ", hi: "लैंप", ar: "المصباح", zh: "台灯" }, categories: ["house"] },
  pillow: { names: { en: "the pillow", es: "la almohada", pt: "o travesseiro", it: "il cuscino", fr: "l'oreiller", de: "das Kissen", ja: "枕", hi: "तकिया", ar: "الوسادة", zh: "枕头" }, categories: ["house"] },
  mirror: { names: { en: "the mirror", es: "el espejo", pt: "o espelho", it: "lo specchio", fr: "le miroir", de: "der Spiegel", ja: "鏡", hi: "आईना", ar: "المرآة", zh: "镜子" }, categories: ["house"] },
  key: { names: { en: "the key", es: "la llave", pt: "a chave", it: "la chiave", fr: "la clé", de: "der Schlüssel", ja: "鍵", hi: "चाबी", ar: "المفتاح", zh: "钥匙" }, categories: ["personal", "house"] },
  phone: { names: { en: "the phone", es: "el teléfono", pt: "o telefone", it: "il telefono", fr: "le téléphone", de: "das Handy", ja: "電話", hi: "फ़ोन", ar: "الهاتف", zh: "手机" }, categories: ["personal", "technology"] },
  umbrella: { names: { en: "the umbrella", es: "el paraguas", pt: "o guarda-chuva", it: "l'ombrello", fr: "le parapluie", de: "der Regenschirm", ja: "傘", hi: "छाता", ar: "المظلة", zh: "雨伞" }, categories: ["personal", "weather"] },
  wallet: { names: { en: "the wallet", es: "la cartera", pt: "a carteira", it: "il portafoglio", fr: "le portefeuille", de: "die Geldbörse", ja: "財布", hi: "बटुआ", ar: "المحفظة", zh: "钱包" }, categories: ["personal"] },
  glasses: { names: { en: "the glasses", es: "las gafas", pt: "os óculos", it: "gli occhiali", fr: "les lunettes", de: "die Brille", ja: "眼鏡", hi: "चश्मा", ar: "النظارة", zh: "眼镜" }, categories: ["personal"] },
  suitcase: { names: { en: "the suitcase", es: "la maleta", pt: "a mala", it: "la valigia", fr: "la valise", de: "der Koffer", ja: "スーツケース", hi: "सूटकेस", ar: "الحقيبة", zh: "行李箱" }, categories: ["travel"] },
  camera: { names: { en: "the camera", es: "la cámara", pt: "a câmera", it: "la macchina fotografica", fr: "l'appareil photo", de: "die Kamera", ja: "カメラ", hi: "कैमरा", ar: "الكاميرا", zh: "相机" }, categories: ["travel", "technology"] },
  ticket: { names: { en: "the ticket", es: "el boleto", pt: "o bilhete", it: "il biglietto", fr: "le billet", de: "die Fahrkarte", ja: "切符", hi: "टिकट", ar: "التذكرة", zh: "车票" }, categories: ["travel"] },
  map: { names: { en: "the map", es: "el mapa", pt: "o mapa", it: "la mappa", fr: "la carte", de: "die Karte", ja: "地図", hi: "नक्शा", ar: "الخريطة", zh: "地图" }, categories: ["travel"] },
  medicine: { names: { en: "the medicine", es: "la medicina", pt: "o remédio", it: "la medicina", fr: "le médicament", de: "das Medikament", ja: "薬", hi: "दवा", ar: "الدواء", zh: "药" }, categories: ["health"] },
  bandage: { names: { en: "the bandage", es: "la venda", pt: "a atadura", it: "la benda", fr: "le bandage", de: "der Verband", ja: "包帯", hi: "पट्टी", ar: "الضمادة", zh: "绷带" }, categories: ["health"] },
  thermometer: { names: { en: "the thermometer", es: "el termómetro", pt: "o termômetro", it: "il termometro", fr: "le thermomètre", de: "das Thermometer", ja: "体温計", hi: "थर्मामीटर", ar: "الترمومتر", zh: "体温计" }, categories: ["health"] },
  gift: { names: { en: "the gift", es: "el regalo", pt: "o presente", it: "il regalo", fr: "le cadeau", de: "das Geschenk", ja: "プレゼント", hi: "उपहार", ar: "الهدية", zh: "礼物" }, categories: ["social", "shopping"] },
  candle: { names: { en: "the candle", es: "la vela", pt: "a vela", it: "la candela", fr: "la bougie", de: "die Kerze", ja: "ろうそく", hi: "मोमबत्ती", ar: "الشمعة", zh: "蜡烛" }, categories: ["house", "social"] },
  guitar: { names: { en: "the guitar", es: "la guitarra", pt: "o violão", it: "la chitarra", fr: "la guitare", de: "die Gitarre", ja: "ギター", hi: "गिटार", ar: "الجيتار", zh: "吉他" }, categories: ["hobbies", "social"] },
  letter: { names: { en: "the letter", es: "la carta", pt: "a carta", it: "la lettera", fr: "la lettre", de: "der Brief", ja: "手紙", hi: "पत्र", ar: "الرسالة", zh: "信" }, categories: ["personal"] },
  coin: { names: { en: "the coin", es: "la moneda", pt: "a moeda", it: "la moneta", fr: "la pièce", de: "die Münze", ja: "コイン", hi: "सिक्का", ar: "العملة", zh: "硬币" }, categories: ["shopping", "numbers"] },
  watch: { names: { en: "the watch", es: "el reloj", pt: "o relógio", it: "l'orologio", fr: "la montre", de: "die Uhr", ja: "腕時計", hi: "घड़ी", ar: "الساعة", zh: "手表" }, categories: ["personal", "time"] },
  notebook: { names: { en: "the notebook", es: "el cuaderno", pt: "o caderno", it: "il quaderno", fr: "le cahier", de: "das Heft", ja: "ノート", hi: "कॉपी", ar: "الدفتر", zh: "笔记本" }, categories: ["personal", "academic"] },
};

export const ITEM_IDS = Object.keys(ITEM_CATALOG);

export function getItemName(itemId, lang = "en") {
  const entry = ITEM_CATALOG[itemId];
  if (!entry) return itemId;
  return entry.names[lang] || entry.names.en || itemId;
}

/**
 * Draw an item glyph onto a 2D context. size = canvas pixels (default 32).
 */
export function drawEpisodeItem(ctx, itemId, size = 32) {
  const drawer = DRAWERS[itemId];
  if (!drawer) return false;
  const S = Math.max(1, Math.floor(size / 16));
  ctx.imageSmoothingEnabled = false;
  drawer(ctx, S);
  return true;
}

/**
 * Bake an item glyph to a canvas (for world sprites / option cards).
 */
export function createItemCanvas(itemId, size = 32) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  drawEpisodeItem(ctx, itemId, size);
  return canvas;
}
