import useLanguage from "../../hooks/useLanguage";
import { detectUserLanguage } from "../../utils/languageDetection";
import { normalizeSupportLanguage } from "../../constants/languages";
import { loadPublicPageCopy } from "./index.js";

export function preparePublicPageCopy(page) {
  let language;
  if (page === "links") {
    language = useLanguage.getState().initLanguage();
  } else {
    language = normalizeSupportLanguage(localStorage.getItem("appLanguage") || detectUserLanguage());
    localStorage.setItem("appLanguage", language);
  }
  return loadPublicPageCopy(page, language);
}
