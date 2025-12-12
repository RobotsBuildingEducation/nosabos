// src/components/IdentityDrawer.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  ButtonGroup,
  Center,
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
  InputGroup,
  InputRightElement,
  Link,
  Radio,
  RadioGroup,
  Spinner,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { QRCodeSVG } from "qrcode.react";
import { BsQrCode } from "react-icons/bs";
import { SiCashapp } from "react-icons/si";
import { IoIosMore } from "react-icons/io";
import { MdOutlineFileUpload } from "react-icons/md";
import { CiSquarePlus } from "react-icons/ci";
import { LuBadgeCheck } from "react-icons/lu";
import { doc, updateDoc } from "firebase/firestore";

import { database } from "../firebaseResources/firebaseResources";
import { useNostrWalletStore } from "../hooks/useNostrWalletStore";
import { IdentityCard } from "./IdentityCard";
import { BITCOIN_RECIPIENTS } from "../constants/bitcoinRecipients";
import { translations } from "../utils/translation";

export default function IdentityDrawer({
  isOpen,
  onClose,
  t,
  appLanguage = "en",
  onSelectLanguage,
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
}) {
  const toast = useToast();

  const rerunWallet = useNostrWalletStore((s) => s.rerunWallet);
  const [reloadScheduled, setReloadScheduled] = useState(false);

  const lang = appLanguage === "es" ? "es" : "en";
  const ui = useMemo(() => translations[lang] || translations.en, [lang]);
  const reloadNote =
    ui.bitcoin_modal_reload_note ||
    (lang === "es"
      ? "Cuando tu depósito se confirme, recargaremos la app para actualizar tu saldo."
      : "Once your deposit is confirmed we'll reload the app to update your balance.");
  const successMessage =
    ui.bitcoin_modal_success ||
    (lang === "es"
      ? "¡Depósito recibido! Recargando para actualizar tu saldo…"
      : "Deposit received! Reloading to refresh your balance…");

  useEffect(() => {
    if (!isOpen || !enableWallet) {
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
  }, [rerunWallet, isOpen, enableWallet, reloadScheduled]);

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
    new Date(cefrResult.updatedAt).toLocaleString(
      appLanguage === "es" ? "es" : "en-US"
    );
  const installSteps = useMemo(
    () => [
      {
        id: "step1",
        icon: <IoIosMore size={28} />,
        text: t?.app_install_step1 || "Open the browser menu.",
      },
      {
        id: "step2",
        icon: <MdOutlineFileUpload size={28} />,
        text: t?.app_install_step2 || "Choose 'Share' or 'Install'.",
      },
      {
        id: "step3",
        icon: <CiSquarePlus size={28} />,
        text: t?.app_install_step3 || "Add to Home Screen.",
      },
      {
        id: "step4",
        icon: <LuBadgeCheck size={28} />,
        text: t?.app_install_step4 || "Launch from your Home Screen.",
      },
    ],
    [t]
  );

  return (
    <Drawer
      isOpen={isOpen}
      placement="bottom"
      onClose={reloadScheduled ? () => {} : onClose}
      closeOnEsc={!reloadScheduled}
      closeOnOverlayClick={!reloadScheduled}
    >
      <DrawerOverlay bg="blackAlpha.600" />
      <DrawerContent
        bg="gray.900"
        color="gray.100"
        borderTopRadius="24px"
        maxH="100vh"
        sx={{
          "@supports (height: 100dvh)": {
            maxHeight: "100dvh",
          },
        }}
      >
        <DrawerCloseButton
          color="gray.400"
          _hover={{ color: "gray.200" }}
          top={4}
          right={4}
        />
        <DrawerHeader pb={2} pr={12}>
          {t?.app_account_title || "Account"}
        </DrawerHeader>
        <DrawerBody pb={6}>
          <VStack align="stretch" spacing={3}>
            {/* Top HStack with Copy ID, Secret Key, and Language Switch */}
            <HStack spacing={2} align="flex-start" flexWrap="wrap">
              {/* Copy ID Button */}
              <Button
                size="sm"
                onClick={() =>
                  copy(currentId, t?.toast_id_copied || "ID copied")
                }
                isDisabled={!currentId}
                colorScheme="teal"
              >
                {t?.app_copy_id || "Copy User ID"}
              </Button>

              {/* Copy Secret Key Button */}
              <Button
                size="sm"
                colorScheme="orange"
                onClick={() =>
                  copy(currentSecret, t?.toast_secret_copied || "Secret copied")
                }
                isDisabled={!currentSecret}
              >
                {t?.app_copy_secret || "Copy Secret Key"}
              </Button>

              {/* Language Switcher */}
              <ButtonGroup
                size="sm"
                isAttached
                variant="outline"
                borderRadius="md"
                bg="rgba(255, 255, 255, 0.04)"
                border="1px solid"
                borderColor="gray.700"
                width="fit-content"
              >
                <Button
                  onClick={() => onSelectLanguage?.("en")}
                  variant={appLanguage === "en" ? "solid" : "ghost"}
                  colorScheme="teal"
                  fontSize="sm"
                  fontWeight="bold"
                  aria-label={t?.language_en || t?.app_language_en || "English"}
                >
                  EN
                </Button>
                <Button
                  onClick={() => onSelectLanguage?.("es")}
                  variant={appLanguage === "es" ? "solid" : "ghost"}
                  colorScheme="teal"
                  fontSize="sm"
                  fontWeight="bold"
                  aria-label={t?.language_es || t?.app_language_es || "Spanish"}
                >
                  ES
                </Button>
              </ButtonGroup>
            </HStack>

            {/* Switch account */}
            <Box bg="gray.800" p={3} rounded="md">
              <Text fontSize="sm" mb={2}>
                {t?.app_switch_account || "Switch account"}
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
              <Text fontSize="xs" opacity={0.75} mt={1}>
                {t?.app_switch_note ||
                  "We'll derive your public key (npub) from the secret and switch safely."}
              </Text>
            </Box>

            <Accordion allowToggle reduceMotion>
              {/* Install as App Accordion */}
              <AccordionItem border="none">
                <AccordionButton
                  bg="gray.800"
                  _hover={{ bg: "gray.700" }}
                  rounded="md"
                  px={4}
                  py={3}
                  w="fit-content"
                  alignSelf="flex-start"
                  minW={0}
                  gap={2}
                  border="2px solid"
                  borderColor="cyan.400"
                >
                  <Text fontWeight="semibold">
                    {t?.app_install_title || "Install as app"}
                  </Text>
                  <AccordionIcon flexShrink={0} />
                </AccordionButton>
                <AccordionPanel
                  bg="gray.900"
                  border="1px solid"
                  borderColor="gray.800"
                  rounded="md"
                  mt={2}
                  px={4}
                  py={3}
                >
                  {installSteps.map((step, idx) => (
                    <Box key={step.id} py={2}>
                      <Flex align="center" gap={3}>
                        <Box color="teal.200">{step.icon}</Box>
                        <Text fontSize="sm">{step.text}</Text>
                      </Flex>
                      {idx < installSteps.length - 1 && (
                        <Divider my={3} borderColor="gray.700" />
                      )}
                    </Box>
                  ))}
                </AccordionPanel>
              </AccordionItem>

              {/* Bitcoin Wallet Accordion */}
              {enableWallet && (
                <AccordionItem border="none" mt={3}>
                  <AccordionButton
                    bg="gray.800"
                    _hover={{ bg: "gray.700" }}
                    rounded="md"
                    px={4}
                    py={3}
                    w="fit-content"
                    alignSelf="flex-start"
                    minW={0}
                    gap={2}
                    border="2px solid"
                    borderColor="orange.400"
                  >
                    <Text fontWeight="semibold">
                      {appLanguage === "es"
                        ? "Billetera Bitcoin (experimental)"
                        : "Bitcoin wallet (experimental)"}
                    </Text>
                    <AccordionIcon flexShrink={0} />
                  </AccordionButton>
                  <AccordionPanel
                    bg="gray.900"
                    border="1px solid"
                    borderColor="gray.800"
                    rounded="md"
                    mt={2}
                    px={4}
                    py={3}
                  >
                    <BitcoinWalletSection
                      userLanguage={appLanguage}
                      identity={user?.identity || ""}
                      onSelectIdentity={onSelectIdentity}
                      isIdentitySaving={isIdentitySaving}
                    />

                    <Box bg="gray.800" p={3} rounded="md" mt={3}>
                      <Text fontSize="xs" opacity={0.8}>
                        {reloadNote}
                      </Text>
                    </Box>

                    {reloadScheduled && (
                      <Alert
                        status="success"
                        variant="left-accent"
                        bg="green.900"
                        color="green.100"
                        mt={3}
                      >
                        <AlertIcon />
                        <AlertDescription fontSize="sm">
                          {successMessage}
                        </AlertDescription>
                      </Alert>
                    )}
                  </AccordionPanel>
                </AccordionItem>
              )}
            </Accordion>

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
                      ? t.app_cefr_level_label.replace(
                          "{level}",
                          cefrResult.level
                        )
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
}) {
  const toast = useToast();

  // Select each field independently (avoid new-object snapshots)
  const cashuWallet = useNostrWalletStore((s) => s.cashuWallet);
  const walletBalance = useNostrWalletStore((s) => s.walletBalance);
  const createNewWallet = useNostrWalletStore((s) => s.createNewWallet);
  const initiateDeposit = useNostrWalletStore((s) => s.initiateDeposit);
  const invoice = useNostrWalletStore((s) => s.invoice);
  const isCreatingWallet = useNostrWalletStore((s) => s.isCreatingWallet);

  // → New: hydrate on mount so refresh picks up your existing wallet
  const init = useNostrWalletStore((s) => s.init);
  const initWalletService = useNostrWalletStore((s) => s.initWalletService);

  const [hydrating, setHydrating] = useState(true);
  const [selectedIdentity, setSelectedIdentity] = useState(identity || "");
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await init(); // reconnect to Nostr using stored keys
        await initWalletService(); // scan relays, attach listeners, emit wallet:default
      } catch (e) {
        console.warn("Wallet hydrate failed:", e);
      } finally {
        if (alive) setHydrating(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [init, initWalletService]);

  useEffect(() => {
    setSelectedIdentity(identity || "");
  }, [identity]);

  const totalBalance = useMemo(
    () =>
      (walletBalance || [])?.reduce(
        (sum, b) => sum + (Number(b?.amount) || 0),
        0
      ) || 0,
    [walletBalance]
  );

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
      activeWalletBody:
        "Tu saldo aparece abajo. Puedes usarlo dentro de la app.",
      activeWalletLink: "Conoce más",
      generateNew: "Generar nuevo QR",
      balanceLabel: "Saldo",
      cardNameLabel: "Billetera",
      scholarshipNote:
        "Tus depósitos ayudan a crear becas con aprendizaje con ",
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
      activeWalletBody: "Your balance is below. You can use it inside the app.",
      activeWalletLink: "Learn more",
      generateNew: "Generate New Address",
      balanceLabel: "Balance",
      cardNameLabel: "Wallet",
      scholarshipNote:
        "Your deposits help us create scholarships with learning with ",
    };
    return (userLanguage === "es" ? es : en)[key] ?? key;
  };

  const handleCreateWallet = async () => {
    try {
      const id = localStorage.getItem("local_npub");
      if (id)
        await updateDoc(doc(database, "users", id), { createdWallet: true });
      await createNewWallet();
    } catch (err) {
      console.error("Error creating wallet:", err);
      toast({
        title: "Error",
        description: "Failed to create wallet",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const ensureIdentitySelected = () => {
    if (!selectedIdentity) {
      const title =
        userLanguage === "es"
          ? "Selecciona una identidad"
          : "Select an identity";
      const description =
        userLanguage === "es"
          ? "Elige un destinatario para tus depósitos."
          : "Choose who receives your deposits before continuing.";
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
    if (!ensureIdentitySelected()) return;
    try {
      await initiateDeposit(100); // example amount
    } catch (err) {
      console.error("Error initiating deposit:", err);
      toast({
        title: "Error",
        description: "Failed to initiate deposit",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const generateNewQR = async () => {
    if (!ensureIdentitySelected()) return;
    try {
      await initiateDeposit(100);
    } catch (err) {
      console.error("Error initiating deposit:", err);
      toast({
        title: "Error",
        description: "Failed to initiate deposit",
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
        title: userLanguage === "es" ? "Dirección copiada" : "Address copied",
        description:
          userLanguage === "es"
            ? "La factura Lightning se copió al portapapeles."
            : "Lightning invoice copied to clipboard.",
        status: "warning",
        duration: 1500,
        isClosable: true,
        position: "top",
      });
    } catch {}
  };

  const handleIdentitySelect = async (nextIdentity) => {
    const previousIdentity = selectedIdentity;
    if (!nextIdentity || nextIdentity === previousIdentity) {
      setSelectedIdentity(nextIdentity || "");
      return;
    }

    try {
      await Promise.resolve(onSelectIdentity?.(nextIdentity));
      setSelectedIdentity(nextIdentity);
      toast({
        title:
          userLanguage === "es" ? "Identidad actualizada" : "Identity updated",
        status: "success",
        duration: 1600,
      });
    } catch (error) {
      console.error("Failed to set identity", error);
      setSelectedIdentity(previousIdentity || "");
      toast({
        title:
          userLanguage === "es"
            ? "No se pudo actualizar"
            : "Could not update identity",
        description: error?.message || String(error),
        status: "error",
        duration: 2600,
      });
    }
  };

  // ---------- Renders ----------
  return (
    <Box bg="gray.800" rounded="md" p={3} mx={1}>
      <Text mb={2} fontSize="sm" fontWeight="bold">
        {userLanguage === "es"
          ? "Billetera Bitcoin (experimental)"
          : "Bitcoin wallet (experimental)"}
      </Text>

      <Text fontSize="xs" color="teal.100" mb={3}>
        {W("scholarshipNote")}{" "}
        <Link
          href="https://robotsbuildingeducation.com"
          isExternal
          textDecoration="underline"
        >
          RobotsBuildingEducation.com
        </Link>
      </Text>

      <Box bg="gray.900" p={3} rounded="md" mb={3}>
        <Text fontSize="sm" mb={2}>
          {userLanguage === "es"
            ? "Elige a quién apoyar con tus depósitos:"
            : "Choose who you’d like to support with your deposits:"}
        </Text>
        <RadioGroup
          value={selectedIdentity}
          onChange={handleIdentitySelect}
          isDisabled={isIdentitySaving}
        >
          <VStack align="start" spacing={2} width="100%">
            {BITCOIN_RECIPIENTS.map((recipient) => {
              const isSelected = selectedIdentity === recipient.npub;
              return (
                <Box key={recipient.npub}>
                  <Radio
                    colorScheme="purple"
                    value={recipient.npub}
                    isDisabled={isIdentitySaving}
                  >
                    {recipient.label}
                  </Radio>
                  {isSelected && recipient.identityUrl ? (
                    <Link
                      href={recipient.identityUrl}
                      isExternal
                      fontSize="xs"
                      color="teal.200"
                      ml={6}
                      display="inline-block"
                      mt={1}
                    >
                      {userLanguage === "es" ? "Ver sitio" : "View site"}
                    </Link>
                  ) : null}
                </Box>
              );
            })}
          </VStack>
        </RadioGroup>
        {!selectedIdentity && (
          <Text fontSize="xs" mt={2} color="orange.200">
            {userLanguage === "es"
              ? "Selecciona una opción para habilitar los depósitos."
              : "Select an option to enable deposits."}
          </Text>
        )}
      </Box>

      {/* Loading/hydration spinner (only after refresh / first mount) */}
      {hydrating && !cashuWallet && (
        <HStack py={2}>
          <Spinner size="sm" />
          <Text fontSize="sm">
            {userLanguage === "es" ? "Cargando billetera…" : "Loading wallet…"}
          </Text>
        </HStack>
      )}

      {/* 1) No wallet yet → single "Create wallet" button */}
      {!cashuWallet && !hydrating && (
        <Button
          onClick={handleCreateWallet}
          isLoading={isCreatingWallet}
          loadingText={W("loadingWallet")}
          boxShadow="0.5px 0.5px 1px 0px rgba(0,0,0,0.75)"
        >
          {W("createWallet")}
        </Button>
      )}

      {/* 2) Wallet exists, balance > 0 → show card */}
      {cashuWallet && totalBalance > 0 && (
        <>
          <Text mb={2} fontSize="sm">
            {W("activeWalletBody")}{" "}
            <Link
              href="https://nutlife.lol"
              target="_blank"
              textDecoration="underline"
            >
              {W("activeWalletLink")}
            </Link>
          </Text>
          <IdentityCard
            number={cashuWallet.walletId}
            name={
              <div>
                {W("cardNameLabel")}
                <div>
                  {W("balanceLabel")}: {totalBalance || 0} sats
                </div>
              </div>
            }
            theme="nostr"
            animateOnChange={false}
            realValue={cashuWallet.walletId}
            totalBalance={totalBalance || 0}
          />
        </>
      )}

      {/* 3) Wallet exists, no balance yet */}
      {cashuWallet && totalBalance <= 0 && (
        <>
          {!invoice && (
            <Box display="flex" flexDirection={"column"} alignItems={"center"}>
              <IdentityCard
                number={cashuWallet.walletId}
                name={
                  <div>
                    {W("cardNameLabel")}
                    <div>
                      {W("balanceLabel")}: {totalBalance || 0} sats
                    </div>
                  </div>
                }
                theme="BTC"
                animateOnChange={false}
                realValue={cashuWallet.walletId}
                totalBalance={totalBalance || 0}
              />
              <Button
                mt={3}
                onClick={handleInitiateDeposit}
                isDisabled={!selectedIdentity || isIdentitySaving}
                width="100%"
                maxWidth="400px"
                p={6}
              >
                {W("deposit")}
              </Button>
            </Box>
          )}

          {invoice && (
            <VStack mt={2}>
              <QRCodeSVG value={invoice} size={256} style={{ zIndex: 10 }} />
              <Box mt={2}>
                {W("or")} &nbsp;
                <Button
                  onClick={handleCopyInvoice}
                  boxShadow="0.5px 0.5px 1px 0px rgba(0,0,0,0.75)"
                >
                  🔑 {W("copyAddress")}
                </Button>
              </Box>
              <br />
              <Text fontSize="sm" opacity={0.8} textAlign={"center"}>
                {W("ps")}
                <br />

                <Link
                  href="https://click.cash.app/ui6m/home2022"
                  isExternal
                  color="white.500"
                  display="inline-flex" // Ensures icon and text stay inline
                  alignItems="center" // Aligns icon and text vertically
                  gap="4px" // Optional: small space between icon and text
                  lineHeight={"0px"}
                  ml="-1.5"
                  textDecoration={"underline"}
                >
                  <SiCashapp color="white" />
                  <Text>Cash App</Text>
                </Link>
              </Text>
              <br />
              <Button
                mt={2}
                onClick={generateNewQR}
                isDisabled={!selectedIdentity || isIdentitySaving}
                leftIcon={<BsQrCode />}
                boxShadow="0.5px 0.5px 1px 0px rgba(0,0,0,0.75)"
              >
                {W("generateNew")}
              </Button>
            </VStack>
          )}
        </>
      )}
    </Box>
  );
}
