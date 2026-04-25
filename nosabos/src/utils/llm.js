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
    ar: {
      fillPrompt: `أنت معلّم لغات مساعد وتعلّم ${targetLang}. أحد المتعلمين أجاب بشكل غير صحيح عن سؤال إكمال فراغ.

السؤال: ${question}
إجابة المتعلم: ${userAnswer}
الإجابة الصحيحة (أو التلميح): ${correctAnswer}

مهم: اكتب الشرح كله باللغة ${supportLang}.

قدّم شرحًا قصيرًا ومشجّعًا (2-3 جمل) يوضّح:
1. لماذا لا تناسب إجابته السؤال أو ما الذي أساء فهمه
2. ما الإجابة الصحيحة وما معناها
3. نصيحة مفيدة تساعده على تذكّرها

اجعل الرد مختصرًا، داعمًا، ومركّزًا على التعلّم. اكتب كل الرد باللغة ${supportLang}.`,
      mcPrompt: `أنت معلّم لغات مساعد وتعلّم ${targetLang}. أحد المتعلمين أجاب بشكل غير صحيح عن سؤال اختيار من متعدد.

السؤال: ${question}
إجابة المتعلم: ${userAnswer}
الإجابة الصحيحة: ${correctAnswer}

مهم: اكتب الشرح كله باللغة ${supportLang}.

قدّم شرحًا قصيرًا ومشجّعًا (2-3 جمل) يوضّح:
1. لماذا كان اختياره غير صحيح
2. لماذا الإجابة الصحيحة هي الأنسب
3. نصيحة مفيدة تساعده على تذكّر الفرق

اجعل الرد مختصرًا، داعمًا، ومركّزًا على التعلّم. اكتب كل الرد باللغة ${supportLang}.`,
      maPrompt: `أنت معلّم لغات مساعد وتعلّم ${targetLang}. أحد المتعلمين أجاب بشكل غير صحيح عن سؤال متعدد الإجابات.

السؤال: ${question}
إجابات المتعلم: ${userAnswer}
الإجابات الصحيحة: ${correctAnswer}

مهم: اكتب الشرح كله باللغة ${supportLang}.

قدّم شرحًا قصيرًا ومشجّعًا (2-3 جمل) يوضّح:
1. ما الإجابات التي فاتته أو اختارها بشكل غير صحيح
2. لماذا الإجابات الصحيحة صحيحة
3. نصيحة مفيدة تساعده على تمييز الإجابات الصحيحة

اجعل الرد مختصرًا، داعمًا، ومركّزًا على التعلّم. اكتب كل الرد باللغة ${supportLang}.`,
    },
    pt: {
      fillPrompt: `Voce e um tutor de idiomas prestativo que ensina ${targetLang}. Um aluno respondeu incorretamente a uma questao de preencher a lacuna.

Pergunta: ${question}
Resposta do aluno: ${userAnswer}
Resposta correta (ou dica): ${correctAnswer}

IMPORTANTE: Forneca sua explicacao em ${supportLang}.

Forneca uma explicacao breve e encorajadora (2-3 frases) que:
1. Explique por que a resposta nao se encaixa ou o que foi mal compreendido
2. Esclareca a resposta correta e o seu significado
3. Diga uma dica util para lembrar dela

Mantenha tudo conciso, acolhedor e focado no aprendizado. Escreva toda a resposta em ${supportLang}.`,
      mcPrompt: `Voce e um tutor de idiomas prestativo que ensina ${targetLang}. Um aluno respondeu incorretamente a uma questao de multipla escolha.

Pergunta: ${question}
Resposta do aluno: ${userAnswer}
Resposta correta: ${correctAnswer}

IMPORTANTE: Forneca sua explicacao em ${supportLang}.

Forneca uma explicacao breve e encorajadora (2-3 frases) que:
1. Explique por que a escolha foi incorreta
2. Esclareca por que a resposta correta esta certa
3. Diga uma dica util para lembrar a diferenca

Mantenha tudo conciso, acolhedor e focado no aprendizado. Escreva toda a resposta em ${supportLang}.`,
      maPrompt: `Voce e um tutor de idiomas prestativo que ensina ${targetLang}. Um aluno respondeu incorretamente a uma questao de multiplas respostas.

Pergunta: ${question}
Respostas do aluno: ${userAnswer}
Respostas corretas: ${correctAnswer}

IMPORTANTE: Forneca sua explicacao em ${supportLang}.

Forneca uma explicacao breve e encorajadora (2-3 frases) que:
1. Explique quais respostas faltaram ou foram escolhidas incorretamente
2. Esclareca por que as respostas corretas estao certas
3. Diga uma dica util para identificar as respostas corretas

Mantenha tudo conciso, acolhedor e focado no aprendizado. Escreva toda a resposta em ${supportLang}.`,
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
    hi: {
      fillPrompt: `आप ${targetLang} सिखाने वाले एक मददगार भाषा-शिक्षक हैं। एक छात्र ने रिक्त स्थान भरने वाले प्रश्न का उत्तर गलत दिया है।

प्रश्न: ${question}
छात्र का उत्तर: ${userAnswer}
सही उत्तर (या संकेत): ${correctAnswer}

महत्वपूर्ण: अपनी पूरी व्याख्या ${supportLang} में दें।

2-3 वाक्यों में एक छोटी, उत्साहवर्धक व्याख्या दें, जो:
1. बताए कि उनका उत्तर क्यों उपयुक्त नहीं है या उन्होंने क्या गलत समझा
2. सही उत्तर और उसका अर्थ स्पष्ट करे
3. उसे याद रखने के लिए एक उपयोगी सुझाव दे

व्याख्या संक्षिप्त, सहायक और सीखने पर केंद्रित रखें। पूरा उत्तर ${supportLang} में लिखें।`,
      mcPrompt: `आप ${targetLang} सिखाने वाले एक मददगार भाषा-शिक्षक हैं। एक छात्र ने बहुविकल्पीय प्रश्न का उत्तर गलत दिया है।

प्रश्न: ${question}
छात्र का उत्तर: ${userAnswer}
सही उत्तर: ${correctAnswer}

महत्वपूर्ण: अपनी पूरी व्याख्या ${supportLang} में दें।

2-3 वाक्यों में एक छोटी, उत्साहवर्धक व्याख्या दें, जो:
1. बताए कि उनकी पसंद गलत क्यों थी
2. स्पष्ट करे कि सही उत्तर सही क्यों है
3. अंतर याद रखने के लिए एक उपयोगी सुझाव दे

व्याख्या संक्षिप्त, सहायक और सीखने पर केंद्रित रखें। पूरा उत्तर ${supportLang} में लिखें।`,
      maPrompt: `आप ${targetLang} सिखाने वाले एक मददगार भाषा-शिक्षक हैं। एक छात्र ने बहु-उत्तर प्रश्न का उत्तर गलत दिया है।

प्रश्न: ${question}
छात्र के उत्तर: ${userAnswer}
सही उत्तर: ${correctAnswer}

महत्वपूर्ण: अपनी पूरी व्याख्या ${supportLang} में दें।

2-3 वाक्यों में एक छोटी, उत्साहवर्धक व्याख्या दें, जो:
1. बताए कि उन्होंने कौन से उत्तर छोड़ दिए या गलती से चुन लिए
2. स्पष्ट करे कि सही उत्तर सही क्यों हैं
3. सही उत्तर पहचानने के लिए एक उपयोगी सुझाव दे

व्याख्या संक्षिप्त, सहायक और सीखने पर केंद्रित रखें। पूरा उत्तर ${supportLang} में लिखें।`,
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
    zh: {
      fillPrompt: `你是一位乐于助人的语言导师，正在教授${targetLang}。学生在填空题中回答错误。

题目：${question}
学生答案：${userAnswer}
正确答案（或提示）：${correctAnswer}

重要：请用${supportLang}进行解释。

请给出简短、鼓励性的解释（2-3句），内容包括：
1. 说明这个答案为什么不合适，或学生误解了什么
2. 说明正确答案及其意思
3. 给一个有助于记忆的小建议

保持简洁、支持性强，并专注于学习。整段回复都用${supportLang}书写。`,
      mcPrompt: `你是一位乐于助人的语言导师，正在教授${targetLang}。学生在选择题中回答错误。

题目：${question}
学生答案：${userAnswer}
正确答案：${correctAnswer}

重要：请用${supportLang}进行解释。

请给出简短、鼓励性的解释（2-3句），内容包括：
1. 说明学生的选择为什么不正确
2. 说明为什么正确答案更合适
3. 给一个有助于记住差异的小建议

保持简洁、支持性强，并专注于学习。整段回复都用${supportLang}书写。`,
      maPrompt: `你是一位乐于助人的语言导师，正在教授${targetLang}。学生在多选题中回答错误。

题目：${question}
学生答案：${userAnswer}
正确答案：${correctAnswer}

重要：请用${supportLang}进行解释。

请给出简短、鼓励性的解释（2-3句），内容包括：
1. 说明漏选了哪些答案，或误选了哪些答案
2. 说明为什么正确答案是对的
3. 给一个有助于识别正确答案的小建议

保持简洁、支持性强，并专注于学习。整段回复都用${supportLang}书写。`,
    },
    ja: {
      fillPrompt: `あなたは${targetLang}を教える親切な語学チューターです。学習者が穴埋め問題に間違えて答えました。

問題: ${question}
学習者の答え: ${userAnswer}
正解（またはヒント）: ${correctAnswer}

重要: 説明は${supportLang}で書いてください。

短く励ましになる説明（2〜3文）で、次を含めてください。
1. その答えが合わない理由、または誤解している点
2. 正しい答えとその意味
3. 覚えるための役立つコツ

簡潔で前向きに、学習に集中してください。回答全体を${supportLang}で書いてください。`,
      mcPrompt: `あなたは${targetLang}を教える親切な語学チューターです。学習者が選択問題に間違えて答えました。

問題: ${question}
学習者の答え: ${userAnswer}
正解: ${correctAnswer}

重要: 説明は${supportLang}で書いてください。

短く励ましになる説明（2〜3文）で、次を含めてください。
1. その選択が間違いだった理由
2. 正解が正しい理由
3. 違いを覚えるための役立つコツ

簡潔で前向きに、学習に集中してください。回答全体を${supportLang}で書いてください。`,
      maPrompt: `あなたは${targetLang}を教える親切な語学チューターです。学習者が複数選択問題に間違えて答えました。

問題: ${question}
学習者の答え: ${userAnswer}
正解: ${correctAnswer}

重要: 説明は${supportLang}で書いてください。

短く励ましになる説明（2〜3文）で、次を含めてください。
1. 選び忘れた答え、または誤って選んだ答え
2. 正解が正しい理由
3. 正しい答えを見分けるための役立つコツ

簡潔で前向きに、学習に集中してください。回答全体を${supportLang}で書いてください。`,
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
