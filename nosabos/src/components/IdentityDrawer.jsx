// src/components/IdentityDrawer.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  Input,
  Link,
  Radio,
  RadioGroup,
  Text,
  VStack,
  useBreakpointValue,
  useToast,
} from "@chakra-ui/react";
import { QRCodeSVG } from "qrcode.react";
import { BsQrCode } from "react-icons/bs";
import { SiCashapp, SiPatreon } from "react-icons/si";
import { IoIosMore } from "react-icons/io";
import { MdOutlineFileUpload } from "react-icons/md";
import { CiSquarePlus } from "react-icons/ci";
import { LuBadgeCheck, LuDoorOpen, LuKeyRound } from "react-icons/lu";
import { RxExternalLink } from "react-icons/rx";
import { LuKey } from "react-icons/lu";
import { FaKey } from "react-icons/fa";
import { doc, updateDoc } from "firebase/firestore";

import { database } from "../firebaseResources/firebaseResources";
import { useNostrWalletStore } from "../hooks/useNostrWalletStore";
import useSoundSettings from "../hooks/useSoundSettings";
import selectSound from "../assets/select.mp3";
import submitActionSound from "../assets/submitaction.mp3";
import { IdentityCard } from "./IdentityCard";
import { BITCOIN_RECIPIENTS } from "../constants/bitcoinRecipients";
import { translations } from "../utils/translation";
import BottomDrawerDragHandle from "./BottomDrawerDragHandle";
import useBottomDrawerSwipeDismiss from "../hooks/useBottomDrawerSwipeDismiss";
import VoiceOrb from "./VoiceOrb";
import { useThemeStore } from "../useThemeStore";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  getLanguageLocale,
  normalizeSupportLanguage,
} from "../constants/languages";

function supportCopy(lang, en, es, it) {
  if (lang === "it") return it || en;
  if (lang === "es") return es || en;
  return en;
}

export function IdentityPanel({
  onClose,
  t,
  appLanguage = "en",
  activeNpub,
  activeNsec,
  auth,
  onSwitchedAccount,
  cefrResult,
  cefrLoading,
  cefrError,
  onRunCefrAnalysis,
  enableWallet = true,
  user,
  onSelectIdentity,
  isIdentitySaving = false,
  postNostrContent,
  showHeader = true,
  showSignOutButton = true,
}) {
  const toast = useToast();
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const panelTheme = useMemo(
    () =>
      isLightTheme
        ? {
            surface: "var(--app-surface)",
            surfaceStrong: "var(--app-surface-elevated)",
            surfaceMuted: "var(--app-surface-muted)",
            border: "var(--app-border)",
            borderStrong: "var(--app-border-strong)",
            textPrimary: "var(--app-text-primary)",
            textSecondary: "var(--app-text-secondary)",
            textMuted: "var(--app-text-muted)",
            accent: "#19736d",
            accentSoft: "#2f8f87",
            divider: "var(--app-border)",
          }
        : {
            surface: "gray.800",
            surfaceStrong: "gray.900",
            surfaceMuted: "gray.700",
            border: "whiteAlpha.200",
            borderStrong: "whiteAlpha.300",
            textPrimary: "gray.100",
            textSecondary: "gray.300",
            textMuted: "gray.400",
            accent: "teal.200",
            accentSoft: "teal.100",
            divider: "gray.700",
          },
    [isLightTheme],
  );

  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const signOutCancelRef = useRef();

  // Display name state
  const [displayName, setDisplayName] = useState("");
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [isSavingDisplayName, setIsSavingDisplayName] = useState(false);
  const lang = normalizeSupportLanguage(appLanguage, DEFAULT_SUPPORT_LANGUAGE);
  const ui = useMemo(() => translations[lang] ?? translations.en, [lang]);

  // Load displayName from localStorage on mount
  useEffect(() => {
    const storedDisplayName = localStorage.getItem("displayName") || "";
    setDisplayName(storedDisplayName);
    setDisplayNameInput(storedDisplayName);
  }, []);

  const handleSaveDisplayName = async () => {
    const trimmed = displayNameInput.trim();
    if (!trimmed) {
      toast({
        title: supportCopy(
          lang,
          "Enter a display name",
          "Ingresa un nombre",
          "Inserisci un nome visualizzato",
        ),
        status: "warning",
        duration: 2000,
      });
      return;
    }

    setIsSavingDisplayName(true);
    try {
      // Post kind 0 (metadata) to Nostr
      if (postNostrContent) {
        const metadata = {
          name: trimmed,
          about: "A student onboarded with Robots Building Education",
        };
        await postNostrContent(JSON.stringify(metadata), 0);
      }

      // Save to localStorage
      localStorage.setItem("displayName", trimmed);
      setDisplayName(trimmed);

      // Save to Firestore
      const id = localStorage.getItem("local_npub");
      if (id) {
        await updateDoc(doc(database, "users", id), {
          displayName: trimmed,
        });
      }

      toast({
        title: supportCopy(
          lang,
          "Display name updated",
          "Nombre actualizado",
          "Nome visualizzato aggiornato",
        ),
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      console.error("Failed to save display name:", error);
      toast({
        title: supportCopy(lang, "Error", "Error", "Errore"),
        description: error?.message || String(error),
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsSavingDisplayName(false);
    }
  };

  // Mirror identity props for display
  const [currentId, setCurrentId] = useState(activeNpub || "");
  const [currentSecret, setCurrentSecret] = useState(activeNsec || "");
  useEffect(() => setCurrentId(activeNpub || ""), [activeNpub]);
  useEffect(() => setCurrentSecret(activeNsec || ""), [activeNsec]);

  const copy = async (text, msg = t?.toast_copied || "Copied") => {
    try {
      await navigator.clipboard.writeText(text || "");
      toast({ title: msg, status: "success", duration: 1400 });
    } catch (e) {
      toast({
        title: t?.toast_copy_failed || "Copy failed",
        description: String(e?.message || e),
        status: "error",
      });
    }
  };

  const handleSignOut = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.clear();
      localStorage.removeItem("local_nsec");
      localStorage.removeItem("local_npub");
      window.location.reload();
    } catch (err) {
      console.error("signOut error:", err);
    } finally {
      window.location.href = "/";
    }
  }, []);

  // Switch account
  const [switchNsec, setSwitchNsec] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);
  const switchAccountWithNsec = async () => {
    const nsec = (switchNsec || "").trim();
    if (!nsec) {
      toast({
        title: t?.toast_paste_nsec || "Paste your nsec",
        status: "warning",
      });
      return;
    }
    if (!nsec.startsWith("nsec")) {
      toast({
        title: t?.toast_invalid_key || "Invalid key",
        description: t?.toast_must_start_nsec || "Key must start with 'nsec'.",
        status: "error",
      });
      return;
    }
    setIsSwitching(true);
    try {
      if (typeof auth !== "function")
        throw new Error("auth(nsec) is not available.");
      const res = await auth(nsec);
      const npub = res?.user?.npub || localStorage.getItem("local_npub");
      if (!npub?.startsWith("npub"))
        throw new Error("Could not derive npub from the secret key.");

      localStorage.setItem("local_npub", npub);
      localStorage.setItem("local_nsec", nsec);

      setCurrentId(npub);
      setCurrentSecret(nsec);
      setSwitchNsec("");

      toast({
        title: t?.toast_switched_account || "Switched account",
        status: "success",
      });

      onClose?.();
      await Promise.resolve(onSwitchedAccount?.(npub, nsec));
      window.location.reload();
    } catch (e) {
      console.error("switchAccount error:", e);
      toast({
        title: t?.toast_switch_failed || "Switch failed",
        description: e?.message || String(e),
        status: "error",
      });
    } finally {
      setIsSwitching(false);
    }
  };

  const cefrTimestamp =
    cefrResult?.updatedAt &&
    new Date(cefrResult.updatedAt).toLocaleString(getLanguageLocale(lang));
  const installSteps = useMemo(
    () => [
      {
        id: "step1",
        icon: <IoIosMore size={28} />,
        text: t?.app_install_step1 || "Open the browser menu.",
      },
      {
        id: "step2",
        icon: <RxExternalLink size={28} />,
        text: t?.app_install_step2 || "Open in browser.",
      },
      {
        id: "step3",
        icon: <MdOutlineFileUpload size={28} />,
        text: t?.app_install_step3 || "Choose 'Share' or 'Install'.",
      },
      {
        id: "step4",
        icon: <CiSquarePlus size={28} />,
        text: t?.app_install_step4 || "Add to home screen.",
      },
      {
        id: "step5",
        icon: <LuBadgeCheck size={28} />,
        text: t?.app_install_step5 || "Launch from your home screen.",
      },
      {
        id: "step6",
        icon: <LuKeyRound size={24} />,
        text: t?.account_final_step_title || "Copy secret key to sign in.",
        subText:
          t?.account_final_step_description ||
          "This key is the only way to access your accounts on Robots Building Education apps. Store it in a password manager or a safe place. We cannot recover it for you.",
        action: (
          <Button
            size="xs"
            padding={4}
            leftIcon={<LuKeyRound size={14} />}
            colorScheme="orange"
            boxShadow="none"
            transform="none"
            _active={{ boxShadow: "none", transform: "none" }}
            onClick={() =>
              copy(currentSecret, t?.toast_secret_copied || "Secret copied")
            }
            isDisabled={!currentSecret}
          >
            {t?.account_copy_secret || "Copy Secret Key"}
          </Button>
        ),
      },
    ],
    [t, copy, currentSecret],
  );

  return (
    <>
      {showHeader ? (
        <DrawerHeader>
          {displayName
            ? supportCopy(
                lang,
                `${displayName}'s Account`,
                `Cuenta de ${displayName}`,
                `Account di ${displayName}`,
              )
            : t?.app_account_title || "Account"}
        </DrawerHeader>
      ) : null}
      <VStack align="stretch" spacing={3} flex={1}>
        {/* Copy ID + Secret Key */}
        <HStack spacing={3} justify="center" flexWrap="wrap">
          <Button
            size="sm"
            onClick={() => copy(currentId, t?.toast_id_copied || "ID copied")}
            isDisabled={!currentId}
            colorScheme="teal"
            px={6}
            py={5}
          >
            {t?.app_copy_id || "Copy User ID"}
          </Button>
          <Button
            size="sm"
            colorScheme="orange"
            onClick={() =>
              copy(currentSecret, t?.toast_secret_copied || "Secret copied")
            }
            isDisabled={!currentSecret}
            px={6}
            py={5}
          >
            {t?.app_copy_secret || "Copy Secret Key"}
          </Button>
        </HStack>

        {/* Patreon Support Link */}
        <Box p={4} bg="gray.800" rounded="lg" maxW="600px" w="100%" mx="auto">
          <HStack spacing={3} align="center">
            <Box
              p={2}
              bg="black"
              rounded="lg"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <SiPatreon size={20} color="white" />
            </Box>
            <VStack align="start" spacing={0} flex={1}>
              <Text fontWeight="semibold" fontSize="sm">
                {supportCopy(
                  lang,
                  "Join us on Patreon",
                  "Apóyanos en Patreon",
                  "Sostienici su Patreon",
                )}
              </Text>
              <Text fontSize="xs" color="gray.400">
                {supportCopy(
                  lang,
                  "Access more education apps and content",
                  "Accede a más apps educativas y contenido",
                  "Accedi a più app educative e contenuti",
                )}
              </Text>
            </VStack>
            <Button
              size="sm"
              bg="black"
              boxShadow="0px 0px 4px gray"
              onClick={() =>
                window.open(
                  "https://www.patreon.com/NotesAndOtherStuff",
                  "_blank",
                )
              }
            >
              {supportCopy(lang, "Join", "Unirse", "Unisciti")}
            </Button>
          </HStack>
        </Box>

        {/* Display Name + Switch Account Accordions */}
        <Accordion
          allowMultiple
          bg="gray.800"
          rounded="md"
          maxW="600px"
          w="100%"
          mx="auto"
        >
          {/* Display Name */}
          <AccordionItem border="none">
            <AccordionButton px={4} py={3}>
              <Flex flex="1" textAlign="left" align="center">
                <Text fontWeight="semibold" fontSize="sm">
                  {displayName
                    ? supportCopy(
                        lang,
                        "Change display name",
                        "Cambiar nombre de usuario",
                        "Cambia nome visualizzato",
                      )
                    : supportCopy(
                        lang,
                        "Create display name",
                        "Crear nombre de usuario",
                        "Crea nome visualizzato",
                      )}
                </Text>
              </Flex>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <Input
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                placeholder={
                  supportCopy(
                    lang,
                    "Enter a display name",
                    "Ingresa tu nombre",
                    "Inserisci un nome visualizzato",
                  )
                }
                bg="gray.700"
                mb={2}
              />
              <HStack justify="flex-end">
                <Button
                  size="sm"
                  colorScheme="teal"
                  onClick={handleSaveDisplayName}
                  isLoading={isSavingDisplayName}
                  loadingText={supportCopy(
                    lang,
                    "Saving…",
                    "Guardando…",
                    "Salvataggio…",
                  )}
                >
                  {supportCopy(lang, "Save", "Guardar", "Salva")}
                </Button>
              </HStack>
            </AccordionPanel>
          </AccordionItem>

          {/* Switch Account */}
        </Accordion>
        <Accordion
          allowMultiple
          bg="gray.800"
          rounded="md"
          maxW="600px"
          w="100%"
          mx="auto"
        >
          <AccordionItem border="none">
            <AccordionButton px={4} py={3}>
              <Flex flex="1" textAlign="left" align="center">
                <Text fontWeight="semibold" fontSize="sm">
                  {t?.app_switch_account || "Switch account"}
                </Text>
              </Flex>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <Text fontSize="xs" opacity={0.75} mb={2}>
                {t?.app_switch_note ||
                  "We'll derive your public key (npub) from the secret and switch safely."}
              </Text>
              <Input
                value={switchNsec}
                onChange={(e) => setSwitchNsec(e.target.value)}
                bg="gray.700"
                placeholder={
                  t?.app_nsec_placeholder || "Paste an nsec key to switch"
                }
              />
              <HStack mt={2} justify="flex-end">
                <Button
                  isLoading={isSwitching}
                  loadingText={t?.app_switching || "Switching…"}
                  onClick={switchAccountWithNsec}
                  colorScheme="teal"
                >
                  {t?.app_switch || "Switch"}
                </Button>
              </HStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>

        {/* Bitcoin Wallet Section (Accordion) */}
        {enableWallet && (
          <Accordion
            allowMultiple
            index={isWalletOpen ? [0] : []}
            onChange={(index) => {
              if (Array.isArray(index)) {
                setIsWalletOpen(index.includes(0));
              } else {
                setIsWalletOpen(index === 0);
              }
            }}
            bg={panelTheme.surface}
            border="1px solid"
            borderColor={panelTheme.border}
            rounded="md"
            maxW="600px"
            w="100%"
            mx="auto"
          >
            <AccordionItem border="none">
              <AccordionButton
                px={4}
                py={3}
                color={panelTheme.textPrimary}
                _hover={{ bg: panelTheme.surfaceMuted }}
                _expanded={{ bg: panelTheme.surfaceMuted }}
              >
                <Flex flex="1" textAlign="left" align="center" gap={3}>
                  <Text fontWeight="semibold">
                    {supportCopy(
                      lang,
                      "Bitcoin wallet",
                      "Billetera Bitcoin",
                      "Portafoglio Bitcoin",
                    )}
                  </Text>
                </Flex>
                <AccordionIcon color={panelTheme.textSecondary} />
              </AccordionButton>
              <AccordionPanel px={0} pb={4} pt={0}>
                <Box
                  bg={panelTheme.surfaceStrong}
                  border="1px solid"
                  borderColor={panelTheme.border}
                  p={3}
                  rounded="md"
                  mx={3}
                  mt={3}
                >
                  <BitcoinWalletSection
                    userLanguage={appLanguage}
                    identity={user?.identity || ""}
                    onSelectIdentity={onSelectIdentity}
                    isIdentitySaving={isIdentitySaving}
                    sectionBg={
                      isLightTheme
                        ? "var(--app-surface-elevated)"
                        : panelTheme.surfaceStrong
                    }
                    visualStyle={isLightTheme ? "paper" : "default"}
                  />
                </Box>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        )}

        {/* Install App Section (Always Visible - NOT an accordion) */}
        <Box display="flex" justifyContent={"center"} mt={6}>
          <Box maxW="600px">
            <Text fontWeight="semibold" mb={3} color={panelTheme.textPrimary}>
              {t?.app_install_title || "Install as app"}
            </Text>
            <Box
              bg={panelTheme.surfaceStrong}
              border="1px solid"
              borderColor={panelTheme.border}
              p={3}
              rounded="md"
            >
              {installSteps.map((step, idx) => (
                <Box key={step.id} py={2}>
                  <Flex
                    align="center"
                    gap={3}
                    justify="space-between"
                    flexWrap="wrap"
                  >
                    <HStack align="center" gap={3}>
                      <Box color={panelTheme.accent}>{step.icon}</Box>
                      <Text fontSize="sm" color={panelTheme.textPrimary}>
                        {step.text}
                      </Text>
                    </HStack>
                    {step.action ? <Box>{step.action}</Box> : null}
                  </Flex>
                  {step.subText ? (
                    <Text
                      fontSize="xs"
                      color={isLightTheme ? panelTheme.textSecondary : panelTheme.accentSoft}
                      mt={2}
                      ml={8}
                      lineHeight="1.65"
                    >
                      {step.subText}
                    </Text>
                  ) : null}
                  {idx < installSteps.length - 1 && (
                    <Divider my={3} borderColor={panelTheme.divider} />
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* CEFR insight - Commented out for future development */}
        {/*
      <Box bg="gray.800" p={3} rounded="md">
        <HStack justify="space-between" align="flex-start" mb={2}>
          <VStack align="flex-start" spacing={0} flex="1">
            <Text fontSize="sm" fontWeight="semibold">
              {t?.app_cefr_heading || "CEFR insight"}
            </Text>
            <Text fontSize="xs" opacity={0.75}>
              {t?.app_cefr_subtitle ||
                "Ask the AI to review your progress and assign a CEFR level."}
            </Text>
          </VStack>
          {cefrResult?.level ? (
            <Badge colorScheme="purple" fontSize="0.75rem">
              {t?.app_cefr_level_label
                ? t.app_cefr_level_label.replace("{level}", cefrResult.level)
                : `Level ${cefrResult.level}`}
            </Badge>
          ) : null}
        </HStack>

        <Text fontSize="sm" whiteSpace="pre-wrap">
          {cefrResult?.explanation
            ? cefrResult.explanation
            : t?.app_cefr_empty ||
              "No analysis yet. Run the evaluator to see your level."}
        </Text>

        {cefrTimestamp ? (
          <Text fontSize="xs" opacity={0.65} mt={2}>
            {t?.app_cefr_updated
              ? t.app_cefr_updated.replace("{timestamp}", cefrTimestamp)
              : `Last analyzed ${cefrTimestamp}`}
          </Text>
        ) : null}

        {cefrError ? (
          <Text fontSize="xs" color="red.300" mt={2}>
            {cefrError}
          </Text>
        ) : null}

        <Button
          mt={3}
          size="sm"
          variant="outline"
          colorScheme="purple"
          onClick={onRunCefrAnalysis}
          isLoading={cefrLoading}
          loadingText={t?.app_cefr_loading || "Analyzing…"}
          isDisabled={cefrLoading}
        >
          {t?.app_cefr_run || "Analyze level"}
        </Button>
      </Box>
      */}
      </VStack>

      {showSignOutButton ? (
        <Flex mt="auto" mb="24px" justify="flex-end">
          <Button
            mt={6}
            leftIcon={<LuDoorOpen size={18} />}
            onClick={() => setIsSignOutOpen(true)}
            padding={6}
            borderRadius="lg"
            variant="outline"
            colorScheme="red"
          >
            {t?.app_sign_out || "Sign out"}
          </Button>
        </Flex>
      ) : null}

      <AlertDialog
        isOpen={isSignOutOpen}
        leastDestructiveRef={signOutCancelRef}
        onClose={() => setIsSignOutOpen(false)}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent
            bg="gray.800"
            borderColor="whiteAlpha.200"
            border="1px solid"
          >
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {t?.app_sign_out_confirm_title || "Sign out?"}
            </AlertDialogHeader>
            <AlertDialogBody>
              {t?.app_sign_out_confirm_body ||
                "Are you sure you want to sign out? Make sure you have your secret key saved before signing out."}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                ref={signOutCancelRef}
                variant="ghost"
                onClick={() => setIsSignOutOpen(false)}
              >
                {t?.common_cancel || "Cancel"}
              </Button>
              <Button colorScheme="red" onClick={handleSignOut} ml={3}>
                {t?.app_sign_out_confirm || "Sign out"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}

export default function IdentityDrawer({ isOpen, onClose, ...panelProps }) {
  const swipeDismiss = useBottomDrawerSwipeDismiss({
    isOpen,
    onClose,
  });

  return (
    <Drawer isOpen={isOpen} placement="bottom" onClose={onClose}>
      <DrawerOverlay {...swipeDismiss.overlayProps} bg="blackAlpha.600" />
      <DrawerContent
        {...swipeDismiss.drawerContentProps}
        bg="gray.900"
        color="gray.100"
        borderTopRadius="24px"
        maxH="85vh"
        display="flex"
        flexDirection="column"
      >
        <BottomDrawerDragHandle isDragging={swipeDismiss.isDragging} />
        <DrawerBody pb={6} display="flex" flexDirection="column" flex={1}>
          <IdentityPanel onClose={onClose} {...panelProps} />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

/* ======================= Wallet sub-section (hydrates on mount) ======================= */
export function BitcoinWalletSection({
  userLanguage = "en",
  identity = "",
  onSelectIdentity,
  isIdentitySaving = false,
  showSectionTitle = true,
  showScholarshipNote = true,
  containerProps = {},
  sectionBg = "gray.900",
  identitySelectorPlacement = "top",
  contentMaxW = null,
  centerContent = false,
  centerContentDesktop = false,
  showIdentitySelector = true,
  compactCardMobile = false,
  compactCardDesktop = false,
  hydrateWalletOnMount = true,
  visualStyle = "default",
}) {
  const toast = useToast();
  const playSound = useSoundSettings((s) => s.playSound);
  const walletLang = normalizeSupportLanguage(
    userLanguage,
    DEFAULT_SUPPORT_LANGUAGE,
  );
  const isPaperStyle = visualStyle === "paper";
  const shouldCenterContent =
    centerContent ||
    (useBreakpointValue({
      base: false,
      md: centerContentDesktop,
    }) ??
      false);
  const cardSizeVariant =
    useBreakpointValue({
      base: compactCardMobile ? "soft" : "default",
      md: compactCardDesktop
        ? "compact"
        : compactCardMobile
          ? "soft"
          : "default",
    }) ?? "default";
  const cardMaxWidth =
    cardSizeVariant === "compact"
      ? "260px"
      : cardSizeVariant === "soft"
        ? "256px"
        : "400px";
  const qrCodeSize =
    useBreakpointValue({
      base: compactCardMobile ? 140 : 184,
      md: compactCardDesktop ? 136 : compactCardMobile ? 156 : 192,
    }) ?? 184;
  const walletTheme = useMemo(
    () =>
      isPaperStyle
        ? {
            text: "#362311",
            mutedText: "#6f5130",
            surface: "#f6ecda",
            elevatedSurface: "#fff9ed",
            note: "#9b5f17",
            link: "#0f766e",
            warning: "#9a6700",
            border: "#d8bb91",
            borderHover: "#c99953",
            buttonBg: "#fff8ec",
            buttonHoverBg: "#f4e4c9",
            buttonActiveBg: "#ecd5ac",
            inputBg: "#fff9ef",
            inputBorder: "#d6b98d",
            inputFocus: "#c7821e",
            radioScheme: "orange",
          }
        : {
            text: "gray.100",
            mutedText: "gray.300",
            surface: "gray.800",
            elevatedSurface: "gray.700",
            note: "teal.100",
            link: "teal.200",
            warning: "orange.200",
            border: "whiteAlpha.400",
            borderHover: "whiteAlpha.500",
            buttonBg: "transparent",
            buttonHoverBg: "whiteAlpha.100",
            buttonActiveBg: "whiteAlpha.200",
            inputBg: "gray.800",
            inputBorder: "gray.600",
            inputFocus: "orange.400",
            radioScheme: "purple",
          },
    [isPaperStyle],
  );
  const outlineButtonStyles = useMemo(
    () => ({
      variant: "outline",
      bg: walletTheme.buttonBg,
      borderColor: walletTheme.border,
      color: walletTheme.text,
      boxShadow: "none",
      transform: "none",
      _hover: {
        bg: walletTheme.buttonHoverBg,
        borderColor: walletTheme.borderHover,
      },
      _active: {
        bg: walletTheme.buttonActiveBg,
        boxShadow: "none",
        transform: "none",
      },
      _focus: {
        boxShadow: "none",
      },
      _focusVisible: {
        boxShadow: "none",
      },
    }),
    [walletTheme],
  );

  // Select each field independently (avoid new-object snapshots)
  const cashuWallet = useNostrWalletStore((s) => s.cashuWallet);
  const walletBalance = useNostrWalletStore((s) => s.walletBalance);
  const createNewWallet = useNostrWalletStore((s) => s.createNewWallet);
  const initiateDeposit = useNostrWalletStore((s) => s.initiateDeposit);
  const invoice = useNostrWalletStore((s) => s.invoice);
  const isCreatingWallet = useNostrWalletStore((s) => s.isCreatingWallet);
  const errorMessage = useNostrWalletStore((s) => s.errorMessage);

  // → New: hydrate on mount so refresh picks up your existing wallet
  const init = useNostrWalletStore((s) => s.init);
  const initWallet = useNostrWalletStore((s) => s.initWallet);
  // const initWalletService = useNostrWalletStore((s) => s.initWalletService);

  const [hydrating, setHydrating] = useState(true);
  const [selectedIdentity, setSelectedIdentity] = useState(identity || "");
  const [noWalletFound, setNoWalletFound] = useState(false);
  const [nsecForWallet, setNsecForWallet] = useState("");

  // Detect if user is logged in via NIP-07 extension
  const isNip07Mode =
    typeof window !== "undefined" &&
    localStorage.getItem("nip07_signer") === "true";

  useEffect(() => {
    if (!hydrateWalletOnMount) {
      setHydrating(false);
      return undefined;
    }

    let alive = true;
    (async () => {
      try {
        const connected = await init();
        if (connected) {
          const wallet = await initWallet();
          // Track if no wallet was found (initWallet returns null when no wallet events exist)
          if (alive && !wallet) {
            setNoWalletFound(true);
          }
        }
      } catch (e) {
        console.warn("Wallet hydrate failed:", e);
      } finally {
        if (alive) setHydrating(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [hydrateWalletOnMount, init, initWallet]);

  useEffect(() => {
    setSelectedIdentity(identity || "");
  }, [identity]);

  const effectiveSelectedIdentity =
    showIdentitySelector ? selectedIdentity : identity || selectedIdentity;

  // walletBalance is now a clean number from the store
  const totalBalance = useMemo(() => {
    const numeric = Number(walletBalance);
    return Number.isFinite(numeric) ? numeric : 0;
  }, [walletBalance]);

  const W = (key) => {
    const es = {
      createWallet: "Crear billetera",
      loadingWallet: "Creando billetera…",
      deposit: "Depositar",
      loadingAddress: "Generando dirección…",
      or: "o",
      copyAddress: "Copiar dirección",
      ps: "Usa una billetera Lightning compatible para pagar la factura.",
      activeWalletTitle: "Tu billetera está activa",
      verifyTransactions: "Verifica tus transacciones",
      generateNew: "Generar nuevo QR",
      balanceLabel: "Saldo",
      cardNameLabel: "Billetera",
      scholarshipNote:
        "Tus depósitos ayudan a crear becas con aprendizaje con ",
      nip07NsecTitle: "Se requiere clave secreta",
      nip07NsecDescription:
        "Iniciaste sesión con una extensión de navegador, así que no tenemos acceso a tu clave privada. Para crear una billetera, ingresa tu nsec abajo.",
      nip07NsecPlaceholder: "Ingresa tu nsec1...",
      nip07NsecWarning:
        "Tu clave solo se usa para crear la billetera y no se almacena.",
    };
    const en = {
      createWallet: "Create wallet",
      loadingWallet: "Creating wallet…",
      deposit: "Deposit",
      loadingAddress: "Generating address…",
      or: "or",
      copyAddress: "Copy address",
      ps: "Use a compatible Lightning wallet to pay the invoice.",
      activeWalletTitle: "Your wallet is active",
      verifyTransactions: "Verify your transactions",
      generateNew: "Generate New Address",
      balanceLabel: "Balance",
      cardNameLabel: "Wallet",
      scholarshipNote:
        "Your deposits help us create scholarships with learning with ",
      nip07NsecTitle: "Secret key required",
      nip07NsecDescription:
        "You signed in with a browser extension, so we don't have access to your private key. To create a wallet, enter your nsec below.",
      nip07NsecPlaceholder: "Enter your nsec1...",
      nip07NsecWarning:
        "Your key is only used to create the wallet and is not stored.",
    };
    const it = {
      createWallet: "Crea portafoglio",
      loadingWallet: "Creazione portafoglio…",
      deposit: "Deposita",
      loadingAddress: "Generazione indirizzo…",
      or: "o",
      copyAddress: "Copia indirizzo",
      ps: "Usa un portafoglio Lightning compatibile per pagare la fattura.",
      activeWalletTitle: "Il tuo portafoglio è attivo",
      verifyTransactions: "Verifica le transazioni",
      generateNew: "Genera nuovo QR",
      balanceLabel: "Saldo",
      cardNameLabel: "Portafoglio",
      scholarshipNote:
        "I tuoi depositi ci aiutano a creare borse di studio con l'apprendimento con ",
      nip07NsecTitle: "Chiave segreta richiesta",
      nip07NsecDescription:
        "Hai effettuato l'accesso con un'estensione del browser, quindi non abbiamo accesso alla tua chiave privata. Per creare un portafoglio, inserisci il tuo nsec qui sotto.",
      nip07NsecPlaceholder: "Inserisci il tuo nsec1...",
      nip07NsecWarning:
        "La tua chiave viene usata solo per creare il portafoglio e non viene salvata.",
    };
    return (walletLang === "it" ? it : walletLang === "es" ? es : en)[key] ?? key;
  };

  const ensureWalletConnection = useCallback(async () => {
    const store = useNostrWalletStore.getState();
    if (store?.ndkInstance && store?.signer) {
      return true;
    }

    const connected = await init();
    if (connected) {
      return true;
    }

    toast({
      title: supportCopy(
        walletLang,
        "Wallet not ready",
        "Billetera no lista",
        "Portafoglio non pronto",
      ),
      description: supportCopy(
        walletLang,
        "Please try again in a moment.",
        "Intenta de nuevo en un momento.",
        "Riprova tra poco.",
      ),
      status: "error",
      duration: 2500,
      isClosable: true,
    });
    return false;
  }, [init, toast, walletLang]);

  const handleCreateWallet = async () => {
    playSound(submitActionSound);

    // If NIP-07 mode and no nsec provided, show error
    if (isNip07Mode && noWalletFound && !nsecForWallet.trim()) {
      toast({
        title: supportCopy(
          walletLang,
          "Secret key required",
          "Se requiere clave secreta",
          "Chiave segreta richiesta",
        ),
        description: supportCopy(
          walletLang,
          "Enter your nsec to create the wallet.",
          "Ingresa tu nsec para crear la billetera.",
          "Inserisci il tuo nsec per creare il portafoglio.",
        ),
        status: "warning",
        duration: 2500,
      });
      return;
    }

    // Validate nsec format if provided
    if (nsecForWallet.trim() && !nsecForWallet.trim().startsWith("nsec")) {
      toast({
        title: supportCopy(walletLang, "Invalid key", "Clave inválida", "Chiave non valida"),
        description: supportCopy(
          walletLang,
          "Key must start with 'nsec'.",
          "La clave debe empezar con 'nsec'.",
          "La chiave deve iniziare con 'nsec'.",
        ),
        status: "error",
        duration: 2500,
      });
      return;
    }

    try {
      if (!(await ensureWalletConnection())) return;

      const id = localStorage.getItem("local_npub");
      if (id)
        await updateDoc(doc(database, "users", id), { createdWallet: true });

      // Pass the nsec to createNewWallet if we're in NIP-07 mode
      const nsecToUse =
        isNip07Mode && nsecForWallet.trim() ? nsecForWallet.trim() : null;
      const wallet = await createNewWallet(nsecToUse);
      if (!wallet) {
        const latestError = useNostrWalletStore.getState().errorMessage;
        toast({
          title: supportCopy(
            walletLang,
            "Couldn't create wallet",
            "No se pudo crear",
            "Impossibile creare il portafoglio",
          ),
          description:
            latestError ||
            errorMessage ||
            supportCopy(
              walletLang,
              "Please try again in a moment.",
              "Intenta de nuevo en un momento.",
              "Riprova tra poco.",
            ),
          status: "error",
          duration: 2800,
          isClosable: true,
        });
        return;
      }

      // Clear the nsec input after successful wallet creation
      setNsecForWallet("");
      setNoWalletFound(false);
    } catch (err) {
      console.error("Error creating wallet:", err);
      toast({
        title: supportCopy(walletLang, "Error", "Error", "Errore"),
        description: supportCopy(
          walletLang,
          "Failed to create wallet",
          "No se pudo crear la billetera",
          "Creazione del portafoglio non riuscita",
        ),
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const ensureIdentitySelected = () => {
    if (!effectiveSelectedIdentity) {
      const title =
        supportCopy(
          walletLang,
          "Select an identity",
          "Selecciona una identidad",
          "Seleziona un'identità",
        );
      const description =
        supportCopy(
          walletLang,
          "Choose who receives your deposits before continuing.",
          "Elige un destinatario para tus depósitos.",
          "Scegli chi riceve i tuoi depositi prima di continuare.",
        );
      toast({
        title,
        description,
        status: "info",
        duration: 2200,
      });
      return false;
    }
    return true;
  };

  const handleInitiateDeposit = async () => {
    playSound(submitActionSound);
    if (!ensureIdentitySelected()) return;
    try {
      const paymentRequest = await initiateDeposit(100); // example amount
      if (!paymentRequest) {
        const latestError = useNostrWalletStore.getState().errorMessage;
        toast({
          title: supportCopy(
            walletLang,
            "Couldn't create invoice",
            "No se pudo crear",
            "Impossibile creare la fattura",
          ),
          description:
            latestError ||
            errorMessage ||
            supportCopy(
              walletLang,
              "Please try again in a moment.",
              "Intenta de nuevo en un momento.",
              "Riprova tra poco.",
            ),
          status: "error",
          duration: 2800,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error("Error initiating deposit:", err);
      toast({
        title: supportCopy(walletLang, "Error", "Error", "Errore"),
        description: supportCopy(
          walletLang,
          "Failed to initiate deposit",
          "No se pudo iniciar el depósito",
          "Avvio del deposito non riuscito",
        ),
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const generateNewQR = async () => {
    playSound(submitActionSound);
    if (!ensureIdentitySelected()) return;
    try {
      const paymentRequest = await initiateDeposit(100);
      if (!paymentRequest) {
        const latestError = useNostrWalletStore.getState().errorMessage;
        toast({
          title: supportCopy(
            walletLang,
            "Couldn't create invoice",
            "No se pudo crear",
            "Impossibile creare la fattura",
          ),
          description:
            latestError ||
            errorMessage ||
            supportCopy(
              walletLang,
              "Please try again in a moment.",
              "Intenta de nuevo en un momento.",
              "Riprova tra poco.",
            ),
          status: "error",
          duration: 2800,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error("Error initiating deposit:", err);
      toast({
        title: supportCopy(walletLang, "Error", "Error", "Errore"),
        description: supportCopy(
          walletLang,
          "Failed to initiate deposit",
          "No se pudo iniciar el depósito",
          "Avvio del deposito non riuscito",
        ),
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleCopyInvoice = async () => {
    playSound(selectSound);
    try {
      await navigator.clipboard.writeText(invoice || "");
      toast({
        title: supportCopy(
          walletLang,
          "Address copied",
          "Dirección copiada",
          "Indirizzo copiato",
        ),
        description: supportCopy(
          walletLang,
          "Lightning invoice copied to clipboard.",
          "La factura Lightning se copió al portapapeles.",
          "Fattura Lightning copiata negli appunti.",
        ),
        status: "warning",
        duration: 1500,
        isClosable: true,
        position: "top",
      });
    } catch {}
  };

  const handleIdentitySelect = (nextIdentity) => {
    playSound(selectSound);
    if (!nextIdentity || nextIdentity === selectedIdentity) {
      setSelectedIdentity(nextIdentity || "");
      return;
    }

    setSelectedIdentity(nextIdentity);
    onSelectIdentity?.(nextIdentity);
  };

  const identitySelector = (
    <Box
      bg={sectionBg}
      p={3}
      rounded="md"
      mb={3}
      w={shouldCenterContent ? "fit-content" : "100%"}
      maxW="100%"
      mx={shouldCenterContent ? "auto" : undefined}
    >
      <Text
        fontSize="sm"
        mb={2}
        textAlign={shouldCenterContent ? "center" : "left"}
        color={walletTheme.text}
      >
        {supportCopy(
          walletLang,
          "Choose a recipient",
          "Elige a quién apoyar con tus depósitos:",
          "Scegli un destinatario",
        )}
      </Text>
      <RadioGroup
        value={selectedIdentity}
        onChange={handleIdentitySelect}
        isDisabled={isIdentitySaving}
      >
        <VStack
          align="start"
          spacing={2}
          width={shouldCenterContent ? "fit-content" : "100%"}
          mx={shouldCenterContent ? "auto" : undefined}
        >
          {BITCOIN_RECIPIENTS.map((recipient) => {
            const isSelected = selectedIdentity === recipient.npub;
            return (
              <HStack key={recipient.npub} align="center" spacing={3}>
                <Radio
                  colorScheme={walletTheme.radioScheme}
                  value={recipient.npub}
                  isDisabled={isIdentitySaving}
                  size="sm"
                  sx={{
                    ".chakra-radio__label": {
                      fontSize: "sm",
                    },
                  }}
                >
                  {recipient.label}
                </Radio>
                {isSelected && recipient.identityUrl ? (
                  <Link
                    href={recipient.identityUrl}
                    isExternal
                    fontSize="xs"
                    color={walletTheme.link}
                    lineHeight="1"
                  >
                    {supportCopy(walletLang, "View site", "Ver sitio", "Vedi sito")}
                  </Link>
                ) : null}
              </HStack>
            );
          })}
        </VStack>
      </RadioGroup>
      {!selectedIdentity && (
        <Text
          fontSize="xs"
          mt={2}
          color={walletTheme.warning}
          textAlign={shouldCenterContent ? "center" : "left"}
        >
          {supportCopy(
            walletLang,
            "Select an option to enable deposits.",
            "Selecciona una opción para habilitar los depósitos.",
            "Seleziona un'opzione per abilitare i depositi.",
          )}
        </Text>
      )}
    </Box>
  );

  // ---------- Renders ----------
  return (
    <Box
      bg={walletTheme.surface}
      color={walletTheme.text}
      rounded="md"
      p={3}
      mx={1}
      w="100%"
      maxW={contentMaxW || undefined}
      display="flex"
      flexDirection="column"
      alignItems="stretch"
      {...containerProps}
    >
      {showSectionTitle ? (
        <Text mb={2} fontSize="sm" fontWeight="bold">
          {supportCopy(
            walletLang,
            "Bitcoin wallet",
            "Billetera Bitcoin",
            "Portafoglio Bitcoin",
          )}
        </Text>
      ) : null}

      {showScholarshipNote ? (
        <Text fontSize="xs" color={walletTheme.note} mb={3}>
          {W("scholarshipNote")}{" "}
          <Link
            href="https://robotsbuildingeducation.com"
            isExternal
            textDecoration="underline"
          >
            RobotsBuildingEducation.com
          </Link>
        </Text>
      ) : null}

      {showIdentitySelector && identitySelectorPlacement !== "bottom"
        ? identitySelector
        : null}

      {/* Loading/hydration spinner (only after refresh / first mount) */}
      {hydrating && !cashuWallet && (
        <HStack
          py={6}
          spacing={3}
          justify="center"
          align="center"
          width="fit-content"
          mx="auto"
        >
          <VoiceOrb state="listening" size={24} centered={false} />
          <Text fontSize="sm" lineHeight="1">
            {supportCopy(
              walletLang,
              "Loading wallet…",
              "Cargando billetera…",
              "Caricamento portafoglio…",
            )}
          </Text>
        </HStack>
      )}

      {/* 1) No wallet yet → show create wallet UI */}
      {!cashuWallet && !hydrating && (
        <Box>
          {/* NIP-07 users need to provide their nsec for wallet creation */}
          {isNip07Mode && noWalletFound && (
            <Box bg={walletTheme.elevatedSurface} p={3} rounded="md" mb={3}>
              <HStack mb={2}>
                <FaKey color="#f08e19" />
                <Text fontSize="sm" fontWeight="semibold">
                  {W("nip07NsecTitle")}
                </Text>
              </HStack>
              <Text fontSize="xs" color={walletTheme.mutedText} mb={3}>
                {W("nip07NsecDescription")}
              </Text>
              <Input
                type="password"
                value={nsecForWallet}
                onChange={(e) => setNsecForWallet(e.target.value)}
                placeholder={W("nip07NsecPlaceholder")}
                bg={walletTheme.inputBg}
                borderColor={walletTheme.inputBorder}
                color={walletTheme.text}
                _placeholder={{ color: walletTheme.mutedText }}
                _focus={{ borderColor: walletTheme.inputFocus }}
                mb={2}
              />
              <Text fontSize="xs" color={walletTheme.warning}>
                {W("nip07NsecWarning")}
              </Text>
            </Box>
          )}
          <Box display="flex" justifyContent="center" width="100%">
            <Button
              onClick={handleCreateWallet}
              isLoading={isCreatingWallet}
              loadingText={W("loadingWallet")}
              isDisabled={isNip07Mode && noWalletFound && !nsecForWallet.trim()}
              minW="160px"
              {...outlineButtonStyles}
            >
              {W("createWallet")}
            </Button>
          </Box>
        </Box>
      )}

      {/* 2) Wallet exists, balance > 0 → show card */}
      {cashuWallet && totalBalance > 0 && (
        <>
          <Box width="100%" maxW={cardMaxWidth} mx="auto">
            <IdentityCard
              number={cashuWallet.walletId}
              name={
                <div>
                  {W("balanceLabel")}:{" "}
                  <span
                    style={{ display: "inline-block", marginRight: "0.08em" }}
                  >
                    ₿
                  </span>
                  {totalBalance || 0}
                </div>
              }
              theme="nostr"
              animateOnChange={false}
              realValue={cashuWallet.walletId}
              totalBalance={totalBalance || 0}
              sizeVariant={cardSizeVariant}
            />
          </Box>
          <Link
            href="https://nutlife.lol"
            target="_blank"
            textDecoration="underline"
            fontSize="sm"
            color={walletTheme.link}
            textAlign="center"
            mx="auto"
            mt={2}
          >
            {W("verifyTransactions")}
          </Link>
        </>
      )}

      {/* 3) Wallet exists, no balance yet */}
      {cashuWallet && totalBalance <= 0 && (
        <>
          {!invoice && (
            <Box
              display="flex"
              flexDirection={"column"}
              alignItems={"center"}
              width="100%"
              maxW={cardMaxWidth}
              mx="auto"
            >
              <IdentityCard
                number={cashuWallet.walletId}
                name={
                  <div>
                    {W("balanceLabel")}:{" "}
                    <span
                      style={{ display: "inline-block", marginRight: "0.08em" }}
                    >
                      ₿
                    </span>
                    {totalBalance || 0}
                  </div>
                }
                theme="BTC"
                animateOnChange={false}
                realValue={cashuWallet.walletId}
                totalBalance={totalBalance || 0}
                sizeVariant={cardSizeVariant}
              />
              <Button
                mt={3}
                onClick={handleInitiateDeposit}
                isDisabled={!effectiveSelectedIdentity || isIdentitySaving}
                width="100%"
                maxWidth={cardMaxWidth}
                py={5}
                px={6}
                {...outlineButtonStyles}
              >
                {W("deposit")}
              </Button>
            </Box>
          )}

          {invoice && (
            <VStack
              mt={2}
              spacing={3}
              width="100%"
              maxW={cardMaxWidth}
              mx="auto"
            >
              <QRCodeSVG
                value={invoice}
                size={qrCodeSize}
                style={{ zIndex: 10 }}
              />
              <HStack spacing={3} justify="center" flexWrap="wrap" width="100%">
                <Text fontSize="sm">{W("or")}</Text>
                <Button
                  onClick={handleCopyInvoice}
                  size="sm"
                  leftIcon={<LuKeyRound size={14} />}
                  whiteSpace="nowrap"
                  {...outlineButtonStyles}
                >
                  {W("copyAddress")}
                </Button>
              </HStack>
              <Text
                fontSize="sm"
                color={walletTheme.mutedText}
                opacity={0.9}
                textAlign={"center"}
              >
                {W("ps")}
                <br />

                <Link
                  href="https://click.cash.app/ui6m/home2022"
                  isExternal
                  color={walletTheme.link}
                  display="inline-flex" // Ensures icon and text stay inline
                  alignItems="center" // Aligns icon and text vertically
                  gap="4px" // Optional: small space between icon and text
                  lineHeight={"0px"}
                  ml="-1.5"
                  textDecoration={"underline"}
                >
                  <SiCashapp color={isPaperStyle ? "#0f766e" : "white"} />
                  <Text>Cash App</Text>
                </Link>
              </Text>
              <Button
                mt={2}
                onClick={generateNewQR}
                isDisabled={!effectiveSelectedIdentity || isIdentitySaving}
                leftIcon={<BsQrCode />}
                {...outlineButtonStyles}
              >
                {W("generateNew")}
              </Button>
            </VStack>
          )}
        </>
      )}

      {showIdentitySelector && identitySelectorPlacement === "bottom"
        ? identitySelector
        : null}
    </Box>
  );
}
