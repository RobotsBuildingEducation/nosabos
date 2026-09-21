import React, { useEffect, useRef, useState, useMemo, lazy, Suspense } from "react";
import {
  Box,
  Button as ChakraButton,
  Divider,
  HStack,
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
import { LuSun, LuMoon, LuMusic } from "react-icons/lu";
import { getAssetUrl } from "../utils/proxyEndpoints";

import VoiceOrb from "./VoiceOrb";
import MangaLinksExperience from "./MangaLinksExperience";
import { CloudCanvas } from "./CloudCanvas/CloudCanvas";
import CitizenshipIcon from "./CitizenshipIcon/CitizenshipIcon";
import PatreonMotionMark from "./links/PatreonMotionMark";
import RandomCharacter from "./RandomCharacter";
const logLinksEvent = (eventName, params) => {
  if (isLocalhost()) return;
  Promise.all([
    import("firebase/analytics"),
    import("../firebaseResources/firebaseResources"),
  ])
    .then(([{ logEvent }, { analytics }]) => {
      logEvent(analytics, eventName, params);
    })
    .catch(() => {});
};
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

// Lazy-load the heavy CustomizeProfileModal (includes IdentityCard, QRCode, Cashu wallet store)
const CustomizeProfileModal = lazy(() =>
  import("./links/CustomizeProfileModal"),
);

// On-demand sound trigger (avoids importing Tone.js / soundManager into initial /links load)
const playSoundAsync = (soundType) => {
  import("../hooks/useSoundSettings")
    .then(({ default: useSoundSettings }) => {
      useSoundSettings.getState().playSound(soundType);
    })
    .catch(() => {});
};

// Helper to check if running on localhost
const isLocalhost = () =>
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

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
          <LuMoon size={18} />
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

export default function LinksPage() {
  const hasTriggeredKeygen = useRef(false);
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
  const [profilePicture, setProfilePicture] = useState("");
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

  // Load saved music preference from user document if available
  useEffect(() => {
    const storedNpub = localStorage.getItem("local_npub");
    if (!storedNpub) return;

    const loadMusicPref = async () => {
      try {
        const [{ doc, getDoc }, { database }] = await Promise.all([
          import("firebase/firestore"),
          import("../firebaseResources/firebaseResources"),
        ]);
        const snap = await getDoc(doc(database, "users", storedNpub));
        if (snap.exists()) {
          const data = snap.data();
          const remoteSetting = data.musicEnabled ?? data.linksMusicEnabled;
          if (typeof remoteSetting === "boolean") {
            setIsMusicPlaying(remoteSetting);
            isMusicPlayingRef.current = remoteSetting;
            localStorage.setItem("links_music_enabled", String(remoteSetting));
          }
        }
      } catch (err) {
        console.warn("Could not load user music preference:", err);
      }
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      window.requestIdleCallback(loadMusicPref);
    } else {
      setTimeout(loadMusicPref, 2000);
    }
  }, []);

  // Manage Audio instance & Autoplay lazily only when music is enabled
  useEffect(() => {
    if (!isMusicPlaying) {
      if (audioRef.current) {
        safePause();
      }
      return;
    }

    if (!audioRef.current) {
      const audio = new Audio(getAssetUrl("audio/awalk.mp3"));
      audio.loop = true;
      audio.volume = 0.35;
      audioRef.current = audio;
    }

    safePlay();

    const handleFirstGesture = () => {
      if (!isMusicPlayingRef.current) return;
      if (audioRef.current && audioRef.current.paused) {
        safePlay();
      }
    };

    window.addEventListener("pointerdown", handleFirstGesture, { once: true });
    window.addEventListener("keydown", handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
    };
  }, [isMusicPlaying]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

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

  const primaryAccent = isLightTheme ? "#0f766e" : "#00ffff";
  const secondaryAccent = isLightTheme ? "#c026d3" : "#ff00ff";
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

  // Initialize language based on timezone detection
  useEffect(() => {
    initLanguage();
  }, [initLanguage]);

  useEffect(() => {
    syncDocumentLanguage(language);
  }, [language]);

  // Background Nostr key generation (runs on idle without blocking initial page render)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasStoredKeys =
      Boolean(localStorage.getItem("local_nsec")) &&
      Boolean(localStorage.getItem("local_npub"));

    if (hasStoredKeys || hasTriggeredKeygen.current) return;
    hasTriggeredKeygen.current = true;

    const triggerKeygen = () => {
      import("../utils/instantNostrKeygen")
        .then(({ generateInstantNostrKeys }) => generateInstantNostrKeys(""))
        .catch((err) => {
          console.error("Failed to generate instant Nostr keys in background:", err);
        });
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(triggerKeygen, { timeout: 3000 });
    } else {
      setTimeout(triggerKeygen, 1000);
    }
  }, []);

  // Load stored displayName and profilePicture
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedDisplayName = localStorage.getItem("displayName");
      if (storedDisplayName) {
        setDisplayName(storedDisplayName);
      }
      const storedProfilePictureUrl =
        localStorage.getItem("profilePictureUrl") ||
        localStorage.getItem("profilePicture");
      if (storedProfilePictureUrl) {
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

  const handleSelectSound = () => playSoundAsync("select");
  const handleSubmitActionSound = () => playSoundAsync("submitAction");

  const handleThemeModeChange = (nextMode) => {
    if (nextMode === themeMode) return;
    handleSelectSound();
    syncThemeMode(nextMode);
  };

  const _handleToggleMusic = async () => {
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
        const [{ updateDoc: update, doc: docRef }, { database }] = await Promise.all([
          import("firebase/firestore"),
          import("../firebaseResources/firebaseResources"),
        ]);
        await update(docRef(database, "users", storedNpub), {
          linksMusicEnabled: nextState,
        });
      } catch (err) {
        console.warn("Could not save music setting to user document:", err);
      }
    }
  };

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
    },
  ];

  // Get display text for welcome message
  const getWelcomeText = () => {
    if (displayName) {
      return `${translations.welcomeBack}, ${displayName}!`;
    }
    return translations.welcome;
  };

  return (
    <Box
      dir={pageDirection}
      minH="100dvh"
      bg={isLightTheme ? "#fff4df" : "#0b0d1a"}
      color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
      position="relative"
      overflowX="hidden"
      isolation="isolate"
      sx={{
        "&::selection": {
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
          logLinksEvent("links_social_click", { platform });
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
            onToggleMusic={_handleToggleMusic}
            isLightTheme={isLightTheme}
          />
        } */
        onLaunchSound={handleSubmitActionSound}
        onLaunchEvent={(link) => {
          if (!link.onLaunch) {
            logLinksEvent("links_launch_app", {
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
                    logLinksEvent("links_launch_app", {
                      app: "robots_building_education",
                    });
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

      {/* Profile Customization Modal - loaded on demand */}
      {isOpen && (
        <Suspense fallback={null}>
          <CustomizeProfileModal
            isOpen={isOpen}
            onClose={onClose}
            isLightTheme={isLightTheme}
            translations={translations}
            pageDirection={pageDirection}
            isRtl={isRtl}
            directionalTextAlign={directionalTextAlign}
            primaryAccent={primaryAccent}
            secondaryAccent={secondaryAccent}
            walletAccent={walletAccent}
            modalBg={modalBg}
            modalPanelBg={modalPanelBg}
            modalBorderColor={modalBorderColor}
            modalShadowColor={modalShadowColor}
            modalHeaderBg={modalHeaderBg}
            modalHeadingColor={modalHeadingColor}
            modalScrollSx={modalScrollSx}
            labelColor={labelColor}
            helperColor={helperColor}
            inputBg={inputBg}
            inputBorderColor={inputBorderColor}
            buttonShadowColor={buttonShadowColor}
            buttonHoverShadowColor={buttonHoverShadowColor}
            buttonActiveShadowColor={buttonActiveShadowColor}
            displayName={displayName}
            setDisplayName={setDisplayName}
            profilePicture={profilePicture}
            setProfilePicture={setProfilePicture}
            handleSelectSound={handleSelectSound}
            handleSubmitActionSound={handleSubmitActionSound}
          />
        </Suspense>
      )}

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
