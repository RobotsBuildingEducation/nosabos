import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Container,
  Heading,
  HStack,
  IconButton,
  LinkBox,
  LinkOverlay,
  Stack,
  Switch,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";

import { RoleCanvas } from "./RoleCanvas/RoleCanvas";

import RobotBuddyPro from "./RobotBuddyPro";

import { CloudCanvas } from "./CloudCanvas/CloudCanvas";
import { useDecentralizedIdentity } from "../hooks/useDecentralizedIdentity";

const links = [
  {
    title: "No Sabos",
    description: "Language learning adventures in the No Sabos universe.",
    href: "https://nosabos.app",
    visual: <RobotBuddyPro state="idle" palette="ocean" maxW={180} />,
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

function LinkCard({ title, description, href, visual }) {
  const cardBg = useColorModeValue("white", "gray.900");
  const cardBorder = useColorModeValue("gray.200", "whiteAlpha.200");

  return (
    <LinkBox
      as="section"
      p={{ base: 5, md: 6 }}
      borderWidth="1px"
      borderColor={cardBorder}
      borderRadius="2xl"
      boxShadow="lg"
      transition="transform 0.2s ease, box-shadow 0.2s ease"
      _hover={{ transform: "translateY(-2px)", boxShadow: "xl" }}
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
          <Heading size="md">
            <LinkOverlay href={href} isExternal>
              {title}
            </LinkOverlay>
          </Heading>
          <Text color={useColorModeValue("gray.600", "gray.300")}>
            {description}
          </Text>
          <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.400")}>
            {href}
          </Text>
        </VStack>
      </Stack>
    </LinkBox>
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
    <Box minH="100vh" py={{ base: 12, md: 16 }} bg="rgba(7,16,29)">
      <Container maxW="container.md">
        <VStack spacing={6} textAlign="center">
          <Heading size="2xl">Links</Heading>
          <Text
            color={useColorModeValue("gray.600", "gray.300")}
            fontSize={{ base: "md", md: "lg" }}
          >
            A quick linktree for the No Sabos ecosystem.
          </Text>

          {/* View Toggle */}
          <HStack spacing={3} justify="center">
            <Text
              fontSize="sm"
              color={useColorModeValue("gray.500", "gray.400")}
              fontWeight={!isCarouselView ? "bold" : "normal"}
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
              color={useColorModeValue("gray.500", "gray.400")}
              fontWeight={isCarouselView ? "bold" : "normal"}
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
                left={{ base: -2, md: -12 }}
                top="50%"
                transform="translateY(-50%)"
                zIndex={2}
                onClick={goToPrevious}
                variant="ghost"
                colorScheme="purple"
                size="lg"
                borderRadius="full"
              />
              <IconButton
                aria-label="Next link"
                icon={<ChevronRightIcon boxSize={8} />}
                position="absolute"
                right={{ base: -2, md: -12 }}
                top="50%"
                transform="translateY(-50%)"
                zIndex={2}
                onClick={goToNext}
                variant="ghost"
                colorScheme="purple"
                size="lg"
                borderRadius="full"
              />

              {/* Carousel Content */}
              <Box overflow="hidden" borderRadius="2xl">
                <LinkCard {...links[currentIndex]} />
              </Box>
            </Box>

            {/* Dot Indicators */}
            <HStack spacing={2} justify="center" mt={6}>
              {links.map((_, index) => (
                <Box
                  key={index}
                  as="button"
                  w={3}
                  h={3}
                  borderRadius="full"
                  bg={
                    index === currentIndex
                      ? "purple.500"
                      : useColorModeValue("gray.300", "gray.600")
                  }
                  transition="background 0.2s ease"
                  onClick={() => goToSlide(index)}
                  _hover={{
                    bg: index === currentIndex ? "purple.400" : "gray.400",
                  }}
                />
              ))}
            </HStack>
          </Box>
        ) : (
          /* List View */
          <VStack spacing={6} mt={10} align="stretch">
            {links.map((link) => (
              <LinkCard key={link.title} {...link} />
            ))}
          </VStack>
        )}
      </Container>
    </Box>
  );
}
