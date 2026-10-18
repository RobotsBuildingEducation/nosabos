// Self-contained so the same labels can run inline before the app starts.
export function classifyLoadingResource(name, type = "") {
  let path;
  try { path = new URL(name, "https://piyali.app").pathname; } catch { return null; }
  const file = path.split("/").pop() || "";
  const languages = {
    es: "Spanish", en: "English", pt: "Portuguese", fr: "French", it: "Italian",
    de: "German", ja: "Japanese", zh: "Chinese", hi: "Hindi", ar: "Arabic",
    nl: "Dutch", ru: "Russian", el: "Greek", pl: "Polish", ga: "Irish",
    nah: "Nahuatl", yua: "Yucatec Maya",
  };
  const activity = (key, subject, verb = "Downloading") => ({
    key,
    loading: `${verb} ${subject}…`,
    ready: `${subject[0].toUpperCase()}${subject.slice(1)} ready`,
    failed: `We couldn’t load ${subject} yet.`,
  });

  // Development, telemetry, and update bookkeeping aren't product milestones.
  if (/@vite|@react-refresh|registerSW|workbox|version\.json|__piyali-loading-plan|favicon|recaptcha|analytics|app-check/i.test(path)) return null;
  if (/translations|Static\.(?:jsx?|tsx?)$|languageDetection|documentLanguage/i.test(path)) return activity("translations", "page translations", "Preparing");

  const language = path.match(/\/(?:targetCurriculum|phonics)\/([a-z]{2,3})(?:\.coverage)?\.js$/i)?.[1]
    || path.match(/\/publicCopy\/(?:landing|links|companion)\/([a-z]{2,3})\.(?:js|jsx)$/i)?.[1]
    || path.match(/\/assets\/([a-z]{2,3})\d*(?:-[\w-]+)?\.js$/i)?.[1];
  if (languages[language]) {
    const pronunciation = path.includes("/phonics/");
    return activity(`${pronunciation ? "pronunciation" : "content"}:${language}`, `${languages[language]} ${pronunciation ? "pronunciation practice" : "content"}`);
  }
  if (/\/assets\/(?:[1-9]|[1-3]\d|4[01])(?:-[\w-]+)?\.(?:webp|png)$/i.test(path)
    || /\/sprites\/|NPC_sprites|character.*\.(?:webp|png|jpe?g)/i.test(path)) return activity("characters", "character artwork");
  if (/companion|petTypes|pet.*sprites/i.test(path)) return activity("companion", "your learning companion", "Preparing");
  if (/voice|tone|sound|tts|audio|geminiLive/i.test(path) || type === "Media") return activity("voice", "voice and sound", "Preparing");
  if (/\/baseLevels\/|\/(?:pre-a1|a1|a2|b1|b2|c1|c2)(?:-[\w-]+)?\.js$|skillTree|Curriculum|flashcard|phonics|Alphabet/i.test(path)) return activity("lessons", "lesson activities");
  if (/GameRouter|LoadingMiniGame|legacyScenario|\/RPGGame\//i.test(path)) return activity("games", "practice games");
  if (/Proficiency|proficiency/i.test(path)) return activity("proficiency", "your level check", "Preparing");
  if (/Citizenship/i.test(path)) return activity("citizenship", "the citizenship guide");
  if (/LinksPage|MangaLinks/i.test(path)) return activity("links", "your links", "Preparing");
  if (/LandingPage|LandingLanguage|LandingEthos/i.test(path)) return activity("welcome", "your welcome page", "Preparing");
  if (/identity|nostr|firebase|profile|wallet|cashu|patreon/i.test(path)) return activity("account", "your account", "Preparing");
  if (type === "Stylesheet" || type === "Font" || /\.(?:css|woff2?|ttf|otf)$/.test(file)) return activity("appearance", "your page’s appearance", "Preparing");
  if (type === "Image") return activity("artwork", "page illustrations");
  return activity("learning-tools", "practice tools", "Preparing");
}
