import React, { useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Center,
  Input,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { GoogleGenAI } from "@google/genai";

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
    const reader = new FileReader();
    reader.onloadend = () => {
      const data = reader.result.split(",")[1];
      resolve(data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function VoiceChat() {
  const toast = useToast();
  const [apiKeyInput, setApiKeyInput] = useState(
    import.meta?.env?.VITE_GEMINI_API_KEY || ""
  );
  const ai = useMemo(() => {
    if (!apiKeyInput) return null;
    return new GoogleGenAI({ apiKey: apiKeyInput });
  }, [apiKeyInput]);

  const [recording, setRecording] = useState(false);
  const [history, setHistory] = useState([]);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);

  const startRecording = async () => {
    try {
      if (!ai) {
        toast({ title: "Add your API key first", status: "warning" });
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = handleStop;
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (e) {
      console.error(e);
      toast({ title: "Microphone error", description: String(e), status: "error" });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleStop = async () => {
    try {
      const blob = new Blob(chunksRef.current, {
        type: mediaRecorderRef.current.mimeType,
      });
      const b64 = await blobToBase64(blob);
      const contents = [
        {
          role: "user",
          parts: [
            {
              text:
                "You are a friendly Spanish tutor. Respond only in Spanish and keep answers short.",
            },
          ],
        },
        ...history,
        {
          role: "user",
          parts: [{ inlineData: { data: b64, mimeType: blob.type } }],
        },
      ];

      // First, send the conversation (audio input) to a chat model.
      const chatResp = await ai.models.generateContent({
        // Use a generally available model so the request succeeds for most users.
        model: "gemini-1.5-flash",
        contents,
      });

      const textReply =
        chatResp?.candidates?.[0]?.content?.parts.find((p) => p.text)?.text ||
        "";

      let audioB64 = null;
      if (textReply) {
        // Convert the model's text reply to speech using the same model.
        const ttsResp = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: [
            {
              role: "user",
              parts: [{ text: textReply }],
            },
          ],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Puck" },
              },
            },
          },
        });

        audioB64 =
          ttsResp?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)
            ?.inlineData?.data || null;

        if (audioB64) {
          const pcm = b64ToUint8(audioB64);
          const wav = pcm16ToWav(pcm, 24000, 1);
          const url = URL.createObjectURL(wav);
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => URL.revokeObjectURL(url);
          await audio.play();
        }
      }

      setHistory((prev) => [
        ...prev,
        { role: "user", parts: [{ inlineData: { data: b64, mimeType: blob.type } }] },
        { role: "model", parts: [{ text: textReply }] },
      ]);
    } catch (e) {
      console.error(e);
      toast({
        title: "Conversation failed",
        description: String(e.message || e),
        status: "error",
      });
    }
  };

  return (
    <Center minH="100vh" p={6} bg="gray.900" color="gray.100">
      <VStack w="full" maxW="600px" spacing={6} align="stretch">
        <Text fontSize="2xl" fontWeight="bold">
          No Sabo App
        </Text>
        <Input
          type="password"
          placeholder="GEMINI API Key"
          value={apiKeyInput}
          onChange={(e) => setApiKeyInput(e.target.value)}
          bg="gray.800"
        />
        <Button
          colorScheme={recording ? "red" : "teal"}
          onClick={recording ? stopRecording : startRecording}
        >
          {recording ? "Stop" : "Talk"}
        </Button>
        {history
          .filter((c) => c.role === "model")
          .map((m, idx) => (
            <Box key={idx} bg="gray.800" p={3} borderRadius="md">
              {m.parts[0].text}
            </Box>
          ))}
      </VStack>
    </Center>
  );
}
