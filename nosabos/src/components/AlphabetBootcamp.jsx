import React, { useMemo } from "react";
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

function LetterCard({ letter }) {
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
        {letter.type.charAt(0).toUpperCase() + letter.type.slice(1)}
      </Badge>
      <Text fontSize="2xl" fontWeight="bold">
        {letter.letter}
      </Text>
      <Text fontSize="lg" fontWeight="semibold">
        {letter.name}
      </Text>
      <Text color="whiteAlpha.900">{letter.sound}</Text>
      <Text fontSize="sm" color="whiteAlpha.800">
        {letter.tip}
      </Text>
    </VStack>
  );
}

export default function AlphabetBootcamp({ appLanguage = "en" }) {
  const headline =
    appLanguage === "es"
      ? "Bootcamp de alfabeto ruso"
      : "Russian Alphabet Bootcamp";
  const subhead =
    appLanguage === "es"
      ? "Empieza aquí antes de entrar al árbol de habilidades."
      : "Start here before diving into the skill tree.";
  const note =
    appLanguage === "es"
      ? "Después de esto, cambia al modo Ruta en el menú para explorar las lecciones."
      : "After this, switch to Path mode in the menu to explore lessons.";
  const hasLetters = Array.isArray(RUSSIAN_ALPHABET) && RUSSIAN_ALPHABET.length;

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
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4} mt={2}>
          {RUSSIAN_ALPHABET.map((item) => (
            <LetterCard key={item.id} letter={item} />
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
