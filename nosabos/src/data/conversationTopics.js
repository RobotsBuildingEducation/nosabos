/**
 * Conversation Topics Utilities
 *
 * Provides functions to extract lesson topics from the skill tree
 * for AI-powered conversation topic generation.
 */

import { getLearningPath } from "./skillTreeData";

/**
 * Extract lesson topics from the skill tree for a given proficiency level
 * Returns a list of unit titles and lesson topics for AI context
 *
 * @param {string} level - CEFR level (A1, A2, B1, B2, C1, C2)
 * @param {string} targetLang - Target language code (es, en, pt, fr, it, nl, nah)
 * @returns {string[]} - Array of topic strings
 */
export function getSkillTreeTopics(level = "A1", targetLang = "es") {
  const levels = ["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"];
  const levelIndex = levels.indexOf(level);
  const effectiveIndex = levelIndex === -1 ? 0 : levelIndex;

  const topics = [];

  // Collect topics from all levels up to and including the user's level
  for (let i = 0; i <= effectiveIndex; i++) {
    const currentLevel = levels[i];
    const units = getLearningPath(targetLang, currentLevel);

    if (units && Array.isArray(units)) {
      units.forEach((unit) => {
        // Skip tutorial units
        if (unit.isTutorial) return;

        // Add unit title
        const unitTitle = unit.title?.en || unit.title;
        if (unitTitle) {
          topics.push(`${currentLevel}: ${unitTitle}`);
        }

        // Add lesson topics
        if (unit.lessons && Array.isArray(unit.lessons)) {
          unit.lessons.forEach((lesson) => {
            // Skip quizzes
            if (lesson.isFinalQuiz) return;

            const lessonTitle = lesson.title?.en || lesson.title;
            if (lessonTitle && !lessonTitle.includes("Quiz")) {
              topics.push(`${currentLevel}: ${lessonTitle}`);
            }
          });
        }
      });
    }
  }

  return topics;
}

/**
 * Get a random subset of skill tree topics for the AI prompt
 * This keeps the prompt size reasonable while providing variety
 *
 * @param {string} level - CEFR level
 * @param {string} targetLang - Target language code
 * @param {number} count - Number of topics to return
 * @returns {string[]} - Random subset of topics
 */
export function getRandomSkillTreeTopics(
  level = "A1",
  targetLang = "es",
  count = 15
) {
  const allTopics = getSkillTreeTopics(level, targetLang);

  // Shuffle and take a subset
  const shuffled = [...allTopics].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Fallback topics in case API fails
 * Simple prompts appropriate for each level
 */
const baseFallbackTopics = {
  "Pre-A1": [
    { en: "Say hello", es: "Di hola", pt: "Diga olá", it: "Di' ciao", fr: "Dis bonjour", ja: "こんにちはと言う", hi: "नमस्ते कहें" },
    { en: "Count to ten", es: "Cuenta hasta diez", pt: "Conte até dez", it: "Conta fino a dieci", fr: "Compte jusqu'a dix", ja: "10まで数える", hi: "दस तक गिनें" },
    { en: "Name a color", es: "Nombra un color", pt: "Diga uma cor", it: "Nomina un colore", fr: "Nomme une couleur", ja: "色を1つ言う", hi: "एक रंग बताएं" },
    { en: "Say your name", es: "Di tu nombre", pt: "Diga seu nome", it: "Di' il tuo nome", fr: "Dis ton nom", ja: "自分の名前を言う", hi: "अपना नाम बताएं" },
    { en: "Say thank you", es: "Di gracias", pt: "Diga obrigado", it: "Di' grazie", fr: "Dis merci", ja: "ありがとうと言う", hi: "धन्यवाद कहें" },
  ],
  A1: [
    { en: "Introduce yourself", es: "Preséntate", pt: "Apresente-se", it: "Presentati", fr: "Presente-toi", ja: "自己紹介する", hi: "अपना परिचय दें" },
    { en: "Talk about your family", es: "Habla sobre tu familia", pt: "Fale sobre sua família", it: "Parla della tua famiglia", fr: "Parle de ta famille", ja: "家族について話す", hi: "अपने परिवार के बारे में बात करें" },
    { en: "Describe your daily routine", es: "Describe tu rutina diaria", pt: "Descreva sua rotina diária", it: "Descrivi la tua routine quotidiana", fr: "Decris ta routine quotidienne", ja: "日課を説明する", hi: "अपनी रोज़ की दिनचर्या बताएं" },
    { en: "Talk about your favorite food", es: "Habla sobre tu comida favorita", pt: "Fale sobre sua comida favorita", it: "Parla del tuo cibo preferito", fr: "Parle de ton plat prefere", ja: "好きな食べ物について話す", hi: "अपने पसंदीदा खाने के बारे में बात करें" },
    { en: "Describe the weather today", es: "Describe el clima de hoy", pt: "Descreva o clima de hoje", it: "Descrivi il tempo di oggi", fr: "Decris la meteo d'aujourd'hui", ja: "今日の天気を説明する", hi: "आज के मौसम का वर्णन करें" },
  ],
  A2: [
    { en: "Describe your neighborhood", es: "Describe tu vecindario", pt: "Descreva seu bairro", it: "Descrivi il tuo quartiere", fr: "Decris ton quartier", ja: "近所について説明する", hi: "अपने पड़ोस का वर्णन करें" },
    { en: "Talk about your hobbies", es: "Habla sobre tus pasatiempos", pt: "Fale sobre seus passatempos", it: "Parla dei tuoi hobby", fr: "Parle de tes loisirs", ja: "趣味について話す", hi: "अपने शौकों के बारे में बात करें" },
    { en: "Describe what you did yesterday", es: "Describe lo que hiciste ayer", pt: "Descreva o que você fez ontem", it: "Descrivi cosa hai fatto ieri", fr: "Decris ce que tu as fait hier", ja: "昨日したことを説明する", hi: "कल आपने क्या किया, यह बताएं" },
    { en: "Talk about your job or studies", es: "Habla sobre tu trabajo o estudios", pt: "Fale sobre seu trabalho ou seus estudos", it: "Parla del tuo lavoro o studio", fr: "Parle de ton travail ou de tes etudes", ja: "仕事や勉強について話す", hi: "अपने काम या पढ़ाई के बारे में बात करें" },
    { en: "Make plans for the weekend", es: "Haz planes para el fin de semana", pt: "Faça planos para o fim de semana", it: "Fai piani per il weekend", fr: "Fais des projets pour le week-end", ja: "週末の予定を立てる", hi: "सप्ताहांत की योजना बनाएं" },
  ],
  B1: [
    { en: "Share a memorable experience", es: "Comparte una experiencia memorable", pt: "Compartilhe uma experiência marcante", it: "Condividi un'esperienza memorabile", fr: "Partage une experience memorable", ja: "思い出に残る経験を共有する", hi: "कोई यादगार अनुभव साझा करें" },
    { en: "Give advice about learning languages", es: "Da consejos sobre aprender idiomas", pt: "Dê conselhos sobre aprender idiomas", it: "Dai consigli per imparare le lingue", fr: "Donne des conseils pour apprendre les langues", ja: "言語学習について助言する", hi: "भाषाएं सीखने पर सलाह दें" },
    { en: "Discuss your future goals", es: "Habla sobre tus metas futuras", pt: "Fale sobre suas metas futuras", it: "Parla dei tuoi obiettivi futuri", fr: "Parle de tes objectifs futurs", ja: "将来の目標について話す", hi: "अपने भविष्य के लक्ष्यों पर चर्चा करें" },
    { en: "Compare two places you know", es: "Compara dos lugares que conoces", pt: "Compare dois lugares que você conhece", it: "Confronta due luoghi che conosci", fr: "Compare deux endroits que tu connais", ja: "知っている2つの場所を比較する", hi: "अपने जाने हुए दो स्थानों की तुलना करें" },
    { en: "Talk about a person who inspires you", es: "Habla sobre una persona que te inspira", pt: "Fale sobre uma pessoa que inspira você", it: "Parla di una persona che ti ispira", fr: "Parle d'une personne qui t'inspire", ja: "尊敬する人について話す", hi: "ऐसे व्यक्ति के बारे में बात करें जो आपको प्रेरित करता है" },
  ],
  B2: [
    { en: "Discuss the impact of technology", es: "Habla sobre el impacto de la tecnología", pt: "Discuta o impacto da tecnologia", it: "Discuti l'impatto della tecnologia", fr: "Discute l'impact de la technologie", ja: "テクノロジーの影響について話し合う", hi: "तकनीक के प्रभाव पर चर्चा करें" },
    { en: "Debate work-life balance", es: "Debate el equilibrio trabajo-vida", pt: "Debata o equilíbrio entre trabalho e vida", it: "Dibatti l'equilibrio lavoro-vita", fr: "Debats de l'equilibre travail-vie personnelle", ja: "仕事と生活のバランスについて議論する", hi: "काम और जीवन के संतुलन पर बहस करें" },
    { en: "Analyze a current event", es: "Analiza un evento actual", pt: "Analise um acontecimento atual", it: "Analizza un evento attuale", fr: "Analyse un evenement actuel", ja: "時事問題を分析する", hi: "किसी वर्तमान घटना का विश्लेषण करें" },
    { en: "Discuss environmental challenges", es: "Habla sobre desafíos ambientales", pt: "Discuta desafios ambientais", it: "Discuti le sfide ambientali", fr: "Discute les defis environnementaux", ja: "環境問題について話し合う", hi: "पर्यावरणीय चुनौतियों पर चर्चा करें" },
    { en: "Share your views on education", es: "Comparte tus opiniones sobre la educación", pt: "Compartilhe sua opinião sobre educação", it: "Condividi le tue opinioni sull'istruzione", fr: "Partage ton avis sur l'education", ja: "教育について意見を共有する", hi: "शिक्षा पर अपने विचार साझा करें" },
  ],
  C1: [
    { en: "Analyze ethical implications of AI", es: "Analiza las implicaciones éticas de la IA", pt: "Analise as implicações éticas da IA", it: "Analizza le implicazioni etiche dell'IA", fr: "Analyse les implications ethiques de l'IA", ja: "AIの倫理的影響を分析する", hi: "AI के नैतिक प्रभावों का विश्लेषण करें" },
    { en: "Discuss cultural identity", es: "Habla sobre identidad cultural", pt: "Discuta identidade cultural", it: "Discuti l'identità culturale", fr: "Discute l'identite culturelle", ja: "文化的アイデンティティについて話し合う", hi: "सांस्कृतिक पहचान पर चर्चा करें" },
    { en: "Critique a social policy", es: "Critica una política social", pt: "Critique uma política social", it: "Critica una politica sociale", fr: "Critique une politique sociale", ja: "社会政策を批評する", hi: "किसी सामाजिक नीति की समालोचना करें" },
    { en: "Debate privacy in the digital age", es: "Debate la privacidad en la era digital", pt: "Debata a privacidade na era digital", it: "Dibatti la privacy nell'era digitale", fr: "Debats de la vie privee a l'ere numerique", ja: "デジタル時代のプライバシーを議論する", hi: "डिजिटल युग में गोपनीयता पर बहस करें" },
    { en: "Discuss economic inequality", es: "Habla sobre la desigualdad económica", pt: "Discuta a desigualdade econômica", it: "Discuti la disuguaglianza economica", fr: "Discute les inegalites economiques", ja: "経済的不平等について話し合う", hi: "आर्थिक असमानता पर चर्चा करें" },
  ],
  C2: [
    { en: "Explore the nature of consciousness", es: "Explora la naturaleza de la conciencia", pt: "Explore a natureza da consciência", it: "Esplora la natura della coscienza", fr: "Explore la nature de la conscience", ja: "意識の本質を探る", hi: "चेतना के स्वभाव का अन्वेषण करें" },
    { en: "Analyze media influence on society", es: "Analiza la influencia de los medios en la sociedad", pt: "Analise a influência da mídia na sociedade", it: "Analizza l'influenza dei media sulla società", fr: "Analyse l'influence des medias sur la societe", ja: "メディアが社会に与える影響を分析する", hi: "समाज पर मीडिया के प्रभाव का विश्लेषण करें" },
    { en: "Discuss philosophical perspectives on truth", es: "Habla sobre perspectivas filosóficas de la verdad", pt: "Discuta perspectivas filosóficas sobre a verdade", it: "Discuti prospettive filosofiche sulla verità", fr: "Discute des perspectives philosophiques sur la verite", ja: "真理に関する哲学的視点を話し合う", hi: "सत्य पर दार्शनिक दृष्टिकोणों पर चर्चा करें" },
    { en: "Debate the future of human agency", es: "Debate el futuro de la agencia humana", pt: "Debata o futuro da ação humana", it: "Dibatti il futuro dell'agire umano", fr: "Debats de l'avenir de l'action humaine", ja: "人間の主体性の未来を議論する", hi: "मानव स्वायत्तता के भविष्य पर बहस करें" },
    { en: "Analyze geopolitical trends", es: "Analiza tendencias geopolíticas", pt: "Analise tendências geopolíticas", it: "Analizza tendenze geopolitiche", fr: "Analyse les tendances geopolitiques", ja: "地政学的な傾向を分析する", hi: "भूराजनीतिक रुझानों का विश्लेषण करें" },
  ],
};

export const fallbackTopics = baseFallbackTopics;

/**
 * Get a random fallback topic for the given level
 *
 * @param {string} level - CEFR level
 * @returns {{ en: string, es: string }}
 */
export function getRandomFallbackTopic(level = "A1") {
  const topics = fallbackTopics[level] || fallbackTopics.A1;
  const randomIndex = Math.floor(Math.random() * topics.length);
  return topics[randomIndex];
}
