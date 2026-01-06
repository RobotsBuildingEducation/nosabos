import React, { useMemo } from "react";
import {
  Box,
  SimpleGrid,
  VStack,
  Text,
  Badge,
  Heading,
  Alert,
  AlertIcon,
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
      bg="gray.800"
      border="1px solid"
      borderColor="whiteAlpha.200"
      borderRadius="lg"
      p={4}
      boxShadow="0 8px 24px rgba(0,0,0,0.25)"
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
      <Text color="whiteAlpha.800">{letter.sound}</Text>
      <Text fontSize="sm" color="whiteAlpha.700">
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

  return (
    <VStack align="stretch" spacing={4} w="100%">
      <Heading size="lg">{headline}</Heading>
      <Text color="whiteAlpha.800">{subhead}</Text>
      <Alert status="info" borderRadius="lg" bg="blue.900" color="white">
        <AlertIcon />
        {note}
      </Alert>

      <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4} mt={2}>
        {RUSSIAN_ALPHABET.map((item) => (
          <LetterCard key={item.id} letter={item} />
        ))}
      </SimpleGrid>
    </VStack>
  );
}
