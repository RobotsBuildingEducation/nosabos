import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Container,
  Divider,
  Heading,
  HStack,
  Input,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuOptionGroup,
  MenuItemOption,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  IconButton,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { QRCodeSVG } from "qrcode.react";
import { BsQrCode } from "react-icons/bs";
import { SiCashapp } from "react-icons/si";
import { FaKey, FaInstagram, FaLinkedinIn, FaMoon, FaSun } from "react-icons/fa";
import useSoundSettings from "../hooks/useSoundSettings";
import selectSound from "../assets/select.mp3";
import submitActionSound from "../assets/submitaction.mp3";

import { RoleCanvas } from "./RoleCanvas/RoleCanvas";
import VoiceOrb from "./VoiceOrb";

import { CloudCanvas } from "./CloudCanvas/CloudCanvas";
import { useDecentralizedIdentity } from "../hooks/useDecentralizedIdentity";
import { NDKKind } from "@nostr-dev-kit/ndk";
import { Buffer } from "buffer";
import { bech32 } from "bech32";
import RandomCharacter from "./RandomCharacter";
import { logEvent } from "firebase/analytics";
import { doc, updateDoc } from "firebase/firestore";
import { analytics, database } from "../firebaseResources/firebaseResources";
import useNostrWalletStore from "../hooks/useNostrWalletStore";
import { IdentityCard } from "./IdentityCard";
import useLanguage from "../hooks/useLanguage";
import { getSupportLanguageOptions } from "../constants/languages";

import AnimatedLogo from "./AnimatedLogo/AnimatedLogo";
import { linksPageTranslations } from "../translations/linksPage";
import { useThemeStore } from "../useThemeStore";

// Helper to check if running on localhost
const isLocalhost = () =>
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

// Pixel flicker effect for 8-bit feel
const pixelFlicker = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
`;

// Scanline animation
const scanline = keyframes`
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
`;

const drift = keyframes`
  0% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-10px) translateX(5px); }
  100% { transform: translateY(0) translateX(0); }
`;

const VOICE_ORB_STATES = ["idle", "listening", "speaking"];

const pickRandomVoiceOrbState = () =>
  VOICE_ORB_STATES[Math.floor(Math.random() * VOICE_ORB_STATES.length)];

const roleCycle = [
  "sphere",
  "plan",
  "meals",
  "finance",
  "sleep",
  "emotions",
  "chores",
  "counselor",
];

const APP_PAGE_BG = "var(--app-page-bg)";
const APP_SURFACE = "var(--app-surface)";
const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_BORDER_STRONG = "var(--app-border-strong)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_TEXT_MUTED = "var(--app-text-muted)";
const APP_SHADOW = "var(--app-shadow-soft)";

const LINKS_PAPER_PAGE_SX = {
  background:
    "radial-gradient(circle at 14% 12%, rgba(220, 197, 169, 0.18) 0%, transparent 34%), " +
    "radial-gradient(circle at 84% 10%, rgba(235, 220, 198, 0.2) 0%, transparent 32%), " +
    "linear-gradient(180deg, rgba(252,248,242,0.98) 0%, rgba(246,239,230,0.98) 100%)",
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    backgroundImage:
      "repeating-linear-gradient(0deg, rgba(155,135,112,0.04) 0px, rgba(155,135,112,0.04) 1px, transparent 1px, transparent 28px), " +
      "repeating-linear-gradient(90deg, rgba(155,135,112,0.03) 0px, rgba(155,135,112,0.03) 1px, transparent 1px, transparent 28px)",
    opacity: 0.4,
    pointerEvents: "none",
  },
  "& > *": {
    position: "relative",
    zIndex: 1,
  },
};

const LanguageMenuFixed = ({ language, onSelect, playSound, translations }) => {
  const langOptions = getSupportLanguageOptions({
    ui: translations,
    uiLang: language,
  });
  const selected = langOptions.find((o) => o.value === language) || langOptions[0];

  return (
    <Box>
      <Menu placement="bottom-start">
        <MenuButton
          as={IconButton}
          aria-label="Select language"
          icon={
            <Box
              as="span"
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              w="24px"
              h="24px"
              flexShrink={0}
              sx={{ "& svg": { width: "24px", height: "24px", display: "block" } }}
            >
              {selected?.flag}
            </Box>
          }
          size="sm"
          minW="40px"
          h="40px"
          rounded="full"
          bg={APP_SURFACE_ELEVATED}
          border="1px solid"
          borderColor={APP_BORDER}
          boxShadow={APP_SHADOW}
          backdropFilter="blur(20px)"
          _hover={{ bg: APP_SURFACE_MUTED }}
          _active={{ bg: APP_SURFACE_MUTED }}
        />
        <MenuList
          bg={APP_SURFACE_ELEVATED}
          borderColor={APP_BORDER}
          boxShadow={APP_SHADOW}
          minW="160px"
          py={1}
          zIndex={122}
        >
          <MenuOptionGroup
            value={language}
            type="radio"
            onChange={(val) => {
              playSound?.();
              onSelect(val);
            }}
          >
            {langOptions.map((opt) => (
              <MenuItemOption
                key={opt.value}
                value={opt.value}
                bg="transparent"
                _hover={{ bg: APP_SURFACE_MUTED }}
                _checked={{ fontWeight: "bold" }}
                fontSize="sm"
                fontFamily="monospace"
              >
                <HStack spacing={2}>
                  <Text fontSize="lg" lineHeight="1">
                    {opt.flag}
                  </Text>
                  <Text color={APP_TEXT_PRIMARY}>{opt.label}</Text>
                </HStack>
              </MenuItemOption>
            ))}
          </MenuOptionGroup>
        </MenuList>
      </Menu>
    </Box>
  );
};

const ThemeModeToggle = ({ themeMode, onModeChange }) => {
  const isDark = themeMode === "dark";
  const nextMode = isDark ? "light" : "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <IconButton
      type="button"
      aria-label={label}
      title={label}
      onClick={() => onModeChange(nextMode)}
      icon={isDark ? <FaMoon size={11} /> : <FaSun size={11} />}
      size="sm"
      minW="40px"
      h="40px"
      rounded="full"
      bg={APP_SURFACE_ELEVATED}
      border="1px solid"
      borderColor={APP_BORDER}
      boxShadow={APP_SHADOW}
      backdropFilter="blur(20px)"
      _hover={{ bg: APP_SURFACE_MUTED }}
      _active={{ bg: APP_SURFACE_MUTED }}
    />
  );
};

// 8-bit pixel star with random direction movement
function PixelStar({
  size,
  startX,
  startY,
  delay,
  duration,
  color,
  dirX,
  dirY,
}) {
  // Create unique keyframes for each star's direction
  const starMove = keyframes`
    0% {
      transform: translateX(0) translateY(0);
      opacity: 0;
    }
    5% { opacity: 1; }
    95% { opacity: 1; }
    100% {
      transform: translateX(${dirX}vw) translateY(${dirY}vh);
      opacity: 0;
    }
  `;

  return (
    <Box
      position="absolute"
      top={startY}
      left={startX}
      w={`${size}px`}
      h={`${size}px`}
      bg={color}
      boxShadow={`0 0 ${size * 2}px ${color}`}
      animation={`${starMove} ${duration}s linear infinite, ${pixelFlicker} 2s steps(2) infinite`}
      animationDelay={`${delay}s`}
      pointerEvents="none"
      sx={{
        imageRendering: "pixelated",
      }}
    />
  );
}

function RetroStarfield({ isLightTheme = false }) {
  const stars = useMemo(() => {
    const starArray = [];
    // Neon 80s colors
    const colors = isLightTheme
      ? [
          "#0f766e",
          "#1d4ed8",
          "#db2777",
          "#a16207",
          "#ffffff",
          "#7c3aed",
        ]
      : [
          "#ff00ff", // Magenta
          "#00ffff", // Cyan
          "#ff6ec7", // Hot pink
          "#39ff14", // Neon green
          "#fff", // White
          "#ffff00", // Yellow
        ];

    for (let i = 0; i < 30; i++) {
      // Random direction for each star
      const angle = Math.random() * Math.PI * 2;
      const distance = 80 + Math.random() * 40; // How far it travels

      starArray.push({
        id: i,
        size: Math.random() < 0.3 ? 4 : Math.random() < 0.6 ? 3 : 2,
        startX: `${Math.random() * 100}%`,
        startY: `${Math.random() * 100}%`,
        delay: Math.random() * 20,
        duration: 25 + Math.random() * 20, // Slower: 25-45 seconds
        color: colors[Math.floor(Math.random() * colors.length)],
        dirX: Math.cos(angle) * distance,
        dirY: Math.sin(angle) * distance,
      });
    }
    return starArray;
  }, [isLightTheme]);

  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      overflow="hidden"
      pointerEvents="none"
    >
      {stars.map((star) => (
        <PixelStar key={star.id} {...star} />
      ))}

      {/* Retro grid lines */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={isLightTheme ? 0.08 : 0.03}
        backgroundImage={
          isLightTheme
            ? "linear-gradient(rgba(155,135,112,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(155,135,112,0.14) 1px, transparent 1px)"
            : "linear-gradient(#ff00ff 1px, transparent 1px), linear-gradient(90deg, #ff00ff 1px, transparent 1px)"
        }
        backgroundSize={isLightTheme ? "42px 42px" : "50px 50px"}
        pointerEvents="none"
      />

      {!isLightTheme && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          height="4px"
          bg="linear-gradient(transparent, rgba(255,255,255,0.03), transparent)"
          animation={`${scanline} 8s linear infinite`}
          pointerEvents="none"
        />
      )}

      {/* Vignette effect */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg={
          isLightTheme
            ? "radial-gradient(ellipse at center, transparent 0%, rgba(111,86,54,0.1) 100%)"
            : "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)"
        }
        pointerEvents="none"
      />
    </Box>
  );
}

function LinkCard({
  title,
  description,
  href,
  visual,
  onLaunch,
  onLaunchSound,
  onLaunchEvent,
  launchAppText,
  secondaryAction,
  isLightTheme = false,
}) {
  const primaryActionColor = isLightTheme ? "#0f766e" : "#00ffff";
  const secondaryActionColor =
    isLightTheme && secondaryAction?.color === "#4da3ff"
      ? "#1d4ed8"
      : secondaryAction?.color || "#4da3ff";

  const primaryActionProps = onLaunch
    ? {
        as: "button",
        onClick: () => {
          onLaunchSound?.();
          onLaunchEvent?.();
          onLaunch?.();
        },
      }
    : {
        as: "a",
        href,
        target: "_blank",
        rel: "noopener noreferrer",
        onClick: () => {
          onLaunchSound?.();
          onLaunchEvent?.();
        },
      };

  const secondaryActionProps = secondaryAction?.onClick
    ? {
        as: "button",
        onClick: () => {
          onLaunchSound?.();
          secondaryAction.onEvent?.();
          secondaryAction.onClick?.();
        },
      }
    : {
        as: "a",
        href: secondaryAction?.href,
        target: "_blank",
        rel: "noopener noreferrer",
        onClick: () => {
          onLaunchSound?.();
          secondaryAction?.onEvent?.();
        },
      };

  return (
    <Box
      w="100%"
      bg={isLightTheme ? "transparent" : "rgba(7, 16, 29, 0.65)"}
      color={isLightTheme ? APP_TEXT_PRIMARY : "white"}
      border="1px solid"
      borderColor={isLightTheme ? APP_BORDER : "rgba(0, 255, 255, 0.08)"}
      borderRadius="36px"
      px={{ base: 4, md: 6 }}
      py={{ base: 4, md: 5 }}
      boxShadow={
        isLightTheme ? APP_SHADOW : "0 0 10px rgba(0, 255, 255, 0.15)"
      }
    >
      <Stack
        direction="column"
        spacing={{ base: 4, md: 6 }}
        align="center"
        textAlign="center"
      >
        <Box
          w={{ base: "140px", md: "160px" }}
          minW={{ base: "140px", md: "160px" }}
          display="flex"
          justifyContent="center"
          alignItems="center"
          animation={`${drift} 6s ease-in-out infinite`}
        >
          {visual}
        </Box>
        <VStack spacing={3} align="center">
          <Heading
            size="md"
            fontFamily="monospace"
            letterSpacing="wider"
            color={isLightTheme ? APP_TEXT_PRIMARY : "white"}
            textAlign={"center"}
          >
            {title}
          </Heading>
          <Text
            color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}
            fontSize={{ base: "xs", md: "md" }}
            maxW="520px"
            fontFamily="monospace"
            textAlign={"left"}
          >
            {description}
          </Text>
          <HStack spacing={3} align="center" justify="center" flexWrap="wrap">
            <Button
              {...primaryActionProps}
              variant="outline"
              bg={isLightTheme ? APP_SURFACE_ELEVATED : undefined}
              borderColor={primaryActionColor}
              color={primaryActionColor}
              fontFamily="monospace"
              size="sm"
              px={6}
              py={4}
              minH="44px"
              _hover={{
                bg: isLightTheme ? APP_SURFACE_MUTED : "transparent",
                borderColor: primaryActionColor,
                color: primaryActionColor,
                textDecoration: "none",
                opacity: 0.8,
              }}
              _active={{
                bg: isLightTheme ? APP_SURFACE_MUTED : "transparent",
                color: primaryActionColor,
              }}
              _focus={{
                boxShadow: "none",
              }}
              sx={{
                "&:visited": { color: primaryActionColor },
              }}
            >
              {launchAppText || "Launch app"}
            </Button>
            {secondaryAction ? (
              <Button
                {...secondaryActionProps}
                variant="outline"
                bg={isLightTheme ? APP_SURFACE_ELEVATED : undefined}
                borderColor={secondaryActionColor}
                color={secondaryActionColor}
                fontFamily="monospace"
                size="sm"
                px={6}
                py={4}
                minH="44px"
                _hover={{
                  bg: isLightTheme ? APP_SURFACE_MUTED : "transparent",
                  borderColor: secondaryActionColor,
                  color: secondaryActionColor,
                  textDecoration: "none",
                  opacity: 0.8,
                }}
                _active={{
                  bg: isLightTheme ? APP_SURFACE_MUTED : "transparent",
                  color: secondaryActionColor,
                }}
                _focus={{
                  boxShadow: "none",
                }}
                sx={{
                  "&:visited": { color: secondaryActionColor },
                }}
              >
                {secondaryAction.label}
              </Button>
            ) : null}
          </HStack>
        </VStack>
      </Stack>
    </Box>
  );
}

export default function LinksPage() {
  const { generateNostrKeys, auth, postNostrContent, connectToNostr } =
    useDecentralizedIdentity();
  const themeMode = useThemeStore((s) => s.themeMode);
  const syncThemeMode = useThemeStore((s) => s.syncThemeMode);
  const isLightTheme = themeMode === "light";

  // Language state
  const { language, initLanguage, setLanguage, t } = useLanguage();
  const translations = t(linksPageTranslations);
  const [npub, setNpub] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [nsecInput, setNsecInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [profilePicture, setProfilePicture] = useState("");
  const [profilePictureUrlInput, setProfilePictureUrlInput] = useState("");
  const [randomCharacterKey] = useState(
    () => Math.floor(Math.random() * 21) + 20,
  ); // Random between 20-40
  const [noSabosOrbState] = useState(pickRandomVoiceOrbState);
  const [roleIndex, setRoleIndex] = useState(0);

  // Wallet state
  const [walletHydrating, setWalletHydrating] = useState(true);
  const [noWalletFound, setNoWalletFound] = useState(false);
  const [nsecForWallet, setNsecForWallet] = useState("");

  // Wallet store selectors
  const cashuWallet = useNostrWalletStore((s) => s.cashuWallet);
  const walletBalance = useNostrWalletStore((s) => s.walletBalance);
  const createNewWallet = useNostrWalletStore((s) => s.createNewWallet);
  const initiateDeposit = useNostrWalletStore((s) => s.initiateDeposit);
  const invoice = useNostrWalletStore((s) => s.invoice);
  const isCreatingWallet = useNostrWalletStore((s) => s.isCreatingWallet);
  const walletInit = useNostrWalletStore((s) => s.init);
  const initWallet = useNostrWalletStore((s) => s.initWallet);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isRbeOpen,
    onOpen: onRbeOpen,
    onClose: onRbeClose,
  } = useDisclosure();
  const {
    isOpen: isAboutOpen,
    onOpen: onAboutOpen,
    onClose: onAboutClose,
  } = useDisclosure();
  const toast = useToast();
  const playSound = useSoundSettings((s) => s.playSound);
  const primaryAccent = isLightTheme ? "#0f766e" : "#00ffff";
  const secondaryAccent = isLightTheme ? "#c026d3" : "#ff00ff";
  const linkAccent = isLightTheme ? "#1d4ed8" : "#4da3ff";
  const walletAccent = isLightTheme ? "#15803d" : "#16b078";
  const modalOverlayBg = isLightTheme ? "rgba(76, 60, 40, 0.24)" : "blackAlpha.800";
  const modalBg = isLightTheme ? APP_SURFACE_ELEVATED : "rgba(7, 16, 29, 0.95)";
  const modalBorderColor = isLightTheme ? APP_BORDER_STRONG : primaryAccent;
  const modalBorderSoft = isLightTheme ? APP_BORDER : "rgba(0, 255, 255, 0.3)";
  const modalHeadingColor = isLightTheme ? APP_TEXT_PRIMARY : primaryAccent;
  const labelColor = isLightTheme ? APP_TEXT_SECONDARY : "gray.400";
  const helperColor = isLightTheme ? APP_TEXT_MUTED : "gray.500";
  const inputBg = isLightTheme ? APP_SURFACE : "rgba(0, 0, 0, 0.3)";
  const inputBorderColor = isLightTheme ? APP_BORDER : "gray.600";

  const modalScrollSx = useMemo(
    () => ({
      "&::-webkit-scrollbar": {
        width: "8px",
      },
      "&::-webkit-scrollbar-track": {
        background: isLightTheme ? "rgba(96, 77, 56, 0.08)" : "rgba(0, 0, 0, 0.3)",
        borderRadius: "4px",
      },
      "&::-webkit-scrollbar-thumb": {
        background: isLightTheme
          ? "linear-gradient(180deg, #d6c1a7 0%, #0f766e 100%)"
          : "linear-gradient(180deg, #00ffff 0%, #ff00ff 100%)",
        borderRadius: "4px",
        border: "2px solid transparent",
        backgroundClip: "padding-box",
      },
      "&::-webkit-scrollbar-thumb:hover": {
        background: isLightTheme
          ? "linear-gradient(180deg, #cbb391 0%, #0e7490 100%)"
          : "linear-gradient(180deg, #00cccc 0%, #cc00cc 100%)",
        backgroundClip: "padding-box",
      },
      scrollbarWidth: "thin",
      scrollbarColor: isLightTheme
        ? "#b28f6d rgba(96, 77, 56, 0.08)"
        : "#00ffff rgba(0, 0, 0, 0.3)",
    }),
    [isLightTheme],
  );

  const hasTriggeredKeygen = useRef(false);

  // Detect if user is logged in via NIP-07 extension
  const isNip07Mode =
    typeof window !== "undefined" &&
    localStorage.getItem("nip07_signer") === "true";

  // Wallet balance computed
  const totalBalance = useMemo(() => {
    const numeric = Number(walletBalance);
    return Number.isFinite(numeric) ? numeric : 0;
  }, [walletBalance]);

  // Hydrate wallet on mount
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const connected = await walletInit();
        if (connected) {
          const wallet = await initWallet();
          if (alive && !wallet) {
            setNoWalletFound(true);
          }
        }
      } catch (e) {
        console.warn("Wallet hydrate failed:", e);
      } finally {
        if (alive) setWalletHydrating(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [walletInit, initWallet]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % roleCycle.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Initialize language based on timezone detection
  useEffect(() => {
    initLanguage();
  }, [initLanguage]);

  // Load stored npub, displayName, and profilePicture
  useEffect(() => {
    const storedNpub = localStorage.getItem("local_npub");
    const storedDisplayName = localStorage.getItem("displayName");
    const storedProfilePicture = localStorage.getItem("profilePicture");
    const storedProfilePictureUrl = localStorage.getItem("profilePictureUrl");
    if (storedNpub) {
      setNpub(storedNpub);
    }
    if (storedDisplayName) {
      setDisplayName(storedDisplayName);
      setUsernameInput(storedDisplayName);
    }
    if (storedProfilePicture) {
      setProfilePicture(storedProfilePicture);
    }
    if (storedProfilePictureUrl) {
      setProfilePictureUrlInput(storedProfilePictureUrl);
      if (!storedProfilePicture) {
        setProfilePicture(storedProfilePictureUrl);
      }
    }
  }, []);

  const rbeUrl = "https://robotsbuildingeducation.com";
  const handleSelectSound = () => playSound(selectSound);
  const handleSubmitActionSound = () => playSound(submitActionSound);
  const handleThemeModeChange = (nextMode) => {
    if (nextMode === themeMode) return;
    handleSelectSound();
    syncThemeMode(nextMode);
  };

  // Wallet handlers
  const handleCreateWallet = async () => {
    // If NIP-07 mode and no nsec provided, show error
    if (isNip07Mode && noWalletFound && !nsecForWallet.trim()) {
      toast({
        title: translations.secretKeyRequired,
        description: translations.secretKeyRequiredToast,
        status: "warning",
        duration: 2500,
      });
      return;
    }

    // Validate nsec format if provided
    if (nsecForWallet.trim() && !nsecForWallet.trim().startsWith("nsec")) {
      toast({
        title: translations.invalidKey,
        description: translations.keyMustStartNsec,
        status: "error",
        duration: 2500,
      });
      return;
    }

    try {
      // Pass the nsec to createNewWallet if we're in NIP-07 mode
      const nsecToUse =
        isNip07Mode && nsecForWallet.trim() ? nsecForWallet.trim() : null;
      await createNewWallet(nsecToUse);

      // Clear the nsec input after successful wallet creation
      setNsecForWallet("");
      setNoWalletFound(false);
    } catch (err) {
      console.error("Error creating wallet:", err);
      toast({
        title: translations.error,
        description: translations.failedCreateWallet,
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleInitiateDeposit = async () => {
    try {
      await initiateDeposit(100); // 100 sats minimum
    } catch (err) {
      console.error("Error initiating deposit:", err);
      toast({
        title: translations.error,
        description: translations.failedDeposit,
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleCopyInvoice = async () => {
    try {
      await navigator.clipboard.writeText(invoice || "");
      toast({
        title: translations.addressCopied,
        description: translations.invoiceCopied,
        status: "success",
        duration: 1500,
        isClosable: true,
        position: "top",
      });
    } catch {
      // Ignore clipboard write failures here; the user can retry.
    }
  };

  const links = [
    {
      title: translations.noSabosTitle,
      description: translations.noSabosDescription,
      href: "https://nosabos.app",
      analyticsName: "nosabos_app",
      visual: (
        <Box
          w={{ base: "110px", md: "120px" }}
          h={{ base: "110px", md: "120px" }}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <VoiceOrb state={noSabosOrbState} />
        </Box>
      ),
      launchAppText: translations.launchApp,
    },
    {
      title: translations.rbeTitle,
      description: translations.rbeDescription,
      href: rbeUrl,
      analyticsName: "robots_building_education",
      onLaunch: onRbeOpen,
      visual: (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          w={{ base: "110px", md: "120px" }}
          h={{ base: "110px", md: "120px" }}
          transform="scale(0.75)"
          transformOrigin="center"
        >
          <CloudCanvas />
        </Box>
      ),
      launchAppText: translations.launchApp,
    },
    // {
    //   title: translations.roadmapCashTitle,
    //   description: translations.roadmapCashDescription,
    //   href: "https://roadmap.cash",
    //   analyticsName: "roadmap_cash",
    //   visual: (
    //     <Box
    //       w={{ base: "140px", md: "140px" }}
    //       h={{ base: "140px", md: "140px" }}
    //       display="flex"
    //       alignItems="center"
    //       justifyContent="center"
    //     >
    //       <AnimatedLogo showWordmark={false} size={140} />
    //     </Box>
    //   ),
    //   launchAppText: translations.launchApp,
    // },
    {
      title: translations.patreonTitle,
      description: translations.patreonDescription,
      href: "https://patreon.com/NotesAndOtherStuff",
      analyticsName: "patreon",
      visual: (
        <Box
          w={{ base: "110px", md: "120px" }}
          h={{ base: "110px", md: "120px" }}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <RoleCanvas
            role={roleCycle[roleIndex]}
            width={90}
            height={90}
            transparent={true}
          />
        </Box>
      ),
      launchAppText: translations.subscribe,
      secondaryAction: {
        label: translations.buyApps,
        href: "https://www.patreon.com/posts/146522893?forSale=true",
        color: "#4da3ff",
      },
    },
  ];

  // Get display text for welcome message
  const getWelcomeText = () => {
    if (displayName) {
      return displayName;
    }
    if (npub) {
      return npub.substring(0, 7);
    }
    return "...";
  };

  // Handle profile save (username and picture)
  const handleSaveProfile = async () => {
    if (!usernameInput.trim() && !profilePictureUrlInput.trim()) {
      toast({
        title: translations.noChanges,
        description: translations.enterUsernameOrPicture,
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSaving(true);
    try {
      const trimmedProfilePictureUrl = profilePictureUrlInput.trim();

      // Build metadata object
      const metadata = {
        name: usernameInput.trim() || displayName || "",
        about: "A student onboarded with Robots Building Education",
      };

      // Add picture if provided
      if (trimmedProfilePictureUrl) {
        metadata.picture = trimmedProfilePictureUrl;
        metadata.profilePictureUrl = trimmedProfilePictureUrl;
      }

      // Post kind 0 (metadata) event to update profile
      await postNostrContent(JSON.stringify(metadata), 0);

      // Save to localStorage and Firestore
      if (usernameInput.trim()) {
        localStorage.setItem("displayName", usernameInput.trim());
        setDisplayName(usernameInput.trim());

        // Also persist to user document in Firestore
        const storedNpub = localStorage.getItem("local_npub");
        if (storedNpub) {
          await updateDoc(doc(database, "users", storedNpub), {
            displayName: usernameInput.trim(),
          });
        }
      }

      if (trimmedProfilePictureUrl) {
        localStorage.setItem("profilePicture", trimmedProfilePictureUrl);
        localStorage.setItem("profilePictureUrl", trimmedProfilePictureUrl);
      }

      if (trimmedProfilePictureUrl) {
        setProfilePicture(trimmedProfilePictureUrl);
      }

      toast({
        position: "top",
        title: translations.profileUpdated,
        description: translations.profileSaved,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast({
        title: translations.error,
        description: error.message || translations.failedUpdateProfile,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle copy secret key
  const handleCopySecretKey = async () => {
    const nsec = localStorage.getItem("local_nsec");
    if (!nsec || nsec === "nip07") {
      toast({
        position: "top",
        title: translations.noSecretKey,
        description: translations.usingExtension,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(nsec);
      toast({
        position: "top",
        title: translations.copied,
        description: translations.secretKeyCopied,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch {
      toast({
        title: translations.error,
        description: translations.failedCopy,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Fetch profile from Nostr for a given npub
  const fetchNostrProfile = async (npubToFetch) => {
    try {
      const connection = await connectToNostr();
      if (!connection) return null;

      const { ndkInstance } = connection;

      // Convert npub to hex
      const { words: npubWords } = bech32.decode(npubToFetch);
      const hexNpub = Buffer.from(bech32.fromWords(npubWords)).toString("hex");

      const filter = {
        kinds: [NDKKind.Metadata],
        authors: [hexNpub],
        limit: 1,
      };

      const subscription = ndkInstance.subscribe(filter, { closeOnEose: true });

      return new Promise((resolve) => {
        let profile = null;
        subscription.on("event", (event) => {
          try {
            const metadata = JSON.parse(event.content);
            profile = metadata;
          } catch (e) {
            console.error("Failed to parse profile metadata:", e);
          }
        });
        subscription.on("eose", () => {
          resolve(profile);
        });
        // Timeout after 5 seconds
        setTimeout(() => resolve(profile), 5000);
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      return null;
    }
  };

  // Handle switch account
  const handleSwitchAccount = async () => {
    if (!nsecInput.trim() || !nsecInput.startsWith("nsec")) {
      toast({
        title: translations.invalidKey,
        description: translations.enterValidNsec,
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSwitching(true);
    try {
      const result = await auth(nsecInput.trim());
      if (result) {
        const newNpub = result.user.npub;
        setNpub(newNpub);
        setNsecInput("");

        // Fetch profile from Nostr to get username and picture
        const profile = await fetchNostrProfile(newNpub);
        if (profile?.name) {
          localStorage.setItem("displayName", profile.name);
          setDisplayName(profile.name);
          setUsernameInput(profile.name);
        } else {
          localStorage.setItem("displayName", "");
          setDisplayName("");
          setUsernameInput("");
        }

        if (profile?.picture) {
          localStorage.setItem("profilePicture", profile.picture);
          localStorage.setItem("profilePictureUrl", profile.picture);
          setProfilePicture(profile.picture);
          setProfilePictureUrlInput(profile.picture);
        } else {
          localStorage.setItem("profilePicture", "");
          localStorage.setItem("profilePictureUrl", "");
          setProfilePicture("");
          setProfilePictureUrlInput("");
        }

        toast({
          position: "top",
          title: translations.accountSwitched,
          description: translations.loginSuccess,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        onClose();
      } else {
        throw new Error("Failed to authenticate");
      }
    } catch (error) {
      console.error("Failed to switch account:", error);
      toast({
        title: translations.error,
        description: translations.authFailed,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSwitching(false);
    }
  };

  // Background Nostr key generation (no UI)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasStoredKeys =
      Boolean(localStorage.getItem("local_nsec")) &&
      Boolean(localStorage.getItem("local_npub"));

    if (hasStoredKeys) {
      return;
    }

    if (hasTriggeredKeygen.current) {
      return;
    }

    hasTriggeredKeygen.current = true;
    let isMounted = true;
    const createInstantKeys = async () => {
      try {
        const defaultDisplayName = "";
        const did = await generateNostrKeys(defaultDisplayName);
        if (!isMounted) return;
        localStorage.setItem("displayName", defaultDisplayName);
        if (did?.npub) {
          setNpub(did.npub);
        }
      } catch (error) {
        console.error("Failed to generate instant Nostr keys:", error);
      }
    };

    createInstantKeys();

    return () => {
      isMounted = false;
    };
  }, [generateNostrKeys]);

  return (
    <Box
      minH="100dvh"
      bg={isLightTheme ? APP_PAGE_BG : "rgba(7,16,29)"}
      color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
      position="relative"
      overflow="hidden"
      sx={isLightTheme ? LINKS_PAPER_PAGE_SX : undefined}
      style={{
        "--links-accent-primary": isLightTheme ? "#0f766e" : "#00ffff",
        "--links-accent-warm": isLightTheme ? "#b45309" : "gold",
        "--links-accent-pink": isLightTheme ? "#db2777" : "hotpink",
      }}
    >
      <RetroStarfield isLightTheme={isLightTheme} />
      <Container
        maxW="container.md"
        position="relative"
        zIndex={1}
        mt={2}
        pb={{ base: 16, md: 16 }}
      >
        <VStack spacing={6} textAlign="center">
          {/* Top bar: language menu left, theme toggle right */}
          <Box w="100%" display="flex" justifyContent="space-between" alignItems="center">
            <LanguageMenuFixed
              language={language}
              onSelect={setLanguage}
              playSound={handleSelectSound}
              translations={translations}
            />
            <ThemeModeToggle
              themeMode={themeMode}
              onModeChange={handleThemeModeChange}
            />
          </Box>
          {/* Profile Picture or Random Character */}
          {profilePicture ? (
            <Box
              w="100px"
              h="100px"
              borderRadius="full"
              overflow="hidden"
              border="3px solid"
              borderColor={isLightTheme ? APP_BORDER_STRONG : primaryAccent}
              boxShadow={
                isLightTheme
                  ? "0 10px 24px rgba(111, 86, 54, 0.12)"
                  : "0 0 20px rgba(0, 255, 255, 0.4)"
              }
            >
              <img
                src={profilePicture}
                alt="Profile"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </Box>
          ) : (
            <RandomCharacter
              notSoRandomCharacter={randomCharacterKey}
              width="50px"
            />
          )}

          <Heading
            size="sm"
            fontFamily="monospace"
            letterSpacing="wider"
            color={isLightTheme ? APP_TEXT_PRIMARY : "white"}
          >
            {translations.welcome}, {getWelcomeText()}
          </Heading>

          <HStack spacing={3}>
            <Button
              onClick={() => {
                handleSelectSound();
                onOpen();
              }}
              variant="outline"
              bg={isLightTheme ? APP_SURFACE : undefined}
              fontFamily="monospace"
              borderColor={primaryAccent}
              color={primaryAccent}
              boxShadow={isLightTheme ? APP_SHADOW : undefined}
              _hover={{
                bg: isLightTheme ? APP_SURFACE_MUTED : "transparent",
                borderColor: primaryAccent,
              }}
            >
              {translations.profile}
            </Button>
            <Button
              onClick={() => {
                handleSelectSound();
                onAboutOpen();
              }}
              variant="outline"
              bg={isLightTheme ? APP_SURFACE : undefined}
              fontFamily="monospace"
              borderColor={primaryAccent}
              color={primaryAccent}
              boxShadow={isLightTheme ? APP_SHADOW : undefined}
              _hover={{
                bg: isLightTheme ? APP_SURFACE_MUTED : "transparent",
                borderColor: primaryAccent,
              }}
            >
              {translations.about}
            </Button>
          </HStack>

        </VStack>

        {/* Links List */}
        <VStack spacing={6} w="100%" mt={6}>
          {links.map((link) => (
            <LinkCard
              key={link.title}
              {...link}
              isLightTheme={isLightTheme}
              onLaunchSound={handleSubmitActionSound}
              onLaunchEvent={() => {
                if (!isLocalhost() && !link.onLaunch) {
                  logEvent(analytics, "links_launch_app", {
                    app: link.analyticsName,
                  });
                }
              }}
              launchAppText={link.launchAppText}
            />
          ))}
        </VStack>

        {/* Social Media Icons */}
        <HStack spacing={8} justify="center" mt={16}>
          <Box
            aria-label="Instagram"
            bg="radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)"
            borderRadius="12px"
            w="36px"
            h="36px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="white"
            cursor="pointer"
            onClick={() => {
              handleSelectSound();
              if (!isLocalhost()) {
                logEvent(analytics, "links_social_click", {
                  platform: "instagram",
                });
              }
              window.open(
                "https://www.instagram.com/sheilfer",
                "_blank",
                "noopener,noreferrer",
              );
            }}
          >
            <FaInstagram size={24} />
          </Box>
          <Box
            aria-label="LinkedIn"
            bg="#0A66C2"
            borderRadius="12px"
            w="36px"
            h="36px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="white"
            cursor="pointer"
            onClick={() => {
              handleSelectSound();
              if (!isLocalhost()) {
                logEvent(analytics, "links_social_click", {
                  platform: "linkedin",
                });
              }
              window.open(
                "https://www.linkedin.com/in/sheilfer",
                "_blank",
                "noopener,noreferrer",
              );
            }}
          >
            <FaLinkedinIn size={18} />
          </Box>
        </HStack>
      </Container>

      {/* Robots Building Education Modal */}
      <Modal isOpen={isRbeOpen} onClose={onRbeClose} isCentered size="md">
        <ModalOverlay bg={modalOverlayBg} />
        <ModalContent
          bg={modalBg}
          color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
          border="1px solid"
          borderColor={modalBorderColor}
          rounded="xl"
          boxShadow={isLightTheme ? APP_SHADOW : "0 0 30px rgba(0, 255, 255, 0.3)"}
          fontFamily="monospace"
        >
          <ModalHeader
            borderBottom="1px solid"
            borderColor={modalBorderSoft}
            color={modalHeadingColor}
          >
            {translations.rbeModalTitle}
          </ModalHeader>
          <ModalCloseButton
            color={modalHeadingColor}
            onClick={handleSelectSound}
            _hover={{ bg: isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.100" }}
          />
          <ModalBody py={6}>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"}>
                {translations.rbeModalDescription}
              </Text>
              <Button
                onClick={() => {
                  handleSelectSound();
                  handleCopySecretKey();
                }}
                variant={isLightTheme ? "outline" : "solid"}
                bg={isLightTheme ? APP_SURFACE : "#00aaff"}
                w="100%"
                borderColor={isLightTheme ? linkAccent : undefined}
                color={isLightTheme ? linkAccent : "white"}
                _hover={
                  isLightTheme
                    ? { bg: APP_SURFACE_MUTED, borderColor: linkAccent }
                    : undefined
                }
              >
                {translations.copySecretKey}
              </Button>
              <Button
                as="a"
                href={rbeUrl}
                target="_blank"
                rel="noopener noreferrer"
                bg={isLightTheme ? primaryAccent : "#009c9c"}
                color={isLightTheme ? "#f8fafc" : "white"}
                w="100%"
                boxShadow={
                  isLightTheme ? "0 8px 18px rgba(15, 118, 110, 0.16)" : undefined
                }
                _hover={
                  isLightTheme
                    ? { bg: "#0d9488" }
                    : undefined
                }
                onClick={() => {
                  handleSubmitActionSound();
                  if (!isLocalhost()) {
                    logEvent(analytics, "links_launch_app", {
                      app: "robots_building_education",
                    });
                  }
                  onRbeClose();
                }}
              >
                {translations.goToApp}
              </Button>
            </VStack>
          </ModalBody>
          <ModalFooter
            borderTop="1px solid"
            borderColor={modalBorderSoft}
          >
            <Button
              onClick={() => {
                handleSelectSound();
                onRbeClose();
              }}
              variant="ghost"
              color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}
              _hover={{ bg: isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.100" }}
            >
              {translations.close}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Profile Customization Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        isCentered
        size="md"
        scrollBehavior="inside"
      >
        <ModalOverlay bg={modalOverlayBg} />
        <ModalContent
          bg={modalBg}
          color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
          border="1px solid"
          borderColor={modalBorderColor}
          rounded="xl"
          boxShadow={isLightTheme ? APP_SHADOW : "0 0 30px rgba(0, 255, 255, 0.3)"}
          fontFamily="monospace"
          maxH="85vh"
          style={{
            "--links-accent-primary": isLightTheme ? "#0f766e" : "#00ffff",
            "--links-accent-warm": isLightTheme ? "#b45309" : "gold",
            "--links-accent-pink": isLightTheme ? "#db2777" : "hotpink",
          }}
        >
          <ModalHeader
            borderBottom="1px solid"
            borderColor={modalBorderSoft}
            color={modalHeadingColor}
          >
            {translations.customizeProfileTitle}
          </ModalHeader>
          <ModalCloseButton
            color={modalHeadingColor}
            onClick={handleSelectSound}
            _hover={{ bg: isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.100" }}
          />
          <ModalBody py={6} overflowY="auto" sx={modalScrollSx}>
            <VStack spacing={6} align="stretch">
              {/* Username Section */}
              <Box>
                <Text fontSize="sm" color={labelColor} mb={2}>
                  {translations.username}
                </Text>
                <Input
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder={translations.enterUsername}
                  bg={inputBg}
                  border="1px solid"
                  borderColor={inputBorderColor}
                  color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
                  _placeholder={{ color: helperColor }}
                  _focus={{
                    borderColor: primaryAccent,
                    boxShadow: isLightTheme
                      ? "0 0 0 3px rgba(15, 118, 110, 0.12)"
                      : "0 0 10px rgba(0, 255, 255, 0.3)",
                  }}
                />
              </Box>

              {/* Profile Picture Section */}
              <Box>
                <Text fontSize="sm" color={labelColor} mb={2}>
                  {translations.profilePictureUrl}
                </Text>
                <Input
                  value={profilePictureUrlInput}
                  onChange={(e) => setProfilePictureUrlInput(e.target.value)}
                  placeholder={translations.profilePicturePlaceholder}
                  bg={inputBg}
                  border="1px solid"
                  borderColor={inputBorderColor}
                  color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
                  _placeholder={{ color: helperColor }}
                  _focus={{
                    borderColor: primaryAccent,
                    boxShadow: isLightTheme
                      ? "0 0 0 3px rgba(15, 118, 110, 0.12)"
                      : "0 0 10px rgba(0, 255, 255, 0.3)",
                  }}
                />
              </Box>

              {/* Save Profile Button */}
              <Button
                onClick={() => {
                  handleSubmitActionSound();
                  if (!isLocalhost()) {
                    logEvent(analytics, "links_save_profile");
                  }
                  handleSaveProfile();
                }}
                isLoading={isSaving}
                bg={isLightTheme ? primaryAccent : "#00ffff"}
                color={isLightTheme ? "#f8fafc" : "black"}
                w="100%"
                boxShadow={
                  isLightTheme ? "0 8px 18px rgba(15, 118, 110, 0.16)" : undefined
                }
                _hover={isLightTheme ? { bg: "#0d9488" } : undefined}
              >
                {translations.saveProfile}
              </Button>

              <Divider borderColor={isLightTheme ? APP_BORDER : "rgba(255, 0, 255, 0.3)"} />

              {/* Secret Key Section */}
              <Box>
                <Text fontSize="sm" color={labelColor} mb={2}>
                  {translations.secretKey}
                </Text>
                <Button
                  onClick={() => {
                    handleSelectSound();
                    handleCopySecretKey();
                  }}
                  variant="outline"
                  bg={isLightTheme ? APP_SURFACE : undefined}
                  borderColor={secondaryAccent}
                  color={secondaryAccent}
                  w="100%"
                  _hover={
                    isLightTheme
                      ? { bg: APP_SURFACE_MUTED, borderColor: secondaryAccent }
                      : undefined
                  }
                >
                  {translations.copySecretKey}
                </Button>
                <Text fontSize="xs" color={helperColor} mt={2}>
                  {translations.secretKeyWarning}
                </Text>
              </Box>
              {/* Switch Account Accordion */}
              <Accordion allowToggle>
                <AccordionItem border="none">
                  <AccordionButton px={0} _hover={{ bg: "transparent" }}>
                    <Box flex="1" textAlign="left">
                      <Text fontSize="sm" color={labelColor}>
                        {translations.switchAccount}
                      </Text>
                    </Box>
                    <AccordionIcon color={secondaryAccent} />
                  </AccordionButton>
                  <AccordionPanel px={0} pt={3}>
                    <VStack spacing={3} align="stretch">
                      <Input
                        value={nsecInput}
                        onChange={(e) => setNsecInput(e.target.value)}
                        placeholder={translations.pasteNsec}
                        bg={inputBg}
                        border="1px solid"
                        borderColor={inputBorderColor}
                        type="password"
                        color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
                        _placeholder={{ color: helperColor }}
                        _focus={{
                          borderColor: secondaryAccent,
                          boxShadow: isLightTheme
                            ? "0 0 0 3px rgba(192, 38, 211, 0.12)"
                            : "0 0 10px rgba(255, 0, 255, 0.3)",
                        }}
                      />
                      <Button
                        onClick={() => {
                          handleSelectSound();
                          handleSwitchAccount();
                        }}
                        isLoading={isSwitching}
                        variant="outline"
                        bg={isLightTheme ? APP_SURFACE : undefined}
                        borderColor={secondaryAccent}
                        color={secondaryAccent}
                        _hover={
                          isLightTheme
                            ? {
                                bg: APP_SURFACE_MUTED,
                                borderColor: secondaryAccent,
                              }
                            : undefined
                        }
                      >
                        {translations.switchAccount}
                      </Button>
                      <Text fontSize="xs" color={helperColor}>
                        {translations.switchAccountHelp}
                      </Text>
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>

              <Divider borderColor={isLightTheme ? APP_BORDER : "rgba(0, 255, 255, 0.3)"} />
              {/* Bitcoin Wallet Section */}
              <Box
                bg={isLightTheme ? APP_SURFACE : "rgba(0, 0, 0, 0.3)"}
                rounded="md"
                p={4}
                border="1px solid"
                borderColor={walletAccent}
              >
                <Text fontSize="sm" color={walletAccent} fontWeight="bold" mb={3}>
                  {translations.bitcoinWallet}
                </Text>

                <Text fontSize="xs" color={labelColor} mb={4}>
                  {translations.walletDescription1}
                </Text>

                <Text fontSize="xs" color={labelColor} mb={4}>
                  {translations.walletDescription2}
                </Text>

                {/* Loading/hydration spinner */}
                {walletHydrating && !cashuWallet && (
                  <HStack py={2}>
                    <VoiceOrb
                      state={
                        ["idle", "listening", "speaking"][
                          Math.floor(Math.random() * 3)
                        ]
                      }
                      size={24}
                    />
                    <Text fontSize="sm" color={labelColor}>
                      {translations.loadingWallet}
                    </Text>
                  </HStack>
                )}

                {/* No wallet yet → show create wallet UI */}
                {!cashuWallet && !walletHydrating && (
                  <Box>
                    {/* NIP-07 users need to provide their nsec for wallet creation */}
                    {isNip07Mode && noWalletFound && (
                      <Box
                        bg={
                          isLightTheme
                            ? "rgba(192, 38, 211, 0.08)"
                            : "rgba(255, 0, 255, 0.1)"
                        }
                        p={3}
                        rounded="md"
                        mb={3}
                        border="1px solid"
                        borderColor={
                          isLightTheme
                            ? "rgba(192, 38, 211, 0.18)"
                            : "rgba(255, 0, 255, 0.3)"
                        }
                      >
                        <HStack mb={2}>
                          <FaKey color={secondaryAccent} />
                          <Text
                            fontSize="sm"
                            fontWeight="semibold"
                            color={secondaryAccent}
                          >
                            {translations.secretKeyRequired}
                          </Text>
                        </HStack>
                        <Text fontSize="xs" color={labelColor} mb={3}>
                          {translations.nip07Warning}
                        </Text>
                        <Input
                          type="password"
                          value={nsecForWallet}
                          onChange={(e) => setNsecForWallet(e.target.value)}
                          placeholder={translations.enterNsec}
                          bg={inputBg}
                          borderColor={inputBorderColor}
                          color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
                          _placeholder={{ color: helperColor }}
                          _focus={{
                            borderColor: secondaryAccent,
                            boxShadow: isLightTheme
                              ? "0 0 0 3px rgba(192, 38, 211, 0.12)"
                              : "0 0 10px rgba(255, 0, 255, 0.3)",
                          }}
                          mb={2}
                        />
                        <Text
                          fontSize="xs"
                          color={isLightTheme ? "#92400e" : "orange.300"}
                        >
                          {translations.keyNotStored}
                        </Text>
                      </Box>
                    )}
                    <Button
                      onClick={() => {
                        handleSelectSound();
                        handleCreateWallet();
                      }}
                      isLoading={isCreatingWallet}
                      loadingText={translations.creatingWallet}
                      bg={walletAccent}
                      boxShadow={
                        isLightTheme
                          ? "0 4px 0px rgba(21, 128, 61, 0.72)"
                          : "0px 4px 0px teal"
                      }
                      color="white"
                      w="100%"
                      isDisabled={
                        isNip07Mode && noWalletFound && !nsecForWallet.trim()
                      }
                    >
                      {translations.createWallet}
                    </Button>
                  </Box>
                )}

                {/* Wallet exists, balance > 0 → show card */}
                {cashuWallet && totalBalance > 0 && (
                  <Box>
                    <IdentityCard
                      number={cashuWallet.walletId}
                      name={
                        <div>
                          {translations.wallet}
                          <div>
                            {translations.balance}: {totalBalance || 0}{" "}
                            {translations.sats}
                          </div>
                        </div>
                      }
                      theme="nostr"
                      animateOnChange={false}
                      realValue={cashuWallet.walletId}
                      totalBalance={totalBalance || 0}
                    />
                  </Box>
                )}

                {/* Wallet exists, no balance yet */}
                {cashuWallet && totalBalance <= 0 && (
                  <Box>
                    {!invoice && (
                      <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                      >
                        <IdentityCard
                          number={cashuWallet.walletId}
                          name={
                            <div>
                              {translations.wallet}
                              <div>
                                {translations.balance}: {totalBalance || 0}{" "}
                                {translations.sats}
                              </div>
                            </div>
                          }
                          theme="BTC"
                          animateOnChange={false}
                          realValue={cashuWallet.walletId}
                          totalBalance={totalBalance || 0}
                        />
                        <Button
                          mt={3}
                          onClick={() => {
                            handleSelectSound();
                            handleInitiateDeposit();
                          }}
                          w="100%"
                          bg={walletAccent}
                          color="white"
                          boxShadow={
                            isLightTheme
                              ? "0 4px 0px rgba(21, 128, 61, 0.72)"
                              : "0px 4px 0px teal"
                          }
                        >
                          {translations.deposit}
                        </Button>
                      </Box>
                    )}

                    {invoice && (
                      <VStack mt={2} spacing={3}>
                        <Box
                          p={3}
                          bg="white"
                          rounded="md"
                          display="flex"
                          justifyContent="center"
                        >
                          <QRCodeSVG value={invoice} size={200} />
                        </Box>
                        <HStack>
                          <Text fontSize="sm" color={labelColor}>
                            {translations.or}
                          </Text>
                          <Button
                            onClick={() => {
                              handleSelectSound();
                              handleCopyInvoice();
                            }}
                            size="sm"
                            variant="outline"
                            bg={isLightTheme ? APP_SURFACE : undefined}
                            borderColor={primaryAccent}
                            color={primaryAccent}
                            _hover={
                              isLightTheme
                                ? {
                                    bg: APP_SURFACE_MUTED,
                                    borderColor: primaryAccent,
                                  }
                                : undefined
                            }
                          >
                            {translations.copyAddress}
                          </Button>
                        </HStack>
                        <Text fontSize="xs" color={helperColor} textAlign="center">
                          {translations.lightningInstructions}
                          <br />
                          <Link
                            href="https://click.cash.app/ui6m/home2022"
                            isExternal
                            color={primaryAccent}
                            display="inline-flex"
                            alignItems="center"
                            gap="4px"
                            textDecoration="underline"
                          >
                            <SiCashapp />
                            <Text as="span">{translations.cashApp}</Text>
                          </Link>
                        </Text>
                        <Button
                          onClick={() => {
                            handleSelectSound();
                            handleInitiateDeposit();
                          }}
                          leftIcon={<BsQrCode />}
                          size="sm"
                          variant="outline"
                          bg={isLightTheme ? APP_SURFACE : undefined}
                          borderColor={secondaryAccent}
                          color={secondaryAccent}
                          _hover={
                            isLightTheme
                              ? {
                                  bg: APP_SURFACE_MUTED,
                                  borderColor: secondaryAccent,
                                }
                              : undefined
                          }
                        >
                          {translations.generateNewQR}
                        </Button>
                      </VStack>
                    )}
                  </Box>
                )}
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter
            borderTop="1px solid"
            borderColor={modalBorderSoft}
          >
            <Button
              onClick={() => {
                handleSelectSound();
                onClose();
              }}
              variant="ghost"
              color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}
              _hover={{ bg: isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.100" }}
            >
              {translations.close}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* About Modal */}
      <Modal
        isOpen={isAboutOpen}
        onClose={onAboutClose}
        isCentered
        size="md"
        scrollBehavior="inside"
      >
        <ModalOverlay bg={modalOverlayBg} />
        <ModalContent
          bg={modalBg}
          color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
          border="1px solid"
          borderColor={modalBorderColor}
          rounded="xl"
          boxShadow={isLightTheme ? APP_SHADOW : "0 0 30px rgba(0, 255, 255, 0.3)"}
          fontFamily="monospace"
          maxH="85vh"
          style={{
            "--links-accent-primary": isLightTheme ? "#0f766e" : "#00ffff",
            "--links-accent-warm": isLightTheme ? "#b45309" : "gold",
            "--links-accent-pink": isLightTheme ? "#db2777" : "hotpink",
          }}
        >
          <ModalHeader
            borderBottom="1px solid"
            borderColor={modalBorderSoft}
            color={modalHeadingColor}
          >
            {translations.aboutTitle}
          </ModalHeader>
          <ModalCloseButton
            color={modalHeadingColor}
            onClick={handleSelectSound}
            _hover={{ bg: isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.100" }}
          />
          <ModalBody py={6} overflowY="auto" sx={modalScrollSx}>
            <VStack spacing={4} align="stretch">
              <Box mt={"-6"}>
                {" "}
                <RandomCharacter notSoRandomCharacter={"38"} />
              </Box>

              <Box
                color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"}
                fontSize="sm"
                lineHeight="tall"
                mt={"-6"}
                sx={{
                  "& p": {
                    marginBottom: "12px",
                  },
                  "& span": {
                    fontWeight: 600,
                    textShadow: isLightTheme
                      ? "none"
                      : "0 0 16px rgba(0, 255, 255, 0.08)",
                  },
                }}
              >
                {translations.aboutContent}
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter
            borderTop="1px solid"
            borderColor={modalBorderSoft}
          >
            <Button
              onClick={() => {
                handleSelectSound();
                onAboutClose();
              }}
              variant="ghost"
              color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}
              _hover={{ bg: isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.100" }}
            >
              {translations.close}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
