import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Collapse,
  Container,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { RiSpeakLine } from "react-icons/ri";
import { LuBot, LuSparkles, LuGlobe } from "react-icons/lu";

const featureCards = [
  {
    title: "AI speaking partner",
    description:
      "Practice real conversations with a friendly bot that adapts to your level and goals.",
    icon: LuBot,
  },
  {
    title: "Personalized lessons",
    description:
      "Follow curated stories, drills, and reviews that respond to how you learn best.",
    icon: LuSparkles,
  },
  {
    title: "Global classrooms",
    description:
      "Join a community of learners trading prompts, challenges, and cultural insights.",
    icon: LuGlobe,
  },
];

function LandingPage({ onSubmit, isSubmitting = false, errorMessage = "" }) {
  const [username, setUsername] = useState("");
  const [touched, setTouched] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const trimmedName = username.trim();
  const isInvalid = touched && !trimmedName;

  useEffect(() => {
    if (errorMessage) {
      setShowSignup(true);
    }
  }, [errorMessage]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (!trimmedName || isSubmitting) return;
    onSubmit?.(trimmedName);
  };

  return (
    <Flex
      minH="100vh"
      bgGradient="linear(to-br, gray.950, gray.900)"
      color="gray.50"
      py={[10, 16, 24]}
    >
      <Container maxW="6xl">
        <VStack spacing={[12, 16]} align="stretch">
          <Flex
            direction={{ base: "column", lg: "row" }}
            align={{ base: "center", lg: "flex-start" }}
            gap={[10, 16]}
          >
            <VStack
              align={{ base: "center", lg: "flex-start" }}
              spacing={6}
              textAlign={{ base: "center", lg: "left" }}
              flex="1"
            >
              <Flex
                w={16}
                h={16}
                borderRadius="full"
                bg="teal.400"
                align="center"
                justify="center"
                boxShadow="0 20px 40px rgba(45, 212, 191, 0.35)"
              >
                <RiSpeakLine size="2rem" />
              </Flex>
              <Badge colorScheme="teal" borderRadius="full" px={3} py={1}>
                Language learning that listens to you
              </Badge>
              <Heading size="2xl" maxW="560px">
                Meet Nosabos, your immersive Spanish study buddy.
              </Heading>
              <Text fontSize={{ base: "lg", md: "xl" }} color="gray.200" maxW="600px">
                Build confidence through interactive stories, real-time speaking drills,
                and smart reviews powered by Nostr so your progress stays yours.
              </Text>
              <Stack
                direction={{ base: "column", sm: "row" }}
                spacing={4}
                align={{ base: "stretch", sm: "center" }}
              >
                <Button
                  size="lg"
                  colorScheme="teal"
                  onClick={() => setShowSignup(true)}
                  isDisabled={isSubmitting}
                >
                  Start learning now
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  colorScheme="teal"
                  onClick={() => setShowSignup(true)}
                  isDisabled={isSubmitting}
                >
                  Create a free account
                </Button>
              </Stack>
              <Text fontSize="sm" color="gray.400">
                No email required—your Nostr keys keep everything private and portable.
              </Text>
            </VStack>

            <Box
              bg="blackAlpha.400"
              borderRadius="2xl"
              p={{ base: 6, md: 8 }}
              flex="1"
              maxW={{ base: "full", lg: "480px" }}
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Heading size="md" mb={4}>
                What makes Nosabos different?
              </Heading>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={6}>
                {featureCards.map(({ title, description, icon: Icon }) => (
                  <VStack key={title} align="flex-start" spacing={2}>
                    <Flex
                      align="center"
                      justify="center"
                      w={10}
                      h={10}
                      borderRadius="lg"
                      bg="teal.500"
                      color="gray.900"
                    >
                      <Icon size="1.25rem" />
                    </Flex>
                    <Text fontWeight="semibold">{title}</Text>
                    <Text fontSize="sm" color="gray.300">
                      {description}
                    </Text>
                  </VStack>
                ))}
              </SimpleGrid>
            </Box>
          </Flex>

          <Collapse in={showSignup} animateOpacity>
            <Box
              as="form"
              onSubmit={handleSubmit}
              bg="blackAlpha.500"
              borderRadius="2xl"
              p={{ base: 6, md: 8 }}
              border="1px solid"
              borderColor="whiteAlpha.200"
              maxW="600px"
              mx="auto"
              backdropFilter="blur(8px)"
            >
              <VStack align="stretch" spacing={4}>
                <Heading size="md">Claim your username</Heading>
                <Text color="gray.200">
                  Choose the name you want friends to see. We generate your secure Nostr keys right in your browser.
                </Text>
                <FormControl isInvalid={isInvalid}>
                  <FormLabel>Username</FormLabel>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder="e.g. coding-ace"
                    size="lg"
                    bg="gray.800"
                    borderColor="gray.700"
                    _hover={{ borderColor: "teal.300" }}
                    _focusVisible={{
                      borderColor: "teal.200",
                      boxShadow: "0 0 0 1px rgba(129, 230, 217, 0.45)",
                    }}
                  />
                  <FormErrorMessage>Choose a username to continue.</FormErrorMessage>
                </FormControl>

                {errorMessage ? (
                  <Text color="red.200" fontSize="sm">
                    {errorMessage}
                  </Text>
                ) : null}

                <Stack direction={{ base: "column", sm: "row" }} spacing={4}>
                  <Button
                    type="submit"
                    colorScheme="teal"
                    size="lg"
                    isLoading={isSubmitting}
                    loadingText="Generating keys"
                    flex="1"
                  >
                    Continue into Nosabos
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    colorScheme="teal"
                    onClick={() => setShowSignup(false)}
                    isDisabled={isSubmitting}
                  >
                    Maybe later
                  </Button>
                </Stack>
              </VStack>
            </Box>
          </Collapse>
        </VStack>
      </Container>
    </Flex>
  );
}

export default LandingPage;
