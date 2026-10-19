import useLanguage from "../../hooks/useLanguage";
import { detectUserLanguage } from "../../utils/languageDetection";
import { loadPublicPageCopy } from "./index.js";

export function preparePublicPageCopy(page) {
  let language;
  if (page === "links") {
    language = useLanguage.getState().initLanguage();
  } else {
    language = detectUserLanguage();
    localStorage.setItem("appLanguage", language);
  }
  return loadPublicPageCopy(page, language);
}
