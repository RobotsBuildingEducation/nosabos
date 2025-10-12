import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  List,
  ListIcon,
  ListItem,
  Text,
  VStack,
} from "@chakra-ui/react";
import { CheckCircleIcon } from "@chakra-ui/icons";
import { RiSpeakLine } from "react-icons/ri";

function LandingPage({ onSubmit, isSubmitting = false, errorMessage = "" }) {
  const [username, setUsername] = useState("");
  const [touched, setTouched] = useState(false);

  const trimmedName = username.trim();
  const isInvalid = touched && !trimmedName;

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (!trimmedName || isSubmitting) return;
    onSubmit?.(trimmedName);
  };

  return (
    <Flex
      minH="100vh"
      bg="gray.950"
      color="gray.100"
      align="center"
      justify="center"
      py={[12, 20]}
    >
      <Container maxW="4xl">
        <VStack spacing={[8, 12]} align="stretch">
          <Box textAlign="center">
            <Flex
              w={16}
              h={16}
              borderRadius="full"
              bg="teal.500"
              align="center"
              justify="center"
              mx="auto"
              mb={6}
              boxShadow="lg"
            >
              <RiSpeakLine size="2rem" />
            </Flex>
            <Heading size="2xl" mb={4}>
              Build your Nostr-powered study buddy
            </Heading>
            <Text fontSize="lg" color="gray.300">
              Choose a username to generate your secure Nostr keys and jump into
              your personalized learning experience.
            </Text>
          </Box>

          <Flex
            gap={[10, 16]}
            direction={{ base: "column", md: "row" }}
            align="stretch"
          >
            <Box
              flex="1"
              bg="gray.900"
              borderRadius="xl"
              p={[6, 8]}
              boxShadow="xl"
            >
              <Heading size="md" mb={4}>
                Why pick a username?
              </Heading>
              <List spacing={3} color="gray.300" fontSize="md">
                <ListItem>
                  <ListIcon as={CheckCircleIcon} color="teal.400" />
                  Generates a unique pair of Nostr keys in your browser.
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckCircleIcon} color="teal.400" />
                  Lets you save progress, lessons, and achievements securely.
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckCircleIcon} color="teal.400" />
                  Keeps the rest of the app experience exactly as you know it.
                </ListItem>
              </List>
            </Box>

            <Box
              as="form"
              onSubmit={handleSubmit}
              flex="1"
              bg="gray.900"
              borderRadius="xl"
              p={[6, 8]}
              boxShadow="xl"
            >
              <VStack align="stretch" spacing={4}>
                <Heading size="md">Get started</Heading>
                <Text color="gray.300">
                  Enter the name you would like to use inside the app. You can
                  always regenerate new keys later from the account menu.
                </Text>
                <FormControl isInvalid={isInvalid}>
                  <FormLabel>Username</FormLabel>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder="e.g. coding-ace"
                    size="lg"
                    bg="gray.800"
                    borderColor="gray.700"
                    _hover={{ borderColor: "teal.400" }}
                    _focusVisible={{ borderColor: "teal.300", boxShadow:
"0 0 0 1px rgba(56, 178, 172, 0.6)" }}
                  />
                  <FormErrorMessage>Choose a username to continue.</FormErrorMessage>
                </FormControl>

                {errorMessage ? (
                  <Text color="red.300" fontSize="sm">
                    {errorMessage}
                  </Text>
                ) : null}

                <Button
                  type="submit"
                  colorScheme="teal"
                  size="lg"
                  isLoading={isSubmitting}
                  loadingText="Generating keys"
                >
                  Create my keys
                </Button>
              </VStack>
            </Box>
          </Flex>
        </VStack>
      </Container>
    </Flex>
  );
}

export default LandingPage;
