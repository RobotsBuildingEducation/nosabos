// The 12 authored episodes (RPG_REFINEMENT_PLAN.md § "The 12 episodes").
// A manifest is pure data: map recipe + cast + beat composition + content
// categories + copy. Every episode plays at every CEFR level — the level
// lives in the slot content, never here.
//
// beat kinds → primitives:
//   fetch    → P1 fetch-serve        listen → P2 listen-and-pick
//   check    → P3 choice-check       form   → P4 form-fill
//   mismatch → P5 spot-the-mismatch  (P6 say-aloud is offered on every beat)

const NAME_POOL = [
  "Ada", "Bruno", "Cleo", "Dana", "Emil", "Faro", "Gita", "Hana",
  "Iris", "Joro", "Kena", "Luca", "Mira", "Nilo", "Otta", "Pia",
];

export const EPISODE_MANIFESTS = {
  marketRush: {
    id: "marketRush",
    emoji: "🧺",
    rush: true,
    map: {
      blueprint: "market",
      layout: "plaza",
      width: 20,
      height: 14,
      stations: [
        { id: "stallA", type: "counter", zone: "top" },
        { id: "stallB", type: "counter", zone: "top" },
        { id: "register", type: "register", zone: "right" },
        { id: "crates", type: "shelf", zone: "left" },
      ],
    },
    cast: [{ role: "vendor" }, { role: "customer" }, { role: "customer" }],
    itemCategories: ["food", "shopping"],
    termCategories: ["food", "shopping", "numbers"],
    beats: [
      { kind: "fetch", npc: 0 },
      { kind: "check", npc: 1 },
      { kind: "listen", npc: 0 },
      { kind: "fetch", npc: 2 },
      { kind: "check", npc: 0 },
      { kind: "fetch", npc: 1 },
    ],
    finale: { kind: "fetch", npc: 0 },
    copy: {
      name: { en: "Market Rush", es: "Mercado a Tope", pt: "Correria no Mercado", it: "Mercato in Fermento", fr: "Marché en Folie", de: "Markttrubel", ja: "いそがしい市場", hi: "बाज़ार की भागदौड़", ar: "زحمة السوق", zh: "市场冲刺" },
      objective: { en: "Help the vendors fill every order.", es: "Ayuda a los vendedores con cada pedido.", pt: "Ajude os vendedores com cada pedido.", it: "Aiuta i venditori con ogni ordine.", fr: "Aide les vendeurs à préparer chaque commande.", de: "Hilf den Händlern bei jeder Bestellung.", ja: "屋台の注文をぜんぶ手伝おう。", hi: "हर ऑर्डर में दुकानदारों की मदद करें।", ar: "ساعد الباعة في تجهيز كل طلب.", zh: "帮摊主完成每一份订单。" },
    },
  },

  cafeShift: {
    id: "cafeShift",
    emoji: "☕",
    map: {
      blueprint: "market",
      layout: "room",
      width: 18,
      height: 13,
      stations: [
        { id: "counter", type: "counter", zone: "top" },
        { id: "register", type: "register", zone: "top" },
        { id: "tableA", type: "table", zone: "left" },
        { id: "tableB", type: "table", zone: "right" },
      ],
    },
    cast: [{ role: "coworker" }, { role: "customer" }, { role: "regular" }],
    itemCategories: ["restaurant", "food"],
    termCategories: ["food", "restaurant", "social"],
    beats: [
      { kind: "listen", npc: 1 },
      { kind: "check", npc: 0 },
      { kind: "fetch", npc: 1 },
      { kind: "listen", npc: 2 },
      { kind: "mismatch", npc: 0 },
      { kind: "check", npc: 2 },
    ],
    finale: { kind: "listen", npc: 2 },
    copy: {
      name: { en: "Café Shift", es: "Turno de Café", pt: "Turno no Café", it: "Turno al Caffè", fr: "Service au Café", de: "Café-Schicht", ja: "カフェのシフト", hi: "कैफ़े की पारी", ar: "مناوبة المقهى", zh: "咖啡馆值班" },
      objective: { en: "Take the orders and keep every customer happy.", es: "Toma los pedidos y deja contentos a los clientes.", pt: "Anote os pedidos e deixe os clientes felizes.", it: "Prendi le ordinazioni e accontenta i clienti.", fr: "Prends les commandes et satisfais chaque client.", de: "Nimm die Bestellungen auf und mach alle Gäste glücklich.", ja: "注文を聞いて、お客さんをよろこばせよう。", hi: "ऑर्डर लें और हर ग्राहक को खुश रखें।", ar: "خذ الطلبات وأسعد كل الزبائن.", zh: "记下点单，让每位顾客满意。" },
    },
  },

  movingDay: {
    id: "movingDay",
    emoji: "📦",
    map: {
      blueprint: "home",
      layout: "room",
      width: 18,
      height: 13,
      stations: [
        { id: "sofa", type: "sofa", zone: "left" },
        { id: "tv", type: "tv", zone: "top" },
        { id: "bookshelf", type: "bookshelf", zone: "right" },
        { id: "lamp", type: "lamp", zone: "top" },
      ],
    },
    cast: [{ role: "mover" }, { role: "mover" }, { role: "homeowner" }],
    itemCategories: ["house"],
    termCategories: ["house", "descriptive"],
    beats: [
      { kind: "listen", npc: 0 },
      { kind: "fetch", npc: 2 },
      { kind: "check", npc: 1 },
      { kind: "mismatch", npc: 2 },
      { kind: "fetch", npc: 0 },
      { kind: "check", npc: 2 },
    ],
    finale: { kind: "listen", npc: 2 },
    copy: {
      name: { en: "Moving Day", es: "Día de Mudanza", pt: "Dia de Mudança", it: "Giorno del Trasloco", fr: "Jour de Déménagement", de: "Umzugstag", ja: "引っこしの日", hi: "शिफ़्टिंग का दिन", ar: "يوم الانتقال", zh: "搬家日" },
      objective: { en: "Get everything into the right place.", es: "Pon cada cosa en su lugar.", pt: "Coloque cada coisa no lugar certo.", it: "Metti ogni cosa al posto giusto.", fr: "Range chaque chose à sa place.", de: "Bring alles an den richtigen Platz.", ja: "ぜんぶ正しい場所に置こう。", hi: "हर चीज़ सही जगह पहुँचाएँ।", ar: "ضع كل شيء في مكانه الصحيح.", zh: "把每样东西放到正确的位置。" },
    },
  },

  frontDesk: {
    id: "frontDesk",
    emoji: "🛎️",
    map: {
      blueprint: "civic",
      layout: "hall",
      width: 19,
      height: 14,
      stations: [
        { id: "desk", type: "desk", zone: "top" },
        { id: "shelfA", type: "shelf", zone: "left" },
        { id: "shelfB", type: "shelf", zone: "right" },
        { id: "bench", type: "bench", zone: "bottom" },
      ],
    },
    cast: [{ role: "guest" }, { role: "manager" }, { role: "guest" }],
    itemCategories: ["personal", "travel"],
    termCategories: ["personal", "descriptive", "time"],
    beats: [
      { kind: "listen", npc: 0 },
      { kind: "fetch", npc: 0 },
      { kind: "form", npc: 1 },
      { kind: "mismatch", npc: 1 },
      { kind: "fetch", npc: 2 },
      { kind: "check", npc: 2 },
    ],
    finale: { kind: "form", npc: 1 },
    copy: {
      name: { en: "Front Desk", es: "Recepción", pt: "Recepção", it: "Reception", fr: "Accueil", de: "Empfang", ja: "フロントデスク", hi: "फ़्रंट डेस्क", ar: "مكتب الاستقبال", zh: "前台" },
      objective: { en: "Reunite every guest with their lost things.", es: "Devuelve a cada huésped sus cosas perdidas.", pt: "Devolva a cada hóspede seus objetos perdidos.", it: "Restituisci a ogni ospite i suoi oggetti smarriti.", fr: "Rends à chaque client ses objets perdus.", de: "Gib jedem Gast seine verlorenen Sachen zurück.", ja: "落とし物を持ち主に返そう。", hi: "हर मेहमान को उसकी खोई चीज़ें लौटाएँ।", ar: "أعد لكل نزيل أغراضه المفقودة.", zh: "帮每位客人找回失物。" },
    },
  },

  ticketWindow: {
    id: "ticketWindow",
    emoji: "🚉",
    map: {
      blueprint: "transit",
      layout: "hall",
      width: 20,
      height: 14,
      stations: [
        { id: "board", type: "sign", zone: "top" },
        { id: "window", type: "desk", zone: "top" },
        { id: "gate", type: "gate", zone: "right" },
        { id: "luggage", type: "suitcaseStack", zone: "left" },
      ],
    },
    cast: [{ role: "traveler" }, { role: "traveler" }, { role: "announcer" }],
    itemCategories: ["travel"],
    termCategories: ["travel", "numbers", "time", "directions"],
    beats: [
      { kind: "check", npc: 0 },
      { kind: "form", npc: 0 },
      { kind: "listen", npc: 2 },
      { kind: "check", npc: 1 },
      { kind: "mismatch", npc: 2 },
      { kind: "form", npc: 1 },
    ],
    finale: { kind: "mismatch", npc: 2 },
    copy: {
      name: { en: "Ticket Window", es: "Taquilla", pt: "Bilheteria", it: "Biglietteria", fr: "Guichet", de: "Fahrkartenschalter", ja: "きっぷ売り場", hi: "टिकट खिड़की", ar: "شباك التذاكر", zh: "售票窗口" },
      objective: { en: "Get every traveler on the right departure.", es: "Pon a cada viajero en la salida correcta.", pt: "Coloque cada viajante na partida certa.", it: "Manda ogni viaggiatore alla partenza giusta.", fr: "Mets chaque voyageur dans le bon départ.", de: "Bring jeden Reisenden zur richtigen Abfahrt.", ja: "旅行者を正しい便に案内しよう。", hi: "हर यात्री को सही रवानगी तक पहुँचाएँ।", ar: "أوصل كل مسافر إلى الرحلة الصحيحة.", zh: "让每位旅客赶上正确的班次。" },
    },
  },

  clinic: {
    id: "clinic",
    emoji: "🩺",
    map: {
      blueprint: "lab",
      layout: "room",
      width: 18,
      height: 13,
      stations: [
        { id: "desk", type: "desk", zone: "top" },
        { id: "pharmacy", type: "shelf", zone: "right" },
        { id: "bench", type: "bench", zone: "left" },
        { id: "plant", type: "plant", zone: "top" },
      ],
    },
    cast: [{ role: "patient" }, { role: "doctor" }, { role: "patient" }],
    itemCategories: ["health"],
    termCategories: ["health", "emotions", "problems"],
    beats: [
      { kind: "listen", npc: 0 },
      { kind: "check", npc: 1 },
      { kind: "fetch", npc: 0 },
      { kind: "check", npc: 2 },
      { kind: "form", npc: 1 },
      { kind: "mismatch", npc: 1 },
    ],
    finale: { kind: "check", npc: 2 },
    copy: {
      name: { en: "The Clinic", es: "La Clínica", pt: "A Clínica", it: "La Clinica", fr: "La Clinique", de: "Die Klinik", ja: "クリニック", hi: "क्लिनिक", ar: "العيادة", zh: "诊所" },
      objective: { en: "Help each patient feel better.", es: "Ayuda a cada paciente a sentirse mejor.", pt: "Ajude cada paciente a se sentir melhor.", it: "Aiuta ogni paziente a stare meglio.", fr: "Aide chaque patient à aller mieux.", de: "Hilf jedem Patienten, sich besser zu fühlen.", ja: "患者さんを元気にしよう。", hi: "हर मरीज़ को बेहतर महसूस कराएँ।", ar: "ساعد كل مريض على الشعور بتحسن.", zh: "帮每位病人好起来。" },
    },
  },

  partyPrep: {
    id: "partyPrep",
    emoji: "🎉",
    map: {
      blueprint: "festival",
      layout: "plaza",
      width: 20,
      height: 14,
      stations: [
        { id: "balloons", type: "balloons", zone: "top" },
        { id: "speaker", type: "speaker", zone: "left" },
        { id: "table", type: "table", zone: "center" },
        { id: "giftTable", type: "table", zone: "right" },
      ],
    },
    cast: [{ role: "host" }, { role: "guest" }, { role: "guest" }],
    itemCategories: ["social", "hobbies", "food"],
    termCategories: ["social", "family", "hobbies", "time"],
    beats: [
      { kind: "check", npc: 0 },
      { kind: "form", npc: 0 },
      { kind: "mismatch", npc: 1 },
      { kind: "listen", npc: 2 },
      { kind: "fetch", npc: 1 },
      { kind: "check", npc: 2 },
    ],
    finale: { kind: "check", npc: 0 },
    copy: {
      name: { en: "Party Prep", es: "Preparando la Fiesta", pt: "Preparando a Festa", it: "Preparativi della Festa", fr: "Préparatifs de Fête", de: "Partyvorbereitung", ja: "パーティーのじゅんび", hi: "पार्टी की तैयारी", ar: "تحضير الحفلة", zh: "派对筹备" },
      objective: { en: "Get everything ready before the guests arrive.", es: "Deja todo listo antes de que lleguen los invitados.", pt: "Deixe tudo pronto antes dos convidados chegarem.", it: "Prepara tutto prima che arrivino gli ospiti.", fr: "Prépare tout avant l'arrivée des invités.", de: "Mach alles fertig, bevor die Gäste kommen.", ja: "お客さんが来る前にじゅんびしよう。", hi: "मेहमानों के आने से पहले सब तैयार करें।", ar: "جهّز كل شيء قبل وصول الضيوف.", zh: "在客人到来前把一切准备好。" },
    },
  },

  detective: {
    id: "detective",
    emoji: "🔍",
    map: {
      blueprint: "civic",
      layout: "plaza",
      width: 19,
      height: 14,
      stations: [
        { id: "fountain", type: "fountain", zone: "center" },
        { id: "bench", type: "bench", zone: "left" },
        { id: "sign", type: "sign", zone: "top" },
        { id: "lamp", type: "lamp", zone: "right" },
      ],
    },
    cast: [{ role: "witness" }, { role: "witness" }, { role: "constable" }],
    itemCategories: ["personal"],
    termCategories: ["questions", "time", "verbs", "experiences"],
    beats: [
      { kind: "listen", npc: 0 },
      { kind: "mismatch", npc: 0 },
      { kind: "check", npc: 2 },
      { kind: "listen", npc: 1 },
      { kind: "mismatch", npc: 1 },
      { kind: "check", npc: 2 },
    ],
    finale: { kind: "mismatch", npc: 2 },
    copy: {
      name: { en: "The Detective", es: "El Detective", pt: "O Detetive", it: "Il Detective", fr: "Le Détective", de: "Der Detektiv", ja: "たんてい", hi: "जासूस", ar: "المحقق", zh: "侦探" },
      objective: { en: "Question the witnesses and find what doesn't add up.", es: "Interroga a los testigos y encuentra lo que no cuadra.", pt: "Interrogue as testemunhas e ache o que não bate.", it: "Interroga i testimoni e trova ciò che non torna.", fr: "Interroge les témoins et trouve ce qui cloche.", de: "Befrage die Zeugen und finde, was nicht passt.", ja: "目撃者に話を聞いて、おかしな点を見つけよう。", hi: "गवाहों से पूछताछ करें और गड़बड़ी पकड़ें।", ar: "استجوب الشهود واكتشف ما لا يستقيم.", zh: "询问证人，找出矛盾之处。" },
    },
  },

  fortuneTeller: {
    id: "fortuneTeller",
    emoji: "🔮",
    map: {
      blueprint: "festival",
      layout: "room",
      width: 17,
      height: 12,
      stations: [
        { id: "table", type: "table", zone: "center" },
        { id: "lamp", type: "lamp", zone: "left" },
        { id: "bookshelf", type: "bookshelf", zone: "right" },
        { id: "sign", type: "sign", zone: "top" },
      ],
    },
    cast: [{ role: "seer" }, { role: "querent" }, { role: "querent" }],
    itemCategories: ["personal", "time"],
    termCategories: ["weather", "time", "uncertainty", "conversation"],
    beats: [
      { kind: "check", npc: 0 },
      { kind: "check", npc: 1 },
      { kind: "listen", npc: 0 },
      { kind: "form", npc: 2 },
      { kind: "mismatch", npc: 0 },
      { kind: "check", npc: 1 },
    ],
    finale: { kind: "check", npc: 0 },
    copy: {
      name: { en: "Fortune Teller", es: "La Adivina", pt: "A Vidente", it: "L'Indovina", fr: "La Voyante", de: "Die Wahrsagerin", ja: "うらない師", hi: "भविष्यवक्ता", ar: "العرّافة", zh: "占卜师" },
      objective: { en: "Help the seer read what tomorrow holds.", es: "Ayuda a la adivina a leer lo que viene.", pt: "Ajude a vidente a ler o que vem por aí.", it: "Aiuta l'indovina a leggere il domani.", fr: "Aide la voyante à lire l'avenir.", de: "Hilf der Wahrsagerin, das Morgen zu deuten.", ja: "うらない師といっしょに明日を読もう。", hi: "भविष्यवक्ता के साथ आने वाला कल पढ़ें।", ar: "ساعد العرّافة على قراءة الغد.", zh: "帮占卜师解读明天。" },
    },
  },

  newsroom: {
    id: "newsroom",
    emoji: "📰",
    map: {
      blueprint: "library",
      layout: "room",
      width: 18,
      height: 13,
      stations: [
        { id: "editorDesk", type: "desk", zone: "top" },
        { id: "wireDesk", type: "desk", zone: "left" },
        { id: "monitor", type: "tv", zone: "right" },
        { id: "archive", type: "bookshelf", zone: "bottom" },
      ],
    },
    cast: [{ role: "editor" }, { role: "reporter" }, { role: "factChecker" }],
    itemCategories: ["academic", "personal", "technology"],
    termCategories: ["professional", "work", "social-issues", "uncertainty"],
    beats: [
      { kind: "check", npc: 0 },
      { kind: "mismatch", npc: 2 },
      { kind: "form", npc: 0 },
      { kind: "listen", npc: 1 },
      { kind: "check", npc: 2 },
      { kind: "mismatch", npc: 0 },
    ],
    finale: { kind: "form", npc: 0 },
    copy: {
      name: { en: "The Newsroom", es: "La Redacción", pt: "A Redação", it: "La Redazione", fr: "La Rédaction", de: "Die Redaktion", ja: "ニュース編集室", hi: "न्यूज़रूम", ar: "غرفة الأخبار", zh: "新闻编辑室" },
      objective: { en: "Get tonight's bulletin ready — and accurate.", es: "Prepara el boletín de hoy, sin errores.", pt: "Prepare o boletim de hoje, sem erros.", it: "Prepara il notiziario di stasera, senza errori.", fr: "Prépare le bulletin du soir, sans erreur.", de: "Mach die Abendnachrichten fertig — fehlerfrei.", ja: "今夜のニュースをまちがいなく仕上げよう。", hi: "आज का बुलेटिन बिना गलती तैयार करें।", ar: "جهّز نشرة الليلة بدقة.", zh: "把今晚的新闻稿准备好，不能出错。" },
    },
  },

  tertulia: {
    id: "tertulia",
    emoji: "🗣️",
    map: {
      blueprint: "library",
      layout: "room",
      width: 17,
      height: 12,
      stations: [
        { id: "table", type: "table", zone: "center" },
        { id: "shelfA", type: "bookshelf", zone: "left" },
        { id: "shelfB", type: "bookshelf", zone: "right" },
        { id: "plant", type: "plant", zone: "top" },
      ],
    },
    cast: [{ role: "moderator" }, { role: "debater" }, { role: "debater" }],
    itemCategories: ["restaurant", "academic"],
    termCategories: ["debate", "rhetoric", "connector", "academic", "abstract"],
    beats: [
      { kind: "listen", npc: 0 },
      { kind: "check", npc: 1 },
      { kind: "check", npc: 2 },
      { kind: "mismatch", npc: 1 },
      { kind: "mismatch", npc: 2 },
      { kind: "check", npc: 0 },
    ],
    finale: { kind: "check", npc: 0 },
    copy: {
      name: { en: "Tertulia", es: "La Tertulia", pt: "A Tertúlia", it: "Il Circolo", fr: "Le Cercle", de: "Der Debattierklub", ja: "討論サロン", hi: "चर्चा मंडली", ar: "النقاش", zh: "辩论沙龙" },
      objective: { en: "Hold your own in the debate circle.", es: "Defiende tu postura en la tertulia.", pt: "Defenda sua posição na tertúlia.", it: "Difendi la tua posizione nel circolo.", fr: "Défends ta position dans le cercle.", de: "Behaupte dich in der Debattenrunde.", ja: "討論の輪で自分の意見を守ろう。", hi: "चर्चा में अपनी बात मज़बूती से रखें।", ar: "دافع عن رأيك في حلقة النقاش.", zh: "在辩论圈里站稳立场。" },
    },
  },

  storyWorkshop: {
    id: "storyWorkshop",
    emoji: "🎭",
    map: {
      blueprint: "festival",
      layout: "hall",
      width: 19,
      height: 14,
      stations: [
        { id: "speakerA", type: "speaker", zone: "left" },
        { id: "speakerB", type: "speaker", zone: "right" },
        { id: "marquee", type: "sign", zone: "top" },
        { id: "bench", type: "bench", zone: "bottom" },
      ],
    },
    cast: [{ role: "director" }, { role: "actor" }, { role: "actor" }],
    itemCategories: ["hobbies", "academic", "house"],
    termCategories: ["experiences", "emotions", "idiom", "culture", "descriptive"],
    beats: [
      { kind: "listen", npc: 0 },
      { kind: "form", npc: 0 },
      { kind: "check", npc: 1 },
      { kind: "fetch", npc: 2 },
      { kind: "mismatch", npc: 0 },
      { kind: "check", npc: 2 },
    ],
    finale: { kind: "check", npc: 1 },
    copy: {
      name: { en: "Story Workshop", es: "Taller de Historias", pt: "Oficina de Histórias", it: "Laboratorio di Storie", fr: "Atelier d'Histoires", de: "Geschichtenwerkstatt", ja: "ものがたり工房", hi: "कहानी कार्यशाला", ar: "ورشة القصص", zh: "故事工坊" },
      objective: { en: "Help the director stage the scene just right.", es: "Ayuda a montar la escena tal como debe ser.", pt: "Ajude a montar a cena do jeito certo.", it: "Aiuta a mettere in scena tutto alla perfezione.", fr: "Aide à monter la scène comme il faut.", de: "Hilf, die Szene richtig auf die Bühne zu bringen.", ja: "監督といっしょに場面を仕上げよう。", hi: "निर्देशक के साथ दृश्य को सही ढंग से सजाएँ।", ar: "ساعد المخرج على إخراج المشهد كما يجب.", zh: "帮导演把这场戏排到位。" },
    },
  },
};

export function getEpisodeManifest(episodeId) {
  return EPISODE_MANIFESTS[episodeId] || EPISODE_MANIFESTS.marketRush;
}

export function dealCastNames(manifest, rng = Math.random) {
  const pool = [...NAME_POOL];
  return (manifest.cast || []).map(() => {
    if (!pool.length) return "Ari";
    const idx = Math.floor(rng() * pool.length);
    return pool.splice(idx, 1)[0];
  });
}

export function getEpisodeName(manifest, lang = "en") {
  return manifest?.copy?.name?.[lang] || manifest?.copy?.name?.en || manifest?.id;
}

export function getEpisodeObjective(manifest, lang = "en") {
  return (
    manifest?.copy?.objective?.[lang] || manifest?.copy?.objective?.en || ""
  );
}
