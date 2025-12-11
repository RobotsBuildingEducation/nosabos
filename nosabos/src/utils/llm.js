// src/utils/llm.js

const RESPONSES_URL = `${import.meta.env.VITE_RESPONSES_URL}/proxyResponses`;
const DEFAULT_RESPONSES_MODEL =
  import.meta.env.VITE_OPENAI_TRANSLATE_MODEL || "gpt-4o-mini";

export async function callResponses({ model = DEFAULT_RESPONSES_MODEL, input }) {
  try {
    const r = await fetch(RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model,
        text: { format: { type: "text" } },
        input,
      }),
    });
    const ct = r.headers.get("content-type") || "";
    const payload = ct.includes("application/json")
      ? await r.json()
      : await r.text();
    const text =
      (typeof payload?.output_text === "string" && payload.output_text) ||
      (Array.isArray(payload?.output) &&
        payload.output
          .map((it) =>
            (it?.content || []).map((seg) => seg?.text || "").join("")
          )
          .join(" ")
          .trim()) ||
      (Array.isArray(payload?.content) && payload.content[0]?.text) ||
      (Array.isArray(payload?.choices) &&
        (payload.choices[0]?.message?.content || "")) ||
      (typeof payload === "string" ? payload : "");
    return String(text || "");
  } catch {
    return "";
  }
}

/**
 * Generate an explanation for an incorrect answer
 * @param {Object} params
 * @param {string} params.question - The question or sentence with blank
 * @param {string} params.userAnswer - The user's incorrect answer
 * @param {string} params.correctAnswer - The correct answer or hint
 * @param {string} params.targetLang - Target language (e.g., "Spanish")
 * @param {string} params.supportLang - Support language name (e.g., "English", "Spanish")
 * @param {string} params.questionType - Type of question (e.g., "fill", "mc", "ma")
 * @param {string} params.userLanguage - User's UI language (e.g., "en", "es")
 * @returns {Promise<string>} The explanation text
 */
export async function explainAnswer({
  question,
  userAnswer,
  correctAnswer,
  targetLang = "Spanish",
  supportLang = "English",
  questionType = "fill",
  userLanguage = "en",
}) {
  const langMap = {
    en: {
      fillPrompt: `You are a helpful language tutor teaching ${targetLang}. A student answered a fill-in-the-blank question incorrectly.

Question: ${question}
Student's answer: ${userAnswer}
Correct answer (or hint): ${correctAnswer}

IMPORTANT: Provide your explanation in ${supportLang}.

Provide a brief, encouraging explanation (2-3 sentences) that:
1. Explains why their answer doesn't fit or what they misunderstood
2. Clarifies the correct answer and its meaning
3. Provides a helpful tip to remember it

Keep it concise, supportive, and focused on learning. Write your entire response in ${supportLang}.`,
      mcPrompt: `You are a helpful language tutor teaching ${targetLang}. A student answered a multiple-choice question incorrectly.

Question: ${question}
Student's answer: ${userAnswer}
Correct answer: ${correctAnswer}

IMPORTANT: Provide your explanation in ${supportLang}.

Provide a brief, encouraging explanation (2-3 sentences) that:
1. Explains why their choice was incorrect
2. Clarifies why the correct answer is right
3. Provides a helpful tip to remember the difference

Keep it concise, supportive, and focused on learning. Write your entire response in ${supportLang}.`,
      maPrompt: `You are a helpful language tutor teaching ${targetLang}. A student answered a multiple-answer question incorrectly.

Question: ${question}
Student's answers: ${userAnswer}
Correct answers: ${correctAnswer}

IMPORTANT: Provide your explanation in ${supportLang}.

Provide a brief, encouraging explanation (2-3 sentences) that:
1. Explains which answers they missed or incorrectly selected
2. Clarifies why the correct answers are right
3. Provides a helpful tip to identify correct answers

Keep it concise, supportive, and focused on learning. Write your entire response in ${supportLang}.`,
    },
    es: {
      fillPrompt: `Eres un tutor de idiomas servicial que enseña ${targetLang}. Un estudiante respondió incorrectamente una pregunta de llenar el espacio en blanco.

Pregunta: ${question}
Respuesta del estudiante: ${userAnswer}
Respuesta correcta (o pista): ${correctAnswer}

IMPORTANTE: Proporciona tu explicación en ${supportLang}.

Proporciona una breve explicación alentadora (2-3 oraciones) que:
1. Explique por qué su respuesta no encaja o qué malentendieron
2. Aclare la respuesta correcta y su significado
3. Proporcione un consejo útil para recordarla

Mantenlo conciso, de apoyo y enfocado en el aprendizaje. Escribe toda tu respuesta en ${supportLang}.`,
      mcPrompt: `Eres un tutor de idiomas servicial que enseña ${targetLang}. Un estudiante respondió incorrectamente una pregunta de opción múltiple.

Pregunta: ${question}
Respuesta del estudiante: ${userAnswer}
Respuesta correcta: ${correctAnswer}

IMPORTANTE: Proporciona tu explicación en ${supportLang}.

Proporciona una breve explicación alentadora (2-3 oraciones) que:
1. Explique por qué su elección fue incorrecta
2. Aclare por qué la respuesta correcta es la correcta
3. Proporcione un consejo útil para recordar la diferencia

Mantenlo conciso, de apoyo y enfocado en el aprendizaje. Escribe toda tu respuesta en ${supportLang}.`,
      maPrompt: `Eres un tutor de idiomas servicial que enseña ${targetLang}. Un estudiante respondió incorrectamente una pregunta de respuesta múltiple.

Pregunta: ${question}
Respuestas del estudiante: ${userAnswer}
Respuestas correctas: ${correctAnswer}

IMPORTANTE: Proporciona tu explicación en ${supportLang}.

Proporciona una breve explicación alentadora (2-3 oraciones) que:
1. Explique qué respuestas omitieron o seleccionaron incorrectamente
2. Aclare por qué las respuestas correctas son correctas
3. Proporcione un consejo útil para identificar las respuestas correctas

Mantenlo conciso, de apoyo y enfocado en el aprendizaje. Escribe toda tu respuesta en ${supportLang}.`,
    },
  };

  const prompts = langMap[userLanguage] || langMap.en;
  let prompt;

  switch (questionType) {
    case "mc":
      prompt = prompts.mcPrompt;
      break;
    case "ma":
      prompt = prompts.maPrompt;
      break;
    case "fill":
    default:
      prompt = prompts.fillPrompt;
      break;
  }

  return await callResponses({
    model: DEFAULT_RESPONSES_MODEL,
    input: prompt,
  });
}

export { DEFAULT_RESPONSES_MODEL };
