import React, { useCallback, useMemo, useState } from "react";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Checkbox,
  Flex,
  Grid,
  GridItem,
  HStack,
  Icon,
  Input,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { ArrowForwardIcon, LockIcon, RepeatIcon } from "@chakra-ui/icons";
import { FiBookOpen, FiMessageCircle, FiMic, FiTarget } from "react-icons/fi";

import { useDecentralizedIdentity } from "../hooks/useDecentralizedIdentity";

const FAQ_ITEMS = [
  {
    question: "What happens when I create an account?",
    answer:
      "We generate a secure key that unlocks your personal study space. Keep it safe—it's the only way to sign in from another device.",
  },
  {
    question: "Do I need to know anything about blockchains or Nostr?",
    answer:
      "No. We take care of the technical details for you. All you need is your key to come back to your lessons.",
  },
  {
    question: "Which languages can I practice?",
    answer:
      "Start with Spanish or English right away, then explore Nahuatl-inspired cultural modules and more advanced grammar labs as you progress.",
  },
  {
    question: "Is there a cost?",
    answer:
      "The core practice tools are free. Some advanced labs and live workshops may require scholarships or paid access—those details appear inside the app when available.",
  },
];

const FEATURE_CARDS = [
  {
    title: "Live Conversation Studio",
    description:
      "Practice speaking with responsive AI partners that adapt to your level and provide gentle corrections in real time.",
    icon: FiMessageCircle,
  },
  {
    title: "Grammar & Structure Coach",
    description:
      "Interactive walkthroughs break down tricky grammar topics with examples, micro-quizzes, and tailored drills.",
    icon: FiBookOpen,
  },
  {
    title: "Vocabulary Builders",
    description:
      "Grow your word bank with spaced review lists, contextual flashcards, and audio recordings you can mimic.",
    icon: FiTarget,
  },
  {
    title: "Pronunciation Lab",
    description:
      "Record yourself, compare waveforms, and receive pronunciation guidance that targets the sounds you struggle with most.",
    icon: FiMic,
  },
];

const VALUE_POINTS = [
  "Personalized study paths generated from every conversation",
  "Daily goals that track your streaks and celebrate milestones",
  "Lesson summaries and transcripts you can download anytime",
  "Community prompts that keep you motivated and curious",
];

const LandingSection = ({ children, ...rest }) => (
  <Box
    as="section"
    width="100%"
    maxWidth="1200px"
    px={{ base: 6, md: 10 }}
    py={{ base: 12, md: 16 }}
    {...rest}
  >
    {children}
  </Box>
);

const HeroBackground = () => (
  <Box
    position="absolute"
    inset={0}
    bgGradient="linear(to-br, #fef3f7, #f4f1ff)"
    zIndex={-2}
  />
);

const HeroOverlay = () => (
  <Box
    position="absolute"
    inset={0}
    bgImage="radial-gradient(circle at 15% 20%, rgba(255, 176, 189, 0.35), transparent 45%), radial-gradient(circle at 80% 10%, rgba(162, 132, 255, 0.35), transparent 45%), radial-gradient(circle at 40% 80%, rgba(255, 214, 153, 0.35), transparent 40%)"
    zIndex={-1}
  />
);

const defaultLoadingMessage = "Setting up your study space...";

const LandingPage = ({ onAuthenticated }) => {
  const toast = useToast();
  const { generateNostrKeys, auth } = useDecentralizedIdentity(
    typeof window !== "undefined" ? localStorage.getItem("local_npub") : "",
    typeof window !== "undefined" ? localStorage.getItem("local_nsec") : ""
  );

  const [view, setView] = useState("landing");
  const [displayName, setDisplayName] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [generatedKeys, setGeneratedKeys] = useState(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(defaultLoadingMessage);
  const [errorMessage, setErrorMessage] = useState("");

  const hasDisplayName = displayName.trim().length >= 2;

  const handleCreateAccount = useCallback(async () => {
    if (!hasDisplayName || isCreatingAccount) return;
    setIsCreatingAccount(true);
    setAcknowledged(false);
    setGeneratedKeys(null);
    setLoadingMessage(defaultLoadingMessage);
    setErrorMessage("");

    try {
      const keys = await generateNostrKeys(displayName.trim());
      setGeneratedKeys(keys);
      localStorage.setItem("displayName", displayName.trim());
      setView("created");
      toast({
        title: "Account created",
        description: "Save your secret key before you continue.",
        status: "success",
        duration: 2500,
      });
    } catch (error) {
      console.error("Failed to create account", error);
      setErrorMessage(error?.message || "Something went wrong. Please try again.");
    } finally {
      setIsCreatingAccount(false);
    }
  }, [displayName, generateNostrKeys, hasDisplayName, isCreatingAccount, toast]);

  const handleCopyKey = useCallback(() => {
    if (!generatedKeys?.nsec) return;
    navigator.clipboard
      .writeText(generatedKeys.nsec)
      .then(() =>
        toast({
          title: "Secret key copied",
          description: "Store it somewhere safe—it's your only way back in.",
          status: "info",
          duration: 2400,
        })
      )
      .catch(() =>
        toast({
          title: "Copy failed",
          description: "Select the key manually if clipboard access is blocked.",
          status: "error",
          duration: 2400,
        })
      );
  }, [generatedKeys?.nsec, toast]);

  const handleSignIn = useCallback(async () => {
    if (!secretKey.trim()) return;
    setIsSigningIn(true);
    setErrorMessage("");
    try {
      const result = await auth(secretKey.trim());
      if (!result) {
        throw new Error("We couldn't verify that key. Check it and try again.");
      }
      toast({
        title: "Welcome back!",
        status: "success",
        duration: 2000,
      });
      onAuthenticated?.();
    } catch (error) {
      console.error("Failed to sign in", error);
      setErrorMessage(error?.message || "We couldn't sign you in. Try again.");
    } finally {
      setIsSigningIn(false);
    }
  }, [auth, onAuthenticated, secretKey, toast]);

  const handleLaunch = useCallback(() => {
    if (!acknowledged) return;
    onAuthenticated?.();
  }, [acknowledged, onAuthenticated]);

  const heroCta = useMemo(
    () => (
      <VStack
        spacing={4}
        alignItems="stretch"
        bg="whiteAlpha.900"
        borderRadius="xl"
        boxShadow="lg"
        p={{ base: 6, md: 8 }}
      >
        <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="semibold">
          Create your free account
        </Text>
        <Text fontSize="sm" color="gray.600">
          Choose a display name and we will prepare your secure study profile. All you need to remember is the secret key you receive.
        </Text>
        <Stack direction={{ base: "column", md: "row" }} spacing={3}>
          <Input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Display name"
            bg="white"
            borderColor="gray.200"
          />
          <Button
            colorScheme="pink"
            rightIcon={<ArrowForwardIcon />}
            onClick={handleCreateAccount}
            isLoading={isCreatingAccount}
            isDisabled={!hasDisplayName}
          >
            {isCreatingAccount ? "Creating" : "Create account"}
          </Button>
        </Stack>
        <Button
          variant="ghost"
          onClick={() => setView("signIn")}
          textDecoration="underline"
        >
          Already have a key? Sign in
        </Button>
        {errorMessage && view === "landing" && (
          <Text color="red.500" fontSize="sm">
            {errorMessage}
          </Text>
        )}
      </VStack>
    ),
    [
      displayName,
      errorMessage,
      handleCreateAccount,
      hasDisplayName,
      isCreatingAccount,
      view,
    ]
  );

  if (view === "signIn") {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.50" px={4}>
        <VStack
          spacing={6}
          align="stretch"
          maxW="md"
          w="full"
          bg="white"
          boxShadow="lg"
          borderRadius="xl"
          p={{ base: 6, md: 8 }}
        >
          <Text fontSize="2xl" fontWeight="bold">
            Welcome back
          </Text>
          <Text fontSize="sm" color="gray.600">
            Paste the secret key you saved when you first created an account.
          </Text>
          <Input
            value={secretKey}
            onChange={(event) => setSecretKey(event.target.value)}
            placeholder="Paste your secret key"
            bg="white"
          />
          {errorMessage && (
            <Text color="red.500" fontSize="sm">
              {errorMessage}
            </Text>
          )}
          <Button
            colorScheme="pink"
            onClick={handleSignIn}
            isLoading={isSigningIn}
            rightIcon={<LockIcon />}
          >
            Sign in
          </Button>
          <Button variant="ghost" onClick={() => setView("landing")}>
            Back to landing page
          </Button>
        </VStack>
      </Flex>
    );
  }

  if (view === "created") {
    return (
      <Flex
        minH="100vh"
        align="center"
        justify="center"
        bg="gray.50"
        px={4}
        py={{ base: 12, md: 16 }}
      >
        <VStack
          spacing={6}
          align="stretch"
          maxW="lg"
          w="full"
          bg="white"
          boxShadow="xl"
          borderRadius="2xl"
          p={{ base: 6, md: 10 }}
        >
          <HStack spacing={3}>
            <Icon as={RepeatIcon} color="pink.400" boxSize={6} />
            <Text fontSize="2xl" fontWeight="bold">
              Save your secret key
            </Text>
          </HStack>
          <Text color="gray.600">
            This key is the only way to access your study progress. Store it in a password manager or another safe place. We cannot recover it for you.
          </Text>
          <Box
            border="1px dashed"
            borderColor="pink.200"
            borderRadius="lg"
            p={4}
            bg="pink.50"
            fontFamily="mono"
            fontSize="sm"
            wordBreak="break-all"
          >
            {generatedKeys?.nsec || "Generating key..."}
          </Box>
          <Stack direction={{ base: "column", md: "row" }} spacing={4}>
            <Button colorScheme="pink" variant="outline" onClick={handleCopyKey}>
              Copy key
            </Button>
            <Button
              colorScheme="pink"
              isDisabled={!acknowledged}
              onClick={handleLaunch}
              rightIcon={<ArrowForwardIcon />}
            >
              Start learning
            </Button>
          </Stack>
          <Checkbox
            isChecked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
          >
            I understand that I must store this key securely to keep my account.
          </Checkbox>
          {isCreatingAccount && (
            <HStack color="gray.500">
              <Spinner size="sm" />
              <Text fontSize="sm">{loadingMessage}</Text>
            </HStack>
          )}
          <Button
            variant="ghost"
            onClick={() => setView("landing")}
            textDecoration="underline"
          >
            Make another account
          </Button>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box position="relative" overflow="hidden" minH="100vh">
      <HeroBackground />
      <HeroOverlay />
      <Flex
        direction="column"
        align="center"
        justify="flex-start"
        minH="100vh"
        gap={{ base: 12, md: 16 }}
      >
        <LandingSection pt={{ base: 20, md: 28 }} pb={{ base: 12, md: 20 }}>
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={12}>
            <GridItem>
              <VStack align="flex-start" spacing={6}>
                <Box bg="white" borderRadius="full" px={4} py={1} boxShadow="sm">
                  <Text fontSize="sm" fontWeight="medium" color="pink.500">
                    Language practice for future-ready students
                  </Text>
                </Box>
                <Text fontSize={{ base: "3xl", md: "4xl" }} fontWeight="black" lineHeight="1.1">
                  Build confidence in Spanish, English, and beyond with an AI-powered coach by your side.
                </Text>
                <Text fontSize="lg" color="gray.600">
                  Nosabos turns everyday curiosity into language superpowers. Chat, drill, and explore cultural stories while our tutors adapt to your goals.
                </Text>
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} w="full">
                  {VALUE_POINTS.map((point) => (
                    <HStack
                      key={point}
                      align="flex-start"
                      spacing={3}
                      bg="white"
                      borderRadius="lg"
                      px={4}
                      py={3}
                      boxShadow="sm"
                    >
                      <Icon as={ArrowForwardIcon} color="pink.400" />
                      <Text fontSize="sm" color="gray.600">
                        {point}
                      </Text>
                    </HStack>
                  ))}
                </SimpleGrid>
              </VStack>
            </GridItem>
            <GridItem>{heroCta}</GridItem>
          </Grid>
        </LandingSection>

        <LandingSection bg="white">
          <VStack spacing={8} align="stretch">
            <Text textAlign="center" fontSize="3xl" fontWeight="bold">
              Everything you need to grow your language skills
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              {FEATURE_CARDS.map((feature) => (
                <Box
                  key={feature.title}
                  p={6}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="gray.100"
                  bg="gray.50"
                  boxShadow="sm"
                >
                  <VStack align="flex-start" spacing={4}>
                    <Icon as={feature.icon} color="pink.400" boxSize={8} />
                    <Text fontSize="xl" fontWeight="semibold">
                      {feature.title}
                    </Text>
                    <Text color="gray.600">{feature.description}</Text>
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>
          </VStack>
        </LandingSection>

        <LandingSection bg="gray.50">
          <VStack spacing={6} align="stretch">
            <Text textAlign="center" fontSize="3xl" fontWeight="bold">
              Why learners choose Nosabos
            </Text>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <Box bg="white" borderRadius="xl" p={6} boxShadow="md">
                <Text fontSize="lg" fontWeight="semibold" mb={3}>
                  Daily progress tracking
                </Text>
                <Text color="gray.600">
                  Unlock streak celebrations and see how much XP you earn from every activity. Goals adjust to your pace so you stay motivated.
                </Text>
              </Box>
              <Box bg="white" borderRadius="xl" p={6} boxShadow="md">
                <Text fontSize="lg" fontWeight="semibold" mb={3}>
                  Cultural storytelling
                </Text>
                <Text color="gray.600">
                  Explore legends, community news, and bilingual prompts that connect language learning to lived experiences.
                </Text>
              </Box>
              <Box bg="white" borderRadius="xl" p={6} boxShadow="md">
                <Text fontSize="lg" fontWeight="semibold" mb={3}>
                  Learning on your terms
                </Text>
                <Text color="gray.600">
                  Swap between writing, speaking, and comprehension tasks anytime. Our tutor adapts to your schedule and comfort level.
                </Text>
              </Box>
            </SimpleGrid>
          </VStack>
        </LandingSection>

        <LandingSection bg="white">
          <VStack spacing={6} align="stretch">
            <Text textAlign="center" fontSize="3xl" fontWeight="bold">
              Frequently asked questions
            </Text>
            <Accordion allowMultiple borderRadius="xl" bg="white" boxShadow="lg">
              {FAQ_ITEMS.map((item) => (
                <AccordionItem key={item.question} border="none">
                  <h3>
                    <AccordionButton px={6} py={5}>
                      <Box flex="1" textAlign="left" fontWeight="semibold">
                        {item.question}
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h3>
                  <AccordionPanel px={6} pb={6} color="gray.600">
                    {item.answer}
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          </VStack>
        </LandingSection>

        <LandingSection bg="gray.900" color="white" borderTopRadius="3xl">
          <VStack spacing={6} align="center">
            <Text fontSize="3xl" fontWeight="bold" textAlign="center">
              Ready to begin?
            </Text>
            <Text textAlign="center" maxW="2xl" color="gray.200">
              Create an account in seconds and get instant access to all of the conversation tools, grammar labs, and vocabulary builders.
            </Text>
            <Stack direction={{ base: "column", sm: "row" }} spacing={4} w="full" maxW="lg">
              <Input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Display name"
                bg="white"
                color="gray.800"
              />
              <Button
                flexShrink={0}
                colorScheme="pink"
                rightIcon={<ArrowForwardIcon />}
                onClick={handleCreateAccount}
                isLoading={isCreatingAccount}
                isDisabled={!hasDisplayName}
              >
                Create account
              </Button>
            </Stack>
            <Button variant="link" color="pink.200" onClick={() => setView("signIn")}>
              I already have a key
            </Button>
          </VStack>
        </LandingSection>
      </Flex>
    </Box>
  );
};

export default LandingPage;
