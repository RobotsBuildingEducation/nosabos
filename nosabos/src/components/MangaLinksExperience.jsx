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
import { LuPencilLine } from "react-icons/lu";
import RandomCharacter from "./RandomCharacter";

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

function MangaRule({ ink, accent, reverse = false }) {
  return (
    <HStack w="100%" spacing={2} direction={reverse ? "row-reverse" : "row"}>
      <Box h="3px" flex="1" bg={ink} />
      <Box h="7px" w={{ base: "42px", md: "72px" }} bg={accent} />
      <Box h="3px" w={{ base: "16px", md: "28px" }} bg={ink} />
    </HStack>
  );
}

function Portrait({ profilePicture, randomCharacterKey, close = false }) {
  if (profilePicture) {
    return (
      <img
        src={profilePicture}
        alt={close ? "" : "Profile"}
        aria-hidden={close ? "true" : undefined}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center bottom",
          filter: "grayscale(1) contrast(1.08)",
        }}
      />
    );
  }

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
          border="1.5px solid"
          borderColor={ink}
          borderRadius="7px"
          boxShadow={isLightTheme ? "1px 2px 0 #17171a" : "1px 2px 0 #000"}
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
    </HStack>
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
    "INVESTING & BUSINESS",
    "DUAL CITIZENSHIP PLANNER",
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
        gap={{ base: 12, md: 16 }}
        pt={{ base: 24, md: 32, lg: 28 }}
        pb={{ base: 14, md: 18, lg: 12 }}
      >
        <VStack
          align={isRtl ? "flex-end" : "flex-start"}
          textAlign={directionalTextAlign}
          spacing={{ base: 5, md: 6 }}
          position="relative"
          zIndex={3}
          order={2}
          w="100%"
        >
          <MangaRule ink={ink} accent={ink} reverse={isRtl} />

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

          <Button
            onClick={onAboutOpen}
            alignSelf={isRtl ? "flex-end" : "flex-start"}
            h="48px"
            px={5}
            bg={ink}
            color={paper}
            borderWidth="2px"
            borderStyle="solid"
            borderColor={paper}
            borderRadius="0"
            boxShadow={`4px 5px 0 ${ink}`}
            fontFamily="'DM Sans', sans-serif"
            fontWeight="900"
            _hover={{ bg: ink, transform: "translate(-2px,-2px)", boxShadow: `6px 7px 0 ${ink}` }}
          >
            {translations.about} ↗
          </Button>
        </VStack>

        <Box
          minH={{
            base: "max(560px, calc(100svh - 112px))",
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
          >
            <Screentone ink={ink} opacity={0.16} size="13px" />
            <Box
              position="absolute"
              inset="0"
              bgImage={`repeating-linear-gradient(116deg, transparent 0 38px, ${ink}14 39px 42px, transparent 43px 62px)`}
              opacity={0.35}
            />
            <Box
              position="absolute"
              inset={{ base: "0 4%", sm: "0", md: "0 -8%" }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              pt={{ base: "34%", sm: "28%", md: "22%" }}
              filter={isLightTheme ? "none" : "saturate(0.84) contrast(1.05)"}
            >
              <Portrait
                profilePicture={profilePicture}
                randomCharacterKey={randomCharacterKey}
              />
            </Box>
            <Box
              position="absolute"
              top={{ base: "29%", sm: "23%", md: "14%", lg: "16%" }}
              left="50%"
              right="auto"
              zIndex={4}
              w={{ base: "calc(100% - 16px)", md: "min(370px, calc(100% - 72px))" }}
              maxW="370px"
              transform="translateX(-50%)"
              bg="#ffffff"
              color="#17171a"
              border="3px solid"
              borderColor={bubbleOutline}
              borderRadius={{ base: "18px", md: "24px" }}
              boxShadow={bubbleShadow}
              px={{ base: 2.5, md: 4 }}
              py={{ base: 3, md: 3.5 }}
              _after={{
                content: '""',
                position: "absolute",
                left: "50%",
                bottom: { base: "-22px", md: "-28px" },
                borderTop: {
                  base: `22px solid ${bubbleOutline}`,
                  md: `28px solid ${bubbleOutline}`,
                },
                borderLeft: { base: "15px solid transparent", md: "20px solid transparent" },
                borderRight: { base: "15px solid transparent", md: "20px solid transparent" },
                transform: "translateX(-50%)",
              }}
              _before={{
                content: '""',
                position: "absolute",
                zIndex: 1,
                left: "50%",
                bottom: { base: "-14px", md: "-18px" },
                borderTop: { base: "17px solid #ffffff", md: "22px solid #ffffff" },
                borderLeft: { base: "11px solid transparent", md: "15px solid transparent" },
                borderRight: { base: "11px solid transparent", md: "15px solid transparent" },
                transform: "translateX(-50%)",
              }}
            >
              <HStack
                position="relative"
                zIndex={2}
                spacing={{ base: 2, md: 2.5 }}
                flexWrap="wrap"
                justify={{ base: "center", md: "flex-start" }}
              >
                <Text
                  w="100%"
                  fontFamily="monospace"
                  fontSize={{ base: "clamp(11px, 3vw, 13px)", md: "lg" }}
                  fontWeight="800"
                  textAlign="center"
                  color="#17171a"
                >
                  {translations.welcome}, {welcomeText}
                </Text>
                <Button
                  onClick={onProfileOpen}
                  leftIcon={<LuPencilLine size={12} />}
                  iconSpacing={{ base: 1, md: 2 }}
                  minH={{ base: "34px", md: "42px" }}
                  w="fit-content"
                  maxW="100%"
                  mx="auto"
                  px={{ base: 3, md: 4 }}
                  bg="transparent"
                  color="#17171a"
                  border="2px solid #17171a"
                  borderRadius="0"
                  boxShadow="4px 5px 0 #17171a"
                  fontFamily="'DM Sans', sans-serif"
                  fontSize={{ base: "clamp(10px, 2.7vw, 12px)", md: "md" }}
                  fontWeight="900"
                  _hover={{
                    bg: "rgba(0,0,0,0.06)",
                    transform: "translate(-2px,-2px)",
                    boxShadow: "6px 7px 0 #17171a",
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
  { number: "01", title: "THE FIRST WORD", verb: "LEARN" },
  { number: "02", title: "THE FIRST BUILD", verb: "BUILD" },
  { number: "03", title: "THE WAY HOME", verb: "PLAN" },
  { number: "04", title: "THE OPEN DOOR", verb: "INVEST" },
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
        py={{ base: 2, md: 0 }}
        px={{ base: 3, md: 4 }}
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
          mt={{ base: 2, md: 6 }}
          flex={{ base: "1", md: "initial" }}
          minH={0}
          display="grid"
          gridTemplateColumns={{ base: "1fr", lg: "repeat(12, minmax(0, 1fr))" }}
          gridTemplateRows={{
            base: "minmax(0, 1.22fr) minmax(0, 0.58fr) minmax(0, 0.9fr)",
            md: "auto",
            lg: "minmax(240px, 0.78fr) minmax(300px, 1fr)",
          }}
          gap={{ base: 2, md: 4 }}
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
            <Box
              position="absolute"
              inset="-10%"
              bgImage={`repeating-linear-gradient(${reverse ? "62deg" : "118deg"}, transparent 0 44px, ${ink}26 45px 48px, transparent 49px 70px)`}
              opacity={0.48}
            />
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
            >
              <Screentone ink={ink} opacity={0.12} size="11px" />
              <Box position="relative" zIndex={1} transform={{ base: "scale(1.45)", md: "scale(2.75)" }}>
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
            p={{ base: 3, md: 7 }}
            display="flex"
            flexDirection="column"
            justifyContent={{ base: "center", md: "space-between" }}
            gap={{ base: "clamp(12px, 3svh, 22px)", md: 0 }}
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
            px={{ base: 3, md: 7 }}
            py={{ base: 3, md: 6 }}
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
              mb={{ base: 3, md: 6 }}
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
              border="2px solid"
              borderColor="#000000"
              borderRadius="0"
              boxShadow={`4px 5px 0 ${link.shadowAccent}`}
              fontFamily="'DM Sans', sans-serif"
              fontSize={{ base: "lg", md: "xl" }}
              fontWeight="900"
              rightIcon={<Text fontSize={{ base: "xl", md: "2xl" }}>↗</Text>}
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
