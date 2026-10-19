import { companionNames as copy_en } from "../features/publicCopy/companion/en.js";
import { companionNames as copy_es } from "../features/publicCopy/companion/es.js";
import { companionNames as copy_it } from "../features/publicCopy/companion/it.js";
import { companionNames as copy_pt } from "../features/publicCopy/companion/pt.js";
import { companionNames as copy_de } from "../features/publicCopy/companion/de.js";
import { companionNames as copy_hi } from "../features/publicCopy/companion/hi.js";
import { companionNames as copy_zh } from "../features/publicCopy/companion/zh.js";
import { companionNames as copy_ar } from "../features/publicCopy/companion/ar.js";
import { companionNames as copy_fr } from "../features/publicCopy/companion/fr.js";
import { companionNames as copy_ja } from "../features/publicCopy/companion/ja.js";

const CUSTOMIZE_MODAL_COPY = {
  en: copy_en,
  es: copy_es,
  it: copy_it,
  pt: copy_pt,
  de: copy_de,
  hi: copy_hi,
  zh: copy_zh,
  ar: copy_ar,
  fr: copy_fr,
  ja: copy_ja,
};

export function getCustomizeModalCopy(lang) {
  return CUSTOMIZE_MODAL_COPY[lang] || CUSTOMIZE_MODAL_COPY.en;
}
