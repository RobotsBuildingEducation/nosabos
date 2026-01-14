import React from "react";
import {
  Box,
  Container,
  Heading,
  LinkBox,
  LinkOverlay,
  Stack,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import RobotBuddyPro from "./RobotBuddyPro";
import { SunsetCanvas } from "./SunsetCanvas/SunsetCanvas";
import { RoleCanvas } from "./RoleCanvas/RoleCanvas";

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
        <SunsetCanvas hasInitialFade={false} hasAnimation={true} />
      </Box>
    ),
  },
  {
    title: "Patreon",
    description: "Support Notes And Other Stuff on Patreon.",
    href: "https://patreon.com/NotesAndOtherStuff",
    visual: <RoleCanvas role="counselor" width={180} height={180} />,
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
      bg={cardBg}
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
  return (
    <Box
      minH="100vh"
      bgGradient={useColorModeValue(
        "linear(to-br, gray.50, purple.50)",
        "linear(to-br, gray.900, purple.900)"
      )}
      py={{ base: 12, md: 16 }}
    >
      <Container maxW="container.md">
        <VStack spacing={6} textAlign="center">
          <Heading size="2xl">Links</Heading>
          <Text color={useColorModeValue("gray.600", "gray.300")}
            fontSize={{ base: "md", md: "lg" }}
          >
            A quick linktree for the No Sabos ecosystem.
          </Text>
        </VStack>
        <VStack spacing={6} mt={10} align="stretch">
          {links.map((link) => (
            <LinkCard key={link.title} {...link} />
          ))}
        </VStack>
      </Container>
    </Box>
  );
}
