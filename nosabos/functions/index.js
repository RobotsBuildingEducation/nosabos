// functions/index.js
"use strict";

/**
 * Env file:
 *   functions/.env
 *   GEMINI_API_KEY=your_key_here
 *
 * Endpoints:
 *   POST /talkTurn  -> {
 *     audioBase64, mime, history,
 *     level, supportLang, challenge, redo,
 *     voice, voicePersona,
 *     targetLang                 // 'nah' | 'es'  (default 'nah')
 *   }
 *   POST /tts -> { text, voice }
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { GoogleGenAI } = require("@google/genai");

admin.initializeApp();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/* -------------------------
   Helpers
------------------------- */
function safeParseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {}
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (s !== -1 && e !== -1 && e > s) {
    try {
      return JSON.parse(text.slice(s, e + 1));
    } catch {}
  }
  return null;
}

function getAIOrThrow() {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is missing. Set it in functions/.env (GEMINI_API_KEY=...)"
    );
  }
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

/** TTS with graceful voice fallback (tries requested voice, then Puck) */
async function synthesize(ai, text, voiceName) {
  const tryOnce = async (name) => {
    const r = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ role: "user", parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: name } },
        },
      },
    });
    return (
      r?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData
        ?.data || null
    );
  };

  try {
    const data = await tryOnce(voiceName);
    if (data) return data;
  } catch (e) {
    console.error("TTS failed for voice", voiceName, e?.message || e);
  }

  if (voiceName !== "Puck") {
    try {
      const data = await tryOnce("Puck");
      if (data) return data;
    } catch (e) {
      console.error("TTS fallback to Puck failed", e?.message || e);
    }
  }
  throw new Error("TTS synthesis failed for all voices tried.");
}

/* -------------------------
   /talkTurn  (Trilingual: Náhuatl + ES + EN)
------------------------- */
exports.talkTurn = onRequest(
  {
    region: "us-central1",
    cors: true, // handles OPTIONS automatically
  },
  async (req, res) => {
    try {
      if (req.method === "OPTIONS") return res.status(204).end();
      if (req.method !== "POST") return res.status(405).send("POST only");

      const {
        audioBase64,
        mime = "audio/webm",
        history = [], // [{ target?, es?, en? }]
        level = "beginner", // beginner|intermediate|advanced
        supportLang = "en", // 'en'|'es'|'bilingual'
        challenge = {
          es: "Pide algo con cortesía.",
          en: "Make a polite request.",
        },
        redo = "",
        voice = "Leda",
        voicePersona = "Like a sarcastic, semi-friendly toxica.",
        targetLang = "nah", // 'nah' (Náhuatl) | 'es' (Spanish)
      } = req.body || {};

      if (!audioBase64)
        return res.status(400).json({ error: "audioBase64 required" });

      const ai = getAIOrThrow();

      const LANG_NAMES = {
        nah: "Náhuatl",
        es: "Spanish",
        en: "English",
      };
      const TARGET_NAME = LANG_NAMES[targetLang] || "Náhuatl";

      // System + output contract for a tri-lingual coaching loop
      const system =
        `You are a ${TARGET_NAME} practice partner for a learner app with an English/Spanish coach UI.\n` +
        `The user may speak in English or Spanish.\n` +
        `Your reply must be ONLY in ${TARGET_NAME}. Keep it short (≤ 24 words) and natural. Persona: ${String(
          voicePersona
        ).slice(
          0,
          160
        )} (playful, supportive; light sarcasm is fine; never cruel).\n\n` +
        `Return ONLY one JSON object (no backticks, no code fences) with this shape:\n` +
        `{\n` +
        `  "assistant": { "lang": "${targetLang}", "text": "<${TARGET_NAME} reply, ≤24 words>" },\n` +
        `  "coach": {\n` +
        `    "correction_en": "<one concise correction in English, quote the learner when useful>",\n` +
        `    "correction_es": "<one concise corrección en español>",\n` +
        `    "tip_en": "<≤14-word micro-tip in English>",\n` +
        `    "tip_es": "<≤14-word micro-consejo en español>",\n` +
        `    "redo_${targetLang}": "<very short redo prompt in ${TARGET_NAME}>",\n` +
        `    "vocab_${targetLang}": ["word1","word2","..."],\n` +
        `    "translation_en": "<English translation of assistant.text>",\n` +
        `    "translation_es": "<Spanish translation of assistant.text>",\n` +
        `    "alignment": {\n` +
        `      "${targetLang}_en": [{"t":"<${TARGET_NAME} phrase>","en":"<English phrase>"}],\n` +
        `      "${targetLang}_es": [{"t":"<${TARGET_NAME} phrase>","es":"<Spanish phrase>"}]\n` +
        `    },\n` +
        `    "scores": {"pronunciation":0-3,"grammar":0-3,"vocab":0-3,"fluency":0-3},\n` +
        `    "cefr": "A1|A2|B1|B2|C1",\n` +
        `    "goal_completed": true|false,\n` +
        `    "next_goal": { "${targetLang}":"...", "en":"...", "es":"..." }\n` +
        `  }\n` +
        `}\n\n` +
        `Coaching visibility:\n` +
        `- If supportLang='en', ensure English coaching fields are strong; Spanish ones may be terse.\n` +
        `- If supportLang='es', ensure Spanish coaching fields are strong; English ones may be terse.\n` +
        `- If supportLang='bilingual', keep both English and Spanish fields equally useful.\n` +
        `Style constraints:\n` +
        `- ${TARGET_NAME} must be contemporary and clear. For Náhuatl, prefer Central Mexican orthography and avoid extremely rare regional forms.`;

      const levelHint =
        level === "beginner"
          ? "Learner level: beginner. Simpler target language; clearer coaching."
          : level === "intermediate"
          ? "Learner level: intermediate. Natural target language; concise coaching."
          : "Learner level: advanced. Native-level target language; terse coaching.";

      const supportHint =
        supportLang === "en"
          ? "Support language: English-only coaching emphasis."
          : supportLang === "bilingual"
          ? "Support language: bilingual coaching (English + Spanish)."
          : "Support language: Spanish-only coaching emphasis.";

      const challengeHint = `Current goal: ES="${challenge.es}" | EN="${challenge.en}".`;
      const redoHint = redo ? `User wants to retry: "${redo}".` : "";

      // Keep last few target-language turns for context if provided
      const contextTurns = (history || []).slice(-3).map((m) => ({
        role: "model",
        parts: [{ text: m?.target || m?.es || m?.en || "" }],
      }));

      const contents = [
        { role: "user", parts: [{ text: system }] },
        {
          role: "user",
          parts: [
            {
              text:
                `Target language: ${TARGET_NAME} (${targetLang}). ` +
                `${levelHint} ${supportHint} ${challengeHint} ${redoHint}`,
            },
          ],
        },
        ...contextTurns,
        {
          role: "user",
          parts: [{ inlineData: { data: audioBase64, mimeType: mime } }],
        },
      ];

      // Generate JSON response
      const chatResp = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents,
        generationConfig: { maxOutputTokens: 240, temperature: 0.6 },
      });

      const raw =
        chatResp?.text?.trim() ||
        (chatResp?.candidates?.[0]?.content?.parts || [])
          .map((p) => p.text)
          .filter(Boolean)
          .join("\n") ||
        "";

      const parsed = safeParseJson(raw);
      if (!parsed) throw new Error("Model response was not valid JSON.");

      // Normalize shape a bit and stay backward friendly where possible
      const assistant = parsed.assistant || {
        lang: targetLang,
        text:
          parsed[`assistant_${targetLang}`] ||
          parsed.assistant_text ||
          parsed.assistant_es ||
          "",
      };
      const coach = parsed.coach || null;

      // TTS for the assistant text (same voices; will attempt to read Náhuatl too)
      const audioBase64Out = assistant?.text
        ? await synthesize(ai, assistant.text, voice)
        : null;

      return res.json({
        assistant, // { lang, text }
        coach, // includes translations/alignment
        audioBase64: audioBase64Out,

        // legacy fields (in case older clients still read them)
        assistant_es: targetLang === "es" ? assistant.text : undefined,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: String(e?.message || e) });
    }
  }
);

/* -------------------------
   /tts
------------------------- */
exports.tts = onRequest(
  {
    region: "us-central1",
    cors: true,
  },
  async (req, res) => {
    try {
      if (req.method === "OPTIONS") return res.status(204).end();
      if (req.method !== "POST") return res.status(405).send("POST only");

      const { text, voice = "Leda" } = req.body || {};
      if (!text) return res.status(400).json({ error: "text required" });

      const ai = getAIOrThrow();
      const audioBase64 = await synthesize(ai, text, voice);

      return res.json({ audioBase64 });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: String(e?.message || e) });
    }
  }
);
