// Self-contained: Vite embeds this function and its small dictionaries in HTML.
// No application modules, translations, or backend requests are needed to paint.
export function createLoadingLocalization(config, resolveLanguage, browser) {
  let language;
  let displayNames;
  let percentFormat;
  const format = (text, values = {}) => text.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
  const readLanguage = () => {
    let storedLanguage, timeZone, browserLanguages = [];
    try { storedLanguage = browser.localStorage?.getItem("appLanguage"); } catch { /* Storage can be disabled. */ }
    try { timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* Use browser languages. */ }
    try {
      const navigator = browser.navigator;
      browserLanguages = navigator?.languages?.length ? [...navigator.languages] : [navigator?.language || navigator?.userLanguage];
    } catch { /* Use the default. */ }
    return resolveLanguage(config.initial, { storedLanguage, timeZone, browserLanguages });
  };
  const setLanguage = (value = readLanguage()) => {
    const next = resolveLanguage(config.initial, { storedLanguage: value });
    if (language === next) return false;
    language = next;
    displayNames = undefined;
    percentFormat = undefined;
    return true;
  };
  const getCopy = () => config.copy[language] || config.copy.en;
  const languageName = (code, fallback = code) => {
    try {
      displayNames ||= new Intl.DisplayNames([language], { type: "language" });
      const name = displayNames.of(code);
      return name === code ? fallback : name;
    } catch { return fallback; }
  };
  const percentage = (value) => {
    let percent = `${value}%`;
    try {
      percentFormat ||= new Intl.NumberFormat(language, { style: "percent", maximumFractionDigits: 0 });
      percent = percentFormat.format(value / 100);
    } catch { /* Keep the numeric percentage readable on older browsers. */ }
    return format(getCopy().percentage, { percent });
  };
  const stage = (key = "code", targetLanguage, fallbackLabel) => {
    const copy = getCopy();
    const target = targetLanguage ? languageName(targetLanguage, fallbackLabel) : fallbackLabel;
    return key === "path" && target ? format(copy.pathLanguage, { language: target }) : copy[key] || copy.code;
  };
  const activity = (descriptor, state) => {
    const copy = getCopy();
    const [kind, code] = descriptor.key.split(":");
    let subject = copy.subjects[descriptor.key];
    if (kind === "content" || kind === "pronunciation") {
      subject = format(copy[kind], { language: languageName(code, config.languageNames[code]) });
    }
    if (!subject) return descriptor[state];
    const key = state === "ready" ? "activityReady" : state === "failed" ? "activityFailed"
      : descriptor.preparing ? "preparingActivity" : "downloading";
    const message = format(copy[key], { subject });
    return message[0].toLocaleUpperCase(language) + message.slice(1);
  };
  const applyToInitialCard = () => {
    const card = browser.document?.querySelector("[data-startup-initial]");
    if (!card) return;
    const copy = getCopy();
    const container = card.closest(".startup-loading");
    container.lang = language;
    container.dir = language === "ar" ? "rtl" : "ltr";
    for (const [selector, text] of Object.entries({
      ".startup-loading__title": copy.title,
      ".startup-loading__status": copy.code,
      ".startup-loading__percentage": percentage(0),
      ".startup-loading__retry": copy.retry,
    })) {
      const element = card.querySelector(selector);
      if (element) element.textContent = text;
    }
    const bar = card.querySelector('[role="progressbar"]');
    bar?.setAttribute("aria-label", copy.progressLabel);
    bar?.setAttribute("aria-valuetext", `${percentage(0)}. ${copy.code}`);
    card.querySelector(".startup-loading__resources")?.setAttribute("aria-label", copy.resourcesLabel);
    card.dataset.localized = "true";
  };
  setLanguage();
  return { get language() { return language; }, getCopy, setLanguage, languageName, percentage, stage, activity, applyToInitialCard };
}
