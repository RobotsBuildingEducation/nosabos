import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  HStack,
  Link,
  Radio,
  RadioGroup,
  Text,
  VStack,
} from "@chakra-ui/react";

import { BitcoinWalletSection } from "./IdentityDrawer";
import BottomDrawerDragHandle from "./BottomDrawerDragHandle";
import RandomCharacter from "./RandomCharacter";
import { BITCOIN_RECIPIENTS } from "../constants/bitcoinRecipients";
import { useNostrWalletStore } from "../hooks/useNostrWalletStore";
import useBottomDrawerSwipeDismiss from "../hooks/useBottomDrawerSwipeDismiss";
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
  const [selectedIdentity, setSelectedIdentity] = useState(identity || "");
  const cashuWallet = useNostrWalletStore((s) => s.cashuWallet);
  const swipeDismiss = useBottomDrawerSwipeDismiss({
    isOpen,
    onClose,
  });

  useEffect(() => {
    setSelectedIdentity(identity || "");
  }, [identity]);

  const selectedRecipient = useMemo(
    () =>
      BITCOIN_RECIPIENTS.find(
        (recipient) => recipient.npub === selectedIdentity,
      ),
    [selectedIdentity],
  );

  const title =
    ui.tutorial_bitcoin_modal_title ||
    (lang === "es" ? "Crea becas con aprendizaje" : "Create Scholarships");
  const subtitle =
    ui.tutorial_bitcoin_modal_subtitle ||
    (lang === "es"
      ? "Envía Bitcoin a educadores cada vez que ganes XP"
      : "Send Bitcoin to educators any time you gain XP");
  const footerNote =
    ui.tutorial_bitcoin_modal_body ||
    (lang === "es"
      ? "Esto se puede hacer después en tus ajustes."
      : "This can be done later in your settings.");
  const skipLabel =
    ui.tutorial_bitcoin_modal_skip ||
    (lang === "es" ? "Tal vez después" : "Maybe later");
  const closeLabel =
    ui.tutorial_bitcoin_modal_done || (lang === "es" ? "Listo" : "Done");

  const handleRecipientSelect = useCallback((nextIdentity) => {
    const nextValue = nextIdentity || "";
    setSelectedIdentity(nextValue);
    if (
      nextValue &&
      nextValue !== identity &&
      typeof onSelectIdentity === "function"
    ) {
      onSelectIdentity(nextValue);
    }
  }, [identity, onSelectIdentity]);

  const handleConfirm = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const recipientSelectorContent = (
    <>
      <RadioGroup value={selectedIdentity} onChange={handleRecipientSelect}>
        <VStack
          align="stretch"
          spacing={2}
          width={{ base: "100%", md: "fit-content" }}
        >
          {BITCOIN_RECIPIENTS.map((recipient) => {
            const isSelected = selectedIdentity === recipient.npub;
            return (
              <Box
                key={recipient.npub}
                width={{ base: "100%", md: "fit-content" }}
                maxW="100%"
              >
                <HStack
                  role="radio"
                  aria-checked={isSelected}
                  data-drawer-swipe-ignore="true"
                  tabIndex={isIdentitySaving ? -1 : 0}
                  spacing={2}
                  align="center"
                  width="100%"
                  px={{ base: 3, md: 4 }}
                  py={{ base: 2.5, md: 3 }}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={isSelected ? "teal.200" : "whiteAlpha.300"}
                  bg={isSelected ? "whiteAlpha.200" : "whiteAlpha.100"}
                  boxShadow={
                    isSelected ? "0 0 0 1px rgba(129, 230, 217, 0.3)" : "none"
                  }
                  cursor={isIdentitySaving ? "not-allowed" : "pointer"}
                  transition="background 0.18s ease, border-color 0.18s ease, transform 0.18s ease"
                  _hover={{
                    bg: isSelected ? "whiteAlpha.250" : "whiteAlpha.150",
                    borderColor: isSelected ? "teal.100" : "whiteAlpha.400",
                  }}
                  _active={{
                    transform: isIdentitySaving ? "none" : "scale(0.98)",
                  }}
                  userSelect="none"
                  sx={{
                    WebkitUserSelect: "none",
                    WebkitTouchCallout: "none",
                  }}
                  onClick={() => {
                    if (!isIdentitySaving) {
                      handleRecipientSelect(recipient.npub);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (
                      !isIdentitySaving &&
                      (event.key === "Enter" || event.key === " ")
                    ) {
                      event.preventDefault();
                      handleRecipientSelect(recipient.npub);
                    }
                  }}
                >
                  <Radio
                    colorScheme="purple"
                    value={recipient.npub}
                    size="sm"
                    isDisabled={isIdentitySaving}
                    pointerEvents="none"
                    flex="1"
                    minW={0}
                    sx={{
                      ".chakra-radio__label": {
                        fontSize: "xs",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        lineHeight: "1.2",
                      },
                    }}
                  >
                    {recipient.label}
                  </Radio>
                  {recipient.identityUrl ? (
                    <Link
                      href={recipient.identityUrl}
                      isExternal
                      fontSize="xs"
                      color="teal.200"
                      lineHeight="1"
                      ml="auto"
                      whiteSpace="nowrap"
                      flexShrink={0}
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      {lang === "es" ? "Ver sitio" : "View site"}
                    </Link>
                  ) : null}
                </HStack>
              </Box>
            );
          })}
        </VStack>
      </RadioGroup>
      {!selectedIdentity ? (
        <Text fontSize="xs" mt={2} color="orange.200" textAlign="left">
          {lang === "es"
            ? "Selecciona una opción para habilitar los depósitos."
            : "Select an option to enable deposits."}
        </Text>
      ) : null}
    </>
  );

  return (
    <Drawer
      isOpen={isOpen}
      placement="bottom"
      onClose={onClose}
      closeOnOverlayClick={false}
      returnFocusOnClose={false}
    >
      <DrawerOverlay
        {...swipeDismiss.overlayProps}
        bg="blackAlpha.700"
        backdropFilter="blur(4px)"
      />
      <DrawerContent
        {...swipeDismiss.drawerContentProps}
        bg="#171923"
        color="gray.100"
        borderTopWidth="1px"
        borderColor="#2a2f3a"
        borderTopRadius="24px"
        display="flex"
        flexDirection="column"
        overflow="hidden"
        maxH={{ base: "86vh", md: "82vh" }}
      >
        <BottomDrawerDragHandle isDragging={swipeDismiss.isDragging} />
        <DrawerBody px={0} pb={0} display="flex" flexDirection="column" flex={1} minH={0}>
          <Box
            position="relative"
            bgGradient="linear(to-r, #f7931a, #ffb347)"
            px={{ base: 5, md: 7 }}
            py={{ base: 4, md: 5 }}
            borderBottom="1px solid"
            borderColor="rgba(0, 0, 0, 0.18)"
            userSelect="none"
            sx={{
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
            }}
          >
            <VStack spacing={3} align="center" textAlign="center">
              <RandomCharacter width="82px" notSoRandomCharacter={"40"} />
              <Text
                fontWeight="bold"
                fontSize={{ base: "xl", md: "2xl" }}
                lineHeight="1.2"
                color="white"
              >
                {title}
              </Text>
              <Text
                fontSize={{ base: "xs", md: "sm" }}
                maxW="560px"
                lineHeight="1.45"
                color="whiteAlpha.900"
              >
                {subtitle}
              </Text>
            </VStack>
          </Box>

          <Box
            px={{ base: 4, md: 5 }}
            py={{ base: 4, md: 5 }}
            bg="#171923"
            overflowY="auto"
            flex="1"
            minH={0}
            data-drawer-swipe-ignore="true"
            sx={{
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              "&::-webkit-scrollbar": {
                display: "none",
              },
            }}
          >
            <VStack align="stretch" spacing={4} width="100%">
              <BitcoinWalletSection
                userLanguage={lang}
                identity={selectedIdentity}
                onSelectIdentity={onSelectIdentity}
                isIdentitySaving={isIdentitySaving}
                showSectionTitle={false}
                showScholarshipNote={false}
                containerProps={{
                  bg: "#171923",
                  rounded: "xl",
                  p: 0,
                  mx: { base: 0, md: "auto" },
                }}
                sectionBg="#171923"
                identitySelectorPlacement="bottom"
                contentMaxW="420px"
                showIdentitySelector={false}
                compactCardMobile
                compactCardDesktop
                hydrateWalletOnMount={false}
              />
              <Box w="100%" maxW="420px" mx="auto" pt={2}>
                {cashuWallet ? (
                  <Accordion allowToggle width="100%">
                    <AccordionItem border="0">
                      <AccordionButton
                        px={0}
                        py={2}
                        border="0"
                        borderRadius="0"
                        boxShadow="none"
                        outline="none"
                        _hover={{ bg: "transparent" }}
                        _expanded={{ bg: "transparent" }}
                        _active={{ bg: "transparent" }}
                        _focus={{ boxShadow: "none", outline: "none" }}
                        _focusVisible={{ boxShadow: "none", outline: "none" }}
                        userSelect="none"
                        sx={{
                          WebkitUserSelect: "none",
                          WebkitTouchCallout: "none",
                          WebkitTapHighlightColor: "transparent",
                          "&[data-focus]": {
                            boxShadow: "none",
                            outline: "none",
                          },
                          "&[data-focus-visible]": {
                            boxShadow: "none",
                            outline: "none",
                          },
                        }}
                      >
                        <Box flex="1" textAlign="left">
                          <Text fontSize="sm">
                            {lang === "es"
                              ? "Elige un destinatario"
                              : "Choose a recipient"}
                          </Text>
                          {selectedRecipient ? (
                            <Text fontSize="xs" color="gray.400" mt={1}>
                              {selectedRecipient.label}
                            </Text>
                          ) : null}
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel px={0} pt={2} pb={0}>
                        {recipientSelectorContent}
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                ) : (
                  <>
                    <Text fontSize="sm" mb={2} textAlign="left">
                      {lang === "es"
                        ? "Elige un destinatario"
                        : "Choose a recipient"}
                    </Text>
                    {recipientSelectorContent}
                  </>
                )}
              </Box>
            </VStack>
          </Box>

          <Box
            px={{ base: 4, md: 5 }}
            py={{ base: 3, md: 4 }}
            bg="#171923"
            data-drawer-swipe-ignore="true"
            userSelect="none"
            sx={{
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
            }}
          >
            <VStack spacing={2} width="100%">
              <Box display="flex" justifyContent="flex-end" width="100%" gap={3}>
                <Button variant="ghost" onClick={onClose}>
                  {skipLabel}
                </Button>
                <Button colorScheme="teal" onClick={handleConfirm}>
                  {closeLabel}
                </Button>
              </Box>
              <Text fontSize="xs" color="gray.400" textAlign="center">
                {footerNote}
              </Text>
            </VStack>
          </Box>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
