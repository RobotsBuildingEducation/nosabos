import React, { useEffect, useRef, useState } from "react";
import {
  Badge,
  Box,
  Container,
  Heading,
  LinkBox,
  LinkOverlay,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";

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
  const [nostrStatus, setNostrStatus] = useState("idle");
  const [nostrPubKey, setNostrPubKey] = useState("");

  const hasTriggeredKeygen = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasStoredKeys =
      Boolean(localStorage.getItem("local_nsec")) &&
      Boolean(localStorage.getItem("local_npub"));

    if (hasStoredKeys) {
      setNostrStatus("ready");
      setNostrPubKey(localStorage.getItem("local_npub") || "");
      return;
    }

    if (hasTriggeredKeygen.current) {
      return;
    }

    hasTriggeredKeygen.current = true;
    let isMounted = true;
    const createInstantKeys = async () => {
      setNostrStatus("creating");
      try {
        const displayName = "Nostr Link Explorer";
        const did = await generateNostrKeys(displayName);
        if (!isMounted) return;
        localStorage.setItem("displayName", displayName);
        setNostrPubKey(did?.npub || "");
        setNostrStatus("ready");
      } catch (error) {
        console.error("Failed to generate instant Nostr keys:", error);
        if (isMounted) {
          setNostrStatus("error");
        }
      }
    };

    createInstantKeys();

    return () => {
      isMounted = false;
    };
  }, [generateNostrKeys]);

  const statusCopy = {
    idle: "Preparing your Nostr passport...",
    creating: "Minting your instant Nostr passport...",
    ready: "Passport ready. Welcome to the Nostr universe.",
    error: "Could not mint your Nostr passport. Refresh to retry.",
  };

  const statusTone = {
    idle: "purple",
    creating: "blue",
    ready: "green",
    error: "red",
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
        </VStack>
        <Box
          mt={10}
          p={{ base: 5, md: 6 }}
          borderRadius="2xl"
          borderWidth="1px"
          borderColor={useColorModeValue("purple.100", "purple.700")}
          bg={useColorModeValue("white", "gray.900")}
          boxShadow="lg"
        >
          <VStack spacing={3} align="start">
            <Badge colorScheme={statusTone[nostrStatus]}>Nostr Passport</Badge>
            <Heading size="md">Instant identity for your links</Heading>
            <Text color={useColorModeValue("gray.600", "gray.300")}>
              {statusCopy[nostrStatus]}
            </Text>
            {nostrStatus === "creating" && (
              <Stack direction="row" spacing={2} align="center">
                <Spinner size="sm" />
                <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.400")}>
                  Generating keys in the background...
                </Text>
              </Stack>
            )}
            {nostrPubKey && (
              <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.400")}>
                Your npub: {nostrPubKey.slice(0, 16)}...
              </Text>
            )}
          </VStack>
        </Box>
        <VStack spacing={6} mt={10} align="stretch">
          {links.map((link) => (
            <LinkCard key={link.title} {...link} />
          ))}
        </VStack>
      </Container>
    </Box>
  );
}
