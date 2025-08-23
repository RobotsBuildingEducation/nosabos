import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Badge,
  Box,
  Button,
  Center,
  Collapse,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  HStack,
  IconButton,
  Input,
  Progress,
  Select,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Switch,
  Tag,
  Text,
  VStack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { SettingsIcon } from "@chakra-ui/icons";
import { GoogleGenAI } from "@google/genai";

/* ===========================
   Utilities
=========================== */
function b64ToUint8(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function pcm16ToWav(pcmUint8, sampleRate = 24000, channels = 1) {
  const blockAlign = channels * 2;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmUint8.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeStr = (o, s) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
  new Uint8Array(buffer, 44).set(pcmUint8);
  return new Blob([buffer], { type: "audio/wav" });
}
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(String(r.result).split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
function safeParseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {}
  const s = text.indexOf("{"),
    e = text.lastIndexOf("}");
  if (s !== -1 && e !== -1 && e > s) {
    try {
      return JSON.parse(text.slice(s, e + 1));
    } catch {}
  }
  return null;
}

/* ===========================
   Phrase-aligned highlighting (tap-friendly)
=========================== */
const COLORS = [
  "#91E0FF",
  "#A0EBAF",
  "#FFD48A",
  "#C6B7FF",
  "#FF9FB1",
  "#B0F0FF",
];
const colorFor = (i) => COLORS[i % COLORS.length];

function wrapFirst(text, phrase, tokenId) {
  if (!text || !phrase) return [text];
  const idx = text.toLowerCase().indexOf(phrase.toLowerCase());
  if (idx < 0) return [text];
  const before = text.slice(0, idx);
  const mid = text.slice(idx, idx + phrase.length);
  const after = text.slice(idx + phrase.length);
  return [
    before,
    <span
      key={`${tokenId}-${idx}`}
      data-token={tokenId}
      style={{ borderBottom: "2px solid transparent" }}
    >
      {mid}
    </span>,
    ...wrapFirst(after, phrase, tokenId + "_cont"),
  ];
}
function buildAlignedNodes(text, pairs, side /* 'es' | 'en' */) {
  if (!pairs?.length || !text) return [text];
  const sorted = [...pairs].sort(
    (a, b) => (b[side]?.length || 0) - (a[side]?.length || 0)
  );
  let nodes = [text];
  sorted.forEach((pair, i) => {
    const phrase = pair[side];
    if (!phrase) return;
    const tokenId = `tok_${i}`;
    const next = [];
    nodes.forEach((node) => {
      if (typeof node === "string")
        next.push(...wrapFirst(node, phrase, tokenId));
      else next.push(node);
    });
    nodes = next;
  });
  return nodes;
}
function AlignedBubble({ esText, enText, alignPairs, showTranslations }) {
  const [activeId, setActiveId] = useState(null);

  function decorate(nodes) {
    return React.Children.map(nodes, (node) => {
      if (typeof node === "string" || !node?.props?.["data-token"]) return node;
      const rootId = node.props["data-token"].split("_")[0];
      const i = parseInt(rootId.replace("tok_", "")) || 0;
      const isActive = activeId === rootId;
      const style = {
        borderBottom: `2px solid ${isActive ? colorFor(i) : "transparent"}`,
        paddingBottom: 1,
        transition: "border-color 120ms ease",
      };
      return React.cloneElement(node, {
        onMouseEnter: () => setActiveId(rootId),
        onMouseLeave: () => setActiveId(null),
        onClick: () => setActiveId(isActive ? null : rootId), // tap toggles on mobile
        style: { ...(node.props.style || {}), ...style },
      });
    });
  }

  const esNodes = decorate(buildAlignedNodes(esText, alignPairs, "es"));
  const enNodes = decorate(buildAlignedNodes(enText, alignPairs, "en"));

  return (
    <Box bg="gray.800" p={3} borderRadius="lg">
      <Text fontSize="md" lineHeight="1.45">
        {esNodes}
      </Text>
      {showTranslations && enText && (
        <Text opacity={0.85} fontSize="sm" mt={1} lineHeight="1.4">
          {enNodes}
        </Text>
      )}
      {!!alignPairs?.length && showTranslations && (
        <HStack spacing={2} mt={2} wrap="wrap">
          {alignPairs.slice(0, COLORS.length).map((p, i) => (
            <Tag
              key={i}
              size="sm"
              style={{
                borderColor: colorFor(i),
                borderWidth: 2,
                background: "transparent",
                color: "white",
              }}
            >
              {p.es} ⇄ {p.en}
            </Tag>
          ))}
        </HStack>
      )}
    </Box>
  );
}

/* ===========================
   Robot Buddy Avatar (mobile-first)
   - screen eyes that track touch/hover
   - antenna blink
   - breathing chassis
   - LED equalizer mouth (listening reacts to loudness, speaking animates)
   - mood ring glow
=========================== */
function RobotBuddy({ state = "idle", loudness = 0, mood = "neutral" }) {
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e) => {
      const { clientX, clientY } = e.touches?.[0] || e;
      // normalized -1..1
      const w = window.innerWidth,
        h = window.innerHeight;
      const nx = (clientX / w) * 2 - 1;
      const ny = (clientY / h) * 2 - 1;
      setGaze({
        x: Math.max(-1, Math.min(1, nx)),
        y: Math.max(-1, Math.min(1, ny)),
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("touchstart", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("touchstart", onMove);
    };
  }, []);

  const ring =
    state === "listening"
      ? "rgba(0,210,255,0.6)"
      : state === "speaking"
      ? "rgba(0,255,140,0.6)"
      : state === "thinking"
      ? "rgba(255,220,0,0.55)"
      : "rgba(255,255,255,0.25)";

  const eyeOffsetX = gaze.x * 6;
  const eyeOffsetY = gaze.y * 3;

  const bars = Array.from({ length: 7 }, (_, i) => {
    const amp =
      state === "speaking"
        ? 6 + 8 * (0.5 + Math.sin(Date.now() / 100 + i) * 0.5)
        : 4 + Math.min(12, loudness * 40) * (0.7 + (i % 2 ? 0.2 : 0));
    return Math.max(3, Math.min(20, amp));
  });

  const moodAccent =
    mood === "happy"
      ? "#74f7c5"
      : mood === "encourage"
      ? "#ffd27d"
      : mood === "neutral"
      ? "#a0b3ff"
      : "#a0b3ff";

  return (
    <Box
      w="100%"
      maxW="360px"
      mx="auto"
      mt={2}
      px={2}
      position="relative"
      userSelect="none"
    >
      {/* glow ring */}
      <Box
        position="absolute"
        inset="-8px"
        borderRadius="24px"
        filter="blur(14px)"
        _before={{
          content: '""',
          position: "absolute",
          inset: 0,
          borderRadius: "24px",
          boxShadow: `0 0 42px 8px ${ring}`,
          animation:
            state === "speaking" ? "pulse 1.2s ease-in-out infinite" : "none",
        }}
      />
      <style>{`
        @keyframes pulse { 0%{transform:scale(0.98)}50%{transform:scale(1.03)}100%{transform:scale(0.98)} }
      `}</style>

      <Box
        bg="gray.800"
        border="1px solid rgba(255,255,255,0.08)"
        rounded="2xl"
        p={3}
        boxShadow="0 8px 24px rgba(0,0,0,0.4)"
      >
        <svg viewBox="0 0 340 220" width="100%" height="100%">
          {/* body breathing */}
          <rect x="10" y="60" width="320" height="150" rx="22" fill="#1f2937">
            <animate
              attributeName="y"
              dur="3s"
              values="60;62;60"
              repeatCount="indefinite"
            />
          </rect>

          {/* antenna */}
          <line
            x1="170"
            y1="22"
            x2="170"
            y2="48"
            stroke={moodAccent}
            strokeWidth="4"
          />
          <circle cx="170" cy="18" r="8" fill={moodAccent}>
            <animate
              attributeName="r"
              dur="2s"
              values="8;11;8"
              repeatCount="indefinite"
            />
          </circle>

          {/* head */}
          <rect
            x="50"
            y="32"
            width="240"
            height="120"
            rx="18"
            fill="#111827"
            stroke="#2d3748"
            strokeWidth="2"
          />

          {/* eyes screen */}
          <rect x="64" y="48" width="212" height="64" rx="12" fill="#0b1220" />
          {/* eyes */}
          <g transform={`translate(${eyeOffsetX}, ${eyeOffsetY})`}>
            <circle cx="120" cy="80" r="10" fill="#7dd3fc" />
            <circle cx="220" cy="80" r="10" fill="#7dd3fc" />
          </g>

          {/* “thinking” dots */}
          {state === "thinking" && (
            <g>
              <circle cx="120" cy="112" r="4" fill="#fff">
                <animate
                  attributeName="opacity"
                  dur="1s"
                  values="0;1;0"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="170" cy="112" r="4" fill="#fff">
                <animate
                  attributeName="opacity"
                  dur="1s"
                  values="0;0.4;1;0.4;0"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="220" cy="112" r="4" fill="#fff">
                <animate
                  attributeName="opacity"
                  dur="1s"
                  values="0;1;0"
                  begin="0.2s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          )}

          {/* LED mouth equalizer */}
          <g transform="translate(85, 140)">
            {bars.map((h, i) => (
              <rect
                key={i}
                x={i * 22}
                y={-h}
                width="14"
                height={h}
                rx="3"
                fill={moodAccent}
              />
            ))}
          </g>
        </svg>

        <HStack justify="center" mt={2} spacing={2}>
          <Badge
            colorScheme={
              state === "listening"
                ? "cyan"
                : state === "speaking"
                ? "green"
                : state === "thinking"
                ? "yellow"
                : "purple"
            }
          >
            {state === "listening"
              ? "Listening"
              : state === "speaking"
              ? "Speaking"
              : state === "thinking"
              ? "Thinking"
              : "Idle"}
          </Badge>
          {mood !== "neutral" && (
            <Badge variant="subtle" colorScheme="teal">
              {mood}
            </Badge>
          )}
        </HStack>
      </Box>
    </Box>
  );
}

/* ===========================
   Coach Card (English-first) — bottom sheet
=========================== */
function CoachPanel({ isOpen, onClose, coach, onRedo, onAcceptNext }) {
  const {
    correction_en,
    tip_en,
    redo_es,
    vocab_es = [],
    scores = {},
    cefr,
    next_goal,
    goal_completed,
  } = coach || {};
  const pct =
    (((scores?.pronunciation ?? 0) +
      (scores?.grammar ?? 0) +
      (scores?.vocab ?? 0) +
      (scores?.fluency ?? 0)) /
      12) *
    100;

  return (
    <Drawer isOpen={isOpen} placement="bottom" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent bg="gray.900" borderTopRadius="24px">
        <DrawerHeader pb={2}>
          <HStack justify="space-between">
            <Text fontWeight="bold">Coach</Text>
            <HStack>
              {goal_completed ? (
                <Badge colorScheme="green">Goal completed</Badge>
              ) : (
                <Badge colorScheme="orange">Keep going</Badge>
              )}
              {cefr && <Badge colorScheme="purple">{cefr}</Badge>}
            </HStack>
          </HStack>
        </DrawerHeader>
        <DrawerBody pb={6}>
          {correction_en && (
            <Box mb={2}>
              <Text fontSize="sm" opacity={0.8}>
                Correction
              </Text>
              <Text>{correction_en}</Text>
            </Box>
          )}
          {tip_en && (
            <Box mb={3}>
              <Text fontSize="sm" opacity={0.8}>
                Tip
              </Text>
              <Text>{tip_en}</Text>
            </Box>
          )}
          {!!vocab_es?.length && (
            <Box mb={3}>
              <Text fontSize="sm" opacity={0.8}>
                Useful Spanish
              </Text>
              <HStack wrap="wrap" spacing={2}>
                {vocab_es.slice(0, 8).map((w, i) => (
                  <Tag key={i} colorScheme="teal" variant="subtle">
                    {w}
                  </Tag>
                ))}
              </HStack>
            </Box>
          )}
          <Box mb={4}>
            <Text fontSize="xs" opacity={0.8}>
              Pronunciation / Grammar / Vocab / Fluency
            </Text>
            <Progress value={pct} size="sm" colorScheme="teal" rounded="sm" />
          </Box>
          <HStack>
            <Button
              size="md"
              onClick={() => onRedo?.(redo_es)}
              isDisabled={!redo_es}
              flex="1"
            >
              Try again (ES)
            </Button>
            <Button
              size="md"
              variant="outline"
              onClick={() => onAcceptNext?.(next_goal)}
              isDisabled={!next_goal}
              flex="1"
            >
              Next goal
            </Button>
          </HStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

/* ===========================
   Main (MOBILE-FIRST)
=========================== */
export default function VoiceChat() {
  const toast = useToast();

  // Bottom sheets
  const settings = useDisclosure();
  const coachSheet = useDisclosure();

  // API
  const [apiKeyInput, setApiKeyInput] = useState(
    import.meta?.env?.VITE_GEMINI_API_KEY || ""
  );
  const ai = useMemo(
    () => (apiKeyInput ? new GoogleGenAI({ apiKey: apiKeyInput }) : null),
    [apiKeyInput]
  );

  // Core states
  const [uiState, setUiState] = useState("idle"); // idle | listening | thinking | speaking
  const [mood, setMood] = useState("neutral"); // happy | encourage | neutral
  const [volume, setVolume] = useState(0);
  const [pauseMs, setPauseMs] = useState(700);
  const [level, setLevel] = useState("beginner"); // beginner | intermediate | advanced
  const [supportLang, setSupportLang] = useState("en"); // en | bilingual | es
  const [voice, setVoice] = useState("Puck");
  const [history, setHistory] = useState([]); // [{ es, en, align }]
  const [coach, setCoach] = useState(null);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [challenge, setChallenge] = useState({
    es: "Pide algo con cortesía.",
    en: "Make a polite request.",
  });
  const [showTranslations, setShowTranslations] = useState(true);

  // Media refs
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);

  // VAD
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const silenceStartRef = useRef(null);

  // Redo prompt
  const redoRef = useRef("");

  useEffect(() => {
    return () => {
      try {
        if (rafRef.current) clearTimeout(rafRef.current);
        audioCtxRef.current?.close();
        audioRef.current?.pause?.();
        stopTracks();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopTracks() {
    const stream = mediaRecorderRef.current?.stream;
    if (stream) stream.getTracks().forEach((t) => t.stop());
  }

  /* ---------- Recording ---------- */
  async function startRecording() {
    try {
      if (!ai) {
        toast({ title: "Add your API key first", status: "warning" });
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        toast({
          title: "Mic not available",
          description: "getUserMedia not supported.",
          status: "error",
        });
        return;
      }
      try {
        audioRef.current?.pause?.();
        audioRef.current = null;
      } catch {}

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported?.("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = handleStop;
      recorder.start();
      mediaRecorderRef.current = recorder;

      // VAD loop
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      silenceStartRef.current = null;
      setUiState("listening");
      setMood("encourage");

      const buf = new Uint8Array(analyser.fftSize);
      const THRESHOLD = 0.02,
        MONITOR_HZ = 60;
      function loop() {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        setVolume(rms);
        const now = performance.now();
        if (rms < THRESHOLD) {
          if (silenceStartRef.current == null) {
            silenceStartRef.current = now;
          } else if (now - silenceStartRef.current >= pauseMs) {
            try {
              mediaRecorderRef.current?.stop();
            } catch {}
            return;
          }
        } else {
          silenceStartRef.current = null;
        }
        rafRef.current = setTimeout(loop, 1000 / MONITOR_HZ);
      }
      loop();
    } catch (e) {
      console.error(e);
      toast({
        title: "Microphone error",
        description: String(e),
        status: "error",
      });
    }
  }
  function stopRecordingNow() {
    try {
      mediaRecorderRef.current?.stop();
    } catch {}
  }

  /* ---------- Goal fallback generator ---------- */
  function nextGoalFallback(prevGoal, scores) {
    const sum =
      (scores?.pronunciation ?? 0) +
      (scores?.grammar ?? 0) +
      (scores?.vocab ?? 0) +
      (scores?.fluency ?? 0);
    const easy = sum <= 4;
    const mid = sum <= 8;
    const ladder = [
      {
        es: "Preséntate y di de dónde eres.",
        en: "Introduce yourself and say where you’re from.",
      },
      {
        es: "Haz una petición cortés con 'me gustaría'.",
        en: "Make a polite request using 'me gustaría'.",
      },
      { es: "Añade cantidad y cortesía.", en: "Add quantity plus courtesy." },
      {
        es: "Pregunta por detalles (tamaño/sabor).",
        en: "Ask for details (size/flavor).",
      },
      { es: "Propón una hora para quedar.", en: "Propose a time to meet." },
      {
        es: "Cuenta lo que hiciste ayer (pretérito).",
        en: "Say what you did yesterday (preterite).",
      },
    ];
    if (easy) return ladder[0];
    if (mid) return ladder[2];
    return ladder[Math.floor(Math.random() * ladder.length)];
  }

  /* ---------- Turn handling ---------- */
  async function handleStop() {
    try {
      setUiState("thinking");
      setMood("neutral");
      try {
        if (rafRef.current) {
          clearTimeout(rafRef.current);
          rafRef.current = null;
        }
        audioCtxRef.current?.close();
      } catch {}
      stopTracks();

      const blob =
        chunksRef.current.length > 1
          ? new Blob(chunksRef.current, {
              type: mediaRecorderRef.current?.mimeType || "audio/webm",
            })
          : chunksRef.current[0];
      if (!blob) {
        toast({ title: "No audio captured", status: "warning" });
        setUiState("idle");
        return;
      }

      const b64 = await blobToBase64(blob);
      const mime = (blob.type || "audio/webm").split(";")[0];

      const system = `
You are a Spanish practice partner with an English-first coach UI.
Return ONLY one JSON object (no code fences):
{
 "assistant_es": "<Spanish reply, ≤ 24 words, friendly, natural, continue the thread>",
 "coach": {
   "correction_en": "<one English correction with a Spanish quote if helpful>",
   "tip_en": "<one English micro-tip (≤14 words)>",
   "redo_es": "<short Spanish redo prompt>",
   "vocab_es": ["word1","word2","..."],
   "translation_en": "<English translation of assistant_es>",
   "alignment": [{"es":"<spanish phrase>","en":"<english phrase>"}],
   "scores": {"pronunciation":0-3,"grammar":0-3,"vocab":0-3,"fluency":0-3},
   "cefr": "A1|A2|B1|B2|C1",
   "goal_completed": true|false,
   "next_goal": {"es":"...", "en":"..."}
 }
}
Constraints:
- assistant_es MUST be Spanish.
- Coach/tips/explanations are English-first (except redo_es/vocab_es).
- Ensure next_goal is coherent with the conversation and current goal.
- If the goal wasn't completed, next_goal should be a refined, actionable micro-goal.`.trim();

      const levelHint =
        level === "beginner"
          ? "Learner level: beginner. Simpler Spanish; supportive English coaching."
          : level === "intermediate"
          ? "Learner level: intermediate. Natural Spanish; concise English coaching."
          : "Learner level: advanced. Native Spanish; terse English coaching.";

      const supportHint =
        supportLang === "en"
          ? "Support language: English only."
          : supportLang === "bilingual"
          ? "Support language: bilingual (English with Spanish phrases)."
          : "Support language: Spanish for support (coach in Spanish).";

      const challengeHint = `Current goal: ES="${challenge.es}" | EN="${challenge.en}".`;
      const redoHint = redoRef.current
        ? `User wants to retry: "${redoRef.current}".`
        : "";

      const contextTurns = history.slice(-3).map((m) => ({
        role: "model",
        parts: [{ text: m.es || "" }],
      }));

      const contents = [
        { role: "user", parts: [{ text: system }] },
        {
          role: "user",
          parts: [
            {
              text: `${levelHint} ${supportHint} ${challengeHint} ${redoHint}`,
            },
          ],
        },
        ...contextTurns,
        {
          role: "user",
          parts: [{ inlineData: { data: b64, mimeType: mime } }],
        },
      ];

      const chatResp = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents,
        generationConfig: { maxOutputTokens: 200, temperature: 0.6 },
      });

      const raw =
        chatResp?.text?.trim() ||
        chatResp?.candidates?.[0]?.content?.parts
          ?.map((p) => p.text)
          .filter(Boolean)
          .join("\n") ||
        "";

      const parsed = safeParseJson(raw);
      const assistant_es = parsed?.assistant_es || "";
      const coachObj = parsed?.coach || null;

      if (assistant_es) {
        setHistory((prev) => [
          ...prev,
          {
            es: assistant_es,
            en: coachObj?.translation_en || "",
            align: coachObj?.alignment || [],
          },
        ]);
      }

      // TTS (fast)
      if (assistant_es) {
        try {
          const ttsResp = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ role: "user", parts: [{ text: assistant_es }] }],
            config: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
              },
            },
          });
          const audioB64 =
            ttsResp?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)
              ?.inlineData?.data || null;

          if (audioB64) {
            const pcm = b64ToUint8(audioB64);
            const wav = pcm16ToWav(pcm, 24000, 1);
            const url = URL.createObjectURL(wav);
            try {
              audioRef.current?.pause?.();
            } catch {}
            const audio = new Audio(url);
            audioRef.current = audio;
            setUiState("speaking");
            setMood("happy");
            audio.onended = () => {
              URL.revokeObjectURL(url);
              audioRef.current = null;
              setUiState("idle");
              setMood("neutral");
            };
            await audio.play().catch(() => {
              const unlock = () => {
                audio.play().catch(() => {});
                window.removeEventListener("pointerdown", unlock);
              };
              window.addEventListener("pointerdown", unlock);
            });
          } else {
            setUiState("idle");
            setMood("neutral");
          }
        } catch {
          setUiState("idle");
          setMood("neutral");
        }
      } else {
        setUiState("idle");
        setMood("neutral");
      }

      // Coach & goals
      if (coachObj) {
        setCoach(coachObj);
        let next = coachObj.next_goal;
        if (!next?.es || !next?.en)
          next = nextGoalFallback(challenge, coachObj.scores);
        if (coachObj.goal_completed) setChallenge(next);
        else if (coachObj.redo_es)
          setChallenge({
            es: coachObj.redo_es,
            en: "Try that again in Spanish.",
          });

        const sum =
          (coachObj.scores?.pronunciation ?? 0) +
          (coachObj.scores?.grammar ?? 0) +
          (coachObj.scores?.vocab ?? 0) +
          (coachObj.scores?.fluency ?? 0);
        const gained = 10 + sum + (coachObj.goal_completed ? 5 : 0);
        setXp((x) => x + gained);
        setStreak((s) => s + 1);
      } else {
        setCoach(null);
        setChallenge(nextGoalFallback(challenge, null));
      }

      redoRef.current = "";
    } catch (e) {
      console.error(e);
      setUiState("idle");
      setMood("neutral");
      toast({
        title: "Conversation failed",
        description: String(e?.message || e),
        status: "error",
      });
    } finally {
      chunksRef.current = [];
      mediaRecorderRef.current = null;
    }
  }

  /* ---------- Redo ---------- */
  function handleRedo(redo_es) {
    if (!redo_es) return;
    redoRef.current = redo_es;
    (async () => {
      if (!ai) return;
      try {
        const ttsResp = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ role: "user", parts: [{ text: redo_es }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
            },
          },
        });
        const audioB64 =
          ttsResp?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)
            ?.inlineData?.data || null;
        if (audioB64) {
          const pcm = b64ToUint8(audioB64);
          const wav = pcm16ToWav(pcm, 24000, 1);
          const url = URL.createObjectURL(wav);
          try {
            audioRef.current?.pause?.();
          } catch {}
          const audio = new Audio(url);
          audioRef.current = audio;
          setUiState("speaking");
          setMood("encourage");
          audio.onended = () => {
            URL.revokeObjectURL(url);
            audioRef.current = null;
            setUiState("idle");
            setMood("neutral");
          };
          await audio.play().catch(() => {
            const unlock = () => {
              audio.play().catch(() => {});
              window.removeEventListener("pointerdown", unlock);
            };
            window.addEventListener("pointerdown", unlock);
          });
        }
      } catch {}
    })();
  }
  function acceptNextGoal(next_goal) {
    if (!next_goal?.es || !next_goal?.en) return;
    setChallenge(next_goal);
    coachSheet.onClose();
  }

  /* ---------- Render (mobile-first) ---------- */
  const progressPct = Math.min(100, xp % 100);
  const levelLabel =
    level === "beginner"
      ? "Beginner"
      : level === "intermediate"
      ? "Intermediate"
      : "Advanced";
  const levelColor =
    level === "beginner"
      ? "green"
      : level === "intermediate"
      ? "orange"
      : "purple";

  return (
    <Box
      minH="100vh"
      bg="gray.900"
      color="gray.100"
      position="relative"
      pb="120px" /* space for FAB + safe area */
    >
      {/* App bar (compact, thumb-friendly) */}
      <HStack px={4} pt={4} pb={2} justify="space-between" align="center">
        <Box>
          <Text fontSize="lg" fontWeight="bold">
            No Sabo — Coach
          </Text>
          <HStack spacing={2}>
            <Badge colorScheme={levelColor} variant="subtle">
              {levelLabel}
            </Badge>
            <Badge colorScheme="teal" variant="subtle">
              XP {xp}
            </Badge>
            <Badge colorScheme="pink" variant="subtle">
              {streak}🔥
            </Badge>
          </HStack>
        </Box>
        <IconButton
          aria-label="Settings"
          icon={<SettingsIcon />}
          size="md"
          onClick={settings.onOpen}
        />
      </HStack>

      {/* Robot + goal chip (top) */}
      <VStack align="stretch" spacing={3} px={4}>
        <RobotBuddy
          state={uiState}
          loudness={uiState === "listening" ? volume : 0}
          mood={mood}
        />
        <Box
          bg="gray.800"
          p={3}
          rounded="lg"
          border="1px solid rgba(255,255,255,0.06)"
        >
          <HStack justify="space-between" align="start">
            <Text fontWeight="semibold" fontSize="md">
              🎯 {challenge.en}
            </Text>
            <Badge colorScheme="teal" whiteSpace="nowrap">
              ES: {challenge.es}
            </Badge>
          </HStack>
          <HStack mt={2} spacing={2} overflowX="auto">
            <Button size="sm" variant="outline" onClick={coachSheet.onOpen}>
              Coach
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowTranslations((v) => !v)}
            >
              {showTranslations ? "Hide English" : "Show English"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                setChallenge(nextGoalFallback(challenge, coach?.scores))
              }
            >
              New goal
            </Button>
            {coach?.redo_es && (
              <Button size="sm" onClick={() => handleRedo(coach.redo_es)}>
                Redo tip
              </Button>
            )}
          </HStack>
        </Box>
      </VStack>

      {/* Transcript list */}
      <VStack align="stretch" spacing={3} px={4} mt={3}>
        {history.map((m, idx) => (
          <AlignedBubble
            key={idx}
            esText={m.es}
            enText={m.en}
            alignPairs={m.align}
            showTranslations={showTranslations}
          />
        ))}
      </VStack>

      {/* Bottom dock: big FAB mic (sticky) */}
      <Center position="fixed" bottom="22px" left="0" right="0" zIndex={30}>
        <HStack spacing={3}>
          <Box
            bg="gray.800"
            px={3}
            py={2}
            rounded="lg"
            border="1px solid rgba(255,255,255,0.06)"
            display={["none", "flex"]}
          >
            <Stat minW="120px">
              <StatLabel fontSize="xs">Progress</StatLabel>
              <StatNumber fontSize="md">
                {100 - progressPct} XP to level
              </StatNumber>
              <Progress
                mt={1}
                value={progressPct}
                size="xs"
                colorScheme="teal"
                rounded="sm"
              />
            </Stat>
          </Box>

          {uiState !== "listening" ? (
            <Button
              onClick={startRecording}
              size="lg"
              height="64px"
              px="8"
              rounded="full"
              colorScheme="teal"
              boxShadow="0 10px 30px rgba(0,0,0,0.35)"
            >
              🎤 Talk
            </Button>
          ) : (
            <Button
              onClick={stopRecordingNow}
              size="lg"
              height="64px"
              px="8"
              rounded="full"
              colorScheme="red"
              boxShadow="0 10px 30px rgba(0,0,0,0.35)"
            >
              ⏹️ Stop
            </Button>
          )}
        </HStack>
      </Center>

      {/* Settings bottom sheet */}
      <Drawer
        isOpen={settings.isOpen}
        placement="bottom"
        onClose={settings.onClose}
      >
        <DrawerOverlay />
        <DrawerContent bg="gray.900" borderTopRadius="24px">
          <DrawerHeader pb={2}>Settings</DrawerHeader>
          <DrawerBody pb={6}>
            <VStack align="stretch" spacing={3}>
              <Input
                type="password"
                placeholder="GEMINI API Key"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                bg="gray.800"
              />
              <HStack>
                <Select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  bg="gray.800"
                  size="md"
                  w="auto"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Select>
                <Select
                  value={supportLang}
                  onChange={(e) => setSupportLang(e.target.value)}
                  bg="gray.800"
                  size="md"
                  w="auto"
                >
                  <option value="en">Support: English</option>
                  <option value="bilingual">Support: Bilingual</option>
                  <option value="es">Support: Spanish</option>
                </Select>
                <Select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  bg="gray.800"
                  size="md"
                  w="auto"
                >
                  <option value="Puck">Puck</option>
                  <option value="Kore">Kore</option>
                  <option value="Breeze">Breeze</option>
                  <option value="Solemn">Solemn</option>
                </Select>
              </HStack>

              <Box bg="gray.800" p={3} rounded="md">
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm">Auto-stop after pause</Text>
                  <Text fontSize="sm" opacity={0.8}>
                    {pauseMs} ms
                  </Text>
                </HStack>
                <Slider
                  aria-label="pause-slider"
                  min={400}
                  max={3000}
                  step={100}
                  value={pauseMs}
                  onChange={setPauseMs}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
              </Box>

              <HStack bg="gray.800" p={3} rounded="md">
                <Text fontSize="sm" mr={2}>
                  Show English translation
                </Text>
                <Switch
                  isChecked={showTranslations}
                  onChange={(e) => setShowTranslations(e.target.checked)}
                />
              </HStack>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Coach bottom sheet */}
      <CoachPanel
        isOpen={coachSheet.isOpen}
        onClose={coachSheet.onClose}
        coach={coach}
        onRedo={handleRedo}
        onAcceptNext={acceptNextGoal}
      />
    </Box>
  );
}
