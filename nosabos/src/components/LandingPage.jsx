import React, { useCallback, useState } from "react";
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
import {
  FiBookOpen,
  FiCompass,
  FiLayers,
  FiMessageCircle,
  FiShuffle,
  FiTarget,
} from "react-icons/fi";

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
    title: "Real-time conversations",
    description:
      "Stay immersed with responsive dialogues that coach you through speaking and listening in the moment.",
    icon: FiMessageCircle,
  },
  {
    title: "Stories for reading & speaking",
    description:
      "Follow interactive stories that invite you to read aloud, summarize, and role-play every scene.",
    icon: FiBookOpen,
  },
  {
    title: "History lectures",
    description:
      "Explore bilingual briefings on key historical moments to expand your cultural and academic vocabulary.",
    icon: FiLayers,
  },
  {
    title: "Grammar book & vocabulary",
    description:
      "Check rules quickly, drill tricky concepts, and test yourself with adaptive vocab review sets.",
    icon: FiTarget,
  },
  {
    title: "Job scripts",
    description:
      "Practice professional dialogues so you can present, interview, and collaborate with confidence.",
    icon: FiCompass,
  },
  {
    title: "Random mode",
    description:
      "Mix up your routine with surprise prompts that blend speaking, reading, and listening challenges.",
    icon: FiShuffle,
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
    bgGradient="linear(to-br, #0f172a, #1e1b4b)"
    zIndex={-2}
  />
);

const HeroOverlay = () => (
  <Box
    position="absolute"
    inset={0}
    bgImage="radial-gradient(circle at 20% 20%, rgba(79, 70, 229, 0.35), transparent 45%), radial-gradient(circle at 80% 10%, rgba(236, 72, 153, 0.25), transparent 45%), radial-gradient(circle at 40% 80%, rgba(56, 189, 248, 0.2), transparent 40%)"
    zIndex={-1}
  />
);

const defaultLoadingMessage = "Setting up your study space...";

const BASE_BUTTON_PROPS = {
  size: "lg",
  fontWeight: "bold",
};

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

  const ActionButton = (props) => <Button {...BASE_BUTTON_PROPS} {...props} />;

  if (view === "signIn") {
    return (
      <Flex
        minH="100vh"
        align="center"
        justify="center"
        bg="gray.900"
        color="gray.100"
        px={4}
      >
        <VStack
          spacing={6}
          align="stretch"
          maxW="md"
          w="full"
          bg="rgba(15, 23, 42, 0.95)"
          boxShadow="2xl"
          borderRadius="xl"
          border="1px solid rgba(148, 163, 184, 0.2)"
          p={{ base: 6, md: 8 }}
        >
          <Text fontSize="2xl" fontWeight="bold">
            Welcome back
          </Text>
          <Text fontSize="sm" color="gray.300">
            Paste the secret key you saved when you first created an account.
          </Text>
          <Input
            value={secretKey}
            onChange={(event) => setSecretKey(event.target.value)}
            placeholder="Paste your secret key"
            bg="rgba(17, 24, 39, 0.9)"
            borderColor="rgba(148, 163, 184, 0.4)"
            color="white"
            _placeholder={{ color: "gray.500" }}
          />
          {errorMessage && (
            <Text color="red.300" fontSize="sm">
              {errorMessage}
            </Text>
          )}
          <ActionButton
            colorScheme="purple"
            onClick={handleSignIn}
            isLoading={isSigningIn}
            rightIcon={<LockIcon />}
          >
            Sign in
          </ActionButton>
          <ActionButton colorScheme="gray" onClick={() => setView("landing")}>
            Back
          </ActionButton>
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
        bg="gray.900"
        color="gray.100"
        px={4}
        py={{ base: 12, md: 16 }}
      >
        <VStack
          spacing={6}
          align="stretch"
          maxW="lg"
          w="full"
          bg="rgba(15, 23, 42, 0.95)"
          boxShadow="2xl"
          borderRadius="2xl"
          border="1px solid rgba(148, 163, 184, 0.2)"
          p={{ base: 6, md: 10 }}
        >
          <HStack spacing={3}>
            <Icon as={RepeatIcon} color="pink.300" boxSize={6} />
            <Text fontSize="2xl" fontWeight="bold">
              Save your secret key
            </Text>
          </HStack>
          <Text color="gray.300">
            This key is the only way to access your study progress. Store it in a password manager or another safe place. We cannot recover it for you.
          </Text>
          <Box
            border="1px dashed"
            borderColor="rgba(236, 72, 153, 0.4)"
            borderRadius="lg"
            p={4}
            bg="rgba(24, 24, 27, 0.7)"
            fontFamily="mono"
            fontSize="sm"
            wordBreak="break-all"
          >
            {generatedKeys?.nsec || "Generating key..."}
          </Box>
          <Stack direction={{ base: "column", md: "row" }} spacing={4}>
            <ActionButton colorScheme="pink" onClick={handleCopyKey}>
              Copy key
            </ActionButton>
            <ActionButton
              colorScheme="purple"
              isDisabled={!acknowledged}
              onClick={handleLaunch}
              rightIcon={<ArrowForwardIcon />}
            >
              Start learning
            </ActionButton>
          </Stack>
          <Checkbox
            isChecked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            colorScheme="pink"
          >
            I understand that I must store this key securely to keep my account.
          </Checkbox>
          {isCreatingAccount && (
            <HStack color="gray.400">
              <Spinner size="sm" />
              <Text fontSize="sm">{loadingMessage}</Text>
            </HStack>
          )}
          <ActionButton colorScheme="gray" onClick={() => setView("landing")}>
            Make another account
          </ActionButton>
        </VStack>
      </Flex>
    );
  }

  if (view === "features") {
    return (
      <Box position="relative" minH="100vh" bg="gray.900" color="gray.100" pb={20}>
        <HeroBackground />
        <HeroOverlay />
        <Flex direction="column" align="center" px={{ base: 4, md: 8 }} py={{ base: 10, md: 16 }} gap={12}>
          <VStack spacing={4} align="center" textAlign="center" maxW="3xl">
            <Text fontSize="4xl" fontWeight="black">
              Explore the toolkit that keeps your language practice fresh
            </Text>
            <Text color="gray.300" fontSize="lg">
              Dive into stories, live conversations, lectures, and drills designed to stretch every skill—then jump back to create your account when you're ready.
            </Text>
            <ActionButton colorScheme="purple" onClick={() => setView("landing")} rightIcon={<ArrowForwardIcon />}>
              Create an account
            </ActionButton>
          </VStack>

          <LandingSection bg="rgba(17, 24, 39, 0.75)" borderRadius="3xl">
            <VStack spacing={8} align="stretch">
              <Text textAlign="center" fontSize="3xl" fontWeight="bold" color="white">
                How Nosabos guides your learning
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {VALUE_POINTS.map((point) => (
                  <HStack
                    key={point}
                    align="flex-start"
                    spacing={3}
                    bg="rgba(15, 23, 42, 0.9)"
                    borderRadius="lg"
                    px={4}
                    py={4}
                    border="1px solid rgba(148, 163, 184, 0.2)"
                  >
                    <Icon as={ArrowForwardIcon} color="pink.300" mt={1} />
                    <Text color="gray.300">{point}</Text>
                  </HStack>
                ))}
              </SimpleGrid>
            </VStack>
          </LandingSection>

          <LandingSection bg="rgba(24, 24, 27, 0.75)" borderRadius="3xl">
            <VStack spacing={8} align="stretch">
              <Text textAlign="center" fontSize="3xl" fontWeight="bold" color="white">
                What you can do inside the app today
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {FEATURE_CARDS.map((feature) => (
                  <Box
                    key={feature.title}
                    p={6}
                    borderRadius="xl"
                    border="1px solid rgba(148, 163, 184, 0.25)"
                    bg="rgba(15, 23, 42, 0.95)"
                    boxShadow="xl"
                  >
                    <VStack align="flex-start" spacing={4}>
                      <Icon as={feature.icon} color="pink.300" boxSize={8} />
                      <Text fontSize="xl" fontWeight="semibold" color="white">
                        {feature.title}
                      </Text>
                      <Text color="gray.300">{feature.description}</Text>
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            </VStack>
          </LandingSection>

          <LandingSection bg="rgba(17, 24, 39, 0.9)" borderRadius="3xl" border="1px solid rgba(148, 163, 184, 0.2)">
            <VStack spacing={6} align="center">
              <Text fontSize="3xl" fontWeight="bold" textAlign="center">
                Ready to jump in?
              </Text>
              <Text textAlign="center" color="gray.300" maxW="2xl">
                Create your secure profile in seconds, save your key, and unlock every mode you just explored.
              </Text>
              <ActionButton colorScheme="purple" onClick={() => setView("landing")} rightIcon={<ArrowForwardIcon />}>
                Create an account
              </ActionButton>
              <ActionButton colorScheme="gray" onClick={() => setView("signIn")}>
                I already have a key
              </ActionButton>
            </VStack>
          </LandingSection>

          <LandingSection bg="rgba(15, 23, 42, 0.95)" borderRadius="3xl">
            <VStack spacing={6} align="stretch">
              <Text textAlign="center" fontSize="3xl" fontWeight="bold" color="white">
                Frequently asked questions
              </Text>
              <Accordion allowMultiple borderRadius="xl" bg="rgba(15, 23, 42, 0.95)" boxShadow="2xl" border="1px solid rgba(148, 163, 184, 0.25)">
                {FAQ_ITEMS.map((item) => (
                  <AccordionItem key={item.question} border="none">
                    <h3>
                      <AccordionButton px={6} py={5}>
                        <Box flex="1" textAlign="left" fontWeight="semibold" color="white">
                          {item.question}
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h3>
                    <AccordionPanel px={6} pb={6} color="gray.300">
                      {item.answer}
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            </VStack>
          </LandingSection>
        </Flex>
      </Box>
    );
  }

  return (
    <Flex
      position="relative"
      minH="100vh"
      bg="gray.900"
      color="gray.100"
      align="center"
      justify="center"
      px={{ base: 4, md: 8 }}
      py={{ base: 12, md: 20 }}
      textAlign="center"
    >
      <HeroBackground />
      <HeroOverlay />
      <VStack
        spacing={8}
        bg="rgba(17, 24, 39, 0.9)"
        borderRadius="3xl"
        border="1px solid rgba(148, 163, 184, 0.2)"
        boxShadow="2xl"
        p={{ base: 8, md: 12 }}
        maxW="lg"
        w="full"
      >
        <VStack spacing={3}>
          <Text fontSize="2xl" fontWeight="semibold" color="pink.200">
            Nosabos
          </Text>
          <Text fontSize={{ base: "3xl", md: "4xl" }} fontWeight="black" lineHeight="1.1">
            Your AI coach for immersive language learning
          </Text>
          <Text color="gray.300">
            Create a display name to receive your secure key, then dive straight into conversations, stories, and lectures.
          </Text>
        </VStack>

        <Stack direction={{ base: "column", md: "row" }} spacing={4} w="full">
          <Input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Display name"
            bg="rgba(15, 23, 42, 0.95)"
            borderColor="rgba(148, 163, 184, 0.4)"
            color="white"
            _placeholder={{ color: "gray.500" }}
          />
          <ActionButton
            colorScheme="purple"
            onClick={handleCreateAccount}
            isLoading={isCreatingAccount}
            isDisabled={!hasDisplayName}
            rightIcon={<ArrowForwardIcon />}
            w={{ base: "full", md: "auto" }}
          >
            {isCreatingAccount ? "Creating" : "Create account"}
          </ActionButton>
        </Stack>
        {errorMessage && (
          <Text color="red.300" fontSize="sm">
            {errorMessage}
          </Text>
        )}

        <ActionButton colorScheme="pink" onClick={() => setView("signIn")}>
          I already have a key
        </ActionButton>
        <ActionButton colorScheme="gray" onClick={() => setView("features")}>
          See features
        </ActionButton>
      </VStack>
    </Flex>
  );
};

export default LandingPage;
