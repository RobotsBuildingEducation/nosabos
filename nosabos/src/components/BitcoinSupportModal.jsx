import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Link,
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
import { useNostrWalletStore } from "../hooks/useNostrWalletStore";
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

  const rerunWallet = useNostrWalletStore((s) => s.rerunWallet);
  const [reloadScheduled, setReloadScheduled] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setReloadScheduled(false);
      return;
    }
    if (!rerunWallet || reloadScheduled) return;

    setReloadScheduled(true);
    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [rerunWallet, isOpen, reloadScheduled]);

  const title =
    ui.bitcoin_modal_title ||
    (lang === "es" ? "Apoya con Bitcoin" : "Support with Bitcoin");
  const description =
    ui.onboarding_bitcoin_optional_desc ||
    (lang === "es"
      ? "Si quieres apoyar a una comunidad, elige una identidad y recarga tu billetera. Puedes omitir este paso."
      : "If you’d like to support a community, choose an identity and top up your wallet. You can skip this for now.");
  const reloadNote =
    ui.bitcoin_modal_reload_note ||
    (lang === "es"
      ? "Cuando tu depósito se confirme, recargaremos la app para actualizar tu saldo."
      : "Once your deposit is confirmed we'll reload the app to update your balance.");
  const scholarshipNote =
    ui.bitcoin_modal_scholarship_note ||
    (lang === "es"
      ? "Tus depósitos nos ayudan a crear becas con aprendizaje con "
      : "Your deposits help us create scholarships with learning with ");
  const successMessage =
    ui.bitcoin_modal_success ||
    (lang === "es"
      ? "¡Depósito recibido! Recargando para actualizar tu saldo…"
      : "Deposit received! Reloading to refresh your balance…");
  const skipLabel =
    ui.bitcoin_modal_skip ||
    (lang === "es" ? "Omitir por ahora" : "Skip for now");
  const closeLabel =
    ui.bitcoin_modal_close || (lang === "es" ? "Cerrar" : "Close");

  return (
    <Modal
      isOpen={isOpen}
      onClose={reloadScheduled ? () => {} : onClose}
      isCentered
      size="4xl"
      closeOnEsc={!reloadScheduled}
      closeOnOverlayClick={!reloadScheduled}
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
              <Text fontSize="xs" opacity={0.8}>
                {reloadNote}
              </Text>
              {/* <Text fontSize="xs" opacity={0.9} mt={3}>
                {scholarshipNote}{" "}
                <Link
                  href="https://robotsbuildingeducation.com"
                  isExternal
                  color="teal.200"
                  textDecoration="underline"
                >
                  RobotsBuildingEducation.com
                </Link>
              </Text> */}
            </Box>

            {reloadScheduled && (
              <Alert
                status="success"
                variant="left-accent"
                bg="green.900"
                color="green.100"
              >
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            <BitcoinWalletSection
              userLanguage={lang}
              identity={identity}
              onSelectIdentity={onSelectIdentity}
              isIdentitySaving={isIdentitySaving}
            />
          </VStack>
        </ModalBody>
        <ModalFooter gap={3} px={{ base: 4, md: 6 }} py={4}>
          <Button
            variant="ghost"
            onClick={onClose}
            isDisabled={reloadScheduled}
          >
            {skipLabel}
          </Button>
          <Button
            colorScheme="teal"
            onClick={onClose}
            isDisabled={reloadScheduled}
          >
            {closeLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
