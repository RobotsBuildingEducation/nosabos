import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Box,
  Container,
  Heading,
  HStack,
  IconButton,
  Link,
  Stack,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";

import { RoleCanvas } from "./RoleCanvas/RoleCanvas";

import RobotBuddyPro from "./RobotBuddyPro";

import { CloudCanvas } from "./CloudCanvas/CloudCanvas";
import { useDecentralizedIdentity } from "../hooks/useDecentralizedIdentity";

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
  const { generateNostrKeys } = useDecentralizedIdentity();
  const [isCarouselView, setIsCarouselView] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const hasTriggeredKeygen = useRef(false);

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
        const displayName = "Nostr Link Explorer";
        const did = await generateNostrKeys(displayName);
        if (!isMounted) return;
        localStorage.setItem("displayName", displayName);
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
          <Heading
            size="2xl"
            fontFamily="monospace"
            letterSpacing="widest"
            color="white"
          >
            LINKS
          </Heading>
          <Text
            color="gray.400"
            fontSize={{ base: "md", md: "lg" }}
            fontFamily="monospace"
          >
            A quick linktree for the No Sabos ecosystem.
          </Text>

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
    </Box>
  );
}
