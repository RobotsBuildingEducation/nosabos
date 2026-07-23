// Authored practice-language curriculum adaptations.
//
// The base skill tree is authored for Spanish practice. Each module here maps
// sourceLessonId → agendaItemId → { concept, forms?, examples } for one practice
// language, produced with scripts/generateTargetCurriculum.mjs and merged into
// that language's LEARNING_PATHS clone (see applyAuthoredTargetCurriculum).
// `forms` is only for exact learner production; activity instructions remain
// private curriculum concepts and must never be promoted to forms.
// Lessons/items without an entry fall back to the generic per-mode adapter,
// so partial coverage is always safe. Files are reviewable data — hand-edits
// survive regeneration (the script only fills missing entries by default).
//
// Nahuatl (nah) and Yucatec Maya (yua) are deliberately unauthored: reliable
// curriculum data for them should come from native speakers, not model
// generation. They keep the safe generic-adapter fallback.
import de from "./de.js";
import el from "./el.js";
import en from "./en.js";
import fr from "./fr.js";
import ga from "./ga.js";
import it from "./it.js";
import ja from "./ja.js";
import nl from "./nl.js";
import pl from "./pl.js";
import pt from "./pt.js";
import ru from "./ru.js";
import { ALIGNMENT_TARGET_OVERRIDES } from "./alignmentOverrides.js";
import { REPAIR_TARGET_OVERRIDES } from "./repairOverrides.js";

const mergeLessonOverrides = (base, overrides = {}) => {
  const merged = { ...base };
  Object.entries(overrides).forEach(([lessonId, items]) => {
    merged[lessonId] = { ...(merged[lessonId] || {}), ...items };
  });
  return merged;
};

const mergeAllOverrides = (base, lang) =>
  mergeLessonOverrides(
    mergeLessonOverrides(base, ALIGNMENT_TARGET_OVERRIDES[lang]),
    REPAIR_TARGET_OVERRIDES[lang],
  );

export const TARGET_CURRICULUM = {
  de: mergeAllOverrides(de, "de"),
  el: mergeAllOverrides(el, "el"),
  en: mergeAllOverrides(en, "en"),
  fr: mergeAllOverrides(fr, "fr"),
  ga: mergeAllOverrides(ga, "ga"),
  it: mergeAllOverrides(it, "it"),
  ja: mergeAllOverrides(ja, "ja"),
  nl: mergeAllOverrides(nl, "nl"),
  pl: mergeAllOverrides(pl, "pl"),
  pt: mergeAllOverrides(pt, "pt"),
  ru: mergeAllOverrides(ru, "ru"),
};
