import { transliterateLatinToHindi } from "../../utils/hindiTransliteration.js";

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const capitalizeFirst = (value) => {
  if (!value) return value;
  return value.charAt(0).toLocaleUpperCase("hi-IN") + value.slice(1);
};

const lowerFirst = (value) => {
  if (!value) return value;
  return value.charAt(0).toLocaleLowerCase("hi-IN") + value.slice(1);
};

const TEXT_TRANSLATIONS = {
  "getting started": "शुरुआत",
  "first words": "पहले शब्द",
  "people & family": "लोग और परिवार",
  "my family": "मेरा परिवार",
  "more family": "परिवार के और सदस्य",
  "people around me": "मेरे आसपास के लोग",
  "people & family quiz": "लोग और परिवार क्विज़",
  "numbers 0-10": "0-10 संख्याएं",
  "zero to five": "शून्य से पांच",
  "six to ten": "छह से दस",
  "counting objects": "वस्तुओं की गिनती",
  "numbers quiz": "संख्या क्विज़",
  "hello & goodbye": "नमस्ते और अलविदा",
  "hello and goodbye": "नमस्ते और अलविदा",
  "saying hello": "नमस्ते कहना",
  "saying goodbye": "अलविदा कहना",
  "greetings in context": "संदर्भ में अभिवादन",
  "greetings quiz": "अभिवादन क्विज़",
  "yes, no & basic responses": "हाँ, नहीं और बुनियादी जवाब",
  "yes and no": "हाँ और नहीं",
  "maybe and i don't know": "शायद और मुझे नहीं पता",
  "quick responses": "तेज़ जवाब",
  "responses quiz": "जवाब क्विज़",
  "please & thank you": "कृपया और धन्यवाद",
  "please and thank you": "कृपया और धन्यवाद",
  "sorry and excuse me": "माफ़ कीजिए और क्षमा करें",
  "polite expressions": "शिष्ट अभिव्यक्तियां",
  "courtesy quiz": "शिष्टाचार क्विज़",
  "common objects": "सामान्य वस्तुएं",
  "things at home": "घर की चीज़ें",
  "personal items": "व्यक्तिगत वस्तुएं",
  "food and drink items": "खाने-पीने की चीज़ें",
  "objects quiz": "वस्तु क्विज़",
  colors: "रंग",
  "primary colors": "मूल रंग",
  "more colors": "और रंग",
  "black, white & neutral": "काला, सफेद और तटस्थ रंग",
  "colors quiz": "रंग क्विज़",
  "what's your name?": "आपका नाम क्या है?",
  "saying your name": "अपना नाम बताना",
  "asking names": "नाम पूछना",
  "nice to meet you": "आपसे मिलकर खुशी हुई",
  "introductions quiz": "परिचय क्विज़",
  "pre-a1 foundations": "Pre-A1 आधार",
  "everyday starters": "रोज़मर्रा की शुरुआत",
  "people & places": "लोग और स्थान",
  "actions & essentials": "क्रियाएं और ज़रूरी बातें",
  "time, travel & directions": "समय, यात्रा और दिशाएं",
  "question words": "प्रश्नवाचक शब्द",
  "days of week": "सप्ताह के दिन",
  "months & dates": "महीने और तारीखें",
  "telling time": "समय बताना",
  "family members": "परिवार के सदस्य",
  "family relationships": "पारिवारिक संबंध",
  "colors & shapes": "रंग और आकार",
  "food & drinks": "खाना और पेय",
  "daily routine": "दैनिक दिनचर्या",
  "likes & dislikes": "पसंद और नापसंद",
  "basic questions": "बुनियादी प्रश्न",
  "describing people": "लोगों का वर्णन",
  "describing places": "स्थानों का वर्णन",
  "shopping & money": "खरीदारी और पैसा",
  "making plans": "योजनाएं बनाना",
  "hobbies & interests": "शौक और रुचियां",
  "sports & exercise": "खेल और व्यायाम",
  "telling stories": "कहानियां सुनाना",
  "future plans": "भविष्य की योजनाएं",
  "health & body": "स्वास्थ्य और शरीर",
  "jobs & professions": "नौकरियां और पेशे",
  "school & education": "स्कूल और शिक्षा",
  "technology basics": "तकनीक की बुनियाद",
  "present perfect": "वर्तमान पूर्ण काल",
  "past continuous": "भूतकाल निरंतर",
  "future tense": "भविष्य काल",
  "giving advice": "सलाह देना",
  "making suggestions": "सुझाव देना",
  "conditional would": "शर्तीय would",
  "if i were you": "अगर मैं आपकी जगह होता",
  "travel & tourism": "यात्रा और पर्यटन",
  "culture & traditions": "संस्कृति और परंपराएं",
  "media & news": "मीडिया और समाचार",
  "expressing opinions": "राय व्यक्त करना",
  "making complaints": "शिकायत करना",
  "past perfect": "पूर्ण भूतकाल",
  "passive voice": "कर्मवाच्य",
  "reported speech": "रिपोर्टेड स्पीच",
  "relative clauses": "संबंधवाचक उपवाक्य",
  "formal vs informal": "औपचारिक बनाम अनौपचारिक",
  "business spanish": "व्यावसायिक स्पैनिश",
  "science & innovation": "विज्ञान और नवाचार",
  "social issues": "सामाजिक मुद्दे",
  "arts & literature": "कला और साहित्य",
  "cultural analysis": "सांस्कृतिक विश्लेषण",
  "politics & society": "राजनीति और समाज",
  "abstract concepts": "अमूर्त अवधारणाएं",
  "subjunctive present": "वर्तमान subjunctive",
  "subjunctive past": "भूतकाल subjunctive",
  "complex conditionals": "जटिल शर्तीय वाक्य",
  "idiomatic expressions": "मुहावरेदार अभिव्यक्तियां",
  "academic writing": "शैक्षणिक लेखन",
  "professional communication": "व्यावसायिक संचार",
  "debate & argumentation": "वाद-विवाद और तर्क",
  "literary techniques": "साहित्यिक तकनीकें",
  "advanced discourse": "उन्नत विमर्श",
  "native idioms": "स्थानीय मुहावरे",
  "regional variations": "क्षेत्रीय भिन्नताएं",
  "stylistic mastery": "शैलीगत महारत",
  "rhetorical devices": "अलंकारिक उपकरण",
  "specialized vocabulary": "विशेषीकृत शब्दावली",
  "subtle nuances": "सूक्ष्म अर्थभेद",
  "cultural expertise": "सांस्कृतिक विशेषज्ञता",
  "near-native fluency": "मूल वक्ता जैसी प्रवाहिता",
  "complete mastery": "पूर्ण महारत",
  "game review": "गेम रिव्यू",
  "conversation practice": "बातचीत अभ्यास",
  grammar: "व्याकरण",
  vocabulary: "शब्दावली",
  reading: "पठन",
  stories: "कहानियां",
  realtime: "रीयल-टाइम",
  "final quiz": "अंतिम क्विज़",
  "how do i get there?": "मैं वहाँ कैसे पहुँचूँ?",
  "how do they look?": "वे कैसे दिखते हैं?",
  "how do you feel?": "आप कैसा महसूस करते हैं?",
  "how's the weather?": "मौसम कैसा है?",
  "what do you do?": "आप क्या करते हैं?",
  "what do you enjoy?": "आपको क्या पसंद है?",
  "what did you do?": "आपने क्या किया?",
  "what will you do?": "आप क्या करेंगे?",
  "what day is it?": "आज कौन सा दिन है?",
  "what time is it?": "अभी कितने बजे हैं?",
  "where is it?": "यह कहाँ है?",
  "when's your birthday?": "आपका जन्मदिन कब है?",
  "tell me about yourself": "अपने बारे में बताइए",
  "meeting someone new": "किसी नए व्यक्ति से मिलना",
  "let's meet up!": "चलो मिलते हैं!",
  "why don't we?": "हम क्यों न...?",
  "something's wrong": "कुछ गड़बड़ है",
  "my story": "मेरी कहानी",
  "my day": "मेरा दिन",
  "my neighborhood": "मेरा पड़ोस",
  "my wardrobe": "मेरी अलमारी",
  "my favorite foods": "मेरे पसंदीदा भोजन",
  "my family tree": "मेरा परिवार वृक्ष",
  "our planet": "हमारा ग्रह",
  "tomorrow's world": "कल की दुनिया",
  "once upon a time": "एक समय की बात है",
  "sound natural": "स्वाभाविक लगें",
  "powerful speech": "प्रभावशाली भाषण",
  "perfect fluency": "पूर्ण प्रवाह",
  "100 must-know words and phrases to start fast":
    "तेज़ शुरुआत के लिए 100 ज़रूरी शब्द और वाक्यांश",
  "20 everyday verbs and short requests to get things done":
    "रोज़मर्रा के 20 क्रिया शब्द और छोटे अनुरोध",
  "20 words for time, transport, and finding your way":
    "समय, यात्रा और रास्ता खोजने के लिए 20 शब्द",
  "a guided tour of all learning modules":
    "सभी सीखने वाले मॉड्यूल्स की मार्गदर्शित यात्रा",
  "add 20 words for names, family, and moving around":
    "नाम, परिवार और इधर-उधर जाने के लिए 20 शब्द जोड़ें",
  "basic greetings and farewells":
    "बुनियादी अभिवादन और विदाई",
  "basic greetings and farewells for any situation":
    "हर स्थिति के लिए बुनियादी अभिवादन और विदाई",
  "count from zero to ten": "शून्य से दस तक गिनें",
  "count to twenty": "बीस तक गिनें",
  "finish the tutorial by playing a short game review.":
    "एक छोटा गेम रिव्यू खेलकर ट्यूटोरियल पूरा करें।",
  "improve your reading skills with a simple hello passage.":
    "नमस्ते वाले सरल पाठ से अपनी पढ़ने की क्षमता सुधारें।",
  "learn essential greetings and farewells":
    "ज़रूरी अभिवादन और विदाई सीखें",
  "learn how to use the app and explore all features":
    "ऐप का उपयोग करना और सभी फीचर्स देखना सीखें",
  "learn new words through interactive questions. practice saying 'hello'.":
    "इंटरैक्टिव प्रश्नों से नए शब्द सीखें। 'नमस्ते' कहना अभ्यास करें।",
  "learn new words with interactive questions. practice saying hello.":
    "इंटरैक्टिव प्रश्नों से नए शब्द सीखें। नमस्ते कहना अभ्यास करें।",
  "learn numbers 0-5": "0-5 तक की संख्याएं सीखें",
  "learn the words for close family members":
    "करीबी परिवार के सदस्यों के शब्द सीखें",
  "learn to count from twenty-one to one hundred":
    "इक्कीस से सौ तक गिनना सीखें",
  "learn to count from zero to twenty":
    "शून्य से बीस तक गिनना सीखें",
  "learn to introduce yourself": "अपना परिचय देना सीखें",
  "learn words for the people in your life":
    "अपनी ज़िंदगी के लोगों के लिए शब्द सीखें",
  "link vocabulary and grammar from the unit in a guided scenario.":
    "मार्गदर्शित परिस्थिति में इकाई की शब्दावली और व्याकरण को जोड़ें।",
  "practice in real situations": "वास्तविक स्थितियों में अभ्यास",
  "practice speaking with realtime conversations. say hello to complete this activity.":
    "रीयल-टाइम बातचीत से बोलने का अभ्यास करें। इस गतिविधि को पूरा करने के लिए नमस्ते कहें।",
  "practice with interactive stories that say hello.":
    "ऐसी इंटरैक्टिव कहानियों के साथ अभ्यास करें जिनमें नमस्ते कहा जाता है।",
  "round out 100 words with connectors, feelings, and quick questions":
    "जोड़ने वाले शब्द, भावनाएं और छोटे प्रश्नों के साथ 100 शब्द पूरे करें",
  "short targeted drills to consolidate the unit language before the quiz.":
    "क्विज़ से पहले इकाई की भाषा को मजबूत करने के लिए छोटे लक्षित अभ्यास।",
  "test color knowledge": "रंगों की समझ परखें",
  "test counting 0-10": "0-10 की गिनती परखें",
  "test greeting skills": "अभिवादन कौशल परखें",
  "test introduction skills": "परिचय कौशल परखें",
  "test object vocabulary": "वस्तु शब्दावली परखें",
  "test polite expressions": "शिष्ट अभिव्यक्तियां परखें",
  "test response skills": "जवाब देने का कौशल परखें",
  "the most important words": "सबसे महत्वपूर्ण शब्द",
  "use numbers to count things": "चीज़ों की गिनती के लिए संख्याओं का उपयोग करें",
  "your first 20 high-frequency words for greetings and basics":
    "अभिवादन और बुनियादी बातों के लिए आपके पहले 20 सामान्य शब्द",
  "your very first words": "आपके सबसे पहले शब्द",
  "the learner says hello.": "सीखने वाला नमस्ते कहता है।",
  "the learner says hello to you.": "सीखने वाला आपको नमस्ते कहता है।",
  "the learner names at least two extended family members.":
    "सीखने वाला कम से कम दो विस्तृत परिवार सदस्यों के नाम बताता है।",
  "the learner uses people vocabulary to describe someone.":
    "सीखने वाला किसी का वर्णन करने के लिए लोगों से जुड़ी शब्दावली का उपयोग करता है।",
  "the learner counts at least three objects using correct numbers.":
    "सीखने वाला सही संख्याओं के साथ कम से कम तीन वस्तुओं की गिनती करता है।",
  "the learner uses at least two different farewell expressions.":
    "सीखने वाला कम से कम दो अलग-अलग विदाई अभिव्यक्तियों का उपयोग करता है।",
  "the learner uses at least two uncertainty expressions.":
    "सीखने वाला अनिश्चितता की कम से कम दो अभिव्यक्तियों का उपयोग करता है।",
  "the learner uses apology and attention phrases appropriately.":
    "सीखने वाला माफ़ी और ध्यान आकर्षित करने वाले वाक्यांशों का सही उपयोग करता है।",
  "the learner uses at least two polite expressions naturally.":
    "सीखने वाला स्वाभाविक रूप से कम से कम दो शिष्ट अभिव्यक्तियों का उपयोग करता है।",
  "the learner names at least two food or drink items.":
    "सीखने वाला कम से कम दो खाने या पेय की चीज़ों के नाम बताता है।",
  "the learner names at least three colors in conversation.":
    "सीखने वाला बातचीत में कम से कम तीन रंग बताता है।",
  "the learner uses at least three color words including neutral colors.":
    "सीखने वाला तटस्थ रंगों सहित कम से कम तीन रंग शब्दों का उपयोग करता है।",
  "the learner asks for the other person's name using an appropriate phrase.":
    "सीखने वाला उचित वाक्यांश के साथ दूसरे व्यक्ति का नाम पूछता है।",
  "greet someone and say goodbye": "किसी का अभिवादन करें और अलविदा कहें",
  "introduce yourself and say where you're from":
    "अपना परिचय दें और बताएं कि आप कहाँ से हैं",
  "ask for help or make a simple request":
    "मदद मांगें या कोई सरल अनुरोध करें",
  "ask what time it is or for directions":
    "समय पूछें या रास्ता पूछें",
  "use polite phrases in a conversation":
    "बातचीत में विनम्र वाक्यांशों का उपयोग करें",
  "greet someone appropriately for the time of day":
    "दिन के समय के अनुसार उचित अभिवादन करें",
  "introduce yourself with your name and one fact":
    "अपने नाम और एक जानकारी के साथ अपना परिचय दें",
  "give your phone number or age": "अपना फोन नंबर या उम्र बताएं",
  "make plans for a specific day": "किसी खास दिन के लिए योजना बनाएं",
  "say when you do something daily": "बताएं कि आप रोज़ कोई काम कब करते हैं",
  "tell someone the current time": "किसी को वर्तमान समय बताएं",
  "describe your family members": "अपने परिवार के सदस्यों का वर्णन करें",
  "describe what color something is": "बताएं कि किसी चीज़ का रंग क्या है",
  "order food or say what you like to eat":
    "खाना ऑर्डर करें या बताएं कि आपको क्या खाना पसंद है",
  "describe what you're wearing": "बताएं कि आपने क्या पहना है",
  "describe your morning routine": "अपनी सुबह की दिनचर्या बताएं",
  "talk about today's weather": "आज के मौसम के बारे में बात करें",
  "say what you like and dislike": "बताएं कि आपको क्या पसंद और नापसंद है",
  "ask three questions about someone": "किसी व्यक्ति के बारे में तीन प्रश्न पूछें",
  "describe a person's appearance": "किसी व्यक्ति के रूप-रंग का वर्णन करें",
  "give directions to a nearby place": "पास की किसी जगह का रास्ता बताएं",
  "ask for a price and buy something": "कीमत पूछें और कुछ खरीदें",
  "ask about bus or train schedules":
    "बस या ट्रेन के समय के बारे में पूछें",
  "ask how to get somewhere": "पूछें कि कहीं कैसे पहुँचना है",
  "recommend a movie or book you enjoyed":
    "कोई फ़िल्म या किताब सुझाएं जो आपको पसंद आई हो",
  "talk about your favorite sport or exercise":
    "अपने पसंदीदा खेल या व्यायाम के बारे में बात करें",
  "describe how you're feeling today": "बताएं कि आप आज कैसा महसूस कर रहे हैं",
  "describe your job or dream career": "अपने काम या सपनों के करियर का वर्णन करें",
  "talk about your studies or learning goals":
    "अपनी पढ़ाई या सीखने के लक्ष्यों के बारे में बात करें",
  "compare two things and give your opinion":
    "दो चीज़ों की तुलना करें और अपनी राय दें",
  "describe a trip you took or want to take":
    "ऐसी यात्रा का वर्णन करें जो आपने की है या करना चाहते हैं",
  "explain a tradition from your culture":
    "अपनी संस्कृति की किसी परंपरा को समझाएं",
  "explain your opinion on a topic": "किसी विषय पर अपनी राय समझाएं",
  "describe a time you felt a strong emotion":
    "ऐसा समय बताएं जब आपने कोई गहरी भावना महसूस की हो",
  "talk about your goals for next year":
    "अगले साल के अपने लक्ष्यों के बारे में बात करें",
  "discuss an environmental issue": "किसी पर्यावरणीय मुद्दे पर चर्चा करें",
  "explain how you use technology daily":
    "समझाएं कि आप रोज़ तकनीक का कैसे उपयोग करते हैं",
  "user greets appropriately and uses a farewell expression":
    "उपयोगकर्ता सही तरीके से अभिवादन करता है और विदाई का एक वाक्यांश उपयोग करता है",
  "user states their name, origin, or introduces a person using 'this is...' or similar":
    "उपयोगकर्ता अपना नाम, मूल स्थान बताता है या 'यह...' जैसे वाक्य से किसी का परिचय कराता है",
  "user makes a clear request using appropriate verb forms":
    "उपयोगकर्ता सही क्रिया रूपों के साथ स्पष्ट अनुरोध करता है",
  "user asks about time or directions using question words":
    "उपयोगकर्ता प्रश्नवाचक शब्दों का उपयोग करके समय या रास्ता पूछता है",
  "user uses at least one polite expression naturally in context":
    "उपयोगकर्ता संदर्भ में स्वाभाविक रूप से कम से कम एक विनम्र अभिव्यक्ति का उपयोग करता है",
  "user uses appropriate greeting for context (morning/afternoon/evening)":
    "उपयोगकर्ता संदर्भ के अनुसार सही अभिवादन का उपयोग करता है (सुबह/दोपहर/शाम)",
  "user states their name and shares at least one personal detail":
    "उपयोगकर्ता अपना नाम बताता है और अपने बारे में कम से कम एक जानकारी साझा करता है",
  "user correctly produces numbers in the target language":
    "उपयोगकर्ता लक्ष्य भाषा में संख्याएं सही तरह से बोलता है",
  "user correctly names a day of the week in context":
    "उपयोगकर्ता संदर्भ में सप्ताह के दिन का सही नाम बताता है",
  "user expresses time of day or routine timing":
    "उपयोगकर्ता दिन के समय या दिनचर्या के समय को व्यक्त करता है",
  "user correctly states a time using appropriate format":
    "उपयोगकर्ता सही प्रारूप में समय बताता है",
  "user names family members and describes a relationship":
    "उपयोगकर्ता परिवार के सदस्यों के नाम बताता है और संबंध का वर्णन करता है",
  "user correctly uses color vocabulary":
    "उपयोगकर्ता रंगों की शब्दावली का सही उपयोग करता है",
  "user orders or expresses food preference":
    "उपयोगकर्ता खाना ऑर्डर करता है या खाने की पसंद बताता है",
  "user describes clothing items": "उपयोगकर्ता कपड़ों की चीज़ों का वर्णन करता है",
  "user describes at least two daily activities in sequence":
    "उपयोगकर्ता क्रम से कम से कम दो दैनिक गतिविधियां बताता है",
  "user describes weather conditions":
    "उपयोगकर्ता मौसम की स्थिति का वर्णन करता है",
  "user expresses a preference using like/dislike structures":
    "उपयोगकर्ता पसंद या नापसंद व्यक्त करने वाली संरचनाओं का उपयोग करता है",
  "user asks at least two questions using question words":
    "उपयोगकर्ता प्रश्नवाचक शब्दों से कम से कम दो प्रश्न पूछता है",
  "user uses adjectives to describe physical appearance":
    "उपयोगकर्ता शारीरिक रूप-रंग का वर्णन करने के लिए विशेषणों का उपयोग करता है",
  "user uses directional vocabulary or location prepositions":
    "उपयोगकर्ता दिशा शब्दावली या स्थान संबंधी अव्ययों का उपयोग करता है",
  "user asks price and completes a basic transaction":
    "उपयोगकर्ता कीमत पूछता है और एक साधारण लेन-देन पूरा करता है",
  "user asks about transportation times or locations":
    "उपयोगकर्ता यात्रा के समय या स्थानों के बारे में पूछता है",
  "user asks for directions using appropriate phrases":
    "उपयोगकर्ता सही वाक्यांशों का उपयोग करके रास्ता पूछता है",
  "user recommends something with a reason":
    "उपयोगकर्ता किसी चीज़ की वजह के साथ सिफारिश करता है",
  "user discusses sports/exercise with relevant vocabulary":
    "उपयोगकर्ता संबंधित शब्दावली के साथ खेल या व्यायाम पर बात करता है",
  "user describes physical or emotional state":
    "उपयोगकर्ता शारीरिक या भावनात्मक स्थिति का वर्णन करता है",
  "user describes work responsibilities or career aspirations":
    "उपयोगकर्ता काम की जिम्मेदारियों या करियर आकांक्षाओं का वर्णन करता है",
  "user discusses educational experiences or goals":
    "उपयोगकर्ता शैक्षिक अनुभवों या लक्ष्यों पर चर्चा करता है",
  "user uses comparative structures correctly":
    "उपयोगकर्ता तुलना वाली संरचनाओं का सही उपयोग करता है",
  "user describes travel using past or conditional forms":
    "उपयोगकर्ता यात्रा का वर्णन भूतकाल या शर्तीय रूपों में करता है",
  "user explains a cultural practice or tradition":
    "उपयोगकर्ता किसी सांस्कृतिक प्रथा या परंपरा को समझाता है",
  "user presents an opinion with supporting reasoning":
    "उपयोगकर्ता कारणों के साथ अपनी राय प्रस्तुत करता है",
  "user describes emotional experience with appropriate vocabulary":
    "उपयोगकर्ता उचित शब्दावली के साथ भावनात्मक अनुभव का वर्णन करता है",
  "user expresses future plans using appropriate tenses":
    "उपयोगकर्ता सही कालों का उपयोग करके भविष्य की योजनाएं बताता है",
  "user discusses environmental topic with relevant vocabulary":
    "उपयोगकर्ता संबंधित शब्दावली के साथ पर्यावरणीय विषय पर चर्चा करता है",
  "user describes technology use with specific examples":
    "उपयोगकर्ता उदाहरणों के साथ तकनीक के उपयोग का वर्णन करता है",
  "master grammar rules through exercises. practice greeting patterns.":
    "अभ्यासों के माध्यम से व्याकरण के नियमों में महारत हासिल करें। अभिवादन के पैटर्न का अभ्यास करें।",
  "grandparents, babies, and extended family":
    "दादा-दादी, शिशु और विस्तारित परिवार",
  "words for friends, children, and people you see every day":
    "दोस्तों, बच्चों और रोज़ दिखने वाले लोगों के लिए शब्द",
  "count from zero to ten in spanish":
    "स्पैनिश में शून्य से दस तक गिनें",
  "learn your first numbers: 0, 1, 2, 3, 4, 5":
    "अपनी पहली संख्याएं सीखें: 0, 1, 2, 3, 4, 5",
  "complete counting to ten: 6, 7, 8, 9, 10":
    "दस तक की गिनती पूरी करें: 6, 7, 8, 9, 10",
  "use numbers to count everyday things":
    "रोज़मर्रा की चीज़ों को गिनने के लिए संख्याओं का उपयोग करें",
  "learn different ways to greet people":
    "लोगों का अभिवादन करने के अलग-अलग तरीके सीखें",
  "learn farewell expressions for different situations":
    "अलग-अलग स्थितियों के लिए विदाई के वाक्यांश सीखें",
  "practice greetings in real-life situations":
    "वास्तविक जीवन की स्थितियों में अभिवादन का अभ्यास करें",
  "essential single-word responses for any conversation":
    "किसी भी बातचीत के लिए ज़रूरी एक-शब्दीय जवाब",
  "essential courtesy expressions for polite communication":
    "विनम्र संवाद के लिए ज़रूरी शिष्टाचार अभिव्यक्तियां",
  "additional phrases for gracious communication":
    "सौम्य संवाद के लिए अतिरिक्त वाक्यांश",
  "name everyday things around you":
    "अपने आसपास की रोज़मर्रा की चीज़ों के नाम बताएं",
  "basic food and drink vocabulary":
    "खाने और पीने की बुनियादी शब्दावली",
  "introduce yourself and ask others their names":
    "अपना परिचय दें और दूसरों के नाम पूछें",
  "say your name and origin": "अपना नाम और मूल स्थान बताएं",
  "daily activities": "दैनिक गतिविधियां",
  weather: "मौसम",
  preferences: "पसंद",
  "ask questions": "प्रश्न पूछें",
  "physical descriptions": "शारीरिक वर्णन",
  transportation: "परिवहन",
  directions: "दिशाएं",
  "background actions": "पृष्ठभूमि की क्रियाएं",
  "at the restaurant": "रेस्तरां में",
  "at the market": "बाज़ार में",
  "at the store": "दुकान में",
  "in the house": "घर में",
  clothing: "कपड़े",
  "counting to twenty": "बीस तक गिनना",
  "counting to one hundred": "सौ तक गिनना",
  "daily schedule": "दैनिक कार्यक्रम",
  "four seasons": "चार ऋतुएं",
  "making appointments": "मुलाकातें तय करना",
  "appearance words": "रूप-रंग से जुड़े शब्द",
  "places around town": "शहर के आसपास की जगहें",
  "buy things": "चीज़ें खरीदना",
  "food vocabulary": "भोजन शब्दावली",
  "getting around": "आवागमन",
  "current events": "समसामयिक घटनाएं",
  environment: "पर्यावरण",
  comparisons: "तुलनाएं",
  experiences: "अनुभव",
};

const PATTERN_TRANSLATORS = [
  [
    /^Learn key vocabulary for (.+)$/i,
    (topic) =>
      `${lowerFirst(translateSkillTreeTextToHindi(topic))} के लिए मुख्य शब्दावली सीखें`,
  ],
  [
    /^Practice (.+) in conversation$/i,
    (topic) =>
      `बातचीत में ${lowerFirst(translateSkillTreeTextToHindi(topic))} का अभ्यास करें`,
  ],
  [
    /^Apply (.+) skills$/i,
    (topic) =>
      `${lowerFirst(translateSkillTreeTextToHindi(topic))} से जुड़ी कौशल का उपयोग करें`,
  ],
  [
    /^Test your knowledge of (.+)$/i,
    (topic) =>
      `${lowerFirst(translateSkillTreeTextToHindi(topic))} पर अपनी समझ परखें`,
  ],
  [
    /^Review (.+) by playing an interactive game$/i,
    (topic) =>
      `इंटरैक्टिव गेम खेलकर ${lowerFirst(translateSkillTreeTextToHindi(topic))} दोहराएं`,
  ],
  [/^(.+) Quiz$/i, (topic) => `${translateSkillTreeTextToHindi(topic)} क्विज़`],
  [/^Learn to (.+)$/i, (topic) => `${lowerFirst(translateSkillTreeTextToHindi(topic))} सीखें`],
  [
    /^Practice (.+) in real conversations$/i,
    (topic) =>
      `वास्तविक बातचीत में ${lowerFirst(translateSkillTreeTextToHindi(topic))} का अभ्यास करें`,
  ],
  [
    /^Practice using (.+) in conversation$/i,
    (topic) =>
      `बातचीत में ${lowerFirst(translateSkillTreeTextToHindi(topic))} का अभ्यास करें`,
  ],
  [
    /^Practice (.+) in a real situation$/i,
    (topic) =>
      `वास्तविक स्थिति में ${lowerFirst(translateSkillTreeTextToHindi(topic))} का अभ्यास करें`,
  ],
  [
    /^Have a conversation about (.+)$/i,
    (topic) => `${translateSkillTreeTextToHindi(topic)} के बारे में बातचीत करें`,
  ],
  [
    /^Answer questions about (.+)$/i,
    (topic) =>
      `${translateSkillTreeTextToHindi(topic)} के बारे में प्रश्नों के उत्तर दें`,
  ],
  [
    /^Start a conversation about (.+)$/i,
    (topic) =>
      `${translateSkillTreeTextToHindi(topic)} के बारे में बातचीत शुरू करें`,
  ],
  [
    /^Use (.+) in a real situation$/i,
    (topic) =>
      `वास्तविक स्थिति में ${lowerFirst(translateSkillTreeTextToHindi(topic))} का उपयोग करें`,
  ],
  [
    /^User demonstrates use of (.+) in context$/i,
    (topic) =>
      `उपयोगकर्ता संदर्भ में ${lowerFirst(translateSkillTreeTextToHindi(topic))} का उपयोग दिखाता है`,
  ],
  [
    /^User uses (.+) correctly in context$/i,
    (topic) =>
      `उपयोगकर्ता संदर्भ में ${lowerFirst(translateSkillTreeTextToHindi(topic))} का सही उपयोग करता है`,
  ],
  [
    /^User demonstrates correct use of (.+)$/i,
    (topic) =>
      `उपयोगकर्ता ${lowerFirst(translateSkillTreeTextToHindi(topic))} का सही उपयोग दिखाता है`,
  ],
  [
    /^User answers questions using (.+) vocabulary correctly$/i,
    (topic) =>
      `उपयोगकर्ता ${lowerFirst(translateSkillTreeTextToHindi(topic))} से जुड़ी शब्दावली का सही उपयोग करके प्रश्नों का उत्तर देता है`,
  ],
  [
    /^User initiates and sustains conversation about (.+)$/i,
    (topic) =>
      `उपयोगकर्ता ${lowerFirst(translateSkillTreeTextToHindi(topic))} पर बातचीत शुरू करता है और उसे जारी रखता है`,
  ],
  [
    /^User participates meaningfully in conversation about (.+)$/i,
    (topic) =>
      `उपयोगकर्ता ${lowerFirst(translateSkillTreeTextToHindi(topic))} पर बातचीत में सार्थक भाग लेता है`,
  ],
  [
    /^User participates actively in a conversation about (.+)$/i,
    (topic) =>
      `उपयोगकर्ता ${lowerFirst(translateSkillTreeTextToHindi(topic))} पर बातचीत में सक्रिय भाग लेता है`,
  ],
  [
    /^Combine: (.+) and (.+)$/i,
    (first, second) =>
      `एक साथ उपयोग करें: ${translateSkillTreeTextToHindi(first)} और ${translateSkillTreeTextToHindi(second)}`,
  ],
  [
    /^Use what you learned: (.+) \+ (.+)$/i,
    (first, second) =>
      `सीखी हुई चीज़ों का उपयोग करें: ${translateSkillTreeTextToHindi(first)} + ${translateSkillTreeTextToHindi(second)}`,
  ],
  [
    /^Real-world practice: (.+)$/i,
    (topic) =>
      `वास्तविक जीवन अभ्यास: ${translateSkillTreeTextToHindi(topic)}`,
  ],
  [
    /^User demonstrates language from both (.+) and (.+) in their responses$/i,
    (first, second) =>
      `उपयोगकर्ता अपने उत्तरों में ${translateSkillTreeTextToHindi(first)} और ${translateSkillTreeTextToHindi(second)} दोनों की भाषा दिखाता है`,
  ],
  [
    /^User demonstrates skills from both lessons in a natural conversation$/i,
    () => "उपयोगकर्ता स्वाभाविक बातचीत में दोनों पाठों की कौशल दिखाता है",
  ],
  [
    /^User successfully navigates a realistic (.+) scenario$/i,
    (topic) =>
      `उपयोगकर्ता ${lowerFirst(translateSkillTreeTextToHindi(topic))} से जुड़ी वास्तविक स्थिति को सफलतापूर्वक संभालता है`,
  ],
];

export const translateSkillTreeTextToHindi = (value) => {
  const source = String(value || "").trim();
  if (!source) return source;

  const translated = TEXT_TRANSLATIONS[normalizeKey(source)];
  if (translated) {
    return source.charAt(0) === source.charAt(0).toLocaleUpperCase("en-US")
      ? capitalizeFirst(translated)
      : translated;
  }

  for (const [pattern, translate] of PATTERN_TRANSLATORS) {
    const match = source.match(pattern);
    if (match) return translate(...match.slice(1));
  }

  const transliterated = transliterateLatinToHindi(source);
  return transliterated && transliterated !== source ? transliterated : source;
};

const addHindiText = (value) => {
  if (Array.isArray(value)) return value.map(addHindiText);
  if (!value || typeof value !== "object") return value;

  const next = {};
  for (const [key, child] of Object.entries(value)) {
    next[key] = addHindiText(child);
  }

  if (
    typeof value.en === "string" &&
    typeof value.es === "string" &&
    typeof value.hi !== "string"
  ) {
    next.hi = translateSkillTreeTextToHindi(value.en);
  }

  if (
    typeof value.successCriteria === "string" &&
    typeof value.successCriteria_hi !== "string"
  ) {
    const translated = translateSkillTreeTextToHindi(value.successCriteria);
    if (translated && translated !== value.successCriteria) {
      next.successCriteria_hi = translated;
    }
  }

  return next;
};

export const withHindiSkillTreeText = (skillTree = []) =>
  addHindiText(skillTree);
