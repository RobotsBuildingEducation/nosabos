import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SimpleGrid,
  VStack,
  Text,
  Badge,
  Heading,
  Alert,
  AlertIcon,
  Flex,
} from "@chakra-ui/react";
import { RUSSIAN_ALPHABET } from "../data/russianAlphabet";
import { JAPANESE_ALPHABET } from "../data/japaneseAlphabet";
import { FiVolume2 } from "react-icons/fi";
import { getTTSPlayer, TTS_LANG_TAG } from "../utils/tts";

function LetterCard({ letter, onPlay, isPlaying, appLanguage }) {
  const typeColor = useMemo(() => {
    switch (letter.type) {
      case "vowel":
        return "purple";
      case "consonant":
        return "teal";
      case "sign":
        return "orange";
      default:
        return "gray";
    }
  }, [letter.type]);

  const typeLabel =
    appLanguage === "es"
      ? letter.type === "vowel"
        ? "Vocal"
        : letter.type === "consonant"
        ? "Consonante"
        : "Signo"
      : letter.type.charAt(0).toUpperCase() + letter.type.slice(1);

  const sound = appLanguage === "es" ? letter.soundEs || letter.sound : letter.sound;
  const tip = appLanguage === "es" ? letter.tipEs || letter.tip : letter.tip;

  return (
    <VStack
      align="flex-start"
      spacing={2}
      bg="whiteAlpha.100"
      border="1px solid"
      borderColor="whiteAlpha.300"
      borderRadius="lg"
      p={4}
      boxShadow="0 10px 30px rgba(0,0,0,0.35)"
      color="white"
    >
      <Badge colorScheme={typeColor} borderRadius="md" px={2} py={1}>
        {typeLabel}
      </Badge>
      <Flex
        align="center"
        justify="space-between"
        w="100%"
        gap={3}
        minH="48px"
      >
        <VStack spacing={1} align="flex-start">
          <Text fontSize="2xl" fontWeight="bold">
            {letter.letter}
          </Text>
          <Text fontSize="lg" fontWeight="semibold">
            {letter.name}
          </Text>
        </VStack>
        {onPlay && (
          <Flex
            as="button"
            aria-label="Play sound"
            align="center"
            justify="center"
            bg="whiteAlpha.200"
            border="1px solid"
            borderColor="whiteAlpha.400"
            borderRadius="full"
            p={2}
            _hover={{ bg: "whiteAlpha.300" }}
            color={isPlaying ? "teal.200" : "white"}
            onClick={() => onPlay(letter)}
          >
            <FiVolume2 />
          </Flex>
        )}
      </Flex>
      <Text color="whiteAlpha.900">{sound}</Text>
      <Text fontSize="sm" color="whiteAlpha.800">
        {tip}
      </Text>
    </VStack>
  );
}

const LANGUAGE_ALPHABETS = {
  ru: RUSSIAN_ALPHABET,
  ja: JAPANESE_ALPHABET,
};

export default function AlphabetBootcamp({ appLanguage = "en", targetLang }) {
  const alphabet = LANGUAGE_ALPHABETS[targetLang] || RUSSIAN_ALPHABET;
  const playerRef = useRef(null);
  const [playingId, setPlayingId] = useState(null);
  const headline =
    appLanguage === "es"
      ? "Bootcamp de alfabeto"
      : "Alphabet Bootcamp";
  const subhead =
    appLanguage === "es"
      ? "Empieza aquí antes de entrar al árbol de habilidades."
      : "Start here before diving into the skill tree.";
  const note =
    appLanguage === "es"
      ? "Después de esto, cambia al modo Ruta en el menú para explorar las lecciones."
      : "After this, switch to Path mode in the menu to explore lessons.";
  const hasLetters = Array.isArray(alphabet) && alphabet.length;

  useEffect(() => {
    return () => {
      try {
        playerRef.current?.audio?.pause?.();
      } catch {}
      playerRef.current?.cleanup?.();
    };
  }, []);

  return (
    <VStack align="stretch" spacing={4} w="100%" color="white">
      <Heading size="lg" color="whiteAlpha.900">
        {headline}
      </Heading>
      <Text color="whiteAlpha.800">{subhead}</Text>
      <Alert status="info" borderRadius="lg" bg="blue.900" color="white">
        <AlertIcon />
        {note}
      </Alert>

      {hasLetters ? (
        <SimpleGrid
          columns={{ base: 1, sm: 2, md: 3 }}
          spacing={4}
          mt={2}
          zIndex={10}
          position="relative"
        >
          {alphabet.map((item) => (
            <LetterCard
              key={item.id}
              letter={item}
              appLanguage={appLanguage}
              isPlaying={playingId === item.id}
              onPlay={async (data) => {
                const text = (data?.tts || data?.letter || "").toString().trim();
                if (!text) return;

                // Toggle off if the same card is playing
                if (playingId === data.id) {
                  try {
                    playerRef.current?.audio?.pause?.();
                  } catch {}
                  playerRef.current?.cleanup?.();
                  setPlayingId(null);
                  return;
                }

                // Stop any existing playback
                try {
                  playerRef.current?.audio?.pause?.();
                } catch {}
                playerRef.current?.cleanup?.();

                try {
                  const player = await getTTSPlayer({
                    text,
                    langTag: TTS_LANG_TAG[targetLang] || TTS_LANG_TAG.es,
                  });
                  playerRef.current = player;
                  setPlayingId(data.id);

                  const audio = player.audio;
                  audio.onended = () => {
                    setPlayingId(null);
                    player.cleanup?.();
                  };
                  audio.onerror = () => {
                    setPlayingId(null);
                    player.cleanup?.();
                  };
                  await player.ready;
                  await audio.play();
                } catch (err) {
                  console.error("AlphabetBootcamp TTS failed", err);
                  setPlayingId(null);
                }
              }}
            />
          ))}
        </SimpleGrid>
      ) : (
        <Flex
          align="center"
          justify="center"
          bg="whiteAlpha.100"
          borderRadius="lg"
          border="1px solid"
          borderColor="whiteAlpha.300"
          p={6}
        >
          <Text color="whiteAlpha.800">
            {appLanguage === "es"
              ? "No pudimos cargar el alfabeto. Intenta nuevamente."
              : "We couldn’t load the alphabet. Please try again."}
          </Text>
        </Flex>
      )}
    </VStack>
  );
}
