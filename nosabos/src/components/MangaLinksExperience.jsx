import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { SiPatreon } from "react-icons/si";
import { LuArrowUpRight, LuPencilLine } from "react-icons/lu";
import { keyframes } from "@emotion/react";
import RandomCharacter from "./RandomCharacter";

const toolbarEntrance = keyframes`
  0% { opacity: 0; translate: 54px -54px; scale: 0.72; rotate: 7deg; }
  58% { opacity: 1; translate: -7px 8px; scale: 1.06; rotate: -1.5deg; }
  78% { translate: 3px -3px; scale: 0.985; rotate: 0.6deg; }
  100% { opacity: 1; translate: 0 0; scale: 1; rotate: 0deg; }
`;

const heroPanelEntrance = keyframes`
  0% {
    opacity: 0;
    translate: -9% 2%;
    scale: 0.94;
    rotate: -1.2deg;
    clip-path: polygon(0 0, 4% 0, 0 100%, 0 100%);
  }
  46% {
    opacity: 1;
    translate: 1.4% -0.6%;
    scale: 1.018;
    rotate: 0.35deg;
    clip-path: polygon(0 0, 100% 0, 94% 100%, 0 100%);
  }
  72% { translate: -0.45% 0.2%; scale: 0.994; rotate: -0.12deg; }
  100% {
    opacity: 1;
    translate: 0 0;
    scale: 1;
    rotate: 0deg;
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }
`;

const impactFlash = keyframes`
  0%, 18% { opacity: 0; translate: -135% 0; }
  38% { opacity: 0.72; }
  72% { opacity: 0; translate: 135% 0; }
  100% { opacity: 0; translate: 135% 0; }
`;

const sfxEntrance = keyframes`
  0% { opacity: 0; scale: 2.25; rotate: -18deg; filter: blur(7px); }
  50% { opacity: 0.72; scale: 0.88; rotate: 3deg; filter: blur(0); }
  72% { scale: 1.08; rotate: -1.5deg; }
  100% { opacity: 1; scale: 1; rotate: 0deg; filter: blur(0); }
`;

const portraitEntrance = keyframes`
  0% { opacity: 0; translate: 0 34%; scale: 0.72; rotate: -6deg; }
  54% { opacity: 1; translate: 0 -4%; scale: 1.075; rotate: 2deg; }
  72% { translate: 0 2%; scale: 0.975; rotate: -0.8deg; }
  86% { translate: 0 -1%; scale: 1.018; rotate: 0.35deg; }
  100% { opacity: 1; translate: 0 0; scale: 1; rotate: 0deg; }
`;

const portraitIdle = keyframes`
  0%, 100% { translate: 0 0; rotate: 0deg; }
  48% { translate: 0 -7px; rotate: 0.7deg; }
  54% { translate: 0 -7px; rotate: -0.35deg; }
`;

const bubbleEntrance = keyframes`
  0% { opacity: 0; translate: 0 54px; scale: 0.56; rotate: -7deg; }
  56% { opacity: 1; translate: 0 -9px; scale: 1.075; rotate: 1.8deg; }
  76% { translate: 0 4px; scale: 0.975; rotate: -0.7deg; }
  100% { opacity: 1; translate: 0 0; scale: 1; rotate: 0deg; }
`;

const sidePanelEntrance = keyframes`
  0% { opacity: 0; translate: 82px 0; scale: 0.93; rotate: 2.5deg; }
  62% { opacity: 1; translate: -8px 0; scale: 1.025; rotate: -0.7deg; }
  82% { translate: 3px 0; scale: 0.99; rotate: 0.25deg; }
  100% { opacity: 1; translate: 0 0; scale: 1; rotate: 0deg; }
`;

const focusBlockEntrance = keyframes`
  0% { opacity: 0; translate: 58px 0; filter: contrast(1.8); }
  66% { opacity: 1; translate: -5px 0; filter: contrast(1.2); }
  100% { opacity: 1; translate: 0 0; filter: contrast(1); }
`;

const sloganEntrance = keyframes`
  0% { opacity: 0; translate: 72px 72px; scale: 0.84; rotate: 5deg; }
  60% { opacity: 1; translate: -7px -6px; scale: 1.045; rotate: -1.2deg; }
  82% { translate: 3px 2px; scale: 0.985; rotate: 0.35deg; }
  100% { opacity: 1; translate: 0 0; scale: 1; rotate: 0deg; }
`;

const ruleEntrance = keyframes`
  0% { opacity: 0; scale: 0 1; }
  68% { opacity: 1; scale: 1.04 1; }
  100% { opacity: 1; scale: 1 1; }
`;

const radialLinesEntrance = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.28) rotate(-7deg);
    clip-path: circle(0% at var(--radial-focus-center, 50% 50%));
    filter: blur(2px);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
    clip-path: circle(76% at var(--radial-focus-center, 50% 50%));
    filter: blur(0);
  }
`;

const speedLinesEntrance = keyframes`
  0% {
    opacity: 0;
    transform: translate3d(var(--emotion-start-x, -18%), 0, 0) skewX(-8deg);
    clip-path: inset(0 100% 0 0);
    filter: blur(2px);
  }
  62% {
    opacity: 1;
    transform: translate3d(var(--emotion-overshoot-x, 2.5%), 0, 0) skewX(1deg);
    clip-path: inset(0 0 0 0);
    filter: blur(0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0) skewX(0deg);
    clip-path: inset(0 0 0 0);
    filter: blur(0);
  }
`;

const perspectiveLinesEntrance = keyframes`
  0% {
    opacity: 0;
    transform: translateY(18%) scale(0.72);
    clip-path: inset(100% 0 0 0);
    filter: blur(2px);
  }
  64% {
    opacity: 1;
    transform: translateY(-2%) scale(1.045);
    clip-path: inset(0 0 0 0);
    filter: blur(0);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    clip-path: inset(0 0 0 0);
    filter: blur(0);
  }
`;

const shockwaveEntrance = keyframes`
  0% { opacity: 0; transform: scale(0.32); filter: blur(3px); }
  55% { opacity: 1; transform: scale(1.11); filter: blur(0); }
  76% { transform: scale(0.97); }
  100% { opacity: 1; transform: scale(1); filter: blur(0); }
`;

const auraLinesEntrance = keyframes`
  0% {
    opacity: 0;
    transform: translateY(22%) scaleY(0.48);
    clip-path: inset(100% 0 0 0);
    filter: blur(2px);
  }
  60% {
    opacity: 1;
    transform: translateY(-3%) scaleY(1.06);
    clip-path: inset(0 0 0 0);
    filter: blur(0);
  }
  80% { transform: translateY(1%) scaleY(0.985); }
  100% {
    opacity: 1;
    transform: translateY(0) scaleY(1);
    clip-path: inset(0 0 0 0);
    filter: blur(0);
  }
`;

const reducedHeroMotion = {
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none !important",
    opacity: "1 !important",
    translate: "none !important",
    scale: "1 !important",
    rotate: "none !important",
    clipPath: "none !important",
    filter: "none !important",
  },
};

function useReveal(threshold = 0.14) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -7%" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}

function Screentone({ ink, opacity = 0.12, size = "14px" }) {
  return (
    <Box
      position="absolute"
      inset={0}
      pointerEvents="none"
      aria-hidden="true"
      opacity={opacity}
      bgImage={`radial-gradient(circle, ${ink} 1.1px, transparent 1.2px)`}
      bgSize={`${size} ${size}`}
    />
  );
}

function MangaRule({ ink, accent, reverse = false, animate = false }) {
  return (
    <HStack
      w="100%"
      spacing={2}
      direction={reverse ? "row-reverse" : "row"}
      transformOrigin={reverse ? "right center" : "left center"}
      animation={
        animate
          ? `${ruleEntrance} 720ms cubic-bezier(.16,.84,.22,1) 1.05s both`
          : undefined
      }
      sx={animate ? reducedHeroMotion : undefined}
    >
      <Box h="3px" flex="1" bg={ink} />
      <Box h="7px" w={{ base: "42px", md: "72px" }} bg={accent} />
      <Box h="3px" w={{ base: "16px", md: "28px" }} bg={ink} />
    </HStack>
  );
}

function Portrait({ randomCharacterKey, close = false }) {
  return (
    <Box
      aria-hidden={close ? "true" : undefined}
      transform={
        close
          ? { base: "translateY(28%) scale(2.7)", md: "translateY(30%) scale(3.2)" }
          : {
              base: "translateY(12%) scale(0.9)",
              sm: "translateY(32%) scale(1.25)",
              md: "translateY(56%) scale(2.1)",
              lg: "translateY(36%) scale(2.1)",
            }
      }
      transformOrigin="center bottom"
      sx={
        close
          ? undefined
          : {
              "@media screen and (min-width: 390px) and (max-width: 479px)": {
                transform: "translateY(18%) scale(1.08)",
              },
            }
      }
    >
      <RandomCharacter
        notSoRandomCharacter={randomCharacterKey}
        width="190px"
        containerHeight={240}
      />
    </Box>
  );
}

function MangaToolbar({
  isLightTheme,
  ink,
  accent,
  languageControl,
  themeControl,
  musicControl,
  onSocialClick,
}) {
  const socialItems = [
    {
      label: "Instagram",
      icon: <FaInstagram size={19} />,
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
      icon: <SiPatreon size={15} />,
      bg: "#111111",
      url: "https://subscribe.piyali.app/",
    },
  ];

  return (
    <HStack
      as="nav"
      aria-label="Page controls"
      position="absolute"
      top={{ base: 3, md: 5 }}
      right={{ base: 3, md: 6 }}
      zIndex={90}
      spacing={{ base: 3, md: 2.5 }}
      dir="ltr"
      px={{ base: 2, md: 2.5 }}
      py={{ base: 2, md: 2.5 }}
      bg={isLightTheme ? "rgba(255,252,244,0.96)" : "rgba(12,12,15,0.96)"}
      border="2px solid"
      borderColor={ink}
      boxShadow={`4px 5px 0 ${ink}`}
      backdropFilter="blur(10px)"
      animation={`${toolbarEntrance} 820ms cubic-bezier(.16,.88,.24,1.18) 520ms both`}
      willChange="transform, opacity"
      sx={reducedHeroMotion}
    >
      {socialItems.map((item) => (
        <Box
          key={item.label}
          as="button"
          type="button"
          aria-label={item.label}
          w={{ base: "34px", md: "36px" }}
          h={{ base: "34px", md: "36px" }}
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
          overflow="hidden"
          bg={item.bg}
          color="white"
          border={item.label === "Instagram" ? "none" : "1px solid"}
          borderColor={
            item.label === "Instagram"
              ? "transparent"
              : isLightTheme
              ? "rgba(245, 158, 11, 0.36)"
              : "rgba(147, 197, 253, 0.32)"
          }
          borderRadius="12px"
          transition="transform 150ms ease"
          _hover={{ transform: "translateY(-2px)" }}
          _focusVisible={{ outline: `3px solid ${ink}`, outlineOffset: "2px" }}
          onClick={() => onSocialClick(item.label.toLowerCase(), item.url)}
        >
          {item.icon}
        </Box>
      ))}
      {languageControl}
      {themeControl}
      {/* {musicControl} */}
    </HStack>
  );
}

function RadialFocusLines({
  ink,
  opacity = 0.18,
  innerFade = "26%",
  center = "50% 50%",
  animate = false,
  animationDelay = "0ms",
}) {
  return (
    <Box
      position="absolute"
      inset="-40%"
      pointerEvents="none"
      aria-hidden="true"
      opacity={opacity}
    >
      <Box
        position="absolute"
        inset="0"
        transformOrigin={center}
        animation={
          animate
            ? `${radialLinesEntrance} 1320ms cubic-bezier(.2,.68,.22,1) ${animationDelay} both`
            : undefined
        }
        willChange={animate ? "transform, opacity, clip-path, filter" : undefined}
        style={{ "--radial-focus-center": center }}
        sx={{
          background: `repeating-conic-gradient(
            from 0deg at ${center},
            ${ink} 0deg 1.1deg,
            transparent 1.2deg 4.2deg,
            ${ink} 4.3deg 5.6deg,
            transparent 5.7deg 8.6deg
          )`,
          maskImage: `radial-gradient(ellipse at center, transparent ${innerFade}, black 68%)`,
          WebkitMaskImage: `radial-gradient(ellipse at center, transparent ${innerFade}, black 68%)`,
          ...(animate ? reducedHeroMotion : {}),
        }}
      />
    </Box>
  );
}

function ChapterEmotionLines({
  variant,
  ink,
  opacity = 0.24,
  animate = false,
  animationDelay = "0ms",
  reverse = false,
}) {
  const isAura = variant === "aura";
  const isSpeed = variant === "speed";
  const isPerspective = variant === "perspective";
  const emotionAnimation = isAura
    ? `${auraLinesEntrance} 880ms cubic-bezier(.16,.88,.22,1.08) ${animationDelay} both`
    : isSpeed
      ? `${speedLinesEntrance} 820ms cubic-bezier(.16,.86,.22,1.04) ${animationDelay} both`
    : isPerspective
      ? `${perspectiveLinesEntrance} 900ms cubic-bezier(.16,.86,.22,1.06) ${animationDelay} both`
      : `${shockwaveEntrance} 860ms cubic-bezier(.16,.88,.24,1.14) ${animationDelay} both`;
  const maskImage = isAura
    ? "linear-gradient(to top, black 4%, black 68%, transparent 100%)"
    : isSpeed
      ? "linear-gradient(90deg, transparent 2%, black 20%, black 82%, transparent 98%)"
    : isPerspective
      ? "linear-gradient(to top, black 6%, black 74%, transparent 100%)"
      : "conic-gradient(from 8deg, black 0deg 24deg, transparent 25deg 36deg, black 37deg 84deg, transparent 85deg 101deg, black 102deg 158deg, transparent 159deg 174deg, black 175deg 232deg, transparent 233deg 250deg, black 251deg 306deg, transparent 307deg 320deg, black 321deg 360deg)";
  const backgroundImage = isAura
    ? `repeating-linear-gradient(
        88deg,
        transparent 0 17px,
        ${ink} 18px 21px,
        transparent 22px 39px,
        ${ink} 40px 41px,
        transparent 42px 63px
      ), repeating-linear-gradient(
        93deg,
        transparent 0 32px,
        ${ink} 33px 35px,
        transparent 36px 71px
      )`
    : isSpeed
      ? `repeating-linear-gradient(
        ${reverse ? "64deg" : "116deg"},
        transparent 0 13px,
        ${ink} 14px 17px,
        transparent 18px 32px,
        ${ink} 33px 34px,
        transparent 35px 49px
      )`
    : isPerspective
      ? `repeating-conic-gradient(
          from -38deg at 50% 108%,
          ${ink} 0deg 1.1deg,
          transparent 1.2deg 8.4deg
        ), repeating-linear-gradient(
          0deg,
          transparent 0 27px,
          ${ink} 28px 30px,
          transparent 31px 54px
        )`
      : `repeating-radial-gradient(
          circle at center,
          transparent 0 34px,
          ${ink} 35px 39px,
          transparent 40px 62px,
          ${ink} 63px 65px,
          transparent 66px 91px
        )`;

  return (
    <Box
      position="absolute"
      inset={isAura ? "-12%" : isSpeed ? "-18%" : isPerspective ? "-12%" : "-28%"}
      pointerEvents="none"
      aria-hidden="true"
      opacity={opacity}
    >
      <Box
        position="absolute"
        inset="0"
        animation={animate ? emotionAnimation : undefined}
        willChange={animate ? "transform, opacity, clip-path, filter" : undefined}
        style={
          isSpeed
            ? {
                "--emotion-start-x": reverse ? "18%" : "-18%",
                "--emotion-overshoot-x": reverse ? "-2.5%" : "2.5%",
              }
            : undefined
        }
        sx={{
          backgroundImage,
          maskImage,
          WebkitMaskImage: maskImage,
          ...(animate ? reducedHeroMotion : {}),
        }}
      />
    </Box>
  );
}

function MangaCornerBrackets({ ink, size = 12, stroke = 2.5, offset = 7 }) {
  return (
    <>
      <Box
        position="absolute"
        top={`${offset}px`}
        left={`${offset}px`}
        w={`${size}px`}
        h={`${size}px`}
        borderTop={`${stroke}px solid ${ink}`}
        borderLeft={`${stroke}px solid ${ink}`}
        pointerEvents="none"
        aria-hidden="true"
        zIndex={3}
      />
      <Box
        position="absolute"
        top={`${offset}px`}
        right={`${offset}px`}
        w={`${size}px`}
        h={`${size}px`}
        borderTop={`${stroke}px solid ${ink}`}
        borderRight={`${stroke}px solid ${ink}`}
        pointerEvents="none"
        aria-hidden="true"
        zIndex={3}
      />
      <Box
        position="absolute"
        bottom={`${offset}px`}
        left={`${offset}px`}
        w={`${size}px`}
        h={`${size}px`}
        borderBottom={`${stroke}px solid ${ink}`}
        borderLeft={`${stroke}px solid ${ink}`}
        pointerEvents="none"
        aria-hidden="true"
        zIndex={3}
      />
      <Box
        position="absolute"
        bottom={`${offset}px`}
        right={`${offset}px`}
        w={`${size}px`}
        h={`${size}px`}
        borderBottom={`${stroke}px solid ${ink}`}
        borderRight={`${stroke}px solid ${ink}`}
        pointerEvents="none"
        aria-hidden="true"
        zIndex={3}
      />
    </>
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
}) {
  const ink = isLightTheme ? "#17171a" : "#f5f0e8";
  const paper = isLightTheme ? "#fffcf4" : "#0c0c0f";
  const panel = isLightTheme ? "#f3efe5" : "#151519";
  const muted = isLightTheme ? "#71717a" : "#a1a1aa";
  const bubbleOutline = isLightTheme ? "#17171a" : "#ffffff";
  const bubbleShadow = isLightTheme
    ? "5px 6px 0 rgba(23,23,26,0.28)"
    : "5px 6px 0 rgba(255,255,255,0.32)";
  const focusAreas = heroCopy.focusAreas || [
    "LANGUAGE TUTOR",
    "CODING\nTUTOR",
    "DUAL CITIZENSHIP PLANNER",
    "INVESTING & BUSINESS",
  ];

  return (
    <Box
      as="header"
      minH="100svh"
      bg={paper}
      color={ink}
      borderBottom="5px solid"
      borderColor={ink}
      position="relative"
      overflow="hidden"
    >
      <Screentone ink={ink} opacity={isLightTheme ? 0.055 : 0.07} size="18px" />
      <Container
        maxW="container.xl"
        minH="100svh"
        position="relative"
        zIndex={2}
        display="flex"
        flexDirection="column"
        gap={{ base: 14, md: 16 }}
        pt={{ base: "86px", sm: "90px", md: 32, lg: 28 }}
        pb={{ base: 16, md: 18, lg: 12 }}
      >
        <VStack
          align={isRtl ? "flex-end" : "flex-start"}
          textAlign={directionalTextAlign}
          spacing={{ base: 6, md: 6 }}
          position="relative"
          zIndex={3}
          order={2}
          w="100%"
        >
          <MangaRule ink={ink} accent={ink} reverse={isRtl} animate />

          <Heading
            as="h1"
            w="100%"
            maxW="100%"
            fontFamily="'DM Sans', sans-serif"
            fontSize={{ base: "clamp(2.65rem, 11.8vw, 5rem)", md: "clamp(5.8rem, 8.4vw, 8.8rem)" }}
            lineHeight="0.79"
            letterSpacing="-0.078em"
            fontWeight="900"
            color={ink}
            overflowWrap="normal"
            wordBreak="normal"
          >
            <Text as="span" display="block">
              {heroCopy.titleLead}
            </Text>
            <Text
              as="span"
              display="block"
              color={paper}
              fontFamily="'Arial Black', Arial, sans-serif"
              fontWeight="900"
              letterSpacing="-0.055em"
              sx={{ WebkitTextStroke: { base: `1.5px ${ink}`, md: `2.25px ${ink}` } }}
              position="relative"
              pb="0.08em"
              mb="0.06em"
              _after={{
                content: '""',
                position: "absolute",
                left: 0,
                right: "8%",
                bottom: "-0.02em",
                h: "0.08em",
                bg: ink,
                zIndex: -1,
              }}
            >
              {heroCopy.titleAccent}
            </Text>
          </Heading>

          <Box
            w="100%"
            bg={panel}
            border="2px solid"
            borderColor={ink}
            px={{ base: 4, md: 5 }}
            py={{ base: 3.5, md: 4 }}
            position="relative"
            _before={{
              content: '""',
              position: "absolute",
              top: "-2px",
              bottom: "-2px",
              insetInlineStart: "-2px",
              w: "7px",
              bg: ink,
            }}
          >
            <Text fontFamily="'DM Sans', sans-serif" fontSize={{ base: "md", md: "xl" }} lineHeight="1.55">
              {heroCopy.body}
            </Text>
          </Box>

          <Box
            as="button"
            type="button"
            onClick={onAboutOpen}
            alignSelf={isRtl ? "flex-end" : "flex-start"}
            h="48px"
            px={5}
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            gap={2}
            bg={isLightTheme ? "#ffffff" : ink}
            color={isLightTheme ? "#17171a" : paper}
            style={{
              backgroundColor: isLightTheme ? "#ffffff" : ink,
              color: isLightTheme ? "#17171a" : paper,
              borderColor: "#000000",
            }}
            border="2px solid #000000"
            borderColor="#000000"
            borderRadius="0"
            boxShadow={isLightTheme ? "4px 5px 0 #000000" : `4px 5px 0 ${ink}`}
            fontFamily="'DM Sans', sans-serif"
            fontWeight="900"
            fontSize="md"
            cursor="pointer"
            transition="all 0.15s ease"
            _hover={{
              bg: isLightTheme ? "#f4f4f5" : ink,
              transform: "translate(-2px, -2px)",
              boxShadow: isLightTheme
                ? "6px 7px 0 #000000"
                : `6px 7px 0 ${ink}`,
            }}
            _active={{
              transform: "translate(2px, 2px)",
              boxShadow: isLightTheme
                ? "2px 2px 0 #000000"
                : `2px 2px 0 ${ink}`,
            }}
          >
            <Text as="span">{translations.about}</Text>
            <LuArrowUpRight size={20} aria-hidden="true" focusable="false" />
          </Box>
        </VStack>

        <Box
          minH={{
            base: "max(560px, calc(100svh - 98px))",
            md: "680px",
            lg: "720px",
          }}
          display="grid"
          gridTemplateColumns={{
            base: "minmax(0, 1fr) clamp(118px, 31vw, 134px)",
            md: "minmax(0, 1fr) 190px",
          }}
          gridTemplateRows={{ base: "1fr 180px", md: "1fr 220px" }}
          gap={{ base: 2, md: 3 }}
          position="relative"
          dir="ltr"
          order={1}
          w="100%"
        >
          <Box
            gridColumn="1"
            gridRow="1 / span 2"
          position="relative"
          overflow="hidden"
          bg={panel}
          border="4px solid"
          borderColor={ink}
          animation={`${heroPanelEntrance} 980ms cubic-bezier(.16,.84,.22,1) 80ms both`}
          willChange="transform, opacity, clip-path"
          sx={reducedHeroMotion}
        >
            <Screentone ink={ink} opacity={0.16} size="13px" />
            <RadialFocusLines
              ink={ink}
              opacity={isLightTheme ? 0.16 : 0.24}
              innerFade="18%"
              animate
              animationDelay="300ms"
            />
            <MangaCornerBrackets ink={ink} size={14} offset={8} stroke={2.5} />
            <Box
              position="absolute"
              inset="0"
              bgImage={`repeating-linear-gradient(116deg, transparent 0 38px, ${ink}14 39px 42px, transparent 43px 62px)`}
              opacity={0.35}
            />
            <Box
              position="absolute"
              inset="-25%"
              zIndex={6}
              pointerEvents="none"
              aria-hidden="true"
              bg={`linear-gradient(100deg, transparent 38%, ${
                isLightTheme
                  ? "rgba(255,255,255,0.88)"
                  : "rgba(245,240,232,0.42)"
              } 49%, transparent 60%)`}
              animation={`${impactFlash} 980ms cubic-bezier(.2,.75,.2,1) 110ms both`}
              transform="skewX(-12deg)"
              sx={reducedHeroMotion}
            />
            {/* Hero Entrance SFX Katakana Watermark */}
            <Box
              position="absolute"
              top={{ base: "10%", sm: "8%", md: "3.5%", lg: "4.5%" }}
              left={{ base: "50%", md: "3.5%", lg: "4.5%" }}
              right="auto"
              transform={{
                base: "translateX(-50%) rotate(-5deg)",
                md: "rotate(-10deg) skewX(-4deg)",
              }}
              zIndex={1}
              pointerEvents="none"
              userSelect="none"
              aria-hidden="true"
              w={{ base: "88%", md: "auto" }}
              display="flex"
              justifyContent={{ base: "center", md: "flex-start" }}
              animation={`${sfxEntrance} 760ms cubic-bezier(.18,.9,.24,1.22) 260ms both`}
              willChange="transform, opacity, filter"
              sx={{
                "@media screen and (min-height: 740px) and (max-width: 767px)": {
                  top: "15%",
                },
                "@media screen and (min-height: 830px) and (max-width: 767px)": {
                  top: "18%",
                },
                "@media screen and (min-height: 900px) and (max-width: 767px)": {
                  top: "19.5%",
                },
                ...reducedHeroMotion,
              }}
            >
              <Text
                fontFamily="'Arial Black', 'Impact', sans-serif"
                fontSize={{
                  base: "clamp(2rem, 9.5vw, 3.4rem)",
                  sm: "clamp(2.8rem, 11vw, 4.4rem)",
                  md: "clamp(5.5rem, 8vw, 8.8rem)",
                }}
                fontWeight="900"
                lineHeight="0.82"
                letterSpacing="-0.04em"
                textAlign={{ base: "center", md: "left" }}
                whiteSpace="nowrap"
                color="transparent"
                sx={{
                  WebkitTextStroke: isLightTheme
                    ? "2.5px rgba(23, 23, 26, 0.25)"
                    : "2.5px rgba(245, 240, 232, 0.28)",
                  textShadow: isLightTheme
                    ? "3px 4px 0 rgba(23, 23, 26, 0.07)"
                    : "3px 4px 0 rgba(245, 240, 232, 0.12)",
                }}
              >
                バァァン!!
              </Text>
            </Box>
            <Box
              position="absolute"
              inset={{ base: "0 4%", sm: "0", md: "0 -8%" }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              pt={{ base: "34%", sm: "28%", md: "22%" }}
              filter={isLightTheme ? "none" : "saturate(0.84) contrast(1.05)"}
              animation={`${portraitEntrance} 940ms cubic-bezier(.16,.86,.25,1.16) 360ms both, ${portraitIdle} 4.8s ease-in-out 1.7s infinite`}
              willChange="transform, opacity"
              sx={reducedHeroMotion}
            >
              <Portrait
                randomCharacterKey={randomCharacterKey}
              />
            </Box>
            <Box
              position="absolute"
              top={{ base: "29%", sm: "26%", md: "13%", lg: "15%" }}
              left="50%"
              right="auto"
              zIndex={4}
              w={{ base: "calc(100% - 16px)", md: "min(380px, calc(100% - 64px))" }}
              maxW="380px"
              transform="translateX(-50%) rotate(-1.5deg)"
              bg="#ffffff"
              color="#17171a"
              border="3.5px solid #17171a"
              borderRadius={{
                base: "255px 22px 225px 24px / 24px 225px 24px 255px",
                md: "255px 26px 225px 28px / 28px 225px 26px 255px",
              }}
              boxShadow={
                isLightTheme
                  ? "5px 6px 0 #17171a"
                  : "5px 6px 0 rgba(255, 255, 255, 0.32)"
              }
              px={{ base: 3, md: 5 }}
              py={{ base: 3, md: 3.5 }}
              animation={`${bubbleEntrance} 760ms cubic-bezier(.17,.88,.26,1.2) 720ms both`}
              willChange="transform, opacity"
              sx={{
                "@media screen and (min-height: 740px) and (max-width: 767px)": {
                  top: "32%",
                },
                "@media screen and (min-height: 830px) and (max-width: 767px)": {
                  top: "34%",
                },
                "@media screen and (min-height: 900px) and (max-width: 767px)": {
                  top: "35%",
                },
                ...reducedHeroMotion,
              }}
              _after={{
                content: '""',
                position: "absolute",
                left: "50%",
                bottom: { base: "-20px", md: "-24px" },
                w: 0,
                h: 0,
                borderLeft: { base: "14px solid transparent", md: "17px solid transparent" },
                borderRight: { base: "14px solid transparent", md: "17px solid transparent" },
                borderTop: { base: "20px solid #17171a", md: "24px solid #17171a" },
                transform: "translateX(-50%) rotate(-3deg)",
              }}
              _before={{
                content: '""',
                position: "absolute",
                zIndex: 2,
                left: "50%",
                bottom: { base: "-14px", md: "-17px" },
                w: 0,
                h: 0,
                borderLeft: { base: "10px solid transparent", md: "13px solid transparent" },
                borderRight: { base: "10px solid transparent", md: "13px solid transparent" },
                borderTop: { base: "15px solid #ffffff", md: "18px solid #ffffff" },
                transform: "translateX(-50%) rotate(-3deg)",
              }}
            >
              <HStack
                position="relative"
                zIndex={3}
                spacing={{ base: 2, md: 2.5 }}
                flexWrap="wrap"
                justify="center"
              >
                <Text
                  w="100%"
                  fontFamily="'Gaegu', 'Patrick Hand', 'Comic Neue', 'Chalkboard SE', 'Comic Sans MS', cursive, sans-serif"
                  fontSize={{ base: "clamp(16px, 4.6vw, 19px)", md: "22px" }}
                  fontWeight="700"
                  letterSpacing="0.01em"
                  lineHeight="1.25"
                  textAlign="center"
                  color="#17171a"
                >
                  {translations.welcome}, {welcomeText}
                </Text>
                <Button
                  onClick={onProfileOpen}
                  leftIcon={<LuPencilLine size={13} />}
                  iconSpacing={{ base: 1.5, md: 2 }}
                  minH={{ base: "34px", md: "38px" }}
                  w="fit-content"
                  maxW="100%"
                  mx="auto"
                  px={{ base: 3.5, md: 4 }}
                  bg="transparent"
                  color="#17171a"
                  border="2px solid #17171a"
                  borderRadius="255px 15px 225px 15px/15px 225px 15px 255px"
                  boxShadow={
                    isLightTheme
                      ? "3px 4px 0 #17171a"
                      : "3px 4px 0 rgba(255, 255, 255, 0.35)"
                  }
                  transform="rotate(0.8deg)"
                  fontFamily="'Gaegu', 'Patrick Hand', 'Comic Neue', 'DM Sans', sans-serif"
                  fontSize={{ base: "clamp(13px, 3.5vw, 15px)", md: "17px" }}
                  fontWeight="700"
                  letterSpacing="0.01em"
                  _hover={{
                    bg: "rgba(23, 23, 26, 0.08)",
                    transform: "translate(-2px, -2px) rotate(0deg)",
                    boxShadow: isLightTheme
                      ? "5px 6px 0 #17171a"
                      : "5px 6px 0 rgba(255, 255, 255, 0.45)",
                  }}
                  _active={{
                    transform: "translate(2px, 2px) rotate(0.8deg)",
                    boxShadow: isLightTheme
                      ? "1px 2px 0 #17171a"
                      : "1px 2px 0 rgba(255, 255, 255, 0.25)",
                  }}
                >
                  {editProfileText}
                </Button>
              </HStack>
            </Box>
          </Box>

          <Box
            gridColumn="2"
            gridRow="1"
            position="relative"
            overflow="hidden"
            bg={panel}
            border="4px solid"
            borderColor={ink}
            display="flex"
            flexDirection="column"
            animation={`${sidePanelEntrance} 820ms cubic-bezier(.16,.86,.24,1.15) 400ms both`}
            willChange="transform, opacity"
            sx={reducedHeroMotion}
          >
            <Screentone ink={ink} opacity={0.14} size="10px" />
            {focusAreas.map((area, index) => (
              <Box
                key={area}
                flex="1"
                minH={0}
                position="relative"
                zIndex={1}
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
                px={{ base: 3.5, md: 5 }}
                py={{ base: 3, md: 4 }}
                bg={index === 0 ? ink : "transparent"}
                color={index === 0 ? paper : ink}
                borderBottom={index === focusAreas.length - 1 ? "0" : "3px solid"}
                borderColor={ink}
                animation={`${focusBlockEntrance} 520ms cubic-bezier(.2,.82,.24,1) ${
                  570 + index * 95
                }ms both`}
                willChange="transform, opacity, filter"
                sx={reducedHeroMotion}
              >
                <Text
                  fontFamily="monospace"
                  fontSize={{ base: "clamp(9px, 2.5vw, 11px)", md: "xs" }}
                  fontWeight="900"
                  color={index === 0 ? paper : muted}
                  letterSpacing="0.08em"
                >
                  {String(index + 1).padStart(2, "0")}
                </Text>
                <Text
                  fontFamily="'DM Sans', sans-serif"
                  fontSize={{ base: "clamp(10px, 2.7vw, 12px)", md: "md" }}
                  fontWeight="900"
                  lineHeight="1.03"
                  letterSpacing="-0.025em"
                  overflowWrap="anywhere"
                  whiteSpace="pre-line"
                  dir={isRtl ? "rtl" : "ltr"}
                  textAlign={isRtl ? "right" : "left"}
                >
                  {area}
                </Text>
              </Box>
            ))}
          </Box>

          <Box
            gridColumn="2"
            gridRow="2"
            bg={ink}
            color={paper}
            border="4px solid"
            borderColor={ink}
            display="flex"
            alignItems="flex-end"
            px={{ base: 4, md: 5 }}
            py={{ base: 4, md: 5 }}
            position="relative"
            overflow="hidden"
            animation={`${sloganEntrance} 780ms cubic-bezier(.16,.88,.24,1.16) 760ms both`}
            willChange="transform, opacity"
            sx={reducedHeroMotion}
          >
            <Box
              position="absolute"
              left="-20%"
              top="12%"
              w="150%"
              h="6px"
              bg={isLightTheme ? "#ffffff" : "#0c0c0f"}
              transform="rotate(-24deg)"
            />
            <Text
              position="relative"
              fontFamily="'DM Sans', sans-serif"
              fontWeight="900"
              fontSize={{ base: "clamp(12px, 3vw, 14px)", md: "xl" }}
              lineHeight="0.96"
              letterSpacing="-0.03em"
              whiteSpace="pre-line"
              dir={isRtl ? "rtl" : "ltr"}
              textAlign={isRtl ? "right" : "left"}
            >
              {heroCopy.scholarshipSlogan || "CREATE\nSCHOLARSHIPS\nWITH LEARNING."}
            </Text>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

const CHAPTERS = [
  {
    number: "01",
    title: "THE FIRST WORD",
    verb: "LEARN",
    sfx: "ドドド",
    emotion: "aura",
  },
  {
    number: "02",
    title: "THE FIRST BUILD",
    verb: "BUILD",
    sfx: "ゴゴゴ",
    emotion: "speed",
  },
  {
    number: "03",
    title: "THE WAY HOME",
    verb: "PLAN",
    sfx: "ザッ",
    emotion: "perspective",
  },
  {
    number: "04",
    title: "THE OPEN DOOR",
    verb: "INVEST",
    sfx: "ドン!!",
    emotion: "shockwave",
  },
];

function MangaChapter({
  link,
  index,
  chapterVerb,
  productLabel,
  isLightTheme,
  pageDirection,
  onLaunchSound,
  onLaunchEvent,
}) {
  const [sectionRef, visible] = useReveal();
  const ink = isLightTheme ? "#17171a" : "#f5f0e8";
  const paper = isLightTheme ? "#fffcf4" : "#0c0c0f";
  const panel = "#151519";
  const visualPanel = isLightTheme ? "#f5f0e8" : panel;
  const muted = "#f1ede7";
  const titleSurface = "#f5f0e8";
  const titleText = "#0c0c0f";
  const reverse = index % 2 === 1;
  const chapter = CHAPTERS[index];
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

  const revealStyle = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translate3d(0,0,0)" : "translate3d(0,42px,0)",
    transition: "opacity 620ms ease, transform 760ms cubic-bezier(.16,.8,.2,1)",
  };

  return (
    <Box
      ref={sectionRef}
      as="article"
      id={`chapter-${index + 1}`}
      h={{ base: "100svh", md: "auto" }}
      minH="100svh"
      display="flex"
      alignItems="center"
      position="relative"
      overflow="hidden"
      bg={paper}
      color={ink}
      borderBottom="5px solid"
      borderColor={ink}
      pb={{ base: 0, md: 20 }}
      scrollSnapAlign="start"
    >
      <Screentone ink={ink} opacity={isLightTheme ? 0.05 : 0.065} size="17px" />

      <Container
        maxW="container.xl"
        h={{ base: "100%", md: "auto" }}
        minH={0}
        position="relative"
        zIndex={2}
        display={{ base: "flex", md: "block" }}
        flexDirection="column"
        py={{ base: 4, md: 0 }}
        px={{ base: 4, md: 4 }}
      >
        <Box
          h={{ base: "clamp(56px, 9svh, 72px)", md: "138px" }}
          flexShrink={0}
          display="flex"
          alignItems="center"
          overflow="hidden"
        >
          <Text
            aria-hidden="true"
            w="100%"
            textAlign={pageDirection === "rtl" ? "right" : "left"}
            dir={pageDirection}
            fontFamily="'DM Sans', sans-serif"
            fontSize={{ base: "clamp(3rem, 14vw, 4.5rem)", md: "7rem" }}
            fontWeight="900"
            letterSpacing="-0.08em"
            lineHeight="0.82"
            color={link.accent}
            opacity={isLightTheme ? 0.62 : 0.82}
            textShadow={`0 0 24px ${link.accent}44`}
          >
            {chapterVerb || chapter.verb}
          </Text>
        </Box>
        <MangaRule ink={ink} accent={link.accent} reverse={reverse} />

        <Box
          mt={{ base: 3.5, md: 6 }}
          flex={{ base: "1", md: "initial" }}
          minH={0}
          display="grid"
          gridTemplateColumns={{ base: "1fr", lg: "repeat(12, minmax(0, 1fr))" }}
          gridTemplateRows={{
            base: "minmax(0, 1.22fr) minmax(0, 0.58fr) minmax(0, 0.9fr)",
            md: "auto",
            lg: "minmax(240px, 0.78fr) minmax(300px, 1fr)",
          }}
          gap={{ base: 3.5, md: 4 }}
          dir="ltr"
          sx={{
            "@media (prefers-reduced-motion: reduce)": {
              "& > *": { opacity: "1 !important", transform: "none !important", transition: "none !important" },
            },
          }}
        >
          <Box
            gridColumn={{ base: "1", lg: reverse ? "6 / span 7" : "1 / span 7" }}
            gridRow={{ base: "1", lg: "1 / span 2" }}
            minH={{ base: 0, md: "520px", lg: "670px" }}
            position="relative"
            overflow="hidden"
            bg={link.accent}
            border="4px solid"
            borderColor={ink}
            style={{ ...revealStyle, transitionDelay: "60ms" }}
          >
            <Screentone ink={ink} opacity={0.2} size="12px" />
            <ChapterEmotionLines
              variant={chapter.emotion}
              ink={isLightTheme ? "#000000" : "#ffffff"}
              opacity={isLightTheme ? 0.22 : 0.3}
              animate={visible}
              animationDelay="140ms"
              reverse={reverse}
            />
            <Box
              position="absolute"
              inset="-10%"
              bgImage={`repeating-linear-gradient(${reverse ? "62deg" : "118deg"}, transparent 0 44px, ${ink}26 45px 48px, transparent 49px 70px)`}
              opacity={0.48}
            />

            {/* Inner Art Panel Frame with Dynamic Komawari Tilt & Bleed */}
            <Box
              position="absolute"
              inset={{ base: "7% 9%", md: "10% 12%" }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg={visualPanel}
              border="4px solid"
              borderColor={isLightTheme ? ink : "#000000"}
              overflow="hidden"
              boxShadow={`8px 9px 0 ${
                isLightTheme ? ink : "rgba(245, 240, 232, 0.52)"
              }`}
              transform={reverse ? "rotate(1.2deg)" : "rotate(-1.2deg)"}
              transition="transform 300ms ease"
              _hover={{ transform: "rotate(0deg) scale(1.02)" }}
            >
              <Screentone ink={ink} opacity={0.12} size="11px" />
              <MangaCornerBrackets
                ink={isLightTheme ? ink : "#ffffff"}
                size={10}
                offset={6}
                stroke={2}
              />

              {/* Japanese SFX Katakana Stamp directly inside the logo container */}
              <Box
                position="absolute"
                bottom={{ base: "14px", md: "20px" }}
                right={{ base: "10px", md: "18px" }}
                zIndex={0}
                pointerEvents="none"
                userSelect="none"
                aria-hidden="true"
                transform="rotate(-5deg)"
              >
                <Text
                  fontFamily="'Arial Black', 'Impact', sans-serif"
                  fontSize={{
                    base: "clamp(2rem, 8vw, 3.4rem)",
                    md: "clamp(3.6rem, 6vw, 5.2rem)",
                  }}
                  fontWeight="900"
                  lineHeight="0.8"
                  letterSpacing="-0.04em"
                  color="transparent"
                  sx={{
                    WebkitTextStroke: isLightTheme
                      ? "2px rgba(23, 23, 26, 0.22)"
                      : "2px rgba(245, 240, 232, 0.28)",
                    textShadow: isLightTheme
                      ? "2px 3px 0 rgba(23, 23, 26, 0.05)"
                      : "2px 3px 0 rgba(0, 0, 0, 0.35)",
                  }}
                >
                  {chapter.sfx}
                </Text>
              </Box>

              <Box
                position="relative"
                zIndex={1}
                transform={{ base: "scale(1.48)", md: "scale(2.8)" }}
              >
                {link.visual}
              </Box>
            </Box>
          </Box>

          <Box
            gridColumn={{ base: "1", lg: reverse ? "1 / span 5" : "8 / span 5" }}
            gridRow={{ base: "2", lg: "1" }}
            minH={{ base: 0, md: "210px" }}
            position="relative"
            overflow="hidden"
            bg={titleSurface}
            color={titleText}
            border="4px solid"
            borderColor={ink}
            p={{ base: 4, md: 7 }}
            display="flex"
            flexDirection="column"
            justifyContent={{ base: "center", md: "space-between" }}
            gap={{ base: "clamp(14px, 3.5svh, 24px)", md: 0 }}
            style={{ ...revealStyle, transitionDelay: "170ms" }}
          >
            <Box position="absolute" top="0" right="0" w="11px" h="100%" bg={link.accent} />
            <Text
              fontFamily="monospace"
              fontSize={{ base: "clamp(10px, 1.7vw, 14px)", md: "10px" }}
              letterSpacing="0.18em"
              color={link.labelAccent || link.shadowAccent || link.accent}
              fontWeight="900"
              dir={pageDirection}
              textAlign={pageDirection === "rtl" ? "right" : "left"}
            >
              {productLabel || "PRODUCT"} {index + 1}
            </Text>
            <Heading
              fontFamily="'DM Sans', sans-serif"
              fontSize={{ base: "clamp(1.5rem, 6vw, 3rem)", md: "5xl" }}
              lineHeight="0.9"
              letterSpacing="-0.055em"
              fontWeight="900"
              textAlign={pageDirection === "rtl" ? "right" : "left"}
              dir={pageDirection}
            >
              {link.title}
            </Heading>
          </Box>

          <Box
            gridColumn={{ base: "1", lg: reverse ? "1 / span 5" : "8 / span 5" }}
            gridRow={{ base: "3", lg: "2" }}
            minH={0}
            h={{ base: "100%", md: "fit-content" }}
            alignSelf="start"
            bg={panel}
            border="4px solid"
            borderColor={ink}
            px={{ base: 4, md: 7 }}
            py={{ base: 4, md: 6 }}
            display="flex"
            flexDirection="column"
            justifyContent={{ base: "center", md: "space-between" }}
            position="relative"
            style={{ ...revealStyle, transitionDelay: "280ms" }}
            dir={pageDirection}
          >
            <Text
              fontFamily="'DM Sans', sans-serif"
              fontSize={{ base: "sm", md: "lg" }}
              lineHeight={{ base: "1.45", md: "1.7" }}
              color={muted}
              textAlign={pageDirection === "rtl" ? "right" : "left"}
              mb={{ base: 4, md: 6 }}
              sx={{
                "@media screen and (min-width: 390px) and (max-width: 767px)": {
                  fontSize: "clamp(1rem, 4.2vw, 1.125rem)",
                },
              }}
            >
              {link.description}
            </Text>
            <Button
              {...actionProps}
              alignSelf={pageDirection === "rtl" ? "flex-end" : "flex-start"}
              minH={{ base: "52px", md: "58px" }}
              px={{ base: 6, md: 7 }}
              bg={link.accent}
              color="white"
              textShadow={link.buttonTextShadow}
              border="2px solid #000000"
              borderColor="#000000"
              style={{ borderColor: "#000000" }}
              borderRadius="0"
              boxShadow={`4px 5px 0 ${link.shadowAccent}`}
              fontFamily="'DM Sans', sans-serif"
              fontSize={{ base: "lg", md: "xl" }}
              fontWeight="900"
              rightIcon={
                <LuArrowUpRight
                  size={22}
                  aria-hidden="true"
                  focusable="false"
                />
              }
              _hover={{
                bg: link.accent,
                color: "white",
                textDecoration: "none",
                transform: "translate(-2px,-2px)",
                boxShadow: `6px 7px 0 ${link.shadowAccent}`,
              }}
              _active={{
                transform: "translate(3px,3px)",
                boxShadow: `1px 2px 0 ${link.shadowAccent}`,
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
  links,
  heroCopy,
  isLightTheme,
  pageDirection,
  onLaunchSound,
  onLaunchEvent,
}) {
  const ink = isLightTheme ? "#17171a" : "#f5f0e8";
  const paper = isLightTheme ? "#fffcf4" : "#0c0c0f";

  return (
    <Box id="projects" scrollMarginTop="0" bg={paper} color={ink}>
      {links.map((link, index) => (
        <MangaChapter
          key={link.title}
          link={link}
          index={index}
          chapterVerb={heroCopy.chapterVerbs?.[index]}
          productLabel={heroCopy.productLabel}
          isLightTheme={isLightTheme}
          pageDirection={pageDirection}
          onLaunchSound={onLaunchSound}
          onLaunchEvent={() => onLaunchEvent(link)}
        />
      ))}
    </Box>
  );
}

export default function MangaLinksExperience({
  heroCopy,
  translations,
  links,
  isLightTheme,
  isRtl,
  directionalTextAlign,
  pageDirection,
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
  musicControl,
  onLaunchSound,
  onLaunchEvent,
}) {
  const ink = isLightTheme ? "#17171a" : "#f5f0e8";
  const paper = isLightTheme ? "#fffcf4" : "#0c0c0f";
  const accent = ink;

  return (
    <Box bg={paper} color={ink} position="relative">
      <MangaToolbar
        isLightTheme={isLightTheme}
        ink={ink}
        accent={accent}
        languageControl={languageControl}
        themeControl={themeControl}
        musicControl={musicControl}
        onSocialClick={onSocialClick}
      />
      <MangaCover
        heroCopy={heroCopy}
        translations={translations}
        isLightTheme={isLightTheme}
        isRtl={isRtl}
        directionalTextAlign={directionalTextAlign}
        primaryAccent={primaryAccent}
        profilePicture={profilePicture}
        randomCharacterKey={randomCharacterKey}
        welcomeText={welcomeText}
        editProfileText={editProfileText}
        onProfileOpen={onProfileOpen}
        onAboutOpen={onAboutOpen}
      />
      <MangaStories
        links={links}
        heroCopy={heroCopy}
        isLightTheme={isLightTheme}
        pageDirection={pageDirection}
        onLaunchSound={onLaunchSound}
        onLaunchEvent={onLaunchEvent}
      />
    </Box>
  );
}
