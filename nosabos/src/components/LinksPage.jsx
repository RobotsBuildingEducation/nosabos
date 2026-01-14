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
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";

import { RoleCanvas } from "./RoleCanvas/RoleCanvas";

import RobotBuddyPro from "./RobotBuddyPro";

import { CloudCanvas } from "./CloudCanvas/CloudCanvas";
import { useDecentralizedIdentity } from "../hooks/useDecentralizedIdentity";

const twinkle = keyframes`
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
`;

const drift = keyframes`
  0% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-10px) translateX(5px); }
  100% { transform: translateY(0) translateX(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.1; }
  50% { opacity: 0.3; }
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
      <RoleCanvas role={"sphere"} width={400} height={400} bg={"transparent"} />
    ),
  },
];

function Star({ size, top, left, delay, duration }) {
  return (
    <Box
      position="absolute"
      top={top}
      left={left}
      w={`${size}px`}
      h={`${size}px`}
      borderRadius="full"
      bg="white"
      boxShadow={`0 0 ${size * 2}px ${size / 2}px rgba(147, 112, 219, 0.6)`}
      animation={`${twinkle} ${duration}s ease-in-out infinite`}
      animationDelay={`${delay}s`}
      pointerEvents="none"
    />
  );
}

function StarryBackground() {
  const stars = useMemo(() => {
    const starArray = [];
    for (let i = 0; i < 60; i++) {
      starArray.push({
        id: i,
        size: Math.random() * 2 + 1,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 2,
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
        <Star key={star.id} {...star} />
      ))}
      {/* Nebula-like gradients */}
      <Box
        position="absolute"
        top="10%"
        left="-10%"
        w="50%"
        h="50%"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(88, 28, 135, 0.15) 0%, transparent 70%)"
        filter="blur(40px)"
        animation={`${pulse} 8s ease-in-out infinite`}
      />
      <Box
        position="absolute"
        bottom="20%"
        right="-5%"
        w="40%"
        h="40%"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(30, 64, 175, 0.15) 0%, transparent 70%)"
        filter="blur(40px)"
        animation={`${pulse} 10s ease-in-out infinite`}
        animationDelay="2s"
      />
      <Box
        position="absolute"
        top="60%"
        left="20%"
        w="30%"
        h="30%"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)"
        filter="blur(30px)"
        animation={`${drift} 15s ease-in-out infinite`}
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
        <Heading size="xl" color="white">
          <Link
            href={href}
            isExternal
            _hover={{ color: "purple.300", textDecoration: "none" }}
            transition="color 0.2s ease"
          >
            {title}
          </Link>
        </Heading>
        <Text color="gray.400" fontSize="lg" maxW="400px">
          {description}
        </Text>
        <Text fontSize="sm" color="purple.300">
          {href}
        </Text>
      </VStack>
    </VStack>
  );
}

function ListCard({ title, description, href, visual }) {
  const cardBorder = useColorModeValue("gray.200", "whiteAlpha.100");

  return (
    <Box
      as="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      p={{ base: 5, md: 6 }}
      borderWidth="1px"
      borderColor={cardBorder}
      borderRadius="2xl"
      bg="rgba(15, 23, 42, 0.6)"
      backdropFilter="blur(10px)"
      transition="transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease"
      _hover={{
        transform: "translateY(-2px)",
        boxShadow: "0 0 30px rgba(139, 92, 246, 0.2)",
        borderColor: "purple.500",
      }}
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
          <Heading size="md" color="white">
            {title}
          </Heading>
          <Text color="gray.400">{description}</Text>
          <Text fontSize="sm" color="purple.400">
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

  const inactiveDotColor = useColorModeValue("gray.500", "gray.600");

  return (
    <Box
      minH="100vh"
      py={{ base: 12, md: 16 }}
      bg="linear-gradient(180deg, rgba(7,16,29,1) 0%, rgba(15,23,42,1) 50%, rgba(7,16,29,1) 100%)"
      position="relative"
      overflow="hidden"
    >
      <StarryBackground />

      <Container maxW="container.md" position="relative" zIndex={1}>
        <VStack spacing={6} textAlign="center">
          <Heading
            size="2xl"
            bgGradient="linear(to-r, purple.300, blue.300, purple.400)"
            bgClip="text"
          >
            Links
          </Heading>
          <Text color="gray.400" fontSize={{ base: "md", md: "lg" }}>
            A quick linktree for the No Sabos ecosystem.
          </Text>

          {/* View Toggle */}
          <HStack
            spacing={3}
            justify="center"
            bg="rgba(15, 23, 42, 0.6)"
            backdropFilter="blur(10px)"
            px={4}
            py={2}
            borderRadius="full"
            borderWidth="1px"
            borderColor="whiteAlpha.100"
          >
            <Text
              fontSize="sm"
              color={!isCarouselView ? "purple.300" : "gray.500"}
              fontWeight={!isCarouselView ? "bold" : "normal"}
              transition="color 0.2s ease"
            >
              List
            </Text>
            <Switch
              isChecked={isCarouselView}
              onChange={() => setIsCarouselView(!isCarouselView)}
              colorScheme="purple"
              size="md"
            />
            <Text
              fontSize="sm"
              color={isCarouselView ? "purple.300" : "gray.500"}
              fontWeight={isCarouselView ? "bold" : "normal"}
              transition="color 0.2s ease"
            >
              Carousel
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
                color="purple.300"
                _hover={{ bg: "whiteAlpha.100", color: "purple.200" }}
                size="lg"
                borderRadius="full"
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
                color="purple.300"
                _hover={{ bg: "whiteAlpha.100", color: "purple.200" }}
                size="lg"
                borderRadius="full"
              />

              {/* Carousel Content */}
              <Box overflow="hidden" px={{ base: 8, md: 0 }}>
                <CarouselCard {...links[currentIndex]} />
              </Box>
            </Box>

            {/* Dot Indicators */}
            <HStack spacing={3} justify="center" mt={4}>
              {links.map((_, index) => (
                <Box
                  key={index}
                  as="button"
                  w={index === currentIndex ? 8 : 3}
                  h={3}
                  borderRadius="full"
                  bg={index === currentIndex ? "purple.500" : inactiveDotColor}
                  transition="all 0.3s ease"
                  onClick={() => goToSlide(index)}
                  _hover={{
                    bg: index === currentIndex ? "purple.400" : "gray.500",
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
