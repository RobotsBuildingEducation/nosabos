import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  FaComments,
  FaBookOpen,
  FaBook,
  FaFlask,
  FaPencilAlt,
  FaLayerGroup,
  FaExchangeAlt,
  FaMicrophone,
  FaMap,
  FaBullseye,
} from "react-icons/fa";
import RobotBuddyPro from "./RobotBuddyPro";

// Minimal hook stubs for standalone demo - replace with your actual implementations
const useDecentralizedIdentity = () => ({
  generateNostrKeys: async () => ({}),
  auth: async () => true,
  authWithExtension: async () => true,
  isNip07Available: () => false,
});

const useToast = () => (config) => console.log("Toast:", config);

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

const theme = {
  colors: {
    bg: {
      deep: "#030712",
      elevated: "rgba(15, 23, 42, 0.8)",
      glass: "rgba(15, 23, 42, 0.4)",
      glow: "rgba(20, 184, 166, 0.08)",
    },
    text: {
      primary: "#f8fafc",
      secondary: "rgba(148, 163, 184, 1)",
      accent: "#2dd4bf",
      muted: "rgba(100, 116, 139, 1)",
    },
    accent: {
      primary: "#14b8a6",
      secondary: "#0ea5e9",
      tertiary: "#a78bfa",
      warm: "#f97316",
    },
    border: {
      subtle: "rgba(51, 65, 85, 0.5)",
      accent: "rgba(20, 184, 166, 0.3)",
    },
  },
  fonts: {
    display: "'Playfair Display', Georgia, serif",
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

const translations = {
  en: {
    nav_signin: "Sign In",
    hero_title: "Your Personal",
    hero_title_accent: "Language Tutor",
    hero_subtitle: "Use intelligent tools to practice and learn new languages.",
    cta_start: "Start Learning",
    cta_signin: "I Have a Key",
    features_label: "CAPABILITIES",
    features_title: "Everything You Need to",
    features_title_accent: "Become Fluent",
    feature_conversations: "Real-Time Conversations",
    feature_conversations_desc:
      "Immersive dialogues that adapt to your level, coaching you through speaking and listening in real-time.",
    feature_stories: "Interactive Stories",
    feature_stories_desc:
      "Engaging narratives that invite you to read aloud, summarize, and role-play in your target language.",
    feature_reading: "Reading Practice",
    feature_reading_desc:
      "Subject-focused lectures expanding your vocabulary and cultural knowledge through comprehension exercises.",
    feature_grammar: "Grammar Labs",
    feature_grammar_desc:
      "Quick rule references, concept drills, and adaptive review sets that strengthen your foundation.",
    feature_skilltree: "Skill Tree",
    feature_skilltree_desc:
      "Structured learning paths that build your abilities step by step with clear progress visualization.",
    feature_flashcards: "Vocabulary Drills",
    feature_flashcards_desc:
      "Master 1,000+ words and phrases with spaced repetition flashcards organized by CEFR level from beginner to advanced.",
    feature_goals: "Daily Goals",
    feature_goals_desc:
      "Personalized targets tracking your progress and celebrating streaks to keep you motivated.",
    feature_translation: "Translation Practice",
    feature_translation_desc:
      "Translate sentences between languages with AI-powered feedback that explains your mistakes and helps you improve.",
    feature_pronunciation: "Speech & Pronunciation",
    feature_pronunciation_desc:
      "Speak aloud and get real-time feedback on your pronunciation, accent, and fluency with voice recognition.",
    feature_flashcards_spaced: "Smart Flashcards",
    feature_flashcards_spaced_desc:
      "Review words and phrases with spaced repetition that adapts to what you know and what needs more practice.",

    value_label: "WHY NO SABOS",
    value_title: "Learning That",
    value_title_accent: "Actually Works",
    value_1:
      "AI that adapts in real-time—conversations, exercises, and feedback adjust to your exact level",
    value_2:
      "Six practice modes for every learning style: speaking, reading, writing, listening, grammar, and vocabulary",
    value_3:
      "Structured CEFR progression from A1 beginner to C2 mastery with 324 lessons and clear milestones",
    value_4:
      "Real-time pronunciation coaching that listens, corrects, and builds your confidence to speak",
    scholarship_label: "GIVE BACK",
    scholarship_title: "Create Scholarships",
    scholarship_title_accent: "with Bitcoin",
    scholarship_desc:
      "Top up your in-app Bitcoin wallet to help create scholarships through learning with",
    scholarship_link: "RobotsBuildingEducation.com",
    scholarship_note:
      "Choose a community identity in the app so every satoshi you spend supports real people.",
    faq_label: "QUESTIONS",
    faq_title: "Frequently Asked",
    faq_q1: "What happens when I create an account?",
    faq_a1:
      "We generate a secure key that unlocks your personal study space. Keep it safe—it's the only way to sign in from another device.",
    faq_q2: "Do I need to know anything about blockchains or Nostr?",
    faq_a2:
      "No. We take care of the technical details for you. All you need is your key to come back to your lessons.",
    faq_q3: "Which languages can I practice?",
    faq_a3:
      "Start with Spanish, English, Portuguese, French, or Italian right away, then explore Nahuatl-inspired cultural modules.",
    faq_q4: "Is there a cost?",
    faq_a4:
      "The core practice tools are free. Some advanced labs may require scholarships or paid access.",
    cta_final_title: "Ready to Begin Your",
    cta_final_accent: "Language Journey?",
    cta_final_subtitle:
      "Create your secure profile in seconds, save your key, and unlock a world of language learning.",
    placeholder_name: "Your display name",
    footer_brand: "No Sabos",
    footer_tagline: "Making language learning accessible to everyone.",
    signin_title: "Welcome Back",
    signin_subtitle:
      "Paste the secret key you saved when you created your account.",
    signin_placeholder: "Paste your secret key",
    signin_button: "Sign In",
    signin_extension: "Sign in with Extension",
    back_button: "Back",
    language_en: "English",
    language_es: "Español",
  },
  es: {
    nav_signin: "Iniciar Sesión",
    hero_title: "Tu",
    hero_title_accent: "Tutor Lingüístico Personal",
    hero_subtitle:
      "Usa herramientas inteligentes para practicar y aprender nuevos idiomas.",
    cta_start: "Comienza",
    cta_signin: "Tengo una Llave",
    features_label: "CAPACIDADES",
    features_title: "Todo lo que Necesitas para",
    features_title_accent: "Ser Fluido",
    feature_conversations: "Conversaciones en Tiempo Real",
    feature_conversations_desc:
      "Diálogos inmersivos que se adaptan a tu nivel, guiándote en habla y escucha en tiempo real.",
    feature_stories: "Historias Interactivas",
    feature_stories_desc:
      "Narrativas envolventes que te invitan a leer en voz alta, resumir y actuar en tu idioma objetivo.",
    feature_reading: "Práctica de Lectura",
    feature_reading_desc:
      "Lecturas enfocadas que amplían tu vocabulario y conocimiento cultural.",
    feature_grammar: "Laboratorios de Gramática",
    feature_grammar_desc:
      "Referencias rápidas, ejercicios conceptuales y sets de repaso adaptativos.",
    feature_skilltree: "Árbol de Habilidades",
    feature_skilltree_desc:
      "Rutas de aprendizaje estructuradas que construyen tus habilidades paso a paso.",
    feature_flashcards: "Ejercicios de Vocabulario",
    feature_flashcards_desc:
      "Domina más de 1,000 palabras y frases con tarjetas de repetición espaciada organizadas por nivel CEFR.",
    feature_goals: "Metas Diarias",
    feature_goals_desc:
      "Objetivos personalizados que rastrean tu progreso y celebran tus rachas.",
    feature_translation: "Práctica de Traducción",
    feature_translation_desc:
      "Traduce oraciones entre idiomas con retroalimentación de IA que explica tus errores y te ayuda a mejorar.",
    feature_pronunciation: "Habla y Pronunciación",
    feature_pronunciation_desc:
      "Habla en voz alta y recibe retroalimentación en tiempo real sobre tu pronunciación, acento y fluidez.",
    feature_flashcards_spaced: "Tarjetas Inteligentes",
    feature_flashcards_spaced_desc:
      "Repasa palabras y frases con repetición espaciada que se adapta a lo que sabes y lo que necesita más práctica.",
    value_label: "POR QUÉ NO SABOS",
    value_title: "Aprendizaje que",
    value_title_accent: "Realmente Funciona",
    value_1:
      "IA que se adapta en tiempo real—conversaciones, ejercicios y retroalimentación ajustados a tu nivel exacto",
    value_2:
      "Seis modos de práctica para cada estilo de aprendizaje: hablar, leer, escribir, escuchar, gramática y vocabulario",
    value_3:
      "Progresión CEFR estructurada de A1 principiante a C2 maestría con 324 lecciones y hitos claros",
    value_4:
      "Entrenamiento de pronunciación en tiempo real que escucha, corrige y construye tu confianza para hablar",
    scholarship_label: "CONTRIBUYE",
    scholarship_title: "Crea Becas",
    scholarship_title_accent: "con Bitcoin",
    scholarship_desc:
      "Recarga tu billetera de Bitcoin en la app para ayudar a crear becas a través del aprendizaje con",
    scholarship_link: "RobotsBuildingEducation.com",
    scholarship_note:
      "Elige una identidad comunitaria para que cada satoshi que gastes apoye a personas reales.",
    faq_label: "PREGUNTAS",
    faq_title: "Preguntas Frecuentes",
    faq_q1: "¿Qué pasa cuando creo una cuenta?",
    faq_a1:
      "Generamos una llave segura que desbloquea tu espacio de estudio personal. Guárdala bien—es la única forma de iniciar sesión desde otro dispositivo.",
    faq_q2: "¿Necesito saber algo sobre blockchains o Nostr?",
    faq_a2:
      "No. Nos encargamos de los detalles técnicos. Solo necesitas tu llave para volver a tus lecciones.",
    faq_q3: "¿Qué idiomas puedo practicar?",
    faq_a3:
      "Comienza con español, inglés, portugués, francés o italiano, luego explora módulos culturales inspirados en náhuatl.",
    faq_q4: "¿Tiene costo?",
    faq_a4:
      "Las herramientas principales son gratuitas. Algunos laboratorios avanzados pueden requerir becas o acceso de pago.",
    cta_final_title: "¿Listo para Comenzar tu",
    cta_final_accent: "Viaje Lingüístico?",
    cta_final_subtitle:
      "Crea tu perfil seguro en segundos, guarda tu llave y desbloquea un mundo de aprendizaje.",
    placeholder_name: "Tu nombre para mostrar",
    footer_brand: "No Sabos",
    footer_tagline: "Haciendo el aprendizaje de idiomas accesible para todos.",
    signin_title: "Bienvenido de Nuevo",
    signin_subtitle:
      "Pega la llave secreta que guardaste cuando creaste tu cuenta.",
    signin_placeholder: "Pega tu llave secreta",
    signin_button: "Iniciar Sesión",
    signin_extension: "Iniciar con Extensión",
    back_button: "Regresar",
    language_en: "English",
    language_es: "Español",
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    
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
// ANIMATED BACKGROUND
// ═══════════════════════════════════════════════════════════════════════════════

const AnimatedBackground = () => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 0,
      overflow: "hidden",
      pointerEvents: "none",
    }}
  >
    {/* Base gradient */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `
          radial-gradient(ellipse 80% 50% at 50% -20%, rgba(20, 184, 166, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse 60% 40% at 80% 100%, rgba(14, 165, 233, 0.1) 0%, transparent 40%),
          radial-gradient(ellipse 50% 30% at 10% 80%, rgba(167, 139, 250, 0.08) 0%, transparent 40%),
          linear-gradient(to bottom, #030712 0%, #0f172a 50%, #030712 100%)
        `,
      }}
    />

    {/* Animated orbs */}
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      style={{
        position: "absolute",
        top: "10%",
        left: "5%",
        width: "500px",
        height: "500px",
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(20, 184, 166, 0.2) 0%, transparent 70%)`,
        filter: "blur(60px)",
      }}
    />
    <motion.div
      animate={{
        scale: [1.2, 1, 1.2],
        opacity: [0.2, 0.4, 0.2],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 2,
      }}
      style={{
        position: "absolute",
        bottom: "20%",
        right: "10%",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)`,
        filter: "blur(50px)",
      }}
    />

    {/* Grid overlay */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(20, 184, 166, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(20, 184, 166, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        maskImage:
          "radial-gradient(ellipse 80% 50% at 50% 50%, black, transparent)",
      }}
    />

    {/* Noise texture */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: 0.02,
        background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }}
    />
  </div>
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
    { text: "Pialli", x: "70%", y: "80%", delay: 2.5 },
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
            opacity: [0.1, 0.25, 0.1],
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
            opacity: 0.15,
            textShadow: `0 0 40px ${theme.colors.accent.primary}`,
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
      No Sabos
    </span>
  </motion.div>
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
    borderRadius: "12px",
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
      {variant === "primary" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
            animation: "shimmer 2.5s infinite",
          }}
        />
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
      background: "rgba(15, 23, 42, 0.6)",
      border: `1px solid ${theme.colors.border.subtle}`,
      borderRadius: "12px",
      color: theme.colors.text.primary,
      outline: "none",
      transition: "all 0.2s ease",
      ...style,
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
// SECTION LABEL
// ═══════════════════════════════════════════════════════════════════════════════

const SectionLabel = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "16px",
    }}
  >
    <span
      style={{
        width: "40px",
        height: "1px",
        background: `linear-gradient(90deg, transparent, ${theme.colors.accent.primary})`,
      }}
    />
    <span
      style={{
        fontFamily: theme.fonts.mono,
        fontSize: "0.75rem",
        fontWeight: 500,
        letterSpacing: "0.15em",
        color: theme.colors.accent.primary,
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
    <span
      style={{
        width: "40px",
        height: "1px",
        background: `linear-gradient(90deg, ${theme.colors.accent.primary}, transparent)`,
      }}
    />
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE CARD
// ═══════════════════════════════════════════════════════════════════════════════

const FeatureCard = ({ icon, title, description, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.6, delay: index * 0.1 }}
    whileHover={{ y: -8, scale: 1.02 }}
    style={{
      padding: "32px",
      background: theme.colors.bg.elevated,
      backdropFilter: "blur(20px)",
      borderRadius: "24px",
      border: `1px solid ${theme.colors.border.subtle}`,
      position: "relative",
      overflow: "hidden",
    }}
  >
    {/* Gradient accent */}
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        background: `linear-gradient(90deg, ${theme.colors.accent.primary}, ${theme.colors.accent.secondary})`,
        opacity: 0.8,
      }}
    />

    {/* Icon */}
    <div
      style={{
        width: "56px",
        height: "56px",
        borderRadius: "16px",
        background: theme.colors.bg.glow,
        border: `1px solid ${theme.colors.border.accent}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "20px",
        fontSize: "24px",
      }}
    >
      {icon}
    </div>

    <h3
      style={{
        fontFamily: theme.fonts.display,
        fontSize: "1.25rem",
        fontWeight: 600,
        color: theme.colors.text.primary,
        marginBottom: "12px",
      }}
    >
      {title}
    </h3>

    <p
      style={{
        fontFamily: theme.fonts.body,
        fontSize: "0.95rem",
        color: theme.colors.text.secondary,
        lineHeight: 1.7,
      }}
    >
      {description}
    </p>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ ITEM
// ═══════════════════════════════════════════════════════════════════════════════

const FAQItem = ({ question, answer, isOpen, onClick, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1 }}
    style={{
      borderBottom: `1px solid ${theme.colors.border.subtle}`,
      overflow: "hidden",
    }}
  >
    <motion.button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "24px 0",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        textAlign: "left",
      }}
    >
      <span
        style={{
          fontFamily: theme.fonts.display,
          fontSize: "1.125rem",
          fontWeight: 500,
          color: theme.colors.text.primary,
        }}
      >
        {question}
      </span>
      <motion.span
        animate={{ rotate: isOpen ? 45 : 0 }}
        style={{
          fontSize: "1.5rem",
          color: theme.colors.accent.primary,
          fontWeight: 300,
        }}
      >
        +
      </motion.span>
    </motion.button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p
            style={{
              paddingBottom: "24px",
              fontFamily: theme.fonts.body,
              fontSize: "1rem",
              color: theme.colors.text.secondary,
              lineHeight: 1.7,
            }}
          >
            {answer}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// SIGN IN VIEW
// ═══════════════════════════════════════════════════════════════════════════════

const SignInView = ({ copy, onBack, onSignIn, onExtension, hasExtension }) => {
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    if (!secretKey.trim()) return;
    setLoading(true);
    setError("");
    try {
      await onSignIn(secretKey);
    } catch (e) {
      setError(e.message || "Sign in failed");
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
          border: `1px solid ${theme.colors.border.subtle}`,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Logo size={56} />
        </div>

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
                  or
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    background: theme.colors.border.subtle,
                  }}
                />
              </div>
              <Button variant="secondary" onClick={onExtension} fullWidth>
                {copy.signin_extension}
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            onClick={onBack}
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
  const toast = useToast();
  const { generateNostrKeys, auth, authWithExtension, isNip07Available } =
    useDecentralizedIdentity();

  const [lang, setLang] = useState("en");
  const [view, setView] = useState("landing");
  const [displayName, setDisplayName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(null);
  const [hasExtension, setHasExtension] = useState(false);

  const copy = translations[lang];

  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  useEffect(() => {
    setHasExtension(isNip07Available());
    const timer = setTimeout(() => setHasExtension(isNip07Available()), 500);
    return () => clearTimeout(timer);
  }, [isNip07Available]);

  const handleCreate = useCallback(async () => {
    if (displayName.trim().length < 2 || isCreating) return;
    setIsCreating(true);
    try {
      await generateNostrKeys(displayName.trim());
      localStorage.setItem("displayName", displayName.trim());
      onAuthenticated?.();
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  }, [displayName, isCreating, generateNostrKeys, onAuthenticated]);

  const handleSignIn = useCallback(
    async (key) => {
      const result = await auth(key);
      if (!result) throw new Error("Invalid key");
      onAuthenticated?.();
    },
    [auth, onAuthenticated]
  );

  const handleExtension = useCallback(async () => {
    const result = await authWithExtension();
    if (!result) throw new Error("Extension sign-in failed");
    onAuthenticated?.();
  }, [authWithExtension, onAuthenticated]);

  const features = [
    {
      icon: <FaComments />,
      title: copy.feature_conversations,
      desc: copy.feature_conversations_desc,
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
      icon: <FaExchangeAlt />,
      title: copy.feature_translation,
      desc: copy.feature_translation_desc,
    },
    {
      icon: <FaMicrophone />,
      title: copy.feature_pronunciation,
      desc: copy.feature_pronunciation_desc,
    },
    {
      icon: <FaMap />,
      title: copy.feature_skilltree,
      desc: copy.feature_skilltree_desc,
    },
    { icon: <FaBullseye />, title: copy.feature_goals, desc: copy.feature_goals_desc },
  ];

  const faqs = [
    { q: copy.faq_q1, a: copy.faq_a1 },
    { q: copy.faq_q2, a: copy.faq_a2 },
    { q: copy.faq_q3, a: copy.faq_a3 },
    { q: copy.faq_q4, a: copy.faq_a4 },
  ];

  const values = [copy.value_1, copy.value_2, copy.value_3, copy.value_4];

  if (view === "signIn") {
    return (
      <>
        <GlobalStyles />
        <AnimatedBackground />
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
      <GlobalStyles />
      <AnimatedBackground />

      {/* Fixed Header */}
      <motion.header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "16px 24px",
          background: "rgba(3, 7, 18, 0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${theme.colors.border.subtle}`,
          opacity: headerOpacity,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Logo size={36} />
            <span
              style={{
                fontFamily: theme.fonts.display,
                fontSize: "1.25rem",
                fontWeight: 600,
              }}
            >
              No Sabos
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLang(lang === "en" ? "es" : "en")}
            >
              {lang === "en" ? "ES" : "EN"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setView("signIn")}
            >
              {copy.nav_signin}
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section
        style={{
          minHeight: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          padding: "100px 24px 60px",
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
          {/* Robot Buddy Pro */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{ marginBottom: "16px" }}
          >
            <RobotBuddyPro
              state="idle"
              mood="happy"
              palette="ocean"
              variant="abstract"
              showBadges={false}
              compact={true}
              maxW={140}
            />
          </motion.div>

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
                background: `linear-gradient(135deg, ${theme.colors.accent.primary} 0%, ${theme.colors.accent.secondary} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
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
              fontSize: "clamp(0.95rem, 2vw, 1.1rem)",
              color: theme.colors.text.secondary,
              maxWidth: "580px",
              margin: "0 auto 32px",
              lineHeight: 1.6,
            }}
          >
            {copy.hero_subtitle}
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
            <Button
              onClick={handleCreate}
              loading={isCreating}
              disabled={displayName.trim().length < 2}
              fullWidth
              size="lg"
              variant="primary"
              color="white"
            >
              {copy.cta_start} →
            </Button>
            <Button
              variant="secondary"
              onClick={() => setView("signIn")}
              fullWidth
            >
              {copy.cta_signin}
            </Button>

            {/* Language Toggle */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "8px",
                marginTop: "8px",
              }}
            >
              <Button
                variant={lang === "en" ? "primary" : "ghost"}
                size="sm"
                onClick={() => setLang("en")}
              >
                {copy.language_en}
              </Button>
              <Button
                variant={lang === "es" ? "primary" : "ghost"}
                size="sm"
                onClick={() => setLang("es")}
              >
                {copy.language_es}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section
        style={{
          padding: `${theme.spacing.section} 24px`,
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <SectionLabel>{copy.features_label}</SectionLabel>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                fontFamily: theme.fonts.display,
                fontSize: "clamp(2rem, 5vw, 3rem)",
                fontWeight: 600,
                lineHeight: 1.2,
              }}
            >
              {copy.features_title}
              <br />
              <span style={{ color: theme.colors.accent.primary }}>
                {copy.features_title_accent}
              </span>
            </motion.h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
            }}
          >
            {features.map((f, i) => (
              <FeatureCard
                key={i}
                icon={f.icon}
                title={f.title}
                description={f.desc}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Value Props Section */}
      <section
        style={{
          padding: `${theme.spacing.section} 24px`,
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <SectionLabel>{copy.value_label}</SectionLabel>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                fontFamily: theme.fonts.display,
                fontSize: "clamp(2rem, 5vw, 3rem)",
                fontWeight: 600,
                lineHeight: 1.2,
              }}
            >
              {copy.value_title}
              <br />
              <span style={{ color: theme.colors.accent.primary }}>
                {copy.value_title_accent}
              </span>
            </motion.h2>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {values.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  padding: "24px 32px",
                  background: theme.colors.bg.elevated,
                  backdropFilter: "blur(20px)",
                  borderRadius: "16px",
                  border: `1px solid ${theme.colors.border.subtle}`,
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: `linear-gradient(135deg, ${theme.colors.accent.primary} 0%, ${theme.colors.accent.secondary} 100%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: "#030712",
                    fontWeight: 700,
                    fontSize: "1.25rem",
                  }}
                >
                  {i + 1}
                </div>
                <p
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: "1.1rem",
                    color: theme.colors.text.primary,
                    lineHeight: 1.5,
                  }}
                >
                  {v}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Scholarship Section */}
      <section
        style={{
          padding: `${theme.spacing.section} 24px`,
          position: "relative",
          zIndex: 10,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "64px",
            background: `linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%)`,
            borderRadius: "32px",
            border: `1px solid rgba(249, 115, 22, 0.2)`,
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Bitcoin decoration */}
          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "40px",
              fontSize: "80px",
              opacity: 0.1,
            }}
          >
            ₿
          </div>

          <SectionLabel>{copy.scholarship_label}</SectionLabel>

          <h2
            style={{
              fontFamily: theme.fonts.display,
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 600,
              lineHeight: 1.2,
              marginBottom: "24px",
            }}
          >
            {copy.scholarship_title}{" "}
            <span style={{ color: "#f97316" }}>
              {copy.scholarship_title_accent}
            </span>
          </h2>

          <p
            style={{
              fontFamily: theme.fonts.body,
              fontSize: "1.125rem",
              color: theme.colors.text.secondary,
              maxWidth: "600px",
              margin: "0 auto 16px",
              lineHeight: 1.7,
            }}
          >
            {copy.scholarship_desc}{" "}
            <a
              href="https://robotsbuildingeducation.com/learning"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: theme.colors.accent.primary,
                textDecoration: "underline",
              }}
            >
              {copy.scholarship_link}
            </a>
          </p>

          <p
            style={{
              fontFamily: theme.fonts.body,
              fontSize: "1rem",
              color: theme.colors.text.muted,
              fontStyle: "italic",
            }}
          >
            {copy.scholarship_note}
          </p>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section
        style={{
          padding: `${theme.spacing.section} 24px`,
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <SectionLabel>{copy.faq_label}</SectionLabel>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                fontFamily: theme.fonts.display,
                fontSize: "clamp(2rem, 5vw, 3rem)",
                fontWeight: 600,
              }}
            >
              {copy.faq_title}
            </motion.h2>
          </div>

          <div>
            {faqs.map((faq, i) => (
              <FAQItem
                key={i}
                question={faq.q}
                answer={faq.a}
                isOpen={openFAQ === i}
                onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        style={{
          padding: `${theme.spacing.section} 24px`,
          position: "relative",
          zIndex: 10,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            maxWidth: "700px",
            margin: "0 auto",
            textAlign: "center",
            padding: "80px 48px",
            background: theme.colors.bg.elevated,
            backdropFilter: "blur(40px)",
            borderRadius: "32px",
            border: `1px solid ${theme.colors.border.subtle}`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Glow effect */}
          <div
            style={{
              position: "absolute",
              top: "-50%",
              left: "-50%",
              width: "200%",
              height: "200%",
              background: `radial-gradient(circle at center, rgba(20, 184, 166, 0.1) 0%, transparent 50%)`,
              pointerEvents: "none",
            }}
          />

          <h2
            style={{
              fontFamily: theme.fonts.display,
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 600,
              lineHeight: 1.2,
              marginBottom: "16px",
              position: "relative",
            }}
          >
            {copy.cta_final_title}
            <br />
            <span style={{ color: theme.colors.accent.primary }}>
              {copy.cta_final_accent}
            </span>
          </h2>

          <p
            style={{
              fontFamily: theme.fonts.body,
              fontSize: "1.125rem",
              color: theme.colors.text.secondary,
              marginBottom: "40px",
              position: "relative",
            }}
          >
            {copy.cta_final_subtitle}
          </p>

          <div
            style={{
              maxWidth: "400px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              position: "relative",
            }}
          >
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={copy.placeholder_name}
            />
            <Button
              onClick={handleCreate}
              loading={isCreating}
              disabled={displayName.trim().length < 2}
              fullWidth
              size="lg"
            >
              {copy.cta_start} →
            </Button>
            <Button
              variant="secondary"
              onClick={() => setView("signIn")}
              fullWidth
            >
              {copy.cta_signin}
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "48px 24px",
          borderTop: `1px solid ${theme.colors.border.subtle}`,
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Logo size={32} />
            <span
              style={{
                fontFamily: theme.fonts.display,
                fontSize: "1.25rem",
                fontWeight: 600,
              }}
            >
              {copy.footer_brand}
            </span>
          </div>
          <p
            style={{
              fontFamily: theme.fonts.body,
              fontSize: "0.875rem",
              color: theme.colors.text.muted,
            }}
          >
            {copy.footer_tagline}
          </p>
        </div>
      </footer>
    </>
  );
};

export default LandingPage;
