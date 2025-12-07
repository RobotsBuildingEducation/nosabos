import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  HStack,
  Text,
  VStack,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { getRandomVoice, TTS_ENDPOINT } from "../utils/tts";

import { getGenerativeModel } from "@firebase/vertexai";
import { ai } from "../firebaseResources/firebaseResources";

const SPANISH_PHRASES = [
  "Hola",
  "Buenos días",
  "Muchas gracias",
  "¿Cómo estás?",
  "Hasta luego",
];

// --- tiny helpers (inline) ---
function base64ToUint8Array(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function pcm16ToWav(pcmBytes, sampleRate = 24000, numChannels = 1) {
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmBytes.byteLength;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeStr(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(view, 8, "WAVE");
  writeStr(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(view, 36, "data");
  view.setUint32(40, dataSize, true);
  new Uint8Array(buffer, 44).set(pcmBytes);
  return new Blob([buffer], { type: "audio/wav" });

  function writeStr(dv, offset, s) {
    for (let i = 0; i < s.length; i++) dv.setUint8(offset + i, s.charCodeAt(i));
  }
}

// requestIdleCallback polyfill
const rIC =
  typeof window !== "undefined" && window.requestIdleCallback
    ? window.requestIdleCallback
    : (cb) => setTimeout(cb, 200);

export default function Experiments() {
  const audioRef = useRef(null);
  const [activePhrase, setActivePhrase] = useState("");
  const [error, setError] = useState("");

  // Cache of { key: { url, blob } }
  const cacheRef = useRef(new Map());
  const ttsModelRef = useRef(null);

  const GEMINI_VOICE = "Puck"; // try "Kore", "Breeze", etc.
  const cacheKey = (phrase) =>
    `${phrase}::${GEMINI_VOICE}::gemini-2.5-flash-preview-tts`;

  const stopAudio = () => {
    try {
      const current = audioRef.current;
      if (current) {
        current.pause();
        current.currentTime = 0;
      }
    } catch {}
    audioRef.current = null;
    setActivePhrase("");
  };

  // Init model once
  useEffect(() => {
    ttsModelRef.current = getGenerativeModel(ai, {
      model: "gemini-2.5-flash-preview-tts",
    });
    return () => {
      // cleanup blob URLs
      for (const { url } of cacheRef.current.values()) URL.revokeObjectURL(url);
      cacheRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefetch all known phrases on idle (so first click is instant)
  useEffect(() => {
    rIC(() => {
      SPANISH_PHRASES.forEach((p) => prefetchGemini(p).catch(() => {}));
    });
    // also stop audio on unmount
    return stopAudio;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function synthGeminiToWavUrl(phrase) {
    const model = ttsModelRef.current;
    if (!model) throw new Error("Gemini no está listo aún.");

    const res = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: phrase }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        // determinism (optional): temperature: 0,
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: GEMINI_VOICE } },
        },
      },
    });

    const part = res.response?.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData
    );
    const b64 = part?.inlineData?.data;
    if (!b64) throw new Error("Gemini no devolvió audio.");

    const pcmBytes = base64ToUint8Array(b64); // PCM 16-bit
    const wavBlob = pcm16ToWav(pcmBytes, 24000); // wrap to playable WAV
    const url = URL.createObjectURL(wavBlob);
    return { url, wavBlob };
  }

  async function prefetchGemini(phrase) {
    const key = cacheKey(phrase);
    if (cacheRef.current.has(key)) return cacheRef.current.get(key);

    const result = await synthGeminiToWavUrl(phrase);
    cacheRef.current.set(key, result);
    return result;
  }

  // Existing OpenAI proxy TTS button (unchanged)
  const handleSpeak = async (phrase) => {
    stopAudio();
    setError("");
    setActivePhrase(phrase);
    try {
      const response = await fetch(TTS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: phrase,
          voice: getRandomVoice(),
          model: "gpt-4o-mini-tts",
          response_format: "mp3",
        }),
      });
      if (!response.ok)
        throw new Error(`TTS request failed: ${response.status}`);

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      const cleanup = () => {
        URL.revokeObjectURL(url);
        setActivePhrase("");
        audioRef.current = null;
      };
      audio.onended = cleanup;
      audio.onerror = () => {
        cleanup();
        setError("No se pudo reproducir el audio.");
      };
      await audio.play();
    } catch (err) {
      setError(err?.message || "No se pudo generar audio.");
      setActivePhrase("");
    }
  };

  // NEW: Gemini button uses the cache first (instant), otherwise generates then caches.
  const handleSpeakGemini = async (phrase) => {
    stopAudio();
    setError("");
    setActivePhrase(phrase);
    try {
      const key = cacheKey(phrase);
      let entry = cacheRef.current.get(key);
      if (!entry) {
        // If not prefetched yet, generate now (first time only)
        entry = await synthGeminiToWavUrl(phrase);
        cacheRef.current.set(key, entry);
      }
      const audio = new Audio(entry.url);
      audioRef.current = audio;

      const cleanup = () => {
        setActivePhrase("");
        audioRef.current = null;
      };
      audio.onended = cleanup;
      audio.onerror = () => {
        cleanup();
        setError("No se pudo reproducir el audio (Gemini).");
      };
      await audio.play();
    } catch (err) {
      setError(err?.message || "No se pudo generar audio con Gemini.");
      setActivePhrase("");
    }
  };

  return (
    <Box
      maxW="600px"
      mx="auto"
      mt={10}
      p={6}
      borderWidth="1px"
      borderRadius="lg"
      boxShadow="md"
    >
      <VStack align="stretch" spacing={4}>
        <Text fontSize="xl" fontWeight="bold">
          Palabras con audio
        </Text>
        <Text color="gray.600">
          Pulsa en reproducir para escuchar cada frase a través de{" "}
          <code>/proxyTTS</code> o prueba <code>Gemini</code> desde el frontend.
        </Text>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {SPANISH_PHRASES.map((phrase) => (
          <HStack
            key={phrase}
            justify="space-between"
            p={3}
            borderWidth="1px"
            borderRadius="md"
            bg="gray.50"
          >
            <Text>{phrase}</Text>
            <HStack>
              <Button
                colorScheme="teal"
                size="sm"
                isLoading={activePhrase === phrase}
                onClick={() => handleSpeak(phrase)}
              >
                Reproducir
              </Button>
              <Button
                variant="outline"
                size="sm"
                isLoading={activePhrase === phrase}
                onMouseEnter={() => prefetchGemini(phrase).catch(() => {})} // hover prefetch
                onFocus={() => prefetchGemini(phrase).catch(() => {})}
                onClick={() => handleSpeakGemini(phrase)}
              >
                Gemini
              </Button>
            </HStack>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}
