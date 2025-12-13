import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Checkbox,
  Divider,
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
  usePrefersReducedMotion,
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
import { IoIosMore } from "react-icons/io";
import { MdOutlineFileUpload } from "react-icons/md";
import { CiSquarePlus } from "react-icons/ci";
import { LuBadgeCheck } from "react-icons/lu";
import { keyframes } from "@emotion/react";
import { motion, useScroll, useTransform } from "framer-motion";

import { useDecentralizedIdentity } from "../hooks/useDecentralizedIdentity";
import RobotBuddyPro from "./RobotBuddyPro";
import { BitcoinWalletSection } from "./IdentityDrawer";

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

const MotionBox = motion(Box);
const MotionVStack = motion(VStack);
const MotionText = motion(Text);
const glowPulse = keyframes`
  0% { transform: translateY(0) scale(1); opacity: 0.65; }
  50% { transform: translateY(-12px) scale(1.04); opacity: 0.9; }
  100% { transform: translateY(0) scale(1); opacity: 0.65; }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const shimmerSweep = keyframes`
  0% { transform: translateX(-20%) rotate(-6deg); opacity: 0; }
  40% { opacity: 0.45; }
  60% { opacity: 0.6; }
  100% { transform: translateX(120%) rotate(-6deg); opacity: 0; }
`;

const HeroBackground = ({ prefersReducedMotion }) => (
  <Box position="absolute" inset={0} overflow="hidden" zIndex={-2}>
    <Box
      position="absolute"
      inset={0}
      bgGradient="linear(to-br, #040b14, #0c1e31 45%, #0a2f40)"
      backgroundSize="200% 200%"
      animation={prefersReducedMotion ? undefined : `${gradientShift} 20s ease-in-out infinite`}
    />

    <Box
      position="absolute"
      top="-10%"
      left="-12%"
      w="60%"
      h="60%"
      bgGradient="radial(closest-side, rgba(32, 197, 190, 0.35), transparent 60%)"
      filter="blur(40px)"
      animation={
        prefersReducedMotion ? undefined : `${glowPulse} 14s ease-in-out infinite alternate`
      }
    />
    <Box
      position="absolute"
      bottom="-12%"
      right="-16%"
      w="55%"
      h="55%"
      bgGradient="radial(closest-side, rgba(79, 70, 229, 0.28), transparent 60%)"
      filter="blur(40px)"
      animation={
        prefersReducedMotion ? undefined : `${glowPulse} 16s ease-in-out infinite alternate`
      }
    />

    <Box
      position="absolute"
      insetY={-10}
      left="-30%"
      w="50%"
      bgGradient="linear(to-b, rgba(255,255,255,0.12), transparent 60%)"
      filter="blur(18px)"
      opacity={0.35}
      animation={prefersReducedMotion ? undefined : `${shimmerSweep} 18s linear infinite`}
    />
  </Box>
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

const MEXICO_TIMEZONES = new Set([
  "America/Mexico_City",
  "America/Cancun",
  "America/Chihuahua",
  "America/Hermosillo",
]);

const getInitialLandingLanguage = () => {
  if (typeof window === "undefined") return "en";

  try {
    const stored = localStorage.getItem("appLanguage");
    if (stored === "es" || stored === "en") return stored;

    const languages = navigator.languages || [navigator.language];
    const isMexicoLocale = languages?.some((lang) =>
      typeof lang === "string" && lang.toLowerCase().startsWith("es-mx")
    );

    const timeZone = Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone;
    const isMexicoTimeZone = timeZone && MEXICO_TIMEZONES.has(timeZone);

    if (isMexicoLocale || isMexicoTimeZone) {
      localStorage.setItem("appLanguage", "es");
      return "es";
    }
  } catch {}

  return "en";
};

const LandingPage = ({
  onAuthenticated,
  user,
  onSelectIdentity,
  isIdentitySaving,
}) => {
  const toast = useToast();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { generateNostrKeys, auth } = useDecentralizedIdentity(
    typeof window !== "undefined" ? localStorage.getItem("local_npub") : "",
    typeof window !== "undefined" ? localStorage.getItem("local_nsec") : ""
  );
  const { scrollYProgress } = useScroll();

  const [landingLanguage, setLandingLanguage] = useState(
    getInitialLandingLanguage
  );
  const copy = landingTranslations[landingLanguage] || landingTranslations.en;
  const defaultLoadingMessage = copy.default_loading;
  const englishLabel = copy.language_en || landingTranslations.en.language_en;
  const spanishLabel = copy.language_es || landingTranslations.en.language_es;
  const heroParallax = useTransform(
    scrollYProgress,
    [0, 1],
    [0, prefersReducedMotion ? 0 : -140]
  );
  const floatingBadge = useTransform(
    scrollYProgress,
    [0, 1],
    [0, prefersReducedMotion ? 0 : 40]
  );

  const [view, setView] = useState("landing");
  const [displayName, setDisplayName] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(defaultLoadingMessage);
  const [errorMessage, setErrorMessage] = useState("");
  const revealVariant = useMemo(
    () => ({
      hidden: { opacity: 0, y: 32 },
      visible: { opacity: 1, y: 0 },
    }),
    []
  );
  const featureVariant = useMemo(
    () => ({
      hidden: { opacity: 0, y: 18 },
      visible: { opacity: 1, y: 0 },
    }),
    []
  );

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
    setLoadingMessage(defaultLoadingMessage);
    setErrorMessage("");

    try {
      const keys = await generateNostrKeys(displayName.trim());
      localStorage.setItem("displayName", displayName.trim());
      // Skip the "created" view and go directly to onboarding
      onAuthenticated?.();
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
    onAuthenticated,
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
            colorScheme="teal"
            color="white"
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

  return (
    <Box
      position="relative"
      minH="100vh"
      color="gray.100"
      pb={24}
      overflow="hidden"
    >
      <HeroBackground prefersReducedMotion={prefersReducedMotion} />
      <Flex
        align="center"
        justify="center"
        px={{ base: 4, md: 8 }}
        py={{ base: 4, md: 4 }}
        textAlign="center"
      >
        <MotionVStack
          spacing={8}
          bg="rgba(8, 18, 29, 0.92)"
          borderRadius="3xl"
          p={{ base: 8, md: 12 }}
          maxW="lg"
          w="full"
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 24 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={prefersReducedMotion ? undefined : { y: heroParallax }}
        >
          <MotionVStack spacing={3} align="center">
            {copy.hero_badge ? (
              <MotionBox
                px={4}
                py={1}
                borderRadius="full"
                bgGradient="linear(to-r, teal.300, cyan.200, teal.300)"
                backgroundSize="200% 200%"
                color="gray.900"
                fontWeight="bold"
                fontSize="xs"
                letterSpacing="0.08em"
                animation={
                  prefersReducedMotion
                    ? undefined
                    : `${gradientShift} 12s ease-in-out infinite`
                }
                initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 }}
                style={prefersReducedMotion ? undefined : { y: floatingBadge }}
              >
                {copy.hero_badge}
              </MotionBox>
            ) : null}
            <RobotBuddyPro palette="ocean" variant="abstract" />
            <MotionText
              fontSize="2xl"
              fontWeight="semibold"
              color="cyan.200"
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
            >
              {copy.brand_name}
            </MotionText>
            <MotionText
              fontSize={{ base: "xl", md: "xl" }}
              fontWeight="black"
              lineHeight="1.1"
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 14 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
            >
              {copy.hero_title}
            </MotionText>
            <MotionText
              color="teal.100"
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 14 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
            >
              {copy.hero_languages}
            </MotionText>
          </MotionVStack>

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
              color="gray.900"
              onClick={handleCreateAccount}
              isLoading={isCreatingAccount}
              isDisabled={!hasDisplayName}
              rightIcon={<ArrowForwardIcon />}
              width="75%"
              p={6}
              bgGradient="linear(to-r, teal.300, cyan.200)"
              transition="all 0.25s ease"
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
            colorScheme="teal"
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
        </MotionVStack>
      </Flex>

      <Box px={{ base: 4, md: 8 }} pb={{ base: 12, md: 20 }}>
        <Flex direction="column" align="center" gap={12}>
          <LandingSection
            bg="rgba(4, 12, 22, 0.92)"
            borderRadius="3xl"
          >
            <VStack spacing={8} align="stretch">
              <MotionText
                textAlign="center"
                fontSize="3xl"
                fontWeight="bold"
                color="white"
                initial={prefersReducedMotion ? undefined : { opacity: 0, y: 18 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                {copy.section_features_title}
              </MotionText>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {FEATURE_CARD_CONFIG.map((feature, index) => (
                  <MotionBox
                    key={feature.titleKey}
                    p={6}
                    borderRadius="xl"
                    bg="rgba(6, 18, 30, 0.95)"
                    border="1px solid rgba(45, 212, 191, 0.18)"
                    initial={prefersReducedMotion ? undefined : "hidden"}
                    animate={
                      prefersReducedMotion
                        ? undefined
                        : index < 2
                        ? "visible"
                        : undefined
                    }
                    whileInView={
                      prefersReducedMotion
                        ? undefined
                        : index < 2
                        ? undefined
                        : "visible"
                    }
                    variants={prefersReducedMotion ? undefined : featureVariant}
                    transition={{
                      duration: 0.6,
                      delay: index < 2 ? 0 : (index - 2) * 0.05,
                    }}
                    viewport={
                      index < 2 || prefersReducedMotion
                        ? undefined
                        : { once: true, amount: 0.35 }
                    }
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
                  </MotionBox>
                ))}
              </SimpleGrid>
            </VStack>
          </LandingSection>

          <LandingSection
            as={MotionBox}
            bg="rgba(8, 26, 36, 0.9)"
            borderRadius="3xl"
            initial={prefersReducedMotion ? undefined : "hidden"}
            whileInView={prefersReducedMotion ? undefined : "visible"}
            variants={prefersReducedMotion ? undefined : revealVariant}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
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

          <LandingSection
            as={MotionBox}
            bg="rgba(6, 18, 30, 0.9)"
            borderRadius="3xl"
            initial={prefersReducedMotion ? undefined : "hidden"}
            whileInView={prefersReducedMotion ? undefined : "visible"}
            variants={prefersReducedMotion ? undefined : revealVariant}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.6, delay: 0.12 }}
          >
            <VStack spacing={6} align="center">
              <Text fontSize="3xl" fontWeight="bold" textAlign="center">
                {copy.ready_title}
              </Text>
              <Text textAlign="center" color="cyan.100" maxW="2xl">
                {copy.ready_subtitle}
              </Text>
              <Input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder={copy.display_name_placeholder}
                bg="rgba(6, 18, 30, 0.95)"
                borderColor="rgba(45, 212, 191, 0.45)"
                color="white"
                maxW="400px"
              />
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
                colorScheme="teal"
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
