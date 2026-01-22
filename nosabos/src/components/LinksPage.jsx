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
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Spinner,
  Switch,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { QRCodeSVG } from "qrcode.react";
import { BsQrCode } from "react-icons/bs";
import { SiCashapp } from "react-icons/si";
import { FaKey } from "react-icons/fa";
import useSoundSettings from "../hooks/useSoundSettings";
import selectSound from "../assets/select.mp3";
import submitActionSound from "../assets/submitaction.mp3";

import { RoleCanvas } from "./RoleCanvas/RoleCanvas";

import RobotBuddyPro from "./RobotBuddyPro";

import { CloudCanvas } from "./CloudCanvas/CloudCanvas";
import { useDecentralizedIdentity } from "../hooks/useDecentralizedIdentity";
import { NDKKind } from "@nostr-dev-kit/ndk";
import { Buffer } from "buffer";
import { bech32 } from "bech32";
import RandomCharacter from "./RandomCharacter";
import { logEvent } from "firebase/analytics";
import { analytics } from "../firebaseResources/firebaseResources";
import useNostrWalletStore from "../hooks/useNostrWalletStore";
import { IdentityCard } from "./IdentityCard";
import useLanguage from "../hooks/useLanguage";
import { linksPageTranslations } from "../translations/linksPage";
import AnimatedLogo from "./AnimatedLogo/AnimatedLogo";

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

function RetroStarfield() {
  const stars = useMemo(() => {
    const starArray = [];
    // Neon 80s colors
    const colors = [
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
  }, []);

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
        opacity={0.03}
        backgroundImage="linear-gradient(#ff00ff 1px, transparent 1px), linear-gradient(90deg, #ff00ff 1px, transparent 1px)"
        backgroundSize="50px 50px"
        pointerEvents="none"
      />

      {/* Scanline effect */}
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

      {/* Vignette effect */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)"
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
}) {
  return (
    <Box
      w="100%"
      border="1px solid"
      borderColor="rgba(0, 255, 255, 0.4)"
      bg="rgba(7, 16, 29, 0.65)"
      borderRadius="lg"
      px={{ base: 5, md: 8 }}
      py={{ base: 6, md: 8 }}
      boxShadow="0 0 20px rgba(0, 255, 255, 0.15)"
    >
      <Stack
        direction={{ base: "column", md: "row" }}
        spacing={{ base: 6, md: 10 }}
        align="center"
        textAlign={{ base: "center", md: "left" }}
      >
        <Box
          w={{ base: "100%", md: "220px" }}
          display="flex"
          justifyContent="center"
          alignItems="center"
          animation={`${drift} 6s ease-in-out infinite`}
        >
          {visual}
        </Box>
        <VStack spacing={3} align={{ base: "center", md: "flex-start" }}>
          <Heading
            size="md"
            fontFamily="monospace"
            letterSpacing="wider"
            color="white"
          >
            {title}
          </Heading>
          <Text
            color="gray.400"
            fontSize="lg"
            maxW="420px"
            fontFamily="monospace"
          >
            {description}
          </Text>
          <Button
            as={onLaunch ? "button" : "a"}
            onClick={() => {
              onLaunchSound?.();
              onLaunchEvent?.();
              onLaunch?.();
            }}
            href={onLaunch ? undefined : href}
            target={onLaunch ? undefined : "_blank"}
            rel={onLaunch ? undefined : "noopener noreferrer"}
            variant="outline"
            borderColor="#00ffff"
            color="#00ffff"
            fontFamily="monospace"
            size="md"
            px={10}
            py={7}
            minH="56px"
          >
            {launchAppText || "Launch app"}
          </Button>
        </VStack>
      </Stack>
    </Box>
  );
}

export default function LinksPage() {
  const { generateNostrKeys, auth, postNostrContent, ndk, connectToNostr } =
    useDecentralizedIdentity();

  // Language state
  const { language, initLanguage, toggleLanguage, t } = useLanguage();
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
  const toast = useToast();
  const playSound = useSoundSettings((s) => s.playSound);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % roleCycle.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const rbeUrl = "https://robotsbuildingeducation.com";
  const handleSelectSound = () => playSound(selectSound);
  const handleSubmitActionSound = () => playSound(submitActionSound);

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

      toast({
        title: translations.walletCreated,
        description: translations.walletReady,
        status: "success",
        duration: 2500,
      });
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
    } catch {}
  };

  const links = [
    {
      title: translations.noSabosTitle,
      description: translations.noSabosDescription,
      href: "https://nosabos.app",
      analyticsName: "nosabos_app",
      visual: <RobotBuddyPro state="idle" palette="ocean" maxW={280} />,
      launchAppText: translations.launchApp,
    },
    {
      title: translations.rbeTitle,
      description: translations.rbeDescription,
      href: rbeUrl,
      analyticsName: "robots_building_education",
      onLaunch: onRbeOpen,
      visual: (
        <Box display="flex" justifyContent="center" alignItems="center">
          <CloudCanvas />
        </Box>
      ),
      launchAppText: translations.launchApp,
    },
    {
      title: translations.roadmapCashTitle,
      description: translations.roadmapCashDescription,
      href: "https://roadmap.cash",
      analyticsName: "roadmap_cash",
      visual: <AnimatedLogo showWordmark={false} size={200} />,
      launchAppText: translations.launchApp,
    },
    {
      title: translations.patreonTitle,
      description: translations.patreonDescription,
      href: "https://patreon.com/NotesAndOtherStuff",
      analyticsName: "patreon",
      visual: (
        <RoleCanvas
          role={roleCycle[roleIndex]}
          width={200}
          height={200}
          transparent={true}
        />
      ),
      launchAppText: translations.subscribe,
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

      // Save to localStorage
      if (usernameInput.trim()) {
        localStorage.setItem("displayName", usernameInput.trim());
        setDisplayName(usernameInput.trim());
      }

      if (trimmedProfilePictureUrl) {
        localStorage.setItem("profilePicture", trimmedProfilePictureUrl);
        localStorage.setItem("profilePictureUrl", trimmedProfilePictureUrl);
      }

      if (trimmedProfilePictureUrl) {
        setProfilePicture(trimmedProfilePictureUrl);
      }

      toast({
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
        title: translations.copied,
        description: translations.secretKeyCopied,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
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
      minH="100vh"
      // py={{ base: 12, md: 16 }}

      bg="rgba(7,16,29)"
      position="relative"
      overflow="hidden"
    >
      <RetroStarfield />

      <Container
        maxW="container.md"
        position="relative"
        zIndex={1}
        mt={2}
        pb={{ base: 10, md: 14 }}
      >
        <VStack spacing={6} textAlign="center">
          {/* Profile Picture or Random Character */}
          {profilePicture ? (
            <Box
              w="100px"
              h="100px"
              borderRadius="full"
              overflow="hidden"
              border="3px solid #00ffff"
              boxShadow="0 0 20px rgba(0, 255, 255, 0.4)"
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
            color="white"
          >
            {translations.welcome}, {getWelcomeText()}
          </Heading>

          <Button
            onClick={() => {
              handleSelectSound();
              onOpen();
            }}
            variant="outline"
            fontFamily="monospace"
            borderColor="#00ffff"
            color="#00ffff"
          >
            {translations.customizeProfile}
          </Button>

          {/* Language Toggle */}
          <HStack
            spacing={3}
            justify="center"
            bg="rgba(7, 16, 29, 0.8)"
            px={4}
            py={2}
            borderRadius="md"
          >
            <Text
              fontSize="sm"
              color={language === "en" ? "#ff00ff" : "gray.500"}
              fontWeight={language === "en" ? "bold" : "normal"}
              fontFamily="monospace"
              transition="color 0.2s ease"
            >
              {translations.english}
            </Text>
            <Switch
              isChecked={language === "es"}
              onChange={() => {
                handleSelectSound();
                toggleLanguage();
              }}
              colorScheme="cyan"
              size="md"
            />
            <Text
              fontSize="sm"
              color={language === "es" ? "#00ffff" : "gray.500"}
              fontWeight={language === "es" ? "bold" : "normal"}
              fontFamily="monospace"
              transition="color 0.2s ease"
            >
              {translations.spanish}
            </Text>
          </HStack>
        </VStack>

        {/* Links List */}
        <VStack spacing={6} w="100%">
          {links.map((link) => (
            <LinkCard
              key={link.title}
              {...link}
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
      </Container>

      {/* Robots Building Education Modal */}
      <Modal isOpen={isRbeOpen} onClose={onRbeClose} isCentered size="md">
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent
          bg="rgba(7, 16, 29, 0.95)"
          color="gray.100"
          border="1px solid"
          borderColor="#00ffff"
          rounded="xl"
          shadow="0 0 30px rgba(0, 255, 255, 0.3)"
          fontFamily="monospace"
        >
          <ModalHeader
            borderBottom="1px solid"
            borderColor="rgba(0, 255, 255, 0.3)"
            color="#00ffff"
          >
            {translations.rbeModalTitle}
          </ModalHeader>
          <ModalCloseButton color="#00ffff" onClick={handleSelectSound} />
          <ModalBody py={6}>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.300">
                {translations.rbeModalDescription}
              </Text>
              <Button
                onClick={() => {
                  handleSelectSound();
                  handleCopySecretKey();
                }}
                colorScheme="cyan"
                bg="#00aaff"
                w="100%"
                color="white"
              >
                {translations.copySecretKey}
              </Button>
              <Button
                as="a"
                href={rbeUrl}
                target="_blank"
                rel="noopener noreferrer"
                colorScheme="cyan"
                bg="#009c9c"
                color="white"
                w="100%"
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
            borderColor="rgba(0, 255, 255, 0.3)"
          >
            <Button
              onClick={() => {
                handleSelectSound();
                onRbeClose();
              }}
              variant="ghost"
              color="gray.400"
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
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent
          bg="rgba(7, 16, 29, 0.95)"
          color="gray.100"
          border="1px solid"
          borderColor="#00ffff"
          rounded="xl"
          shadow="0 0 30px rgba(0, 255, 255, 0.3)"
          fontFamily="monospace"
          maxH="85vh"
        >
          <ModalHeader
            borderBottom="1px solid"
            borderColor="rgba(0, 255, 255, 0.3)"
            color="#00ffff"
          >
            {translations.customizeProfileTitle}
          </ModalHeader>
          <ModalCloseButton color="#00ffff" onClick={handleSelectSound} />
          <ModalBody
            py={6}
            overflowY="auto"
            sx={{
              "&::-webkit-scrollbar": {
                width: "8px",
              },
              "&::-webkit-scrollbar-track": {
                background: "rgba(0, 0, 0, 0.3)",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "linear-gradient(180deg, #00ffff 0%, #ff00ff 100%)",
                borderRadius: "4px",
                border: "2px solid transparent",
                backgroundClip: "padding-box",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                background: "linear-gradient(180deg, #00cccc 0%, #cc00cc 100%)",
                backgroundClip: "padding-box",
              },
              scrollbarWidth: "thin",
              scrollbarColor: "#00ffff rgba(0, 0, 0, 0.3)",
            }}
          >
            <VStack spacing={6} align="stretch">
              {/* Username Section */}
              <Box>
                <Text fontSize="sm" color="gray.400" mb={2}>
                  {translations.username}
                </Text>
                <Input
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder={translations.enterUsername}
                  bg="rgba(0, 0, 0, 0.3)"
                  border="1px solid"
                  borderColor="gray.600"
                  _focus={{
                    borderColor: "#00ffff",
                    boxShadow: "0 0 10px rgba(0, 255, 255, 0.3)",
                  }}
                />
              </Box>

              {/* Profile Picture Section */}
              <Box>
                <Text fontSize="sm" color="gray.400" mb={2}>
                  {translations.profilePictureUrl}
                </Text>
                <Input
                  value={profilePictureUrlInput}
                  onChange={(e) => setProfilePictureUrlInput(e.target.value)}
                  placeholder={translations.profilePicturePlaceholder}
                  bg="rgba(0, 0, 0, 0.3)"
                  border="1px solid"
                  borderColor="gray.600"
                  _focus={{
                    borderColor: "#00ffff",
                    boxShadow: "0 0 10px rgba(0, 255, 255, 0.3)",
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
                colorScheme="cyan"
                bg="#00ffff"
                color="black"
                w="100%"
              >
                {translations.saveProfile}
              </Button>

              <Divider borderColor="rgba(255, 0, 255, 0.3)" />

              {/* Secret Key Section */}
              <Box>
                <Text fontSize="sm" color="gray.400" mb={2}>
                  {translations.secretKey}
                </Text>
                <Button
                  onClick={() => {
                    handleSelectSound();
                    handleCopySecretKey();
                  }}
                  variant="outline"
                  colorScheme="pink"
                  borderColor="#ff00ff"
                  color="#ff00ff"
                  w="100%"
                >
                  {translations.copySecretKey}
                </Button>
                <Text fontSize="xs" color="gray.500" mt={2}>
                  {translations.secretKeyWarning}
                </Text>
              </Box>
              {/* Switch Account Accordion */}
              <Accordion allowToggle>
                <AccordionItem border="none">
                  <AccordionButton px={0} _hover={{ bg: "transparent" }}>
                    <Box flex="1" textAlign="left">
                      <Text fontSize="sm" color="gray.400">
                        {translations.switchAccount}
                      </Text>
                    </Box>
                    <AccordionIcon color="#ff00ff" />
                  </AccordionButton>
                  <AccordionPanel px={0} pt={3}>
                    <VStack spacing={3} align="stretch">
                      <Input
                        value={nsecInput}
                        onChange={(e) => setNsecInput(e.target.value)}
                        placeholder={translations.pasteNsec}
                        bg="rgba(0, 0, 0, 0.3)"
                        border="1px solid"
                        borderColor="gray.600"
                        type="password"
                        _focus={{
                          borderColor: "#ff00ff",
                          boxShadow: "0 0 10px rgba(255, 0, 255, 0.3)",
                        }}
                      />
                      <Button
                        onClick={() => {
                          handleSelectSound();
                          handleSwitchAccount();
                        }}
                        isLoading={isSwitching}
                        variant="outline"
                        colorScheme="pink"
                        borderColor="#ff00ff"
                        color="#ff00ff"
                      >
                        {translations.switchAccount}
                      </Button>
                      <Text fontSize="xs" color="gray.500">
                        {translations.switchAccountHelp}
                      </Text>
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>

              <Divider borderColor="rgba(0, 255, 255, 0.3)" />
              {/* Bitcoin Wallet Section */}
              <Box
                bg="rgba(0, 0, 0, 0.3)"
                rounded="md"
                p={4}
                border="1px solid"
                borderColor="#16b078"
              >
                <Text fontSize="sm" color="#16b078" fontWeight="bold" mb={3}>
                  {translations.bitcoinWallet}
                </Text>

                <Text fontSize="xs" color="gray.400" mb={4}>
                  {translations.walletDescription1}
                </Text>

                <Text fontSize="xs" color="gray.400" mb={4}>
                  {translations.walletDescription2}
                </Text>

                {/* Loading/hydration spinner */}
                {walletHydrating && !cashuWallet && (
                  <HStack py={2}>
                    <Spinner size="sm" color="#00ffff" />
                    <Text fontSize="sm" color="gray.400">
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
                        bg="rgba(255, 0, 255, 0.1)"
                        p={3}
                        rounded="md"
                        mb={3}
                        border="1px solid"
                        borderColor="rgba(255, 0, 255, 0.3)"
                      >
                        <HStack mb={2}>
                          <FaKey color="#ff00ff" />
                          <Text
                            fontSize="sm"
                            fontWeight="semibold"
                            color="#ff00ff"
                          >
                            {translations.secretKeyRequired}
                          </Text>
                        </HStack>
                        <Text fontSize="xs" color="gray.400" mb={3}>
                          {translations.nip07Warning}
                        </Text>
                        <Input
                          type="password"
                          value={nsecForWallet}
                          onChange={(e) => setNsecForWallet(e.target.value)}
                          placeholder={translations.enterNsec}
                          bg="rgba(0, 0, 0, 0.3)"
                          borderColor="gray.600"
                          _focus={{
                            borderColor: "#ff00ff",
                            boxShadow: "0 0 10px rgba(255, 0, 255, 0.3)",
                          }}
                          mb={2}
                        />
                        <Text fontSize="xs" color="orange.300">
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
                      bg="#16b078"
                      boxShadow="0px 4px 0px teal"
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
                          bg="#16b078"
                          color="white"
                          boxShadow={"0px 4px 0px teal"}
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
                          <Text fontSize="sm" color="gray.400">
                            {translations.or}
                          </Text>
                          <Button
                            onClick={() => {
                              handleSelectSound();
                              handleCopyInvoice();
                            }}
                            size="sm"
                            variant="outline"
                            borderColor="#00ffff"
                            color="#00ffff"
                          >
                            {translations.copyAddress}
                          </Button>
                        </HStack>
                        <Text fontSize="xs" color="gray.500" textAlign="center">
                          {translations.lightningInstructions}
                          <br />
                          <Link
                            href="https://click.cash.app/ui6m/home2022"
                            isExternal
                            color="#00ffff"
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
                          borderColor="#ff00ff"
                          color="#ff00ff"
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
            borderColor="rgba(0, 255, 255, 0.3)"
          >
            <Button
              onClick={() => {
                handleSelectSound();
                onClose();
              }}
              variant="ghost"
              color="gray.400"
            >
              {translations.close}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
