import React, { useCallback, useEffect, useState } from "react";
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
  Link,
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
  FiCheckSquare,
  FiCopy,
  FiLayers,
  FiMap,
  FiMessageCircle,
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
      "Start with Spanish, English, Portuguese, French, or Italian right away, then explore Nahuatl-inspired cultural modules and more advanced grammar labs as you progress.",
  },
  {
    question: "Is there a cost?",
    answer:
      "The core practice tools are free. Some advanced labs and live workshops may require scholarships or paid access—those details appear inside the app when available.",
  },
];

const FEATURE_CARD_CONFIG = [
  {
    titleKey: "feature_conversations_title",
    legacyTitleKey: "landing_feature_conversations_title",
    descriptionKey: "feature_conversations_desc",
    legacyDescriptionKey: "landing_feature_conversations_desc",
    icon: FiMessageCircle,
  },
  {
    titleKey: "feature_stories_title",
    legacyTitleKey: "landing_feature_stories_title",
    descriptionKey: "feature_stories_desc",
    legacyDescriptionKey: "landing_feature_stories_desc",
    icon: FiBookOpen,
  },
  {
    titleKey: "feature_reading_title",
    legacyTitleKey: "landing_feature_reading_title",
    descriptionKey: "feature_reading_desc",
    legacyDescriptionKey: "landing_feature_reading_desc",
    icon: FiLayers,
  },
  {
    titleKey: "feature_grammar_title",
    legacyTitleKey: "landing_feature_grammar_title",
    descriptionKey: "feature_grammar_desc",
    legacyDescriptionKey: "landing_feature_grammar_desc",
    icon: FiTarget,
  },
  {
    titleKey: "feature_skilltree_title",
    legacyTitleKey: "landing_feature_skilltree_title",
    descriptionKey: "feature_skilltree_desc",
    legacyDescriptionKey: "landing_feature_skilltree_desc",
    icon: FiMap,
  },
  {
    titleKey: "feature_flashcards_title",
    legacyTitleKey: "landing_feature_flashcards_title",
    descriptionKey: "feature_flashcards_desc",
    legacyDescriptionKey: "landing_feature_flashcards_desc",
    icon: FiCopy,
  },
  {
    titleKey: "feature_dailygoals_title",
    legacyTitleKey: "landing_feature_dailygoals_title",
    descriptionKey: "feature_dailygoals_desc",
    legacyDescriptionKey: "landing_feature_dailygoals_desc",
    icon: FiCheckSquare,
  },
];

const extendWithFeatureAliases = (copy) => {
  const next = { ...copy };
  FEATURE_CARD_CONFIG.forEach(
    ({ titleKey, legacyTitleKey, descriptionKey, legacyDescriptionKey }) => {
      if (legacyTitleKey && !next[legacyTitleKey] && next[titleKey]) {
        next[legacyTitleKey] = next[titleKey];
      }
      if (
        legacyDescriptionKey &&
        !next[legacyDescriptionKey] &&
        next[descriptionKey]
      ) {
        next[legacyDescriptionKey] = next[descriptionKey];
      }
    }
  );
  return next;
};

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

const landingTranslations = {
  en: extendWithFeatureAliases({
    language_en: "English",
    language_es: "Español",
    default_loading: "Setting up your study space...",
    toast_account_created_title: "Account created",
    toast_account_created_desc: "Save your secret key before you continue.",
    error_create_generic: "Something went wrong. Please try again.",
    toast_copy_success_title: "Secret key copied",
    toast_copy_success_desc:
      "Store it somewhere safe—it's your only way back in.",
    toast_copy_error_title: "Copy failed",
    toast_copy_error_desc:
      "Select the key manually if clipboard access is blocked.",
    toast_signin_success_title: "Welcome back!",
    error_signin_invalid:
      "We couldn't verify that key. Check it and try again.",
    error_signin_generic: "We couldn't sign you in. Try again.",
    brand_name: "No Sabos",
    hero_title: "A smart tool to help you practice your language skills.",
    hero_languages: "English, Spanish, Portuguese, French, Italian or Nahuatl.",
    display_name_placeholder: "Display name",
    create_button: "Create account",
    create_loading: "Creating",
    have_key_button: "I already have a key",
    section_features_title: "What you can do inside the app today",
    feature_conversations_title: "Real-time conversations",
    feature_conversations_desc:
      "Stay immersed with responsive dialogues that coach you through speaking and listening in the moment.",
    feature_stories_title: "Stories for reading & speaking",
    feature_stories_desc:
      "Follow interactive stories that invite you to read aloud, summarize, and role-play to your liking.",
    feature_reading_title: "Reading practice",
    feature_reading_desc:
      "Practice reading comprehension with subject-focused lectures to expand your vocabulary and cultural knowledge.",
    feature_grammar_title: "Grammar & vocabulary books",
    feature_grammar_desc:
      "Check rules quickly, drill tricky concepts, and test yourself with adaptive review sets.",
    feature_skilltree_title: "Skill tree",
    feature_skilltree_desc:
      "Learn in a structured way with guided paths that build your skills step by step.",
    feature_flashcards_title: "Flash cards",
    feature_flashcards_desc:
      "Learn how to speak with others fast using quick-fire vocabulary and phrase drills.",
    feature_dailygoals_title: "Daily goals",
    feature_dailygoals_desc:
      "Stay motivated with daily targets that track your progress and celebrate your streaks.",
    wallet_section_title: "Create scholarships with Bitcoin",
    wallet_section_description_prefix:
      "Top up your in-app Bitcoin wallet to help us create scholarships with learning with",
    wallet_section_description_suffix: ".",
    wallet_section_note:
      "Choose a community identity in the app so every satoshi you spend supports real people.",
    wallet_section_link_label: "RobotsBuildingEducation.com",
    ready_title: "Ready to jump in?",
    ready_subtitle:
      "Create your secure profile in seconds, save your key, and unlock every mode you just explored.",
    ready_cta: "Create account",
    signin_title: "Welcome back",
    signin_subtitle:
      "Paste the secret key you saved when you first created an account.",
    signin_placeholder: "Paste your secret key",
    signin_button: "Sign in",
    back_button: "Back",
    created_title: "Save your secret key",
    created_description:
      "This key is the only way to access your accounts on Robots Building Education apps. Store it in a password manager or a safe place. We cannot recover it for you.",
    created_generating: "Generating key...",
    created_checkbox:
      "I understand that I must store this key securely to keep my account safe—it protects everything, including my Bitcoin deposits.",
    created_copy: "Copy key",
    created_launch: "Start learning",
    created_back: "Go back",
  }),
  es: extendWithFeatureAliases({
    language_en: "English",
    language_es: "Español",
    default_loading: "Preparando tu espacio de estudio...",
    toast_account_created_title: "Cuenta creada",
    toast_account_created_desc: "Guarda tu llave secreta antes de continuar.",
    error_create_generic: "Ocurrió un problema. Inténtalo de nuevo.",
    toast_copy_success_title: "Llave secreta copiada",
    toast_copy_success_desc:
      "Guárdala en un lugar seguro: es la única forma de volver a entrar.",
    toast_copy_error_title: "No se pudo copiar",
    toast_copy_error_desc:
      "Selecciona la llave manualmente si el portapapeles está bloqueado.",
    toast_signin_success_title: "¡Bienvenido de nuevo!",
    error_signin_invalid:
      "No pudimos verificar esa llave. Revísala e inténtalo otra vez.",
    error_signin_generic: "No pudimos iniciar tu sesión. Inténtalo de nuevo.",
    brand_name: "No Sabos",
    hero_title:
      "Una herramienta inteligente para practicar tus habilidades lingüísticas.",
    hero_languages: "Inglés, español, portugués, francés, italiano o náhuatl.",
    display_name_placeholder: "Nombre para mostrar",
    create_button: "Crear cuenta",
    create_loading: "Creando",
    have_key_button: "Ya tengo una llave",
    section_features_title: "Lo que puedes hacer en la app hoy",
    feature_conversations_title: "Conversaciones en tiempo real",
    feature_conversations_desc:
      "Mantente inmerso con diálogos receptivos que te guían en la expresión y comprensión al momento.",
    feature_stories_title: "Historias para leer y hablar",
    feature_stories_desc:
      "Sigue historias interactivas que te invitan a leer en voz alta, resumir y representar papeles.",
    feature_reading_title: "Práctica de lectura",
    feature_reading_desc:
      "Practica la comprensión de lectura con lecciones enfocadas en temas para ampliar tu vocabulario y conocimiento cultural.",
    feature_grammar_title: "Libros de gramática y vocabulario",
    feature_grammar_desc:
      "Consulta reglas rápido, practica puntos difíciles y pon a prueba tus conocimientos con repasos adaptativos.",
    feature_skilltree_title: "Árbol de habilidades",
    feature_skilltree_desc:
      "Aprende de manera estructurada con rutas guiadas que desarrollan tus habilidades paso a paso.",
    feature_flashcards_title: "Tarjetas de memoria",
    feature_flashcards_desc:
      "Aprende a hablar con otros rápidamente usando ejercicios ágiles de vocabulario y frases.",
    feature_dailygoals_title: "Metas diarias",
    feature_dailygoals_desc:
      "Mantente motivado con objetivos diarios que rastrean tu progreso y celebran tus rachas.",
    wallet_section_title: "Becas impulsadas con Bitcoin",
    wallet_section_description_prefix:
      "Recarga tu billetera de Bitcoin en la app para ayudarnos a crear becas con aprendizaje con",
    wallet_section_description_suffix: ".",
    wallet_section_note:
      "Elige una identidad comunitaria en la app para dirigir tu apoyo a estudiantes reales.",
    wallet_section_link_label: "RobotsBuildingEducation.com",
    ready_title: "¿Listo para empezar?",
    ready_subtitle:
      "Crea tu perfil seguro en segundos, guarda tu llave y desbloquea todos los modos que viste.",
    ready_cta: "Crear cuenta",
    signin_title: "Bienvenido de nuevo",
    signin_subtitle:
      "Pega la llave secreta que guardaste cuando creaste tu cuenta.",
    signin_placeholder: "Pega tu llave secreta",
    signin_button: "Iniciar sesión",
    back_button: "Regresar",
    created_title: "Guarda tu llave secreta",
    created_description:
      "Esta llave es la única forma de acceder a tus cuentas en las apps de Robots Building Education. Guárdala en un gestor de contraseñas o en un lugar seguro. No podemos recuperarla por ti.",
    created_generating: "Generando llave...",
    created_checkbox:
      "Entiendo que debo guardar esta llave de forma segura para proteger mi cuenta; resguarda todo, incluso mis depósitos de Bitcoin.",
    created_copy: "Copiar llave",
    created_launch: "Comenzar a aprender",
    created_back: "Regresar",
  }),
};

const getStoredLanguage = () =>
  typeof window !== "undefined" && localStorage.getItem("appLanguage") === "es"
    ? "es"
    : "en";

const LandingPage = ({ onAuthenticated }) => {
  const toast = useToast();
  const { generateNostrKeys, auth } = useDecentralizedIdentity(
    typeof window !== "undefined" ? localStorage.getItem("local_npub") : "",
    typeof window !== "undefined" ? localStorage.getItem("local_nsec") : ""
  );

  const [landingLanguage, setLandingLanguage] = useState(getStoredLanguage);
  const copy = landingTranslations[landingLanguage] || landingTranslations.en;
  const defaultLoadingMessage = copy.default_loading;
  const englishLabel = copy.language_en || landingTranslations.en.language_en;
  const spanishLabel = copy.language_es || landingTranslations.en.language_es;

  const [view, setView] = useState("landing");
  const [displayName, setDisplayName] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [generatedKeys, setGeneratedKeys] = useState(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(defaultLoadingMessage);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setLoadingMessage(copy.default_loading);
  }, [copy.default_loading, landingLanguage]);

  const hasDisplayName = displayName.trim().length >= 2;

  const handleLanguageChange = useCallback((lang) => {
    const norm = lang === "es" ? "es" : "en";
    setLandingLanguage(norm);
    try {
      localStorage.setItem("appLanguage", norm);
    } catch {}
  }, []);

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
        title: copy.toast_account_created_title,
        description: copy.toast_account_created_desc,
        status: "success",
        duration: 2500,
      });
    } catch (error) {
      console.error("Failed to create account", error);
      setErrorMessage(error?.message || copy.error_create_generic);
    } finally {
      setIsCreatingAccount(false);
    }
  }, [
    copy.error_create_generic,
    copy.toast_account_created_desc,
    copy.toast_account_created_title,
    defaultLoadingMessage,
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
          title: copy.toast_copy_success_title,
          description: copy.toast_copy_success_desc,
          status: "info",
          duration: 2400,
        })
      )
      .catch(() =>
        toast({
          title: copy.toast_copy_error_title,
          description: copy.toast_copy_error_desc,
          status: "error",
          duration: 2400,
        })
      );
  }, [
    copy.toast_copy_error_desc,
    copy.toast_copy_error_title,
    copy.toast_copy_success_desc,
    copy.toast_copy_success_title,
    generatedKeys?.nsec,
    toast,
  ]);

  const handleSignIn = useCallback(async () => {
    if (!secretKey.trim()) return;
    setIsSigningIn(true);
    setErrorMessage("");
    try {
      const result = await auth(secretKey.trim());
      if (!result) {
        throw new Error(copy.error_signin_invalid);
      }
      toast({
        title: copy.toast_signin_success_title,
        status: "success",
        duration: 2000,
      });
      onAuthenticated?.();
    } catch (error) {
      console.error("Failed to sign in", error);
      setErrorMessage(error?.message || copy.error_signin_generic);
    } finally {
      setIsSigningIn(false);
    }
  }, [
    auth,
    copy.error_signin_generic,
    copy.error_signin_invalid,
    copy.toast_signin_success_title,
    onAuthenticated,
    secretKey,
    toast,
  ]);

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
            {copy.signin_title}
          </Text>
          <Text fontSize="sm" color="teal.100">
            {copy.signin_subtitle}
          </Text>
          <Input
            value={secretKey}
            onChange={(event) => setSecretKey(event.target.value)}
            placeholder={copy.signin_placeholder}
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
            {copy.signin_button}
          </ActionButton>
          <ActionButton
            variant="ghost"
            onClick={() => {
              setView("landing");
            }}
          >
            {copy.back_button}
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
            {copy.created_title}
          </Text>
          <Text color="teal.100">{copy.created_description}</Text>
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
            {generatedKeys?.nsec || copy.created_generating}
          </Box>
          <ActionButton
            variant="secondary"
            onClick={handleCopyKey}
            colorScheme="blue"
          >
            {copy.created_copy}
          </ActionButton>
          <Checkbox
            isChecked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            colorScheme="teal"
          >
            <Text fontSize={"sm"}>{copy.created_checkbox}</Text>
          </Checkbox>
          <VStack direction={{ base: "column", md: "row" }} spacing={4}>
            <ActionButton
              variant="primary"
              isDisabled={!acknowledged}
              bg={!acknowledged ? "gray" : "teal"}
              onClick={handleLaunch}
              rightIcon={<ArrowForwardIcon />}
              color="white"
            >
              {copy.created_launch}
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
            {copy.created_back}
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
        py={{ base: 4, md: 4 }}
        textAlign="center"
      >
        <VStack
          spacing={8}
          bg="rgba(8, 18, 29, 0.92)"
          borderRadius="3xl"
          p={{ base: 8, md: 12 }}
          maxW="lg"
          w="full"
        >
          <VStack spacing={3}>
            <RobotBuddyPro palette="ocean" variant="abstract" />
            <Text fontSize="2xl" fontWeight="semibold" color="cyan.200">
              {copy.brand_name}
            </Text>
            <Text
              fontSize={{ base: "xl", md: "xl" }}
              fontWeight="black"
              lineHeight="1.1"
            >
              {copy.hero_title}
            </Text>
            <Text color="teal.100">{copy.hero_languages}</Text>
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
              placeholder={copy.display_name_placeholder}
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
              width="75%"
              p={6}
              // w={{ base: "full", md: "auto" }}
            >
              {isCreatingAccount ? copy.create_loading : copy.create_button}
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
            width="75%"
            p={6}
          >
            {copy.have_key_button}
          </ActionButton>

          <HStack spacing={2} justify="center">
            <Button
              size="sm"
              variant={landingLanguage === "en" ? "solid" : "ghost"}
              colorScheme="teal"
              onClick={() => handleLanguageChange("en")}
            >
              {englishLabel}
            </Button>
            <Button
              size="sm"
              variant={landingLanguage === "es" ? "solid" : "ghost"}
              colorScheme="teal"
              onClick={() => handleLanguageChange("es")}
            >
              {spanishLabel}
            </Button>
          </HStack>
        </VStack>
      </Flex>

      <Box px={{ base: 4, md: 8 }} pb={{ base: 12, md: 20 }}>
        <Flex direction="column" align="center" gap={12}>
          <LandingSection bg="rgba(4, 12, 22, 0.92)" borderRadius="3xl">
            <VStack spacing={8} align="stretch">
              <Text
                textAlign="center"
                fontSize="3xl"
                fontWeight="bold"
                color="white"
              >
                {copy.section_features_title}
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {FEATURE_CARD_CONFIG.map((feature) => (
                  <Box
                    key={feature.titleKey}
                    p={6}
                    borderRadius="xl"
                    bg="rgba(6, 18, 30, 0.95)"
                  >
                    <VStack align="flex-start" spacing={4}>
                      <Icon as={feature.icon} color="teal.200" boxSize={8} />
                      <Text fontSize="xl" fontWeight="semibold" color="white">
                        {copy[feature.titleKey] ||
                          (feature.legacyTitleKey
                            ? copy[feature.legacyTitleKey]
                            : null) ||
                          landingTranslations.en[feature.titleKey] ||
                          (feature.legacyTitleKey
                            ? landingTranslations.en[feature.legacyTitleKey]
                            : null) ||
                          feature.titleKey}
                      </Text>
                      <Text color="cyan.100">
                        {copy[feature.descriptionKey] ||
                          (feature.legacyDescriptionKey
                            ? copy[feature.legacyDescriptionKey]
                            : null) ||
                          landingTranslations.en[feature.descriptionKey] ||
                          (feature.legacyDescriptionKey
                            ? landingTranslations.en[
                                feature.legacyDescriptionKey
                              ]
                            : null) ||
                          feature.descriptionKey}
                      </Text>
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            </VStack>
          </LandingSection>

          <LandingSection bg="rgba(8, 26, 36, 0.9)" borderRadius="3xl">
            <VStack spacing={5} align="center">
              <Text fontSize="3xl" fontWeight="bold" textAlign="center">
                {copy.wallet_section_title}
              </Text>
              <Text textAlign="center" color="cyan.100" maxW="3xl">
                {copy.wallet_section_description_prefix}{" "}
                <Link
                  href="https://robotsbuildingeducation.com/learning"
                  isExternal
                  color="teal.200"
                  textDecoration="underline"
                >
                  {copy.wallet_section_link_label ||
                    landingTranslations.en.wallet_section_link_label}
                </Link>
                {copy.wallet_section_description_suffix}
              </Text>
              <Text textAlign="center" color="teal.100" maxW="2xl">
                {copy.wallet_section_note}
              </Text>
            </VStack>
          </LandingSection>

          <LandingSection bg="rgba(6, 18, 30, 0.9)" borderRadius="3xl">
            <VStack spacing={6} align="center">
              <Text fontSize="3xl" fontWeight="bold" textAlign="center">
                {copy.ready_title}
              </Text>
              <Text textAlign="center" color="cyan.100" maxW="2xl">
                {copy.ready_subtitle}
              </Text>
              <Button
                rightIcon={<ArrowForwardIcon />}
                onClick={handleCreateAccount}
                isDisabled={!hasDisplayName || isCreatingAccount}
                width="75%"
                maxWidth="300px"
                p={6}
              >
                {copy.ready_cta}
              </Button>
              <ActionButton
                color="white"
                onClick={() => {
                  setView("signIn");
                }}
                width="75%"
                maxWidth="300px"
                p={6}
              >
                {copy.have_key_button}
              </ActionButton>
            </VStack>
          </LandingSection>
        </Flex>
      </Box>
    </Box>
  );
};

export default LandingPage;
