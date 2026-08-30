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
  Image,
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
import { LuPencilLine, LuSun, LuMusic } from "react-icons/lu";
import { RiMoonClearFill } from "react-icons/ri";
import useSoundSettings from "../hooks/useSoundSettings";
import { selectSound, submitActionSound } from "../constants/sounds";
import awalkMusic from "../assets/awalk.mp3";

import VoiceOrb from "./VoiceOrb";
import MangaLinksExperience from "./MangaLinksExperience";

import { CloudCanvas } from "./CloudCanvas/CloudCanvas";
import CitizenshipIcon from "./CitizenshipIcon/CitizenshipIcon";
import { useDecentralizedIdentity } from "../hooks/useDecentralizedIdentity";
import { NDKKind } from "@nostr-dev-kit/ndk";
import { Buffer } from "buffer";
import { bech32 } from "bech32";
import RandomCharacter from "./RandomCharacter";
import { logEvent } from "firebase/analytics";
import { doc, getDoc, updateDoc } from "firebase/firestore";
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

// Kept as a no-op for the retired experimental layouts below. The live page
// intentionally uses no WebGL or particle layer.
const AnimeFinaleCanvas = () => null;

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

const mangaMarquee = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
`;

const inkSlash = keyframes`
  0%, 100% { transform: translateX(-5%) skewX(-18deg); opacity: 0.48; }
  50% { transform: translateX(7%) skewX(-18deg); opacity: 0.82; }
`;

const speechPop = keyframes`
  0% { opacity: 0; transform: rotate(7deg) scale(0.7); }
  70% { opacity: 1; transform: rotate(-4deg) scale(1.06); }
  100% { opacity: 1; transform: rotate(-3deg) scale(1); }
`;

const coverCutIn = keyframes`
  from { opacity: 0; clip-path: inset(0 100% 0 0); }
  to { opacity: 1; clip-path: inset(0 0 0 0); }
`;

const coverCharacterIn = keyframes`
  from { opacity: 0; transform: translate3d(70px, 36px, 0) rotate(7deg) scale(0.84); }
  to { opacity: 1; transform: translate3d(0, 0, 0) rotate(-2deg) scale(1); }
`;

const chapterSweep = keyframes`
  0%, 100% { transform: translateX(-4%) skewX(-18deg); }
  50% { transform: translateX(8%) skewX(-18deg); }
`;

const exclamationPulse = keyframes`
  0%, 100% { transform: rotate(-8deg) scale(1); }
  50% { transform: rotate(-5deg) scale(1.08); }
`;

const finaleFlash = keyframes`
  0%, 72%, 100% { opacity: 0; }
  76% { opacity: 0.92; }
  78% { opacity: 0.08; }
  81% { opacity: 0.46; }
`;

const bladeAwaken = keyframes`
  0% { transform: translate(-50%, -50%) scaleY(0.02); opacity: 0; }
  22% { opacity: 1; }
  68% { transform: translate(-50%, -50%) scaleY(1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scaleY(1.08); opacity: 0.64; }
`;

const limitBreak = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) skewX(-7deg); }
  48% { transform: translate3d(-2px, 1px, 0) skewX(-7deg); }
  50% { transform: translate3d(5px, -2px, 0) skewX(-9deg); }
  52% { transform: translate3d(-4px, 1px, 0) skewX(-5deg); }
  55% { transform: translate3d(0, 0, 0) skewX(-7deg); }
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
    body: "Learning here does more than build skills. With decentralized identity and opt-in features, the steps you take to make progress can send a little to someone you choose—turning everyday learning into scholarships.",
    focusAreas: [
      "LANGUAGE TUTOR",
      "CODING\nTUTOR",
      "DUAL CITIZENSHIP PLANNER",
      "INVESTING & BUSINESS",
    ],
    chapterVerbs: ["LEARN", "BUILD", "PLAN", "INVEST"],
    productLabel: "PRODUCT",
    scholarshipSlogan: "CREATE\nSCHOLARSHIPS\nWITH LEARNING.",
    explore: "Explore the universe",
    workLabel: "Selected creations",
    workTitle: "Choose your next story.",
    workBody:
      "Four playful tools, each with its own color, character, and energy.",
  },
  es: {
    eyebrow: "EL PEQUEÑO UNIVERSO DE SHEILFER",
    titleLead: "Crea becas",
    titleAccent: "aprendiendo.",
    body: "Aprender aquí va más allá de desarrollar habilidades. Con identidad descentralizada y funciones opcionales, cada paso que das puede destinar una pequeña aportación a quien tú elijas y convertir el aprendizaje cotidiano en becas.",
    focusAreas: [
      "TUTOR DE IDIOMAS",
      "TUTOR DE\nPROGRAMACIÓN",
      "PLANIFICADOR DE\nDOBLE CIUDADANÍA",
      "INVERSIÓN Y\nNEGOCIOS",
    ],
    chapterVerbs: ["APRENDE", "CONSTRUYE", "PLANEA", "INVIERTE"],
    productLabel: "PRODUCTO",
    scholarshipSlogan: "CREA BECAS\nAPRENDIENDO.",
    explore: "Explorar el universo",
    workLabel: "Creaciones seleccionadas",
    workTitle: "Cuatro ideas. Cuatro mundos.",
    workBody:
      "Cada proyecto nace de un problema real y se convierte en su propia experiencia divertida.",
  },
  pt: {
    eyebrow: "O PEQUENO UNIVERSO DE SHEILFER",
    titleLead: "Crie bolsas de estudo",
    titleAccent: "aprendendo.",
    body: "Aprender aqui vai além de desenvolver habilidades. Com identidade descentralizada e recursos opcionais, cada passo do seu progresso pode destinar uma pequena contribuição a quem você escolher, transformando o aprendizado do dia a dia em bolsas de estudo.",
    focusAreas: [
      "TUTOR DE IDIOMAS",
      "TUTOR DE\nPROGRAMAÇÃO",
      "PLANEJADOR DE\nDUPLA CIDADANIA",
      "INVESTIMENTOS E\nNEGÓCIOS",
    ],
    chapterVerbs: ["APRENDA", "CONSTRUA", "PLANEJE", "INVISTA"],
    productLabel: "PRODUTO",
    scholarshipSlogan: "CRIE BOLSAS\nAO APRENDER.",
    explore: "Explorar o universo",
    workLabel: "Criações selecionadas",
    workTitle: "Quatro ideias. Quatro mundos.",
    workBody:
      "Cada projeto começa com um problema real e cresce como uma experiência única e divertida.",
  },
  it: {
    eyebrow: "IL PICCOLO UNIVERSO DI SHEILFER",
    titleLead: "Crea borse di studio",
    titleAccent: "imparando.",
    body: "Qui imparare significa molto più che acquisire competenze. Con un’identità decentralizzata e funzioni facoltative, ogni passo avanti può destinare un piccolo contributo a una persona scelta da te, trasformando l’apprendimento quotidiano in borse di studio.",
    focusAreas: [
      "TUTOR DI LINGUE",
      "TUTOR DI\nPROGRAMMAZIONE",
      "PLANNER PER LA\nDOPPIA CITTADINANZA",
      "INVESTIMENTI E\nBUSINESS",
    ],
    chapterVerbs: ["IMPARA", "COSTRUISCI", "PIANIFICA", "INVESTI"],
    productLabel: "PRODOTTO",
    scholarshipSlogan: "CREA BORSE\nIMPARANDO.",
    explore: "Esplora l'universo",
    workLabel: "Creazioni selezionate",
    workTitle: "Quattro idee. Quattro mondi.",
    workBody:
      "Ogni progetto nasce da un problema reale e cresce in un'esperienza tutta sua.",
  },
  fr: {
    eyebrow: "LE PETIT UNIVERS DE SHEILFER",
    titleLead: "Crée des bourses",
    titleAccent: "en apprenant.",
    body: "Ici, apprendre va au-delà de l’acquisition de compétences. Grâce à une identité décentralisée et à des fonctionnalités facultatives, chaque progrès peut verser une petite contribution à la personne de ton choix, transformant ainsi l’apprentissage quotidien en bourses d’études.",
    focusAreas: [
      "TUTEUR DE LANGUES",
      "TUTEUR DE\nPROGRAMMATION",
      "PLANIFICATEUR DE\nDOUBLE NATIONALITÉ",
      "INVESTISSEMENT ET\nAFFAIRES",
    ],
    chapterVerbs: ["APPRENDS", "CONSTRUIS", "PLANIFIE", "INVESTIS"],
    productLabel: "PRODUIT",
    scholarshipSlogan: "CRÉE DES BOURSES\nEN APPRENANT.",
    explore: "Explorer l'univers",
    workLabel: "Créations choisies",
    workTitle: "Quatre idées. Quatre mondes.",
    workBody:
      "Chaque projet part d'un vrai problème et devient une expérience ludique à part entière.",
  },
  de: {
    eyebrow: "SHEILFERS KLEINES UNIVERSUM",
    titleLead: "Mit Lernen",
    titleAccent: "Stipendien schaffen.",
    body: "Hier geht Lernen über den Aufbau von Fähigkeiten hinaus. Mit dezentraler Identität und optionalen Funktionen kann jeder Lernfortschritt einen kleinen Beitrag an eine Person deiner Wahl senden und so alltägliches Lernen in Stipendien verwandeln.",
    focusAreas: [
      "SPRACHTUTOR",
      "PROGRAMMIER-\nTUTOR",
      "PLANER FÜR DOPPELTE\nSTAATSBÜRGERSCHAFT",
      "INVESTIEREN &\nBUSINESS",
    ],
    chapterVerbs: ["LERNEN", "BAUEN", "PLANEN", "INVESTIEREN"],
    productLabel: "PRODUKT",
    scholarshipSlogan: "MIT LERNEN\nSTIPENDIEN SCHAFFEN.",
    explore: "Universum entdecken",
    workLabel: "Ausgewählte Kreationen",
    workTitle: "Vier Ideen. Vier Welten.",
    workBody:
      "Jedes Projekt beginnt mit einem echten Problem und wächst zu einem eigenen Erlebnis.",
  },
  ja: {
    eyebrow: "SHEILFERの小さな宇宙",
    titleLead: "学びで",
    titleAccent: "奨学金をつくる。",
    body: "ここでの学びは、スキルを身につけるだけではありません。分散型IDと任意で使える機能を通じて、一歩前進するたびに、あなたが選んだ相手へ少額を届けられます。日々の学びが奨学金につながります。",
    focusAreas: [
      "語学チューター",
      "プログラミング\nチューター",
      "二重国籍\nプランナー",
      "投資とビジネス",
    ],
    chapterVerbs: ["学ぶ", "作る", "計画する", "投資する"],
    productLabel: "プロダクト",
    scholarshipSlogan: "学びで\n奨学金を\nつくる。",
    explore: "宇宙を探索する",
    workLabel: "選ばれた作品",
    workTitle: "4つのアイデア。4つの世界。",
    workBody:
      "それぞれのプロジェクトは現実の課題から始まり、独自の楽しい体験へと育ちます。",
  },
  hi: {
    eyebrow: "शेल्फ़र का छोटा ब्रह्मांड",
    titleLead: "सीखते हुए",
    titleAccent: "छात्रवृत्तियाँ बनाएँ।",
    body: "यहाँ सीखना सिर्फ़ कौशल विकसित करने तक सीमित नहीं है। विकेंद्रीकृत पहचान और वैकल्पिक सुविधाओं की मदद से, आपकी प्रगति का हर कदम आपके चुने हुए व्यक्ति तक छोटी-सी राशि पहुँचा सकता है—यानी रोज़मर्रा की सीख छात्रवृत्तियों में बदल सकती है।",
    focusAreas: [
      "भाषा शिक्षक",
      "कोडिंग शिक्षक",
      "दोहरी नागरिकता\nयोजनाकार",
      "निवेश और व्यवसाय",
    ],
    chapterVerbs: ["सीखें", "बनाएँ", "योजना बनाएँ", "निवेश करें"],
    productLabel: "उत्पाद",
    scholarshipSlogan: "सीखते हुए\nछात्रवृत्तियाँ\nबनाएँ।",
    explore: "ब्रह्मांड देखें",
    workLabel: "चुनिंदा रचनाएँ",
    workTitle: "चार विचार। चार संसार।",
    workBody:
      "हर परियोजना एक वास्तविक समस्या से शुरू होकर अपने अनोखे अनुभव में बदलती है।",
  },
  ar: {
    eyebrow: "عالم شيلفر الصغير",
    titleLead: "اعمل منح دراسية",
    titleAccent: "بالتعلّم.",
    body: "التعلّم هنا مش بس لبناء المهارات. بالهوية اللامركزية والميزات الاختيارية، كل خطوة بتتقدمها ممكن تبعت مساهمة صغيرة لشخص إنت تختاره—وبكده يتحول التعلّم اليومي لمنح دراسية.",
    focusAreas: [
      "مدرّس لغات",
      "مدرّس برمجة",
      "مخطط الجنسية\nالمزدوجة",
      "الاستثمار والأعمال",
    ],
    chapterVerbs: ["تعلّم", "ابنِ", "خطّط", "استثمر"],
    productLabel: "المنتج",
    scholarshipSlogan: "اعمل منح\nدراسية بالتعلّم.",
    explore: "استكشف العالم",
    workLabel: "إبداعات مختارة",
    workTitle: "أربع أفكار. أربعة عوالم.",
    workBody: "يبدأ كل مشروع بمشكلة حقيقية وينمو ليصبح تجربة مرحة خاصة به.",
  },
  zh: {
    eyebrow: "SHEILFER的小宇宙",
    titleLead: "边学边",
    titleAccent: "创造奖学金。",
    body: "在这里，学习不只是掌握技能。借助去中心化身份和自愿开启的功能，你每前进一步，都可以向自己选择的人送出一笔小额支持，让日常学习转化为奖学金。",
    focusAreas: ["语言导师", "编程导师", "双重国籍规划", "投资与商业"],
    chapterVerbs: ["学习", "构建", "规划", "投资"],
    productLabel: "产品",
    scholarshipSlogan: "边学边\n创造奖学金。",
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
    { style, borderRadius, ...props },
    ref,
  ) {
    const finalRadius =
      borderRadius !== undefined ? borderRadius : BUTTON_SQUIRCLE_RADIUS;
    const isSquare =
      finalRadius === "0" ||
      finalRadius === 0 ||
      finalRadius === "none" ||
      finalRadius === "0 !important";
    return (
      <Component
        ref={ref}
        borderRadius={finalRadius}
        style={{
          ...style,
          ...(isSquare ? {} : { cornerShape: BUTTON_SQUIRCLE_SHAPE }),
        }}
        {...props}
      />
    );
  });

  SquircleComponent.displayName = displayName;
  return SquircleComponent;
};

const Button = withSquircleCorners(ChakraButton, "LinksSquircleButton");
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

const MusicToggle = ({ isMusicPlaying, onToggleMusic, isLightTheme }) => {
  const themeToggleProps = getThemeModeToggleProps(isLightTheme);
  const label = isMusicPlaying
    ? "Mute background music"
    : "Play background music";

  return (
    <ChakraIconButton
      type="button"
      aria-label={label}
      title={label}
      onClick={onToggleMusic}
      icon={
        <Box
          position="relative"
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          w="18px"
          h="18px"
        >
          <LuMusic
            size={18}
            style={{
              opacity: isMusicPlaying ? 1 : 0.45,
              transition: "opacity 150ms ease",
            }}
          />
          {!isMusicPlaying && (
            <Box
              position="absolute"
              top="50%"
              left="-1px"
              right="-1px"
              h="1.5px"
              bg={
                isLightTheme
                  ? "rgba(23, 23, 26, 0.55)"
                  : "rgba(255, 255, 255, 0.65)"
              }
              borderRadius="1px"
              transform="translateY(-50%) rotate(-45deg)"
            />
          )}
        </Box>
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
        border={
          isLightTheme
            ? "3px solid rgba(36,28,45,0.08)"
            : "3px solid rgba(255,255,255,0.08)"
        }
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
          border={
            isLightTheme
              ? "1px solid rgba(80,32,52,0.14)"
              : "1px solid rgba(255,255,255,0.18)"
          }
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
        borderColor={
          isLightTheme ? "rgba(209,61,116,0.28)" : "rgba(255,116,170,0.38)"
        }
        animation={`${orbitSpin} 18s linear infinite reverse`}
      />
      <Box
        position="absolute"
        left="50%"
        bottom="15%"
        w="56px"
        h="11px"
        borderRadius="full"
        bg={isLightTheme ? "rgba(120,42,75,0.24)" : "rgba(0,0,0,0.46)"}
        filter="blur(9px)"
        animation={`${patreonShadowBreath} 5.2s ease-in-out infinite`}
      />

      <Box
        w="56%"
        h="56%"
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
            <linearGradient
              id="patreon-motion-gradient"
              x1="20%"
              y1="12%"
              x2="82%"
              y2="88%"
            >
              <stop offset="0%" stopColor="#ffb44c" />
              <stop offset="28%" stopColor="#ff5c8a" />
              <stop offset="62%" stopColor="#d83bd2" />
              <stop offset="100%" stopColor="#6e61ff" />
            </linearGradient>
            <linearGradient
              id="patreon-edge-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#ff9e6d" stopOpacity="0.9" />
              <stop offset="52%" stopColor="#ff4f9a" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#7968ff" stopOpacity="0.85" />
            </linearGradient>
            <radialGradient id="patreon-shine" cx="36%" cy="25%" r="72%">
              <stop offset="0%" stopColor="white" stopOpacity="0.72" />
              <stop offset="32%" stopColor="white" stopOpacity="0.16" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <filter
              id="patreon-logo-shadow"
              x="-60%"
              y="-60%"
              width="220%"
              height="240%"
            >
              <feDropShadow
                dx="0"
                dy="8"
                stdDeviation="8"
                floodColor="#8a286f"
                floodOpacity="0.35"
              />
            </filter>
          </defs>

          <g transform="translate(1.5, 8)">
            <path
              d={logoPath}
              fill="#781e75"
              opacity="0.72"
              transform="translate(3 6)"
            />
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
            <ellipse
              cx="79"
              cy="47"
              rx="22"
              ry="10"
              fill="white"
              opacity="0.16"
              transform="rotate(-18 79 47)"
            />
          </g>
        </svg>
      </Box>

      {[
        { top: "19%", left: "12%", size: "7px", delay: "0s", color: "#ffb44c" },
        {
          top: "12%",
          right: "16%",
          size: "5px",
          delay: "1.1s",
          color: "#ff74aa",
        },
        {
          bottom: "24%",
          right: "9%",
          size: "8px",
          delay: "2.2s",
          color: "#8b7cff",
        },
        {
          bottom: "13%",
          left: "21%",
          size: "4px",
          delay: "3.2s",
          color: "#ff5c8a",
        },
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
  panelLabel,
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
        "& .manga-visual-frame": {
          transform: "scale(1.025) rotate(-0.5deg)",
        },
        "& .manga-visual-content": {
          transform: "scale(1.24) translateY(-3px)",
        },
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
          className="manga-visual-frame"
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
          transform="scale(1) rotate(0deg)"
          transition="transform 420ms cubic-bezier(.2,.8,.2,1)"
          _before={{
            content: '""',
            position: "absolute",
            inset: "-18% -12%",
            bgImage: isLightTheme
              ? `repeating-linear-gradient(158deg, transparent 0 18px, ${accent}33 19px 23px, transparent 24px 39px)`
              : `repeating-linear-gradient(158deg, transparent 0 18px, ${accent}45 19px 23px, transparent 24px 39px)`,
            transform: "skewX(-9deg)",
            animation: `${inkSlash} 7s ease-in-out infinite`,
          }}
          _after={{
            content: '""',
            position: "absolute",
            w: { base: "145px", md: "184px" },
            h: { base: "145px", md: "184px" },
            borderRadius: "46% 54% 41% 59% / 57% 42% 58% 43%",
            bg: isLightTheme ? "rgba(255,250,240,0.72)" : "rgba(8,11,24,0.68)",
            border: `3px solid ${accent}`,
            boxShadow: isLightTheme
              ? "5px 6px 0 rgba(36,28,45,0.72)"
              : "5px 6px 0 rgba(0,0,0,0.62)",
            transform: "rotate(3deg)",
          }}
        >
          <Box
            className="manga-visual-content"
            position="relative"
            zIndex={1}
            transform="scale(1.16)"
            transition="transform 420ms cubic-bezier(.2,.8,.2,1)"
            animation={`${drift} 6s ease-in-out infinite`}
            sx={{
              "@media (prefers-reduced-motion: reduce)": { animation: "none" },
            }}
          >
            {visual}
          </Box>
        </Box>
        <VStack
          spacing={4}
          align={textDirection === "rtl" ? "flex-end" : "flex-start"}
        >
          <Text
            fontFamily="monospace"
            fontSize="10px"
            fontWeight="900"
            letterSpacing="0.18em"
            color="white"
            bg={accent}
            border="2px solid"
            borderColor={isLightTheme ? "#241c2d" : "#f7f1e8"}
            boxShadow={isLightTheme ? "3px 3px 0 #241c2d" : "3px 3px 0 #050711"}
            px={3}
            py={1}
            transform="rotate(-2deg)"
          >
            {panelLabel}
          </Text>
          <Heading
            fontSize={{ base: "2xl", md: "3xl" }}
            lineHeight="1.05"
            fontFamily="'DM Sans', sans-serif"
            letterSpacing="-0.045em"
            fontWeight="900"
            color={isLightTheme ? APP_TEXT_PRIMARY : "white"}
            textAlign={descriptionAlign}
            textShadow={
              isLightTheme
                ? "2px 2px 0 rgba(218,61,105,0.12)"
                : "2px 2px 0 rgba(255,112,151,0.15)"
            }
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
          <HStack
            spacing={3}
            align="center"
            justify="flex-start"
            flexWrap="wrap"
            pt={1}
          >
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
              rightIcon={
                <Text as="span" fontSize="lg">
                  ↗
                </Text>
              }
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
              boxShadow={
                isLightTheme ? "2px 3px 0 #241c2d" : "2px 3px 0 #050711"
              }
              transition="transform 180ms ease, box-shadow 180ms ease"
              _focusVisible={{ boxShadow: `0 0 0 3px ${primaryAccent}55` }}
              _hover={{
                transform: "translate(-1px, -2px) scale(1.04)",
                boxShadow: isLightTheme
                  ? "3px 5px 0 #241c2d"
                  : "3px 5px 0 #050711",
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
        gridTemplateColumns={{
          base: "1fr",
          lg: "minmax(0, 1.08fr) minmax(420px, 0.92fr)",
        }}
        alignItems="center"
        gap={{ base: 10, lg: 7 }}
        py={{ base: 10, md: 14, lg: 6 }}
      >
        <VStack
          align={isRtl ? "flex-end" : "flex-start"}
          spacing={{ base: 6, md: 7 }}
          textAlign={directionalTextAlign}
          animation={`${heroRise} 700ms cubic-bezier(.2,.8,.2,1) both`}
          sx={{
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
        >
          <HStack spacing={3} align="center" w="100%">
            <Box
              h="4px"
              flex={{ base: "0 0 44px", md: "0 0 72px" }}
              bg={isLightTheme ? "#241c2d" : "#f7f1e8"}
              transform="skewX(-28deg)"
              boxShadow={
                isLightTheme ? "6px 4px 0 #e34069" : "6px 4px 0 #ff6f91"
              }
            />
            <Text
              fontFamily="monospace"
              fontSize={{ base: "10px", md: "xs" }}
              fontWeight="900"
              letterSpacing="0.2em"
              color={isLightTheme ? "#d13d74" : "#ff7c9d"}
            >
              CHAPTER: CREATE
            </Text>
          </HStack>
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
              boxShadow={
                isLightTheme ? "3px 4px 0 #241c2d" : "3px 4px 0 #050711"
              }
              transition="background 180ms ease, border-color 180ms ease, transform 180ms ease"
              _hover={{
                bg: isLightTheme
                  ? "rgba(15,118,110,0.08)"
                  : "rgba(86,240,216,0.1)",
                borderColor: primaryAccent,
                boxShadow: isLightTheme
                  ? "4px 5px 0 #241c2d"
                  : "4px 5px 0 #050711",
                transform: "translate(-1px, -1px)",
              }}
              _active={{
                bg: isLightTheme
                  ? "rgba(15,118,110,0.12)"
                  : "rgba(86,240,216,0.14)",
                transform: "translateY(0)",
                boxShadow: isLightTheme
                  ? "1px 1px 0 #241c2d"
                  : "1px 1px 0 #050711",
              }}
              _focusVisible={{ boxShadow: `0 0 0 3px ${primaryAccent}33` }}
            >
              {editProfileText}
            </ChakraButton>
          </HStack>

          <Heading
            as="h1"
            fontFamily="'DM Sans', sans-serif"
            fontSize={{
              base: "clamp(3.35rem, 15.5vw, 5.6rem)",
              md: "clamp(5rem, 8.7vw, 8.4rem)",
            }}
            lineHeight="0.87"
            letterSpacing="-0.073em"
            fontWeight="900"
            maxW="920px"
            position="relative"
            color={isLightTheme ? "#241c2d" : "#f7f1e8"}
            textShadow={
              isLightTheme
                ? "5px 6px 0 rgba(218,61,105,0.2)"
                : "5px 6px 0 rgba(255,103,143,0.2)"
            }
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
            bg={isLightTheme ? "rgba(255,250,240,0.84)" : "rgba(17,20,38,0.84)"}
            border="2px solid"
            borderColor={isLightTheme ? "#241c2d" : "rgba(247,241,232,0.88)"}
            boxShadow={isLightTheme ? "7px 8px 0 #55cdbc" : "7px 8px 0 #238f88"}
            px={{ base: 4, md: 5 }}
            py={{ base: 3, md: 4 }}
            position="relative"
            _after={{
              content: '""',
              position: "absolute",
              insetInlineStart: { base: "28px", md: "42px" },
              bottom: "-18px",
              borderTop: isLightTheme
                ? "18px solid #241c2d"
                : "18px solid rgba(247,241,232,0.88)",
              borderRight: "14px solid transparent",
              transform: "skewX(-12deg)",
            }}
          >
            {heroCopy.body}
          </Text>

          <HStack
            spacing={3}
            flexWrap="wrap"
            justify={isRtl ? "flex-end" : "flex-start"}
          >
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
              boxShadow={
                isLightTheme ? "5px 6px 0 #d13d74" : "5px 6px 0 #d94b73"
              }
              _hover={{
                bg: isLightTheme ? "#fffaf0" : "#171b31",
                transform: "translate(-1px, -2px)",
                boxShadow: isLightTheme
                  ? "7px 8px 0 #d13d74"
                  : "7px 8px 0 #d94b73",
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
          MAKE!
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
        boxShadow={
          isLightTheme ? "7px 8px 0 rgba(36,28,45,0.92)" : "7px 8px 0 #050711"
        }
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
          <Box
            position="relative"
            zIndex={1}
            transform={{ base: "scale(0.92)", md: "scale(1.08)" }}
          >
            <RandomCharacter
              notSoRandomCharacter={randomCharacterKey}
              width="170px"
              containerHeight={210}
            />
          </Box>
        )}
      </Box>
      <Box
        position="absolute"
        top={{ base: "-1%", md: "0%" }}
        right={{ base: "15%", md: "17%" }}
        zIndex={4}
        px={{ base: 3, md: 4 }}
        py={{ base: 2, md: 2.5 }}
        bg={isLightTheme ? "#fffaf0" : "#f7f1e8"}
        color="#241c2d"
        border={{ base: "2px solid", md: "3px solid" }}
        borderColor="#241c2d"
        borderRadius="55% 45% 51% 49% / 46% 57% 43% 54%"
        boxShadow="4px 5px 0 #241c2d"
        animation={`${speechPop} 650ms 700ms cubic-bezier(.2,.9,.2,1) both`}
        transformOrigin="bottom left"
        _after={{
          content: '""',
          position: "absolute",
          left: "14%",
          bottom: "-14px",
          borderTop: "16px solid #241c2d",
          borderRight: "11px solid transparent",
          transform: "rotate(16deg)",
        }}
        sx={{
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        }}
      >
        <Text
          fontFamily="'DM Sans', sans-serif"
          fontSize={{ base: "10px", md: "sm" }}
          fontWeight="900"
          fontStyle="italic"
          whiteSpace="nowrap"
        >
          LET&apos;S GO!
        </Text>
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

function MangaChapterBreak({ isLightTheme }) {
  const ribbonWords = ["LEARN", "CREATE", "BUILD", "GROW"];
  const repeatedWords = [
    ...ribbonWords,
    ...ribbonWords,
    ...ribbonWords,
    ...ribbonWords,
  ];
  const ink = isLightTheme ? "#241c2d" : "#f7f1e8";
  const paper = isLightTheme ? "#fffaf0" : "#111426";

  return (
    <Box
      position="relative"
      zIndex={2}
      mt={{ base: 14, md: 6 }}
      mb={{ base: 4, md: 10 }}
      aria-hidden="true"
      userSelect="none"
    >
      <Box
        w="calc(100% + 32px)"
        ms="-16px"
        overflow="hidden"
        borderBlock="4px solid"
        borderColor={ink}
        bg={isLightTheme ? "#e34069" : "#f05d82"}
        transform="rotate(-1.2deg)"
        boxShadow={isLightTheme ? "0 9px 0 #241c2d" : "0 9px 0 #050711"}
      >
        <HStack
          spacing={0}
          w="max-content"
          py={{ base: 2.5, md: 3 }}
          animation={`${mangaMarquee} 22s linear infinite`}
          sx={{
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
        >
          {repeatedWords.map((word, index) => (
            <HStack
              key={`${word}-${index}`}
              spacing={{ base: 5, md: 8 }}
              px={{ base: 5, md: 8 }}
            >
              <Text
                fontFamily="'DM Sans', sans-serif"
                fontSize={{ base: "lg", md: "2xl" }}
                fontWeight="900"
                fontStyle="italic"
                letterSpacing="0.08em"
                color="white"
                textShadow="2px 2px 0 rgba(36,28,45,0.8)"
              >
                {word}
              </Text>
              <Box
                w={{ base: "9px", md: "12px" }}
                h={{ base: "9px", md: "12px" }}
                bg="#ffd25f"
                transform="rotate(45deg)"
                border="2px solid #241c2d"
              />
            </HStack>
          ))}
        </HStack>
      </Box>

      <Container maxW="container.xl" mt={{ base: 12, md: 16 }}>
        <Box
          display="grid"
          gridTemplateColumns={{ base: "1.1fr 0.9fr", md: "1.2fr 0.8fr 1fr" }}
          gridTemplateRows={{ base: "118px 92px", md: "170px" }}
          gap={{ base: 3, md: 4 }}
          transform="rotate(0.35deg)"
        >
          <Box
            gridRow={{ base: "1", md: "1" }}
            gridColumn={{ base: "1", md: "1" }}
            position="relative"
            overflow="hidden"
            border="4px solid"
            borderColor={ink}
            bg={paper}
            boxShadow={isLightTheme ? "6px 7px 0 #55cdbc" : "6px 7px 0 #2aa99d"}
            _before={{
              content: '""',
              position: "absolute",
              inset: "-20%",
              bgImage: isLightTheme
                ? "repeating-linear-gradient(154deg, transparent 0 20px, rgba(36,28,45,0.13) 21px 24px, transparent 25px 36px)"
                : "repeating-linear-gradient(154deg, transparent 0 20px, rgba(255,255,255,0.13) 21px 24px, transparent 25px 36px)",
              animation: `${inkSlash} 6s ease-in-out infinite`,
            }}
          >
            <Text
              position="absolute"
              insetInlineEnd={{ base: 3, md: 6 }}
              bottom={{ base: -3, md: -7 }}
              fontFamily="'DM Sans', sans-serif"
              fontSize={{ base: "7xl", md: "9xl" }}
              fontWeight="900"
              fontStyle="italic"
              color={isLightTheme ? "#e34069" : "#ff6f91"}
              lineHeight="1"
              textShadow={`4px 4px 0 ${ink}`}
            >
              !
            </Text>
          </Box>

          <Box
            gridRow={{ base: "1", md: "1" }}
            gridColumn={{ base: "2", md: "2" }}
            position="relative"
            overflow="hidden"
            border="4px solid"
            borderColor={ink}
            bg={isLightTheme ? "#ffd25f" : "#e7a93e"}
            boxShadow={isLightTheme ? "6px 7px 0 #241c2d" : "6px 7px 0 #050711"}
            _before={{
              content: '""',
              position: "absolute",
              inset: 0,
              bgImage:
                "radial-gradient(circle, rgba(36,28,45,0.3) 1.3px, transparent 1.4px)",
              bgSize: "11px 11px",
              opacity: 0.55,
            }}
          >
            <Box
              position="absolute"
              inset={{ base: "20% 14%", md: "19% 13%" }}
              bg={paper}
              border="3px solid"
              borderColor={ink}
              borderRadius="52% 48% 44% 56% / 47% 55% 45% 53%"
              transform="rotate(-5deg)"
              _after={{
                content: '""',
                position: "absolute",
                left: "16%",
                bottom: "-18px",
                borderTop: `22px solid ${ink}`,
                borderRight: "15px solid transparent",
                transform: "rotate(18deg)",
              }}
            />
            <Text
              position="absolute"
              inset={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              zIndex={1}
              fontFamily="'DM Sans', sans-serif"
              fontSize={{ base: "xl", md: "3xl" }}
              fontWeight="900"
              fontStyle="italic"
              color={ink}
              transform="rotate(-5deg)"
            >
              WOW!
            </Text>
          </Box>

          <Box
            gridRow={{ base: "2", md: "1" }}
            gridColumn={{ base: "1 / span 2", md: "3" }}
            position="relative"
            overflow="hidden"
            border="4px solid"
            borderColor={ink}
            bg={isLightTheme ? "#385fd2" : "#426ee2"}
            boxShadow={isLightTheme ? "6px 7px 0 #e34069" : "6px 7px 0 #b9365c"}
            _before={{
              content: '""',
              position: "absolute",
              top: "-30%",
              left: "-5%",
              w: "115%",
              h: "48%",
              bg: "rgba(255,255,255,0.85)",
              transform: "rotate(-9deg)",
              boxShadow: "0 26px 0 rgba(255,210,95,0.96)",
            }}
          >
            <HStack
              position="absolute"
              inset={0}
              justify="center"
              spacing={{ base: 2, md: 4 }}
              pt={{ base: 3, md: 6 }}
            >
              {[0, 1, 2].map((item) => (
                <Box
                  key={item}
                  w={{ base: "42px", md: "58px" }}
                  h={{ base: "9px", md: "12px" }}
                  bg="white"
                  transform={`translateY(${(item - 1) * 8}px) skewX(-28deg)`}
                  boxShadow="4px 4px 0 rgba(36,28,45,0.72)"
                />
              ))}
            </HStack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

function MangaInkBackdrop({ isLightTheme }) {
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
        inset={0}
        bgImage={
          isLightTheme
            ? "radial-gradient(circle, rgba(36,28,45,0.22) 1px, transparent 1.15px)"
            : "radial-gradient(circle, rgba(255,255,255,0.13) 1px, transparent 1.15px)"
        }
        bgSize="15px 15px"
        opacity={0.28}
      />
      <Box
        position="absolute"
        top="-12%"
        left="-8%"
        w="64%"
        h="58%"
        bg={isLightTheme ? "rgba(227,64,105,0.12)" : "rgba(240,93,130,0.12)"}
        clipPath="polygon(0 0, 82% 0, 100% 72%, 16% 100%)"
        border="3px solid"
        borderColor={
          isLightTheme ? "rgba(36,28,45,0.08)" : "rgba(255,255,255,0.07)"
        }
      />
      <Box
        position="absolute"
        top="14%"
        right="-22%"
        w="68%"
        h="26%"
        bg={isLightTheme ? "rgba(85,205,188,0.14)" : "rgba(66,189,177,0.12)"}
        transform="rotate(-14deg)"
        borderBlock="3px solid"
        borderColor={
          isLightTheme ? "rgba(36,28,45,0.08)" : "rgba(255,255,255,0.07)"
        }
      />
      <Box
        position="absolute"
        inset={0}
        bgImage={
          isLightTheme
            ? "repeating-linear-gradient(106deg, transparent 0 52px, rgba(36,28,45,0.045) 53px 55px, transparent 56px 88px)"
            : "repeating-linear-gradient(106deg, transparent 0 52px, rgba(255,255,255,0.04) 53px 55px, transparent 56px 88px)"
        }
      />
    </Box>
  );
}

function AnimeTransformationBeat() {
  const scrollToStories = () => {
    document.getElementById("projects")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <Box
      id="transformation"
      as="section"
      minH={{ base: "108svh", md: "118svh" }}
      position="relative"
      overflow="hidden"
      bg="#04050b"
      color="#fffaf2"
      borderBottom="6px solid #fffaf2"
      isolation="isolate"
    >
      <AnimeFinaleCanvas
        isLightTheme={false}
        intensity={1.75}
        focus="center"
        variant="release"
        opacity={0.92}
      />
      <Box
        position="absolute"
        inset={0}
        zIndex={1}
        pointerEvents="none"
        bgImage="linear-gradient(90deg, rgba(4,5,11,0.92) 0%, rgba(4,5,11,0.18) 35%, rgba(4,5,11,0.08) 65%, rgba(4,5,11,0.88) 100%), radial-gradient(circle at center, transparent 0 30%, rgba(4,5,11,0.78) 78%)"
      />
      <Box
        position="absolute"
        inset={0}
        zIndex={2}
        pointerEvents="none"
        opacity={0.24}
        bgImage="radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1.2px)"
        bgSize="18px 18px"
        maskImage="linear-gradient(to bottom, black, transparent 32%, transparent 70%, black)"
      />
      <Box
        position="absolute"
        left="50%"
        top="50%"
        zIndex={3}
        w={{ base: "3px", md: "5px" }}
        h={{ base: "72%", md: "82%" }}
        bg="white"
        transformOrigin="center"
        animation={`${bladeAwaken} 1.6s cubic-bezier(.12,.76,.2,1) both`}
        boxShadow="0 0 12px #fff, 0 0 36px #35f4ea, 0 0 92px #ff3f78"
        _before={{
          content: '""',
          position: "absolute",
          inset: "-14% -8px",
          bg: "linear-gradient(to bottom, transparent, rgba(53,244,234,0.9), white, rgba(255,63,120,0.9), transparent)",
          filter: "blur(12px)",
        }}
      />
      <Box
        position="absolute"
        inset={0}
        zIndex={8}
        pointerEvents="none"
        bg="white"
        opacity={0}
        animation={`${finaleFlash} 7.6s ease-in-out infinite`}
        sx={{
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        }}
      />

      <Container
        maxW="container.xl"
        minH={{ base: "108svh", md: "118svh" }}
        position="relative"
        zIndex={6}
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        py={{ base: 8, md: 12 }}
      >
        <HStack justify="space-between" align="flex-start" spacing={5}>
          <VStack align="flex-start" spacing={1}>
            <Text
              fontFamily="monospace"
              fontWeight="900"
              fontSize={{ base: "10px", md: "sm" }}
              letterSpacing="0.22em"
              color="#35f4ea"
            >
              EPISODE 00 // AWAKENING
            </Text>
            <Text
              fontFamily="monospace"
              fontSize={{ base: "9px", md: "xs" }}
              letterSpacing="0.14em"
              color="rgba(255,250,242,0.56)"
            >
              AN ORIGINAL STORY ABOUT MAKING THE IMPOSSIBLE REAL
            </Text>
          </VStack>
          <HStack spacing={1.5} aria-hidden="true">
            {[18, 32, 12, 42, 24].map((height, index) => (
              <Box
                key={`${height}-${index}`}
                w={{ base: "2px", md: "3px" }}
                h={`${height}px`}
                bg={index % 2 === 0 ? "#ff3f78" : "#35f4ea"}
                transform="skewX(-14deg)"
                boxShadow={`0 0 12px ${index % 2 === 0 ? "#ff3f78" : "#35f4ea"}`}
              />
            ))}
          </HStack>
        </HStack>

        <Box position="relative" py={{ base: 12, md: 16 }}>
          <Text
            fontFamily="monospace"
            fontWeight="900"
            fontSize={{ base: "10px", md: "sm" }}
            letterSpacing="0.34em"
            textAlign="center"
            color="#ffc34e"
            mb={{ base: 5, md: 8 }}
            textShadow="0 0 18px rgba(255,195,78,0.72)"
          >
            WHEN CURIOSITY BECOMES RESOLVE
          </Text>
          <Heading
            as="h2"
            fontFamily="'DM Sans', sans-serif"
            fontSize={{
              base: "clamp(4rem, 20vw, 7rem)",
              md: "clamp(7rem, 14vw, 13rem)",
            }}
            lineHeight="0.68"
            letterSpacing="-0.085em"
            fontWeight="900"
            fontStyle="italic"
            textAlign="center"
            textTransform="uppercase"
            animation={`${limitBreak} 6s steps(1, end) infinite`}
            sx={{
              "@media (prefers-reduced-motion: reduce)": { animation: "none" },
            }}
          >
            <Text
              as="span"
              display="block"
              color="transparent"
              sx={{
                WebkitTextStroke: { base: "2px #fffaf2", md: "3px #fffaf2" },
              }}
              textShadow="10px 11px 0 rgba(255,63,120,0.34)"
              transform="translateX(-4%)"
            >
              BREAK
            </Text>
            <Text
              as="span"
              display="block"
              bgGradient="linear(to-r, #35f4ea 0%, #fffaf2 46%, #ff3f78 100%)"
              bgClip="text"
              filter="drop-shadow(0 0 30px rgba(53,244,234,0.3))"
              transform="translateX(3%)"
            >
              THE LIMIT
            </Text>
          </Heading>
          <Box
            mx="auto"
            mt={{ base: 8, md: 12 }}
            maxW="680px"
            position="relative"
            bg="rgba(4,5,11,0.72)"
            borderInlineStart="4px solid #ff3f78"
            borderInlineEnd="4px solid #35f4ea"
            backdropFilter="blur(8px)"
            px={{ base: 5, md: 8 }}
            py={{ base: 4, md: 5 }}
          >
            <Text
              textAlign="center"
              fontFamily="'DM Sans', sans-serif"
              fontSize={{ base: "md", md: "xl" }}
              fontWeight="700"
              lineHeight="1.5"
            >
              An idea is small only until you decide to move. Then the whole
              world has to make room for it.
            </Text>
          </Box>
        </Box>

        <HStack
          justify="space-between"
          align={{ base: "flex-end", md: "center" }}
          spacing={5}
        >
          <Text
            maxW="360px"
            fontFamily="monospace"
            fontSize={{ base: "9px", md: "xs" }}
            letterSpacing="0.14em"
            lineHeight="1.7"
            color="rgba(255,250,242,0.58)"
          >
            FOUR WORLDS ARE WAITING. EACH ONE BEGINS WITH A DIFFERENT KIND OF
            COURAGE.
          </Text>
          <ChakraButton
            onClick={scrollToStories}
            minH={{ base: "52px", md: "60px" }}
            px={{ base: 5, md: 8 }}
            bg="#fffaf2"
            color="#080914"
            border="3px solid #fffaf2"
            borderRadius="0"
            boxShadow="7px 8px 0 #ff3f78, 12px 14px 0 #35f4ea"
            fontFamily="'DM Sans', sans-serif"
            fontWeight="900"
            fontSize={{ base: "xs", md: "md" }}
            letterSpacing="0.08em"
            _hover={{
              bg: "white",
              transform: "translate(-3px,-4px)",
              boxShadow: "10px 12px 0 #ff3f78, 17px 19px 0 #35f4ea",
            }}
            _active={{
              transform: "translate(3px,4px)",
              boxShadow: "3px 4px 0 #ff3f78",
            }}
          >
            ENTER CHAPTER ONE ↓
          </ChakraButton>
        </HStack>
      </Container>

      <Text
        aria-hidden="true"
        position="absolute"
        left={{ base: "-10px", md: "2%" }}
        bottom={{ base: "19%", md: "12%" }}
        zIndex={4}
        fontFamily="'DM Sans', sans-serif"
        fontSize={{ base: "4xl", md: "7xl" }}
        fontWeight="900"
        fontStyle="italic"
        color="rgba(255,255,255,0.05)"
        transform="rotate(-90deg) translateX(-100%)"
        transformOrigin="bottom left"
      >
        MAKE IT REAL
      </Text>
    </Box>
  );
}

function MangaCover({
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
  const ink = isLightTheme ? "#211827" : "#f8f1e7";
  const paper = isLightTheme ? "#fff8e9" : "#101322";
  const [isAwakened, setIsAwakened] = useState(false);
  const enterStory = () => {
    setIsAwakened(true);
    window.setTimeout(() => {
      document.getElementById("transformation")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 420);
  };
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
    <Box
      as="section"
      minH={{ base: "auto", lg: "100svh" }}
      position="relative"
      overflow="hidden"
      borderBottom="6px solid"
      borderColor={ink}
      bg={isLightTheme ? "#fff4df" : "#090b16"}
    >
      <MangaInkBackdrop isLightTheme={isLightTheme} />
      <AnimeFinaleCanvas
        isLightTheme={isLightTheme}
        intensity={isAwakened ? 2.65 : 0.82}
        focus="right"
        variant="storm"
        opacity={isLightTheme ? 0.42 : 0.72}
      />
      <Box
        position="absolute"
        inset={0}
        zIndex={7}
        pointerEvents="none"
        bg="white"
        opacity={isAwakened ? 0.78 : 0}
        transition="opacity 160ms ease"
        sx={{
          "@media (prefers-reduced-motion: reduce)": {
            display: "none",
          },
        }}
      />
      <Container maxW="container.xl" position="relative" zIndex={2}>
        <Box
          as="nav"
          position="fixed"
          top={{ base: 3, md: 5 }}
          right={{ base: 3, md: 6 }}
          zIndex={90}
          display="flex"
          justifyContent="flex-end"
        >
          <HStack
            spacing={{ base: 2.5, md: 3 }}
            dir="ltr"
            px={{ base: 2.5, md: 3 }}
            py={{ base: 2, md: 2.5 }}
            bg={paper}
            border="3px solid"
            borderColor={ink}
            boxShadow={isLightTheme ? "6px 7px 0 #e34069" : "6px 7px 0 #c93c65"}
            transform="rotate(0.6deg)"
          >
            {socialItems.map((item) => (
              <Box
                key={item.label}
                as="button"
                type="button"
                aria-label={item.label}
                bg={item.bg}
                borderRadius="9px"
                w={{ base: "36px", md: "38px" }}
                h={{ base: "36px", md: "38px" }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="white"
                p={0}
                lineHeight="0"
                overflow="hidden"
                border="2px solid"
                borderColor={ink}
                boxShadow={
                  isLightTheme ? "2px 3px 0 #211827" : "2px 3px 0 #050711"
                }
                transition="transform 160ms ease"
                _hover={{
                  transform: "translateY(-3px) rotate(-3deg) scale(1.05)",
                }}
                _focusVisible={{ boxShadow: `0 0 0 3px ${primaryAccent}66` }}
                onClick={() =>
                  onSocialClick(item.label.toLowerCase(), item.url)
                }
              >
                {item.icon}
              </Box>
            ))}
            {languageControl}
            {themeControl}
          </HStack>
        </Box>

        <Box
          display="grid"
          gridTemplateColumns={{
            base: "1fr",
            lg: "minmax(0, 0.92fr) minmax(480px, 1.08fr)",
          }}
          alignItems="center"
          gap={{ base: 9, lg: 3 }}
          minH={{ base: "auto", lg: "calc(100svh - 100px)" }}
          pt={{ base: 28, md: 28, lg: 18 }}
          pb={{ base: 16, lg: 8 }}
        >
          <VStack
            align={isRtl ? "flex-end" : "flex-start"}
            spacing={{ base: 5, md: 6 }}
            textAlign={directionalTextAlign}
            position="relative"
            zIndex={4}
          >
            <HStack spacing={3} align="center">
              <Text
                px={3}
                py={1}
                bg={isLightTheme ? "#211827" : "#f8f1e7"}
                color={isLightTheme ? "#fff8e9" : "#101322"}
                fontFamily="monospace"
                fontSize="xs"
                fontWeight="900"
                letterSpacing="0.18em"
                transform="rotate(-2deg)"
              >
                ORIGINAL SERIES
              </Text>
              <Box
                w={{ base: "42px", md: "80px" }}
                h="5px"
                bg="#e34069"
                transform="skewX(-28deg)"
              />
            </HStack>

            <Box w="100%" position="relative">
              <Text
                aria-hidden="true"
                position="absolute"
                top={{ base: "-28px", md: "-48px" }}
                insetInlineStart={{ base: "-4px", md: "-12px" }}
                fontFamily="'DM Sans', sans-serif"
                fontWeight="900"
                fontStyle="italic"
                fontSize={{ base: "5xl", md: "7xl" }}
                color={
                  isLightTheme
                    ? "rgba(227,64,105,0.16)"
                    : "rgba(255,111,145,0.14)"
                }
                transform="rotate(-8deg)"
              >
                DREAM
              </Text>
              <Heading
                as="h1"
                position="relative"
                fontFamily="'DM Sans', sans-serif"
                fontSize={{
                  base: "clamp(3.35rem, 15.5vw, 5.5rem)",
                  md: "clamp(5rem, 7.2vw, 7.3rem)",
                }}
                lineHeight="0.82"
                letterSpacing="-0.075em"
                fontWeight="900"
                color={ink}
                textShadow={
                  isLightTheme
                    ? "6px 7px 0 rgba(227,64,105,0.18)"
                    : "6px 7px 0 rgba(255,111,145,0.2)"
                }
                animation={`${coverCutIn} 720ms cubic-bezier(.2,.85,.2,1) both`}
              >
                <Text
                  as="span"
                  display="block"
                  wordBreak="keep-all"
                  overflowWrap="normal"
                >
                  {heroCopy.titleLead}
                </Text>
                <Text
                  as="span"
                  display="block"
                  color={isLightTheme ? "#e34069" : "#ff7397"}
                  textShadow={
                    isLightTheme ? "5px 6px 0 #55cdbc" : "5px 6px 0 #236e71"
                  }
                >
                  {heroCopy.titleAccent}
                </Text>
              </Heading>
            </Box>

            <Box
              maxW="600px"
              bg={paper}
              border="3px solid"
              borderColor={ink}
              boxShadow={
                isLightTheme ? "8px 9px 0 #55cdbc" : "8px 9px 0 #237d78"
              }
              px={{ base: 4, md: 5 }}
              py={{ base: 3, md: 4 }}
              position="relative"
              transform="rotate(-0.7deg)"
              _after={{
                content: '""',
                position: "absolute",
                left: "34px",
                bottom: "-22px",
                borderTop: `23px solid ${ink}`,
                borderRight: "18px solid transparent",
                transform: "rotate(10deg)",
              }}
            >
              <Text
                fontFamily="'DM Sans', sans-serif"
                fontSize={{ base: "md", md: "xl" }}
                lineHeight="1.5"
                color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"}
              >
                {heroCopy.body}
              </Text>
            </Box>

            <HStack spacing={3} flexWrap="wrap" pt={2}>
              <HStack
                spacing={3}
                px={3}
                py={2}
                borderInlineStart="5px solid #e34069"
                bg={
                  isLightTheme ? "rgba(255,248,233,0.8)" : "rgba(16,19,34,0.82)"
                }
              >
                <Text
                  fontFamily="monospace"
                  fontSize={{ base: "xs", md: "sm" }}
                  color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"}
                >
                  {translations.welcome}, {welcomeText}
                </Text>
                <ChakraButton
                  onClick={onProfileOpen}
                  leftIcon={<LuPencilLine size={15} strokeWidth={2.2} />}
                  h="38px"
                  px={4}
                  bg={paper}
                  border="2px solid"
                  borderColor={ink}
                  color={primaryAccent}
                  boxShadow={
                    isLightTheme ? "3px 4px 0 #211827" : "3px 4px 0 #050711"
                  }
                  fontFamily="'DM Sans', sans-serif"
                  fontWeight="800"
                  _hover={{ transform: "translateY(-2px)" }}
                >
                  {editProfileText}
                </ChakraButton>
              </HStack>
              <Button
                onClick={enterStory}
                onMouseEnter={() => setIsAwakened(true)}
                onMouseLeave={() => setIsAwakened(false)}
                h="54px"
                px={{ base: 5, md: 7 }}
                bg="#e34069"
                color="white"
                border="3px solid"
                borderColor={ink}
                boxShadow={
                  isLightTheme ? "6px 7px 0 #55cdbc" : "6px 7px 0 #35bfb7"
                }
                textShadow="0 2px 2px rgba(45,4,18,0.55)"
                fontFamily="'DM Sans', sans-serif"
                fontWeight="900"
                letterSpacing="0.04em"
                _hover={{
                  bg: "#f04d79",
                  transform: "translate(-2px,-3px)",
                  boxShadow: isLightTheme
                    ? "9px 10px 0 #55cdbc"
                    : "9px 10px 0 #35bfb7",
                }}
                _active={{
                  transform: "translate(3px,4px)",
                  boxShadow: "2px 3px 0 #35bfb7",
                }}
              >
                BEGIN THE EPISODE ↓
              </Button>
              <Button
                onClick={onAboutOpen}
                h="54px"
                px={6}
                bg={isLightTheme ? "#211827" : "#f8f1e7"}
                color={isLightTheme ? "white" : "#101322"}
                border="3px solid"
                borderColor={ink}
                boxShadow={
                  isLightTheme ? "6px 7px 0 #e34069" : "6px 7px 0 #c93c65"
                }
                fontFamily="'DM Sans', sans-serif"
                fontWeight="900"
                _hover={{
                  transform: "translate(-2px,-3px)",
                  boxShadow: isLightTheme
                    ? "8px 10px 0 #e34069"
                    : "8px 10px 0 #c93c65",
                }}
              >
                {translations.about} ↗
              </Button>
            </HStack>
          </VStack>

          <Box
            minH={{ base: "480px", md: "600px", lg: "690px" }}
            position="relative"
            isolation="isolate"
            animation={`${coverCharacterIn} 880ms 180ms cubic-bezier(.2,.85,.2,1) both`}
            sx={{
              "@media (prefers-reduced-motion: reduce)": { animation: "none" },
            }}
          >
            <Box
              position="absolute"
              inset={{ base: "7% -17% 7% 4%", md: "4% -10% 4% 2%" }}
              bg={isLightTheme ? "#e34069" : "#cf3f68"}
              clipPath="polygon(12% 0, 100% 0, 88% 100%, 0 90%)"
              border="4px solid"
              borderColor={ink}
              boxShadow={
                isLightTheme ? "15px 17px 0 #211827" : "15px 17px 0 #050711"
              }
              overflow="hidden"
              _before={{
                content: '""',
                position: "absolute",
                inset: "-30% -20%",
                bgImage: isLightTheme
                  ? "repeating-linear-gradient(164deg, transparent 0 20px, rgba(33,24,39,0.22) 21px 24px, transparent 25px 38px)"
                  : "repeating-linear-gradient(164deg, transparent 0 20px, rgba(255,255,255,0.18) 21px 24px, transparent 25px 38px)",
                animation: `${chapterSweep} 8s ease-in-out infinite`,
              }}
            />
            <Box
              position="absolute"
              top={{ base: "3%", md: "1%" }}
              right={{ base: "-4%", md: "2%" }}
              w={{ base: "38%", md: "34%" }}
              h={{ base: "23%", md: "25%" }}
              bg={isLightTheme ? "#ffd25f" : "#e6aa42"}
              border="4px solid"
              borderColor={ink}
              transform="rotate(5deg)"
              boxShadow={
                isLightTheme ? "8px 9px 0 #211827" : "8px 9px 0 #050711"
              }
              _before={{
                content: '""',
                position: "absolute",
                inset: 0,
                bgImage:
                  "radial-gradient(circle, rgba(33,24,39,0.34) 1.4px, transparent 1.5px)",
                bgSize: "11px 11px",
              }}
            >
              <Text
                position="relative"
                zIndex={1}
                p={{ base: 3, md: 5 }}
                fontFamily="'DM Sans', sans-serif"
                fontWeight="900"
                fontStyle="italic"
                fontSize={{ base: "xl", md: "4xl" }}
                lineHeight="0.9"
                color="#211827"
              >
                MAKE IT
                <br />
                REAL.
              </Text>
            </Box>
            <Box
              position="absolute"
              left={{ base: "4%", md: "8%" }}
              bottom={{ base: "2%", md: "3%" }}
              w={{ base: "86%", md: "80%" }}
              h={{ base: "78%", md: "82%" }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg={paper}
              border="5px solid"
              borderColor={ink}
              clipPath="polygon(8% 0, 100% 6%, 93% 100%, 0 92%)"
              boxShadow={
                isLightTheme ? "12px 14px 0 #55cdbc" : "12px 14px 0 #237d78"
              }
              overflow="hidden"
              _before={{
                content: '""',
                position: "absolute",
                inset: 0,
                bgImage: isLightTheme
                  ? "radial-gradient(circle, rgba(227,64,105,0.28) 1.4px, transparent 1.5px)"
                  : "radial-gradient(circle, rgba(255,111,145,0.25) 1.4px, transparent 1.5px)",
                bgSize: "13px 13px",
                opacity: 0.58,
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
                <Box
                  position="relative"
                  zIndex={1}
                  transform={{ base: "scale(1.65)", md: "scale(2.2)" }}
                  transformOrigin="center bottom"
                >
                  <RandomCharacter
                    notSoRandomCharacter={randomCharacterKey}
                    width="190px"
                    containerHeight={240}
                  />
                </Box>
              )}
            </Box>
            <Box
              position="absolute"
              left={{ base: "-1%", md: "2%" }}
              top={{ base: "18%", md: "15%" }}
              zIndex={5}
              bg={isLightTheme ? "#211827" : "#f8f1e7"}
              color={isLightTheme ? "white" : "#101322"}
              border="3px solid"
              borderColor={ink}
              boxShadow="5px 6px 0 #55cdbc"
              px={4}
              py={2}
              transform="rotate(-7deg)"
              fontFamily="monospace"
              fontWeight="900"
              letterSpacing="0.14em"
              fontSize={{ base: "10px", md: "sm" }}
            >
              BIG DREAM ENERGY
            </Box>
            <Text
              aria-hidden="true"
              position="absolute"
              right={{ base: "-4%", md: "-2%" }}
              bottom={{ base: "2%", md: "0" }}
              zIndex={6}
              fontFamily="'DM Sans', sans-serif"
              fontSize={{ base: "6xl", md: "8xl" }}
              fontWeight="900"
              fontStyle="italic"
              color={isLightTheme ? "#211827" : "#f8f1e7"}
              textShadow={
                isLightTheme ? "5px 6px 0 #ffd25f" : "5px 6px 0 #b7812c"
              }
              animation={`${exclamationPulse} 2.8s ease-in-out infinite`}
            >
              WOW!
            </Text>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

function useSceneReveal() {
  const sceneRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.16, rootMargin: "0px 0px -8%" },
    );
    observer.observe(scene);
    return () => observer.disconnect();
  }, []);

  return [sceneRef, isVisible];
}

function MangaProjectScene({
  link,
  index,
  isLightTheme,
  pageDirection,
  onLaunchSound,
  onLaunchEvent,
}) {
  const ink = isLightTheme ? "#211827" : "#f8f1e7";
  const paper = isLightTheme ? "#fff8e9" : "#101322";
  const isReverse = index % 2 === 1;
  const [sceneRef, isVisible] = useSceneReveal();
  const sceneLabels = ["LANGUAGE ARC", "CODE ARC", "LIFE ARC", "CREATOR ARC"];
  const sceneWords = ["SPEAK", "BUILD", "BELONG", "UNLOCK"];
  const sceneBackgrounds = isLightTheme
    ? ["#dff6ef", "#fff0d8", "#e9efff", "#ffe3ec"]
    : ["#0e282c", "#302316", "#151e3b", "#32182a"];
  const actionProps = link.onLaunch
    ? {
        as: "button",
        onClick: () => {
          onLaunchSound?.();
          onLaunchEvent?.();
          link.onLaunch?.();
        },
      }
    : {
        as: "a",
        href: link.href,
        target: "_blank",
        rel: "noopener noreferrer",
        onClick: () => {
          onLaunchSound?.();
          onLaunchEvent?.();
        },
      };

  return (
    <Box
      ref={sceneRef}
      as="article"
      minH={{ base: "auto", lg: "92svh" }}
      display="flex"
      alignItems="center"
      position="relative"
      overflow="hidden"
      bg={sceneBackgrounds[index]}
      borderBottom="6px solid"
      borderColor={ink}
      isolation="isolate"
      py={{ base: 14, md: 18, lg: 12 }}
    >
      <Text
        aria-hidden="true"
        position="absolute"
        top={{ base: "2%", lg: "-6%" }}
        left={isReverse ? "auto" : "-2%"}
        right={isReverse ? "-2%" : "auto"}
        fontFamily="'DM Sans', sans-serif"
        fontSize={{ base: "7xl", md: "9xl", lg: "12rem" }}
        fontWeight="900"
        fontStyle="italic"
        letterSpacing="-0.08em"
        color={link.accent}
        opacity={isLightTheme ? 0.13 : 0.15}
        lineHeight="0.8"
        transform={isReverse ? "rotate(4deg)" : "rotate(-4deg)"}
      >
        {sceneWords[index]}
      </Text>
      <Box
        position="absolute"
        inset={0}
        opacity={isLightTheme ? 0.2 : 0.15}
        bgImage={
          isLightTheme
            ? "radial-gradient(circle, #211827 1.1px, transparent 1.2px)"
            : "radial-gradient(circle, #ffffff 1.1px, transparent 1.2px)"
        }
        bgSize="16px 16px"
        maskImage={
          isReverse
            ? "linear-gradient(110deg, transparent 25%, black 100%)"
            : "linear-gradient(250deg, transparent 25%, black 100%)"
        }
      />
      <Container maxW="container.xl" position="relative" zIndex={2}>
        <Box
          display="grid"
          gridTemplateColumns={{
            base: "1fr",
            lg: "minmax(0, 1.16fr) minmax(380px, 0.84fr)",
          }}
          alignItems="center"
          gap={{ base: 8, lg: 0 }}
          dir="ltr"
        >
          <Box
            order={{ base: 0, lg: isReverse ? 2 : 0 }}
            minH={{ base: "360px", md: "470px", lg: "620px" }}
            position="relative"
            zIndex={1}
            opacity={isVisible ? 1 : 0}
            transform={
              isVisible
                ? "translate3d(0,0,0) rotate(0deg)"
                : `translate3d(${isReverse ? "90px" : "-90px"},45px,0) rotate(${isReverse ? "4deg" : "-4deg"})`
            }
            transition="opacity 760ms cubic-bezier(.16,.85,.2,1), transform 900ms cubic-bezier(.16,.85,.2,1)"
            sx={{
              "@media (prefers-reduced-motion: reduce)": {
                opacity: 1,
                transform: "none",
                transition: "none",
              },
            }}
          >
            <Box
              position="absolute"
              inset={{ base: "2% 1%", md: "2% 4%", lg: "2% 0" }}
              bg={link.accent}
              border="5px solid"
              borderColor={ink}
              clipPath={
                isReverse
                  ? "polygon(10% 0, 100% 5%, 94% 92%, 0 100%)"
                  : "polygon(0 5%, 92% 0, 100% 100%, 7% 92%)"
              }
              boxShadow={
                isLightTheme ? "14px 16px 0 #211827" : "14px 16px 0 #050711"
              }
              overflow="hidden"
              _before={{
                content: '""',
                position: "absolute",
                inset: "-25% -20%",
                bgImage: isLightTheme
                  ? "repeating-linear-gradient(151deg, transparent 0 22px, rgba(33,24,39,0.21) 23px 27px, transparent 28px 42px)"
                  : "repeating-linear-gradient(151deg, transparent 0 22px, rgba(255,255,255,0.2) 23px 27px, transparent 28px 42px)",
                animation: `${chapterSweep} ${7 + index}s ease-in-out infinite`,
              }}
            />
            <Box
              position="absolute"
              top={{ base: "11%", md: "10%" }}
              left={isReverse ? "auto" : { base: "8%", md: "12%" }}
              right={isReverse ? { base: "8%", md: "12%" } : "auto"}
              w={{ base: "76%", md: "70%", lg: "72%" }}
              h={{ base: "72%", md: "74%" }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg={paper}
              border="5px solid"
              borderColor={ink}
              clipPath={
                isReverse
                  ? "polygon(7% 3%, 100% 0, 94% 100%, 0 92%)"
                  : "polygon(0 0, 94% 4%, 100% 92%, 6% 100%)"
              }
              boxShadow={
                isLightTheme
                  ? `11px 13px 0 ${link.shadowAccent}`
                  : `11px 13px 0 ${link.shadowAccent}`
              }
              overflow="hidden"
              _before={{
                content: '""',
                position: "absolute",
                inset: 0,
                bgImage: isLightTheme
                  ? "radial-gradient(circle, rgba(33,24,39,0.28) 1.3px, transparent 1.4px)"
                  : "radial-gradient(circle, rgba(255,255,255,0.23) 1.3px, transparent 1.4px)",
                bgSize: "13px 13px",
                opacity: 0.48,
              }}
            >
              <Box
                position="relative"
                zIndex={1}
                transform={{ base: "scale(1.9)", md: "scale(2.75)" }}
              >
                {link.visual}
              </Box>
            </Box>
            <Box
              position="absolute"
              top={{ base: "2%", md: "3%" }}
              left={isReverse ? "auto" : "2%"}
              right={isReverse ? "2%" : "auto"}
              zIndex={4}
              bg={isLightTheme ? "#211827" : "#f8f1e7"}
              color={isLightTheme ? "white" : "#101322"}
              border="3px solid"
              borderColor={ink}
              boxShadow={`5px 6px 0 ${link.accent}`}
              px={4}
              py={2}
              transform={isReverse ? "rotate(5deg)" : "rotate(-5deg)"}
              fontFamily="monospace"
              fontWeight="900"
              letterSpacing="0.14em"
              fontSize={{ base: "10px", md: "sm" }}
            >
              {sceneLabels[index]}
            </Box>
            <Text
              aria-hidden="true"
              position="absolute"
              right={isReverse ? "auto" : "2%"}
              left={isReverse ? "2%" : "auto"}
              bottom="0"
              zIndex={5}
              fontFamily="'DM Sans', sans-serif"
              fontSize={{ base: "5xl", md: "8xl" }}
              fontWeight="900"
              fontStyle="italic"
              color={ink}
              textShadow={`5px 6px 0 ${link.accent}`}
              transform={isReverse ? "rotate(7deg)" : "rotate(-7deg)"}
            >
              GO!
            </Text>
          </Box>

          <Box
            order={{ base: 1, lg: isReverse ? 0 : 2 }}
            position="relative"
            zIndex={4}
            ms={{ base: 0, lg: isReverse ? 0 : "-70px" }}
            me={{ base: 0, lg: isReverse ? "-70px" : 0 }}
            bg={paper}
            color={ink}
            border="5px solid"
            borderColor={ink}
            boxShadow={
              isLightTheme
                ? `12px 14px 0 ${link.accent}`
                : `12px 14px 0 ${link.shadowAccent}`
            }
            px={{ base: 6, md: 9 }}
            py={{ base: 7, md: 10 }}
            opacity={isVisible ? 1 : 0}
            transform={
              isVisible
                ? isReverse
                  ? "translate3d(0,0,0) rotate(-1.2deg)"
                  : "translate3d(0,0,0) rotate(1.2deg)"
                : `translate3d(${isReverse ? "-70px" : "70px"},70px,0) rotate(${isReverse ? "-4deg" : "4deg"})`
            }
            transition="opacity 720ms 180ms cubic-bezier(.16,.85,.2,1), transform 920ms 160ms cubic-bezier(.16,.85,.2,1)"
            dir={pageDirection}
            _after={{
              content: '""',
              position: "absolute",
              top: { base: "-22px", lg: "42%" },
              left: { base: "38px", lg: isReverse ? "auto" : "-30px" },
              right: { base: "auto", lg: isReverse ? "-30px" : "auto" },
              borderBottom: { base: `24px solid ${ink}`, lg: "none" },
              borderLeft: {
                base: "16px solid transparent",
                lg: isReverse ? `32px solid ${ink}` : "none",
              },
              borderRight: {
                base: "none",
                lg: isReverse ? "none" : `32px solid ${ink}`,
              },
              borderTop: { base: "none", lg: "22px solid transparent" },
              transform: isReverse ? "rotate(-8deg)" : "rotate(8deg)",
            }}
            sx={{
              "@media (prefers-reduced-motion: reduce)": {
                opacity: 1,
                transform: isReverse ? "rotate(-1.2deg)" : "rotate(1.2deg)",
                transition: "none",
              },
            }}
          >
            <Text
              fontFamily="monospace"
              fontSize="xs"
              fontWeight="900"
              letterSpacing="0.18em"
              color={link.accent}
              mb={4}
            >
              {sceneWords[index]} SOMETHING WONDERFUL
            </Text>
            <Heading
              fontFamily="'DM Sans', sans-serif"
              fontSize={{ base: "4xl", md: "6xl" }}
              lineHeight="0.92"
              letterSpacing="-0.055em"
              fontWeight="900"
              mb={5}
              textAlign={pageDirection === "rtl" ? "right" : "left"}
            >
              {link.title}
            </Heading>
            <Text
              fontFamily="'DM Sans', sans-serif"
              fontSize={{ base: "md", md: "lg" }}
              lineHeight="1.7"
              color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"}
              mb={7}
              textAlign={pageDirection === "rtl" ? "right" : "left"}
            >
              {link.description}
            </Text>
            <Button
              {...actionProps}
              bg={link.accent}
              color="white"
              textShadow={link.buttonTextShadow}
              border="3px solid"
              borderColor={ink}
              boxShadow={`0 6px 0 ${link.shadowAccent}`}
              minH="54px"
              px={7}
              fontFamily="'DM Sans', sans-serif"
              fontWeight="900"
              rightIcon={<Text fontSize="xl">↗</Text>}
              _hover={{
                bg: link.accent,
                color: "white",
                textDecoration: "none",
                transform: "translateY(-2px)",
                boxShadow: `0 8px 0 ${link.shadowAccent}`,
              }}
              _active={{
                transform: "translateY(5px)",
                boxShadow: `0 1px 0 ${link.shadowAccent}`,
              }}
              sx={{ "&:visited": { color: "white" } }}
            >
              {link.launchAppText || "Launch app"}
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

function MangaStories({
  heroCopy,
  links,
  isLightTheme,
  pageDirection,
  onLaunchSound,
  onLaunchEvent,
}) {
  const ink = isLightTheme ? "#211827" : "#f8f1e7";

  return (
    <Box id="projects" scrollMarginTop="20px" position="relative" zIndex={1}>
      <Box
        minH={{ base: "56svh", md: "66svh" }}
        display="flex"
        alignItems="center"
        bg={isLightTheme ? "#211827" : "#f8f1e7"}
        color={isLightTheme ? "#fff8e9" : "#101322"}
        borderBottom="6px solid"
        borderColor={isLightTheme ? "#211827" : "#f8f1e7"}
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          inset="0"
          bgImage="radial-gradient(circle, rgba(227,64,105,0.65) 1.5px, transparent 1.6px)"
          bgSize="17px 17px"
          opacity={0.22}
        />
        <AnimeFinaleCanvas
          isLightTheme={false}
          intensity={0.62}
          focus="right"
          variant="chapter"
          opacity={0.5}
        />
        <Box
          position="absolute"
          right="-12%"
          top="-55%"
          w="62%"
          h="190%"
          bg="#e34069"
          transform="rotate(17deg)"
          boxShadow="-26px 0 0 #55cdbc"
        />
        <Text
          aria-hidden="true"
          display={{ base: "none", md: "block" }}
          position="absolute"
          right={{ base: "-5%", md: "2%" }}
          top="50%"
          transform="translateY(-50%) rotate(7deg)"
          fontFamily="'DM Sans', sans-serif"
          fontSize={{ base: "6xl", md: "8xl", lg: "9xl" }}
          fontWeight="900"
          fontStyle="italic"
          letterSpacing="-0.08em"
          color="#211827"
          textShadow="6px 7px 0 rgba(255,210,95,0.82)"
          zIndex={1}
        >
          START!
        </Text>
        <Container maxW="container.xl" position="relative" zIndex={3}>
          <Text
            fontFamily="monospace"
            fontWeight="900"
            letterSpacing="0.2em"
            fontSize="sm"
            mb={4}
            color="#ffd25f"
          >
            {heroCopy.workLabel}
          </Text>
          <Heading
            fontFamily="'DM Sans', sans-serif"
            fontSize={{ base: "5xl", md: "8xl", lg: "9xl" }}
            lineHeight="0.82"
            letterSpacing="-0.07em"
            fontWeight="900"
            maxW="900px"
            textShadow="7px 8px 0 rgba(0,0,0,0.26)"
          >
            {heroCopy.workTitle}
          </Heading>
          <Text
            mt={7}
            maxW="650px"
            fontFamily="'DM Sans', sans-serif"
            fontSize={{ base: "lg", md: "2xl" }}
            lineHeight="1.5"
          >
            {heroCopy.workBody}
          </Text>
        </Container>
      </Box>

      {links.map((link, index) => (
        <MangaProjectScene
          key={link.title}
          link={link}
          index={index}
          isLightTheme={isLightTheme}
          pageDirection={pageDirection}
          onLaunchSound={onLaunchSound}
          onLaunchEvent={() => onLaunchEvent(link)}
        />
      ))}

      <Box
        bg={isLightTheme ? "#fff4df" : "#090b16"}
        py={{ base: 16, md: 24 }}
        borderTop="6px solid"
        borderColor={ink}
      >
        <Container maxW="container.lg">
          <Box
            bg={isLightTheme ? "#211827" : "#f8f1e7"}
            color={isLightTheme ? "white" : "#101322"}
            border="5px solid"
            borderColor={ink}
            boxShadow={
              isLightTheme ? "12px 14px 0 #e34069" : "12px 14px 0 #c93c65"
            }
            px={{ base: 6, md: 10 }}
            py={{ base: 7, md: 9 }}
            transform="rotate(-1deg)"
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              right="-8%"
              top="-70%"
              w="48%"
              h="240%"
              bg="#55cdbc"
              transform="rotate(18deg)"
              boxShadow="-20px 0 0 #ffd25f"
            />
            <Text
              position="relative"
              zIndex={1}
              fontFamily="'DM Sans', sans-serif"
              fontSize={{ base: "3xl", md: "6xl" }}
              fontWeight="900"
              fontStyle="italic"
              letterSpacing="-0.05em"
            >
              TO BE CONTINUED… ↗
            </Text>
          </Box>
        </Container>
      </Box>
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
  const panelLabels = [
    "PLAYFUL LEARNING",
    "SKILL TRAINING",
    "REAL-LIFE QUEST",
    "BONUS CONTENT",
  ];
  const panelAngles = ["-0.7deg", "0.8deg", "0.55deg", "-0.65deg"];
  const panelOffsets = ["0", "70px", "16px", "86px"];

  return (
    <Container
      maxW="container.xl"
      position="relative"
      zIndex={1}
      pb={{ base: 20, md: 28 }}
    >
      <Box
        id="projects"
        pt={{ base: 16, md: 24 }}
        scrollMarginTop="24px"
        position="relative"
        _before={{
          content: '""',
          display: { base: "none", md: "block" },
          position: "absolute",
          top: "250px",
          bottom: "-80px",
          left: "50%",
          w: "5px",
          bg: isLightTheme ? "rgba(36,28,45,0.72)" : "rgba(247,241,232,0.6)",
          transform: "rotate(1.4deg)",
          boxShadow: isLightTheme
            ? "7px 0 0 rgba(227,64,105,0.22)"
            : "7px 0 0 rgba(255,111,145,0.18)",
          zIndex: 0,
        }}
      >
        <Box
          display="grid"
          gridTemplateColumns={{
            base: "1fr",
            md: "minmax(0, 0.8fr) minmax(0, 1.2fr)",
          }}
          gap={{ base: 5, md: 10 }}
          alignItems="end"
          mb={{ base: 12, md: 16 }}
          position="relative"
          zIndex={1}
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
            boxShadow: isLightTheme
              ? "8px 5px 0 #241c2d"
              : "8px 5px 0 rgba(247,241,232,0.82)",
          }}
        >
          <Text
            aria-hidden="true"
            display={{ base: "none", lg: "block" }}
            position="absolute"
            insetInlineEnd="0"
            bottom="-10px"
            fontFamily="'DM Sans', sans-serif"
            fontSize="7xl"
            fontWeight="900"
            fontStyle="italic"
            letterSpacing="-0.06em"
            color={
              isLightTheme ? "rgba(36,28,45,0.055)" : "rgba(247,241,232,0.055)"
            }
            transform="rotate(-3deg)"
            pointerEvents="none"
          >
            STORY MODE
          </Text>
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
              boxShadow={
                isLightTheme ? "4px 4px 0 #241c2d" : "4px 4px 0 #050711"
              }
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
              textShadow={
                isLightTheme
                  ? "4px 4px 0 rgba(218,61,105,0.18)"
                  : "4px 4px 0 rgba(255,112,151,0.18)"
              }
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

        <Box
          display="grid"
          gridTemplateColumns={{
            base: "1fr",
            md: "repeat(12, minmax(0, 1fr))",
          }}
          gap={{ base: 8, md: 8 }}
          position="relative"
          zIndex={1}
          pb={{ base: 0, md: 20 }}
        >
          {links.map((link, index) => (
            <Box
              key={link.title}
              gridColumn={{
                base: "1",
                md: index === 0 || index === 3 ? "span 7" : "span 5",
              }}
              mt={{ base: 0, md: panelOffsets[index] }}
              transform={{ base: "none", md: `rotate(${panelAngles[index]})` }}
              transformOrigin="center"
              transition="transform 260ms ease"
              _hover={{
                transform: {
                  base: "none",
                  md: `rotate(0deg) translateY(-3px)`,
                },
                zIndex: 2,
              }}
            >
              <LinkCard
                {...link}
                panelLabel={panelLabels[index]}
                isLightTheme={isLightTheme}
                textDirection={pageDirection}
                onLaunchSound={onLaunchSound}
                onLaunchEvent={() => onLaunchEvent(link)}
                launchAppText={link.launchAppText}
              />
            </Box>
          ))}
        </Box>

        <Box
          mt={{ base: 16, md: 10 }}
          mx={{ base: 1, md: "auto" }}
          maxW="860px"
          position="relative"
          bg={isLightTheme ? "#241c2d" : "#f7f1e8"}
          color={isLightTheme ? "#fffaf0" : "#111426"}
          borderWidth="4px"
          borderStyle="solid"
          borderColor={isLightTheme ? "#241c2d" : "#f7f1e8"}
          boxShadow={
            isLightTheme ? "10px 11px 0 #e34069" : "10px 11px 0 #d94b73"
          }
          transform="rotate(-1deg)"
          overflow="hidden"
          px={{ base: 5, md: 9 }}
          py={{ base: 5, md: 6 }}
          _before={{
            content: '""',
            position: "absolute",
            right: "-8%",
            top: "-60%",
            w: "48%",
            h: "220%",
            bg: isLightTheme ? "#55cdbc" : "#42bdb1",
            transform: "rotate(18deg)",
            boxShadow: "-18px 0 0 #ffd25f",
          }}
        >
          <HStack
            position="relative"
            zIndex={1}
            justify="space-between"
            spacing={4}
          >
            <Text
              fontFamily="'DM Sans', sans-serif"
              fontSize={{ base: "xl", md: "4xl" }}
              fontWeight="900"
              fontStyle="italic"
              letterSpacing="-0.04em"
            >
              TO BE CONTINUED…
            </Text>
            <Text
              fontFamily="'DM Sans', sans-serif"
              fontSize={{ base: "4xl", md: "6xl" }}
              fontWeight="900"
              color="#241c2d"
              lineHeight="0.7"
              transform="rotate(-6deg)"
            >
              ↗
            </Text>
          </HStack>
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
  const [randomCharacterKey] = useState(() => {
    const heroCharacters = ["24", "30", "31"];
    return heroCharacters[Math.floor(Math.random() * heroCharacters.length)];
  });
  const [noSabosOrbState] = useState(pickRandomVoiceOrbState);
  const [hasCopiedRbeSecretKey, setHasCopiedRbeSecretKey] = useState(false);

  // Music state - default off, saved to document & localStorage
  const [isMusicPlaying, setIsMusicPlaying] = useState(() => {
    const saved = localStorage.getItem("links_music_enabled");
    return saved !== null ? saved === "true" : false;
  });
  const audioRef = useRef(null);
  const isMusicPlayingRef = useRef(isMusicPlaying);
  const playPromiseRef = useRef(null);

  // Synchronize ref on every render / state update
  useEffect(() => {
    isMusicPlayingRef.current = isMusicPlaying;
  }, [isMusicPlaying]);

  // Safe play helper to avoid uncaught AbortError / race conditions
  const safePlay = () => {
    const audio = audioRef.current;
    if (!audio || !isMusicPlayingRef.current) return;
    try {
      const promise = audio.play();
      if (promise !== undefined) {
        playPromiseRef.current = promise;
        promise
          .then(() => {
            playPromiseRef.current = null;
            if (!isMusicPlayingRef.current) {
              audio.pause();
            }
          })
          .catch(() => {
            playPromiseRef.current = null;
          });
      }
    } catch {
      // Ignored
    }
  };

  // Safe pause helper that awaits any in-flight play promise
  const safePause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playPromiseRef.current) {
      playPromiseRef.current
        .then(() => {
          audio.pause();
        })
        .catch(() => {
          audio.pause();
        });
    } else {
      audio.pause();
    }
  };

  // Load saved music preference from user's document if available
  useEffect(() => {
    const storedNpub = localStorage.getItem("local_npub");
    if (storedNpub) {
      getDoc(doc(database, "users", storedNpub))
        .then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const remoteSetting = data.musicEnabled ?? data.linksMusicEnabled;
            if (typeof remoteSetting === "boolean") {
              setIsMusicPlaying(remoteSetting);
              isMusicPlayingRef.current = remoteSetting;
              localStorage.setItem(
                "links_music_enabled",
                String(remoteSetting),
              );
            }
          }
        })
        .catch((err) => {
          console.warn("Could not load user music preference:", err);
        });
    }
  }, []);

  // Manage Audio instance & Autoplay on render
  useEffect(() => {
    const audio = new Audio(awalkMusic);
    audio.loop = true;
    audio.volume = 0.35;
    audioRef.current = audio;

    if (isMusicPlayingRef.current) {
      safePlay();
    }

    const handleFirstGesture = () => {
      if (!isMusicPlayingRef.current) return;
      if (audio.paused) {
        safePlay();
      }
    };

    window.addEventListener("pointerdown", handleFirstGesture, { once: true });
    window.addEventListener("keydown", handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  // Sync audio play/pause with isMusicPlaying state
  useEffect(() => {
    if (isMusicPlaying) {
      safePlay();
    } else {
      safePause();
    }
  }, [isMusicPlaying]);

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
  const modalBg = isLightTheme ? "#ffffff" : "#151519";
  const modalPanelBg = modalBg;
  const modalBorderColor = isLightTheme ? "#000000" : "#ffffff";
  const modalShadowColor = isLightTheme
    ? "#000000"
    : "rgba(255, 255, 255, 0.38)";
  const buttonShadowColor = isLightTheme
    ? "#000000"
    : "rgba(255, 255, 255, 0.55)";
  const buttonHoverShadowColor = isLightTheme
    ? "#000000"
    : "rgba(255, 255, 255, 0.72)";
  const buttonActiveShadowColor = isLightTheme
    ? "#000000"
    : "rgba(255, 255, 255, 0.4)";
  const modalHeaderBg = modalBg;
  const modalHeaderText = modalBorderColor;
  const modalHeadingColor = modalHeaderText;
  const modalBodyTextColor = isLightTheme ? APP_TEXT_SECONDARY : "#f2eee8";
  const labelColor = modalBodyTextColor;
  const helperColor = isLightTheme ? APP_TEXT_MUTED : "#d6d3d1";
  const inputBg = isLightTheme ? APP_SURFACE : "rgba(0, 0, 0, 0.3)";
  const inputBorderColor = isLightTheme ? APP_BORDER : "#ffffff";

  const modalScrollSx = useMemo(
    () => ({
      "&::-webkit-scrollbar": {
        width: "8px",
      },
      "&::-webkit-scrollbar-track": {
        background: isLightTheme
          ? "rgba(23, 23, 26, 0.1)"
          : "rgba(0, 0, 0, 0.3)",
        borderRadius: "0",
      },
      "&::-webkit-scrollbar-thumb": {
        background: modalBorderColor,
        borderRadius: "0",
        border: "2px solid transparent",
        backgroundClip: "padding-box",
      },
      "&::-webkit-scrollbar-thumb:hover": {
        background: modalBorderColor,
        backgroundClip: "padding-box",
      },
      "& input, & textarea": {
        borderRadius: "0 !important",
        borderWidth: "2px !important",
        borderColor: `${isLightTheme ? "#17171a" : "#f5f0e8"} !important`,
        background: `${modalBg} !important`,
        color: `${modalBorderColor} !important`,
      },
      "& button": {
        borderRadius: "0 !important",
        fontWeight: "900",
      },
      scrollbarWidth: "thin",
      scrollbarColor: isLightTheme
        ? "#17171a rgba(23, 23, 26, 0.1)"
        : "#f5f0e8 rgba(0, 0, 0, 0.3)",
    }),
    [isLightTheme, modalBg, modalBorderColor],
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

  const handleToggleMusic = async () => {
    handleSelectSound();
    const nextState = !isMusicPlaying;
    isMusicPlayingRef.current = nextState;
    setIsMusicPlaying(nextState);
    localStorage.setItem("links_music_enabled", String(nextState));

    if (nextState) {
      safePlay();
    } else {
      safePause();
    }

    const storedNpub = localStorage.getItem("local_npub");
    if (storedNpub) {
      try {
        await updateDoc(doc(database, "users", storedNpub), {
          musicEnabled: nextState,
          linksMusicEnabled: nextState,
        });
      } catch (err) {
        console.warn("Could not save music setting to user document:", err);
      }
    }
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
      accent: isLightTheme ? "#0f9f91" : "#3158a6",
      accentSoft: isLightTheme
        ? "rgba(15, 159, 145, 0.22)"
        : "rgba(49, 88, 166, 0.18)",
      shadowAccent: isLightTheme ? "#08776f" : "#203d78",
      labelAccent: isLightTheme ? "#08776f" : "#203d78",
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
      accent: "#d97706",
      accentSoft: "rgba(217, 119, 6, 0.18)",
      shadowAccent: "#9f5404",
      labelAccent: "#9f5404",
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
      accent: isLightTheme ? "#3158a6" : "#0f9f91",
      accentSoft: isLightTheme
        ? "rgba(49, 88, 166, 0.18)"
        : "rgba(15, 159, 145, 0.22)",
      shadowAccent: isLightTheme ? "#203d78" : "#08776f",
      labelAccent: isLightTheme ? "#203d78" : "#08776f",
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
      accent: "#d13d74",
      accentSoft: "rgba(209, 61, 116, 0.18)",
      shadowAccent: "#91254f",
      labelAccent: "#91254f",
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
          bg: isLightTheme ? "#17171a" : "#f5f0e8",
          color: isLightTheme ? "#ffffff" : "#0c0c0f",
        },
      }}
      style={{
        "--links-accent-primary": isLightTheme ? "#0f766e" : "#00ffff",
        "--links-accent-warm": isLightTheme ? "#b45309" : "gold",
        "--links-accent-pink": isLightTheme ? "#17171a" : "#f5f0e8",
      }}
    >
      <MangaLinksExperience
        heroCopy={heroCopy}
        translations={translations}
        links={links}
        isLightTheme={isLightTheme}
        isRtl={isRtl}
        directionalTextAlign={directionalTextAlign}
        pageDirection={pageDirection}
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
        /* musicControl={
          <MusicToggle
            isMusicPlaying={isMusicPlaying}
            onToggleMusic={handleToggleMusic}
            isLightTheme={isLightTheme}
          />
        } */
        onLaunchSound={handleSubmitActionSound}
        onLaunchEvent={(link) => {
          if (!isLocalhost() && !link.onLaunch) {
            logEvent(analytics, "links_launch_app", {
              app: link.analyticsName,
            });
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
          bg={isLightTheme ? "rgba(23, 23, 26, 0.82)" : "rgba(0, 0, 0, 0.84)"}
        />
        <ModalContent
          motionProps={nativeModalMotionProps}
          dir={pageDirection}
          bg={modalBg}
          color={modalBorderColor}
          border="4px solid"
          borderColor={modalBorderColor}
          borderRadius="0 !important"
          boxShadow={`8px 9px 0 ${modalShadowColor}`}
          fontFamily="'DM Sans', sans-serif"
          w="95vw"
          maxW="md"
          overflow="hidden"
        >
          <ModalHeader
            position="relative"
            bg={modalHeaderBg}
            px={{ base: 5, md: 6 }}
            py={3}
            pe={{ base: 16, md: 20 }}
            fontSize={{ base: "lg", md: "xl" }}
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
            {translations.rbeModalTitle}
          </ModalHeader>
          <ChakraModalCloseButton
            top={2}
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
            mx={{ base: 3, md: 4 }}
            mt={1}
            mb={{ base: 3, md: 4 }}
            px={{ base: 5, md: 6 }}
            pt={3}
            pb={{ base: 5, md: 6 }}
            bg={modalPanelBg}
            boxShadow="none"
          >
            <VStack spacing={4} align="stretch">
              <Text
                fontSize="sm"
                color={modalBodyTextColor}
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
                <ChakraButton
                  as="a"
                  href={rbeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  bg={modalBorderColor}
                  color={modalBg}
                  w="100%"
                  h="auto"
                  py={4}
                  borderWidth="3px"
                  borderStyle="solid"
                  borderColor={modalBorderColor}
                  borderRadius="0 !important"
                  fontWeight="900"
                  letterSpacing="0.06em"
                  textTransform="uppercase"
                  boxShadow="none"
                  _hover={{
                    bg: modalBg,
                    color: modalBorderColor,
                    textDecoration: "none",
                    boxShadow: "none",
                  }}
                  _active={{
                    color: modalBorderColor,
                    boxShadow: "none",
                    transform: "translateY(3px)",
                  }}
                  _visited={{ color: modalBg }}
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
                </ChakraButton>
              ) : (
                <ChakraButton
                  onClick={async () => {
                    handleSelectSound();
                    const copied = await handleCopySecretKey({
                      showSuccessToast: false,
                    });
                    if (copied) setHasCopiedRbeSecretKey(true);
                  }}
                  bg={modalBorderColor}
                  w="100%"
                  h="auto"
                  py={4}
                  borderWidth="3px"
                  borderStyle="solid"
                  borderColor={modalBorderColor}
                  borderRadius="0 !important"
                  color={modalBg}
                  fontWeight="900"
                  letterSpacing="0.06em"
                  textTransform="uppercase"
                  boxShadow="none"
                  _hover={{
                    bg: modalBg,
                    color: modalBorderColor,
                    boxShadow: "none",
                  }}
                  _active={{
                    bg: modalBorderColor,
                    color: modalBg,
                    boxShadow: "none",
                    transform: "translateY(3px)",
                  }}
                >
                  {translations.copySecretKey}
                </ChakraButton>
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
                        color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
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
            px={{ base: 4, md: 5 }}
            py={3}
            pe={{ base: 14, md: 16 }}
            fontSize={{ base: "xl", md: "2xl" }}
            fontWeight="900"
            fontStyle="italic"
            lineHeight="1"
            letterSpacing="-0.035em"
            textTransform="uppercase"
            color={modalHeadingColor}
            textAlign={directionalTextAlign}
          >
            {translations.aboutTitle}
          </ModalHeader>
          <ChakraModalCloseButton
            top={2}
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
            <VStack spacing={4} align="stretch">
              <Box mt={"-6"}>
                {" "}
                <RandomCharacter notSoRandomCharacter={"36"} />
              </Box>

              <Box
                color={modalBodyTextColor}
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
            bg={modalHeaderBg}
            justifyContent={isRtl ? "flex-start" : "flex-end"}
            px={{ base: 4, md: 5 }}
            py={3}
          >
            <ChakraButton
              onClick={() => {
                handleSelectSound();
                onAboutClose();
              }}
              bg={modalBorderColor}
              color={modalBg}
              borderWidth="3px"
              borderStyle="solid"
              borderColor={modalBorderColor}
              borderRadius="0 !important"
              boxShadow="none"
              fontWeight="900"
              textTransform="uppercase"
              _hover={{ opacity: 0.78 }}
            >
              {translations.close}
            </ChakraButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
