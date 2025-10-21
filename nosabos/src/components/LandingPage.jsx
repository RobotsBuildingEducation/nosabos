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
import { ArrowForwardIcon, LockIcon } from "@chakra-ui/icons";
import {
  FiBookOpen,
  FiCompass,
  FiLayers,
  FiMessageCircle,
  FiShuffle,
  FiTarget,
} from "react-icons/fi";

import { useDecentralizedIdentity } from "../hooks/useDecentralizedIdentity";
import RobotBuddyPro from "./RobotBuddyPro";

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
      "Start with Spanish, English, or Portuguese right away, then explore Nahuatl-inspired cultural modules and more advanced grammar labs as you progress.",
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
      "Follow interactive stories that invite you to read aloud, summarize, and role-play to your liking.",
    icon: FiBookOpen,
  },
  {
    title: "History lectures",
    description:
      "Explore briefings on Mexican history to expand your cultural and academic vocabulary.",
    icon: FiLayers,
  },
  {
    title: "Grammar & vocabulary books",
    description:
      "Check rules quickly, drill tricky concepts, and test yourself with adaptive review sets.",
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
    bgGradient="linear(to-br, #06111f, #0f202f)"
    zIndex={-2}
  />
);

const defaultLoadingMessage = "Setting up your study space...";

const BASE_BUTTON_PROPS = {
  size: "lg",
  fontWeight: "semibold",
  borderRadius: "full",
  px: 8,
  minH: 12,
  transition: "all 0.2s ease",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const BUTTON_VARIANTS = {
  primary: {
    bg: "teal.400",
    color: "gray.900",
    _hover: {
      bg: "teal.300",
    },
  },
  secondary: {
    bg: "rgba(45, 212, 191, 0.12)",
    color: "teal.100",
    border: "1px solid rgba(45, 212, 191, 0.45)",
    _hover: {
      bg: "rgba(45, 212, 191, 0.18)",
    },
  },
  ghost: {
    bg: "transparent",
    color: "cyan.200",
    border: "1px solid rgba(59, 130, 246, 0.35)",
    _hover: {
      bg: "rgba(30, 64, 175, 0.25)",
      borderColor: "rgba(96, 165, 250, 0.55)",
    },
  },
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
      setErrorMessage(
        error?.message || "Something went wrong. Please try again."
      );
    } finally {
      setIsCreatingAccount(false);
    }
  }, [
    displayName,
    generateNostrKeys,
    hasDisplayName,
    isCreatingAccount,
    toast,
  ]);

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
          description:
            "Select the key manually if clipboard access is blocked.",
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

  const ActionButton = ({ variant = "primary", ...props }) => (
    <Button
      {...BASE_BUTTON_PROPS}
      {...(BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary)}
      {...props}
    />
  );

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
          bg="rgba(10, 20, 34, 0.95)"
          borderRadius="2xl"
          border="1px solid rgba(45, 212, 191, 0.35)"
          p={{ base: 6, md: 8 }}
        >
          <Text fontSize="2xl" fontWeight="bold">
            Welcome back
          </Text>
          <Text fontSize="sm" color="teal.100">
            Paste the secret key you saved when you first created an account.
          </Text>
          <Input
            value={secretKey}
            onChange={(event) => setSecretKey(event.target.value)}
            placeholder="Paste your secret key"
            bg="rgba(6, 18, 30, 0.9)"
            borderColor="rgba(45, 212, 191, 0.4)"
            color="white"
            _placeholder={{ color: "cyan.500" }}
          />
          {errorMessage && (
            <Text color="red.300" fontSize="sm">
              {errorMessage}
            </Text>
          )}
          <ActionButton
            onClick={handleSignIn}
            isLoading={isSigningIn}
            rightIcon={<LockIcon />}
          >
            Sign in
          </ActionButton>
          <ActionButton
            variant="ghost"
            onClick={() => {
              setView("landing");
            }}
          >
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
          bg="rgba(7, 17, 28, 0.95)"
          borderRadius="3xl"
          border="1px solid rgba(45, 212, 191, 0.4)"
          p={{ base: 6, md: 10 }}
        >
          <Text fontSize="2xl" fontWeight="bold">
            Save your secret key
          </Text>
          <Text color="teal.100">
            This key is the only way to access your accounts on Robots Building
            Education apps. Store it in a password manager or a safe place. We
            cannot recover it for you.
          </Text>
          <Box
            border="1px dashed"
            borderColor="rgba(45, 212, 191, 0.45)"
            borderRadius="lg"
            p={4}
            bg="rgba(6, 18, 30, 0.85)"
            fontFamily="mono"
            fontSize="sm"
            wordBreak="break-all"
          >
            {generatedKeys?.nsec || "Generating key..."}
          </Box>
          <Checkbox
            isChecked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            colorScheme="teal"
          >
            <Text fontSize={"sm"}>
              I understand that I must store this key securely to keep my
              account and holds important data like my Bitcoin deposits.
            </Text>
          </Checkbox>
          <VStack direction={{ base: "column", md: "row" }} spacing={4}>
            <ActionButton
              variant="secondary"
              onClick={handleCopyKey}
              colorScheme="blue"
            >
              Copy key
            </ActionButton>
            <ActionButton
              variant="primary"
              isDisabled={!acknowledged}
              bg={!acknowledged ? "gray" : "teal"}
              onClick={handleLaunch}
              rightIcon={<ArrowForwardIcon />}
              color="white"
            >
              Start learning
            </ActionButton>
          </VStack>
          {isCreatingAccount && (
            <HStack color="gray.400">
              <Spinner size="sm" />
              <Text fontSize="sm">{loadingMessage}</Text>
            </HStack>
          )}
          <ActionButton
            variant="ghost"
            onClick={() => {
              setView("landing");
            }}
            width="100px"
          >
            Go back
          </ActionButton>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box position="relative" minH="100vh" color="gray.100" pb={24}>
      <HeroBackground />
      <Flex
        align="center"
        justify="center"
        px={{ base: 4, md: 8 }}
        py={{ base: 12, md: 20 }}
        textAlign="center"
      >
        <VStack
          spacing={8}
          bg="rgba(8, 18, 29, 0.92)"
          borderRadius="3xl"
          border="1px solid rgba(45, 212, 191, 0.35)"
          p={{ base: 8, md: 12 }}
          maxW="lg"
          w="full"
        >
          <VStack spacing={3}>
            <RobotBuddyPro palette="ocean" variant="abstract" />
            <Text fontSize="2xl" fontWeight="semibold" color="cyan.200">
              No Sabos
            </Text>
            <Text
              fontSize={{ base: "3xl", md: "4xl" }}
              fontWeight="black"
              lineHeight="1.1"
            >
              A smart tool to help you practice your language skills.
            </Text>
            <Text color="teal.100">
              English, Spanish, Portuguese or Nahuatl.
            </Text>
          </VStack>

          <Stack
            direction={{ base: "column", md: "column" }}
            spacing={4}
            w="full"
            display="flex"
            alignItems={"center"}
          >
            <Input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Display name"
              bg="rgba(6, 18, 30, 0.95)"
              borderColor="rgba(45, 212, 191, 0.45)"
              color="white"
            />
            <Button
              color="white"
              onClick={handleCreateAccount}
              isLoading={isCreatingAccount}
              isDisabled={!hasDisplayName}
              rightIcon={<ArrowForwardIcon />}
              // w={{ base: "full", md: "auto" }}
            >
              {isCreatingAccount ? "Creating" : "Create account"}
            </Button>
          </Stack>
          {errorMessage && (
            <Text color="red.300" fontSize="sm">
              {errorMessage}
            </Text>
          )}

          <ActionButton
            onClick={() => {
              setView("signIn");
            }}
            color="white"
          >
            I already have a key
          </ActionButton>
        </VStack>
      </Flex>

      <Box px={{ base: 4, md: 8 }} pb={{ base: 12, md: 20 }}>
        <Flex direction="column" align="center" gap={12}>
          <LandingSection
            bg="rgba(4, 12, 22, 0.92)"
            borderRadius="3xl"
            border="1px solid rgba(96, 165, 250, 0.25)"
          >
            <VStack spacing={8} align="stretch">
              <Text
                textAlign="center"
                fontSize="3xl"
                fontWeight="bold"
                color="white"
              >
                What you can do inside the app today
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {FEATURE_CARDS.map((feature) => (
                  <Box
                    key={feature.title}
                    p={6}
                    borderRadius="xl"
                    border="1px solid rgba(14, 165, 233, 0.35)"
                    bg="rgba(6, 18, 30, 0.95)"
                  >
                    <VStack align="flex-start" spacing={4}>
                      <Icon as={feature.icon} color="teal.200" boxSize={8} />
                      <Text fontSize="xl" fontWeight="semibold" color="white">
                        {feature.title}
                      </Text>
                      <Text color="cyan.100">{feature.description}</Text>
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            </VStack>
          </LandingSection>

          <LandingSection
            bg="rgba(6, 18, 30, 0.9)"
            borderRadius="3xl"
            border="1px solid rgba(45, 212, 191, 0.3)"
          >
            <VStack spacing={6} align="center">
              <Text fontSize="3xl" fontWeight="bold" textAlign="center">
                Ready to jump in?
              </Text>
              <Text textAlign="center" color="cyan.100" maxW="2xl">
                Create your secure profile in seconds, save your key, and unlock
                every mode you just explored.
              </Text>
              <Button
                rightIcon={<ArrowForwardIcon />}
                onClick={handleCreateAccount}
                isDisabled={!hasDisplayName || isCreatingAccount}
              >
                Create account
              </Button>
              <ActionButton
                color="white"
                onClick={() => {
                  setView("signIn");
                }}
              >
                I already have a key
              </ActionButton>
            </VStack>
          </LandingSection>
        </Flex>
      </Box>
    </Box>
  );
};

export default LandingPage;
