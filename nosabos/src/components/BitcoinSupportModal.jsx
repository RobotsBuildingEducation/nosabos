import React, { useMemo } from "react";
import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalCloseButton,
  Text,
  VStack,
} from "@chakra-ui/react";

import { BitcoinWalletSection } from "./IdentityDrawer";
import { translations } from "../utils/translation";

export default function BitcoinSupportModal({
  isOpen,
  onClose,
  userLanguage = "en",
  identity = "",
  onSelectIdentity,
  isIdentitySaving = false,
}) {
  const lang = userLanguage === "es" ? "es" : "en";
  const ui = useMemo(() => translations[lang] || translations.en, [lang]);

  const title = ui.bitcoin_modal_title || "Support with Bitcoin";
  const description = ui.onboarding_bitcoin_optional_desc || "If you'd like to support a community, choose an identity and top up your wallet. You can skip this for now.";
  const skipLabel = ui.bitcoin_modal_skip || "Skip for now";
  const closeLabel = ui.bitcoin_modal_close || "Close";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      size="4xl"
      motionPreset="slideInBottom"
    >
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent
        bg="gray.900"
        color="gray.100"
        border="1px solid"
        borderColor="gray.700"
        rounded="2xl"
        shadow="xl"
        overflow="hidden"
        maxH="100vh"
        sx={{
          "@supports (height: 100dvh)": {
            maxHeight: "100dvh",
          },
        }}
      >
        <ModalHeader
          borderBottom="1px solid"
          borderColor="gray.800"
          px={6}
          pr={12}
          py={5}
        >
          <Text fontWeight="bold" fontSize="lg">
            {title}
          </Text>
        </ModalHeader>
        <ModalCloseButton
          color="gray.400"
          _hover={{ color: "gray.100" }}
          top={4}
          right={4}
        />
        <ModalBody px={{ base: 4, md: 6 }} py={6}>
          <VStack align="stretch" spacing={5}>
            <Box bg="gray.800" p={3} rounded="md">
              <Text fontSize="sm" mb={2}>
                {description}
              </Text>
            </Box>

            <BitcoinWalletSection
              userLanguage={lang}
              identity={identity}
              onSelectIdentity={onSelectIdentity}
              isIdentitySaving={isIdentitySaving}
            />
          </VStack>
        </ModalBody>
        <ModalFooter gap={3} px={{ base: 4, md: 6 }} py={4}>
          <Button variant="ghost" onClick={onClose}>
            {skipLabel}
          </Button>
          <Button colorScheme="teal" onClick={onClose}>
            {closeLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
