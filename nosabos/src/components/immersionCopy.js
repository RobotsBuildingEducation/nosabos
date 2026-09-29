const encouragements = {
  en: ["Great job!", "Wonderful!", "You're doing great!", "Fantastic work!", "You did it!", "Way to go!", "Brilliant effort!", "Look at you go!", "That's real progress!", "Nicely done!", "You should be proud!", "Keep that momentum!", "Excellent work!", "You made it happen!", "Your practice is paying off!", "Strong work today!", "You nailed it!", "That's a win!", "Superb effort!", "Keep shining!"],
  es: ["¡Muy bien!", "¡Maravilloso!", "¡Lo estás haciendo genial!", "¡Trabajo fantástico!", "¡Lo lograste!", "¡Así se hace!", "¡Un esfuerzo brillante!", "¡Mira todo lo que avanzas!", "¡Eso sí que es progreso!", "¡Muy buen trabajo!", "¡Puedes sentirte orgulloso!", "¡Sigue con ese impulso!", "¡Excelente trabajo!", "¡Lo conseguiste!", "¡Tu práctica está dando frutos!", "¡Gran trabajo hoy!", "¡Lo hiciste de maravilla!", "¡Todo un logro!", "¡Esfuerzo estupendo!", "¡Sigue brillando!"],
  pt: ["Muito bem!", "Maravilhoso!", "Você está indo muito bem!", "Trabalho fantástico!", "Você conseguiu!", "É assim mesmo!", "Um esforço brilhante!", "Olha só o seu progresso!", "Isso é progresso de verdade!", "Mandou bem!", "Você pode se orgulhar!", "Continue nesse ritmo!", "Excelente trabalho!", "Você fez acontecer!", "Sua prática está dando resultado!", "Ótimo trabalho hoje!", "Você arrasou!", "Essa foi uma vitória!", "Esforço incrível!", "Continue brilhando!"],
  fr: ["Bravo !", "Formidable !", "Tu progresses super bien !", "Excellent travail !", "Tu as réussi !", "Continue comme ça !", "Quel bel effort !", "Regarde comme tu avances !", "Voilà un vrai progrès !", "Bien joué !", "Tu peux être fier de toi !", "Garde cet élan !", "Travail remarquable !", "Tu l'as fait !", "Tes efforts portent leurs fruits !", "Beau travail aujourd'hui !", "Tu as assuré !", "C'est une belle victoire !", "Effort exceptionnel !", "Continue de briller !"],
  it: ["Ottimo lavoro!", "Meraviglioso!", "Stai andando alla grande!", "Lavoro fantastico!", "Ce l'hai fatta!", "Così si fa!", "Un impegno brillante!", "Guarda quanto stai migliorando!", "Questo è un vero progresso!", "Ben fatto!", "Puoi essere orgoglioso!", "Continua così!", "Eccellente lavoro!", "Hai raggiunto il tuo obiettivo!", "La tua pratica sta dando frutti!", "Ottimo lavoro oggi!", "Sei stato bravissimo!", "Una bella vittoria!", "Impegno straordinario!", "Continua a brillare!"],
  de: ["Gut gemacht!", "Wunderbar!", "Du machst das großartig!", "Fantastische Arbeit!", "Du hast es geschafft!", "Weiter so!", "Starke Leistung!", "Sieh dir deinen Fortschritt an!", "Das ist echter Fortschritt!", "Klasse gemacht!", "Darauf kannst du stolz sein!", "Behalte den Schwung bei!", "Ausgezeichnete Arbeit!", "Du hast es geschafft!", "Dein Üben zahlt sich aus!", "Stark gemacht heute!", "Das hast du gemeistert!", "Ein echter Erfolg!", "Großartiger Einsatz!", "Strahl weiter!"],
  ja: ["よくできました！", "素晴らしい！", "とても順調です！", "見事な取り組みです！", "やり遂げましたね！", "その調子です！", "素晴らしい努力です！", "成長が見えますね！", "確かな進歩です！", "上手にできました！", "自分を誇りに思ってください！", "この調子で続けましょう！", "とてもよくできました！", "目標達成です！", "練習の成果が出ています！", "今日もよく頑張りました！", "ばっちりです！", "大きな一歩です！", "素晴らしい頑張りです！", "これからも輝いてください！"],
  zh: ["做得好！", "太棒了！", "你进步很大！", "表现真出色！", "你做到了！", "继续加油！", "努力得真棒！", "看看你的进步！", "这是真正的进步！", "干得漂亮！", "你值得为自己骄傲！", "保持这个势头！", "非常出色！", "你成功了！", "练习开始见效了！", "今天表现很棒！", "你掌握得很好！", "这是一项成就！", "付出太赞了！", "继续闪闪发光！"],
  hi: ["बहुत बढ़िया!", "शानदार!", "आप बहुत अच्छा कर रहे हैं!", "कमाल का काम!", "आपने कर दिखाया!", "इसी तरह आगे बढ़ें!", "बेहतरीन प्रयास!", "देखिए, आप कितना आगे बढ़े हैं!", "यह सचमुच अच्छी प्रगति है!", "बहुत खूब!", "आपको खुद पर गर्व होना चाहिए!", "यह रफ़्तार बनाए रखें!", "उत्कृष्ट काम!", "आपने इसे संभव बनाया!", "आपका अभ्यास रंग ला रहा है!", "आज आपने बहुत अच्छा किया!", "आपने कमाल कर दिया!", "यह एक बड़ी जीत है!", "जबरदस्त मेहनत!", "चमकते रहें!"],
  ar: ["أحسنت!", "رائع!", "أنت تتقدم بشكل ممتاز!", "عمل مذهل!", "لقد أنجزتها!", "استمر هكذا!", "مجهود رائع!", "انظر إلى مدى تقدمك!", "هذا تقدم حقيقي!", "عمل جميل!", "من حقك أن تفخر بنفسك!", "حافظ على هذا الحماس!", "عمل ممتاز!", "لقد حققت هدفك!", "تدريبك يؤتي ثماره!", "أبدعت اليوم!", "أتقنتها!", "هذا إنجاز رائع!", "مجهود استثنائي!", "واصل التألق!"],
};

const baseCopy = {
  en: { title: "Today's immersion", subtitle: "Practice outside of the app", loading: "Creating today's immersion...", retry: "Try again", retryReward: "Retry reward", rewardFailed: "Your tasks are complete, but the XP reward could not be saved.", empty: "No immersion tasks yet.", rewardXp: "You earned +15 XP!", goal: "Your goal" },
  es: { title: "Inmersión de hoy", subtitle: "Practica fuera de la aplicación", loading: "Creando la inmersión de hoy...", retry: "Reintentar", retryReward: "Reintentar recompensa", rewardFailed: "Completaste las tareas, pero no se pudo guardar la recompensa de XP.", empty: "Aún no hay actividades.", rewardXp: "¡Ganaste +15 XP!", goal: "Tu meta" },
  pt: { title: "Imersão de hoje", subtitle: "Pratique fora do aplicativo", loading: "Criando a imersão de hoje...", retry: "Tentar novamente", retryReward: "Tentar recompensa novamente", rewardFailed: "Você concluiu as tarefas, mas não foi possível salvar a recompensa de XP.", empty: "Ainda não há tarefas.", rewardXp: "Você ganhou +15 XP!", goal: "Seu objetivo" },
  fr: { title: "Immersion du jour", subtitle: "Pratique en dehors de l'application", loading: "Création de l'immersion du jour...", retry: "Réessayer", retryReward: "Réessayer la récompense", rewardFailed: "Tu as terminé les tâches, mais la récompense XP n'a pas pu être enregistrée.", empty: "Aucune activité pour le moment.", rewardXp: "Tu as gagné +15 XP !", goal: "Ton objectif" },
  it: { title: "Immersione di oggi", subtitle: "Fai pratica fuori dall'app", loading: "Creazione dell'immersione di oggi...", retry: "Riprova", retryReward: "Riprova il premio", rewardFailed: "Hai completato le attività, ma non è stato possibile salvare la ricompensa XP.", empty: "Nessuna attività disponibile.", rewardXp: "Hai guadagnato +15 XP!", goal: "Il tuo obiettivo" },
  de: { title: "Heutige Immersion", subtitle: "Übe außerhalb der App", loading: "Heutige Aufgaben werden erstellt...", retry: "Erneut versuchen", retryReward: "Belohnung erneut versuchen", rewardFailed: "Du hast alle Aufgaben abgeschlossen, aber die XP-Belohnung konnte nicht gespeichert werden.", empty: "Noch keine Aufgaben.", rewardXp: "Du hast +15 XP verdient!", goal: "Dein Ziel" },
  ja: { title: "今日のイマージョン", subtitle: "アプリの外で練習しよう", loading: "今日のタスクを作成中...", retry: "再試行", retryReward: "報酬を再試行", rewardFailed: "タスクは完了しましたが、XP報酬を保存できませんでした。", empty: "タスクはまだありません。", rewardXp: "+15 XPを獲得しました！", goal: "あなたの目標" },
  zh: { title: "今日沉浸练习", subtitle: "在应用外练习", loading: "正在创建今日任务...", retry: "重试", retryReward: "重试奖励", rewardFailed: "任务已完成，但 XP 奖励未能保存。", empty: "暂无任务。", rewardXp: "你获得了 +15 XP！", goal: "你的目标" },
  hi: { title: "आज का भाषा अभ्यास", subtitle: "ऐप के बाहर अभ्यास करें", loading: "आज के कार्य बनाए जा रहे हैं...", retry: "फिर प्रयास करें", retryReward: "इनाम के लिए फिर प्रयास करें", rewardFailed: "आपने सभी कार्य पूरे किए, लेकिन XP इनाम सहेजा नहीं जा सका।", empty: "अभी कोई कार्य नहीं है", rewardXp: "आपने +15 XP अर्जित किए!", goal: "आपका लक्ष्य" },
  ar: { title: "انغماس اليوم", subtitle: "تدرّب خارج التطبيق", loading: "بنجهّز مهام اليوم...", retry: "حاول تاني", retryReward: "حاول استلام المكافأة مرة أخرى", rewardFailed: "أكملت المهام، لكن تعذّر حفظ مكافأة XP.", empty: "لسه ما فيش مهام.", rewardXp: "كسبت +15 XP!", goal: "هدفك" },
};

const placementNeeded = {
  en: "Set your proficiency level to create today's immersion tasks.",
  es: "Define tu nivel de dominio para crear las actividades de inmersión de hoy.",
  pt: "Defina seu nível de proficiência para criar as tarefas de imersão de hoje.",
  fr: "Définis ton niveau de compétence pour créer les activités d’immersion d’aujourd’hui.",
  it: "Imposta il tuo livello di competenza per creare le attività di immersione di oggi.",
  de: "Lege dein Sprachniveau fest, damit wir deine heutigen Immersionsaufgaben erstellen können.",
  ja: "今日のイマージョンタスクを作成するには、まず習熟度を設定してください。",
  zh: "请先确定你的语言水平，我们才能创建今天的沉浸练习任务。",
  hi: "आज के इमर्शन कार्य बनाने के लिए पहले अपना भाषा स्तर तय करें।",
  ar: "حدّد مستواك في اللغة أولًا لنجهّز مهام الانغماس الخاصة بالنهارده.",
};

export const IMMERSION_COPY = Object.fromEntries(
  Object.entries(baseCopy).map(([language, copy]) => [
    language,
    { ...copy, placementNeeded: placementNeeded[language], encouragements: encouragements[language] },
  ]),
);
