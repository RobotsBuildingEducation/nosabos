import { SUPPORT_LANGUAGE_CODES } from "../constants/supportLanguages.js";
import { LANGUAGE_DETAILS, LANGUAGE_FALLBACK_LABELS } from "../constants/languagesData.js";
import { landingPageTranslations } from "../translations/landingPage.js";
import { landingPageRefreshCopy } from "../components/landingPageRefreshCopy.js";

export const SITE_ORIGIN = "https://piyali.app";
export const PRACTICE_LANGUAGES = LANGUAGE_DETAILS.filter(item => item.practiceEnabled !== false && !item.selectorHidden);
export const PUBLIC_PAGE_COPY = {
  en: { links: "Piyali & Robots Building Education", linksDescription: "Explore Piyali, coding education, scholarships, and the Robots Building Education community.", citizenship: "Mexican citizenship guide", citizenshipDescription: "Explore Mexican citizenship pathways, eligibility questions, and documents with an interactive guide.", learn: "Learn {language} with an AI language tutor", examples: "Try these beginner phrases", back: "Explore Piyali", beta: "Beta", language: "Language", pricing: "Pricing", lessons: "Lessons", practice: "Practice speaking" },
  es: { links: "Piyali y Robots Building Education", linksDescription: "Explora Piyali, educación en programación, becas y la comunidad de Robots Building Education.", citizenship: "Guía de ciudadanía mexicana", citizenshipDescription: "Explora vías para obtener la ciudadanía mexicana, preguntas de elegibilidad y documentos con una guía interactiva.", learn: "Aprende {language} con un tutor de idiomas con IA", examples: "Prueba estas frases para principiantes", back: "Explora Piyali", beta: "Beta", language: "Idioma", pricing: "Precio", lessons: "Lecciones", practice: "Practica hablar" },
  pt: { links: "Piyali e Robots Building Education", linksDescription: "Explore Piyali, ensino de programação, bolsas de estudo e a comunidade Robots Building Education.", citizenship: "Guia de cidadania mexicana", citizenshipDescription: "Explore caminhos para a cidadania mexicana, perguntas de elegibilidade e documentos com um guia interativo.", learn: "Aprenda {language} com um tutor de idiomas com IA", examples: "Experimente estas frases para iniciantes", back: "Explore Piyali", beta: "Beta", language: "Idioma", pricing: "Preço", lessons: "Lições", practice: "Pratique a fala" },
  fr: { links: "Piyali et Robots Building Education", linksDescription: "Découvrez Piyali, l’apprentissage de la programmation, les bourses et la communauté Robots Building Education.", citizenship: "Guide de citoyenneté mexicaine", citizenshipDescription: "Explorez les voies vers la citoyenneté mexicaine, les questions d’éligibilité et les documents avec un guide interactif.", learn: "Apprenez {language} avec un tuteur de langues IA", examples: "Essayez ces phrases pour débutants", back: "Découvrez Piyali", beta: "Bêta", language: "Langue", pricing: "Tarifs", lessons: "Leçons", practice: "Pratiquez l’oral" },
  it: { links: "Piyali e Robots Building Education", linksDescription: "Scopri Piyali, formazione in programmazione, borse di studio e la comunità Robots Building Education.", citizenship: "Guida alla cittadinanza messicana", citizenshipDescription: "Esplora percorsi per la cittadinanza messicana, domande di idoneità e documenti con una guida interattiva.", learn: "Impara {language} con un tutor di lingue IA", examples: "Prova queste frasi per principianti", back: "Scopri Piyali", beta: "Beta", language: "Lingua", pricing: "Prezzi", lessons: "Lezioni", practice: "Esercitati a parlare" },
  de: { links: "Piyali und Robots Building Education", linksDescription: "Entdecke Piyali, Programmierkurse, Stipendien und die Community von Robots Building Education.", citizenship: "Leitfaden zur mexikanischen Staatsbürgerschaft", citizenshipDescription: "Erkunde Wege zur mexikanischen Staatsbürgerschaft, Fragen zu Voraussetzungen und Dokumente mit einem interaktiven Leitfaden.", learn: "Lerne {language} mit einem KI-Sprachtutor", examples: "Probiere diese Sätze für Anfänger", back: "Entdecke Piyali", beta: "Beta", language: "Sprache", pricing: "Preise", lessons: "Lektionen", practice: "Übe das Sprechen" },
  ja: { links: "PiyaliとRobots Building Education", linksDescription: "Piyali、プログラミング学習、奨学金、Robots Building Educationのコミュニティをご覧ください。", citizenship: "メキシコ国籍ガイド", citizenshipDescription: "対話型ガイドでメキシコ国籍の取得ルート、資格の質問、必要書類を確認できます。", learn: "AI語学チューターと{language}を学ぶ", examples: "初心者向けのフレーズを練習", back: "Piyaliを探す", beta: "ベータ", language: "言語", pricing: "料金", lessons: "レッスン", practice: "会話を練習" },
  hi: { links: "Piyali और Robots Building Education", linksDescription: "Piyali, कोडिंग शिक्षा, छात्रवृत्तियों और Robots Building Education समुदाय के बारे में जानें।", citizenship: "मेक्सिकन नागरिकता गाइड", citizenshipDescription: "इंटरैक्टिव गाइड के साथ मेक्सिकन नागरिकता के रास्ते, पात्रता के सवाल और दस्तावेज़ देखें।", learn: "AI भाषा ट्यूटर के साथ {language} सीखें", examples: "शुरुआती लोगों के लिए ये वाक्य आज़माएँ", back: "Piyali देखें", beta: "बीटा", language: "भाषा", pricing: "कीमत", lessons: "पाठ", practice: "बोलने का अभ्यास करें" },
  ar: { links: "Piyali وRobots Building Education", linksDescription: "اكتشف Piyali وتعليم البرمجة والمنح الدراسية ومجتمع Robots Building Education.", citizenship: "دليل الجنسية المكسيكية", citizenshipDescription: "استكشف طرق الحصول على الجنسية المكسيكية وأسئلة الأهلية والمستندات بدليل تفاعلي.", learn: "اتعلم {language} مع مدرس لغات بالذكاء الاصطناعي", examples: "جرب الجمل دي للمبتدئين", back: "اكتشف Piyali", beta: "بيتا", language: "اللغة", pricing: "السعر", lessons: "الدروس", practice: "اتمرن على الكلام" },
  zh: { links: "Piyali与Robots Building Education", linksDescription: "探索Piyali、编程教育、奖学金和Robots Building Education社区。", citizenship: "墨西哥国籍指南", citizenshipDescription: "通过互动指南探索墨西哥国籍申请途径、资格问题和所需文件。", learn: "跟AI语言导师学习{language}", examples: "练习这些入门短句", back: "探索Piyali", beta: "测试版", language: "语言", pricing: "价格", lessons: "课程", practice: "练习口语" },
};

export function resolvePublicRoute(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  const localized = SUPPORT_LANGUAGE_CODES.includes(segments[0]);
  const locale = localized ? segments.shift() : "en";
  const path = segments.length ? `/${segments.join("/")}` : "/";
  const target = path.startsWith("/learn/") ? segments[1] : null;
  const learn = PRACTICE_LANGUAGES.some(item => item.value === target) && segments.length === 2;
  const indexable = ["/", "/links", "/citizenship"].includes(path) || learn;
  return { locale, localized, path, target: learn ? target : null, indexable };
}

export function localizedPath(path, locale) {
  const route = resolvePublicRoute(path);
  return `/${locale}${route.path === "/" ? "" : route.path}`;
}

export function getPublicMetadata(pathname, preferredLocale) {
  const route = resolvePublicRoute(pathname);
  const locale = route.localized ? route.locale : SUPPORT_LANGUAGE_CODES.includes(preferredLocale) ? preferredLocale : "en";
  const copy = landingPageTranslations[locale];
  const words = PUBLIC_PAGE_COPY[locale];
  const refresh = landingPageRefreshCopy[locale];
  const name = copy[`language_${route.target}`] || LANGUAGE_FALLBACK_LABELS[route.target];
  const homeTitles = {
    en: "Piyali | AI Language Tutor for Speaking Practice",
    es: "Piyali | Tutor de idiomas con IA para practicar conversación",
    pt: "Piyali | Tutor de idiomas com IA para praticar conversação",
    fr: "Piyali | Tuteur de langues IA pour pratiquer la conversation",
    it: "Piyali | Tutor di lingue IA per esercitarsi nella conversazione",
    de: "Piyali | KI-Sprachtutor für Gesprächsübungen",
    ja: "Piyali | 会話を練習できるAI語学チューター",
    hi: "Piyali | बातचीत के अभ्यास के लिए AI भाषा ट्यूटर",
    ar: "Piyali | مدرس لغات بالذكاء الاصطناعي لتدريب المحادثة",
    zh: "Piyali | 练习口语的AI语言导师",
  };
  let title = homeTitles[locale];
  let description = refresh.heroSubtitle;
  if (route.target) { title = words.learn.replace("{language}", name) + " | Piyali"; description = `${name}: ${refresh.heroSubtitle}`; }
  else if (route.path === "/links") { title = words.links; description = words.linksDescription; }
  else if (route.path === "/citizenship") { title = `${words.citizenship} | Piyali`; description = words.citizenshipDescription; }
  else if (!route.indexable) { title = `${route.path === "/404" ? "Page not found" : "Piyali"} | Piyali`; }
  const path = route.localized || locale !== "en" ? localizedPath(pathname, locale) : route.path;
  const canonical = SITE_ORIGIN + (route.indexable && locale !== "en" ? path : route.path);
  const alternates = route.indexable ? SUPPORT_LANGUAGE_CODES.map(language => ({ language, url: SITE_ORIGIN + (language === "en" ? route.path : localizedPath(pathname, language)) })) : [];
  if (route.indexable) alternates.push({ language: "x-default", url: SITE_ORIGIN + route.path });
  const schema = route.indexable ? {
    "@context": "https://schema.org", "@graph": [
      { "@type": "Organization", "@id": `${SITE_ORIGIN}/#organization`, name: "Piyali", url: SITE_ORIGIN, logo: `${SITE_ORIGIN}/logo.png` },
      { "@type": "WebSite", "@id": `${SITE_ORIGIN}/#website`, name: "Piyali", url: SITE_ORIGIN, publisher: { "@id": `${SITE_ORIGIN}/#organization` } },
      { "@type": "WebPage", "@id": canonical, url: canonical, name: title, description, inLanguage: locale, isPartOf: { "@id": `${SITE_ORIGIN}/#website` } },
      ...(route.path === "/" ? [{ "@type": "SoftwareApplication", name: "Piyali", applicationCategory: "EducationalApplication", operatingSystem: "Web", url: canonical, description }] : []),
    ],
  } : null;
  return { ...route, locale, title, description, canonical, alternates, schema, robots: route.indexable ? "index, follow" : "noindex, follow" };
}

export const INDEXABLE_PUBLIC_PATHS = ["/", "/links", "/citizenship", ...PRACTICE_LANGUAGES.map(item => `/learn/${item.value}`)];
export const LOCALIZED_PUBLIC_PATHS = SUPPORT_LANGUAGE_CODES.flatMap(locale => INDEXABLE_PUBLIC_PATHS.map(path => localizedPath(path, locale)));
export const UTILITY_PUBLIC_PATHS = ["/legacy-links", "/orbing", "/squircle", "/proficiency", "/onboarding", "/subscribe", "/patreon-return"];
