import { useLocation } from "react-router-dom";
import { SUPPORT_LANGUAGE_CODES } from "../constants/supportLanguages.js";
import { localizedPath, PUBLIC_PAGE_COPY, resolvePublicRoute } from "../seo/publicRoutes.js";

const names = { en: "English", es: "Español", pt: "Português", fr: "Français", it: "Italiano", de: "Deutsch", ja: "日本語", hi: "हिन्दी", ar: "العربية", zh: "中文" };
export default function PublicLanguageLinks() {
  const { pathname } = useLocation();
  const route = resolvePublicRoute(pathname);
  if (!route.indexable || route.target || (route.path === "/" && typeof localStorage !== "undefined" && localStorage.getItem("local_nsec"))) return null;
  return <nav className="public-language-links" aria-label={PUBLIC_PAGE_COPY[route.locale].language}>
    {SUPPORT_LANGUAGE_CODES.map(locale => <a key={locale} href={localizedPath(pathname, locale)} hrefLang={locale} lang={locale}>{names[locale]}</a>)}
  </nav>;
}
