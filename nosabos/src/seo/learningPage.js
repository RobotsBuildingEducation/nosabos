import { landingPageTranslations } from "../translations/landingPage.js";
import { landingPageRefreshCopy } from "../components/landingPageRefreshCopy.js";
import { landingCapabilityCopy } from "../components/landingCapabilityCopy.js";
import { learningExamples } from "./learningExamples.js";
import { escapeHtml, renderSeoHead } from "./head.js";
import { getPublicMetadata, localizedPath, PRACTICE_LANGUAGES, PUBLIC_PAGE_COPY } from "./publicRoutes.js";

const nativeLanguageNames = { en: "English", es: "Español", pt: "Português", fr: "Français", it: "Italiano", de: "Deutsch", ja: "日本語", hi: "हिन्दी", ar: "العربية", zh: "中文" };

export const LEARNING_PAGE_CSS = `
  .learning-public{font-family:'DM Sans',system-ui,sans-serif;color:#2a2119;background:#fffdf9;min-height:100vh;padding:24px;line-height:1.65}
  .learning-public *{box-sizing:border-box}.learning-public a{color:#087d6b;text-underline-offset:4px}
  .learning-public header,.learning-public main,.learning-public footer{max-width:960px;margin:auto}
  .learning-public header{display:flex;align-items:center;justify-content:space-between;gap:24px;padding-bottom:32px}
  .learning-public .brand{font-weight:700;font-size:1.35rem;text-decoration:none}.learning-public h1{font-size:clamp(2rem,6vw,3.5rem);line-height:1.15;margin:24px 0;max-width:780px}
  .learning-public h2{font-size:1.5rem;line-height:1.3}.learning-public p{max-width:720px}.learning-public section{padding:24px 0;border-top:1px solid #e7dfd4;margin-top:32px}
  .learning-public .cta{display:inline-block;border-radius:100px;background:#087d6b;color:white;padding:12px 24px;text-decoration:none;font-weight:700;margin:8px 0}
  .learning-public .examples{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;padding:0;list-style:none}.learning-public .examples li{padding:18px;border:1px solid #e7dfd4;border-radius:18px;background:#f5f0e8;font-size:1.1rem}
  .learning-public nav{display:flex;flex-wrap:wrap;gap:12px 20px}.learning-public .tier{display:inline-block;border-radius:12px;padding:4px 12px;background:#eee8f3}.learning-public footer{padding-top:40px;font-size:.9rem}
  .learning-public :focus-visible{outline:3px solid #087d6b;outline-offset:5px}
`;

export function renderLearningPage(pathname) {
  const metadata = getPublicMetadata(pathname);
  const { locale, target } = metadata;
  if (!target) throw new Error(`Unknown learning page: ${pathname}`);
  const copy = landingPageTranslations[locale];
  const words = PUBLIC_PAGE_COPY[locale];
  const refresh = landingPageRefreshCopy[locale];
  const capability = landingCapabilityCopy[locale];
  const language = PRACTICE_LANGUAGES.find(item => item.value === target);
  const title = metadata.title.replace(/ \| Piyali$/, "");
  const home = localizedPath("/", locale);
  const alternatives = metadata.alternates.filter(item => item.language !== "x-default");
  return `<div class="learning-public"><header><a class="brand" href="${home}">Piyali</a><a href="${home}">${escapeHtml(words.back)}</a></header>
  <main><h1>${escapeHtml(title)}</h1>${language.tier === "beta" ? `<span class="tier">${escapeHtml(words.beta)}</span>` : ""}
  <p>${escapeHtml(refresh.heroSubtitle)}</p><a class="cta" href="${home}?practice=${target}#lp-showcase-title">${escapeHtml(words.practice)}</a>
  <section><h2>${escapeHtml(words.examples)}</h2><ul class="examples" lang="${target}" dir="ltr">${learningExamples[target].map(example => `<li>${escapeHtml(example)}</li>`).join("")}</ul></section>
  <section><h2>${escapeHtml(copy.feature_tutor)}</h2><p>${escapeHtml(refresh.intro)}</p><p>${escapeHtml(copy.feature_conversations_desc)}</p></section>
  <section><h2>${escapeHtml(words.lessons)}</h2><p>${escapeHtml(capability.proficiencyDesc)}</p><p>${escapeHtml(capability.memoryDesc)}</p><p>${escapeHtml(copy.feature_phonics_desc)}</p></section>
  <section><h2>${escapeHtml(words.pricing)}</h2><p>${escapeHtml(refresh.costAnswer)}</p></section>
  <section><h2>${escapeHtml(copy.languages_label)}</h2><nav>${PRACTICE_LANGUAGES.map(item => `<a href="${localizedPath(`/learn/${item.value}`, locale)}">${escapeHtml(copy[`language_${item.value}`] || item.value)}</a>`).join("")}</nav></section>
  </main><footer><nav aria-label="${escapeHtml(words.language)}">${alternatives.map(item => `<a href="${new URL(item.url).pathname}" hreflang="${item.language}" lang="${item.language}">${escapeHtml(nativeLanguageNames[item.language])}</a>`).join("")}</nav><p><a href="${localizedPath("/links", locale)}">${escapeHtml(words.links)}</a></p></footer></div>`;
}

export function renderLearningDocument(pathname, fontCss = "") {
  const metadata = getPublicMetadata(pathname);
  return `<!doctype html><html lang="${metadata.locale}" dir="${metadata.locale === "ar" ? "rtl" : "ltr"}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" type="image/svg+xml" href="/favicon.svg">${renderSeoHead(metadata)}<style>body{margin:0}${fontCss}${LEARNING_PAGE_CSS}</style></head><body>${renderLearningPage(pathname)}</body></html>`;
}
