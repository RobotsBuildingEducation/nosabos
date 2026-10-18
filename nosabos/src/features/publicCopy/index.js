import { createPublicCopyCache } from "./cache.js";

const loaders = {
  landing: {
    en: () => import("./landing/en.js"),
    es: () => import("./landing/es.js"),
    it: () => import("./landing/it.js"),
    pt: () => import("./landing/pt.js"),
    de: () => import("./landing/de.js"),
    hi: () => import("./landing/hi.js"),
    zh: () => import("./landing/zh.js"),
    ar: () => import("./landing/ar.js"),
    fr: () => import("./landing/fr.js"),
    ja: () => import("./landing/ja.js"),
  },
  links: {
    en: () => import("./links/en.jsx"),
    es: () => import("./links/es.jsx"),
    it: () => import("./links/it.jsx"),
    pt: () => import("./links/pt.jsx"),
    de: () => import("./links/de.jsx"),
    hi: () => import("./links/hi.jsx"),
    zh: () => import("./links/zh.jsx"),
    ar: () => import("./links/ar.jsx"),
    fr: () => import("./links/fr.jsx"),
    ja: () => import("./links/ja.jsx"),
  },
};

const cache = createPublicCopyCache(loaders);
export const loadPublicPageCopy = cache.load;
export const readPublicPageCopy = cache.read;
