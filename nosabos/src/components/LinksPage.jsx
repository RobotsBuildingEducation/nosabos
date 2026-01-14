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
  Heading,
  HStack,
  IconButton,
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
  Switch,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";

import { RoleCanvas } from "./RoleCanvas/RoleCanvas";

import RobotBuddyPro from "./RobotBuddyPro";

import { CloudCanvas } from "./CloudCanvas/CloudCanvas";
import { useDecentralizedIdentity } from "../hooks/useDecentralizedIdentity";
import { NDKKind } from "@nostr-dev-kit/ndk";
import { Buffer } from "buffer";
import { bech32 } from "bech32";
import RandomCharacter from "./RandomCharacter";

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

const links = [
  {
    title: "No Sabos",
    description: "Language learning adventures in the No Sabos universe.",
    href: "https://nosabos.app",
    visual: <RobotBuddyPro state="idle" palette="ocean" maxW={280} />,
  },
  {
    title: "Robots Building Education",
    description: "Hands-on robotics education and community programs.",
    href: "https://robotsbuildingeducation.com",
    visual: (
      <Box display="flex" justifyContent="center" alignItems="center">
        <CloudCanvas />
      </Box>
    ),
  },
  {
    title: "Patreon",
    description: "Support Notes And Other Stuff on Patreon.",
    href: "https://patreon.com/NotesAndOtherStuff",
    visual: (
      <RoleCanvas role={"sphere"} width={400} height={400} transparent={true} />
    ),
  },
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

function CarouselCard({ title, description, href, visual }) {
  return (
    <VStack spacing={6} align="center" textAlign="center" py={4}>
      {/* Large Visual */}
      <Box
        w="100%"
        maxW="400px"
        h={{ base: "280px", md: "350px" }}
        display="flex"
        justifyContent="center"
        alignItems="center"
        animation={`${drift} 6s ease-in-out infinite`}
      >
        {visual}
      </Box>

      {/* Title and Description */}
      <VStack spacing={3}>
        <Heading
          size="xl"
          fontFamily="monospace"
          letterSpacing="wider"
          color="white"
        >
          <Link
            href={href}
            isExternal
            _hover={{ opacity: 0.8, textDecoration: "none" }}
            transition="all 0.3s ease"
          >
            {title}
          </Link>
        </Heading>
        <Text
          color="gray.400"
          fontSize="lg"
          maxW="400px"
          fontFamily="monospace"
        >
          {description}
        </Text>
        <Text fontSize="sm" color="#00ffff" fontFamily="monospace">
          {href}
        </Text>
      </VStack>
    </VStack>
  );
}

function ListCard({ title, description, href, visual }) {
  return (
    <Box
      as="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      p={{ base: 5, md: 6 }}
      borderWidth="1px"
      borderColor="rgba(255, 0, 255, 0.3)"
      borderRadius="md"
      bg="rgba(7, 16, 29, 0.8)"
      transition="all 0.3s ease"
      display="block"
      textDecoration="none"
    >
      <Stack
        direction={{ base: "column", md: "row" }}
        spacing={{ base: 4, md: 8 }}
        align={{ base: "flex-start", md: "center" }}
      >
        <Box flexShrink={0} w={{ base: "100%", md: "220px" }}>
          {visual}
        </Box>
        <VStack align="start" spacing={2} flex="1">
          <Heading size="md" fontFamily="monospace" color="white">
            {title}
          </Heading>
          <Text color="gray.400" fontFamily="monospace">
            {description}
          </Text>
          <Text fontSize="sm" color="#00ffff" fontFamily="monospace">
            {href}
          </Text>
        </VStack>
      </Stack>
    </Box>
  );
}

export default function LinksPage() {
  const { generateNostrKeys, auth, postNostrContent, ndk, connectToNostr } = useDecentralizedIdentity();
  const [isCarouselView, setIsCarouselView] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [npub, setNpub] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [nsecInput, setNsecInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [profilePicture, setProfilePicture] = useState("");
  const [profilePictureInput, setProfilePictureInput] = useState("");
  const [randomCharacterKey] = useState(() => Math.floor(Math.random() * 21) + 20); // Random between 20-40

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const hasTriggeredKeygen = useRef(false);

  // Load stored npub, displayName, and profilePicture
  useEffect(() => {
    const storedNpub = localStorage.getItem("local_npub");
    const storedDisplayName = localStorage.getItem("displayName");
    const storedProfilePicture = localStorage.getItem("profilePicture");
    if (storedNpub) {
      setNpub(storedNpub);
    }
    if (storedDisplayName) {
      setDisplayName(storedDisplayName);
      setUsernameInput(storedDisplayName);
    }
    if (storedProfilePicture) {
      setProfilePicture(storedProfilePicture);
      setProfilePictureInput(storedProfilePicture);
    }
  }, []);

  // Get display text for welcome message
  const getWelcomeText = () => {
    if (displayName && displayName !== "Nostr Link Explorer") {
      return displayName;
    }
    if (npub) {
      return npub.substring(0, 7);
    }
    return "...";
  };

  // Handle profile save (username and picture)
  const handleSaveProfile = async () => {
    if (!usernameInput.trim() && !profilePictureInput.trim()) {
      toast({
        title: "No changes",
        description: "Please enter a username or profile picture URL",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSaving(true);
    try {
      // Build metadata object
      const metadata = {
        name: usernameInput.trim() || displayName || "",
        about: "A student onboarded with Robots Building Education",
      };

      // Add picture if provided
      if (profilePictureInput.trim()) {
        metadata.picture = profilePictureInput.trim();
      }

      // Post kind 0 (metadata) event to update profile
      await postNostrContent(JSON.stringify(metadata), 0);

      // Save to localStorage
      if (usernameInput.trim()) {
        localStorage.setItem("displayName", usernameInput.trim());
        setDisplayName(usernameInput.trim());
      }

      if (profilePictureInput.trim()) {
        localStorage.setItem("profilePicture", profilePictureInput.trim());
        setProfilePicture(profilePictureInput.trim());
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been saved to Nostr",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
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
        title: "No secret key",
        description: "You're using a browser extension for signing",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(nsec);
      toast({
        title: "Copied!",
        description: "Secret key copied to clipboard",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
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
        title: "Invalid key",
        description: "Please enter a valid nsec key",
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
          setProfilePicture(profile.picture);
          setProfilePictureInput(profile.picture);
        } else {
          localStorage.setItem("profilePicture", "");
          setProfilePicture("");
          setProfilePictureInput("");
        }

        toast({
          title: "Account switched",
          description: "Successfully logged in with new account",
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
        title: "Error",
        description: "Invalid secret key or authentication failed",
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
        const defaultDisplayName = "Nostr Link Explorer";
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

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? links.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === links.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  return (
    <Box
      minH="100vh"
      py={{ base: 12, md: 16 }}
      bg="rgba(7,16,29)"
      position="relative"
      overflow="hidden"
    >
      <RetroStarfield />

      <Container maxW="container.md" position="relative" zIndex={1}>
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
              width="100px"
            />
          )}

          <Heading
            size="xl"
            fontFamily="monospace"
            letterSpacing="wider"
            color="white"
          >
            Welcome, {getWelcomeText()}
          </Heading>

          <Button
            onClick={onOpen}
            variant="outline"
            fontFamily="monospace"
            borderColor="#00ffff"
            color="#00ffff"
            _hover={{}}
          >
            Customize Profile
          </Button>

          {/* View Toggle */}
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
              color={!isCarouselView ? "#ff00ff" : "gray.500"}
              fontWeight={!isCarouselView ? "bold" : "normal"}
              fontFamily="monospace"
              transition="color 0.2s ease"
            >
              LIST
            </Text>
            <Switch
              isChecked={isCarouselView}
              onChange={() => setIsCarouselView(!isCarouselView)}
              colorScheme="pink"
              size="md"
            />
            <Text
              fontSize="sm"
              color={isCarouselView ? "#00ffff" : "gray.500"}
              fontWeight={isCarouselView ? "bold" : "normal"}
              fontFamily="monospace"
              transition="color 0.2s ease"
            >
              CAROUSEL
            </Text>
          </HStack>
        </VStack>

        {isCarouselView ? (
          /* Carousel View */
          <Box mt={10}>
            <Box position="relative">
              {/* Navigation Arrows */}
              <IconButton
                aria-label="Previous link"
                icon={<ChevronLeftIcon boxSize={8} />}
                position="absolute"
                left={{ base: -2, md: -16 }}
                top="50%"
                transform="translateY(-50%)"
                zIndex={2}
                onClick={goToPrevious}
                variant="ghost"
                color="#00ffff"
                _hover={{ bg: "rgba(0, 255, 255, 0.1)", color: "#ff00ff" }}
                size="lg"
                borderRadius="md"
              />
              <IconButton
                aria-label="Next link"
                icon={<ChevronRightIcon boxSize={8} />}
                position="absolute"
                right={{ base: -2, md: -16 }}
                top="50%"
                transform="translateY(-50%)"
                zIndex={2}
                onClick={goToNext}
                variant="ghost"
                color="#00ffff"
                _hover={{ bg: "rgba(0, 255, 255, 0.1)", color: "#ff00ff" }}
                size="lg"
                borderRadius="md"
              />

              {/* Carousel Content */}
              <Box overflow="hidden" px={{ base: 8, md: 0 }}>
                <CarouselCard {...links[currentIndex]} />
              </Box>
            </Box>

            {/* Dot Indicators - 8-bit style squares */}
            <HStack spacing={3} justify="center" mt={4}>
              {links.map((_, index) => (
                <Box
                  key={index}
                  as="button"
                  w={index === currentIndex ? 6 : 3}
                  h={3}
                  bg={index === currentIndex ? "#ff00ff" : "gray.600"}
                  boxShadow={
                    index === currentIndex ? "0 0 10px #ff00ff" : "none"
                  }
                  transition="all 0.3s ease"
                  onClick={() => goToSlide(index)}
                  _hover={{
                    bg: index === currentIndex ? "#ff00ff" : "#00ffff",
                    boxShadow: "0 0 10px currentColor",
                  }}
                />
              ))}
            </HStack>
          </Box>
        ) : (
          /* List View */
          <VStack spacing={6} mt={10} align="stretch">
            {links.map((link) => (
              <ListCard key={link.title} {...link} />
            ))}
          </VStack>
        )}
      </Container>

      {/* Profile Customization Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
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
            Customize Profile
          </ModalHeader>
          <ModalCloseButton color="#00ffff" />
          <ModalBody py={6}>
            <VStack spacing={6} align="stretch">
              {/* Username Section */}
              <Box>
                <Text fontSize="sm" color="gray.400" mb={2}>
                  Username
                </Text>
                <Input
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter your username"
                  bg="rgba(0, 0, 0, 0.3)"
                  border="1px solid"
                  borderColor="gray.600"
                  _hover={{ borderColor: "#00ffff" }}
                  _focus={{
                    borderColor: "#00ffff",
                    boxShadow: "0 0 10px rgba(0, 255, 255, 0.3)",
                  }}
                />
              </Box>

              {/* Profile Picture Section */}
              <Box>
                <Text fontSize="sm" color="gray.400" mb={2}>
                  Profile Picture URL
                </Text>
                <Input
                  value={profilePictureInput}
                  onChange={(e) => setProfilePictureInput(e.target.value)}
                  placeholder="https://example.com/your-image.jpg"
                  bg="rgba(0, 0, 0, 0.3)"
                  border="1px solid"
                  borderColor="gray.600"
                  _hover={{ borderColor: "#00ffff" }}
                  _focus={{
                    borderColor: "#00ffff",
                    boxShadow: "0 0 10px rgba(0, 255, 255, 0.3)",
                  }}
                />
                <Text fontSize="xs" color="gray.500" mt={2}>
                  Paste a URL to an image for your profile picture
                </Text>
              </Box>

              {/* Save Profile Button */}
              <Button
                onClick={handleSaveProfile}
                isLoading={isSaving}
                colorScheme="cyan"
                bg="#00ffff"
                color="black"
                _hover={{ bg: "#00cccc" }}
                w="100%"
              >
                Save Profile
              </Button>

              {/* Secret Key Section */}
              <Box>
                <Text fontSize="sm" color="gray.400" mb={2}>
                  Secret Key
                </Text>
                <Button
                  onClick={handleCopySecretKey}
                  variant="outline"
                  colorScheme="pink"
                  borderColor="#ff00ff"
                  color="#ff00ff"
                  w="100%"
                  _hover={{
                    bg: "rgba(255, 0, 255, 0.1)",
                  }}
                >
                  Copy Secret Key
                </Button>
                <Text fontSize="xs" color="gray.500" mt={2}>
                  Your secret key is your password to access decentralized apps.
                  Keep it safe and never share it with anyone.
                </Text>
              </Box>

              {/* Switch Account Accordion */}
              <Accordion allowToggle>
                <AccordionItem border="none">
                  <AccordionButton
                    px={0}
                    _hover={{ bg: "transparent" }}
                  >
                    <Box flex="1" textAlign="left">
                      <Text fontSize="sm" color="gray.400">
                        Switch Account
                      </Text>
                    </Box>
                    <AccordionIcon color="#ff00ff" />
                  </AccordionButton>
                  <AccordionPanel px={0} pt={3}>
                    <VStack spacing={3} align="stretch">
                      <Input
                        value={nsecInput}
                        onChange={(e) => setNsecInput(e.target.value)}
                        placeholder="Paste your nsec key here"
                        bg="rgba(0, 0, 0, 0.3)"
                        border="1px solid"
                        borderColor="gray.600"
                        type="password"
                        _hover={{ borderColor: "#ff00ff" }}
                        _focus={{
                          borderColor: "#ff00ff",
                          boxShadow: "0 0 10px rgba(255, 0, 255, 0.3)",
                        }}
                      />
                      <Button
                        onClick={handleSwitchAccount}
                        isLoading={isSwitching}
                        variant="outline"
                        colorScheme="pink"
                        borderColor="#ff00ff"
                        color="#ff00ff"
                        _hover={{
                          bg: "rgba(255, 0, 255, 0.1)",
                        }}
                      >
                        Switch Account
                      </Button>
                      <Text fontSize="xs" color="gray.500">
                        Enter a different nsec to switch to another Nostr account
                      </Text>
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </VStack>
          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor="rgba(0, 255, 255, 0.3)">
            <Button
              onClick={onClose}
              variant="ghost"
              color="gray.400"
              _hover={{ color: "white", bg: "rgba(255, 255, 255, 0.1)" }}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
