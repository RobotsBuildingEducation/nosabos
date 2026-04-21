// src/utils/llm.js

import { simplemodel } from "../firebaseResources/firebaseResources";

const RESPONSES_URL = `${import.meta.env.VITE_RESPONSES_URL}/proxyResponses`;
const DEFAULT_RESPONSES_MODEL = "gpt-5-nano";

function textFromChunk(chunk) {
  try {
    if (!chunk) return "";
    if (typeof chunk.text === "function") return chunk.text() || "";
    if (typeof chunk.text === "string") return chunk.text;
    const cand = chunk.candidates?.[0];
    if (cand?.content?.parts?.length) {
      return cand.content.parts.map((p) => p.text || "").join("");
    }
  } catch {}
  return "";
}

export async function callResponses({
  model = DEFAULT_RESPONSES_MODEL,
  input,
}) {
  if (simplemodel) {
    try {
      const resp = await simplemodel.generateContentStream({
        contents: [{ role: "user", parts: [{ text: input }] }],
      });

      let aggregated = "";
      for await (const chunk of resp.stream) {
        aggregated += textFromChunk(chunk);
      }

      const finalResp = await resp.response;
      const finalText =
        (typeof finalResp?.text === "function"
          ? finalResp.text()
          : finalResp?.text) || aggregated;
      return String(finalText || "");
    } catch (err) {
      console.warn("callResponses gemini stream failed", err);
    }
  }

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
    it: {
      fillPrompt: `Sei un tutor di lingue disponibile che insegna ${targetLang}. Uno studente ha risposto in modo errato a una domanda di completamento.

Domanda: ${question}
Risposta dello studente: ${userAnswer}
Risposta corretta (o suggerimento): ${correctAnswer}

IMPORTANTE: Fornisci la spiegazione in ${supportLang}.

Fornisci una breve spiegazione incoraggiante (2-3 frasi) che:
1. Spieghi perché la risposta non funziona o cosa è stato frainteso
2. Chiarisca la risposta corretta e il suo significato
3. Dia un consiglio utile per ricordarla

Mantieni un tono conciso, di supporto e orientato all'apprendimento. Scrivi tutta la risposta in ${supportLang}.`,
      mcPrompt: `Sei un tutor di lingue disponibile che insegna ${targetLang}. Uno studente ha risposto in modo errato a una domanda a scelta multipla.

Domanda: ${question}
Risposta dello studente: ${userAnswer}
Risposta corretta: ${correctAnswer}

IMPORTANTE: Fornisci la spiegazione in ${supportLang}.

Fornisci una breve spiegazione incoraggiante (2-3 frasi) che:
1. Spieghi perché la scelta era errata
2. Chiarisca perché la risposta corretta è quella giusta
3. Dia un consiglio utile per ricordare la differenza

Mantieni un tono conciso, di supporto e orientato all'apprendimento. Scrivi tutta la risposta in ${supportLang}.`,
      maPrompt: `Sei un tutor di lingue disponibile che insegna ${targetLang}. Uno studente ha risposto in modo errato a una domanda a risposte multiple.

Domanda: ${question}
Risposte dello studente: ${userAnswer}
Risposte corrette: ${correctAnswer}

IMPORTANTE: Fornisci la spiegazione in ${supportLang}.

Fornisci una breve spiegazione incoraggiante (2-3 frasi) che:
1. Spieghi quali risposte sono state omesse o selezionate per errore
2. Chiarisca perché le risposte corrette sono giuste
3. Dia un consiglio utile per riconoscere le risposte corrette

Mantieni un tono conciso, di supporto e orientato all'apprendimento. Scrivi tutta la risposta in ${supportLang}.`,
    },
    fr: {
      fillPrompt: `Tu es un tuteur de langues serviable qui enseigne ${targetLang}. Un eleve a mal repondu a une question a trou.

Question : ${question}
Reponse de l'eleve : ${userAnswer}
Reponse correcte (ou indice) : ${correctAnswer}

IMPORTANT : Fournis ton explication en ${supportLang}.

Fournis une breve explication encourageante (2-3 phrases) qui :
1. Explique pourquoi sa reponse ne convient pas ou ce qu'il a mal compris
2. Clarifie la bonne reponse et son sens
3. Donne une astuce utile pour s'en souvenir

Reste concis, bienveillant et centre sur l'apprentissage. Ecris toute ta reponse en ${supportLang}.`,
      mcPrompt: `Tu es un tuteur de langues serviable qui enseigne ${targetLang}. Un eleve a mal repondu a une question a choix multiple.

Question : ${question}
Reponse de l'eleve : ${userAnswer}
Bonne reponse : ${correctAnswer}

IMPORTANT : Fournis ton explication en ${supportLang}.

Fournis une breve explication encourageante (2-3 phrases) qui :
1. Explique pourquoi son choix etait incorrect
2. Clarifie pourquoi la bonne reponse est correcte
3. Donne une astuce utile pour retenir la difference

Reste concis, bienveillant et centre sur l'apprentissage. Ecris toute ta reponse en ${supportLang}.`,
      maPrompt: `Tu es un tuteur de langues serviable qui enseigne ${targetLang}. Un eleve a mal repondu a une question a reponses multiples.

Question : ${question}
Reponses de l'eleve : ${userAnswer}
Bonnes reponses : ${correctAnswer}

IMPORTANT : Fournis ton explication en ${supportLang}.

Fournis une breve explication encourageante (2-3 phrases) qui :
1. Explique quelles reponses il a oubliees ou selectionnees par erreur
2. Clarifie pourquoi les bonnes reponses sont correctes
3. Donne une astuce utile pour identifier les bonnes reponses

Reste concis, bienveillant et centre sur l'apprentissage. Ecris toute ta reponse en ${supportLang}.`,
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
