import { loadPublicPageCopy, readPublicPageCopy } from "../features/publicCopy/index.js";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LandingPageSections from "./LandingPageSections";
import PrivacyPolicyFooter from "./PrivacyPolicy";

import {
  FaComments,
  FaBookOpen,
  FaBook,
  FaFlask,
  FaPencilAlt,
  FaLayerGroup,
  FaStickyNote,
  FaUsers,
  FaCompass,
  FaMap,
  FaBullseye,
  FaVolumeUp,
  FaGamepad,
  FaMicrophone,
  FaBookmark,
  FaCalendarCheck,
  FaPaw,
  FaRoute,
  FaGlobeAmericas,
  FaChartLine,
  FaTrophy,
} from "react-icons/fa";
import { LuBookAudio, LuSun } from "react-icons/lu";
import { RiMoonClearFill } from "react-icons/ri";

import {
  Menu,
  MenuButton,
  MenuList,
  MenuOptionGroup,
  MenuItemOption,
  HStack,
  Text as ChakraText,
  Button as ChakraButton,
  IconButton,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import VoiceOrb from "./VoiceOrbNext";
import AnimatedBackground from "./AnimatedBackground";
import { MdSupportAgent } from "react-icons/md";
import { detectUserLanguage } from "../utils/languageDetection";
import { usePublicIdentity } from "../features/publicStartup/usePublicIdentity.jsx";
import useSoundSettings from "../hooks/useSoundSettings";
import * as Tone from "tone";
import { useThemeStore } from "../useThemeStore";
import { getThemeModeToggleProps } from "../utils/themeModeToggleStyle";
import {
  APP_BUTTON_RADIUS as LANDING_BUTTON_RADIUS,
  APP_SQUIRCLE_SHAPE as LANDING_SQUIRCLE_SHAPE,
} from "../theme";
import {
  getSupportLanguageOptions,
} from "../constants/languages";

import { syncDocumentLanguage } from "../utils/documentLanguage";
import { rememberSecretKeySignIn } from "../utils/authSession";
import { isNsecSecretKeyLike } from "../utils/nostrKeyDetection";
import { selectSound, submitActionSound } from "../constants/sounds";

// Minimal hook stubs for standalone demo - replace with your actual implementations

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

const theme = {
  colors: {
    bg: {
      deep: "var(--app-page-bg)",
      elevated: "var(--app-glass-bg)",
      glass: "var(--app-glass-bg-soft)",
      glow: "rgba(20, 184, 166, 0.08)",
    },
    text: {
      primary: "var(--app-text-primary)",
      secondary: "var(--app-text-secondary)",
      accent: "#2dd4bf",
      muted: "var(--app-text-muted)",
    },
    accent: {
      primary: "#14b8a6",
      secondary: "#0ea5e9",
      tertiary: "#a78bfa",
      warm: "#f97316",
    },
    border: {
      subtle: "var(--app-border)",
      accent: "rgba(20, 184, 166, 0.3)",
    },
  },
  fonts: {
    display:
      "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    body: "'DM Sans', -apple-system, sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  spacing: {
    section: "clamp(80px, 12vw, 160px)",
    container: "clamp(20px, 5vw, 80px)",
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSLATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// LANGUAGE MENU COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const LanguageMenu = ({ lang, setLang, playSound }) => {
  const options = getSupportLanguageOptions({
    ui: readPublicPageCopy("landing", lang).copy,
    uiLang: lang,
  });
  const selected = options.find((o) => o.value === lang) || options[0];

  return (
    <div
      style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}
    >
      <Menu autoSelect={false} isLazy>
        <MenuButton
          as={ChakraButton}
          rightIcon={<ChevronDownIcon />}
          variant="outline"
          size="sm"
          borderColor="var(--app-border)"
          bg="var(--app-glass-bg)"
          color="var(--app-text-primary)"
          _hover={{ bg: "var(--app-glass-bg-soft)" }}
          _active={{ bg: "var(--app-glass-bg-soft)" }}
          backdropFilter="blur(20px)"
          rounded="xl"
          borderRadius={LANDING_BUTTON_RADIUS}
          style={{ cornerShape: LANDING_SQUIRCLE_SHAPE }}
          px={4}
          py={5}
          minW="150px"
          textAlign="left"
          onClick={() => playSound(selectSound)}
        >
          <HStack spacing={2}>
            {selected?.flag}
            <ChakraText as="span" fontSize="sm" fontWeight="semibold">
              {selected?.label}
            </ChakraText>
          </HStack>
        </MenuButton>
        <MenuList
          borderColor="var(--app-border)"
          bg="var(--app-surface)"
          borderRadius="24px"
          style={{ cornerShape: LANDING_SQUIRCLE_SHAPE }}
          shadow="xl"
          minW="160px"
          maxH="300px"
          overflowY="auto"
          sx={{
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: "var(--app-glass-bg-soft)",
              borderRadius: "4px",
              cornerShape: LANDING_SQUIRCLE_SHAPE,
            },
            "&::-webkit-scrollbar-thumb": {
              background: "var(--app-border-strong)",
              borderRadius: "4px",
              cornerShape: LANDING_SQUIRCLE_SHAPE,
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "var(--app-text-muted)",
            },
          }}
        >
          <MenuOptionGroup
            type="radio"
            value={lang}
            onChange={(value) => {
              playSound(selectSound);
              setLang(value);
            }}
          >
            {options.map((opt) => (
              <MenuItemOption
                key={opt.value}
                value={opt.value}
                bg="transparent"
                borderRadius="12px"
                style={{ cornerShape: LANDING_SQUIRCLE_SHAPE }}
                _hover={{ bg: "var(--app-surface-elevated)" }}
                _checked={{ fontWeight: "semibold" }}
                py={3}
              >
                <HStack spacing={2}>
                  {opt.flag}
                  <ChakraText as="span" fontSize="sm">
                    {opt.label}
                  </ChakraText>
                </HStack>
              </MenuItemOption>
            ))}
          </MenuOptionGroup>
        </MenuList>
      </Menu>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    html {
      scroll-behavior: smooth;
    }
    
    body {
      font-family: ${theme.fonts.body};
      background: ${theme.colors.bg.deep};
      color: ${theme.colors.text.primary};
      line-height: 1.6;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    ::selection {
      background: ${theme.colors.accent.primary};
      color: ${theme.colors.bg.deep};
    }
    
    input::placeholder {
      color: ${theme.colors.text.muted};
    }

    .piyali-landing-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 120;
      padding: 8px clamp(14px, 3vw, 28px);
      background-color: rgba(254, 250, 241, 0);
      background-image: none;
      border: 0;
      box-shadow: none;
      transition: background-color 180ms ease;
      pointer-events: none;
    }

    .piyali-landing-header.is-scrolled {
      background-color: #FCF8F0;
      border: 0;
    }

    .piyali-landing-header.is-dark.is-scrolled {
      background-color: #060A16;
      border: 0;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28);
    }

    .piyali-landing-header-inner {
      width: 100%;
      min-height: 44px;
      margin: 0 auto;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      border: 0;
      background: transparent;
      box-shadow: none;
      backdrop-filter: none;
      pointer-events: auto;
    }

    .piyali-landing-brand {
      border: 0;
      background: transparent;
      color: #2a2119;
      cursor: default;
      flex: 0 1 auto;
      min-width: 0;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-family: ${theme.fonts.display};
      font-size: clamp(1.05rem, 3vw, 1.28rem);
      font-weight: 700;
      line-height: 1;
      letter-spacing: 0;
      white-space: nowrap;
    }

    .piyali-landing-header.is-dark .piyali-landing-brand {
      color: #f8fafc;
    }

    .piyali-landing-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      min-width: 0;
    }

    .piyali-landing-nav-buttons {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      min-width: 0;
    }

    @media (max-width: 520px) {
      .piyali-landing-header {
        padding: 8px 10px;
      }

      .piyali-landing-header-inner {
        min-height: 42px;
        padding: 0;
        gap: 8px;
      }

      .piyali-landing-actions {
        gap: 6px;
      }

      .piyali-landing-actions button {
        font-size: 0.78rem !important;
        padding-left: 10px !important;
        padding-right: 10px !important;
      }

      .piyali-landing-nav-buttons {
        gap: 6px;
      }
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(2deg); }
    }
    
    @keyframes pulse-glow {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.05); }
    }
    
    @keyframes gradient-shift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%) skewX(-15deg); }
      100% { transform: translateX(200%) skewX(-15deg); }
    }
    
    @keyframes orbit {
      0% { transform: rotate(0deg) translateX(150px) rotate(0deg); }
      100% { transform: rotate(360deg) translateX(150px) rotate(-360deg); }
    }
  `}</style>
);

// ═══════════════════════════════════════════════════════════════════════════════
// FLOATING LANGUAGE ELEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

const FloatingElements = () => {
  const words = [
    { text: "Hola", x: "15%", y: "20%", delay: 0 },
    { text: "Bonjour", x: "80%", y: "15%", delay: 1 },
    { text: "Ciao", x: "10%", y: "70%", delay: 2 },
    { text: "Olá", x: "85%", y: "60%", delay: 0.5 },
    { text: "Hello", x: "25%", y: "85%", delay: 1.5 },
    { text: "Piyali", x: "70%", y: "80%", delay: 2.5, featured: true },
    { text: "Hallo", x: "50%", y: "12%", delay: 1.8 },
    { text: "Привет", x: "35%", y: "10%", delay: 2.2 },
    { text: "こんにちは", x: "60%", y: "30%", delay: 1.2 },
    { text: "Guten Tag", x: "5%", y: "45%", delay: 2.8 },
    { text: "Cześć", x: "90%", y: "35%", delay: 0.8 },
    { text: "Dia dhuit", x: "40%", y: "65%", delay: 2.1 },
  ];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      {words.map((word, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: word.featured ? [0.16, 0.36, 0.16] : [0.1, 0.25, 0.1],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 6 + i,
            repeat: Infinity,
            delay: word.delay,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            left: word.x,
            top: word.y,
            fontFamily: theme.fonts.display,
            fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
            fontWeight: 500,
            color: theme.colors.accent.primary,
            opacity: word.featured ? 0.24 : 0.15,
            textShadow: word.featured
              ? "0 0 18px rgba(20, 184, 166, 0.5), 0 0 42px rgba(14, 165, 233, 0.32), 0 10px 28px rgba(20, 184, 166, 0.22)"
              : `0 0 40px ${theme.colors.accent.primary}`,
            filter: word.featured
              ? "drop-shadow(0 12px 22px rgba(20, 184, 166, 0.22))"
              : "none",
          }}
        >
          {word.text}
        </motion.div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// LOGO COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const Logo = ({ size = 48 }) => (
  <motion.div
    style={{
      borderRadius: "16px",
      cornerShape: LANDING_SQUIRCLE_SHAPE,
      background: `linear-gradient(135deg, ${theme.colors.accent.primary} 0%, ${theme.colors.accent.secondary} 100%)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: `0 8px 32px rgba(20, 184, 166, 0.3)`,
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)",
        animation: "shimmer 3s infinite",
      }}
    />
    <span
      style={{
        fontSize: size * 0.22,
        fontFamily: theme.fonts.display,
        fontWeight: 700,
        color: "#030712",
        position: "relative",
        zIndex: 1,
        padding: 16,
      }}
    >
      Piyali
    </span>
  </motion.div>
);

const ThemeModeToggle = ({
  themeMode,
  onModeChange,
  fixed = true,
  compact = false,
}) => {
  const isDark = themeMode === "dark";
  const isLightTheme = !isDark;
  const nextMode = isDark ? "light" : "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";
  const iconSize = compact ? 15 : 18;
  const themeToggleProps = getThemeModeToggleProps(isLightTheme);

  return (
    <IconButton
      type="button"
      aria-label={label}
      title={label}
      onClick={() => onModeChange(nextMode)}
      icon={
        isDark ? (
          <LuSun size={iconSize} color="#fffaf0" strokeWidth={2.35} />
        ) : (
          <RiMoonClearFill size={iconSize} />
        )
      }
      size="sm"
      minW={compact ? "34px" : "40px"}
      h={compact ? "34px" : "40px"}
      borderRadius={LANDING_BUTTON_RADIUS}
      style={{ cornerShape: LANDING_SQUIRCLE_SHAPE }}
      {...(fixed
        ? {
            position: "fixed",
            top: "18px",
            right: "20px",
            zIndex: 120,
          }
        : {})}
      {...themeToggleProps}
    />
  );
};

const LandingHeader = ({
  copy,
  themeMode,
  onThemeModeChange,
  onStartLearning,
  onSignIn,
  isCreating,
  showActions,
  isScrolled,
}) => (
  <motion.header
    className={`piyali-landing-header${
      themeMode === "dark" ? " is-dark" : ""
    }${isScrolled ? " is-scrolled" : ""}`}
    initial={{ opacity: 0, y: -16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
  >
    <div className="piyali-landing-header-inner">
      <div className="piyali-landing-brand" aria-label="Piyali">
        <VoiceOrb defer3D size={50} centered={false} force3D showShadow={false} />
        <span>Piyali</span>
      </div>
      <div className="piyali-landing-actions">
        <AnimatePresence initial={false}>
          {showActions && (
            <motion.div
              className="piyali-landing-nav-buttons"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 14 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                size="sm"
                onClick={onStartLearning}
                loading={isCreating}
                disabled={isCreating}
                style={{
                  padding: "8px 14px",
                  boxShadow: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {copy.cta_start}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={onSignIn}
                style={{
                  padding: "8px 14px",
                  whiteSpace: "nowrap",
                }}
              >
                {copy.nav_signin}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        <ThemeModeToggle
          themeMode={themeMode}
          onModeChange={onThemeModeChange}
          fixed={false}
          compact
        />
      </div>
    </div>
  </motion.header>
);

// ═══════════════════════════════════════════════════════════════════════════════
// BUTTON COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const Button = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  style = {},
  ...props
}) => {
  const variants = {
    primary: {
      background: `linear-gradient(135deg, ${theme.colors.accent.primary} 0%, #0d9488 100%)`,
      color: "#FFF",
      border: "none",
      boxShadow: `0 4px 24px rgba(20, 184, 166, 0.4)`,
    },
    secondary: {
      background: "transparent",
      color: theme.colors.text.primary,
      border: `1px solid ${theme.colors.border.accent}`,
      boxShadow: "none",
    },
    ghost: {
      background: "transparent",
      color: theme.colors.text.secondary,
      border: "none",
      boxShadow: "none",
    },
  };

  const sizes = {
    sm: { padding: "10px 20px", fontSize: "0.875rem" },
    md: { padding: "14px 32px", fontSize: "1rem" },
    lg: { padding: "18px 40px", fontSize: "1.125rem" },
  };

  const baseStyle = {
    ...variants[variant],
    ...sizes[size],
    fontFamily: theme.fonts.body,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? "100%" : "auto",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.2s ease",
    position: "relative",
    overflow: "hidden",
    ...style,
    borderRadius: LANDING_BUTTON_RADIUS,
    cornerShape: LANDING_SQUIRCLE_SHAPE,
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={disabled || loading ? undefined : onClick}
      style={baseStyle}
      {...props}
    >
      {loading ? (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{ display: "inline-block" }}
        >
          ⟳
        </motion.span>
      ) : (
        children
      )}
    </motion.button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// INPUT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const Input = ({
  value,
  onChange,
  placeholder,
  type = "text",
  style = {},
  ...props
}) => (
  <motion.input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    whileFocus={{ scale: 1.01 }}
    style={{
      width: "100%",
      padding: "16px 20px",
      fontSize: "1rem",
      fontFamily: theme.fonts.body,
      background: theme.colors.bg.glass,
      border: `1px solid ${theme.colors.border.subtle}`,
      color: theme.colors.text.primary,
      outline: "none",
      transition: "all 0.2s ease",
      ...style,
      borderRadius: LANDING_BUTTON_RADIUS,
      cornerShape: LANDING_SQUIRCLE_SHAPE,
    }}
    onFocus={(e) => {
      e.target.style.borderColor = theme.colors.accent.primary;
      e.target.style.boxShadow = `0 0 0 3px rgba(20, 184, 166, 0.1)`;
    }}
    onBlur={(e) => {
      e.target.style.borderColor = theme.colors.border.subtle;
      e.target.style.boxShadow = "none";
    }}
    {...props}
  />
);

// ═══════════════════════════════════════════════════════════════════════════════
// SIGN IN VIEW
// ═══════════════════════════════════════════════════════════════════════════════

const SignInView = ({ copy, onBack, onSignIn, onExtension, hasExtension }) => {
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const playSound = useSoundSettings((s) => s.playSound);

  const resolveSignInError = useCallback(
    (err) => {
      const message = String(err?.message || err || "").toLowerCase();
      if (message.includes("extension")) {
        return copy.signin_error_extension || copy.signin_error_generic;
      }
      if (
        message.includes("invalid") ||
        message.includes("secret") ||
        message.includes("key") ||
        message.includes("nsec") ||
        message.includes("bech32")
      ) {
        return copy.signin_error_invalid_key || copy.signin_error_generic;
      }
      return copy.signin_error_generic || "Sign in failed. Please try again.";
    },
    [copy],
  );

  const handleSignIn = async () => {
    if (!secretKey.trim()) return;
    playSound(submitActionSound);
    setLoading(true);
    setError("");
    try {
      await onSignIn(secretKey);
    } catch (e) {
      setError(resolveSignInError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        position: "relative",
        zIndex: 10,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: "440px",
          width: "100%",
          padding: "48px",
          background: theme.colors.bg.elevated,
          backdropFilter: "blur(40px)",
          borderRadius: "32px",
          cornerShape: LANDING_SQUIRCLE_SHAPE,
          border: `1px solid ${theme.colors.border.subtle}`,
        }}
      >
        <h1
          style={{
            fontFamily: theme.fonts.display,
            fontSize: "2rem",
            fontWeight: 600,
            textAlign: "center",
            marginBottom: "12px",
          }}
        >
          {copy.signin_title}
        </h1>

        <p
          style={{
            fontFamily: theme.fonts.body,
            fontSize: "1rem",
            color: theme.colors.text.secondary,
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          {copy.signin_subtitle}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder={copy.signin_placeholder}
            type="password"
          />

          {error && (
            <p
              style={{
                color: "#f87171",
                fontSize: "0.875rem",
                textAlign: "center",
              }}
            >
              {error}
            </p>
          )}

          <Button onClick={handleSignIn} loading={loading} fullWidth>
            {copy.signin_button} →
          </Button>

          {hasExtension && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  margin: "8px 0",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    background: theme.colors.border.subtle,
                  }}
                />
                <span
                  style={{
                    color: theme.colors.text.muted,
                    fontSize: "0.875rem",
                  }}
                >
                  {copy.signin_or}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    background: theme.colors.border.subtle,
                  }}
                />
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  playSound(selectSound);
                  onExtension();
                }}
                fullWidth
              >
                {copy.signin_extension}
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            onClick={() => {
              playSound(selectSound);
              onBack();
            }}
            fullWidth
            style={{ marginTop: "8px" }}
          >
            ← {copy.back_button}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN LANDING PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const LandingPage = ({ onAuthenticated }) => {
  const { generateNostrKeys, auth, authWithExtension, isNip07Available, identityRuntime } =
    usePublicIdentity();
  const playSound = useSoundSettings((s) => s.playSound);
  const warmupAudio = useSoundSettings((s) => s.warmupAudio);
  const themeMode = useThemeStore((s) => s.themeMode);
  const syncThemeMode = useThemeStore((s) => s.syncThemeMode);

  // Warm up the audio context on the first interaction so the very first sound
  // (e.g. the sign-in/create button) plays cleanly instead of glitching with a
  // hum while a cold AudioContext unlocks. Mirrors the main app's warmup, which
  // never ran here because LandingPage renders before <App /> mounts.
  useEffect(() => {
    const handleFirstInteraction = () => {
      // Tone.start() synchronously inside the gesture (required on iOS/mobile).
      Tone.start();
      warmupAudio();
      document.removeEventListener("pointerdown", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
    };
    document.addEventListener("pointerdown", handleFirstInteraction, {
      once: true,
    });
    document.addEventListener("keydown", handleFirstInteraction, {
      once: true,
    });
    return () => {
      document.removeEventListener("pointerdown", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [warmupAudio]);

  const [lang, commitLang] = useState(() => {
    // Respect a language already chosen elsewhere (e.g. on /links or a previous
    // visit) before falling back to detection. Overwriting it here clobbered
    // that choice, so onboarding defaulted back to English.
    const detected = detectUserLanguage();
    // Persist the detected language so App.jsx / onboarding pick it up.
    if (typeof window !== "undefined") {
      localStorage.setItem("appLanguage", detected);
    }
    return detected;
  });
  const [view, setView] = useState("landing");
  const [displayName, setDisplayName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [hasExtension, setHasExtension] = useState(false);
  const [showHeaderActions, setShowHeaderActions] = useState(false);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const heroSectionRef = useRef(null);

  const { copy, refresh } = readPublicPageCopy("landing", lang);
  const languageRequest = useRef(0);
  const [languageError, setLanguageError] = useState("");
  const setLang = async (nextLanguage) => {
    const request = ++languageRequest.current;
    setLanguageError("");
    try {
      await loadPublicPageCopy("landing", nextLanguage);
      if (request === languageRequest.current) commitLang(nextLanguage);
    } catch {
      if (request === languageRequest.current) setLanguageError("Couldn’t load that language. Please try again.");
    }
  };
  useEffect(() => () => { languageRequest.current += 1; }, []);
  const hasSecretKeyInDisplayName = isNsecSecretKeyLike(displayName);

  useEffect(() => {
    setHasExtension(isNip07Available());
    const timer = setTimeout(() => setHasExtension(isNip07Available()), 500);
    return () => clearTimeout(timer);
  }, [isNip07Available]);

  // Update localStorage when language changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("appLanguage", lang);
    }
  }, [lang]);

  useEffect(() => {
    syncDocumentLanguage(lang);
  }, [lang]);

  useEffect(() => {
    if (view !== "landing") {
      setShowHeaderActions(false);
      setIsHeaderScrolled(false);
      return;
    }

    let frame = 0;
    const updateVisibility = () => {
      frame = 0;
      setIsHeaderScrolled(window.scrollY > 0);
      const hero = heroSectionRef.current;
      if (!hero) {
        setShowHeaderActions(false);
        return;
      }
      const threshold = hero.offsetTop + hero.offsetHeight - 96;
      setShowHeaderActions(window.scrollY >= threshold);
    };
    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateVisibility);
    };

    updateVisibility();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [view]);

  const handleCreate = useCallback(async () => {
    if (
      displayName.trim().length < 2 ||
      isNsecSecretKeyLike(displayName) ||
      isCreating
    )
      return;
    playSound(submitActionSound);
    setIsCreating(true);
    try {
      const did = await generateNostrKeys(displayName.trim());
      localStorage.setItem("displayName", displayName.trim());
      try {
        const npub = did?.npub || localStorage.getItem("local_npub") || "";
        if (npub) sessionStorage.setItem("new_registration_npub", npub);
      } catch {}
      onAuthenticated?.();
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  }, [displayName, isCreating, generateNostrKeys, onAuthenticated, playSound]);

  const handleInstantCreate = useCallback(async () => {
    if (isCreating) return;
    playSound(submitActionSound);
    setIsCreating(true);
    try {
      const did = await generateNostrKeys("");
      localStorage.setItem("displayName", "");
      try {
        const npub = did?.npub || localStorage.getItem("local_npub") || "";
        if (npub) sessionStorage.setItem("new_registration_npub", npub);
      } catch {}
      onAuthenticated?.();
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, generateNostrKeys, onAuthenticated, playSound]);

  const openSignInView = useCallback(() => {
    playSound(selectSound);
    setView("signIn");
  }, [playSound]);

  const handleSignIn = useCallback(
    async (key) => {
      const result = await auth(key);
      if (!result) throw new Error("Invalid key");
      rememberSecretKeySignIn(
        result?.user?.npub || localStorage.getItem("local_npub"),
      );
      onAuthenticated?.();
    },
    [auth, onAuthenticated],
  );

  const handleExtension = useCallback(async () => {
    const result = await authWithExtension();
    if (!result) throw new Error("Extension sign-in failed");
    onAuthenticated?.();
  }, [authWithExtension, onAuthenticated]);

  const features = [
    {
      icon: <LuBookAudio />,
      title: copy.feature_tutor,
      desc: copy.feature_tutor_desc,
    },
    {
      icon: <FaBookmark />,
      title: copy.feature_memory,
      desc: copy.feature_memory_desc,
    },
    {
      icon: <FaChartLine />,
      title: copy.feature_score || copy.feature_elo,
      desc: copy.feature_score_desc || copy.feature_elo_desc,
    },
    {
      icon: <FaCalendarCheck />,
      title: copy.feature_daily_quests,
      desc: copy.feature_daily_quests_desc,
    },
    {
      icon: <FaPaw />,
      title: copy.feature_companion,
      desc: copy.feature_companion_desc,
    },
    {
      icon: <FaComments />,
      title: copy.feature_conversations,
      desc: copy.feature_conversations_desc,
    },
    {
      icon: <FaVolumeUp />,
      title: copy.feature_phonics,
      desc: copy.feature_phonics_desc,
    },
    {
      icon: <MdSupportAgent />,
      title: copy.feature_assistant,
      desc: copy.feature_assistant_desc,
    },
    {
      icon: <FaCompass />,
      title: copy.feature_immersion,
      desc: copy.feature_immersion_desc,
    },
    {
      icon: <FaRoute />,
      title: copy.feature_journey,
      desc: copy.feature_journey_desc,
    },
    {
      icon: <FaTrophy />,
      title: copy.feature_achievements,
      desc: copy.feature_achievements_desc,
    },
    {
      icon: <FaUsers />,
      title: copy.feature_teams,
      desc: copy.feature_teams_desc,
    },
    {
      icon: <FaGlobeAmericas />,
      title: copy.feature_global_feed,
      desc: copy.feature_global_feed_desc,
    },
    {
      icon: <FaMicrophone />,
      title: copy.feature_proficiency_test,
      desc: copy.feature_proficiency_test_desc,
    },
    {
      icon: <FaBookOpen />,
      title: copy.feature_stories,
      desc: copy.feature_stories_desc,
    },
    {
      icon: <FaBook />,
      title: copy.feature_reading,
      desc: copy.feature_reading_desc,
    },
    {
      icon: <FaFlask />,
      title: copy.feature_grammar,
      desc: copy.feature_grammar_desc,
    },
    {
      icon: <FaPencilAlt />,
      title: copy.feature_flashcards,
      desc: copy.feature_flashcards_desc,
    },
    {
      icon: <FaLayerGroup />,
      title: copy.feature_flashcards_spaced,
      desc: copy.feature_flashcards_spaced_desc,
    },
    {
      icon: <FaStickyNote />,
      title: copy.feature_notes,
      desc: copy.feature_notes_desc,
    },
    {
      icon: <FaMap />,
      title: copy.feature_skilltree,
      desc: copy.feature_skilltree_desc,
    },
    {
      icon: <FaBullseye />,
      title: copy.feature_goals,
      desc: copy.feature_goals_desc,
    },
    {
      icon: <FaGamepad />,
      title: copy.feature_game_review,
      desc: copy.feature_game_review_desc,
    },
  ];

  const faqs = [
    { q: copy.faq_q1, a: copy.faq_a1 },
    { q: copy.faq_q2, a: copy.faq_a2 },
    { q: copy.faq_q3, a: copy.faq_a3 },
    { q: copy.faq_q4, a: copy.faq_a4 },
  ];

  const handleThemeModeChange = useCallback(
    (nextMode) => {
      if (nextMode === themeMode) return;
      playSound(selectSound);
      syncThemeMode(nextMode);
    },
    [playSound, syncThemeMode, themeMode],
  );

  if (view === "signIn") {
    return (
      <>
        {identityRuntime}
        <GlobalStyles />
        <AnimatedBackground />
        <ThemeModeToggle
          themeMode={themeMode}
          onModeChange={handleThemeModeChange}
        />
        <SignInView
          copy={copy}
          onBack={() => setView("landing")}
          onSignIn={handleSignIn}
          onExtension={handleExtension}
          hasExtension={hasExtension}
        />
      </>
    );
  }

  return (
    <>
      {identityRuntime}
      <GlobalStyles />
      <AnimatedBackground />

      <LandingHeader
        copy={copy}
        themeMode={themeMode}
        onThemeModeChange={handleThemeModeChange}
        onStartLearning={handleInstantCreate}
        onSignIn={openSignInView}
        isCreating={isCreating}
        showActions={showHeaderActions}
        isScrolled={isHeaderScrolled}
      />

      {/* Hero Section */}
      <section
        ref={heroSectionRef}
        style={{
          minHeight: "auto",
          display: "flex",
          // alignItems: "center",
          justifyContent: "center",
          position: "relative",
          marginTop: "10px",
          padding: "clamp(82px, 10vw, 104px) 24px 0px",
          overflow: "hidden",
        }}
      >
        <FloatingElements />

        <div
          style={{
            maxWidth: "800px",
            width: "100%",
            textAlign: "center",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              fontFamily: theme.fonts.display,
              fontSize: "clamp(2rem, 6vw, 3.5rem)",
              fontWeight: 600,
              lineHeight: 1.1,
              marginBottom: "24px",
            }}
          >
            {copy.hero_title}
            <br />
            <span
              style={{
                color: theme.colors.accent.primary,
              }}
            >
              {copy.hero_title_accent}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              fontFamily: theme.fonts.body,
              fontSize: "clamp(0.7rem, 1.2vw, 0.8rem)",
              color: theme.colors.text.secondary,
              maxWidth: "580px",
              margin: "0 auto 32px",
              lineHeight: 1.6,
            }}
          >
            {refresh.heroSubtitle}
          </motion.p>

          {/* CTA Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              maxWidth: "440px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={copy.placeholder_name}
            />
            {hasSecretKeyInDisplayName && (
              <p
                role="alert"
                style={{
                  color: "#f87171",
                  fontFamily: theme.fonts.body,
                  fontSize: "0.875rem",
                  lineHeight: 1.5,
                  margin: 0,
                  textAlign: "center",
                }}
              >
                {copy.create_secret_key_detected_prefix}
                <strong>{copy.create_secret_key_detected_action}</strong>
                {copy.create_secret_key_detected_suffix}
              </p>
            )}
            <Button
              onClick={handleCreate}
              loading={isCreating}
              disabled={
                displayName.trim().length < 2 || hasSecretKeyInDisplayName
              }
              fullWidth
              size="lg"
              variant="primary"
              color="white"
            >
              {copy.cta_start} →
            </Button>
            <Button variant="secondary" onClick={openSignInView} fullWidth>
              {copy.cta_signin}
            </Button>

            {/* Language Menu */}
            <LanguageMenu lang={lang} setLang={setLang} playSound={playSound} />
            {languageError && <p role="alert">{languageError}</p>}
          </motion.div>
        </div>
      </section>

      <LandingPageSections copy={copy} lang={lang} features={features} faqs={faqs}>
        <Input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={copy.placeholder_name}
        />
        {hasSecretKeyInDisplayName && (
          <p
            role="alert"
            style={{
              color: "#f87171",
              fontFamily: theme.fonts.body,
              fontSize: "0.875rem",
              lineHeight: 1.5,
              margin: 0,
              textAlign: "center",
            }}
          >
            {copy.create_secret_key_detected_prefix}
            <strong>{copy.create_secret_key_detected_action}</strong>
            {copy.create_secret_key_detected_suffix}
          </p>
        )}
        <Button
          onClick={handleCreate}
          loading={isCreating}
          disabled={
            displayName.trim().length < 2 || hasSecretKeyInDisplayName
          }
          fullWidth
          size="lg"
        >
          {copy.cta_start} →
        </Button>
        <Button variant="secondary" onClick={openSignInView} fullWidth>
          {copy.cta_signin}
        </Button>
      </LandingPageSections>
      <PrivacyPolicyFooter language={lang} isLightTheme={themeMode === "light"} includeLinks />
    </>
  );
};

export default LandingPage;
