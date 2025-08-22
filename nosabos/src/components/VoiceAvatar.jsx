import React, { useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Center,
  HStack,
  Input,
  Select,
  Text,
  VStack,
  Textarea,
  useToast,
  Divider,
  Kbd,
  Badge,
} from "@chakra-ui/react";
import { GoogleGenAI } from "@google/genai";

/** --- Helpers: base64 -> Uint8Array, and PCM16 -> WAV Blob --- */
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
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
  new Uint8Array(buffer, 44).set(pcmUint8);
  return new Blob([buffer], { type: "audio/wav" });
}

/** A small list of prebuilt Gemini TTS voices to try */
const VOICES = [
  "Kore",
  "Puck",
  "Zephyr",
  "Charon",
  "Fenrir",
  "Leda",
  "Aoede",
  "Orus",
  "Enceladus",
  "Autonoe",
  "Umbriel",
  "Iapetus",
  "Algieba",
  "Despina",
  "Rasalgethi",
  "Schedar",
];

function AvatarFace({ talking }) {
  return (
    <Box
      w="140px"
      h="140px"
      borderRadius="full"
      bg="gray.700"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        bottom="30px"
        left="50%"
        transform="translateX(-50%)"
        w="48px"
        h="12px"
        bg="red.400"
        borderRadius="md"
        transition="transform 0.18s ease"
        style={{ transform: `translateX(-50%) scaleY(${talking ? 1 : 0.25})` }}
      />
    </Box>
  );
}

export default function GeminiTTSTester() {
  const toast = useToast();
  const [apiKeyInput, setApiKeyInput] = useState(
    import.meta?.env?.VITE_GEMINI_API_KEY || ""
  );
  const [voiceName, setVoiceName] = useState("Puck");
  const [styleHint, setStyleHint] = useState(
    "Warm, natural human tone with subtle breaths and varied pacing."
  );
  const [text, setText] = useState(
    "Hi there! This is a quick test of Gemini’s text-to-speech."
  );
  const [talking, setTalking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const audioRef = useRef(null);

  const ai = useMemo(() => {
    if (!apiKeyInput) return null;
    return new GoogleGenAI({ apiKey: apiKeyInput });
  }, [apiKeyInput]);

  const stop = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch {}
    }
    setTalking(false);
  };

  async function speak() {
    try {
      if (!ai) {
        toast({ title: "Add your API key first", status: "warning" });
        return;
      }
      const phrase = text.trim();
      if (!phrase) return;

      setLoading(true);
      setTalking(true);
      setAudioUrl("");

      // Style guidance works best baked into the text prompt:
      const combined = styleHint ? `${styleHint}\n\n${phrase}` : phrase;

      const resp = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: combined }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const b64 = resp?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!b64) throw new Error("No audio returned");

      const pcm = b64ToUint8(b64);
      const wav = pcm16ToWav(pcm, 24000, 1);
      const url = URL.createObjectURL(wav);
      setAudioUrl(url);

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setTalking(false);
        URL.revokeObjectURL(url);
        setAudioUrl("");
      };
      await audio.play();
    } catch (e) {
      console.error(e);
      toast({
        title: "TTS failed",
        description: String(e.message || e),
        status: "error",
      });
      setTalking(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Center minH="100vh" p={6} bg="gray.900" color="gray.100">
      <VStack w="full" maxW="720px" spacing={6} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="2xl" fontWeight="bold">
            No Sabo App
          </Text>
          <Badge colorScheme="purple">Preview</Badge>
        </HStack>

        <VStack align="stretch" spacing={3}>
          <Text fontSize="sm" opacity={0.8}>
            For quick testing you can paste an API key below (frontend only).
            For production, proxy through your backend.
          </Text>
          <Input
            type="password"
            placeholder="GEMINI API Key (or set VITE_GEMINI_API_KEY)"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            bg="gray.800"
          />
        </VStack>

        <HStack align="start" spacing={4}>
          <VStack flex="1" align="stretch" spacing={3}>
            <Text fontWeight="semibold">Voice</Text>
            <Select
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              bg="gray.800"
            >
              {VOICES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>

            <Text fontWeight="semibold" mt={4}>
              Style hint (optional)
            </Text>
            <Input
              value={styleHint}
              onChange={(e) => setStyleHint(e.target.value)}
              bg="gray.800"
              placeholder='e.g. "Gentle, conversational tone with slight smile."'
            />
          </VStack>

          <VStack w="160px" spacing={3}>
            <AvatarFace talking={talking} />
            <Text fontSize="xs" opacity={0.7}>
              {talking ? "Speaking…" : "Idle"}
            </Text>
          </VStack>
        </HStack>

        <VStack align="stretch" spacing={3}>
          <Text fontWeight="semibold">Text to speak</Text>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            bg="gray.800"
            rows={4}
            placeholder="Type something to say…"
          />
        </VStack>

        <HStack>
          <Button
            onClick={speak}
            isLoading={loading}
            loadingText="Generating…"
            colorScheme="teal"
          >
            Speak
          </Button>
          <Button onClick={stop} isDisabled={!talking} variant="outline">
            Stop
          </Button>
          {audioUrl ? (
            <a href={audioUrl} download="gemini-tts.wav">
              <Button variant="ghost">Download WAV</Button>
            </a>
          ) : null}
        </HStack>

        <Divider borderColor="whiteAlpha.300" />

        <VStack align="stretch" spacing={1} fontSize="sm" opacity={0.8}>
          <Text>
            Tip: steer realism with your prompt. E.g. start with{" "}
            <Kbd>Warm, natural human tone</Kbd>, add pace pauses:{" "}
            <Kbd>[pause 300ms]</Kbd>, or request breaths like{" "}
            <Kbd>(breath)</Kbd>.
          </Text>
          <Text>
            Uses <Kbd>@google/genai</Kbd> with{" "}
            <Kbd>config.responseModalities = ["AUDIO"]</Kbd> and{" "}
            <Kbd>speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName</Kbd>.
          </Text>
        </VStack>
      </VStack>
    </Center>
  );
}
