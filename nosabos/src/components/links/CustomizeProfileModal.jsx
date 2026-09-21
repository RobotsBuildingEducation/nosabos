import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button as ChakraButton,
  Divider,
  HStack,
  Image,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton as ChakraModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { QRCodeSVG } from "qrcode.react";
import { BsQrCode } from "react-icons/bs";
import { SiCashapp } from "react-icons/si";
import { FaKey } from "react-icons/fa";
import { logEvent } from "firebase/analytics";
import { doc, updateDoc } from "firebase/firestore";
import { analytics, database } from "../../firebaseResources/firebaseResources";
import useNostrWalletStore from "../../hooks/useNostrWalletStore";
import {
  nativeModalMotionProps,
  nativeOverlayMotionProps,
} from "../../utils/modalMotion";
import RouteLoadingOrb from "../RouteLoadingOrb";

// Lazy-load the heavy IdentityCard (contains styled-components, ~441 kB)
const IdentityCard = lazy(() =>
  import("../IdentityCard").then((m) => ({ default: m.IdentityCard })),
);

const isLocalhost = () =>
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

export default function CustomizeProfileModal({
  isOpen,
  onClose,
  isLightTheme,
  translations,
  pageDirection,
  isRtl,
  directionalTextAlign,
  primaryAccent,
  secondaryAccent,
  walletAccent,
  modalBg,
  modalPanelBg,
  modalBorderColor,
  modalShadowColor,
  modalHeaderBg,
  modalHeadingColor,
  modalScrollSx,
  labelColor,
  helperColor,
  inputBg,
  inputBorderColor,
  buttonShadowColor,
  buttonHoverShadowColor,
  buttonActiveShadowColor,
  displayName,
  setDisplayName,
  profilePicture,
  setProfilePicture,
  postNostrContent,
  connectToNostr,
  auth,
  handleSelectSound,
  handleSubmitActionSound,
}) {
  const toast = useToast();

  const [usernameInput, setUsernameInput] = useState(displayName || "");
  const [profilePictureUrlInput, setProfilePictureUrlInput] = useState(
    profilePicture || "",
  );
  const [nsecInput, setNsecInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Wallet state
  const [walletHydrating, setWalletHydrating] = useState(true);
  const [noWalletFound, setNoWalletFound] = useState(false);
  const [nsecForWallet, setNsecForWallet] = useState("");

  // Wallet store selectors
  const cashuWallet = useNostrWalletStore((s) => s.cashuWallet);
  const walletBalance = useNostrWalletStore((s) => s.walletBalance);
  const createNewWallet = useNostrWalletStore((s) => s.createNewWallet);
  const initiateDeposit = useNostrWalletStore((s) => s.initiateDeposit);
  const invoice = useNostrWalletStore((s) => s.invoice);
  const isCreatingWallet = useNostrWalletStore((s) => s.isCreatingWallet);
  const walletInit = useNostrWalletStore((s) => s.init);
  const initWallet = useNostrWalletStore((s) => s.initWallet);

  // Detect if user is logged in via NIP-07 extension
  const isNip07Mode =
    typeof window !== "undefined" &&
    localStorage.getItem("nip07_signer") === "true";

  // Wallet balance computed
  const totalBalance = useMemo(() => {
    const numeric = Number(walletBalance);
    return Number.isFinite(numeric) ? numeric : 0;
  }, [walletBalance]);

  // Hydrate wallet when modal opens
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const connected = await walletInit();
        if (connected) {
          const wallet = await initWallet();
          if (alive && !wallet) {
            setNoWalletFound(true);
          }
        }
      } catch (e) {
        console.warn("Wallet hydrate failed:", e);
      } finally {
        if (alive) setWalletHydrating(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [walletInit, initWallet]);

  // Handle profile save (username and picture)
  const handleSaveProfile = async () => {
    if (!usernameInput.trim() && !profilePictureUrlInput.trim()) {
      toast({
        title: translations.noChanges,
        description: translations.enterUsernameOrPicture,
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSaving(true);
    try {
      const trimmedProfilePictureUrl = profilePictureUrlInput.trim();

      const metadata = {
        name: usernameInput.trim() || displayName || "",
        about: "A student onboarded with Robots Building Education",
      };

      if (trimmedProfilePictureUrl) {
        metadata.picture = trimmedProfilePictureUrl;
        metadata.profilePictureUrl = trimmedProfilePictureUrl;
      }

      await postNostrContent(JSON.stringify(metadata), 0);

      if (usernameInput.trim()) {
        localStorage.setItem("displayName", usernameInput.trim());
        setDisplayName(usernameInput.trim());

        const storedNpub = localStorage.getItem("local_npub");
        if (storedNpub) {
          await updateDoc(doc(database, "users", storedNpub), {
            displayName: usernameInput.trim(),
          });
        }
      }

      if (trimmedProfilePictureUrl) {
        localStorage.setItem("profilePicture", trimmedProfilePictureUrl);
        localStorage.setItem("profilePictureUrl", trimmedProfilePictureUrl);
        setProfilePicture(trimmedProfilePictureUrl);
      }

      toast({
        position: "top",
        title: translations.profileUpdated,
        description: translations.profileSaved,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast({
        title: translations.error,
        description: error.message || translations.failedUpdateProfile,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle copy secret key
  const handleCopySecretKey = async ({ showSuccessToast = true } = {}) => {
    const nsec = localStorage.getItem("local_nsec");
    if (!nsec || nsec === "nip07") {
      toast({
        position: "top",
        title: translations.noSecretKey,
        description: translations.usingExtension,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    try {
      await navigator.clipboard.writeText(nsec);
      if (showSuccessToast) {
        toast({
          position: "top",
          title: translations.copied,
          description: translations.secretKeyCopied,
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
      return true;
    } catch {
      toast({
        title: translations.error,
        description: translations.failedCopy,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
  };

  // Fetch profile from Nostr on demand
  const fetchNostrProfile = async (npubToFetch) => {
    try {
      const connection = await connectToNostr();
      if (!connection) return null;

      const { ndkInstance } = connection;
      const [{ bech32 }, { Buffer }, { NDKKind }] = await Promise.all([
        import("bech32"),
        import("buffer"),
        import("@nostr-dev-kit/ndk"),
      ]);

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
        setTimeout(() => {
          resolve(profile);
        }, 5000);
      });
    } catch (e) {
      console.error("Failed to fetch Nostr profile:", e);
      return null;
    }
  };

  // Handle switch account (paste nsec)
  const handleSwitchAccount = async () => {
    if (!nsecInput.trim()) {
      toast({
        title: translations.missingKey,
        description: translations.pasteValidNsec,
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const trimmedNsec = nsecInput.trim();
    if (!trimmedNsec.startsWith("nsec")) {
      toast({
        title: translations.invalidKey,
        description: translations.keyMustStartNsec,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSwitching(true);
    try {
      const newNpub = await auth(trimmedNsec);
      if (newNpub) {
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
          localStorage.setItem("profilePictureUrl", profile.picture);
          setProfilePicture(profile.picture);
          setProfilePictureUrlInput(profile.picture);
        } else {
          localStorage.setItem("profilePicture", "");
          localStorage.setItem("profilePictureUrl", "");
          setProfilePicture("");
          setProfilePictureUrlInput("");
        }

        toast({
          position: "top",
          title: translations.accountSwitched,
          description: translations.loginSuccess,
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
        title: translations.error,
        description: translations.authFailed,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSwitching(false);
    }
  };

  // Wallet handlers
  const handleCreateWallet = async () => {
    if (isNip07Mode && noWalletFound && !nsecForWallet.trim()) {
      toast({
        title: translations.secretKeyRequired,
        description: translations.secretKeyRequiredToast,
        status: "warning",
        duration: 2500,
      });
      return;
    }

    if (nsecForWallet.trim() && !nsecForWallet.trim().startsWith("nsec")) {
      toast({
        title: translations.invalidKey,
        description: translations.keyMustStartNsec,
        status: "error",
        duration: 2500,
      });
      return;
    }

    try {
      const nsecToUse =
        isNip07Mode && nsecForWallet.trim() ? nsecForWallet.trim() : null;
      await createNewWallet(nsecToUse);

      setNsecForWallet("");
      setNoWalletFound(false);
    } catch (err) {
      console.error("Error creating wallet:", err);
      toast({
        title: translations.error,
        description: translations.failedCreateWallet,
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleInitiateDeposit = async () => {
    try {
      await initiateDeposit(100);
    } catch (err) {
      console.error("Error initiating deposit:", err);
      toast({
        title: translations.error,
        description: translations.failedDeposit,
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleCopyInvoice = async () => {
    try {
      await navigator.clipboard.writeText(invoice || "");
      toast({
        title: translations.addressCopied,
        description: translations.invoiceCopied,
        status: "success",
        duration: 1500,
        isClosable: true,
        position: "top",
      });
    } catch {
      // Ignore clipboard write failures
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      size="md"
      scrollBehavior="inside"
      motionPreset="none"
    >
      <ModalOverlay
        motionProps={nativeOverlayMotionProps}
        bg={isLightTheme ? "rgba(23, 23, 26, 0.82)" : "rgba(0, 0, 0, 0.84)"}
      />
      <ModalContent
        motionProps={nativeModalMotionProps}
        dir={pageDirection}
        bg={modalBg}
        color={modalBorderColor}
        borderWidth="4px"
        borderStyle="solid"
        borderColor={modalBorderColor}
        borderRadius="0 !important"
        boxShadow={`8px 9px 0 ${modalShadowColor}`}
        fontFamily="'DM Sans', sans-serif"
        w="95vw"
        maxW="md"
        maxH="85vh"
        overflow="hidden"
        style={{
          "--links-accent-primary": modalBorderColor,
          "--links-accent-warm": modalBorderColor,
          "--links-accent-pink": modalBorderColor,
        }}
      >
        <ModalHeader
          position="relative"
          bg={modalHeaderBg}
          px={{ base: 4, md: 7 }}
          py={{ base: 3, md: 4 }}
          pe={{ base: 14, md: 20 }}
          fontSize={{ base: "lg", md: "2xl" }}
          fontWeight="900"
          fontStyle="italic"
          lineHeight={{ base: "1.08", md: "1" }}
          letterSpacing="-0.035em"
          textTransform="uppercase"
          whiteSpace="normal"
          overflowWrap="anywhere"
          color={modalHeadingColor}
          textAlign={directionalTextAlign}
        >
          {translations.customizeProfileTitle}
        </ModalHeader>
        <ChakraModalCloseButton
          top={{ base: 2, md: 3 }}
          color={modalBg}
          bg={modalBorderColor}
          borderWidth="3px"
          borderStyle="solid"
          borderColor={modalBorderColor}
          borderRadius="0 !important"
          boxShadow="none"
          onClick={handleSelectSound}
          left={isRtl ? 3 : undefined}
          right={isRtl ? "auto" : undefined}
          _hover={{ opacity: 0.78 }}
          _focusVisible={{
            outline: `3px solid ${modalBorderColor}`,
            outlineOffset: "3px",
            boxShadow: "none",
          }}
        />
        <ModalBody
          m={{ base: 3, md: 4 }}
          p={{ base: 5, md: 6 }}
          bg={modalPanelBg}
          boxShadow="none"
          overflowY="auto"
          sx={modalScrollSx}
        >
          <VStack spacing={6} align="stretch">
            {/* Profile Avatar with 50% border radius */}
            {(profilePictureUrlInput || profilePicture) && (
              <Box display="flex" justifyContent="center" mb={1} mt={-1}>
                <Box
                  w={{ base: "88px", md: "96px" }}
                  h={{ base: "88px", md: "96px" }}
                  borderRadius="50%"
                  overflow="hidden"
                  border="3.5px solid"
                  borderColor={modalBorderColor}
                  boxShadow={`4px 5px 0 ${modalShadowColor}`}
                  bg={modalBg}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Image
                    src={profilePictureUrlInput || profilePicture}
                    alt="Profile Avatar"
                    w="100%"
                    h="100%"
                    objectFit="cover"
                    fallbackSrc=""
                  />
                </Box>
              </Box>
            )}

            {/* Username Section */}
            <Box>
              <Text
                fontSize="sm"
                color={labelColor}
                mb={2}
                textAlign={directionalTextAlign}
              >
                {translations.username}
              </Text>
              <Input
                dir={pageDirection}
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder={translations.enterUsername}
                bg={inputBg}
                border="1px solid"
                borderColor={inputBorderColor}
                color={isLightTheme ? "#17171a" : undefined}
                _placeholder={{ color: helperColor }}
                _focus={{
                  borderColor: primaryAccent,
                  boxShadow: isLightTheme
                    ? "0 0 0 3px rgba(15, 118, 110, 0.12)"
                    : "0 0 10px rgba(0, 255, 255, 0.3)",
                }}
              />
            </Box>

            {/* Profile Picture Section */}
            <Box>
              <Text
                fontSize="sm"
                color={labelColor}
                mb={2}
                textAlign={directionalTextAlign}
              >
                {translations.profilePictureUrl}
              </Text>
              <Input
                dir="ltr"
                value={profilePictureUrlInput}
                onChange={(e) => setProfilePictureUrlInput(e.target.value)}
                placeholder={translations.profilePicturePlaceholder}
                bg={inputBg}
                border="1px solid"
                borderColor={inputBorderColor}
                color={isLightTheme ? "#17171a" : undefined}
                _placeholder={{ color: helperColor }}
                _focus={{
                  borderColor: primaryAccent,
                  boxShadow: isLightTheme
                    ? "0 0 0 3px rgba(15, 118, 110, 0.12)"
                    : "0 0 10px rgba(0, 255, 255, 0.3)",
                }}
              />
            </Box>

            {/* Save Profile Button */}
            <Box
              as="button"
              type="button"
              onClick={() => {
                if (isSaving) return;
                handleSubmitActionSound();
                if (!isLocalhost()) {
                  logEvent(analytics, "links_save_profile");
                }
                handleSaveProfile();
              }}
              disabled={isSaving}
              w="100%"
              h="48px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg={isLightTheme ? "#0d9488" : "#14b8a6"}
              color="#ffffff"
              style={{
                backgroundColor: isLightTheme ? "#0d9488" : "#14b8a6",
                color: "#ffffff",
              }}
              border="2px solid"
              borderColor={isLightTheme ? "#000000" : "#ffffff"}
              borderRadius="0"
              boxShadow={`4px 5px 0 ${buttonShadowColor}`}
              fontFamily="'DM Sans', sans-serif"
              fontWeight="900"
              fontSize="md"
              cursor={isSaving ? "not-allowed" : "pointer"}
              opacity={isSaving ? 0.7 : 1}
              transition="all 0.15s ease"
              _hover={
                isSaving
                  ? {}
                  : {
                      bg: isLightTheme ? "#0f766e" : "#2dd4bf",
                      transform: "translate(-2px, -2px)",
                      boxShadow: `6px 7px 0 ${buttonHoverShadowColor}`,
                    }
              }
              _active={
                isSaving
                  ? {}
                  : {
                      transform: "translate(2px, 2px)",
                      boxShadow: `2px 2px 0 ${buttonActiveShadowColor}`,
                    }
              }
            >
              {isSaving ? "..." : translations.saveProfile}
            </Box>

            <Divider
              borderColor={
                isLightTheme ? "#000000" : "rgba(255, 255, 255, 0.3)"
              }
            />

            {/* Secret Key Section */}
            <Box>
              <Text
                fontSize="sm"
                color={labelColor}
                mb={2}
                textAlign={directionalTextAlign}
              >
                {translations.secretKey}
              </Text>
              <Box
                as="button"
                type="button"
                onClick={() => {
                  handleSelectSound();
                  handleCopySecretKey();
                }}
                w="100%"
                h="48px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg={isLightTheme ? "#ffffff" : "transparent"}
                color={isLightTheme ? "#17171a" : "#ffffff"}
                style={{
                  backgroundColor: isLightTheme ? "#ffffff" : "transparent",
                  color: isLightTheme ? "#17171a" : "#ffffff",
                }}
                border="2px solid"
                borderColor={isLightTheme ? "#000000" : "#ffffff"}
                borderRadius="0"
                boxShadow={`4px 5px 0 ${buttonShadowColor}`}
                fontFamily="'DM Sans', sans-serif"
                fontWeight="800"
                fontSize="md"
                cursor="pointer"
                transition="all 0.15s ease"
                _hover={{
                  bg: isLightTheme ? "#f4f4f5" : "rgba(255, 255, 255, 0.1)",
                  transform: "translate(-2px, -2px)",
                  boxShadow: `6px 7px 0 ${buttonHoverShadowColor}`,
                }}
                _active={{
                  transform: "translate(2px, 2px)",
                  boxShadow: `2px 2px 0 ${buttonActiveShadowColor}`,
                }}
              >
                {translations.copySecretKey}
              </Box>
              <Text
                fontSize="xs"
                color={helperColor}
                mt={2}
                textAlign={directionalTextAlign}
              >
                {translations.secretKeyWarning}
              </Text>
            </Box>

            {/* Switch Account Accordion */}
            <Accordion allowToggle>
              <AccordionItem border="none">
                <AccordionButton
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  px={{ base: 4, md: 5 }}
                  py={3.5}
                  bg={isLightTheme ? "#ffffff" : "#151519"}
                  color={isLightTheme ? "#17171a" : "#ffffff"}
                  style={{
                    backgroundColor: isLightTheme ? "#ffffff" : "#151519",
                    color: isLightTheme ? "#17171a" : "#ffffff",
                  }}
                  border="2px solid"
                  borderColor={isLightTheme ? "#000000" : "#ffffff"}
                  borderRadius="0"
                  boxShadow={`4px 5px 0 ${buttonShadowColor}`}
                  cursor="pointer"
                  _hover={{
                    bg: isLightTheme ? "#f4f4f5" : "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <Box flex="1" textAlign={directionalTextAlign}>
                    <Text
                      fontSize="sm"
                      fontWeight="800"
                      color={isLightTheme ? "#17171a" : "#ffffff"}
                      style={{ color: isLightTheme ? "#17171a" : "#ffffff" }}
                    >
                      {translations.switchAccount}
                    </Text>
                  </Box>
                  <AccordionIcon
                    color={isLightTheme ? "#17171a" : "#ffffff"}
                    style={{ color: isLightTheme ? "#17171a" : "#ffffff" }}
                    boxSize={5}
                  />
                </AccordionButton>
                <AccordionPanel
                  px={{ base: 4, md: 5 }}
                  py={4}
                  mt={3}
                  bg={isLightTheme ? "#fcfaf6" : "#111114"}
                  border="2px solid"
                  borderColor={isLightTheme ? "#000000" : "#ffffff"}
                  borderRadius="0"
                  boxShadow={`4px 5px 0 ${
                    isLightTheme ? "#000000" : "rgba(255, 255, 255, 0.25)"
                  }`}
                >
                  <VStack spacing={3} align="stretch">
                    <Input
                      dir="ltr"
                      value={nsecInput}
                      onChange={(e) => setNsecInput(e.target.value)}
                      placeholder={translations.pasteNsec}
                      bg={inputBg}
                      border="1px solid"
                      borderColor={inputBorderColor}
                      type="password"
                      color={isLightTheme ? "#17171a" : undefined}
                      _placeholder={{ color: helperColor }}
                      _focus={{
                        borderColor: isLightTheme ? "#000000" : "#ffffff",
                        boxShadow: isLightTheme
                          ? "0 0 0 3px rgba(0, 0, 0, 0.12)"
                          : "0 0 10px rgba(255, 255, 255, 0.3)",
                      }}
                    />
                    <Box
                      as="button"
                      type="button"
                      onClick={() => {
                        handleSelectSound();
                        handleSwitchAccount();
                      }}
                      disabled={isSwitching}
                      h="44px"
                      w="100%"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bg={isLightTheme ? "#ffffff" : "transparent"}
                      color={isLightTheme ? "#17171a" : "#ffffff"}
                      style={{
                        backgroundColor: isLightTheme
                          ? "#ffffff"
                          : "transparent",
                        color: isLightTheme ? "#17171a" : "#ffffff",
                      }}
                      border="2px solid"
                      borderColor={isLightTheme ? "#000000" : "#ffffff"}
                      borderRadius="0"
                      boxShadow={`4px 5px 0 ${buttonShadowColor}`}
                      fontFamily="'DM Sans', sans-serif"
                      fontWeight="800"
                      fontSize="md"
                      cursor={isSwitching ? "not-allowed" : "pointer"}
                      opacity={isSwitching ? 0.7 : 1}
                      transition="all 0.15s ease"
                      _hover={
                        isSwitching
                          ? {}
                          : {
                              bg: isLightTheme
                                ? "#f4f4f5"
                                : "rgba(255, 255, 255, 0.1)",
                              transform: "translate(-2px, -2px)",
                              boxShadow: `6px 7px 0 ${buttonHoverShadowColor}`,
                            }
                      }
                      _active={
                        isSwitching
                          ? {}
                          : {
                              transform: "translate(2px, 2px)",
                              boxShadow: `2px 2px 0 ${buttonActiveShadowColor}`,
                            }
                      }
                    >
                      {isSwitching ? "..." : translations.switchAccount}
                    </Box>
                    <Text
                      fontSize="xs"
                      color={helperColor}
                      textAlign={directionalTextAlign}
                    >
                      {translations.switchAccountHelp}
                    </Text>
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>

            <Divider
              borderColor={
                isLightTheme ? "#000000" : "rgba(255, 255, 255, 0.3)"
              }
            />
            {/* Bitcoin Wallet Section */}
            <Box
              bg={isLightTheme ? "#fcfaf6" : "rgba(0, 0, 0, 0.3)"}
              rounded="none"
              p={4}
              border="2px solid"
              borderColor={isLightTheme ? "#000000" : walletAccent}
              boxShadow={isLightTheme ? "4px 5px 0 #000000" : undefined}
            >
              <Text
                fontSize="sm"
                color={isLightTheme ? "#000000" : walletAccent}
                fontWeight="900"
                letterSpacing="-0.02em"
                mb={3}
                textAlign={directionalTextAlign}
              >
                {translations.bitcoinWallet}
              </Text>

              <Text
                fontSize="xs"
                color={labelColor}
                mb={4}
                textAlign={directionalTextAlign}
              >
                {translations.walletDescription1}
              </Text>

              <Text
                fontSize="xs"
                color={labelColor}
                mb={4}
                textAlign={directionalTextAlign}
              >
                {translations.walletDescription2}
              </Text>

              {/* Loading/hydration spinner */}
              {walletHydrating && !cashuWallet && (
                <HStack py={2}>
                  <RouteLoadingOrb size={24} />
                  <Text fontSize="sm" color={labelColor}>
                    {translations.loadingWallet}
                  </Text>
                </HStack>
              )}

              {/* No wallet yet → show create wallet UI */}
              {!cashuWallet && !walletHydrating && (
                <Box>
                  {/* NIP-07 users need to provide their nsec for wallet creation */}
                  {isNip07Mode && noWalletFound && (
                    <Box
                      bg={
                        isLightTheme
                          ? "rgba(192, 38, 211, 0.08)"
                          : "rgba(255, 0, 255, 0.1)"
                      }
                      p={3}
                      rounded="md"
                      mb={3}
                      border="1px solid"
                      borderColor={
                        isLightTheme
                          ? "rgba(192, 38, 211, 0.18)"
                          : "rgba(255, 0, 255, 0.3)"
                      }
                    >
                      <HStack mb={2} justify="flex-start">
                        <FaKey color={secondaryAccent} />
                        <Text
                          fontSize="sm"
                          fontWeight="semibold"
                          color={secondaryAccent}
                          textAlign={directionalTextAlign}
                        >
                          {translations.secretKeyRequired}
                        </Text>
                      </HStack>
                      <Text
                        fontSize="xs"
                        color={labelColor}
                        mb={3}
                        textAlign={directionalTextAlign}
                      >
                        {translations.nip07Warning}
                      </Text>
                      <Input
                        dir="ltr"
                        type="password"
                        value={nsecForWallet}
                        onChange={(e) => setNsecForWallet(e.target.value)}
                        placeholder={translations.enterNsec}
                        bg={inputBg}
                        borderColor={inputBorderColor}
                        color={isLightTheme ? "#17171a" : undefined}
                        _placeholder={{ color: helperColor }}
                        _focus={{
                          borderColor: isLightTheme
                            ? "#000000"
                            : secondaryAccent,
                          boxShadow: isLightTheme
                            ? "0 0 0 3px rgba(0, 0, 0, 0.12)"
                            : "0 0 10px rgba(255, 0, 255, 0.3)",
                        }}
                        mb={2}
                      />
                      <Text
                        fontSize="xs"
                        color={isLightTheme ? "#92400e" : "orange.300"}
                        textAlign={directionalTextAlign}
                      >
                        {translations.keyNotStored}
                      </Text>
                    </Box>
                  )}
                  <Box
                    as="button"
                    type="button"
                    onClick={() => {
                      if (isCreatingWallet) return;
                      handleSelectSound();
                      handleCreateWallet();
                    }}
                    disabled={
                      isCreatingWallet ||
                      Boolean(
                        isNip07Mode && noWalletFound && !nsecForWallet.trim(),
                      )
                    }
                    h="48px"
                    w="100%"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg="#16b078"
                    color="white"
                    style={{
                      backgroundColor: "#16b078",
                      color: "white",
                    }}
                    border="2px solid"
                    borderColor={isLightTheme ? "#000000" : "#ffffff"}
                    borderRadius="0"
                    boxShadow={`4px 5px 0 ${buttonShadowColor}`}
                    fontFamily="'DM Sans', sans-serif"
                    fontWeight="800"
                    fontSize="md"
                    cursor={isCreatingWallet ? "not-allowed" : "pointer"}
                    opacity={isCreatingWallet ? 0.7 : 1}
                    transition="all 0.15s ease"
                    _hover={
                      isCreatingWallet
                        ? {}
                        : {
                            bg: "#15803d",
                            transform: "translate(-2px, -2px)",
                            boxShadow: `6px 7px 0 ${buttonHoverShadowColor}`,
                          }
                    }
                  >
                    {isCreatingWallet
                      ? translations.creatingWallet
                      : translations.createWallet}
                  </Box>
                </Box>
              )}

              {/* Wallet exists, balance > 0 → show card */}
              {cashuWallet && totalBalance > 0 && (
                <Box>
                  <Suspense fallback={null}>
                    <IdentityCard
                      number={cashuWallet.walletId}
                      name={
                        <div>
                          {translations.wallet}
                          <div>
                            {translations.balance}: {totalBalance || 0}{" "}
                            {translations.sats}
                          </div>
                        </div>
                      }
                      theme="nostr"
                      animateOnChange={false}
                      realValue={cashuWallet.walletId}
                      totalBalance={totalBalance || 0}
                    />
                  </Suspense>
                </Box>
              )}

              {/* Wallet exists, no balance yet */}
              {cashuWallet && totalBalance <= 0 && (
                <Box>
                  {!invoice && (
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                    >
                      <Suspense fallback={null}>
                        <IdentityCard
                          number={cashuWallet.walletId}
                          name={
                            <div>
                              {translations.wallet}
                              <div>
                                {translations.balance}: {totalBalance || 0}{" "}
                                {translations.sats}
                              </div>
                            </div>
                          }
                          theme="BTC"
                          animateOnChange={false}
                          realValue={cashuWallet.walletId}
                          totalBalance={totalBalance || 0}
                        />
                      </Suspense>
                      <Box
                        as="button"
                        type="button"
                        mt={3}
                        onClick={() => {
                          handleSelectSound();
                          handleInitiateDeposit();
                        }}
                        h="48px"
                        w="100%"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontSize="md"
                        bg={isLightTheme ? "#ffffff" : walletAccent}
                        color={isLightTheme ? "#17171a" : "white"}
                        style={{
                          backgroundColor: isLightTheme
                            ? "#ffffff"
                            : walletAccent,
                          color: isLightTheme ? "#17171a" : "white",
                        }}
                        border="2px solid"
                        borderColor={isLightTheme ? "#000000" : "#ffffff"}
                        borderRadius="0"
                        boxShadow={`4px 5px 0 ${buttonShadowColor}`}
                        fontFamily="'DM Sans', sans-serif"
                        fontWeight="800"
                        cursor="pointer"
                        transition="all 0.15s ease"
                        _hover={{
                          bg: isLightTheme ? "#f4f4f5" : "#15803d",
                          transform: "translate(-2px, -2px)",
                          boxShadow: `6px 7px 0 ${buttonHoverShadowColor}`,
                        }}
                      >
                        {translations.deposit}
                      </Box>
                    </Box>
                  )}

                  {invoice && (
                    <VStack mt={2} spacing={3}>
                      <Box
                        p={3}
                        bg="white"
                        rounded="md"
                        display="flex"
                        justifyContent="center"
                      >
                        <QRCodeSVG value={invoice} size={200} />
                      </Box>
                      <HStack>
                        <Text fontSize="sm" color={labelColor}>
                          {translations.or}
                        </Text>
                        <Box
                          as="button"
                          type="button"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          px={4}
                          py={2}
                          h="36px"
                          onClick={() => {
                            handleSelectSound();
                            handleCopyInvoice();
                          }}
                          bg={isLightTheme ? "#ffffff" : "transparent"}
                          color={isLightTheme ? "#17171a" : "#ffffff"}
                          style={{
                            backgroundColor: isLightTheme
                              ? "#ffffff"
                              : "transparent",
                            color: isLightTheme ? "#17171a" : "#ffffff",
                          }}
                          border="2px solid"
                          borderColor={isLightTheme ? "#000000" : "#ffffff"}
                          borderRadius="0"
                          boxShadow={`3px 4px 0 ${buttonShadowColor}`}
                          fontWeight="800"
                          fontSize="sm"
                          cursor="pointer"
                          transition="all 0.15s ease"
                          _hover={{
                            bg: isLightTheme
                              ? "#f4f4f5"
                              : "rgba(255, 255, 255, 0.1)",
                            transform: "translate(-2px, -2px)",
                          }}
                        >
                          {translations.copyAddress}
                        </Box>
                      </HStack>
                      <Text
                        fontSize="xs"
                        color={helperColor}
                        textAlign="center"
                      >
                        {translations.lightningInstructions}
                        <br />
                        <Link
                          href="https://click.cash.app/ui6m/home2022"
                          isExternal
                          color={primaryAccent}
                          display="inline-flex"
                          alignItems="center"
                          gap="4px"
                          textDecoration="underline"
                        >
                          <SiCashapp />
                          <Text as="span">{translations.cashApp}</Text>
                        </Link>
                      </Text>
                      <Box
                        as="button"
                        type="button"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        gap={2}
                        px={4}
                        py={2}
                        h="36px"
                        onClick={() => {
                          handleSelectSound();
                          handleInitiateDeposit();
                        }}
                        bg={isLightTheme ? "#ffffff" : "transparent"}
                        color={isLightTheme ? "#17171a" : "#ffffff"}
                        style={{
                          backgroundColor: isLightTheme
                            ? "#ffffff"
                            : "transparent",
                          color: isLightTheme ? "#17171a" : "#ffffff",
                        }}
                        border="2px solid"
                        borderColor={isLightTheme ? "#000000" : "#ffffff"}
                        borderRadius="0"
                        boxShadow={`3px 4px 0 ${buttonShadowColor}`}
                        fontWeight="800"
                        fontSize="sm"
                        cursor="pointer"
                        transition="all 0.15s ease"
                        _hover={{
                          bg: isLightTheme
                            ? "#f4f4f5"
                            : "rgba(255, 255, 255, 0.1)",
                          transform: "translate(-2px, -2px)",
                        }}
                      >
                        <BsQrCode />
                        <span>{translations.generateNewQR}</span>
                      </Box>
                    </VStack>
                  )}
                </Box>
              )}
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter
          bg={modalHeaderBg}
          justifyContent={isRtl ? "flex-start" : "flex-end"}
          px={{ base: 4, md: 6 }}
          py={{ base: 3, md: 4 }}
        >
          <ChakraButton
            onClick={() => {
              handleSelectSound();
              onClose();
            }}
            bg={isLightTheme ? modalBorderColor : "transparent"}
            color={isLightTheme ? modalBg : "#ffffff"}
            borderWidth={isLightTheme ? "3px" : "2px"}
            borderStyle="solid"
            borderColor={modalBorderColor}
            borderRadius="0 !important"
            boxShadow={
              isLightTheme ? "none" : `4px 5px 0 ${buttonShadowColor}`
            }
            fontWeight="900"
            textTransform="uppercase"
            _hover={
              isLightTheme
                ? { opacity: 0.78 }
                : {
                    bg: "rgba(255, 255, 255, 0.1)",
                    transform: "translate(-2px, -2px)",
                    boxShadow: `6px 7px 0 ${buttonHoverShadowColor}`,
                  }
            }
          >
            {translations.close}
          </ChakraButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
