import { useEffect, useRef, useState } from "react";
import { Box, Button, HStack, Text, VStack, Alert, AlertIcon } from "@chakra-ui/react";
import { getRandomVoice, TTS_ENDPOINT } from "../utils/tts";

const SPANISH_PHRASES = [
  "Hola",
  "Buenos días",
  "Muchas gracias",
  "¿Cómo estás?",
  "Hasta luego",
];

export default function Experiments() {
  const audioRef = useRef(null);
  const [activePhrase, setActivePhrase] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

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

  useEffect(() => stopAudio, []);

  const explainGeminiLimitation = () => {
    setError("");
    setInfo(
      "Gemini TTS necesita una llamada de servidor para proteger la clave, así que no se puede ejecutar solo desde el navegador."
    );
  };

  const handleSpeak = async (phrase) => {
    stopAudio();
    setError("");
    setInfo("");
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

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

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

  return (
    <Box maxW="600px" mx="auto" mt={10} p={6} borderWidth="1px" borderRadius="lg" boxShadow="md">
      <VStack align="stretch" spacing={4}>
        <Text fontSize="xl" fontWeight="bold">
          Palabras con audio
        </Text>
        <Text color="gray.600">
          Pulsa en reproducir para escuchar cada frase a través de <code>/proxyTTS</code>.
        </Text>

        <Button variant="outline" size="sm" alignSelf="flex-start" onClick={explainGeminiLimitation}>
          ¿Gemini TTS sin /proxyTTS?
        </Button>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {info && (
          <Alert status="info">
            <AlertIcon />
            {info}
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
            <Button
              colorScheme="teal"
              size="sm"
              isLoading={activePhrase === phrase}
              onClick={() => handleSpeak(phrase)}
            >
              Reproducir
            </Button>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}
