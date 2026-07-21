// The one rule whose LANGUAGE is its mechanism. An English sentence saying
// "speak Spanish" competes with an all-English context — English policy
// prose, English target phrases, and the model's own earlier mixed turns —
// and intermittently loses: es-support Pre-A1 sessions kept getting
// target-language instructions ("Now let's learn brother", "Say the missing
// word"). Writing the rule in the support language itself, appended as the
// FINAL line of every response's instructions (recency), anchors the reply's
// output language the way a Playground prompt written in Spanish yields
// Spanish replies.
//
// This deliberately restates the policy's base-language rule — the exception
// to the "state each rule once" doctrine — because here the restatement's
// language, not its content, is the lever. Keep every sentence short,
// imperative, and free of the target language's name so one sentence serves
// every pairing.
const TUTOR_LANGUAGE_ANCHORS = {
  en: "Reminder: say every instruction, question, explanation, and comment in English.",
  es: "Recuerda: di todas las instrucciones, preguntas, explicaciones y comentarios en español.",
  pt: "Lembre-se: diga todas as instruções, perguntas, explicações e comentários em português.",
  it: "Promemoria: dai tutte le istruzioni, le domande, le spiegazioni e i commenti in italiano.",
  fr: "Rappel : donne toutes les instructions, questions, explications et remarques en français.",
  de: "Zur Erinnerung: Sprich alle Anweisungen, Fragen, Erklärungen und Kommentare auf Deutsch.",
  ja: "リマインダー：指示・質問・説明・コメントはすべて日本語で話してください。",
  hi: "याद रखें: सभी निर्देश, प्रश्न, व्याख्याएँ और टिप्पणियाँ हिंदी में बोलें।",
  ar: "تذكير: قُل جميع التعليمات والأسئلة والشروحات والتعليقات باللغة العربية.",
  zh: "提醒：所有指示、提问、解释和点评都要用中文说。",
};

export function getOpenAITutorLanguageAnchor(supportCode = "") {
  const key = String(supportCode || "")
    .trim()
    .toLowerCase()
    .split(/[-_]/)[0];
  return TUTOR_LANGUAGE_ANCHORS[key] || "";
}
