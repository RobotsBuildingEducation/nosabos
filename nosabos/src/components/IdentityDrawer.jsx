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

const HINDI_SUPPORT_COPY = {
  "Enter a display name": "एक प्रदर्शित नाम दर्ज करें",
  "Display name updated": "प्रदर्शित नाम अपडेट हो गया",
  Error: "त्रुटि",
  "Join us on Patreon": "Patreon पर हमारा साथ दें",
  "Access more education apps and content":
    "और अधिक शैक्षिक ऐप्स और सामग्री तक पहुंचें",
  Join: "जुड़ें",
  "Change display name": "प्रदर्शित नाम बदलें",
  "Create display name": "प्रदर्शित नाम बनाएं",
  "Saving…": "सहेजा जा रहा है…",
  Save: "सहेजें",
  "Wallet not ready": "वॉलेट तैयार नहीं है",
  "Please try again in a moment.": "कृपया थोड़ी देर में फिर से कोशिश करें।",
  "Secret key required": "सीक्रेट की आवश्यक है",
  "Enter your nsec to create the wallet.":
    "वॉलेट बनाने के लिए अपना nsec दर्ज करें।",
  "Invalid key": "अमान्य कुंजी",
  "Key must start with 'nsec'.": "कुंजी 'nsec' से शुरू होनी चाहिए।",
  "Couldn't create wallet": "वॉलेट नहीं बनाया जा सका",
  "Failed to create wallet": "वॉलेट बनाने में विफल",
  "Select an identity": "एक पहचान चुनें",
  "Choose who receives your deposits before continuing.":
    "आगे बढ़ने से पहले चुनें कि आपकी जमा राशि किसे मिलेगी।",
  "Couldn't create invoice": "इनवॉइस नहीं बनाई जा सकी",
  "Failed to initiate deposit": "जमा शुरू नहीं हो सकी",
  "Address copied": "पता कॉपी हो गया",
  "Lightning invoice copied to clipboard.":
    "Lightning इनवॉइस क्लिपबोर्ड पर कॉपी हो गई।",
  "Choose a recipient": "प्राप्तकर्ता चुनें",
  "View site": "साइट देखें",
  "Select an option to enable deposits.":
    "जमा सक्षम करने के लिए एक विकल्प चुनें।",
  "Bitcoin wallet": "Bitcoin वॉलेट",
  "Loading wallet…": "वॉलेट लोड हो रहा है…",
};

const ARABIC_SUPPORT_COPY = {
  "Enter a display name": "اكتب اسم عرض",
  "Display name updated": "اتحدّث اسم العرض",
  Error: "خطأ",
  "Join us on Patreon": "انضم لينا على Patreon",
  "Access more education apps and content":
    "افتح تطبيقات ومحتوى تعليمي أكتر",
  Join: "انضم",
  "Change display name": "غيّر اسم العرض",
  "Create display name": "اعمل اسم عرض",
  "Saving…": "جارٍ الحفظ…",
  Save: "حفظ",
  "Wallet not ready": "المحفظة مش جاهزة",
  "Please try again in a moment.": "جرّب تاني بعد لحظة.",
  "Secret key required": "مطلوب المفتاح السري",
  "Enter your nsec to create the wallet.":
    "اكتب nsec بتاعك علشان تنشئ المحفظة.",
  "Invalid key": "مفتاح غير صالح",
  "Key must start with 'nsec'.": "المفتاح لازم يبدأ بـ nsec.",
  "Couldn't create wallet": "ماقدرناش ننشئ المحفظة",
  "Failed to create wallet": "فشل إنشاء المحفظة",
  "Select an identity": "اختار هوية",
  "Choose who receives your deposits before continuing.":
    "اختار مين يستقبل إيداعاتك قبل ما تكمل.",
  "Couldn't create invoice": "ماقدرناش ننشئ الفاتورة",
  "Failed to initiate deposit": "فشل بدء الإيداع",
  "Address copied": "اتنسخ العنوان",
  "Lightning invoice copied to clipboard.":
    "فاتورة Lightning اتنسخت للحافظة.",
  "Choose a recipient": "اختار مستلِم",
  "View site": "افتح الموقع",
  "Select an option to enable deposits.":
    "اختار خيار عشان تفعّل الإيداعات.",
  "Bitcoin wallet": "محفظة بيتكوين",
  "Loading wallet…": "جارٍ تحميل المحفظة…",
};

function supportCopy(lang, en, es, it, fr, ja, pt = null, hi = null, ar = null) {
  if (lang === "ar") {
    if (ar) return ar;
    if (typeof en === "string") {
      if (/'s Account$/.test(en)) {
        return en.replace(/'s Account$/, " - الحساب");
      }
      return ARABIC_SUPPORT_COPY[en] || en;
    }
  }
  if (lang === "ja") return ja || en;
  if (lang === "fr") return fr || en;
  if (lang === "it") return it || en;
  if (lang === "pt") return pt || en;
  if (lang === "hi") {
    if (hi) return hi;
    if (typeof en === "string") {
      if (/'s Account$/.test(en)) {
        return en.replace(/'s Account$/, " का खाता");
      }
      return HINDI_SUPPORT_COPY[en] || en;
    }
  }
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
          "Saisis un nom d'affichage",
          "表示名を入力してください",
          "Digite um nome de exibição",
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
          "Nom d'affichage mis a jour",
          "表示名を更新しました",
          "Nome de exibição atualizado",
        ),
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      console.error("Failed to save display name:", error);
      toast({
        title: supportCopy(
          lang,
          "Error",
          "Error",
          "Errore",
          "Erreur",
          "エラー",
          "Erro",
        ),
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
                `Compte de ${displayName}`,
                `${displayName}のアカウント`,
                `Conta de ${displayName}`,
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
                  "Rejoins-nous sur Patreon",
                  "Patreonで応援",
                  "Apoie-nos no Patreon",
                )}
              </Text>
              <Text fontSize="xs" color="gray.400">
                {supportCopy(
                  lang,
                  "Access more education apps and content",
                  "Accede a más apps educativas y contenido",
                  "Accedi a più app educative e contenuti",
                  "Accede a plus d'apps educatives et de contenu",
                  "さらに多くの教育アプリとコンテンツにアクセス",
                  "Acesse mais apps educacionais e conteúdo",
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
              {supportCopy(
                lang,
                "Join",
                "Unirse",
                "Unisciti",
                "Rejoindre",
                "参加",
                "Entrar",
              )}
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
                        "Changer le nom d'affichage",
                        "表示名を変更",
                        "Alterar nome de exibição",
                      )
                    : supportCopy(
                        lang,
                        "Create display name",
                        "Crear nombre de usuario",
                        "Crea nome visualizzato",
                        "Creer un nom d'affichage",
                        "表示名を作成",
                        "Criar nome de exibição",
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
                    "Saisis un nom d'affichage",
                    "表示名を入力",
                    "Digite um nome de exibição",
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
                    "Enregistrement...",
                    "保存中…",
                    "Salvando…",
                  )}
                >
                  {supportCopy(
                    lang,
                    "Save",
                    "Guardar",
                    "Salva",
                    "Enregistrer",
                    "保存",
                    "Salvar",
                  )}
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
                      "Portefeuille Bitcoin",
                      "Bitcoinウォレット",
                      "Carteira Bitcoin",
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
    const pt = {
      createWallet: "Criar carteira",
      loadingWallet: "Criando carteira…",
      deposit: "Depositar",
      loadingAddress: "Gerando endereço…",
      or: "ou",
      copyAddress: "Copiar endereço",
      ps: "Use uma carteira Lightning compatível para pagar a fatura.",
      activeWalletTitle: "Sua carteira está ativa",
      verifyTransactions: "Verifique suas transações",
      generateNew: "Gerar novo QR",
      balanceLabel: "Saldo",
      cardNameLabel: "Carteira",
      scholarshipNote:
        "Seus depósitos nos ajudam a criar bolsas com aprendizagem com ",
      nip07NsecTitle: "Chave secreta necessária",
      nip07NsecDescription:
        "Você entrou com uma extensão do navegador, então não temos acesso à sua chave privada. Para criar uma carteira, digite seu nsec abaixo.",
      nip07NsecPlaceholder: "Digite seu nsec1...",
      nip07NsecWarning:
        "Sua chave é usada apenas para criar a carteira e não é armazenada.",
    };
    const hi = {
      createWallet: "वॉलेट बनाएं",
      loadingWallet: "वॉलेट बनाया जा रहा है…",
      deposit: "जमा करें",
      loadingAddress: "पता बनाया जा रहा है…",
      or: "या",
      copyAddress: "पता कॉपी करें",
      ps: "इनवॉइस का भुगतान करने के लिए संगत Lightning वॉलेट का उपयोग करें।",
      activeWalletTitle: "आपका वॉलेट सक्रिय है",
      verifyTransactions: "अपने लेन-देन जांचें",
      generateNew: "नया QR बनाएं",
      balanceLabel: "बैलेंस",
      cardNameLabel: "वॉलेट",
      scholarshipNote:
        "आपकी जमा राशि सीखने के माध्यम से छात्रवृत्तियां बनाने में हमारी मदद करती है: ",
      nip07NsecTitle: "सीक्रेट की आवश्यक है",
      nip07NsecDescription:
        "आपने ब्राउज़र एक्सटेंशन से साइन इन किया है, इसलिए हमें आपकी निजी कुंजी तक पहुंच नहीं है। वॉलेट बनाने के लिए नीचे अपना nsec दर्ज करें।",
      nip07NsecPlaceholder: "अपना nsec1 दर्ज करें...",
      nip07NsecWarning:
        "आपकी कुंजी केवल वॉलेट बनाने के लिए उपयोग होती है और संग्रहीत नहीं की जाती।",
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
    const fr = {
      createWallet: "Creer un portefeuille",
      loadingWallet: "Creation du portefeuille...",
      deposit: "Deposer",
      loadingAddress: "Generation de l'adresse...",
      or: "ou",
      copyAddress: "Copier l'adresse",
      ps: "Utilise un portefeuille Lightning compatible pour payer la facture.",
      activeWalletTitle: "Ton portefeuille est actif",
      verifyTransactions: "Verifier tes transactions",
      generateNew: "Generer un nouveau QR",
      balanceLabel: "Solde",
      cardNameLabel: "Portefeuille",
      scholarshipNote:
        "Tes depots nous aident a creer des bourses grace a l'apprentissage avec ",
      nip07NsecTitle: "Cle secrete requise",
      nip07NsecDescription:
        "Tu t'es connecte avec une extension de navigateur, donc nous n'avons pas acces a ta cle privee. Pour creer un portefeuille, saisis ton nsec ci-dessous.",
      nip07NsecPlaceholder: "Saisis ton nsec1...",
      nip07NsecWarning:
        "Ta cle sert uniquement a creer le portefeuille et n'est pas stockee.",
    };
    const ja = {
      createWallet: "ウォレットを作成",
      loadingWallet: "ウォレットを作成中…",
      deposit: "入金",
      loadingAddress: "アドレスを生成中…",
      or: "または",
      copyAddress: "アドレスをコピー",
      ps: "対応するLightningウォレットで請求書を支払ってください。",
      activeWalletTitle: "ウォレットは有効です",
      verifyTransactions: "取引を確認",
      generateNew: "新しいQRを生成",
      balanceLabel: "残高",
      cardNameLabel: "ウォレット",
      scholarshipNote:
        "あなたの入金は学習による奨学金づくりを支援します: ",
      nip07NsecTitle: "シークレットキーが必要です",
      nip07NsecDescription:
        "ブラウザ拡張機能でサインインしているため、秘密鍵にアクセスできません。ウォレットを作成するには、下にnsecを入力してください。",
      nip07NsecPlaceholder: "nsec1...を入力",
      nip07NsecWarning:
        "キーはウォレット作成にのみ使用され、保存されません。",
    };
    const ar = {
      createWallet: "أنشئ محفظة",
      loadingWallet: "جارٍ إنشاء المحفظة…",
      deposit: "إيداع",
      loadingAddress: "جارٍ إنشاء العنوان…",
      or: "أو",
      copyAddress: "انسخ العنوان",
      ps: "استخدم محفظة Lightning متوافقة لدفع الفاتورة.",
      activeWalletTitle: "محفظتك مفعّلة",
      verifyTransactions: "تحقق من معاملاتك",
      generateNew: "أنشئ QR جديدًا",
      balanceLabel: "الرصيد",
      cardNameLabel: "المحفظة",
      scholarshipNote:
        "إيداعاتك تساعدنا نعمل منح دراسية من خلال التعلّم مع ",
      nip07NsecTitle: "مطلوب المفتاح السري",
      nip07NsecDescription:
        "أنت مسجل الدخول من إضافة في المتصفح، لذلك لا نملك الوصول إلى مفتاحك الخاص. لإنشاء محفظة، أدخل nsec بالأسفل.",
      nip07NsecPlaceholder: "أدخل nsec1...",
      nip07NsecWarning:
        "يُستخدم مفتاحك فقط لإنشاء المحفظة ولا يتم حفظه.",
    };
    return (
      walletLang === "ja"
        ? ja
        : walletLang === "fr"
        ? fr
        : walletLang === "it"
        ? it
        : walletLang === "pt"
        ? pt
        : walletLang === "hi"
        ? hi
        : walletLang === "ar"
        ? ar
        : walletLang === "es"
        ? es
        : en
    )[key] ?? key;
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
        "Portefeuille pas pret",
        "ウォレットの準備ができていません",
      ),
      description: supportCopy(
        walletLang,
        "Please try again in a moment.",
        "Intenta de nuevo en un momento.",
        "Riprova tra poco.",
        "Reessaie dans un instant.",
        "少し待ってからもう一度お試しください。",
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
          "Cle secrete requise",
          "シークレットキーが必要です",
        ),
        description: supportCopy(
          walletLang,
          "Enter your nsec to create the wallet.",
          "Ingresa tu nsec para crear la billetera.",
          "Inserisci il tuo nsec per creare il portafoglio.",
          "Saisis ton nsec pour creer le portefeuille.",
          "ウォレットを作成するにはnsecを入力してください。",
        ),
        status: "warning",
        duration: 2500,
      });
      return;
    }

    // Validate nsec format if provided
    if (nsecForWallet.trim() && !nsecForWallet.trim().startsWith("nsec")) {
      toast({
        title: supportCopy(
          walletLang,
          "Invalid key",
          "Clave inválida",
          "Chiave non valida",
          "Cle invalide",
          "無効なキー",
        ),
        description: supportCopy(
          walletLang,
          "Key must start with 'nsec'.",
          "La clave debe empezar con 'nsec'.",
          "La chiave deve iniziare con 'nsec'.",
          "La cle doit commencer par 'nsec'.",
          "キーは「nsec」で始まる必要があります。",
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
            "Impossible de creer le portefeuille",
            "ウォレットを作成できませんでした",
          ),
          description:
            latestError ||
            errorMessage ||
            supportCopy(
              walletLang,
              "Please try again in a moment.",
              "Intenta de nuevo en un momento.",
              "Riprova tra poco.",
              "Reessaie dans un instant.",
              "少し待ってからもう一度お試しください。",
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
        title: supportCopy(
          walletLang,
          "Error",
          "Error",
          "Errore",
          "Erreur",
          "エラー",
          "Erro",
        ),
        description: supportCopy(
          walletLang,
          "Failed to create wallet",
          "No se pudo crear la billetera",
          "Creazione del portafoglio non riuscita",
          "Echec de la creation du portefeuille",
          "ウォレットの作成に失敗しました",
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
          "Selectionne une identite",
          "IDを選択してください",
        );
      const description =
        supportCopy(
          walletLang,
          "Choose who receives your deposits before continuing.",
          "Elige un destinatario para tus depósitos.",
          "Scegli chi riceve i tuoi depositi prima di continuare.",
          "Choisis qui recoit tes depots avant de continuer.",
          "続行する前に入金の受取先を選んでください。",
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
            "Impossible de creer la facture",
            "請求書を作成できませんでした",
          ),
          description:
            latestError ||
            errorMessage ||
            supportCopy(
              walletLang,
              "Please try again in a moment.",
              "Intenta de nuevo en un momento.",
              "Riprova tra poco.",
              "Reessaie dans un instant.",
              "少し待ってからもう一度お試しください。",
            ),
          status: "error",
          duration: 2800,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error("Error initiating deposit:", err);
      toast({
        title: supportCopy(
          walletLang,
          "Error",
          "Error",
          "Errore",
          "Erreur",
          "エラー",
          "Erro",
        ),
        description: supportCopy(
          walletLang,
          "Failed to initiate deposit",
          "No se pudo iniciar el depósito",
          "Avvio del deposito non riuscito",
          "Echec du lancement du depot",
          "入金を開始できませんでした",
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
            "Impossible de creer la facture",
            "請求書を作成できませんでした",
          ),
          description:
            latestError ||
            errorMessage ||
            supportCopy(
              walletLang,
              "Please try again in a moment.",
              "Intenta de nuevo en un momento.",
              "Riprova tra poco.",
              "Reessaie dans un instant.",
              "少し待ってからもう一度お試しください。",
            ),
          status: "error",
          duration: 2800,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error("Error initiating deposit:", err);
      toast({
        title: supportCopy(
          walletLang,
          "Error",
          "Error",
          "Errore",
          "Erreur",
          "エラー",
          "Erro",
        ),
        description: supportCopy(
          walletLang,
          "Failed to initiate deposit",
          "No se pudo iniciar el depósito",
          "Avvio del deposito non riuscito",
          "Echec du lancement du depot",
          "入金を開始できませんでした",
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
          "Adresse copiee",
          "アドレスをコピーしました",
        ),
        description: supportCopy(
          walletLang,
          "Lightning invoice copied to clipboard.",
          "La factura Lightning se copió al portapapeles.",
          "Fattura Lightning copiata negli appunti.",
          "Facture Lightning copiee dans le presse-papiers.",
          "Lightning請求書をクリップボードにコピーしました。",
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
          "Choisis un destinataire",
          "入金で支援する受取先を選んでください:",
          "Escolha quem apoiar com os seus depósitos:",
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
                    {supportCopy(
                      walletLang,
                      "View site",
                      "Ver sitio",
                      "Vedi sito",
                      "Voir le site",
                      "サイトを見る",
                      "Ver site",
                    )}
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
            "Selectionne une option pour activer les depots.",
            "入金を有効にするにはオプションを選択してください。",
            "Selecione uma opção para habilitar os depósitos.",
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
            "Portefeuille Bitcoin",
            "Bitcoinウォレット",
            "Carteira Bitcoin",
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
              "Chargement du portefeuille...",
              "ウォレットを読み込み中…",
              "Carregando carteira…",
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
