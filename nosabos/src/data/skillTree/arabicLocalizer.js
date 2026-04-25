/**
 * Adds Egyptian Arabic support-language copy to skill-tree payloads.
 *
 * This follows the same support-language localizer pattern used by the other
 * support locales, but stays conservative: when a string is unknown we keep
 * the original English fallback instead of guessing a bad translation.
 */

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const TEXT_TRANSLATIONS = {
  "getting started": "البداية",
  "first words": "أول كلمات",
  "people & family": "الناس والعيلة",
  "my family": "عيلتي",
  "more family": "العيلة الكبيرة",
  "people around me": "الناس اللي حواليا",
  "numbers 0-10": "الأرقام من 0 إلى 10",
  "zero to five": "من صفر لخمسة",
  "six to ten": "من ستة لعشرة",
  "counting objects": "عدّ الأشياء",
  "hello & goodbye": "أهلًا ومع السلامة",
  "hello and goodbye": "أهلًا ومع السلامة",
  "saying hello": "قول أهلًا",
  "saying goodbye": "قول مع السلامة",
  "greetings in context": "التحيات في السياق",
  greetings: "التحيات",
  "yes, no & basic responses": "أيوه، لأ، وردود أساسية",
  "yes and no": "أيوه ولأ",
  "maybe and i don't know": "يمكن ومش عارف",
  "quick responses": "ردود سريعة",
  "please & thank you": "من فضلك وشكرًا",
  "please and thank you": "من فضلك وشكرًا",
  "sorry and excuse me": "آسف ولو سمحت",
  "polite expressions": "تعبيرات مهذبة",
  "common objects": "أشياء شائعة",
  "things at home": "حاجات في البيت",
  "personal items": "أغراض شخصية",
  "food and drink items": "أكلات ومشروبات",
  colors: "الألوان",
  "primary colors": "الألوان الأساسية",
  "more colors": "ألوان زيادة",
  "black, white & neutral": "أسود وأبيض وألوان حيادية",
  "what's your name?": "اسمك إيه؟",
  "saying your name": "قول اسمك",
  "asking names": "سؤال عن الأسماء",
  "nice to meet you": "تشرفت بيك",
  "pre-a1 foundations": "أساسيات ما قبل A1",
  "everyday starters": "بدايات يومية",
  "people & places": "الناس والأماكن",
  "actions & essentials": "الأفعال والأساسيات",
  "time, travel & directions": "الوقت والسفر والاتجاهات",
  "question words": "أدوات السؤال",
  "days of week": "أيام الأسبوع",
  "months & dates": "الشهور والتواريخ",
  "telling time": "معرفة الوقت",
  "family members": "أفراد العيلة",
  "family relationships": "علاقات العيلة",
  "colors & shapes": "الألوان والأشكال",
  "food & drinks": "الأكل والشرب",
  "daily routine": "الروتين اليومي",
  "likes & dislikes": "الحاجات اللي بتحبها واللي ما بتحبهاش",
  "basic questions": "أسئلة أساسية",
  "describing people": "وصف الناس",
  "describing places": "وصف الأماكن",
  "shopping & money": "التسوّق والفلوس",
  "making plans": "وضع خطط",
  "hobbies & interests": "الهوايات والاهتمامات",
  "sports & exercise": "الرياضة والتمارين",
  "telling stories": "حكي القصص",
  "future plans": "خطط المستقبل",
  "health & body": "الصحة والجسم",
  "jobs & professions": "الوظايف والمهن",
  "school & education": "المدرسة والتعليم",
  "technology basics": "أساسيات التكنولوجيا",
  "giving advice": "إعطاء نصيحة",
  "making suggestions": "تقديم اقتراحات",
  "travel & tourism": "السفر والسياحة",
  "culture & traditions": "الثقافة والتقاليد",
  "media & news": "الإعلام والأخبار",
  "expressing opinions": "التعبير عن الآراء",
  "making complaints": "تقديم شكاوى",
  "business spanish": "الإسبانية للأعمال",
  "science & innovation": "العلم والابتكار",
  "social issues": "قضايا اجتماعية",
  "arts & literature": "الفن والأدب",
  "cultural analysis": "تحليل ثقافي",
  "politics & society": "السياسة والمجتمع",
  "abstract concepts": "مفاهيم مجرّدة",
  "academic writing": "كتابة أكاديمية",
  "professional communication": "تواصل مهني",
  "debate & argumentation": "النقاش وبناء الحُجج",
  "near-native fluency": "طلاقة قريبة من أهل اللغة",
  "complete mastery": "إتقان كامل",
  "game review": "مراجعة باللعبة",
  "conversation practice": "تدريب المحادثة",
  grammar: "القواعد",
  vocabulary: "المفردات",
  reading: "القراءة",
  stories: "القصص",
  realtime: "محادثة مباشرة",
  "final quiz": "الاختبار النهائي",
  "how do i get there?": "أوصل هناك إزاي؟",
  "how do they look?": "شكلهم عامل إزاي؟",
  "how do you feel?": "حاسس بإيه؟",
  "how's the weather?": "الجو عامل إيه؟",
  "what do you do?": "بتشتغل إيه؟",
  "what do you enjoy?": "إيه اللي بتحبّه؟",
  "what did you do?": "عملت إيه؟",
  "what will you do?": "هتعمل إيه؟",
  "what day is it?": "النهارده إيه؟",
  "what time is it?": "الساعة كام؟",
  "where is it?": "هي فين؟",
  "when's your birthday?": "عيد ميلادك إمتى؟",
  "tell me about yourself": "احكي لي عن نفسك",
  "meeting someone new": "مقابلة شخص جديد",
  "let's meet up!": "يلا نتقابل!",
  "why don't we?": "ليه ما نعملش كده؟",
  "something's wrong": "في حاجة غلط",
  "my story": "قصتي",
  "my day": "يومي",
  "my neighborhood": "منطقتي",
  "my wardrobe": "هدومي",
  "my favorite foods": "أكلاتي المفضلة",
  "my family tree": "شجرة عيلتي",
  "our planet": "كوكبنا",
  "tomorrow's world": "عالم بكرة",
  "once upon a time": "كان يا ما كان",
  "sound natural": "اتكلم بشكل طبيعي",
  "powerful speech": "كلام قوي",
  "perfect fluency": "طلاقة ممتازة",
  "finish the tutorial by playing a short game review.":
    "كمّل الشرح التمهيدي بلعبة مراجعة قصيرة.",
  "learn how to use the app and explore all features":
    "اتعلّم إزاي تستخدم التطبيق وتكتشف كل المزايا",
  "a guided tour of all learning modules":
    "جولة إرشادية في كل وحدات التعلّم",
  "learn words for the people in your life":
    "اتعلّم كلمات للناس الموجودين في حياتك",
  "the learner says hello.": "يقول المتعلم أهلًا.",
  "the learner says hello to you.": "المتعلم يقول لك أهلًا.",
  "the learner names at least two extended family members.":
    "يسمّي المتعلم اتنين على الأقل من أفراد العيلة الكبيرة.",
  "the learner uses people vocabulary to describe someone.":
    "يستخدم المتعلم مفردات الناس لوصف شخص.",
  "test your knowledge of people and family words":
    "اختبر معرفتك بكلمات الناس والعيلة",
  "learn your first numbers: 0, 1, 2, 3, 4, 5":
    "اتعلّم أول أرقامك: 0، 1، 2، 3، 4، 5",
  "complete counting to ten: 6, 7, 8, 9, 10":
    "كمّل العد لحد عشرة: 6، 7، 8، 9، 10",
  "use numbers to count everyday things":
    "استخدم الأرقام لعدّ الحاجات اليومية",
  "numbers quiz": "اختبار الأرقام",
  "test your counting skills from 0 to 10":
    "اختبر مهاراتك في العد من 0 لحد 10",
  "learn farewell expressions for different situations":
    "اتعلّم عبارات الوداع لمواقف مختلفة",
  "the learner uses at least two different farewell expressions.":
    "يستخدم المتعلم عبارتين وداع مختلفتين على الأقل.",
  "practice greetings in real-life situations":
    "اتدرّب على التحيات في مواقف من الحياة الواقعية",
  "test your greeting and farewell skills":
    "اختبر مهاراتك في التحية والوداع",
  "master the most important words in any language":
    "اتقن أهم الكلمات في أي لغة",
  "the learner uses at least two uncertainty expressions.":
    "يستخدم المتعلم عبارتين على الأقل للتعبير عن عدم التأكد.",
  "responses quiz": "اختبار الردود",
  "test your ability to respond appropriately":
    "اختبر قدرتك على الرد بشكل مناسب",
  "the learner uses apology and attention phrases appropriately.":
    "يستخدم المتعلم عبارات الاعتذار ولفت الانتباه بشكل مناسب.",
  "the learner uses at least two polite expressions naturally.":
    "يستخدم المتعلم عبارتين مهذبتين على الأقل بشكل طبيعي.",
  "courtesy quiz": "اختبار المجاملات",
  "test your polite expression skills":
    "اختبر مهاراتك في التعبيرات المهذبة",
  "learn names of common household items":
    "اتعلّم أسماء حاجات البيت الشائعة",
  "the learner names at least two food or drink items.":
    "يسمّي المتعلم نوعين على الأقل من الأكل أو الشرب.",
  "objects quiz": "اختبار الأشياء",
  "learn to identify and name colors":
    "اتعلّم تميّز الألوان وتسمّيها",
  "the learner names at least three colors in conversation.":
    "يسمّي المتعلم ثلاثة ألوان على الأقل في المحادثة.",
  "complete your color palette": "كمّل لوحة ألوانك",
  "the learner uses at least three color words including neutral colors.":
    "يستخدم المتعلم ثلاث كلمات ألوان على الأقل، ومنها ألوان حيادية.",
  "test your color recognition skills":
    "اختبر مهاراتك في التعرّف على الألوان",
  "ask others what their name is": "اسأل الآخرين عن أسمائهم",
  "complete the introduction with polite expressions":
    "كمّل التعارف بتعبيرات مهذبة",
  "introductions quiz": "اختبار التعارف",
  "test your introduction skills": "اختبر مهاراتك في التعارف",
  "learn new words through interactive questions. practice saying 'hello'.":
    "اتعلّم كلمات جديدة من خلال أسئلة تفاعلية. اتدرّب على قول أهلًا.",
  "master greeting etiquette and social niceties":
    "اتقن آداب التحية واللطف الاجتماعي",
  "learn to introduce yourself and ask others' names":
    "اتعلّم تعرّف نفسك وتسأل عن أسماء الآخرين",
  "practice introductions in real conversations":
    "اتدرّب على التعارف في محادثات حقيقية",
  "narrative and storytelling": "السرد والحكي",
  "narrative and storytelling structures": "تراكيب السرد والحكي",
  "narrative and storytelling conversation": "محادثة عن السرد والحكي",
  "narrative and storytelling mastery": "إتقان السرد والحكي",
  "practice using narrative and storytelling in real conversation":
    "اتدرّب على استخدام السرد والحكي في محادثة حقيقية",
  "advanced narrative and storytelling content and comprehension":
    "محتوى متقدّم في السرد والحكي وفهمه",
  "demonstrate mastery of narrative and storytelling":
    "أظهر إتقان السرد والحكي",
  "read and discuss narrative and storytelling": "اقرأ وناقش السرد والحكي",
  "at the doctor's": "عند الدكتور",
  "at the doctor's quiz": "اختبار عند الدكتور",
  "conditional would quiz": "اختبار الجمل الشرطية الافتراضية",
  "near-native fluency quiz": "اختبار الطلاقة القريبة من أهل اللغة",
  "learn new words with interactive questions. practice saying hello.":
    "اتعلّم كلمات جديدة من خلال أسئلة تفاعلية. اتدرّب على قول أهلًا.",
  "learn to count from zero to twenty":
    "اتعلّم العد من صفر لعشرين",
  "learn to count from twenty-one to one hundred":
    "اتعلّم العد من واحد وعشرين لمية",
  "learn the words for close family members":
    "اتعلّم كلمات أفراد العيلة المقربين",
  "learn essential greetings and farewells":
    "اتعلّم التحيات الأساسية وعبارات الوداع",
  "count from zero to ten": "عد من صفر لعشرة",
  "count to twenty": "عد لحد عشرين",
  "100 must-know words and phrases to start fast":
    "100 كلمة وعبارة لازم تعرفهم عشان تبدأ بسرعة",
  "20 everyday verbs and short requests to get things done":
    "20 فعل يومي وطلبات قصيرة عشان تخلّص أمورك",
  "20 words for time, transport, and finding your way":
    "20 كلمة عن الوقت والمواصلات وإزاي تلاقي طريقك",
  "practice speaking with realtime conversations. say hello to complete this activity.":
    "اتدرّب على الكلام من خلال محادثات مباشرة. قول أهلًا علشان تكمّل النشاط ده.",
  "practice with interactive stories that say hello.":
    "اتدرّب بقصص تفاعلية فيها أهلًا.",
  "improve your reading skills with a simple hello passage.":
    "حسّن مهارات القراءة عندك من خلال نص بسيط عن أهلًا.",
  "master grammar rules through exercises. practice greeting patterns.":
    "اتقن قواعد اللغة من خلال التمارين. اتدرّب على أنماط التحية.",
  "learn numbers 0-5": "اتعلّم الأرقام من 0 لحد 5",
  "complete counting to ten": "كمّل العد لحد عشرة",
  "use numbers to count things": "استخدم الأرقام في عدّ الأشياء",
  "test counting 0-10": "اختبر العد من 0 لحد 10",
  "basic greetings and farewells": "تحيات ووداع أساسي",
  "different ways to greet people": "طرق مختلفة لتحية الناس",
  "farewell expressions": "عبارات الوداع",
  "practice in real situations": "اتدرّب في مواقف حقيقية",
  "test greeting skills": "اختبر مهارات التحية",
  "essential single-word responses": "ردود بكلمة واحدة أساسية",
  "the most important words": "أهم الكلمات",
  "express uncertainty": "عبّر عن عدم التأكد",
  "react naturally": "رد بشكل طبيعي",
  "magic words that open doors": "كلمات سحرية بتفتح البيبان",
  "apologize politely": "اعتذر بأدب",
  "additional gracious phrases": "عبارات لطيفة إضافية",
  "test polite expressions": "اختبر التعبيرات المهذبة",
  "name everyday things": "سمّي الحاجات اليومية",
  "common household items": "حاجات البيت الشائعة",
  "things you carry daily": "حاجات بتشيلها كل يوم",
  "food and drink": "الأكل والشرب",
  "basic food vocabulary": "مفردات الأكل الأساسية",
  "test object vocabulary": "اختبر مفردات الأشياء",
  "identify and name colors": "ميّز الألوان وسمّيها",
  "red, blue, yellow": "أحمر وأزرق وأصفر",
  "expand your palette": "وسّع لوحة ألوانك",
  "complete your palette": "كمّل لوحة ألوانك",
  "test color knowledge": "اختبر معرفتك بالألوان",
  "introduce yourself": "عرّف نفسك",
  "learn to introduce yourself": "اتعلّم تعرّف نفسك",
  "ask others their name": "اسأل غيرك عن اسمه",
  "complete the introduction": "كمّل التعارف",
  "test introduction skills": "اختبر مهارات التعارف",
  "your very first words": "أول كلماتك خالص",
  "practice greetings in real conversations":
    "اتدرّب على التحيات في محادثات حقيقية",
  "advanced greetings": "تحيات متقدمة",
  "master formal and informal greetings":
    "اتقن التحيات الرسمية وغير الرسمية",
  "numbers 0-20": "الأرقام من 0 لحد 20",
  "counting to twenty": "العد لحد عشرين",
  "using numbers daily": "استخدام الأرقام يوميًا",
  "practice numbers in everyday situations":
    "اتدرّب على الأرقام في مواقف يومية",
  "phone numbers and ages": "أرقام التليفونات والأعمار",
  "apply numbers to phone numbers and ages":
    "طبّق الأرقام على أرقام التليفونات والأعمار",
  "numbers 21-100": "الأرقام من 21 لحد 100",
  "larger numbers": "أرقام أكبر",
  "counting to one hundred": "العد لحد مية",
  "prices and money": "الأسعار والفلوس",
  "practice using larger numbers with prices and money":
    "اتدرّب على استخدام الأرقام الكبيرة مع الأسعار والفلوس",
  "big numbers in context": "الأرقام الكبيرة في السياق",
  "apply larger numbers in real-life contexts":
    "طبّق الأرقام الكبيرة في مواقف من الحياة",
  "your first 20 high-frequency words for greetings and basics":
    "أول 20 كلمة شائعة للتحيات والأساسيات",
  "add 20 words for names, family, and moving around":
    "زوّد 20 كلمة عن الأسماء والعيلة والحركة",
  "round out 100 words with connectors, feelings, and quick questions":
    "كمّل 100 كلمة بروابط ومشاعر وأسئلة سريعة",
  "learn the days": "اتعلّم الأيام",
  "monday to sunday": "من الاثنين للأحد",
  "planning your week": "خطط أسبوعك",
  "calendar basics": "أساسيات التقويم",
  "twelve months": "اتناشر شهر",
  "important dates": "تواريخ مهمة",
  "daily schedule": "الجدول اليومي",
  "making appointments": "تحديد مواعيد",
  "your family": "عيلتك",
  "talking about family": "الكلام عن العيلة",
  "describe visually": "اوصف بشكل بصري",
  "rainbow colors": "ألوان قوس قزح",
  "describing things": "وصف الأشياء",
  "colors everywhere": "ألوان في كل مكان",
  "food vocabulary": "مفردات الأكل",
  "i'm hungry!": "أنا جعان/ة!",
  "at the restaurant": "في المطعم",
  "order food": "اطلب أكل",
  "restaurant words": "كلمات المطعم",
  "ordering a meal": "طلب وجبة",
  "paying the bill": "دفع الحساب",
  "everyday items": "حاجات يومية",
  "what is this?": "إيه ده؟",
  "objects around us": "أشياء حوالينا",
  "in the house": "في البيت",
  "rooms and furniture": "الغرف والعفش",
  "rooms of the house": "غرف البيت",
  "at home": "في البيت",
  clothing: "الهدوم",
  "what you wear": "اللي بتلبسه",
  "what to wear": "تلبس إيه",
  "shopping for clothes": "شراء هدوم",
  "daily activities": "أنشطة يومية",
  "from morning to night": "من الصبح لحد الليل",
  weather: "الطقس",
  "talk about weather": "اتكلم عن الطقس",
  "four seasons": "الفصول الأربعة",
  "weather reports": "تقارير الطقس",
  preferences: "التفضيلات",
  "i like, i love": "أنا بحب وأنا بعشق",
  "expressing preferences": "التعبير عن التفضيلات",
  "favorites and dislikes": "المفضلات والحاجات اللي مش بتحبها",
  "ask questions": "اسأل أسئلة",
  "asking questions": "طرح الأسئلة",
  "getting information": "الحصول على معلومات",
  "physical descriptions": "أوصاف شكلية",
  "appearance words": "كلمات الشكل",
  "detailed descriptions": "أوصاف تفصيلية",
  "talk about locations": "اتكلم عن الأماكن",
  "places around town": "أماكن في المدينة",
  "dream destinations": "وجهات الأحلام",
  "buy things": "اشتري حاجات",
  "at the store": "في المحل",
  "bargain hunting": "صيد العروض",
  "smart shopping": "تسوّق ذكي",
  "at the market": "في السوق",
  "fresh food shopping": "شراء أكل طازة",
  "fresh produce": "خضار وفاكهة طازة",
  "buying groceries": "شراء مقاضي",
  "market day": "يوم السوق",
  transportation: "المواصلات",
  "getting around": "التنقل",
  "taking the bus": "ركوب الأوتوبيس",
  "travel options": "خيارات السفر",
  directions: "الاتجاهات",
  "find your way": "اعرف طريقك",
  "left and right": "يمين وشمال",
  "finding your way": "إيجاد الطريق",
  "grandparents, babies, and extended family":
    "الأجداد والأطفال والعيلة الكبيرة",
  "words for friends, children, and people you see every day":
    "كلمات للأصحاب والأطفال والناس اللي بتشوفهم كل يوم",
  "short targeted drills to consolidate the unit language before the quiz.":
    "تدريبات قصيرة ومركزة لتثبيت لغة الوحدة قبل الاختبار.",
  "link vocabulary and grammar from the unit in a guided scenario.":
    "اربط المفردات والقواعد من الوحدة في موقف موجّه.",
  "essential courtesy expressions": "عبارات مجاملة أساسية",
  "your day": "يومك",
  "social arrangements": "ترتيبات اجتماعية",
  "scheduling events": "ترتيب المناسبات",
  "free time": "وقت الفراغ",
  "free time fun": "متعة وقت الفراغ",
  "sharing interests": "مشاركة الاهتمامات",
  "athletic activities": "أنشطة رياضية",
  "playing sports": "لعب الرياضة",
  "staying active": "الحفاظ على النشاط",
  "fitness goals": "أهداف اللياقة",
  "past tense regular": "الماضي المنتظم",
  "regular past verbs": "أفعال الماضي المنتظمة",
  "yesterday's actions": "أفعال امبارح",
  "recent events": "أحداث قريبة",
  "past tense irregular": "الماضي غير المنتظم",
  "irregular verbs": "أفعال غير منتظمة",
  "common irregular verbs": "أفعال غير منتظمة شائعة",
  "last week": "الأسبوع اللي فات",
  "life stories": "حكايات الحياة",
  "narrate events": "احكي الأحداث",
  "story elements": "عناصر القصة",
  "future intentions": "نوايا المستقبل",
  "dreams and goals": "الأحلام والأهداف",
  "planning ahead": "التخطيط لقدّام",
  "body and health": "الجسم والصحة",
  "body parts": "أعضاء الجسم",
  "medical visits": "زيارات طبية",
  "visiting the doctor": "زيارة الدكتور",
  "health concerns": "مشاكل صحية",
  "dream job": "شغلانة الأحلام",
  "educational topics": "موضوعات تعليمية",
  "have done": "عملت",
  "have you ever?": "عمرك عملت...؟",
  achievements: "إنجازات",
  "past continuous": "الماضي المستمر",
  "was doing": "كان بيعمل",
  "while it was happening": "أثناء ما كان بيحصل",
  "background actions": "أفعال في الخلفية",
  "setting the scene": "رسم المشهد",
  "future tense": "المستقبل",
  "will do": "هيعمل",
  "better or worse": "أحسن ولا أوحش",
  "making comparisons": "عمل مقارنات",
  "should, must": "ينبغي، لازم",
  "should and shouldn't": "ينبغي وما ينبغيشي",
  "helpful suggestions": "اقتراحات مفيدة",
  "let's, why don't we": "يلا، ليه ما...",
  "let's try this": "يلا نجرب ده",
  "conditional would": "الجمل الشرطية الافتراضية",
  "i would...": "أنا كنت ه...",
  "if i were you": "لو أنا مكانك",
  "hypothetical situations": "مواقف افتراضية",
  "imagining possibilities": "تخيّل الاحتمالات",
  "traveling abroad": "السفر برّه البلد",
  "adventure awaits": "المغامرة في انتظارك",
  environment: "البيئة",
  "nature and ecology": "الطبيعة والبيئة",
  "going green": "التحوّل للأخضر",
  "saving earth": "إنقاذ الأرض",
  "cultural practices": "ممارسات ثقافية",
  "customs and festivals": "عادات ومهرجانات",
  headlines: "عناوين الأخبار",
  "informed citizen": "مواطن واعي",
  "i think that...": "أنا شايف إن...",
  "express dissatisfaction": "عبّر عن عدم الرضا",
  "i'm not satisfied": "أنا مش راضي/ة",
  "resolving issues": "حل المشاكل",
  "memorable moments": "لحظات لا تُنسى",
  "maybe, might": "يمكن، قد",
  "maybe and perhaps": "يمكن وربما",
  "making predictions": "عمل توقعات",
  "had done": "كان عمل",
  "earlier actions": "أفعال سابقة",
  "passive voice": "المبني للمجهول",
  "is done by": "يتم بواسطة",
  "it was done": "اتعمل",
  "reported speech": "الكلام المنقول",
  "he said that...": "هو قال إن...",
  "she said that...": "هي قالت إن...",
  "quoting others": "نقل كلام الآخرين",
  "retelling stories": "إعادة حكي القصص",
  "relative clauses": "جمل الصلة",
  "who, which, that": "ضمائر الوصل",
  "formal vs informal": "رسمي مقابل غير رسمي",
  "register switching": "تغيير مستوى الكلام",
  "registers of speech": "مستويات الكلام",
  "appropriate language": "اللغة المناسبة",
  "business communication": "تواصل الأعمال",
  "scientific topics": "موضوعات علمية",
  "technological advances": "تطورات تكنولوجية",
  "society and issues": "المجتمع والقضايا",
  "discussing problems": "مناقشة المشاكل",
  "making change": "إحداث تغيير",
  "cultural works": "أعمال ثقافية",
  "creative expression": "تعبير إبداعي",
  "artistic movements": "حركات فنية",
  "civic topics": "موضوعات مدنية",
  "civic engagement": "مشاركة مدنية",
  "political discourse": "خطاب سياسي",
  "active citizenship": "مواطنة نشطة",
  "health & lifestyle": "الصحة ونمط الحياة",
  "wellness choices": "اختيارات العافية",
  "holistic health": "صحة شاملة",
  "theoretical discussion": "نقاش نظري",
  "doubt and desire": "الشك والرغبة",
  "expressing wishes": "التعبير عن الرغبات",
  "nuanced meaning": "معنى دقيق",
  "contrary to fact": "عكس الواقع",
  "complex conditionals": "جمل شرطية معقدة",
  "if i had...": "لو كان عندي...",
  "advanced if clauses": "جمل if متقدمة",
  "mixed conditionals": "جمل شرطية مختلطة",
  "sophisticated logic": "منطق متقدّم",
  "idioms and sayings": "تعبيرات وأمثال",
  "scholarly language": "لغة أكاديمية",
  "research papers": "أوراق بحثية",
  "critical analysis": "تحليل نقدي",
  "workplace language": "لغة الشغل",
  "business etiquette": "إتيكيت العمل",
  "executive presence": "حضور تنفيذي",
  "persuasive skills": "مهارات الإقناع",
  "persuasive language": "لغة الإقناع",
  "building arguments": "بناء الحجج",
  "winning debates": "كسب المناظرات",
  "cross-cultural understanding": "فهم بين الثقافات",
  "literary techniques": "تقنيات أدبية",
  "literary analysis": "تحليل أدبي",
  "literary devices": "أدوات أدبية",
  "analyzing texts": "تحليل النصوص",
  "literary criticism": "نقد أدبي",
  "advanced discourse": "خطاب متقدم",
  "discourse markers": "روابط الخطاب",
  "coherent arguments": "حجج مترابطة",
  "speaking like a native": "الكلام زي أهل اللغة",
  "regional variations": "اختلافات إقليمية",
  dialects: "لهجات",
  "accent and usage": "اللكنة والاستخدام",
  "linguistic diversity": "تنوع لغوي",
  "stylistic mastery": "إتقان الأسلوب",
  "refined language": "لغة راقية",
  "rhetorical devices": "أساليب بلاغية",
  "persuasive techniques": "تقنيات الإقناع",
  "specialized vocabulary": "مفردات متخصصة",
  "expert terminology": "مصطلحات متخصصة",
  "domain expertise": "خبرة مجال",
  "subtle nuances": "فروق دقيقة",
  "fine distinctions": "فروق دقيقة",
  "precise meaning": "معنى دقيق جدًا",
  "cultural navigator": "مرشد ثقافي",
  "native-like skills": "مهارات قريبة من أهل اللغة",
};

const TOKEN_TRANSLATIONS = {
  advanced: "متقدمة",
  activities: "أنشطة",
  actions: "أفعال",
  ambassador: "سفير",
  analysis: "تحليل",
  and: "و",
  appearance: "المظهر",
  arguments: "حُجج",
  artistic: "فني",
  at: "في",
  awaits: "في الانتظار",
  balanced: "متوازن",
  basics: "أساسيات",
  before: "قبل",
  better: "أفضل",
  body: "الجسم",
  booking: "حجز",
  careers: "وظايف",
  career: "مهنة",
  celebrating: "الاحتفال بـ",
  citizenship: "المواطنة",
  classroom: "الفصل",
  collaborative: "تعاونية",
  communication: "تواصل",
  comparisons: "مقارنات",
  complex: "معقّدة",
  concerns: "مخاوف",
  connected: "متصل",
  connecting: "ربط",
  context: "سياق",
  control: "تحكم",
  corporate: "مؤسسي",
  cultural: "ثقافي",
  culture: "ثقافة",
  current: "حالية",
  customs: "عادات",
  debate: "نقاش",
  debates: "مناظرات",
  deep: "عميق",
  detail: "تفاصيل",
  detailed: "تفصيلية",
  devices: "أجهزة",
  digital: "رقمي",
  different: "مختلفة",
  diversity: "تنوع",
  "doctor's": "الدكتور",
  doubt: "شك",
  dream: "حلم",
  educational: "تعليمية",
  elegant: "أنيق",
  emotions: "مشاعر",
  equal: "متساوي",
  events: "أحداث",
  everyday: "يومية",
  executive: "تنفيذي",
  experiences: "تجارب",
  expression: "تعبير",
  expressions: "تعبيرات",
  expertise: "خبرة",
  fields: "مجالات",
  fine: "دقيقة",
  fluent: "سلس",
  fluency: "طلاقة",
  formal: "رسمي",
  future: "مستقبل",
  green: "أخضر",
  had: "كان عنده",
  happened: "حصل",
  have: "عنده",
  healthy: "صحي",
  heritage: "تراث",
  holistic: "شامل",
  hypothetical: "افتراضية",
  ideas: "أفكار",
  idiomatic: "اصطلاحية",
  idioms: "تعبيرات",
  if: "لو",
  informal: "غير رسمي",
  informed: "واعي",
  intelligence: "ذكاء",
  integrating: "ربط",
  interpreting: "تفسير",
  journey: "رحلة",
  language: "لغة",
  leadership: "قيادة",
  learning: "تعلّم",
  less: "أقل",
  life: "الحياة",
  lifestyle: "نمط الحياة",
  likely: "مرجح",
  living: "معيشة",
  logic: "منطق",
  mastery: "إتقان",
  matters: "مهمة",
  medical: "طبي",
  meetings: "اجتماعات",
  meaning: "معنى",
  media: "إعلام",
  mixed: "مختلطة",
  moments: "لحظات",
  moods: "حالات",
  more: "أكتر",
  native: "أصلي",
  "native idioms": "التعبيرات الاصطلاحية الأصيلة",
  nature: "طبيعة",
  news: "أخبار",
  of: "",
  only: "فقط",
  past: "ماضي",
  perfect: "تام",
  perhaps: "ربما",
  philosophical: "فلسفية",
  phrases: "عبارات",
  planning: "تخطيط",
  possibilities: "احتمالات",
  possibility: "إمكانية",
  practice: "تدريب",
  predictions: "توقعات",
  present: "مضارع",
  probability: "احتمالية",
  problem: "مشكلة",
  professional: "مهني",
  problems: "مشاكل",
  quotations: "اقتباسات",
  quoting: "اقتباس",
  real: "حقيقية",
  reading: "قراءة",
  register: "سجل",
  registers: "سجلات",
  "regional variations": "الاختلافات الإقليمية",
  relative: "موصول",
  reported: "منقول",
  research: "بحث",
  resolving: "حل",
  respectful: "باحترام",
  rhetoric: "البلاغة",
  saving: "إنقاذ",
  school: "المدرسة",
  scientific: "علمية",
  science: "العلم",
  scene: "المشهد",
  sentences: "جمل",
  settings: "إعدادات",
  sharing: "مشاركة",
  should: "ينبغي",
  skills: "مهارات",
  society: "المجتمع",
  solving: "حل",
  speaking: "الكلام",
  specialized: "متخصصة",
  "specialized vocabulary": "المفردات المتخصصة",
  style: "أسلوب",
  "stylistic mastery": "إتقان الأسلوب",
  studies: "دراسات",
  subjunctive: "صيغة التمني",
  subtle: "دقيقة",
  suggestions: "اقتراحات",
  superlatives: "صيغة التفضيل العليا",
  technical: "تقنية",
  techniques: "تقنيات",
  technology: "تكنولوجيا",
  terms: "مصطلحات",
  theoretical: "نظرية",
  thinking: "تفكير",
  timelines: "خطوط زمنية",
  today: "النهارده",
  tone: "نبرة",
  tourism: "سياحة",
  travel: "سفر",
  trip: "رحلة",
  unlike: "بعكس",
  unlikely: "غير مرجح",
  usage: "استخدام",
  using: "استخدام",
  views: "آراء",
  voice: "صوت",
  was: "كان",
  wellness: "العافية",
  while: "أثناء",
  will: "سوف",
  wishes: "رغبات",
  with: "مع",
  words: "كلمات",
  world: "العالم",
  writing: "كتابة",
  you: "إنت",
  your: "",
  "rhetorical devices": "الأساليب البلاغية",
  "count from zero to ten in spanish": "عدّ من صفر إلى عشرة بالإسبانية",
  "basic greetings and farewells for any situation":
    "تحيات ووداعات أساسية لأي موقف",
  "essential single-word responses for any conversation":
    "ردود أساسية بكلمة واحدة لأي محادثة",
  "express uncertainty with simple phrases":
    "عبّر عن عدم اليقين بعبارات بسيطة",
  "react naturally in conversations": "تفاعل بشكل طبيعي في المحادثات",
  "essential courtesy expressions for polite communication":
    "عبارات مجاملة أساسية للتواصل المهذب",
  "the magic words that open doors everywhere":
    "الكلمات السحرية التي تفتح الأبواب في كل مكان",
  "apologize and get attention politely": "اعتذر ولفت الانتباه بأدب",
  "additional phrases for gracious communication":
    "عبارات إضافية للتواصل بلطف",
  "name everyday things around you": "سمِّ الأشياء اليومية حولك",
  "things you carry with you every day":
    "الأشياء التي تحملها معك كل يوم",
  "basic food and drink vocabulary": "مفردات أساسية عن الأكل والشرب",
  "red, blue, yellow - the building blocks":
    "أحمر وأزرق وأصفر: الأساسيات",
  "expand your color vocabulary": "وسّع مفرداتك عن الألوان",
  "introduce yourself and ask others their names":
    "عرّف نفسك واسأل الآخرين عن أسمائهم",
  "social glue & questions": "عبارات التواصل الاجتماعي والأسئلة",
  "polite conversations": "محادثات مهذبة",
  "introducing yourself": "تقديم نفسك",
  "say your name and origin": "قل اسمك وأصلك",
  "share personal information and ask about others":
    "شارك معلومات شخصية واسأل عن الآخرين",
  "user describes multiple family members with names and at least one detail about each":
    "يصف المستخدم عدة أفراد من العائلة بأسمائهم ومع تفصيل واحد على الأقل عن كل واحد منهم",
  "the learner counts at least three objects using correct numbers.":
    "يعدّ المتعلم ثلاثة أشياء على الأقل مستخدمًا الأرقام الصحيحة.",
  "user gives their phone number clearly and confirms they wrote down yours correctly":
    "يذكر المستخدم رقم هاتفه بوضوح ويتأكد أنه كتب رقمك بشكل صحيح",
  "the learner asks for the other person's name using an appropriate phrase.":
    "يسأل المتعلم عن اسم الشخص الآخر باستخدام عبارة مناسبة.",
  "user uses appropriate greeting for context (morning/afternoon/evening)":
    "يستخدم المستخدم تحية مناسبة للسياق (صباح/ظهر/مساء)",
  "user correctly produces numbers in the target language":
    "ينطق المستخدم الأرقام بشكل صحيح باللغة الهدف",
  "user greets appropriately and uses a farewell expression":
    "يحيّي المستخدم بشكل مناسب ويستخدم عبارة وداع",
  "user states their name, origin, or introduces a person using 'this is...' or similar":
    "يذكر المستخدم اسمه أو أصله أو يقدّم شخصًا مستخدمًا 'هذا...' أو ما شابه",
  "user makes a clear request using appropriate verb forms":
    "يقدّم المستخدم طلبًا واضحًا مستخدمًا صيغ أفعال مناسبة",
  "user introduces themselves and asks at least one question about the other person":
    "يعرّف المستخدم نفسه ويسأل سؤالًا واحدًا على الأقل عن الشخص الآخر",
  "user uses greetings, introduces themselves, and uses polite expressions":
    "يستخدم المستخدم التحيات ويعرّف نفسه ويستعمل عبارات مهذبة",
  "user correctly names a day of the week in context":
    "يسمّي المستخدم يومًا من أيام الأسبوع بشكل صحيح في السياق",
  "user expresses time of day or routine timing":
    "يعبّر المستخدم عن وقت اليوم أو توقيت الروتين اليومي",
  "user discusses availability using time expressions and agrees on a specific time to meet":
    "يناقش المستخدم التفرغ مستخدمًا تعبيرات الوقت ويتفق على وقت محدد للقاء",
  "user names family members and describes a relationship":
    "يسمّي المستخدم أفرادًا من العائلة ويصف علاقة بينهم",
  "user correctly uses color vocabulary":
    "يستخدم المستخدم مفردات الألوان بشكل صحيح",
  "user orders food and drink items and responds to your suggestions":
    "يطلب المستخدم أطعمة ومشروبات ويرد على اقتراحاتك",
  "user recommends a place and describes the food and location":
    "يوصي المستخدم بمكان ويصف الطعام والموقع",
  "user describes weather conditions": "يصف المستخدم حالة الطقس",
  "user describes weather and connects it to plans or clothing choices":
    "يصف المستخدم الطقس ويربطه بالخطط أو اختيار الملابس",
  "user describes the weather and suggests appropriate activities":
    "يصف المستخدم الطقس ويقترح أنشطة مناسبة",
  "user expresses a preference using like/dislike structures":
    "يعبّر المستخدم عن تفضيل باستخدام تراكيب الإعجاب وعدم الإعجاب",
  "user asks at least two questions using question words":
    "يسأل المستخدم سؤالين على الأقل مستخدمًا أدوات الاستفهام",
  "user uses adjectives to describe physical appearance":
    "يستخدم المستخدم الصفات لوصف المظهر الجسدي",
  "user uses directional vocabulary or location prepositions":
    "يستخدم المستخدم مفردات الاتجاهات أو حروف جر المكان",
  "user uses comparison language to describe differences and similarities between places":
    "يستخدم المستخدم لغة المقارنة لوصف الاختلافات والتشابهات بين الأماكن",
  "user recommends a specific place with description and directions":
    "يوصي المستخدم بمكان محدد مع وصف وإرشادات للوصول",
  "user asks price and completes a basic transaction":
    "يسأل المستخدم عن السعر ويُكمل معاملة بسيطة",
  "user explains the problem and successfully completes the return/exchange":
    "يشرح المستخدم المشكلة ويُكمل الإرجاع أو الاستبدال بنجاح",
  "user describes their transportation method with details (type, time, frequency)":
    "يصف المستخدم وسيلة تنقله مع تفاصيل مثل النوع والوقت والتكرار",
  "user asks for a ticket, understands the price, and confirms their trip details":
    "يطلب المستخدم تذكرة ويفهم السعر ويؤكد تفاصيل رحلته",
  "user asks for directions and confirms they understand how to get there":
    "يسأل المستخدم عن الاتجاهات ويتأكد أنه فهم كيف يصل إلى المكان",
  "user describes their commute with transportation type, duration, and route details":
    "يصف المستخدم رحلته اليومية مع نوع المواصلات والمدة وتفاصيل الطريق",
  "user describes their hobby in detail and explains why you should try it":
    "يصف المستخدم هوايته بالتفصيل ويشرح لماذا ينبغي عليك تجربتها",
  "user describes symptoms clearly and responds to your recommendations":
    "يصف المستخدم الأعراض بوضوح ويرد على توصياتك",
  "user discusses environmental topic with relevant vocabulary":
    "يناقش المستخدم موضوعًا بيئيًا مستخدمًا مفردات مناسبة",
};

const EXTRA_TEXT_TRANSLATIONS = {
  "native idioms": "التعبيرات الاصطلاحية الأصيلة",
  "regional variations": "الاختلافات الإقليمية",
  "stylistic mastery": "إتقان الأسلوب",
  "rhetorical devices": "الأساليب البلاغية",
  "specialized vocabulary": "المفردات المتخصصة",
  "count from zero to ten in spanish": "عدّ من صفر إلى عشرة بالإسبانية",
  "basic greetings and farewells for any situation":
    "تحيات ووداعات أساسية لأي موقف",
  "essential single-word responses for any conversation":
    "ردود أساسية بكلمة واحدة لأي محادثة",
  "express uncertainty with simple phrases":
    "عبّر عن عدم اليقين بعبارات بسيطة",
  "react naturally in conversations": "تفاعل بشكل طبيعي في المحادثات",
  "essential courtesy expressions for polite communication":
    "عبارات مجاملة أساسية للتواصل المهذب",
  "the magic words that open doors everywhere":
    "الكلمات السحرية التي تفتح الأبواب في كل مكان",
  "apologize and get attention politely": "اعتذر ولفت الانتباه بأدب",
  "additional phrases for gracious communication":
    "عبارات إضافية للتواصل بلطف",
  "name everyday things around you": "سمِّ الأشياء اليومية حولك",
  "things you carry with you every day":
    "الأشياء التي تحملها معك كل يوم",
  "basic food and drink vocabulary": "مفردات أساسية عن الأكل والشرب",
  "red, blue, yellow - the building blocks":
    "أحمر وأزرق وأصفر: الأساسيات",
  "expand your color vocabulary": "وسّع مفرداتك عن الألوان",
  "introduce yourself and ask others their names":
    "عرّف نفسك واسأل الآخرين عن أسمائهم",
  "social glue & questions": "عبارات التواصل الاجتماعي والأسئلة",
  "polite conversations": "محادثات مهذبة",
  "introducing yourself": "تقديم نفسك",
  "say your name and origin": "قل اسمك وأصلك",
  "share personal information and ask about others":
    "شارك معلومات شخصية واسأل عن الآخرين",
  "user describes multiple family members with names and at least one detail about each":
    "يصف المستخدم عدة أفراد من العائلة بأسمائهم ومع تفصيل واحد على الأقل عن كل واحد منهم",
  "the learner counts at least three objects using correct numbers.":
    "يعدّ المتعلم ثلاثة أشياء على الأقل مستخدمًا الأرقام الصحيحة.",
  "user gives their phone number clearly and confirms they wrote down yours correctly":
    "يذكر المستخدم رقم هاتفه بوضوح ويتأكد أنه كتب رقمك بشكل صحيح",
  "the learner asks for the other person's name using an appropriate phrase.":
    "يسأل المتعلم عن اسم الشخص الآخر باستخدام عبارة مناسبة.",
  "user uses appropriate greeting for context (morning/afternoon/evening)":
    "يستخدم المستخدم تحية مناسبة للسياق (صباح/ظهر/مساء)",
  "user correctly produces numbers in the target language":
    "ينطق المستخدم الأرقام بشكل صحيح باللغة الهدف",
  "user greets appropriately and uses a farewell expression":
    "يحيّي المستخدم بشكل مناسب ويستخدم عبارة وداع",
  "user states their name, origin, or introduces a person using 'this is...' or similar":
    "يذكر المستخدم اسمه أو أصله أو يقدّم شخصًا مستخدمًا 'هذا...' أو ما شابه",
  "user makes a clear request using appropriate verb forms":
    "يقدّم المستخدم طلبًا واضحًا مستخدمًا صيغ أفعال مناسبة",
  "user introduces themselves and asks at least one question about the other person":
    "يعرّف المستخدم نفسه ويسأل سؤالًا واحدًا على الأقل عن الشخص الآخر",
  "user uses greetings, introduces themselves, and uses polite expressions":
    "يستخدم المستخدم التحيات ويعرّف نفسه ويستعمل عبارات مهذبة",
  "user correctly names a day of the week in context":
    "يسمّي المستخدم يومًا من أيام الأسبوع بشكل صحيح في السياق",
  "user expresses time of day or routine timing":
    "يعبّر المستخدم عن وقت اليوم أو توقيت الروتين اليومي",
  "user discusses availability using time expressions and agrees on a specific time to meet":
    "يناقش المستخدم التفرغ مستخدمًا تعبيرات الوقت ويتفق على وقت محدد للقاء",
  "user names family members and describes a relationship":
    "يسمّي المستخدم أفرادًا من العائلة ويصف علاقة بينهم",
  "user correctly uses color vocabulary":
    "يستخدم المستخدم مفردات الألوان بشكل صحيح",
  "user orders food and drink items and responds to your suggestions":
    "يطلب المستخدم أطعمة ومشروبات ويرد على اقتراحاتك",
  "user recommends a place and describes the food and location":
    "يوصي المستخدم بمكان ويصف الطعام والموقع",
  "user describes weather conditions": "يصف المستخدم حالة الطقس",
  "user describes weather and connects it to plans or clothing choices":
    "يصف المستخدم الطقس ويربطه بالخطط أو اختيار الملابس",
  "user describes the weather and suggests appropriate activities":
    "يصف المستخدم الطقس ويقترح أنشطة مناسبة",
  "user expresses a preference using like/dislike structures":
    "يعبّر المستخدم عن تفضيل باستخدام تراكيب الإعجاب وعدم الإعجاب",
  "user asks at least two questions using question words":
    "يسأل المستخدم سؤالين على الأقل مستخدمًا أدوات الاستفهام",
  "user uses adjectives to describe physical appearance":
    "يستخدم المستخدم الصفات لوصف المظهر الجسدي",
  "user uses directional vocabulary or location prepositions":
    "يستخدم المستخدم مفردات الاتجاهات أو حروف جر المكان",
  "user uses comparison language to describe differences and similarities between places":
    "يستخدم المستخدم لغة المقارنة لوصف الاختلافات والتشابهات بين الأماكن",
  "user recommends a specific place with description and directions":
    "يوصي المستخدم بمكان محدد مع وصف وإرشادات للوصول",
  "user asks price and completes a basic transaction":
    "يسأل المستخدم عن السعر ويُكمل معاملة بسيطة",
  "user explains the problem and successfully completes the return/exchange":
    "يشرح المستخدم المشكلة ويُكمل الإرجاع أو الاستبدال بنجاح",
  "user describes their transportation method with details (type, time, frequency)":
    "يصف المستخدم وسيلة تنقله مع تفاصيل مثل النوع والوقت والتكرار",
  "user asks for a ticket, understands the price, and confirms their trip details":
    "يطلب المستخدم تذكرة ويفهم السعر ويؤكد تفاصيل رحلته",
  "user asks for directions and confirms they understand how to get there":
    "يسأل المستخدم عن الاتجاهات ويتأكد أنه فهم كيف يصل إلى المكان",
  "user describes their commute with transportation type, duration, and route details":
    "يصف المستخدم رحلته اليومية مع نوع المواصلات والمدة وتفاصيل الطريق",
  "user describes their hobby in detail and explains why you should try it":
    "يصف المستخدم هوايته بالتفصيل ويشرح لماذا ينبغي عليك تجربتها",
  "user describes symptoms clearly and responds to your recommendations":
    "يصف المستخدم الأعراض بوضوح ويرد على توصياتك",
  "user discusses environmental topic with relevant vocabulary":
    "يناقش المستخدم موضوعًا بيئيًا مستخدمًا مفردات مناسبة",
};

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "of",
  "to",
  "for",
  "from",
  "in",
  "on",
  "by",
  "and",
  "or",
  "is",
  "are",
  "it",
  "this",
  "that",
  "these",
  "those",
  "my",
  "your",
]);

const translateTokenizedText = (text) => {
  const source = String(text || "").trim();
  if (!source) return "";

  const trailing = source.match(/[.!?]+$/)?.[0] || "";
  const core = trailing ? source.slice(0, -trailing.length) : source;
  const words = core.split(/\s+/);
  const translated = [];

  for (const word of words) {
    const normalized = normalizeKey(word.replace(/[,"']/g, ""));
    if (!normalized) continue;
    if (STOPWORDS.has(normalized)) continue;
    if (/^[0-9/-]+$/.test(normalized)) {
      translated.push(word);
      continue;
    }
    const mapped = TOKEN_TRANSLATIONS[normalized];
    if (!mapped) return "";
    translated.push(mapped);
  }

  if (!translated.length) return "";

  const end = trailing === "?" ? "؟" : trailing;
  return `${translated.join(" ").replace(/\s+/g, " ").trim()}${end}`;
};

const translateTopic = (topic) =>
  EXTRA_TEXT_TRANSLATIONS[normalizeKey(topic)] ||
  TEXT_TRANSLATIONS[normalizeKey(topic)] ||
  translateTokenizedText(topic) ||
  (/[A-Za-z]/.test(String(topic || "")) ? "الموضوع ده" : String(topic || ""));

export const translateSkillTreeTextToArabic = (englishText) => {
  if (!englishText || typeof englishText !== "string") return englishText;

  const normalized = normalizeKey(englishText);
  const direct =
    EXTRA_TEXT_TRANSLATIONS[normalized] || TEXT_TRANSLATIONS[normalized];
  if (direct) return direct;

  let match = englishText.match(/^Learn key vocabulary for (.+)$/);
  if (match) {
    return `اتعلّم مفردات أساسية عن ${translateTopic(match[1])}`;
  }

  match = englishText.match(/^Practice (.+) in conversation$/);
  if (match) {
    return `اتدرّب على ${translateTopic(match[1])} في المحادثة`;
  }

  match = englishText.match(/^Apply (.+) skills$/);
  if (match) {
    return `طبّق مهارات ${translateTopic(match[1])}`;
  }

  match = englishText.match(/^Test your knowledge of (.+)$/);
  if (match) {
    return `اختبر معرفتك في ${translateTopic(match[1])}`;
  }

  match = englishText.match(/^Review (.+) by playing an interactive game$/);
  if (match) {
    return `راجع ${translateTopic(match[1])} من خلال لعبة تفاعلية`;
  }

  match = englishText.match(/^The learner says (.+)\.$/i);
  if (match) return `يقول المتعلم ${translateTopic(match[1])}.`;

  match = englishText.match(/^The learner names (.+)\.$/i);
  if (match) return `يسمي المتعلم ${translateTopic(match[1])}.`;

  match = englishText.match(/^The learner uses (.+)\.$/i);
  if (match) return `يستخدم المتعلم ${translateTopic(match[1])}.`;

  match = englishText.match(/^User demonstrates use of (.+) in context$/i);
  if (match) return `يوضح المستخدم استخدام ${translateTopic(match[1])} في السياق`;

  match = englishText.match(/^User uses (.+) correctly in context$/i);
  if (match) {
    return `يستخدم المستخدم ${translateTopic(match[1])} بشكل صحيح في السياق`;
  }

  match = englishText.match(/^User demonstrates correct use of (.+)$/i);
  if (match) return `يوضح المستخدم الاستخدام الصحيح لـ${translateTopic(match[1])}`;

  match = englishText.match(
    /^User answers questions using (.+) vocabulary correctly$/i,
  );
  if (match) {
    return `يجيب المستخدم عن الأسئلة مستخدمًا مفردات ${translateTopic(match[1])} بشكل صحيح`;
  }

  match = englishText.match(/^User initiates and sustains conversation about (.+)$/i);
  if (match) {
    return `يبدأ المستخدم محادثة عن ${translateTopic(match[1])} ويستمر فيها`;
  }

  match = englishText.match(
    /^User participates meaningfully in conversation about (.+)$/i,
  );
  if (match) return `يشارك المستخدم بفاعلية في محادثة عن ${translateTopic(match[1])}`;

  match = englishText.match(
    /^User participates actively in a conversation about (.+)$/i,
  );
  if (match) return `يشارك المستخدم بنشاط في محادثة عن ${translateTopic(match[1])}`;

  match = englishText.match(
    /^User demonstrates language from both (.+) and (.+) in their responses$/i,
  );
  if (match) {
    return `يستخدم المستخدم لغة ${translateTopic(match[1])} و${translateTopic(match[2])} معًا في ردوده`;
  }

  match = englishText.match(
    /^User demonstrates skills from both lessons in a natural conversation$/i,
  );
  if (match) return "يُظهر المستخدم مهارات الدرسين في محادثة طبيعية";

  match = englishText.match(/^User successfully navigates a realistic (.+) scenario$/i);
  if (match) {
    return `يتعامل المستخدم بنجاح مع موقف واقعي عن ${translateTopic(match[1])}`;
  }

  match = englishText.match(/^(.+) Quiz$/);
  if (match) return `اختبار ${translateTopic(match[1])}`;

  match = englishText.match(/^(.+) Skill Builder$/);
  if (match) return `تنمية مهارة: ${translateTopic(match[1])}`;

  match = englishText.match(/^(.+) Integrated Practice$/);
  if (match) return `تدريب متكامل: ${translateTopic(match[1])}`;

  match = englishText.match(/^Learn (.+)$/);
  if (match) return `اتعلّم ${translateTopic(match[1])}`;

  match = englishText.match(/^Practice (.+)$/);
  if (match) return `اتدرّب على ${translateTopic(match[1])}`;

  match = englishText.match(/^Test (.+)$/);
  if (match) return `اختبر ${translateTopic(match[1])}`;

  match = englishText.match(/^Apply (.+)$/);
  if (match) return `طبّق ${translateTopic(match[1])}`;

  match = englishText.match(/^Master (.+)$/);
  if (match) return `اتقن ${translateTopic(match[1])}`;

  match = englishText.match(/^Complete (.+)$/);
  if (match) return `كمّل ${translateTopic(match[1])}`;

  match = englishText.match(/^Use (.+)$/);
  if (match) return `استخدم ${translateTopic(match[1])}`;

  match = englishText.match(/^Ask (.+)$/);
  if (match) return `اسأل ${translateTopic(match[1])}`;

  match = englishText.match(/^Talking About (.+)$/);
  if (match) return `الكلام عن ${translateTopic(match[1])}`;

  match = englishText.match(/^Describing (.+)$/);
  if (match) return `وصف ${translateTopic(match[1])}`;

  match = englishText.match(/^At the (.+)$/);
  if (match) return `في ${translateTopic(match[1])}`;

  match = englishText.match(/^In the (.+)$/);
  if (match) return `في ${translateTopic(match[1])}`;

  match = englishText.match(/^([A-Za-z0-9 ,&'!?./-]+)$/);
  if (match) {
    const tokenized = translateTokenizedText(englishText);
    if (tokenized) return tokenized;
  }

  return /[A-Za-z]/.test(englishText) ? "محتوى تعليمي" : englishText;
};

const addArabicText = (value) => {
  if (Array.isArray(value)) return value.map(addArabicText);
  if (!value || typeof value !== "object") return value;

  const localized = Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, addArabicText(child)]),
  );

  if (
    typeof value.en === "string" &&
    typeof value.es === "string" &&
    typeof value.ar !== "string"
  ) {
    localized.ar = translateSkillTreeTextToArabic(value.en);
  }

  if (
    typeof value.successCriteria === "string" &&
    typeof value.successCriteria_ar !== "string"
  ) {
    const translated = translateSkillTreeTextToArabic(value.successCriteria);
    if (translated && translated !== value.successCriteria) {
      localized.successCriteria_ar = translated;
    }
  }

  for (const [key, child] of Object.entries(value)) {
    if (
      key.endsWith("_en") &&
      typeof child === "string" &&
      typeof value[key.replace(/_en$/, "_es")] === "string"
    ) {
      const nextKey = key.replace(/_en$/, "_ar");
      if (typeof localized[nextKey] !== "string") {
        localized[nextKey] = translateSkillTreeTextToArabic(child);
      }
    }
  }

  return localized;
};

export const withArabicSkillTreeText = (skillTree) => addArabicText(skillTree);
