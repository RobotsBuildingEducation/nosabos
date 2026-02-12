import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Box,
  Button,
  Center,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  HStack,
  Progress,
  Text,
  VStack,
  Badge,
  Spinner,
  Divider,
} from "@chakra-ui/react";
import { PiMicrophoneStageDuotone } from "react-icons/pi";
import { FaStop } from "react-icons/fa";
import { RiVolumeUpLine } from "react-icons/ri";
import { LuBadgeCheck } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { database } from "../firebaseResources/firebaseResources";

import useUserStore from "../hooks/useUserStore";
import RobotBuddyPro from "./RobotBuddyPro";
import { translations } from "../utils/translation";
import { WaveBar } from "./WaveBar";
import { DEFAULT_TTS_VOICE, getRandomVoice } from "../utils/tts";
import useSoundSettings from "../hooks/useSoundSettings";
import submitActionSound from "../assets/submitaction.mp3";
import completeSound from "../assets/complete.mp3";

const REALTIME_MODEL =
  (import.meta.env.VITE_REALTIME_MODEL || "gpt-realtime-mini") + "";

const REALTIME_URL = `${
  import.meta.env.VITE_REALTIME_URL
}?model=gpt-realtime-mini/exchangeRealtimeSDP?model=${encodeURIComponent(
  REALTIME_MODEL
)}`;

const RESPONSES_URL = `${import.meta.env.VITE_RESPONSES_URL}/proxyResponses`;
const TRANSLATE_MODEL =
  import.meta.env.VITE_OPENAI_TRANSLATE_MODEL || "gpt-5-nano";

const MAX_EXCHANGES = 5;

const CEFR_LEVELS = ["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2"];

const CEFR_LEVEL_INFO = {
  "Pre-A1": {
    name: { en: "Ultimate Beginner", es: "Principiante Total" },
    color: "#8B5CF6",
  },
  A1: { name: { en: "Beginner", es: "Principiante" }, color: "#3B82F6" },
  A2: { name: { en: "Elementary", es: "Elemental" }, color: "#8B5CF6" },
  B1: { name: { en: "Intermediate", es: "Intermedio" }, color: "#A855F7" },
  B2: {
    name: { en: "Upper Intermediate", es: "Intermedio Alto" },
    color: "#F97316",
  },
  C1: { name: { en: "Advanced", es: "Avanzado" }, color: "#EF4444" },
  C2: { name: { en: "Mastery", es: "Maestría" }, color: "#EC4899" },
};

const ASSESSMENT_CRITERIA = [
  { key: "pronunciation", en: "Pronunciation", es: "Pronunciación" },
  { key: "grammar", en: "Grammar", es: "Gramática" },
  { key: "vocabulary", en: "Vocabulary", es: "Vocabulario" },
  { key: "fluency", en: "Fluency", es: "Fluidez" },
  { key: "confidence", en: "Confidence", es: "Confianza" },
  { key: "comprehension", en: "Comprehension", es: "Comprensión" },
];

function scoreColor(score) {
  if (score >= 8) return "green";
  if (score >= 6) return "teal";
  if (score >= 4) return "yellow";
  return "red";
}

/* ---- helpers ---- */
const uid = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

function strongNpub(user) {
  return (
    user?.id ||
    user?.local_npub ||
    localStorage.getItem("local_npub") ||
    ""
  ).trim();
}

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

/* ---- Bubble components ---- */
function UserBubble({ label, text }) {
  if (!text) return null;
  return (
    <Box
      bg="cyan.800"
      p={3}
      rounded="2xl"
      border="1px solid rgba(255,255,255,0.06)"
      maxW="100%"
      borderBottomRightRadius="0px"
    >
      <Text fontSize="2xs" opacity={0.6} mb={1}>
        {label}
      </Text>
      <Text
        fontSize="sm"
        sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      >
        {text}
      </Text>
    </Box>
  );
}

function AssistantBubble({ label, text }) {
  if (!text) return null;
  return (
    <Box
      bg="gray.700"
      p={3}
      rounded="2xl"
      border="1px solid rgba(255,255,255,0.06)"
      maxW="100%"
      borderBottomLeftRadius="0px"
    >
      <Text fontSize="2xs" opacity={0.6} mb={1}>
        {label}
      </Text>
      <Text
        fontSize="sm"
        sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      >
        {text}
      </Text>
    </Box>
  );
}

function RowLeft({ children }) {
  return (
    <HStack justify="flex-start" w="100%">
      <Box maxW="85%">{children}</Box>
    </HStack>
  );
}

function RowRight({ children }) {
  return (
    <HStack justify="flex-end" w="100%">
      <Box maxW="85%">{children}</Box>
    </HStack>
  );
}

export default function ProficiencyTest() {
  const navigate = useNavigate();
  const playSound = useSoundSettings((s) => s.playSound);
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const patchUser = useUserStore((s) => s.patchUser);
  const currentNpub = strongNpub(user);

  const aliveRef = useRef(false);

  // Derive settings from user
  const targetLang = user?.progress?.targetLang || "es";
  const supportLang = user?.progress?.supportLang || "en";
  const voicePersona = user?.progress?.voicePersona || "";
  const pauseMs = user?.progress?.pauseMs || 800;

  const isEs = supportLang === "es";
  const ui = translations[isEs ? "es" : "en"];

  // Realtime refs
  const audioRef = useRef(null);
  const pcRef = useRef(null);
  const localRef = useRef(null);
  const dcRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const floatBufRef = useRef(null);
  const captureOutRef = useRef(null);
  const audioGraphReadyRef = useRef(false);

  // Connection/UI state
  const [status, setStatus] = useState("disconnected");
  const [err, setErr] = useState("");
  const [uiState, setUiState] = useState("idle");
  const [mood, setMood] = useState("neutral");

  // Messages
  const messagesRef = useRef([]);
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const respToMsg = useRef(new Map());
  const streamBuffersRef = useRef(new Map());
  const streamFlushTimerRef = useRef(null);
  const lastTranscriptRef = useRef({ text: "", ts: 0 });

  // Idle gating
  const isIdleRef = useRef(true);

  // Guardrails
  const guardrailItemIdsRef = useRef([]);
  const pendingGuardrailTextRef = useRef("");

  // Count user exchanges (user messages count)
  const userMessageCount = useMemo(
    () => messages.filter((m) => m.role === "user").length,
    [messages]
  );

  // Result drawer
  const [showResult, setShowResult] = useState(false);
  const [assessedLevel, setAssessedLevel] = useState(null);
  const [assessmentSummary, setAssessmentSummary] = useState("");
  const [assessmentScores, setAssessmentScores] = useState(null);
  const assessmentDoneRef = useRef(false);

  // Progress bar
  const progressPct = Math.min(100, (userMessageCount / MAX_EXCHANGES) * 100);

  function pushMessage(m) {
    setMessages((p) => {
      if (p.some((existing) => existing.id === m.id)) return p;
      return [...p, m];
    });
  }
  function updateMessage(id, updater) {
    setMessages((p) => p.map((m) => (m.id === id ? updater(m) : m)));
  }

  function scheduleStreamFlush() {
    if (streamFlushTimerRef.current) return;
    streamFlushTimerRef.current = setTimeout(() => {
      const buffers = streamBuffersRef.current;
      buffers.forEach((buf, mid) => {
        if (!buf) return;
        updateMessage(mid, (m) => ({
          ...m,
          textStream: (m.textStream || "") + buf,
        }));
      });
      streamBuffersRef.current = new Map();
      streamFlushTimerRef.current = null;
    }, 50);
  }

  function ensureMessageForResponse(rid) {
    let mid = respToMsg.current.get(rid);
    if (!mid) {
      mid = uid();
      respToMsg.current.set(rid, mid);
    }
    const exists = messagesRef.current.some((m) => m.id === mid);
    if (!exists) {
      pushMessage({
        id: mid,
        role: "assistant",
        lang: targetLang,
        textFinal: "",
        textStream: "",
        done: false,
        ts: Date.now(),
      });
    }
    return mid;
  }

  /* ---- Build proficiency assessment instructions ---- */
  function buildProficiencyInstructions() {
    const langName = {
      es: "Spanish",
      pt: "Portuguese",
      fr: "French",
      it: "Italian",
      nl: "Dutch",
      ja: "Japanese",
      ru: "Russian",
      de: "German",
      el: "Greek",
      pl: "Polish",
      ga: "Irish",
      nah: "Eastern Huasteca Nahuatl",
      yua: "Yucatec Maya",
      en: "English",
    }[targetLang] || "Spanish";

    const strict = {
      es: "Responde ÚNICAMENTE en español.",
      pt: "Responda APENAS em português brasileiro.",
      fr: "Réponds UNIQUEMENT en français.",
      it: "Rispondi SOLO in italiano.",
      nl: "Antwoord ALLEEN in het Nederlands.",
      ja: "日本語のみで応答してください。",
      ru: "Отвечайте ТОЛЬКО на русском языке.",
      de: "Antworten Sie NUR auf Deutsch.",
      el: "Απαντήστε ΜΟΝΟ στα ελληνικά.",
      pl: "Odpowiadaj TYLKO po polsku.",
      ga: "Freagair i nGaeilge AMHÁIN.",
      nah: "T'aanen tu'ux maaya t'aan.",
      yua: "Respond ONLY in Yucatec Maya.",
      en: "Respond ONLY in English.",
    }[targetLang] || "Respond ONLY in the target language.";

    return [
      `You are a ${langName} proficiency assessor conducting a placement test.`,
      strict,
      "Your task is to have a natural conversation that progressively tests the user's language ability.",
      "Start with very simple topics (greetings, basic questions) and gradually increase complexity.",
      `CONVERSATION FLOW across ${MAX_EXCHANGES} exchanges:`,
      "Exchange 1: Basic greeting, simple question (name, how are you). Pre-A1/A1 level.",
      "Exchange 2: Daily routines, likes/dislikes. A1/A2 level.",
      "Exchange 3: Past events or future plans, opinions. A2/B1 level.",
      "Exchange 4: Abstract topics, hypothetical situations. B1/B2 level.",
      "Exchange 5: Complex discussion, nuanced expression. C1/C2 level.",
      "Keep your replies brief (≤20 words). Ask ONE question per turn to prompt the user.",
      "Adapt based on their responses — if they struggle, stay at that level longer.",
      "Be encouraging but accurate in your assessment.",
      `PERSONA: ${voicePersona || "patient, encouraging, and conversational"}.`,
    ]
      .filter(Boolean)
      .join(" ");
  }

  /* ---- Event handling ---- */
  function extractTextFromItem(item) {
    const parts = Array.isArray(item?.content) ? item.content : [];
    return parts
      .map((p) => (typeof p?.text === "string" ? p.text : ""))
      .filter(Boolean)
      .join(" ")
      .trim();
  }

  async function handleRealtimeEvent(evt) {
    if (!aliveRef.current) return;
    let data;
    try {
      data = JSON.parse(evt.data);
    } catch {
      return;
    }
    const t = data?.type;
    const rid = data?.response_id || data?.response?.id || data?.id || null;

    if (t === "conversation.item.created" && data?.item) {
      if (data.item?.role === "system") {
        const text = extractTextFromItem(data.item);
        if (
          text &&
          pendingGuardrailTextRef.current &&
          text === pendingGuardrailTextRef.current
        ) {
          guardrailItemIdsRef.current.push(data.item.id);
          pendingGuardrailTextRef.current = "";
        }
      }
      return;
    }

    // --- Ported from RealTimeTest / Conversations (proven pattern) ---

    if (t === "response.created") {
      isIdleRef.current = false;
      const mid = uid();
      respToMsg.current.set(rid, mid);
      setUiState("speaking");
      setMood("happy");
      return;
    }

    if (
      (t === "conversation.item.input_audio_transcription.completed" ||
        t === "input_audio_transcription.completed") &&
      data?.transcript
    ) {
      const text = (data.transcript || "").trim();
      if (text) {
        const now = Date.now();
        if (
          text === lastTranscriptRef.current.text &&
          now - lastTranscriptRef.current.ts < 2000
        ) {
          return;
        }
        lastTranscriptRef.current = { text, ts: now };
        const msgs = messagesRef.current;
        const recentAi = msgs
          .filter((m) => m.role === "assistant")
          .sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
        const userTs = recentAi?.ts ? recentAi.ts - 1 : now;
        pushMessage({
          id: uid(),
          role: "user",
          lang: "en",
          textFinal: text,
          textStream: "",
          done: true,
          ts: userTs,
        });
      }
      return;
    }

    if (
      (t === "response.audio_transcript.delta" ||
        t === "response.output_text.delta" ||
        t === "response.text.delta") &&
      typeof data?.delta === "string"
    ) {
      const mid = ensureMessageForResponse(rid);
      const prev = streamBuffersRef.current.get(mid) || "";
      streamBuffersRef.current.set(mid, prev + data.delta);
      scheduleStreamFlush();
      return;
    }

    if (
      (t === "response.audio_transcript.done" ||
        t === "response.output_text.done" ||
        t === "response.text.done") &&
      typeof data?.text === "string"
    ) {
      const mid = ensureMessageForResponse(rid);
      const buf = streamBuffersRef.current.get(mid) || "";
      if (buf) {
        streamBuffersRef.current.set(mid, "");
        updateMessage(mid, (m) => ({
          ...m,
          textStream: (m.textStream || "") + buf,
        }));
      }
      updateMessage(mid, (m) => ({
        ...m,
        textFinal: ((m.textFinal || "").trim() + " " + data.text).trim(),
        textStream: "",
      }));
      return;
    }

    if (
      t === "response.completed" ||
      t === "response.done" ||
      t === "response.canceled"
    ) {
      isIdleRef.current = true;
      const mid = rid && respToMsg.current.get(rid);
      if (mid) {
        const buf = streamBuffersRef.current.get(mid) || "";
        if (buf) {
          streamBuffersRef.current.set(mid, "");
          updateMessage(mid, (m) => ({
            ...m,
            textStream: "",
            textFinal: ((m.textFinal || "") + " " + buf).trim(),
          }));
        }
        updateMessage(mid, (m) => ({ ...m, done: true }));
        respToMsg.current.delete(rid);
      }
      setUiState("idle");
      setMood("neutral");
      return;
    }

    if (t === "input_audio_buffer.speech_started") {
      setUiState("listening");
      setMood("listening");
      return;
    }

    if (t === "input_audio_buffer.speech_stopped") {
      setUiState("thinking");
      setMood("thinking");
      return;
    }

    if (t === "error" && data?.error?.message) {
      const msg = data.error.message || "";
      if (/Cancellation failed/i.test(msg) || /no active response/i.test(msg))
        return;
      setErr((p) => p || msg);
    }
  }

  /* ---- Check if assessment should trigger ---- */
  useEffect(() => {
    if (userMessageCount >= MAX_EXCHANGES && !assessmentDoneRef.current) {
      assessmentDoneRef.current = true;
      // Stop the session and run assessment
      stop();
      runAssessment();
    }
  }, [userMessageCount]);

  async function runAssessment() {
    // Collect the full conversation for analysis
    const sorted = [...messagesRef.current].sort(
      (a, b) => (a.ts || 0) - (b.ts || 0)
    );
    const transcript = sorted
      .map((m) => {
        const role = m.role === "user" ? "User" : "AI";
        const text = m.textFinal || m.textStream || "";
        return `${role}: ${text}`;
      })
      .filter((line) => line.includes(": ") && line.split(": ")[1].trim())
      .join("\n");

    const langName = {
      es: "Spanish", pt: "Portuguese", fr: "French", it: "Italian",
      nl: "Dutch", ja: "Japanese", ru: "Russian", de: "German",
      el: "Greek", pl: "Polish", ga: "Irish", nah: "Nahuatl",
      yua: "Yucatec Maya", en: "English",
    }[targetLang] || "the target language";

    const prompt = `You are a CEFR language proficiency assessor. You just conducted a ${langName} placement test conversation with a learner.

Analyze the learner's responses throughout the conversation below. For EACH of the 6 criteria, you MUST provide:
- A specific score from 1 to 10
- A detailed 1-2 sentence note explaining WHY you gave that score, citing specific words, phrases, or moments from their speech

CRITERIA TO EVALUATE:
1. pronunciation — How clearly and accurately they pronounced words. Reference specific words they struggled with or pronounced well based on the transcription.
2. grammar — Complexity and correctness of grammatical structures used. Note specific errors (e.g., wrong conjugation, missing articles) or impressive structures (e.g., subjunctive, compound tenses).
3. vocabulary — Range and appropriateness of word choices. Note if they used only basic words or demonstrated advanced/varied vocabulary.
4. fluency — How naturally the conversation flowed. Note if responses were choppy/minimal or if they formed complete, flowing sentences.
5. confidence — Willingness to attempt complex expressions vs. playing it safe with simple responses. Note specific moments where they took risks or held back.
6. comprehension — How well they understood questions and responded appropriately. Note if they missed context, asked for clarification, or answered off-topic.

Based on the combined scores, determine the overall CEFR level placement.

IMPORTANT: You MUST return ONLY valid JSON with NO markdown formatting, NO backticks, NO explanation outside the JSON.

Required JSON format:
{"level":"B1","summary":"2-3 sentence overall assessment referencing what the learner did well and what they need to work on.","scores":{"pronunciation":{"score":7,"note":"Specific observation with examples from the conversation"},"grammar":{"score":6,"note":"Specific observation with examples from the conversation"},"vocabulary":{"score":5,"note":"Specific observation with examples from the conversation"},"fluency":{"score":7,"note":"Specific observation with examples from the conversation"},"confidence":{"score":8,"note":"Specific observation with examples from the conversation"},"comprehension":{"score":6,"note":"Specific observation with examples from the conversation"}}}

Valid levels: Pre-A1, A1, A2, B1, B2, C1, C2
Scores must be integers from 1 to 10.

Conversation transcript:
${transcript}`;

    try {
      const r = await fetch(RESPONSES_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          model: TRANSLATE_MODEL,
          text: { format: { type: "text" } },
          input: prompt,
        }),
      });

      const ct = r.headers.get("content-type") || "";
      const payload = ct.includes("application/json")
        ? await r.json()
        : await r.text();

      let resultText = "";
      if (typeof payload === "string") {
        resultText = payload;
      } else if (payload?.output) {
        const textParts = payload.output.filter((o) => o.type === "message");
        for (const msg of textParts) {
          for (const c of msg.content || []) {
            if (c.text) resultText += c.text;
          }
        }
      }

      const parsed = safeParseJson(resultText);
      if (parsed?.level && CEFR_LEVELS.includes(parsed.level)) {
        setAssessedLevel(parsed.level);
        setAssessmentSummary(parsed.summary || "");
        if (parsed.scores && typeof parsed.scores === "object") {
          setAssessmentScores(parsed.scores);
        }
      } else {
        // Try to extract level from text
        const levelMatch = resultText?.match?.(
          /\b(Pre-A1|A1|A2|B1|B2|C1|C2)\b/
        );
        setAssessedLevel(levelMatch?.[1] || "A1");
        setAssessmentSummary(
          parsed?.summary ||
            (isEs
              ? "Evaluación completada. Revisa tus resultados abajo."
              : "Assessment complete. Review your results below.")
        );
      }
    } catch (e) {
      console.error("Assessment failed:", e);
      setAssessedLevel("A1");
      setAssessmentSummary(
        isEs
          ? "Error en la evaluación. Te colocamos en A1."
          : "Assessment error. Placing you at A1."
      );
    }

    playSound(completeSound);
    setShowResult(true);
  }

  /* ---- Unlock levels and return to app ---- */
  const handleReturnToApp = useCallback(async () => {
    if (!currentNpub || !assessedLevel) {
      navigate("/");
      return;
    }

    try {
      // Mark all levels up to the assessed level as unlocked
      // by setting the user's proficiency placement level
      const levelIndex = CEFR_LEVELS.indexOf(assessedLevel);

      await setDoc(
        doc(database, "users", currentNpub),
        {
          proficiencyPlacement: assessedLevel,
          proficiencyPlacementAt: new Date().toISOString(),
          activeLessonLevel: assessedLevel,
          activeFlashcardLevel: assessedLevel,
          progress: {
            level: assessedLevel,
          },
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Update local user state
      patchUser({
        proficiencyPlacement: assessedLevel,
        activeLessonLevel: assessedLevel,
        activeFlashcardLevel: assessedLevel,
        progress: {
          ...(user?.progress || {}),
          level: assessedLevel,
        },
      });
    } catch (e) {
      console.error("Failed to save proficiency placement:", e);
    }

    navigate("/");
  }, [currentNpub, assessedLevel, navigate, patchUser, user?.progress]);

  /* ---- Connect / Disconnect ---- */
  async function start() {
    playSound(submitActionSound);
    setErr("");
    setMessages([]);
    respToMsg.current.clear();
    guardrailItemIdsRef.current = [];
    pendingGuardrailTextRef.current = "";
    assessmentDoneRef.current = false;
    setShowResult(false);
    setAssessedLevel(null);
    setAssessmentSummary("");
    setAssessmentScores(null);
    streamBuffersRef.current = new Map();
    if (streamFlushTimerRef.current) {
      clearTimeout(streamFlushTimerRef.current);
      streamFlushTimerRef.current = null;
    }
    setStatus("connecting");
    setUiState("idle");

    try {
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const remote = new MediaStream();
      if (audioRef.current) {
        audioRef.current.srcObject = remote;
        audioRef.current.autoplay = true;
        audioRef.current.playsInline = true;
      }
      pc.ontrack = (e) => {
        e.streams[0].getTracks().forEach((t) => remote.addTrack(t));
        if (!audioGraphReadyRef.current) {
          try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            const ctx = new Ctx();
            const srcNode = ctx.createMediaStreamSource(remote);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.15;
            const dest = ctx.createMediaStreamDestination();
            srcNode.connect(analyser);
            srcNode.connect(dest);
            audioCtxRef.current = ctx;
            analyserRef.current = analyser;
            floatBufRef.current = new Float32Array(analyser.fftSize);
            captureOutRef.current = dest.stream;
            audioGraphReadyRef.current = true;
          } catch (e) {
            console.warn("AudioContext init failed:", e?.message || e);
          }
        }
      };
      pc.addTransceiver("audio", { direction: "recvonly" });

      const local = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      localRef.current = local;
      local.getTracks().forEach((track) => pc.addTrack(track, local));

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        const voiceName = getRandomVoice();
        const instructions = buildProficiencyInstructions();
        const sttLang =
          targetLang === "es" ? "es" : targetLang === "en" ? "en" : undefined;

        dc.send(
          JSON.stringify({
            type: "session.update",
            session: {
              instructions,
              modalities: ["audio", "text"],
              voice: voiceName,
              turn_detection: {
                type: "server_vad",
                silence_duration_ms: pauseMs,
                threshold: 0.35,
                prefix_padding_ms: 120,
              },
              input_audio_transcription: sttLang
                ? { model: "whisper-1", language: sttLang }
                : { model: "whisper-1" },
              output_audio_format: "pcm16",
            },
          })
        );

        pendingGuardrailTextRef.current = instructions;
        dc.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "message",
              role: "system",
              content: [{ type: "input_text", text: instructions }],
            },
          })
        );
      };

      dc.onmessage = handleRealtimeEvent;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const resp = await fetch(REALTIME_URL, {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: offer.sdp,
      });
      const answer = await resp.text();
      if (!resp.ok) throw new Error(`SDP exchange failed: HTTP ${resp.status}`);
      await pc.setRemoteDescription({ type: "answer", sdp: answer });

      setStatus("connected");
      aliveRef.current = true;
      setUiState("idle");
    } catch (e) {
      setStatus("disconnected");
      setUiState("idle");
      setErr(e?.message || String(e));
    }
  }

  function stop() {
    aliveRef.current = false;
    try {
      if (dcRef.current?.readyState === "open") {
        try {
          dcRef.current.send(JSON.stringify({ type: "response.cancel" }));
        } catch {}
        dcRef.current.send(
          JSON.stringify({ type: "input_audio_buffer.clear" })
        );
        dcRef.current.send(
          JSON.stringify({
            type: "session.update",
            session: { turn_detection: null },
          })
        );
      }
    } catch {}
    try {
      const a = audioRef.current;
      if (a) {
        try { a.pause(); } catch {}
        const s = a.srcObject;
        if (s) {
          try { s.getTracks().forEach((t) => t.stop()); } catch {}
        }
        a.srcObject = null;
      }
    } catch {}
    try {
      localRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    try {
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;
    dcRef.current = null;
    localRef.current = null;
    audioGraphReadyRef.current = false;
    setStatus("disconnected");
    setUiState("idle");
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      aliveRef.current = false;
      if (streamFlushTimerRef.current) clearTimeout(streamFlushTimerRef.current);
      try { localRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
      try { pcRef.current?.close(); } catch {}
    };
  }, []);

  /* ---- Timeline (deduplicated) ---- */
  const timeline = useMemo(() => {
    const sorted = [...messages].sort((a, b) => (b?.ts || 0) - (a?.ts || 0));
    // Deduplicate assistant messages with identical text
    const seenAssistantText = new Set();
    return sorted.filter((m) => {
      if (m.role !== "assistant") return true;
      const text = ((m.textFinal || "") + (m.textStream || "")).trim();
      if (!text) return false;
      if (seenAssistantText.has(text)) return false;
      seenAssistantText.add(text);
      return true;
    });
  }, [messages]);

  /* ---- Render ---- */
  const levelInfo = assessedLevel ? CEFR_LEVEL_INFO[assessedLevel] : null;

  return (
    <>
      <Box
        minH="100vh"
        bg="gray.900"
        color="gray.100"
        position="relative"
        pb="140px"
      >
        {/* Header */}
        <Box
          bgGradient="linear(to-r, purple.700, cyan.600)"
          px={4}
          py={4}
        >
          <VStack spacing={2} align="center">
            <Text fontSize="lg" fontWeight="bold" color="white">
              {isEs ? "Prueba de Nivel" : "Proficiency Test"}
            </Text>
            <Text fontSize="sm" color="whiteAlpha.800">
              {isEs
                ? `Intercambio ${Math.min(userMessageCount, MAX_EXCHANGES)} de ${MAX_EXCHANGES}`
                : `Exchange ${Math.min(userMessageCount, MAX_EXCHANGES)} of ${MAX_EXCHANGES}`}
            </Text>
          </VStack>
        </Box>

        {/* Progress + Robot */}
        <Box px={4} mt={3} display="flex" justifyContent="center">
          <Box
            bg="gray.800"
            p={3}
            rounded="2xl"
            border="1px solid rgba(255,255,255,0.06)"
            width="100%"
            maxWidth="400px"
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              top={3}
              left={3}
              width="72px"
              opacity={0.95}
            >
              <RobotBuddyPro
                state={uiState}
                loudness={0}
                mood={mood}
                variant="abstract"
                maxW={72}
              />
            </Box>

            <VStack
              align="flex-start"
              spacing={2}
              width="100%"
              pl={{ base: "78px", sm: "82px" }}
              pt={{ base: 1, sm: 0 }}
            >
              <Box w="100%">
                <HStack justify="space-between" align="center" mb={1}>
                  <HStack spacing={2} align="center" flex="1">
                    <Badge
                      colorScheme="purple"
                      variant="subtle"
                      fontSize="10px"
                    >
                      {isEs ? "Evaluación" : "Assessment"}
                    </Badge>
                    <Text fontSize="xs" opacity={0.9} color="white" flex="1">
                      {isEs
                        ? "Habla naturalmente — estamos evaluando tu nivel"
                        : "Speak naturally — we're assessing your level"}
                    </Text>
                  </HStack>
                </HStack>

                <Box mt={3}>
                  <HStack justifyContent="space-between" mb={1}>
                    <Badge
                      colorScheme="cyan"
                      variant="subtle"
                      fontSize="10px"
                    >
                      {isEs ? "Progreso" : "Progress"}
                    </Badge>
                    <Badge
                      colorScheme="teal"
                      variant="subtle"
                      fontSize="10px"
                    >
                      {Math.min(userMessageCount, MAX_EXCHANGES)}/{MAX_EXCHANGES}
                    </Badge>
                  </HStack>
                  <WaveBar value={progressPct} />
                </Box>
              </Box>
            </VStack>
          </Box>
        </Box>

        {/* Timeline — newest first */}
        <VStack align="stretch" spacing={3} px={4} mt={3}>
          {timeline.map((m) => {
            const isUser = m.role === "user";
            if (isUser) {
              return (
                <RowRight key={m.id}>
                  <UserBubble
                    label={isEs ? "Tú" : "You"}
                    text={m.textFinal}
                  />
                </RowRight>
              );
            }

            const text = (m.textFinal || "") + (m.textStream || "");
            if (!text.trim()) return null;
            return (
              <RowLeft key={m.id}>
                <AssistantBubble
                  label={isEs ? "Evaluador" : "Assessor"}
                  text={text}
                />
              </RowLeft>
            );
          })}
        </VStack>

        {/* Bottom dock */}
        <Center
          position="fixed"
          bottom="22px"
          left="0"
          right="0"
          zIndex={30}
          px={4}
        >
          <HStack spacing={3} w="100%" maxW="560px" justify="center">
            <Button
              onClick={status === "connected" ? stop : start}
              size="lg"
              height="64px"
              px={{ base: 8, md: 12 }}
              rounded="full"
              colorScheme={status === "connected" ? "red" : "cyan"}
              color="white"
              textShadow="0px 0px 20px black"
              mb={20}
              isDisabled={userMessageCount >= MAX_EXCHANGES}
            >
              {status === "connected" ? (
                <>
                  <FaStop /> &nbsp;{" "}
                  {isEs ? "Detener" : "Stop"}
                </>
              ) : (
                <>
                  <PiMicrophoneStageDuotone /> &nbsp;{" "}
                  {status === "connecting"
                    ? isEs
                      ? "Conectando..."
                      : "Connecting..."
                    : isEs
                    ? "Comenzar"
                    : "Start"}
                </>
              )}
            </Button>
          </HStack>
        </Center>

        {err && (
          <Box px={4} pt={2}>
            <Box
              as="pre"
              bg="rgba(255,255,255,0.06)"
              border="1px solid rgba(255,255,255,0.12)"
              p={3}
              borderRadius={8}
              whiteSpace="pre-wrap"
              color="#fee2e2"
            >
              {err}
            </Box>
          </Box>
        )}

        {/* Remote live audio sink */}
        <audio ref={audioRef} />
      </Box>

      {/* ---- Result Drawer ---- */}
      <Drawer
        isOpen={showResult}
        placement="bottom"
        onClose={() => {}}
        closeOnOverlayClick={false}
        closeOnEsc={false}
      >
        <DrawerOverlay bg="blackAlpha.700" backdropFilter="blur(6px)" />
        <DrawerContent
          bg="gray.900"
          color="gray.100"
          borderTopRadius="24px"
          maxH="92vh"
          display="flex"
          flexDirection="column"
          sx={{
            "@supports (height: 100dvh)": {
              maxHeight: "92dvh",
            },
          }}
        >
          {/* Gradient header with level badge */}
          <Box
            bgGradient={
              levelInfo
                ? `linear(to-r, ${levelInfo.color}, purple.500)`
                : "linear(to-r, cyan.500, purple.500)"
            }
            px={6}
            py={6}
            borderTopRadius="24px"
            flexShrink={0}
          >
            <VStack spacing={3} align="center">
              <Box bg="whiteAlpha.200" p={3} rounded="full">
                <Box as={LuBadgeCheck} fontSize="36px" color="white" />
              </Box>
              <Text
                fontSize="xl"
                fontWeight="bold"
                color="white"
                textAlign="center"
              >
                {isEs ? "Evaluación Completa" : "Assessment Complete"}
              </Text>
              {assessedLevel && (
                <Badge
                  colorScheme="whiteAlpha"
                  bg="whiteAlpha.300"
                  color="white"
                  fontSize="lg"
                  px={5}
                  py={1.5}
                  rounded="full"
                  fontWeight="bold"
                >
                  {assessedLevel} —{" "}
                  {levelInfo?.name?.[isEs ? "es" : "en"] || assessedLevel}
                </Badge>
              )}
            </VStack>
          </Box>

          <DrawerBody px={{ base: 4, md: 6 }} py={5} overflowY="auto">
            <VStack spacing={5} align="stretch">
              {/* Summary */}
              {assessmentSummary && (
                <Text
                  fontSize="md"
                  opacity={0.9}
                  textAlign="center"
                  lineHeight="1.7"
                >
                  {assessmentSummary}
                </Text>
              )}

              {/* Individual criterion scores */}
              {assessmentScores && (
                <>
                  <Divider borderColor="gray.700" />
                  <Box>
                    <Text fontWeight="semibold" fontSize="md" mb={4}>
                      {isEs ? "Desglose de Puntuación" : "Score Breakdown"}
                    </Text>
                    <VStack spacing={4} align="stretch">
                      {ASSESSMENT_CRITERIA.map((criterion) => {
                        const data = assessmentScores[criterion.key];
                        const score =
                          typeof data?.score === "number"
                            ? Math.max(1, Math.min(10, data.score))
                            : typeof data === "number"
                            ? Math.max(1, Math.min(10, data))
                            : null;
                        const note =
                          typeof data?.note === "string" ? data.note : "";

                        return (
                          <Box
                            key={criterion.key}
                            bg="gray.800"
                            p={3}
                            rounded="xl"
                            border="1px solid"
                            borderColor="gray.700"
                          >
                            <HStack justify="space-between" mb={2}>
                              <Text fontSize="sm" fontWeight="medium">
                                {criterion[isEs ? "es" : "en"]}
                              </Text>
                              {score !== null && (
                                <Badge
                                  colorScheme={scoreColor(score)}
                                  variant="subtle"
                                  fontSize="sm"
                                  px={2}
                                  rounded="md"
                                >
                                  {score}/10
                                </Badge>
                              )}
                            </HStack>
                            {score !== null && (
                              <Progress
                                value={score * 10}
                                size="sm"
                                rounded="full"
                                colorScheme={scoreColor(score)}
                                bg="gray.700"
                              />
                            )}
                            {note && (
                              <Text
                                fontSize="xs"
                                opacity={0.7}
                                mt={2}
                                lineHeight="1.5"
                              >
                                {note}
                              </Text>
                            )}
                          </Box>
                        );
                      })}
                    </VStack>
                  </Box>
                </>
              )}

              <Divider borderColor="gray.700" />

              {/* Unlocked levels */}
              {assessedLevel && assessedLevel !== "Pre-A1" && (
                <Box
                  bg="gray.800"
                  p={4}
                  rounded="xl"
                  border="1px solid"
                  borderColor="gray.700"
                >
                  <Text fontSize="sm" opacity={0.8} textAlign="center">
                    {isEs
                      ? `Se desbloquearán todos los niveles hasta ${assessedLevel} en la aplicación.`
                      : `All levels up to ${assessedLevel} will be unlocked in the app.`}
                  </Text>
                  <HStack
                    mt={3}
                    justify="center"
                    spacing={2}
                    flexWrap="wrap"
                  >
                    {CEFR_LEVELS.slice(
                      0,
                      CEFR_LEVELS.indexOf(assessedLevel) + 1
                    ).map((lvl) => (
                      <Badge
                        key={lvl}
                        colorScheme="green"
                        variant="subtle"
                        fontSize="xs"
                      >
                        {lvl}
                      </Badge>
                    ))}
                  </HStack>
                </Box>
              )}

              {/* Return to app button */}
              <Button
                w="100%"
                size="lg"
                colorScheme="cyan"
                onClick={handleReturnToApp}
                fontWeight="bold"
                rounded="xl"
                py={6}
              >
                {isEs ? "Volver a la aplicación" : "Return to app"}
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
