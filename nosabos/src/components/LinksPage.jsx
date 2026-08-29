import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Accordion,
  AccordionButton as ChakraAccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button as ChakraButton,
  Container,
  Divider,
  Heading,
  HStack,
  Input,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuOptionGroup,
  MenuItemOption,
  Modal,
  ModalBody,
  ModalCloseButton as ChakraModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  IconButton as ChakraIconButton,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { QRCodeSVG } from "qrcode.react";
import { BsQrCode } from "react-icons/bs";
import { SiCashapp, SiPatreon } from "react-icons/si";
import { FaKey, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { LuPencilLine, LuSun } from "react-icons/lu";
import { RiMoonClearFill } from "react-icons/ri";
import useSoundSettings from "../hooks/useSoundSettings";
import { selectSound, submitActionSound } from "../constants/sounds";

import VoiceOrb from "./VoiceOrb";

import { CloudCanvas } from "./CloudCanvas/CloudCanvas";
import CitizenshipIcon from "./CitizenshipIcon/CitizenshipIcon";
import { useDecentralizedIdentity } from "../hooks/useDecentralizedIdentity";
import { NDKKind } from "@nostr-dev-kit/ndk";
import { Buffer } from "buffer";
import { bech32 } from "bech32";
import RandomCharacter from "./RandomCharacter";
import { logEvent } from "firebase/analytics";
import { doc, updateDoc } from "firebase/firestore";
import { analytics, database } from "../firebaseResources/firebaseResources";
import useNostrWalletStore from "../hooks/useNostrWalletStore";
import { IdentityCard } from "./IdentityCard";
import useLanguage from "../hooks/useLanguage";
import {
  getLanguageDirection,
  getSupportLanguageOptions,
} from "../constants/languages";
import { syncDocumentLanguage } from "../utils/documentLanguage";

import { linksPageTranslations } from "../translations/linksPage";
import { useThemeStore } from "../useThemeStore";
import { APP_BUTTON_RADIUS, APP_SQUIRCLE_SHAPE } from "../theme";
import {
  nativeModalMotionProps,
  nativeOverlayMotionProps,
} from "../utils/modalMotion";
import { getThemeModeToggleProps } from "../utils/themeModeToggleStyle";

// Helper to check if running on localhost
const isLocalhost = () =>
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

const drift = keyframes`
  0% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-10px) translateX(5px); }
  100% { transform: translateY(0) translateX(0); }
`;

const heroRise = keyframes`
  from { opacity: 0; transform: translateY(28px); }
  to { opacity: 1; transform: translateY(0); }
`;

const orbitSpin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const gradientShift = keyframes`
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
`;

const animePanelIn = keyframes`
  from { opacity: 0; transform: translateY(28px) rotate(4deg) scale(0.94); }
  to { opacity: 1; transform: translateY(0) rotate(1.5deg) scale(1); }
`;

const actionLineRush = keyframes`
  0% { background-position: 0 0; opacity: 0.32; }
  50% { opacity: 0.58; }
  100% { background-position: 96px 0; opacity: 0.32; }
`;

const petalFall = keyframes`
  0% { transform: translate3d(0, -12vh, 0) rotate(0deg); opacity: 0; }
  10% { opacity: 0.72; }
  88% { opacity: 0.55; }
  100% { transform: translate3d(13vw, 112vh, 0) rotate(540deg); opacity: 0; }
`;

const stickerBounce = keyframes`
  0%, 100% { transform: translateY(0) rotate(var(--sticker-rotate)); }
  50% { transform: translateY(-7px) rotate(var(--sticker-rotate)); }
`;

const patreonLevitate = keyframes`
  0%, 100% { transform: translateY(3px) rotate(-4deg) scale(0.98); }
  45% { transform: translateY(-9px) rotate(3deg) scale(1.03); }
  72% { transform: translateY(-3px) rotate(0deg) scale(1); }
`;

const patreonAura = keyframes`
  0% { transform: rotate(0deg) scale(0.9); opacity: 0.42; }
  50% { transform: rotate(180deg) scale(1.08); opacity: 0.7; }
  100% { transform: rotate(360deg) scale(0.9); opacity: 0.42; }
`;

const patreonSpark = keyframes`
  0%, 100% { transform: translate3d(0, 5px, 0) scale(0.7); opacity: 0.25; }
  45% { transform: translate3d(0, -8px, 0) scale(1.2); opacity: 1; }
`;

const patreonShadowBreath = keyframes`
  0%, 100% { transform: translateX(-50%) scaleX(0.82); opacity: 0.28; }
  45% { transform: translateX(-50%) scaleX(1.12); opacity: 0.16; }
`;

const VOICE_ORB_STATES = ["idle", "listening", "speaking"];

const pickRandomVoiceOrbState = () =>
  VOICE_ORB_STATES[Math.floor(Math.random() * VOICE_ORB_STATES.length)];

const HERO_COPY = {
  en: {
    eyebrow: "SHEILFER'S LITTLE UNIVERSE",
    titleLead: "Create scholarships",
    titleAccent: "with learning.",
    body: "I design ambitious little worlds for learning, building, and making everyday life feel more possible.",
    explore: "Explore the universe",
    workLabel: "Selected creations",
    workTitle: "Choose your next story.",
    workBody: "Four playful tools, each with its own color, character, and energy.",
  },
  es: {
    eyebrow: "EL PEQUEÑO UNIVERSO DE SHEILFER",
    titleLead: "Herramientas divertidas para",
    titleAccent: "mentes curiosas.",
    body: "Diseño pequeños mundos ambiciosos para aprender, crear y hacer que la vida cotidiana se sienta más posible.",
    explore: "Explorar el universo",
    workLabel: "Creaciones seleccionadas",
    workTitle: "Cuatro ideas. Cuatro mundos.",
    workBody: "Cada proyecto nace de un problema real y se convierte en su propia experiencia divertida.",
  },
  pt: {
    eyebrow: "O PEQUENO UNIVERSO DE SHEILFER",
    titleLead: "Ferramentas divertidas para",
    titleAccent: "mentes curiosas.",
    body: "Crio pequenos mundos ambiciosos para aprender, construir e tornar a vida cotidiana mais possível.",
    explore: "Explorar o universo",
    workLabel: "Criações selecionadas",
    workTitle: "Quatro ideias. Quatro mundos.",
    workBody: "Cada projeto começa com um problema real e cresce como uma experiência única e divertida.",
  },
  it: {
    eyebrow: "IL PICCOLO UNIVERSO DI SHEILFER",
    titleLead: "Strumenti giocosi per",
    titleAccent: "menti curiose.",
    body: "Creo piccoli mondi ambiziosi per imparare, costruire e rendere la vita quotidiana più possibile.",
    explore: "Esplora l'universo",
    workLabel: "Creazioni selezionate",
    workTitle: "Quattro idee. Quattro mondi.",
    workBody: "Ogni progetto nasce da un problema reale e cresce in un'esperienza tutta sua.",
  },
  fr: {
    eyebrow: "LE PETIT UNIVERS DE SHEILFER",
    titleLead: "Des outils ludiques pour",
    titleAccent: "les esprits curieux.",
    body: "Je crée de petits mondes ambitieux pour apprendre, construire et rendre le quotidien plus ouvert.",
    explore: "Explorer l'univers",
    workLabel: "Créations choisies",
    workTitle: "Quatre idées. Quatre mondes.",
    workBody: "Chaque projet part d'un vrai problème et devient une expérience ludique à part entière.",
  },
  de: {
    eyebrow: "SHEILFERS KLEINES UNIVERSUM",
    titleLead: "Verspielte Werkzeuge für",
    titleAccent: "neugierige Köpfe.",
    body: "Ich gestalte ambitionierte kleine Welten zum Lernen, Bauen und für einen Alltag voller Möglichkeiten.",
    explore: "Universum entdecken",
    workLabel: "Ausgewählte Kreationen",
    workTitle: "Vier Ideen. Vier Welten.",
    workBody: "Jedes Projekt beginnt mit einem echten Problem und wächst zu einem eigenen Erlebnis.",
  },
  ja: {
    eyebrow: "SHEILFERの小さな宇宙",
    titleLead: "好奇心のための",
    titleAccent: "遊び心あるツール。",
    body: "学び、創り、毎日の可能性を広げる、小さくて壮大な世界をデザインしています。",
    explore: "宇宙を探索する",
    workLabel: "選ばれた作品",
    workTitle: "4つのアイデア。4つの世界。",
    workBody: "それぞれのプロジェクトは現実の課題から始まり、独自の楽しい体験へと育ちます。",
  },
  hi: {
    eyebrow: "शेल्फ़र का छोटा ब्रह्मांड",
    titleLead: "जिज्ञासु दिमागों के लिए",
    titleAccent: "मनोरंजक साधन।",
    body: "मैं सीखने, बनाने और रोज़मर्रा की ज़िंदगी में नई संभावनाएँ जगाने वाले छोटे संसार बनाता हूँ।",
    explore: "ब्रह्मांड देखें",
    workLabel: "चुनिंदा रचनाएँ",
    workTitle: "चार विचार। चार संसार।",
    workBody: "हर परियोजना एक वास्तविक समस्या से शुरू होकर अपने अनोखे अनुभव में बदलती है।",
  },
  ar: {
    eyebrow: "عالم شيلفر الصغير",
    titleLead: "أدوات مرحة من أجل",
    titleAccent: "العقول الفضولية.",
    body: "أصمم عوالم صغيرة وطموحة للتعلم والبناء وجعل الحياة اليومية مليئة بالإمكانات.",
    explore: "استكشف العالم",
    workLabel: "إبداعات مختارة",
    workTitle: "أربع أفكار. أربعة عوالم.",
    workBody: "يبدأ كل مشروع بمشكلة حقيقية وينمو ليصبح تجربة مرحة خاصة به.",
  },
  zh: {
    eyebrow: "SHEILFER的小宇宙",
    titleLead: "为好奇心打造的",
    titleAccent: "有趣工具。",
    body: "我设计充满雄心的小世界，让学习、创造和日常生活拥有更多可能。",
    explore: "探索这个宇宙",
    workLabel: "精选作品",
    workTitle: "四个想法。四个世界。",
    workBody: "每个项目都从真实问题出发，成长为独具个性的有趣体验。",
  },
};

const PROFILE_HERO_COPY = {
  en: { editProfile: "Edit profile", friend: "friend!" },
  es: { editProfile: "Editar perfil", friend: "¡amigo!" },
  pt: { editProfile: "Editar perfil", friend: "amigo!" },
  it: { editProfile: "Modifica profilo", friend: "amico!" },
  fr: { editProfile: "Modifier le profil", friend: "mon ami !" },
  de: { editProfile: "Profil bearbeiten", friend: "Freund!" },
  ja: { editProfile: "プロフィールを編集", friend: "友だち！" },
  hi: { editProfile: "प्रोफ़ाइल बदलें", friend: "दोस्त!" },
  ar: { editProfile: "تعديل الملف", friend: "يا صديقي!" },
  zh: { editProfile: "编辑个人资料", friend: "朋友！" },
};

const APP_PAGE_BG = "var(--app-page-bg)";
const APP_SURFACE = "var(--app-surface)";
const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_BORDER_STRONG = "var(--app-border-strong)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_TEXT_MUTED = "var(--app-text-muted)";
const APP_SHADOW = "var(--app-shadow-soft)";

const BUTTON_SQUIRCLE_RADIUS = APP_BUTTON_RADIUS;
const BUTTON_SQUIRCLE_SHAPE = APP_SQUIRCLE_SHAPE;

const withSquircleCorners = (Component, displayName) => {
  const SquircleComponent = React.forwardRef(function SquircleComponent(
    { style, ...props },
    ref,
  ) {
    return (
      <Component
        ref={ref}
        {...props}
        borderRadius={BUTTON_SQUIRCLE_RADIUS}
        style={{ ...style, cornerShape: BUTTON_SQUIRCLE_SHAPE }}
      />
    );
  });

  SquircleComponent.displayName = displayName;
  return SquircleComponent;
};

const Button = withSquircleCorners(ChakraButton, "LinksSquircleButton");
const ModalCloseButton = withSquircleCorners(
  ChakraModalCloseButton,
  "LinksSquircleModalCloseButton",
);
const AccordionButton = withSquircleCorners(
  ChakraAccordionButton,
  "LinksSquircleAccordionButton",
);

const SUPPORT_LANGUAGE_FLAG_SWATCHES = {
  en: {
    bg: "linear-gradient(180deg, #b22234 0 7.7%, #fff 7.7% 15.4%, #b22234 15.4% 23.1%, #fff 23.1% 30.8%, #b22234 30.8% 38.5%, #fff 38.5% 46.2%, #b22234 46.2% 53.9%, #fff 53.9% 61.6%, #b22234 61.6% 69.3%, #fff 69.3% 77%, #b22234 77% 84.7%, #fff 84.7% 92.4%, #b22234 92.4% 100%)",
    canton: "#3c3b6e",
  },
  es: {
    bg: "linear-gradient(90deg, #006847 0 33.33%, #fff 33.33% 66.66%, #ce1126 66.66% 100%)",
    emblem: "#c79a2b",
  },
  pt: {
    bg: "#009b3a",
    diamond: "#ffdf00",
    orb: "#002776",
    band: "rgba(255,255,255,0.92)",
  },
  fr: {
    bg: "linear-gradient(90deg, #0055a4 0 33.33%, #fff 33.33% 66.66%, #ef4135 66.66% 100%)",
  },
  it: {
    bg: "linear-gradient(90deg, #009246 0 33.33%, #fff 33.33% 66.66%, #ce2b37 66.66% 100%)",
  },
  de: {
    bg: "linear-gradient(180deg, #000000 0 33.33%, #dd0000 33.33% 66.66%, #ffce00 66.66% 100%)",
  },
  hi: {
    bg: "linear-gradient(180deg, #ff9933 0 33.33%, #fff 33.33% 66.66%, #138808 66.66% 100%)",
    chakra: "#1a4ba0",
    chakraSize: "10px",
  },
  zh: {
    bg: "#de2910",
    emblem: "#ffde00",
    emblemSize: "10px",
  },
  ja: {
    bg: "linear-gradient(180deg, #ffffff 0%, #ffffff 100%)",
    emblem: "#bc002d",
    emblemSize: "12px",
  },
  ar: {
    bg: "linear-gradient(180deg, #ce1126 0 33.33%, #ffffff 33.33% 66.66%, #000000 66.66% 100%)",
    emblem: "#c9a227",
    emblemSize: "10px",
  },
};

const getTopControlProps = (isLightTheme) => ({
  bg: "transparent",
  color: isLightTheme ? "#33291f" : "rgba(255, 255, 255, 0.92)",
  borderColor: isLightTheme
    ? "rgba(77, 58, 36, 0.34)"
    : "rgba(148, 163, 184, 0.26)",
  boxShadow: isLightTheme ? "none" : "0 10px 24px rgba(0, 0, 0, 0.22)",
  backdropFilter: "blur(20px)",
  _hover: {
    bg: isLightTheme ? "rgba(77, 58, 36, 0.08)" : "rgba(255, 255, 255, 0.07)",
  },
  _active: {
    bg: isLightTheme ? "rgba(77, 58, 36, 0.12)" : "rgba(255, 255, 255, 0.1)",
  },
});

const SupportLanguageFlagSwatch = ({ value }) => {
  const flag =
    SUPPORT_LANGUAGE_FLAG_SWATCHES[value] || SUPPORT_LANGUAGE_FLAG_SWATCHES.en;

  return (
    <Box
      as="span"
      aria-hidden="true"
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
      w="24px"
      h="24px"
      flexShrink={0}
      lineHeight="0"
      overflow="hidden"
      rounded="full"
      bg={flag.bg}
      boxShadow="0 0 0 1px rgba(15,23,42,0.16), inset 0 0 0 1px rgba(255,255,255,0.16)"
      _before={
        flag.canton
          ? {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              w: "52%",
              h: "54%",
              bg: flag.canton,
            }
          : undefined
      }
      _after={
        flag.emblem && !flag.orb
          ? {
              content: '""',
              position: "absolute",
              top: "50%",
              left: "50%",
              w: flag.emblemSize || "4px",
              h: flag.emblemSize || "4px",
              rounded: "full",
              bg: flag.emblem,
              transform: "translate(-50%, -50%)",
            }
          : undefined
      }
    >
      {flag.diamond ? (
        <Box
          as="span"
          position="absolute"
          top="50%"
          left="50%"
          w="66%"
          h="66%"
          bg={flag.diamond}
          transform="translate(-50%, -50%) rotate(45deg)"
          borderRadius="sm"
        />
      ) : null}
      {flag.orb ? (
        <Box
          as="span"
          position="absolute"
          top="50%"
          left="50%"
          w="44%"
          h="44%"
          bg={flag.orb}
          borderRadius="full"
          transform="translate(-50%, -50%)"
          overflow="hidden"
        >
          {flag.band ? (
            <Box
              as="span"
              position="absolute"
              top="52%"
              left="50%"
              w="135%"
              h="2px"
              bg={flag.band}
              transform="translate(-50%, -50%) rotate(14deg)"
              opacity={0.95}
            />
          ) : null}
        </Box>
      ) : null}
      {flag.chakra ? (
        <Box
          as="span"
          position="absolute"
          top="50%"
          left="50%"
          w={flag.chakraSize || "10px"}
          h={flag.chakraSize || "10px"}
          transform="translate(-50%, -50%)"
          borderRadius="full"
          border="1px solid"
          borderColor={flag.chakra}
          bg="rgba(255,255,255,0.92)"
          backgroundImage={[
            "linear-gradient(90deg, transparent 47%, var(--chakra-wheel-color) 47% 53%, transparent 53%)",
            "linear-gradient(0deg, transparent 47%, var(--chakra-wheel-color) 47% 53%, transparent 53%)",
            "linear-gradient(45deg, transparent 48%, var(--chakra-wheel-color) 48% 52%, transparent 52%)",
            "linear-gradient(-45deg, transparent 48%, var(--chakra-wheel-color) 48% 52%, transparent 52%)",
          ].join(", ")}
          sx={{ "--chakra-wheel-color": flag.chakra }}
        >
          <Box
            as="span"
            position="absolute"
            top="50%"
            left="50%"
            w="2px"
            h="2px"
            borderRadius="full"
            bg={flag.chakra}
            transform="translate(-50%, -50%)"
          />
        </Box>
      ) : null}
    </Box>
  );
};

const LanguageFlagIcon = ({ option, value }) => {
  const renderedFlag = option?.renderFlag?.() || option?.flag;

  return (
    <Box
      as="span"
      aria-hidden="true"
      display="flex"
      alignItems="center"
      justifyContent="center"
      w="24px"
      h="24px"
      flexShrink={0}
      lineHeight="0"
      verticalAlign="middle"
      sx={{
        "& svg": {
          display: "block",
          width: "24px",
          height: "24px",
        },
      }}
    >
      {renderedFlag || (
        <SupportLanguageFlagSwatch value={value || option?.value} />
      )}
    </Box>
  );
};

const LanguageMenuFixed = ({
  language,
  onSelect,
  playSound,
  translations,
  isLightTheme = false,
}) => {
  const activeLanguage = language || "en";
  const menuDirection = getLanguageDirection(activeLanguage);
  const topControlProps = getTopControlProps(isLightTheme);
  const langOptions = getSupportLanguageOptions({
    ui: translations,
    uiLang: activeLanguage,
  });
  const selected =
    langOptions.find((o) => o.value === activeLanguage) ||
    langOptions.find((o) => o.value === "en") ||
    langOptions[0];

  return (
    <Box>
      <Menu placement="bottom-start">
        <MenuButton
          as={ChakraButton}
          type="button"
          aria-label={`Select language${selected?.label ? `: ${selected.label}` : ""}`}
          size="sm"
          minW="36px"
          w="36px"
          h="36px"
          p={0}
          lineHeight="0"
          position="relative"
          borderRadius="12px"
          style={{ cornerShape: BUTTON_SQUIRCLE_SHAPE }}
          border="1px solid"
          {...topControlProps}
        >
          <Box
            as="span"
            position="absolute"
            inset={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
            pointerEvents="none"
          >
            <LanguageFlagIcon option={selected} value={activeLanguage} />
          </Box>
        </MenuButton>
        <MenuList
          dir={menuDirection}
          bg={APP_SURFACE_ELEVATED}
          borderColor={APP_BORDER}
          boxShadow={APP_SHADOW}
          minW="160px"
          maxH="300px"
          overflowY="auto"
          py={1}
          zIndex={122}
          sx={{
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: APP_SURFACE,
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: APP_BORDER_STRONG,
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: APP_TEXT_MUTED,
            },
          }}
        >
          <MenuOptionGroup
            value={activeLanguage}
            type="radio"
            onChange={(val) => {
              playSound?.();
              onSelect(val);
            }}
          >
            {langOptions.map((opt) => (
              <MenuItemOption
                key={opt.value}
                value={opt.value}
                bg="transparent"
                _hover={{ bg: APP_SURFACE_MUTED }}
                _checked={{ fontWeight: "bold" }}
                fontSize="sm"
                fontFamily="monospace"
              >
                <HStack spacing={2} justify="flex-start">
                  <LanguageFlagIcon option={opt} value={opt.value} />
                  <Text
                    color={APP_TEXT_PRIMARY}
                    textAlign={menuDirection === "rtl" ? "right" : "left"}
                    flex="1"
                    sx={{ unicodeBidi: "plaintext" }}
                  >
                    {opt.label}
                  </Text>
                </HStack>
              </MenuItemOption>
            ))}
          </MenuOptionGroup>
        </MenuList>
      </Menu>
    </Box>
  );
};

const ThemeModeToggle = ({ themeMode, onModeChange }) => {
  const isDark = themeMode === "dark";
  const isLightTheme = !isDark;
  const themeToggleProps = getThemeModeToggleProps(isLightTheme);
  const nextMode = isDark ? "light" : "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <ChakraIconButton
      type="button"
      aria-label={label}
      title={label}
      onClick={() => onModeChange(nextMode)}
      icon={
        isDark ? (
          <LuSun size={18} color="#fffaf0" strokeWidth={2.35} />
        ) : (
          <RiMoonClearFill size={18} />
        )
      }
      size="sm"
      minW="36px"
      w="36px"
      h="36px"
      border="1px solid"
      {...themeToggleProps}
      borderRadius="12px"
      style={{ cornerShape: BUTTON_SQUIRCLE_SHAPE }}
      boxShadow="none"
    />
  );
};

function AnimeBackdrop({ isLightTheme = false }) {
  const petals = [
    [8, 1, 9, 0],
    [18, 0.7, 12, -4],
    [31, 0.9, 14, -7],
    [47, 0.65, 10, -2],
    [63, 1, 13, -9],
    [76, 0.8, 11, -5],
    [91, 0.7, 15, -11],
  ];
  return (
    <Box
      position="absolute"
      inset={0}
      overflow="hidden"
      pointerEvents="none"
      aria-hidden="true"
    >
      <Box
        position="absolute"
        inset="0"
        opacity={isLightTheme ? 0.12 : 0.09}
        bgImage={
          isLightTheme
            ? "radial-gradient(circle, #241c2d 1.25px, transparent 1.35px)"
            : "radial-gradient(circle, #ff6f91 1.2px, transparent 1.35px)"
        }
        bgSize="18px 18px"
        maskImage="linear-gradient(125deg, black 0%, transparent 46%, black 100%)"
      />
      <Box
        position="absolute"
        top="-20vw"
        right="-12vw"
        w="70vw"
        h="70vw"
        borderRadius="full"
        border={isLightTheme ? "3px solid rgba(36,28,45,0.08)" : "3px solid rgba(255,255,255,0.08)"}
        bgImage={
          isLightTheme
            ? "radial-gradient(circle, rgba(255,92,122,0.24) 0 46%, transparent 47%), radial-gradient(circle, #cc355f 1.5px, transparent 1.6px)"
            : "radial-gradient(circle, rgba(255,83,125,0.18) 0 46%, transparent 47%), radial-gradient(circle, #ff668d 1.5px, transparent 1.6px)"
        }
        bgSize="100% 100%, 14px 14px"
        opacity={0.72}
      />
      <Box
        position="absolute"
        inset="0"
        bgImage={
          isLightTheme
            ? "repeating-linear-gradient(116deg, transparent 0 44px, rgba(36,28,45,0.055) 45px 47px, transparent 48px 78px)"
            : "repeating-linear-gradient(116deg, transparent 0 44px, rgba(255,255,255,0.045) 45px 47px, transparent 48px 78px)"
        }
        animation={`${actionLineRush} 9s linear infinite`}
      />
      {petals.map(([left, scale, duration, delay], index) => (
        <Box
          key={left}
          position="absolute"
          top="-5%"
          left={`${left}%`}
          w={`${11 * scale}px`}
          h={`${17 * scale}px`}
          borderRadius="90% 10% 75% 25%"
          bg={isLightTheme ? "rgba(218,61,105,0.42)" : "rgba(255,105,145,0.58)"}
          border={isLightTheme ? "1px solid rgba(80,32,52,0.14)" : "1px solid rgba(255,255,255,0.18)"}
          animation={`${petalFall} ${duration}s ${delay}s linear infinite`}
          sx={{
            "@media (prefers-reduced-motion: reduce)": {
              animation: "none",
              display: index > 2 ? "none" : "block",
            },
          }}
        />
      ))}
      <Box
        position="absolute"
        inset="0"
        boxShadow={
          isLightTheme
            ? "inset 0 0 180px rgba(85,55,43,0.12)"
            : "inset 0 0 220px rgba(0,0,0,0.56)"
        }
      />
    </Box>
  );
}

function PatreonMotionMark({ isLightTheme = false }) {
  const logoPath =
    "M53 132 C38 116 39 88 42 66 C45 39 62 24 89 23 C115 22 137 35 138 56 C139 75 125 88 103 91 C87 93 82 106 76 122 C71 137 61 141 53 132 Z";
  const morphPaths = [
    logoPath,
    "M50 129 C36 112 42 82 46 61 C51 36 70 20 96 25 C120 29 139 42 134 63 C129 83 112 88 96 94 C82 99 83 114 73 128 C65 140 57 138 50 129 Z",
    "M56 134 C40 119 36 93 43 70 C50 44 63 26 87 22 C112 18 135 34 140 53 C145 72 129 87 105 90 C88 92 80 106 78 121 C76 136 64 142 56 134 Z",
    logoPath,
  ].join(";");

  return (
    <Box
      role="img"
      aria-label="Animated Patreon symbol"
      w={{ base: "190px", md: "220px" }}
      h={{ base: "190px", md: "220px" }}
      position="relative"
      display="flex"
      alignItems="center"
      justifyContent="center"
      isolation="isolate"
      sx={{
        "@media (prefers-reduced-motion: reduce)": {
          "& animate": { display: "none" },
        },
      }}
    >
      <Box
        position="absolute"
        inset="9%"
        borderRadius="43% 57% 64% 36% / 48% 37% 63% 52%"
        bg={
          isLightTheme
            ? "conic-gradient(from 20deg, rgba(255,92,138,0.3), rgba(255,184,76,0.22), rgba(123,97,255,0.28), rgba(255,92,138,0.3))"
            : "conic-gradient(from 20deg, rgba(255,105,180,0.36), rgba(255,184,76,0.2), rgba(123,97,255,0.4), rgba(255,105,180,0.36))"
        }
        filter="blur(18px)"
        animation={`${patreonAura} 11s linear infinite`}
      />
      <Box
        position="absolute"
        inset="18%"
        borderRadius="full"
        border="1px dashed"
        borderColor={isLightTheme ? "rgba(209,61,116,0.28)" : "rgba(255,116,170,0.38)"}
        animation={`${orbitSpin} 18s linear infinite reverse`}
      />
      <Box
        position="absolute"
        left="50%"
        bottom="13%"
        w="72px"
        h="14px"
        borderRadius="full"
        bg={isLightTheme ? "rgba(120,42,75,0.24)" : "rgba(0,0,0,0.46)"}
        filter="blur(9px)"
        animation={`${patreonShadowBreath} 5.2s ease-in-out infinite`}
      />

      <Box
        w="74%"
        h="74%"
        position="relative"
        zIndex={2}
        animation={`${patreonLevitate} 5.2s cubic-bezier(.45,.05,.35,1) infinite`}
        sx={{
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        }}
      >
        <svg
          viewBox="0 0 180 180"
          width="100%"
          height="100%"
          aria-hidden="true"
          focusable="false"
          style={{ overflow: "visible" }}
        >
          <defs>
            <linearGradient id="patreon-motion-gradient" x1="20%" y1="12%" x2="82%" y2="88%">
              <stop offset="0%" stopColor="#ffb44c" />
              <stop offset="28%" stopColor="#ff5c8a" />
              <stop offset="62%" stopColor="#d83bd2" />
              <stop offset="100%" stopColor="#6e61ff" />
            </linearGradient>
            <linearGradient id="patreon-edge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff9e6d" stopOpacity="0.9" />
              <stop offset="52%" stopColor="#ff4f9a" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#7968ff" stopOpacity="0.85" />
            </linearGradient>
            <radialGradient id="patreon-shine" cx="36%" cy="25%" r="72%">
              <stop offset="0%" stopColor="white" stopOpacity="0.72" />
              <stop offset="32%" stopColor="white" stopOpacity="0.16" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <filter id="patreon-logo-shadow" x="-60%" y="-60%" width="220%" height="240%">
              <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#8a286f" floodOpacity="0.38" />
            </filter>
          </defs>

          <path d={logoPath} fill="#781e75" opacity="0.72" transform="translate(4 8)" />
          <path
            d={logoPath}
            fill="url(#patreon-motion-gradient)"
            filter="url(#patreon-logo-shadow)"
          >
            <animate
              attributeName="d"
              dur="5.2s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0;0.36;0.7;1"
              keySplines="0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1"
              values={morphPaths}
            />
          </path>
          <path
            d={logoPath}
            fill="url(#patreon-shine)"
            stroke="url(#patreon-edge-gradient)"
            strokeWidth="2"
            opacity="0.72"
          >
            <animate
              attributeName="d"
              dur="5.2s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0;0.36;0.7;1"
              keySplines="0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1"
              values={morphPaths}
            />
          </path>
          <ellipse cx="79" cy="47" rx="22" ry="10" fill="white" opacity="0.16" transform="rotate(-18 79 47)" />
        </svg>
      </Box>

      {[
        { top: "19%", left: "12%", size: "7px", delay: "0s", color: "#ffb44c" },
        { top: "12%", right: "16%", size: "5px", delay: "1.1s", color: "#ff74aa" },
        { bottom: "24%", right: "9%", size: "8px", delay: "2.2s", color: "#8b7cff" },
        { bottom: "13%", left: "21%", size: "4px", delay: "3.2s", color: "#ff5c8a" },
      ].map((spark, index) => (
        <Box
          key={index}
          position="absolute"
          top={spark.top}
          bottom={spark.bottom}
          left={spark.left}
          right={spark.right}
          w={spark.size}
          h={spark.size}
          borderRadius="full"
          bg={spark.color}
          boxShadow={`0 0 14px ${spark.color}`}
          animation={`${patreonSpark} 3.8s ${spark.delay} ease-in-out infinite`}
        />
      ))}
    </Box>
  );
}

function LinkCard({
  title,
  description,
  href,
  visual,
  onLaunch,
  onLaunchSound,
  onLaunchEvent,
  launchAppText,
  secondaryAction,
  isLightTheme = false,
  textDirection = "ltr",
  accent = "#00ffff",
  accentSoft = "rgba(0, 255, 255, 0.18)",
  shadowAccent = "#08776f",
  buttonTextShadow = "0px 1px 2px rgba(7, 16, 29, 0.32)",
}) {
  const primaryActionColor = accent;
  const secondaryActionColor =
    isLightTheme && secondaryAction?.color === "#4da3ff"
      ? "#1d4ed8"
      : secondaryAction?.color || "#4da3ff";
  const descriptionAlign = textDirection === "rtl" ? "right" : "left";

  const primaryActionProps = onLaunch
    ? {
        as: "button",
        onClick: () => {
          onLaunchSound?.();
          onLaunchEvent?.();
          onLaunch?.();
        },
      }
    : {
        as: "a",
        href,
        target: "_blank",
        rel: "noopener noreferrer",
        onClick: () => {
          onLaunchSound?.();
          onLaunchEvent?.();
        },
      };

  const secondaryActionProps = secondaryAction?.onClick
    ? {
        as: "button",
        onClick: () => {
          onLaunchSound?.();
          secondaryAction.onEvent?.();
          secondaryAction.onClick?.();
        },
      }
    : {
        as: "a",
        href: secondaryAction?.href,
        target: "_blank",
        rel: "noopener noreferrer",
        onClick: () => {
          onLaunchSound?.();
          secondaryAction?.onEvent?.();
        },
      };

  return (
    <Box
      w="100%"
      h="100%"
      minH={{ base: "430px", md: "520px" }}
      bg={
        isLightTheme
          ? `linear-gradient(156deg, #fffaf0 0%, #fffaf0 68%, ${accentSoft} 68%, ${accentSoft} 100%)`
          : `linear-gradient(156deg, #121629 0%, #121629 68%, ${accentSoft} 68%, ${accentSoft} 100%)`
      }
      color={isLightTheme ? APP_TEXT_PRIMARY : "white"}
      border={{ base: "3px solid", md: "4px solid" }}
      borderColor={isLightTheme ? "#241c2d" : "#f7f1e8"}
      borderRadius={{ base: "24px", md: "32px" }}
      px={{ base: 5, md: 7 }}
      py={{ base: 6, md: 8 }}
      position="relative"
      overflow="hidden"
      isolation="isolate"
      boxShadow={
        isLightTheme
          ? `10px 12px 0 ${accent}, 18px 22px 0 rgba(36,28,45,0.1)`
          : `10px 12px 0 ${accent}, 18px 22px 0 rgba(0,0,0,0.34)`
      }
      transition="transform 320ms ease, box-shadow 320ms ease, border-color 320ms ease"
      _before={{
        content: '""',
        position: "absolute",
        inset: 0,
        bgImage: isLightTheme
          ? "radial-gradient(circle, rgba(36,28,45,0.22) 1.1px, transparent 1.2px)"
          : "radial-gradient(circle, rgba(255,255,255,0.2) 1.1px, transparent 1.2px)",
        bgSize: "12px 12px",
        opacity: 0.34,
        maskImage: "linear-gradient(140deg, black, transparent 52%)",
        zIndex: -1,
      }}
      _after={{
        content: '""',
        position: "absolute",
        width: "180px",
        height: "30px",
        top: "22px",
        insetInlineEnd: "-45px",
        bg: accent,
        opacity: 0.82,
        transform: "rotate(42deg)",
        pointerEvents: "none",
        zIndex: 0,
      }}
      _hover={{
        transform: "translate(-3px, -7px)",
        borderColor: accent,
        boxShadow: isLightTheme
          ? `14px 17px 0 ${accent}, 22px 28px 0 rgba(36,28,45,0.1)`
          : `14px 17px 0 ${accent}, 22px 28px 0 rgba(0,0,0,0.34)`,
      }}
      sx={{
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",
          "&:hover": { transform: "none" },
        },
      }}
    >
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        h="100%"
        gap={6}
        position="relative"
        zIndex={1}
      >
        <Box
          w="100%"
          minH={{ base: "190px", md: "235px" }}
          display="flex"
          justifyContent="center"
          alignItems="center"
          position="relative"
          borderRadius={{ base: "18px", md: "24px" }}
          border="2px solid"
          borderColor={isLightTheme ? "#241c2d" : "rgba(247,241,232,0.88)"}
          overflow="hidden"
          bg={accentSoft}
          _before={{
            content: '""',
            position: "absolute",
            inset: "-45%",
            bgImage: `repeating-conic-gradient(from 0deg, ${accent} 0deg 3deg, transparent 3deg 14deg)`,
            opacity: isLightTheme ? 0.17 : 0.21,
            animation: `${orbitSpin} 34s linear infinite`,
          }}
          _after={{
            content: '""',
            position: "absolute",
            w: { base: "145px", md: "184px" },
            h: { base: "145px", md: "184px" },
            borderRadius: "full",
            bg: isLightTheme ? "rgba(255,250,240,0.72)" : "rgba(8,11,24,0.68)",
            border: `2px solid ${accent}`,
          }}
        >
          <Box
            position="relative"
            zIndex={1}
            transform="scale(1.16)"
            animation={`${drift} 6s ease-in-out infinite`}
            sx={{
              "@media (prefers-reduced-motion: reduce)": { animation: "none" },
            }}
          >
            {visual}
          </Box>
        </Box>
        <VStack spacing={4} align={textDirection === "rtl" ? "flex-end" : "flex-start"}>
          <Heading
            fontSize={{ base: "2xl", md: "3xl" }}
            lineHeight="1.05"
            fontFamily="'DM Sans', sans-serif"
            letterSpacing="-0.045em"
            fontWeight="900"
            color={isLightTheme ? APP_TEXT_PRIMARY : "white"}
            textAlign={descriptionAlign}
            textShadow={isLightTheme ? "2px 2px 0 rgba(218,61,105,0.12)" : "2px 2px 0 rgba(255,112,151,0.15)"}
          >
            {title}
          </Heading>
          <Text
            color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}
            fontSize={{ base: "sm", md: "md" }}
            lineHeight="1.7"
            fontFamily="'DM Sans', sans-serif"
            dir={textDirection}
            textAlign={descriptionAlign}
            sx={{ unicodeBidi: "plaintext" }}
          >
            {description}
          </Text>
          <HStack spacing={3} align="center" justify="flex-start" flexWrap="wrap" pt={1}>
            <Button
              {...primaryActionProps}
              bg={primaryActionColor}
              borderColor={primaryActionColor}
              color="white"
              textShadow={buttonTextShadow}
              fontFamily="'DM Sans', sans-serif"
              fontWeight="800"
              size="md"
              px={6}
              minH="48px"
              rightIcon={<Text as="span" fontSize="lg">↗</Text>}
              boxShadow={`0px 4px 0px ${shadowAccent}`}
              _hover={{
                bg: primaryActionColor,
                borderColor: primaryActionColor,
                color: "white",
                textDecoration: "none",
                transform: "translateY(-1px)",
                boxShadow: `0px 4px 0px ${shadowAccent}`,
              }}
              _active={{
                bg: primaryActionColor,
                color: "white",
                transform: "translateY(3px)",
                boxShadow: `0px 1px 0px ${shadowAccent}`,
              }}
              _focus={{
                boxShadow: `0px 4px 0px ${shadowAccent}`,
              }}
              sx={{
                "&:visited": { color: "white" },
              }}
            >
              {launchAppText || "Launch app"}
            </Button>
            {secondaryAction ? (
              <Button
                {...secondaryActionProps}
                variant="outline"
                bg={isLightTheme ? APP_SURFACE_ELEVATED : undefined}
                borderColor={secondaryActionColor}
                color={secondaryActionColor}
                fontFamily="monospace"
                size="sm"
                px={6}
                py={4}
                minH="44px"
                _hover={{
                  bg: isLightTheme ? APP_SURFACE_MUTED : "transparent",
                  borderColor: secondaryActionColor,
                  color: secondaryActionColor,
                  textDecoration: "none",
                  opacity: 0.8,
                }}
                _active={{
                  bg: isLightTheme ? APP_SURFACE_MUTED : "transparent",
                  color: secondaryActionColor,
                }}
                _focus={{
                  boxShadow: "none",
                }}
                sx={{
                  "&:visited": { color: secondaryActionColor },
                }}
              >
                {secondaryAction.label}
              </Button>
            ) : null}
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}

function LinksHero({
  heroCopy,
  translations,
  isLightTheme,
  isRtl,
  directionalTextAlign,
  primaryAccent,
  profilePicture,
  randomCharacterKey,
  welcomeText,
  editProfileText,
  onProfileOpen,
  onAboutOpen,
  onSocialClick,
  languageControl,
  themeControl,
}) {
  const socialItems = [
    {
      label: "Instagram",
      icon: <FaInstagram size={20} />,
      bg: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 62%, #285AEB 92%)",
      url: "https://www.instagram.com/sheilfer",
    },
    {
      label: "LinkedIn",
      icon: <FaLinkedinIn size={16} />,
      bg: "#0A66C2",
      url: "https://www.linkedin.com/in/sheilfer",
    },
    {
      label: "Patreon",
      icon: <SiPatreon size={16} />,
      bg: "#111111",
      url: "https://subscribe.piyali.app/",
    },
  ];

  return (
    <Container maxW="container.xl" position="relative" zIndex={1}>
      <Box
        as="nav"
        display="flex"
        justifyContent="flex-end"
        alignItems="center"
        py={{ base: 4, md: 5 }}
        w="100%"
      >
        <HStack
          spacing={{ base: 2.5, md: 3 }}
          dir="ltr"
          px={{ base: 2.5, md: 3 }}
          py={{ base: 2, md: 1.5 }}
          borderRadius={{ base: "16px", md: "18px" }}
          bg={isLightTheme ? "rgba(255,250,240,0.9)" : "rgba(14,17,33,0.9)"}
          border={{ base: "2px solid", md: "3px solid" }}
          borderColor={isLightTheme ? "#241c2d" : "#f7f1e8"}
          boxShadow={isLightTheme ? "6px 7px 0 #d13d74" : "6px 7px 0 #d94b73"}
          backdropFilter="blur(18px)"
        >
          {socialItems.map((item) => (
            <Box
              key={item.label}
              as="button"
              type="button"
              aria-label={item.label}
              bg={item.bg}
              borderRadius="10px"
              w={{ base: "36px", md: "34px" }}
              h={{ base: "36px", md: "34px" }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="white"
              p={0}
              lineHeight="0"
              overflow="hidden"
              appearance="none"
              backgroundClip="padding-box"
              border="2px solid"
              borderColor={isLightTheme ? "#241c2d" : "rgba(247,241,232,0.88)"}
              boxShadow={isLightTheme ? "2px 3px 0 #241c2d" : "2px 3px 0 #050711"}
              transition="transform 180ms ease, box-shadow 180ms ease"
              _focusVisible={{ boxShadow: `0 0 0 3px ${primaryAccent}55` }}
              _hover={{
                transform: "translate(-1px, -2px) scale(1.04)",
                boxShadow: isLightTheme ? "3px 5px 0 #241c2d" : "3px 5px 0 #050711",
              }}
              onClick={() => onSocialClick(item.label.toLowerCase(), item.url)}
            >
              {item.icon}
            </Box>
          ))}
          {languageControl}
          {themeControl}
        </HStack>
      </Box>

      <Box
        minH={{ base: "auto", lg: "calc(100dvh - 92px)" }}
        display="grid"
        gridTemplateColumns={{ base: "1fr", lg: "minmax(0, 1.08fr) minmax(420px, 0.92fr)" }}
        alignItems="center"
        gap={{ base: 10, lg: 7 }}
        py={{ base: 10, md: 14, lg: 6 }}
      >
        <VStack
          align={isRtl ? "flex-end" : "flex-start"}
          spacing={{ base: 6, md: 7 }}
          textAlign={directionalTextAlign}
          animation={`${heroRise} 700ms cubic-bezier(.2,.8,.2,1) both`}
          sx={{ "@media (prefers-reduced-motion: reduce)": { animation: "none" } }}
        >
          <HStack
            spacing={{ base: 3, md: 4 }}
            flexWrap="wrap"
            justify={isRtl ? "flex-end" : "flex-start"}
            bg={isLightTheme ? "rgba(255,250,240,0.72)" : "rgba(15,18,35,0.72)"}
            borderInlineStart="5px solid"
            borderColor={isLightTheme ? "#d13d74" : "#ff6f91"}
            px={3}
            py={2}
          >
            <HStack spacing={3}>
              <Text
                fontFamily="monospace"
                fontSize={{ base: "xs", md: "sm" }}
                color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"}
              >
                {translations.welcome}, {welcomeText}
              </Text>
            </HStack>
            <ChakraButton
              onClick={onProfileOpen}
              leftIcon={<LuPencilLine size={15} strokeWidth={2.2} />}
              h="38px"
              minW="auto"
              px={4}
              py={0}
              borderRadius="full"
              bg={isLightTheme ? "#fffaf0" : "#171b31"}
              border="2px solid"
              borderColor={isLightTheme ? "#241c2d" : "rgba(247,241,232,0.9)"}
              color={primaryAccent}
              fontFamily="'DM Sans', sans-serif"
              fontSize="sm"
              fontWeight="700"
              lineHeight="1"
              boxShadow={isLightTheme ? "3px 4px 0 #241c2d" : "3px 4px 0 #050711"}
              transition="background 180ms ease, border-color 180ms ease, transform 180ms ease"
              _hover={{
                bg: isLightTheme ? "rgba(15,118,110,0.08)" : "rgba(86,240,216,0.1)",
                borderColor: primaryAccent,
                boxShadow: isLightTheme ? "4px 5px 0 #241c2d" : "4px 5px 0 #050711",
                transform: "translate(-1px, -1px)",
              }}
              _active={{
                bg: isLightTheme ? "rgba(15,118,110,0.12)" : "rgba(86,240,216,0.14)",
                transform: "translateY(0)",
                boxShadow: isLightTheme ? "1px 1px 0 #241c2d" : "1px 1px 0 #050711",
              }}
              _focusVisible={{ boxShadow: `0 0 0 3px ${primaryAccent}33` }}
            >
              {editProfileText}
            </ChakraButton>
          </HStack>

          <Heading
            as="h1"
            fontFamily="'DM Sans', sans-serif"
            fontSize={{ base: "clamp(3.35rem, 15.5vw, 5.6rem)", md: "clamp(5rem, 8.7vw, 8.4rem)" }}
            lineHeight="0.87"
            letterSpacing="-0.073em"
            fontWeight="900"
            maxW="920px"
            color={isLightTheme ? "#241c2d" : "#f7f1e8"}
            textShadow={isLightTheme ? "5px 6px 0 rgba(218,61,105,0.2)" : "5px 6px 0 rgba(255,103,143,0.2)"}
          >
            {heroCopy.titleLead}{" "}
            <Text
              as="span"
              display="inline"
              bgGradient={
                isLightTheme
                  ? "linear(to-r, #e34069, #f28b46, #d13d74, #385fd2)"
                  : "linear(to-r, #ff6f91, #ffb657, #ff77b7, #6ce5e8)"
              }
              bgClip="text"
              bgSize="220% 220%"
              animation={`${gradientShift} 8s ease infinite`}
            >
              {heroCopy.titleAccent}
            </Text>
          </Heading>

          <Text
            maxW="650px"
            fontFamily="'DM Sans', sans-serif"
            fontSize={{ base: "lg", md: "2xl" }}
            lineHeight="1.55"
            color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"}
          >
            {heroCopy.body}
          </Text>

          <HStack spacing={3} flexWrap="wrap" justify={isRtl ? "flex-end" : "flex-start"}>
            <Button
              onClick={onAboutOpen}
              variant="outline"
              fontFamily="'DM Sans', sans-serif"
              fontWeight="800"
              size="lg"
              h="56px"
              px={6}
              bg={isLightTheme ? "#fffaf0" : "#171b31"}
              border="2px solid"
              borderColor={isLightTheme ? "#241c2d" : "#f7f1e8"}
              boxShadow={isLightTheme ? "5px 6px 0 #d13d74" : "5px 6px 0 #d94b73"}
              _hover={{
                bg: isLightTheme ? "#fffaf0" : "#171b31",
                transform: "translate(-1px, -2px)",
                boxShadow: isLightTheme ? "7px 8px 0 #d13d74" : "7px 8px 0 #d94b73",
              }}
            >
              {translations.about} ↗
            </Button>
          </HStack>

        </VStack>

        <HeroKeyArt
          isLightTheme={isLightTheme}
          profilePicture={profilePicture}
          randomCharacterKey={randomCharacterKey}
        />
      </Box>
    </Container>
  );
}

function HeroKeyArt({ isLightTheme, profilePicture, randomCharacterKey }) {
  const storyStickers = [
    {
      label: "PIYALI",
      top: "8%",
      left: "-1%",
      color: "#0f9f91",
      rotate: "-7deg",
    },
    {
      label: "ROBOTS BUILDING EDUCATION",
      lines: ["ROBOTS", "BUILDING", "EDUCATION"],
      top: "18%",
      right: "-5%",
      color: "#d97706",
      rotate: "6deg",
    },
    {
      label: "FREE DUAL CITIZEN PLANNER",
      lines: ["FREE", "DUAL CITIZEN", "PLANNER"],
      bottom: "14%",
      left: "-6%",
      color: isLightTheme ? "#3158a6" : "#9bbcff",
      rotate: "4deg",
    },
    {
      label: "PATREON",
      bottom: "6%",
      right: "3%",
      color: "#d13d74",
      rotate: "-5deg",
    },
  ];

  return (
    <Box
      w="100%"
      maxW={{ base: "520px", lg: "590px" }}
      mx="auto"
      aspectRatio="1"
      position="relative"
      display="flex"
      alignItems="center"
      justifyContent="center"
      animation={`${animePanelIn} 850ms 120ms cubic-bezier(.2,.8,.2,1) both`}
      sx={{ "@media (prefers-reduced-motion: reduce)": { animation: "none" } }}
    >
      <Box
        position="absolute"
        inset={{ base: "9% 8% 8% 9%", md: "7% 9% 8% 8%" }}
        borderRadius={{ base: "28px", md: "42px" }}
        transform="rotate(1.5deg)"
        border={{ base: "3px solid", md: "4px solid" }}
        borderColor={isLightTheme ? "#241c2d" : "#f7f1e8"}
        bg={
          isLightTheme
            ? "linear-gradient(145deg, #ff7b96 0%, #ffb45d 48%, #fff2d7 100%)"
            : "linear-gradient(145deg, #e23d68 0%, #713c8d 52%, #142947 100%)"
        }
        boxShadow={
          isLightTheme
            ? "12px 14px 0 #241c2d, 22px 26px 0 rgba(218,61,105,0.25)"
            : "12px 14px 0 #050711, 22px 26px 0 rgba(255,103,143,0.28)"
        }
        overflow="hidden"
        _before={{
          content: '""',
          position: "absolute",
          inset: 0,
          bgImage: isLightTheme
            ? "radial-gradient(circle, rgba(36,28,45,0.28) 1.4px, transparent 1.5px)"
            : "radial-gradient(circle, rgba(255,255,255,0.22) 1.4px, transparent 1.5px)",
          bgSize: "13px 13px",
          opacity: 0.42,
          maskImage: "linear-gradient(145deg, black, transparent 68%)",
        }}
        _after={{
          content: '""',
          position: "absolute",
          inset: "-10% -35% -10% 48%",
          bgImage: isLightTheme
            ? "repeating-linear-gradient(112deg, transparent 0 14px, rgba(36,28,45,0.18) 15px 17px, transparent 18px 26px)"
            : "repeating-linear-gradient(112deg, transparent 0 14px, rgba(255,255,255,0.18) 15px 17px, transparent 18px 26px)",
          transform: "skewX(-12deg)",
        }}
      >
        <Box
          position="absolute"
          top={{ base: 4, md: 6 }}
          left={{ base: 5, md: 7 }}
          zIndex={2}
          px={3}
          py={1}
          transform="rotate(-4deg)"
          bg={isLightTheme ? "#241c2d" : "#f7f1e8"}
          color={isLightTheme ? "#fff9ed" : "#111525"}
          fontFamily="monospace"
          fontWeight="900"
          fontSize={{ base: "10px", md: "xs" }}
          letterSpacing="0.18em"
        >
          ORIGINAL STORY
        </Box>
        <Text
          position="absolute"
          insetInlineEnd={{ base: 3, md: 5 }}
          bottom={{ base: 2, md: 3 }}
          zIndex={2}
          fontFamily="'DM Sans', sans-serif"
          fontSize={{ base: "4xl", md: "6xl" }}
          fontWeight="900"
          lineHeight="0.8"
          color="rgba(255,255,255,0.3)"
          transform="rotate(-8deg)"
        >
          ドキッ
        </Text>
      </Box>
      <Box
        w={{ base: "52%", md: "50%" }}
        aspectRatio="1"
        borderRadius="48% 52% 46% 54% / 56% 44% 56% 44%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg={isLightTheme ? "rgba(255,249,237,0.92)" : "rgba(12,16,31,0.9)"}
        border={{ base: "3px solid", md: "4px solid" }}
        borderColor={isLightTheme ? "#241c2d" : "#f7f1e8"}
        boxShadow={isLightTheme ? "7px 8px 0 rgba(36,28,45,0.92)" : "7px 8px 0 #050711"}
        position="relative"
        zIndex={2}
        overflow="hidden"
        transform="translateY(3%) rotate(-2deg)"
        _before={{
          content: '""',
          position: "absolute",
          inset: 0,
          bgImage: isLightTheme
            ? "radial-gradient(circle, rgba(218,61,105,0.28) 1.2px, transparent 1.3px)"
            : "radial-gradient(circle, rgba(255,112,151,0.28) 1.2px, transparent 1.3px)",
          bgSize: "10px 10px",
          opacity: 0.55,
        }}
      >
        {profilePicture ? (
          <img
            src={profilePicture}
            alt="Profile"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              position: "relative",
              zIndex: 1,
            }}
          />
        ) : (
          <Box position="relative" zIndex={1} transform={{ base: "scale(0.92)", md: "scale(1.08)" }}>
            <RandomCharacter
              notSoRandomCharacter={randomCharacterKey}
              width="170px"
              containerHeight={210}
            />
          </Box>
        )}
      </Box>
      {storyStickers.map((item) => (
        <Box
          key={item.label}
          position="absolute"
          top={item.top}
          bottom={item.bottom}
          left={item.left}
          right={item.right}
          px={{ base: 3, md: 4 }}
          py={{ base: 2, md: 3 }}
          borderRadius={{ base: "12px", md: "16px" }}
          bg={item.color}
          border={{ base: "2px solid", md: "3px solid" }}
          borderColor={isLightTheme ? "#241c2d" : "#f7f1e8"}
          boxShadow={isLightTheme ? "5px 6px 0 #241c2d" : "5px 6px 0 #050711"}
          zIndex={3}
          animation={`${stickerBounce} ${5.4 + item.label.length * 0.08}s ease-in-out infinite`}
          style={{ "--sticker-rotate": item.rotate }}
          sx={{
            "@media (prefers-reduced-motion: reduce)": {
              animation: "none",
              transform: `rotate(${item.rotate})`,
            },
          }}
        >
          <Text
            fontFamily="monospace"
            fontSize={{ base: "8px", md: "xs" }}
            fontWeight="bold"
            lineHeight={item.lines ? "1.35" : "1"}
            letterSpacing="0.11em"
            textAlign="center"
            whiteSpace={item.lines ? "normal" : "nowrap"}
            color="white"
            textShadow="0 1px 1px rgba(0,0,0,0.32)"
          >
            {item.lines
              ? item.lines.map((line) => (
                  <Text as="span" key={line} display="block">
                    {line}
                  </Text>
                ))
              : item.label}
          </Text>
        </Box>
      ))}
    </Box>
  );
}

function ProjectShowcase({
  heroCopy,
  links,
  isLightTheme,
  isRtl,
  directionalTextAlign,
  pageDirection,
  primaryAccent,
  onLaunchSound,
  onLaunchEvent,
}) {
  return (
    <Container maxW="container.xl" position="relative" zIndex={1} pb={{ base: 20, md: 28 }}>
      <Box id="projects" pt={{ base: 16, md: 24 }} scrollMarginTop="24px">
        <Box
          display="grid"
          gridTemplateColumns={{ base: "1fr", md: "minmax(0, 0.8fr) minmax(0, 1.2fr)" }}
          gap={{ base: 5, md: 10 }}
          alignItems="end"
          mb={{ base: 12, md: 16 }}
          position="relative"
          _after={{
            content: '""',
            position: "absolute",
            left: isRtl ? "auto" : 0,
            right: isRtl ? 0 : "auto",
            bottom: { base: "-18px", md: "-24px" },
            w: { base: "112px", md: "180px" },
            h: "7px",
            bg: primaryAccent,
            transform: "skewX(-30deg)",
            boxShadow: isLightTheme ? "8px 5px 0 #241c2d" : "8px 5px 0 rgba(247,241,232,0.82)",
          }}
        >
          <VStack align={isRtl ? "flex-end" : "flex-start"} spacing={3}>
            <Text
              fontFamily="monospace"
              fontSize="xs"
              fontWeight="900"
              letterSpacing="0.18em"
              color="white"
              bg={isLightTheme ? "#d13d74" : "#e54c77"}
              border="2px solid"
              borderColor={isLightTheme ? "#241c2d" : "#f7f1e8"}
              boxShadow={isLightTheme ? "4px 4px 0 #241c2d" : "4px 4px 0 #050711"}
              px={3}
              py={1}
              transform="rotate(-2deg)"
            >
              {heroCopy.workLabel}
            </Text>
            <Heading
              fontFamily="'DM Sans', sans-serif"
              fontSize={{ base: "4xl", md: "6xl" }}
              lineHeight="0.95"
              letterSpacing="-0.055em"
              textAlign={directionalTextAlign}
              fontWeight="900"
              textShadow={isLightTheme ? "4px 4px 0 rgba(218,61,105,0.18)" : "4px 4px 0 rgba(255,112,151,0.18)"}
            >
              {heroCopy.workTitle}
            </Heading>
          </VStack>
          <Text
            fontFamily="'DM Sans', sans-serif"
            fontSize={{ base: "md", md: "xl" }}
            lineHeight="1.65"
            color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"}
            textAlign={directionalTextAlign}
            maxW="680px"
          >
            {heroCopy.workBody}
          </Text>
        </Box>

        <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "repeat(12, minmax(0, 1fr))" }} gap={{ base: 5, md: 6 }}>
          {links.map((link, index) => (
            <Box
              key={link.title}
              gridColumn={{ base: "1", md: index === 0 || index === 3 ? "span 7" : "span 5" }}
            >
              <LinkCard
                {...link}
                isLightTheme={isLightTheme}
                textDirection={pageDirection}
                onLaunchSound={onLaunchSound}
                onLaunchEvent={() => onLaunchEvent(link)}
                launchAppText={link.launchAppText}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Container>
  );
}

export default function LinksPage() {
  const { generateNostrKeys, auth, postNostrContent, connectToNostr } =
    useDecentralizedIdentity();
  const themeMode = useThemeStore((s) => s.themeMode);
  const syncThemeMode = useThemeStore((s) => s.syncThemeMode);
  const isLightTheme = themeMode === "light";

  // Language state
  const { language, initLanguage, setLanguage, t } = useLanguage();
  const translations = t(linksPageTranslations);
  const activeLanguage = language || "en";
  const heroCopy = HERO_COPY[activeLanguage] || HERO_COPY.en;
  const profileHeroCopy =
    PROFILE_HERO_COPY[activeLanguage] || PROFILE_HERO_COPY.en;
  const pageDirection = getLanguageDirection(activeLanguage);
  const isRtl = pageDirection === "rtl";
  const directionalTextAlign = isRtl ? "right" : "left";
  const [displayName, setDisplayName] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [nsecInput, setNsecInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [profilePicture, setProfilePicture] = useState("");
  const [profilePictureUrlInput, setProfilePictureUrlInput] = useState("");
  const [randomCharacterKey] = useState(
    () => Math.floor(Math.random() * 21) + 20,
  ); // Random between 20-40
  const [noSabosOrbState] = useState(pickRandomVoiceOrbState);
  const [hasCopiedRbeSecretKey, setHasCopiedRbeSecretKey] = useState(false);

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

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isRbeOpen,
    onOpen: onRbeOpen,
    onClose: onRbeClose,
  } = useDisclosure();
  const {
    isOpen: isAboutOpen,
    onOpen: onAboutOpen,
    onClose: onAboutClose,
  } = useDisclosure();
  const toast = useToast();
  const playSound = useSoundSettings((s) => s.playSound);
  const primaryAccent = isLightTheme ? "#0f766e" : "#00ffff";
  const secondaryAccent = isLightTheme ? "#c026d3" : "#ff00ff";
  const linkAccent = isLightTheme ? "#1d4ed8" : "#4da3ff";
  const walletAccent = isLightTheme ? "#15803d" : "#16b078";
  const modalBg = isLightTheme ? "#fffaf0" : "rgba(15, 18, 35, 0.98)";
  const modalBorderColor = isLightTheme ? "#241c2d" : "#f7f1e8";
  const modalBorderSoft = isLightTheme
    ? "rgba(36, 28, 45, 0.2)"
    : "rgba(255, 111, 145, 0.34)";
  const modalHeadingColor = isLightTheme ? "#241c2d" : "#ff6f91";
  const labelColor = isLightTheme ? APP_TEXT_SECONDARY : "gray.400";
  const helperColor = isLightTheme ? APP_TEXT_MUTED : "gray.500";
  const inputBg = isLightTheme ? APP_SURFACE : "rgba(0, 0, 0, 0.3)";
  const inputBorderColor = isLightTheme ? APP_BORDER : "gray.600";

  const modalScrollSx = useMemo(
    () => ({
      "&::-webkit-scrollbar": {
        width: "8px",
      },
      "&::-webkit-scrollbar-track": {
        background: isLightTheme
          ? "rgba(96, 77, 56, 0.08)"
          : "rgba(0, 0, 0, 0.3)",
        borderRadius: "4px",
      },
      "&::-webkit-scrollbar-thumb": {
        background: isLightTheme
          ? "linear-gradient(180deg, #d6c1a7 0%, #0f766e 100%)"
          : "linear-gradient(180deg, #00ffff 0%, #ff00ff 100%)",
        borderRadius: "4px",
        border: "2px solid transparent",
        backgroundClip: "padding-box",
      },
      "&::-webkit-scrollbar-thumb:hover": {
        background: isLightTheme
          ? "linear-gradient(180deg, #cbb391 0%, #0e7490 100%)"
          : "linear-gradient(180deg, #00cccc 0%, #cc00cc 100%)",
        backgroundClip: "padding-box",
      },
      scrollbarWidth: "thin",
      scrollbarColor: isLightTheme
        ? "#b28f6d rgba(96, 77, 56, 0.08)"
        : "#00ffff rgba(0, 0, 0, 0.3)",
    }),
    [isLightTheme],
  );

  const hasTriggeredKeygen = useRef(false);

  // Detect if user is logged in via NIP-07 extension
  const isNip07Mode =
    typeof window !== "undefined" &&
    localStorage.getItem("nip07_signer") === "true";

  // Wallet balance computed
  const totalBalance = useMemo(() => {
    const numeric = Number(walletBalance);
    return Number.isFinite(numeric) ? numeric : 0;
  }, [walletBalance]);

  // Hydrate wallet on mount
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

  // Initialize language based on timezone detection
  useEffect(() => {
    initLanguage();
  }, [initLanguage]);

  useEffect(() => {
    syncDocumentLanguage(language);
  }, [language]);

  // Load stored displayName and profilePicture
  useEffect(() => {
    const storedDisplayName = localStorage.getItem("displayName");
    const storedProfilePicture = localStorage.getItem("profilePicture");
    const storedProfilePictureUrl = localStorage.getItem("profilePictureUrl");
    if (storedDisplayName) {
      setDisplayName(storedDisplayName);
      setUsernameInput(storedDisplayName);
    }
    if (storedProfilePicture) {
      setProfilePicture(storedProfilePicture);
    }
    if (storedProfilePictureUrl) {
      setProfilePictureUrlInput(storedProfilePictureUrl);
      if (!storedProfilePicture) {
        setProfilePicture(storedProfilePictureUrl);
      }
    }
  }, []);

  const rbeUrl = "https://robotsbuildingeducation.com";
  const handleRbeOpen = () => {
    setHasCopiedRbeSecretKey(false);
    onRbeOpen();
  };
  const handleRbeClose = () => {
    setHasCopiedRbeSecretKey(false);
    onRbeClose();
  };
  const handleSelectSound = () => playSound(selectSound);
  const handleSubmitActionSound = () => playSound(submitActionSound);
  const handleThemeModeChange = (nextMode) => {
    if (nextMode === themeMode) return;
    handleSelectSound();
    syncThemeMode(nextMode);
  };

  // Wallet handlers
  const handleCreateWallet = async () => {
    // If NIP-07 mode and no nsec provided, show error
    if (isNip07Mode && noWalletFound && !nsecForWallet.trim()) {
      toast({
        title: translations.secretKeyRequired,
        description: translations.secretKeyRequiredToast,
        status: "warning",
        duration: 2500,
      });
      return;
    }

    // Validate nsec format if provided
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
      // Pass the nsec to createNewWallet if we're in NIP-07 mode
      const nsecToUse =
        isNip07Mode && nsecForWallet.trim() ? nsecForWallet.trim() : null;
      await createNewWallet(nsecToUse);

      // Clear the nsec input after successful wallet creation
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
      await initiateDeposit(100); // 100 sats minimum
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
      // Ignore clipboard write failures here; the user can retry.
    }
  };

  const citizenshipUrl = isLocalhost()
    ? "http://localhost:5173/citizenship"
    : "https://piyali.app/citizenship";

  const links = [
    {
      title: translations.noSabosTitle,
      description: translations.noSabosDescription,
      href: "https://piyali.app",
      analyticsName: "nosabos_app",
      visual: (
        <Box
          w={{ base: "110px", md: "120px" }}
          h={{ base: "110px", md: "120px" }}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <VoiceOrb state={noSabosOrbState} />
        </Box>
      ),
      launchAppText: translations.launchApp,
      accent: isLightTheme ? "#0f9f91" : "#56f0d8",
      accentSoft: isLightTheme
        ? "rgba(15, 159, 145, 0.22)"
        : "rgba(86, 240, 216, 0.22)",
      shadowAccent: isLightTheme ? "#08776f" : "#15968b",
      buttonTextShadow: "0px 1px 2px rgba(7, 16, 29, 0.55)",
    },
    {
      title: translations.rbeTitle,
      description: translations.rbeDescription,
      href: rbeUrl,
      analyticsName: "robots_building_education",
      onLaunch: handleRbeOpen,
      visual: (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          w={{ base: "110px", md: "120px" }}
          h={{ base: "110px", md: "120px" }}
          transform="scale(0.75)"
          transformOrigin="center"
        >
          <CloudCanvas />
        </Box>
      ),
      launchAppText: translations.launchApp,
      accent: isLightTheme ? "#d97706" : "#ffbd59",
      accentSoft: isLightTheme
        ? "rgba(217, 119, 6, 0.18)"
        : "rgba(255, 189, 89, 0.2)",
      shadowAccent: isLightTheme ? "#9f5404" : "#c57b18",
      buttonTextShadow: "0px 1px 2px rgba(7, 16, 29, 0.55)",
    },
    // {
    //   title: translations.roadmapCashTitle,
    //   description: translations.roadmapCashDescription,
    //   href: "https://roadmap.cash",
    //   analyticsName: "roadmap_cash",
    //   visual: (
    //     <Box
    //       w={{ base: "140px", md: "140px" }}
    //       h={{ base: "140px", md: "140px" }}
    //       display="flex"
    //       alignItems="center"
    //       justifyContent="center"
    //     >
    //       <AnimatedLogo showWordmark={false} size={140} />
    //     </Box>
    //   ),
    //   launchAppText: translations.launchApp,
    // },
    {
      title: translations.citizenshipTitle,
      description: translations.citizenshipDescription,
      href: citizenshipUrl,
      analyticsName: "citizenship",
      visual: (
        <Box
          w={{ base: "110px", md: "120px" }}
          h={{ base: "110px", md: "120px" }}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <CitizenshipIcon size={114} />
        </Box>
      ),
      launchAppText: translations.launchApp,
      accent: isLightTheme ? "#3158a6" : "#7ca7ff",
      accentSoft: isLightTheme
        ? "rgba(49, 88, 166, 0.18)"
        : "rgba(124, 167, 255, 0.2)",
      shadowAccent: isLightTheme ? "#203d78" : "#4668b8",
    },
    {
      title: translations.patreonTitle,
      description: translations.patreonDescription,
      href: "https://subscribe.piyali.app/",
      analyticsName: "patreon",
      visual: (
        <Box
          w={{ base: "190px", md: "220px" }}
          h={{ base: "190px", md: "220px" }}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <PatreonMotionMark isLightTheme={isLightTheme} />
        </Box>
      ),
      launchAppText: translations.subscribe,
      accent: isLightTheme ? "#d13d74" : "#ff74aa",
      accentSoft: isLightTheme
        ? "rgba(209, 61, 116, 0.18)"
        : "rgba(255, 116, 170, 0.2)",
      shadowAccent: isLightTheme ? "#91254f" : "#b83f73",
      // The one-time "Buy apps" action is intentionally hidden while Patreon
      // OAuth membership is the supported unlock path.
      // secondaryAction: {
      //   label: translations.buyApps,
      //   href: "https://www.patreon.com/posts/146522893?forSale=true",
      //   color: "#4da3ff",
      // },
    },
  ];

  // Get display text for welcome message
  const getWelcomeText = () => {
    if (displayName) {
      return displayName;
    }
    return profileHeroCopy.friend;
  };

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

      // Build metadata object
      const metadata = {
        name: usernameInput.trim() || displayName || "",
        about: "A student onboarded with Robots Building Education",
      };

      // Add picture if provided
      if (trimmedProfilePictureUrl) {
        metadata.picture = trimmedProfilePictureUrl;
        metadata.profilePictureUrl = trimmedProfilePictureUrl;
      }

      // Post kind 0 (metadata) event to update profile
      await postNostrContent(JSON.stringify(metadata), 0);

      // Save to localStorage and Firestore
      if (usernameInput.trim()) {
        localStorage.setItem("displayName", usernameInput.trim());
        setDisplayName(usernameInput.trim());

        // Also persist to user document in Firestore
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
      }

      if (trimmedProfilePictureUrl) {
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

  // Fetch profile from Nostr for a given npub
  const fetchNostrProfile = async (npubToFetch) => {
    try {
      const connection = await connectToNostr();
      if (!connection) return null;

      const { ndkInstance } = connection;

      // Convert npub to hex
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
        // Timeout after 5 seconds
        setTimeout(() => resolve(profile), 5000);
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      return null;
    }
  };

  // Handle switch account
  const handleSwitchAccount = async () => {
    if (!nsecInput.trim() || !nsecInput.startsWith("nsec")) {
      toast({
        title: translations.invalidKey,
        description: translations.enterValidNsec,
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSwitching(true);
    try {
      const result = await auth(nsecInput.trim());
      if (result) {
        const newNpub = result.user.npub;
        setNsecInput("");

        // Fetch profile from Nostr to get username and picture
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

  // Background Nostr key generation (no UI)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasStoredKeys =
      Boolean(localStorage.getItem("local_nsec")) &&
      Boolean(localStorage.getItem("local_npub"));

    if (hasStoredKeys) {
      return;
    }

    if (hasTriggeredKeygen.current) {
      return;
    }

    hasTriggeredKeygen.current = true;
    let isMounted = true;
    const createInstantKeys = async () => {
      try {
        const defaultDisplayName = "";
        await generateNostrKeys(defaultDisplayName);
        if (!isMounted) return;
        localStorage.setItem("displayName", defaultDisplayName);
      } catch (error) {
        console.error("Failed to generate instant Nostr keys:", error);
      }
    };

    createInstantKeys();

    return () => {
      isMounted = false;
    };
  }, [generateNostrKeys]);

  return (
    <Box
      dir={pageDirection}
      minH="100dvh"
      bg={isLightTheme ? "#fff4df" : "#0b0d1a"}
      color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
      position="relative"
      overflow="hidden"
      sx={{
        "::selection": {
          bg: isLightTheme ? "#e34069" : "#ff6f91",
          color: "white",
        },
      }}
      style={{
        "--links-accent-primary": isLightTheme ? "#0f766e" : "#00ffff",
        "--links-accent-warm": isLightTheme ? "#b45309" : "gold",
        "--links-accent-pink": isLightTheme ? "#db2777" : "hotpink",
      }}
    >
      <AnimeBackdrop isLightTheme={isLightTheme} />
      <Box
        position="absolute"
        top={{ base: "190px", md: "120px" }}
        insetInlineStart={{ base: "-210px", md: "-150px" }}
        w={{ base: "420px", md: "650px" }}
        h={{ base: "180px", md: "260px" }}
        bg={isLightTheme ? "rgba(227,64,105,0.16)" : "rgba(255,83,125,0.13)"}
        borderBlock="2px solid"
        borderColor={isLightTheme ? "rgba(36,28,45,0.12)" : "rgba(255,255,255,0.08)"}
        transform="rotate(-13deg)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        top={{ base: "720px", md: "540px" }}
        insetInlineEnd={{ base: "-180px", md: "-110px" }}
        w={{ base: "360px", md: "600px" }}
        h={{ base: "130px", md: "190px" }}
        bg={isLightTheme ? "rgba(43,177,183,0.14)" : "rgba(86,229,232,0.1)"}
        borderBlock="2px solid"
        borderColor={isLightTheme ? "rgba(36,28,45,0.1)" : "rgba(255,255,255,0.07)"}
        transform="rotate(16deg)"
        pointerEvents="none"
      />
      <LinksHero
        heroCopy={heroCopy}
        translations={translations}
        isLightTheme={isLightTheme}
        isRtl={isRtl}
        directionalTextAlign={directionalTextAlign}
        primaryAccent={primaryAccent}
        profilePicture={profilePicture}
        randomCharacterKey={randomCharacterKey}
        welcomeText={getWelcomeText()}
        editProfileText={profileHeroCopy.editProfile}
        onProfileOpen={() => {
          handleSelectSound();
          onOpen();
        }}
        onAboutOpen={() => {
          handleSelectSound();
          onAboutOpen();
        }}
        onSocialClick={(platform, url) => {
          handleSelectSound();
          if (!isLocalhost()) {
            logEvent(analytics, "links_social_click", { platform });
          }
          window.open(url, "_blank", "noopener,noreferrer");
        }}
        languageControl={
          <LanguageMenuFixed
            language={language}
            onSelect={setLanguage}
            playSound={handleSelectSound}
            translations={translations}
            isLightTheme={isLightTheme}
          />
        }
        themeControl={
          <ThemeModeToggle
            themeMode={themeMode}
            onModeChange={handleThemeModeChange}
          />
        }
      />
      <ProjectShowcase
        heroCopy={heroCopy}
        links={links}
        isLightTheme={isLightTheme}
        isRtl={isRtl}
        directionalTextAlign={directionalTextAlign}
        pageDirection={pageDirection}
        primaryAccent={primaryAccent}
        onLaunchSound={handleSubmitActionSound}
        onLaunchEvent={(link) => {
          if (!isLocalhost() && !link.onLaunch) {
            logEvent(analytics, "links_launch_app", { app: link.analyticsName });
          }
        }}
      />

      {/* Robots Building Education Modal */}
      <Modal
        isOpen={isRbeOpen}
        onClose={handleRbeClose}
        isCentered
        size="md"
        motionPreset="none"
      >
        <ModalOverlay
          motionProps={nativeOverlayMotionProps}
          bg="var(--app-overlay)"
        />
        <ModalContent
          motionProps={nativeModalMotionProps}
          dir={pageDirection}
          bg={modalBg}
          color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
          border="3px solid"
          borderColor={modalBorderColor}
          rounded="24px"
          boxShadow={isLightTheme ? "8px 10px 0 #d13d74" : "8px 10px 0 #050711"}
          fontFamily="monospace"
        >
          <ModalHeader
            fontSize="lg"
            color={modalHeadingColor}
            textAlign={directionalTextAlign}
          >
            {translations.rbeModalTitle}
          </ModalHeader>
          <ModalCloseButton
            color={modalHeadingColor}
            onClick={handleSelectSound}
            left={isRtl ? 3 : undefined}
            right={isRtl ? "auto" : undefined}
            _hover={{ bg: isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.100" }}
          />
          <ModalBody py={6}>
            <VStack spacing={4} align="stretch">
              <Text
                fontSize="sm"
                color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"}
                textAlign={directionalTextAlign}
                sx={{ unicodeBidi: "plaintext" }}
              >
                {hasCopiedRbeSecretKey
                  ? translations.secretKeyCopied
                  : translations.rbeModalDescription}
              </Text>
              {hasCopiedRbeSecretKey && (
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
                  textAlign={directionalTextAlign}
                >
                  {translations.rbeReadyToSignIn}
                </Text>
              )}
              {hasCopiedRbeSecretKey ? (
                <Button
                  as="a"
                  href={rbeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  bg={isLightTheme ? primaryAccent : "#009c9c"}
                  color={isLightTheme ? "#f8fafc" : "white"}
                  w="100%"
                  h="auto"
                  py={4}
                  boxShadow={
                    isLightTheme
                      ? "0 8px 18px rgba(15, 118, 110, 0.16), 0px 4px 0px #0b6f68"
                      : "0px 4px 0px #006b68"
                  }
                  _hover={{
                    bg: isLightTheme ? "#0d9488" : "#009c9c",
                    color: "white",
                    textDecoration: "none",
                    boxShadow: isLightTheme
                      ? "0 8px 18px rgba(15, 118, 110, 0.16), 0px 4px 0px #0b6f68"
                      : "0px 4px 0px #006b68, 0 10px 24px rgba(0, 156, 156, 0.22)",
                  }}
                  _active={{
                    color: "white",
                    boxShadow: isLightTheme
                      ? "0 4px 12px rgba(15, 118, 110, 0.16)"
                      : "0px 1px 0px #006b68",
                    transform: "translateY(3px)",
                  }}
                  _visited={{ color: "white" }}
                  onClick={() => {
                    handleSubmitActionSound();
                    if (!isLocalhost()) {
                      logEvent(analytics, "links_launch_app", {
                        app: "robots_building_education",
                      });
                    }
                    handleRbeClose();
                  }}
                >
                  {translations.goToApp}
                </Button>
              ) : (
                <Button
                  onClick={async () => {
                    handleSelectSound();
                    const copied = await handleCopySecretKey({
                      showSuccessToast: false,
                    });
                    if (copied) setHasCopiedRbeSecretKey(true);
                  }}
                  variant={isLightTheme ? "outline" : "solid"}
                  bg={isLightTheme ? APP_SURFACE : "#00aaff"}
                  w="100%"
                  h="auto"
                  py={4}
                  borderColor={isLightTheme ? linkAccent : undefined}
                  color={isLightTheme ? linkAccent : "white"}
                  boxShadow={
                    isLightTheme ? "none" : "0 5px 0 #2563eb"
                  }
                  _hover={{
                    bg: isLightTheme ? APP_SURFACE_MUTED : "#38bdf8",
                    borderColor: isLightTheme ? linkAccent : "#7dd3fc",
                    color: isLightTheme ? linkAccent : "white",
                    boxShadow: isLightTheme
                      ? "none"
                      : "0 5px 0 #2563eb, 0 12px 28px rgba(56, 189, 248, 0.28)",
                  }}
                  _active={{
                    bg: isLightTheme ? APP_SURFACE_MUTED : "#0284c7",
                    borderColor: isLightTheme ? linkAccent : "#38bdf8",
                    color: isLightTheme ? linkAccent : "white",
                    boxShadow: isLightTheme ? "none" : "0 2px 0 #1d4ed8",
                    transform: "translateY(3px)",
                  }}
                >
                  {translations.copySecretKey}
                </Button>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Profile Customization Modal */}
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
          bg="var(--app-overlay)"
        />
        <ModalContent
          motionProps={nativeModalMotionProps}
          dir={pageDirection}
          bg={modalBg}
          color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
          border="3px solid"
          borderColor={modalBorderColor}
          rounded="24px"
          boxShadow={isLightTheme ? "8px 10px 0 #d13d74" : "8px 10px 0 #050711"}
          fontFamily="monospace"
          maxH="85vh"
          style={{
            "--links-accent-primary": isLightTheme ? "#0f766e" : "#00ffff",
            "--links-accent-warm": isLightTheme ? "#b45309" : "gold",
            "--links-accent-pink": isLightTheme ? "#db2777" : "hotpink",
          }}
        >
          <ModalHeader
            borderBottom="1px solid"
            borderColor={modalBorderSoft}
            color={modalHeadingColor}
            textAlign={directionalTextAlign}
          >
            {translations.customizeProfileTitle}
          </ModalHeader>
          <ModalCloseButton
            color={modalHeadingColor}
            onClick={handleSelectSound}
            left={isRtl ? 3 : undefined}
            right={isRtl ? "auto" : undefined}
            _hover={{ bg: isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.100" }}
          />
          <ModalBody py={6} overflowY="auto" sx={modalScrollSx}>
            <VStack spacing={6} align="stretch">
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
                  color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
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
                  color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
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
              <Button
                onClick={() => {
                  handleSubmitActionSound();
                  if (!isLocalhost()) {
                    logEvent(analytics, "links_save_profile");
                  }
                  handleSaveProfile();
                }}
                isLoading={isSaving}
                bg={isLightTheme ? primaryAccent : "#00ffff"}
                color={isLightTheme ? "#f8fafc" : "black"}
                w="100%"
                boxShadow={
                  isLightTheme
                    ? "0 8px 18px rgba(15, 118, 110, 0.16)"
                    : undefined
                }
                _hover={isLightTheme ? { bg: "#0d9488" } : undefined}
              >
                {translations.saveProfile}
              </Button>

              <Divider
                borderColor={
                  isLightTheme ? APP_BORDER : "rgba(255, 0, 255, 0.3)"
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
                <Button
                  onClick={() => {
                    handleSelectSound();
                    handleCopySecretKey();
                  }}
                  variant="outline"
                  bg={isLightTheme ? APP_SURFACE : undefined}
                  borderColor={secondaryAccent}
                  color={secondaryAccent}
                  w="100%"
                  _hover={
                    isLightTheme
                      ? { bg: APP_SURFACE_MUTED, borderColor: secondaryAccent }
                      : undefined
                  }
                >
                  {translations.copySecretKey}
                </Button>
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
                  <AccordionButton px={0} _hover={{ bg: "transparent" }}>
                    <Box flex="1" textAlign={directionalTextAlign}>
                      <Text fontSize="sm" color={labelColor}>
                        {translations.switchAccount}
                      </Text>
                    </Box>
                    <AccordionIcon color={secondaryAccent} />
                  </AccordionButton>
                  <AccordionPanel px={0} pt={3}>
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
                        color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
                        _placeholder={{ color: helperColor }}
                        _focus={{
                          borderColor: secondaryAccent,
                          boxShadow: isLightTheme
                            ? "0 0 0 3px rgba(192, 38, 211, 0.12)"
                            : "0 0 10px rgba(255, 0, 255, 0.3)",
                        }}
                      />
                      <Button
                        onClick={() => {
                          handleSelectSound();
                          handleSwitchAccount();
                        }}
                        isLoading={isSwitching}
                        variant="outline"
                        bg={isLightTheme ? APP_SURFACE : undefined}
                        borderColor={secondaryAccent}
                        color={secondaryAccent}
                        _hover={
                          isLightTheme
                            ? {
                                bg: APP_SURFACE_MUTED,
                                borderColor: secondaryAccent,
                              }
                            : undefined
                        }
                      >
                        {translations.switchAccount}
                      </Button>
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
                  isLightTheme ? APP_BORDER : "rgba(0, 255, 255, 0.3)"
                }
              />
              {/* Bitcoin Wallet Section */}
              <Box
                bg={isLightTheme ? APP_SURFACE : "rgba(0, 0, 0, 0.3)"}
                rounded="md"
                p={4}
                border="1px solid"
                borderColor={walletAccent}
              >
                <Text
                  fontSize="sm"
                  color={walletAccent}
                  fontWeight="bold"
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
                    <VoiceOrb
                      state={
                        ["idle", "listening", "speaking"][
                          Math.floor(Math.random() * 3)
                        ]
                      }
                      size={24}
                    />
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
                          color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
                          _placeholder={{ color: helperColor }}
                          _focus={{
                            borderColor: secondaryAccent,
                            boxShadow: isLightTheme
                              ? "0 0 0 3px rgba(192, 38, 211, 0.12)"
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
                    <Button
                      onClick={() => {
                        handleSelectSound();
                        handleCreateWallet();
                      }}
                      isLoading={isCreatingWallet}
                      loadingText={translations.creatingWallet}
                      bg={walletAccent}
                      boxShadow={
                        isLightTheme
                          ? "0 4px 0px rgba(21, 128, 61, 0.72)"
                          : "0px 4px 0px teal"
                      }
                      color="white"
                      w="100%"
                      isDisabled={
                        isNip07Mode && noWalletFound && !nsecForWallet.trim()
                      }
                    >
                      {translations.createWallet}
                    </Button>
                  </Box>
                )}

                {/* Wallet exists, balance > 0 → show card */}
                {cashuWallet && totalBalance > 0 && (
                  <Box>
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
                        <Button
                          mt={3}
                          onClick={() => {
                            handleSelectSound();
                            handleInitiateDeposit();
                          }}
                          w="100%"
                          bg={walletAccent}
                          color="white"
                          boxShadow={
                            isLightTheme
                              ? "0 4px 0px rgba(21, 128, 61, 0.72)"
                              : "0px 4px 0px teal"
                          }
                        >
                          {translations.deposit}
                        </Button>
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
                          <Button
                            onClick={() => {
                              handleSelectSound();
                              handleCopyInvoice();
                            }}
                            size="sm"
                            variant="outline"
                            bg={isLightTheme ? APP_SURFACE : undefined}
                            borderColor={primaryAccent}
                            color={primaryAccent}
                            _hover={
                              isLightTheme
                                ? {
                                    bg: APP_SURFACE_MUTED,
                                    borderColor: primaryAccent,
                                  }
                                : undefined
                            }
                          >
                            {translations.copyAddress}
                          </Button>
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
                        <Button
                          onClick={() => {
                            handleSelectSound();
                            handleInitiateDeposit();
                          }}
                          leftIcon={<BsQrCode />}
                          size="sm"
                          variant="outline"
                          bg={isLightTheme ? APP_SURFACE : undefined}
                          borderColor={secondaryAccent}
                          color={secondaryAccent}
                          _hover={
                            isLightTheme
                              ? {
                                  bg: APP_SURFACE_MUTED,
                                  borderColor: secondaryAccent,
                                }
                              : undefined
                          }
                        >
                          {translations.generateNewQR}
                        </Button>
                      </VStack>
                    )}
                  </Box>
                )}
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter
            borderTop="1px solid"
            borderColor={modalBorderSoft}
            justifyContent={isRtl ? "flex-start" : "flex-end"}
          >
            <Button
              onClick={() => {
                handleSelectSound();
                onClose();
              }}
              variant="ghost"
              color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}
              _hover={{
                bg: isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.100",
              }}
            >
              {translations.close}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* About Modal */}
      <Modal
        isOpen={isAboutOpen}
        onClose={onAboutClose}
        isCentered
        size="md"
        scrollBehavior="inside"
        motionPreset="none"
      >
        <ModalOverlay
          motionProps={nativeOverlayMotionProps}
          bg="var(--app-overlay)"
        />
        <ModalContent
          motionProps={nativeModalMotionProps}
          dir={pageDirection}
          bg={modalBg}
          color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
          border="3px solid"
          borderColor={modalBorderColor}
          rounded="24px"
          boxShadow={isLightTheme ? "8px 10px 0 #d13d74" : "8px 10px 0 #050711"}
          fontFamily="monospace"
          maxH="85vh"
          style={{
            "--links-accent-primary": isLightTheme ? "#0f766e" : "#00ffff",
            "--links-accent-warm": isLightTheme ? "#b45309" : "gold",
            "--links-accent-pink": isLightTheme ? "#db2777" : "hotpink",
          }}
        >
          <ModalHeader
            borderBottom="1px solid"
            borderColor={modalBorderSoft}
            color={modalHeadingColor}
            textAlign={directionalTextAlign}
          >
            {translations.aboutTitle}
          </ModalHeader>
          <ModalCloseButton
            color={modalHeadingColor}
            onClick={handleSelectSound}
            left={isRtl ? 3 : undefined}
            right={isRtl ? "auto" : undefined}
            _hover={{ bg: isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.100" }}
          />
          <ModalBody py={6} overflowY="auto" sx={modalScrollSx}>
            <VStack spacing={4} align="stretch">
              <Box mt={"-6"}>
                {" "}
                <RandomCharacter notSoRandomCharacter={"38"} />
              </Box>

              <Box
                color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"}
                fontSize="sm"
                lineHeight="tall"
                mt={"-6"}
                dir={pageDirection}
                textAlign={directionalTextAlign}
                sx={{
                  "& p": {
                    marginBottom: "12px",
                    textAlign: directionalTextAlign,
                    unicodeBidi: "plaintext",
                  },
                  "& span": {
                    fontWeight: 600,
                    textShadow: isLightTheme
                      ? "none"
                      : "0 0 16px rgba(0, 255, 255, 0.08)",
                  },
                }}
              >
                {translations.aboutContent}
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter
            borderTop="1px solid"
            borderColor={modalBorderSoft}
            justifyContent={isRtl ? "flex-start" : "flex-end"}
          >
            <Button
              onClick={() => {
                handleSelectSound();
                onAboutClose();
              }}
              variant="ghost"
              color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}
              _hover={{
                bg: isLightTheme ? APP_SURFACE_MUTED : "whiteAlpha.100",
              }}
            >
              {translations.close}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
