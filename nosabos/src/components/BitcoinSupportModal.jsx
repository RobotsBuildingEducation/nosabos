import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CloseIcon } from "@chakra-ui/icons";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  HStack,
  IconButton,
  Link,
  Radio,
  RadioGroup,
  Text,
  VStack,
} from "@chakra-ui/react";

import { BitcoinWalletSection } from "./IdentityDrawer";
import RandomCharacter from "./RandomCharacter";
import { BITCOIN_RECIPIENTS } from "../constants/bitcoinRecipients";
import { useNostrWalletStore } from "../hooks/useNostrWalletStore";
import useSoundSettings from "../hooks/useSoundSettings";
import selectSound from "../assets/select.mp3";
import submitActionSound from "../assets/submitaction.mp3";
import { translations } from "../utils/translation";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  normalizeSupportLanguage,
} from "../constants/languages";

function supportCopy(lang, en, es, pt, it, fr, ja, hi = null) {
  if (lang === "ja") return ja || en;
  if (lang === "fr") return fr || en;
  if (lang === "it") return it || en;
  if (lang === "pt") return pt || en;
  if (lang === "hi") return hi || en;
  if (lang === "es") return es || en;
  return en;
}

export default function BitcoinSupportModal({
  isOpen,
  onClose,
  userLanguage = "en",
  identity = "",
  onSelectIdentity,
  isIdentitySaving = false,
}) {
  const lang = normalizeSupportLanguage(userLanguage, DEFAULT_SUPPORT_LANGUAGE);
  const ui = useMemo(() => translations[lang] ?? translations.en, [lang]);
  const [selectedIdentity, setSelectedIdentity] = useState(identity || "");
  const shellRef = useRef(null);
  const cashuWallet = useNostrWalletStore((s) => s.cashuWallet);
  const playSound = useSoundSettings((s) => s.playSound);

  useEffect(() => {
    setSelectedIdentity(identity || "");
  }, [identity]);

  useEffect(() => {
    if (
      !isOpen ||
      typeof window === "undefined" ||
      typeof document === "undefined"
    ) {
      return undefined;
    }

    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverscroll = html.style.overscrollBehavior;
    const previousBodyOverscroll = body.style.overscrollBehavior;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overscrollBehavior = "none";

    let rafOne = null;
    let rafTwo = null;

    // Force a compositor refresh on open. The installed iOS PWA seems to
    // keep stale hit-testing until the page scrolls; nudging the fixed shell
    // is a lightweight way to trigger the same refresh without user input.
    rafOne = window.requestAnimationFrame(() => {
      const node = shellRef.current;
      if (!node) return;
      node.style.transform = "translate3d(0, 0.5px, 0)";
      void node.getBoundingClientRect();
      rafTwo = window.requestAnimationFrame(() => {
        if (shellRef.current) {
          shellRef.current.style.transform = "translate3d(0, 0, 0)";
        }
      });
    });

    return () => {
      if (rafOne !== null) window.cancelAnimationFrame(rafOne);
      if (rafTwo !== null) window.cancelAnimationFrame(rafTwo);
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      html.style.overscrollBehavior = previousHtmlOverscroll;
      body.style.overscrollBehavior = previousBodyOverscroll;
    };
  }, [isOpen]);

  const handleDismiss = useCallback(() => {
    playSound(selectSound);
    onClose?.();
  }, [onClose, playSound]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        handleDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDismiss, isOpen]);

  const selectedRecipient = useMemo(
    () =>
      BITCOIN_RECIPIENTS.find(
        (recipient) => recipient.npub === selectedIdentity,
      ),
    [selectedIdentity],
  );
  const paperTheme = useMemo(
    () => ({
      shellBg: "#f8f0df",
      shellBorder: "#d7b98d",
      bodyBg: "#f6ecdb",
      footerBg: "#f1e4ce",
      text: "#352412",
      mutedText: "#715331",
      subtleText: "#8d6d46",
      panelBg: "#fff8eb",
      panelBorder: "#dcc09a",
      panelBorderHover: "#c89447",
      panelSelectedBg: "#f5dfbe",
      panelSelectedBorder: "#c67c1b",
      link: "#0f766e",
      warning: "#996300",
      primaryButtonBg: "#319795",
      primaryButtonHoverBg: "#2c7a7b",
      primaryButtonActiveBg: "#285e61",
      primaryButtonShadow: "#1f6f68",
      ghostHoverBg: "#ead7b8",
      ghostActiveBg: "#dfc499",
    }),
    [],
  );

  const title =
    ui.tutorial_bitcoin_modal_title ||
    supportCopy(
      lang,
      "Create Scholarships",
      "Crea becas con aprendizaje",
      "Criar bolsas de estudo com aprendizagem",
      "Crea borse di studio con l'apprendimento",
      "Creer des bourses",
      "奨学金を作る",
      "शिक्षा-वृत्तियां बनाएं",
    );
  const subtitle =
    ui.tutorial_bitcoin_modal_subtitle ||
    supportCopy(
      lang,
      "Send Bitcoin to educators any time you gain XP",
      "Envía Bitcoin a educadores cada vez que ganes XP",
      "Envie Bitcoin para educadores sempre que você ganhar XP",
      "Invia Bitcoin agli educatori ogni volta che guadagni XP",
      "Envoie du Bitcoin aux educateurs chaque fois que tu gagnes de l'XP",
      "XPを獲得するたびに教育者へBitcoinを送れます",
      "जब भी आप XP कमाएं, शिक्षकों को Bitcoin भेजें",
    );
  const footerNote =
    ui.tutorial_bitcoin_modal_body ||
    supportCopy(
      lang,
      "This can be done later in your settings.",
      "Esto se puede hacer después en tus ajustes.",
      "Isso pode ser feito depois nas suas configurações.",
      "Puoi farlo più tardi dalle impostazioni.",
      "Tu pourras le faire plus tard dans les parametres.",
      "これは後で設定から行えます。",
      "यह बाद में आपकी सेटिंग्स में भी किया जा सकता है।",
    );
  const skipLabel =
    ui.tutorial_bitcoin_modal_skip ||
    supportCopy(
      lang,
      "Maybe later",
      "Tal vez después",
      "Talvez depois",
      "Forse più tardi",
      "Peut-etre plus tard",
      "後で",
      "शायद बाद में",
    );
  const closeLabel =
    ui.tutorial_bitcoin_modal_done ||
    supportCopy(lang, "Done", "Listo", "Concluído", "Fatto", "Termine", "完了", "पूरा");

  const handleRecipientSelect = useCallback(
    (nextIdentity) => {
      const nextValue = nextIdentity || "";
      playSound(selectSound);
      setSelectedIdentity(nextValue);
      if (
        nextValue &&
        nextValue !== identity &&
        typeof onSelectIdentity === "function"
      ) {
        onSelectIdentity(nextValue);
      }
    },
    [identity, onSelectIdentity, playSound],
  );

  const handleConfirm = useCallback(() => {
    playSound(submitActionSound);
    onClose?.();
  }, [onClose, playSound]);

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
                  tabIndex={isIdentitySaving ? -1 : 0}
                  spacing={2}
                  align="center"
                  width="100%"
                  px={{ base: 3, md: 4 }}
                  py={{ base: 2.5, md: 3 }}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={
                    isSelected
                      ? paperTheme.panelSelectedBorder
                      : paperTheme.panelBorder
                  }
                  bg={
                    isSelected
                      ? paperTheme.panelSelectedBg
                      : paperTheme.panelBg
                  }
                  boxShadow={
                    isSelected ? "0 0 0 1px rgba(198, 124, 27, 0.28)" : "none"
                  }
                  cursor={isIdentitySaving ? "not-allowed" : "pointer"}
                  transition="background 0.18s ease, border-color 0.18s ease, transform 0.18s ease"
                  _hover={{
                    bg: isSelected
                      ? paperTheme.panelSelectedBg
                      : "#f5ead5",
                    borderColor: isSelected
                      ? paperTheme.panelSelectedBorder
                      : paperTheme.panelBorderHover,
                  }}
                  _active={{
                    transform: isIdentitySaving ? "none" : "scale(0.98)",
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
                    colorScheme="orange"
                    value={recipient.npub}
                    size="sm"
                    isDisabled={isIdentitySaving}
                    pointerEvents="none"
                    flex="1"
                    minW={0}
                    color={paperTheme.text}
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
                      color={paperTheme.link}
                      lineHeight="1"
                      ml="auto"
                      whiteSpace="nowrap"
                      flexShrink={0}
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      {supportCopy(
                        lang,
                        "View site",
                        "Ver sitio",
                        "Vedi sito",
                        "Voir le site",
                        "サイトを見る",
                        null,
                        "साइट देखें",
                      )}
                    </Link>
                  ) : null}
                </HStack>
              </Box>
            );
          })}
        </VStack>
      </RadioGroup>
      {!selectedIdentity ? (
        <Text fontSize="xs" mt={2} color={paperTheme.warning} textAlign="left">
          {supportCopy(
            lang,
            "Select an option to enable deposits.",
            "Selecciona una opción para habilitar los depósitos.",
            "Seleziona un'opzione per abilitare i depositi.",
            "Selectionne une option pour activer les depots.",
            "入金を有効にするにはオプションを選択してください。",
            null,
            "जमा सक्षम करने के लिए एक विकल्प चुनें।",
          )}
        </Text>
      ) : null}
    </>
  );

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={1600}
      bg="rgba(0, 0, 0, 0.72)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={{ base: 4, md: 6 }}
      py={{ base: 4, md: 6 }}
      touchAction="none"
      overscrollBehavior="none"
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      onTouchMove={(event) => {
        if (event.target === event.currentTarget) {
          event.preventDefault();
        }
      }}
    >
      <Box
        ref={shellRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        bg={paperTheme.shellBg}
        color={paperTheme.text}
        border="1px solid"
        borderColor={paperTheme.shellBorder}
        borderRadius="2xl"
        boxShadow="0 24px 60px rgba(53, 36, 18, 0.28)"
        overflow="hidden"
        pointerEvents="auto"
        position="relative"
        width="100%"
        maxW={{ base: "92vw", md: "720px" }}
        h={{ base: "min(80vh, 720px)", md: "min(78vh, 760px)" }}
        maxH={{ base: "calc(100vh - 2.5rem)", md: "calc(100vh - 4rem)" }}
        display="flex"
        flexDirection="column"
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        sx={{
          isolation: "isolate",
          transform: "translate3d(0, 0, 0)",
          WebkitTransform: "translate3d(0, 0, 0)",
          willChange: "transform",
          "@supports (height: 100dvh)": {
            height: {
              base: "min(80dvh, 720px)",
              md: "min(78dvh, 760px)",
            },
            maxHeight: {
              base: "calc(100dvh - 2.5rem)",
              md: "calc(100dvh - 4rem)",
            },
          },
        }}
      >
        <IconButton
          aria-label={supportCopy(lang, "Close", "Cerrar", "Chiudi", "Fermer", "閉じる", null, "बंद करें")}
          icon={<CloseIcon boxSize={3} />}
          variant="ghost"
          color="white"
          _hover={{ color: "white", bg: "blackAlpha.200" }}
          position="absolute"
          top={4}
          right={4}
          zIndex={1}
          onClick={handleDismiss}
        />

        <Box
          bgGradient="linear(to-r, #f7931a, #ffb347)"
          px={{ base: 5, md: 7 }}
          py={{ base: 4, md: 5 }}
          borderBottom="1px solid"
          borderColor="rgba(0, 0, 0, 0.18)"
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
              color="#5a3510"
            >
              {subtitle}
            </Text>
          </VStack>
        </Box>

        <Box
          px={{ base: 4, md: 5 }}
          py={{ base: 4, md: 5 }}
          bg={paperTheme.bodyBg}
          overflowY="auto"
          flex="1"
          minH={0}
          overscrollBehavior="contain"
          touchAction="pan-y"
          onTouchMove={(event) => event.stopPropagation()}
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
                bg: "transparent",
                rounded: "xl",
                p: 0,
                mx: "auto",
              }}
              sectionBg="#f1e4ce"
              identitySelectorPlacement="bottom"
              contentMaxW="420px"
              showIdentitySelector={false}
              compactCardMobile
              compactCardDesktop
              hydrateWalletOnMount={false}
              visualStyle="paper"
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
                      sx={{
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
                      onClick={() => playSound(selectSound)}
                    >
                      <Box flex="1" textAlign="left">
                        <Text fontSize="sm" color={paperTheme.text}>
                          {supportCopy(
                            lang,
                            "Choose a recipient",
                            "Elige un destinatario",
                            "Scegli un destinatario",
                            "Choisis un destinataire",
                            "受取先を選ぶ",
                            null,
                            "प्राप्तकर्ता चुनें",
                          )}
                        </Text>
                        {selectedRecipient ? (
                          <Text
                            fontSize="xs"
                            color={paperTheme.subtleText}
                            mt={1}
                          >
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
                  <Text
                    fontSize="sm"
                    mb={2}
                    textAlign="left"
                    color={paperTheme.text}
                  >
                    {supportCopy(
                      lang,
                      "Choose a recipient",
                      "Elige un destinatario",
                      "Scegli un destinatario",
                      "Choisis un destinataire",
                      "受取先を選ぶ",
                      null,
                      "प्राप्तकर्ता चुनें",
                    )}
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
          bg={paperTheme.footerBg}
          borderTop="1px solid"
          borderColor={paperTheme.shellBorder}
        >
          <VStack spacing={2} width="100%">
            <Box display="flex" justifyContent="flex-end" width="100%" gap={3}>
              <Button
                variant="ghost"
                color={paperTheme.text}
                _hover={{ bg: paperTheme.ghostHoverBg }}
                _active={{ bg: paperTheme.ghostActiveBg }}
                onClick={handleDismiss}
              >
                {skipLabel}
              </Button>
              <Button
                bg={paperTheme.primaryButtonBg}
                color="white"
                boxShadow={`0 4px 0 ${paperTheme.primaryButtonShadow}`}
                _hover={{
                  bg: paperTheme.primaryButtonHoverBg,
                  boxShadow: `0 4px 0 ${paperTheme.primaryButtonShadow}`,
                }}
                _active={{
                  bg: paperTheme.primaryButtonActiveBg,
                  boxShadow: "none",
                  transform: "translateY(4px)",
                }}
                onClick={handleConfirm}
              >
                {closeLabel}
              </Button>
            </Box>
            <Text fontSize="xs" color={paperTheme.mutedText} textAlign="center">
              {footerNote}
            </Text>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}
