// Authored practice-language curriculum adaptations.
//
// The base skill tree is authored for Spanish practice. Each module here maps
// sourceLessonId → agendaItemId → { concept, examples } for one practice
// language, produced with scripts/generateTargetCurriculum.mjs and merged into
// that language's LEARNING_PATHS clone (see applyAuthoredTargetCurriculum).
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

export const TARGET_CURRICULUM = {
  de,
  el,
  en,
  fr,
  ga,
  it,
  ja,
  nl,
  pl,
  pt,
  ru,
};
