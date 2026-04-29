import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { HiOutlineDocumentCheck } from "react-icons/hi2";

import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Progress,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Stack,
  Textarea,
  Text,
  useToast,
} from "@chakra-ui/react";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  Copy,
  Download,
  ExternalLink,
  FileBadge2,
  Gavel,
  Home,
  MapPin,
  MessageCircle,
  Moon,
  RotateCcw,
  Route,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  UsersRound,
} from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useDecentralizedIdentity } from "../hooks/useDecentralizedIdentity";
import useLanguage from "../hooks/useLanguage";
import {
  getLanguageDirection,
  LANGUAGE_PROMPT_LABELS,
  getSupportLanguageOptions,
  normalizeSupportLanguage,
} from "../constants/languages";
import { linksPageTranslations } from "../translations/linksPage";
import {
  citizenshipAssistantModel,
  database,
} from "../firebaseResources/firebaseResources";
import useSoundSettings from "../hooks/useSoundSettings";
import selectSound from "../assets/select.mp3";
import submitActionSound from "../assets/submitaction.mp3";
import { useThemeStore } from "../useThemeStore";
import { SiMonkeytie } from "react-icons/si";

const APP_SURFACE = "var(--app-surface)";
const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_BORDER_STRONG = "var(--app-border-strong)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_MUTED = "var(--app-text-muted)";
const APP_SHADOW = "var(--app-shadow-soft)";
const CITIZENSHIP_TEAL_BUTTON_PROPS = {
  bg: "#0f766e",
  color: "white",
  borderRadius: "8px",
  boxShadow: "0px 4px 0px #0b5f58",
  transform: "translateY(0)",
  _hover: {
    bg: "#0d6b63",
    boxShadow: "0px 4px 0px #0a4f49",
    transform: "translateY(0)",
  },
  _active: {
    bg: "#0b5f58",
    boxShadow: "none",
    transform: "translateY(4px)",
  },
  _disabled: {
    bg: "#0f766e",
    boxShadow: "none",
    opacity: 0.58,
    cursor: "not-allowed",
    transform: "none",
  },
};

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

const ROUTES = {
  R1: {
    code: "R1",
    title: "Already Mexican by birth",
    subtitle: "Document/passport path",
    color: "#0f766e",
    bg: "rgba(15, 118, 110, 0.12)",
    icon: BadgeCheck,
  },
  R2: {
    code: "R2",
    title: "Birth registration abroad",
    subtitle: "Dual nationality path",
    color: "#1d4ed8",
    bg: "rgba(29, 78, 216, 0.12)",
    icon: FileBadge2,
  },
  R3: {
    code: "R3",
    title: "Parent-chain first",
    subtitle: "Document the Mexican parent before applicant",
    color: "#7c3aed",
    bg: "rgba(124, 58, 237, 0.12)",
    icon: UsersRound,
  },
  R4: {
    code: "R4",
    title: "Declaratoria / recovery",
    subtitle: "Mexican by birth with pre-1998 foreign nationality issue",
    color: "#b45309",
    bg: "rgba(180, 83, 9, 0.14)",
    icon: ShieldCheck,
  },
  R5: {
    code: "R5",
    title: "Naturalization",
    subtitle: "Carta de Naturalizacion path through SRE",
    color: "#b91c1c",
    bg: "rgba(185, 28, 28, 0.1)",
    icon: Gavel,
  },
  R6: {
    code: "R6",
    title: "Not eligible yet",
    subtitle: "Build the missing residence, document, or timing prerequisite",
    color: "#475569",
    bg: "rgba(71, 85, 105, 0.12)",
    icon: CircleHelp,
  },
  R7: {
    code: "R7",
    title: "Manual review",
    subtitle: "Consulate, SRE, civil registry, or legal review needed",
    color: "#dc2626",
    bg: "rgba(220, 38, 38, 0.1)",
    icon: AlertTriangle,
  },
};

const OFFICIAL_LINKS = [
  {
    label: "SRE nationality and naturalization",
    href: "https://sre.gob.mx/tramites-y-servicios/nacionalidad-y-naturalizacion",
  },
  {
    label: "MiConsulado appointments",
    href: "https://citas.sre.gob.mx/",
  },
  {
    label: "U.S. dual nationality guidance",
    href: "https://travel.state.gov/en/international-travel/planning/personal-needs/dual-nationality.html",
  },
];

const CITIZENSHIP_ONBOARDED_STORAGE_KEY = "onboardedCitizenship";
const CITIZENSHIP_PROGRESS_STORAGE_KEY = "citizenshipProgress";
const CITIZENSHIP_PROGRESS_VERSION = 2;

const getStoredNpub = () => {
  if (typeof window === "undefined") return "";
  return (window.localStorage.getItem("local_npub") || "").trim();
};

const getStoredNsec = () => {
  if (typeof window === "undefined") return "";
  return (window.localStorage.getItem("local_nsec") || "").trim();
};

const normalizeCitizenshipAnswers = (rawAnswers = {}) => {
  const normalized = {};

  Object.entries(DEFAULT_ANSWERS).forEach(([key, defaultValue]) => {
    const value = rawAnswers?.[key];
    if (Array.isArray(defaultValue)) {
      normalized[key] = Array.isArray(value)
        ? value.filter((item) => typeof item === "string")
        : defaultValue;
      return;
    }

    normalized[key] = typeof value === "string" ? value : defaultValue;
  });

  return normalized;
};

const normalizeChecklistProgress = (rawProgress = {}) => {
  if (
    !rawProgress ||
    typeof rawProgress !== "object" ||
    Array.isArray(rawProgress)
  ) {
    return {};
  }

  return Object.entries(rawProgress).reduce((normalized, [key, value]) => {
    if (typeof key === "string" && key.trim() && value === true) {
      normalized[key] = true;
    }
    return normalized;
  }, {});
};

const CITIZENSHIP_ASSISTANT_MAX_MESSAGES = 50;

const createEmptyAssistantChat = () => ({
  messages: [],
  saved: false,
  updatedAt: "",
});

const normalizeAssistantChat = (rawChat) => {
  if (!rawChat || typeof rawChat !== "object" || Array.isArray(rawChat)) {
    return createEmptyAssistantChat();
  }

  const messages = Array.isArray(rawChat.messages)
    ? rawChat.messages
        .map((message, index) => {
          const role = message?.role === "user" ? "user" : "assistant";
          const text =
            typeof message?.text === "string"
              ? message.text
              : String(message?.text || "");

          if (!text.trim() && message?.done !== false) return null;

          return {
            id:
              typeof message?.id === "string" && message.id.trim()
                ? message.id
                : `citizenship-chat-${index}`,
            role,
            text,
            done: message?.done !== false,
            createdAt:
              typeof message?.createdAt === "string"
                ? message.createdAt
                : new Date(0).toISOString(),
          };
        })
        .filter(Boolean)
        .slice(-CITIZENSHIP_ASSISTANT_MAX_MESSAGES)
    : [];

  return {
    messages,
    saved: rawChat.saved === true && messages.length > 0,
    updatedAt: typeof rawChat.updatedAt === "string" ? rawChat.updatedAt : "",
  };
};

const normalizeSavedAssistantChat = (rawChat) => {
  const normalized = normalizeAssistantChat(rawChat);
  return normalized.saved ? normalized : createEmptyAssistantChat();
};

const normalizeCitizenshipProgress = (rawProgress) => {
  if (!rawProgress || typeof rawProgress !== "object") return null;

  const questionIndex = Number(rawProgress.questionIndex);
  return {
    version: CITIZENSHIP_PROGRESS_VERSION,
    answers: normalizeCitizenshipAnswers(rawProgress.answers),
    questionIndex: Number.isFinite(questionIndex)
      ? Math.max(0, Math.floor(questionIndex))
      : 0,
    showResults: rawProgress.showResults === true,
    checklistProgress: normalizeChecklistProgress(
      rawProgress.checklistProgress,
    ),
    assistantChat: normalizeSavedAssistantChat(rawProgress.assistantChat),
    updatedAt:
      typeof rawProgress.updatedAt === "string" ? rawProgress.updatedAt : "",
  };
};

const readLocalCitizenshipProgress = () => {
  if (typeof window === "undefined") return null;
  try {
    return normalizeCitizenshipProgress(
      JSON.parse(
        window.localStorage.getItem(CITIZENSHIP_PROGRESS_STORAGE_KEY) || "null",
      ),
    );
  } catch {
    return null;
  }
};

const writeLocalCitizenshipProgress = (progress) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    CITIZENSHIP_PROGRESS_STORAGE_KEY,
    JSON.stringify(progress),
  );
};

const buildCitizenshipProgress = ({
  answers,
  questionIndex,
  showResults,
  checklistProgress = {},
  assistantChat = createEmptyAssistantChat(),
}) => ({
  version: CITIZENSHIP_PROGRESS_VERSION,
  answers: normalizeCitizenshipAnswers(answers),
  questionIndex: Math.max(0, Math.floor(Number(questionIndex) || 0)),
  showResults: showResults === true,
  checklistProgress: normalizeChecklistProgress(checklistProgress),
  assistantChat: normalizeSavedAssistantChat(assistantChat),
  updatedAt: new Date().toISOString(),
});

const chooseMostRecentProgress = (remoteProgress, localProgress) => {
  if (!remoteProgress) return localProgress;
  if (!localProgress) return remoteProgress;

  const remoteTime = Date.parse(remoteProgress.updatedAt || "");
  const localTime = Date.parse(localProgress.updatedAt || "");
  if (!Number.isFinite(remoteTime)) return localProgress;
  if (!Number.isFinite(localTime)) return remoteProgress;
  return remoteTime >= localTime ? remoteProgress : localProgress;
};

const getInitialCitizenshipState = () => {
  const progress = readLocalCitizenshipProgress();
  const onboarded =
    typeof window !== "undefined" &&
    window.localStorage.getItem(CITIZENSHIP_ONBOARDED_STORAGE_KEY) === "true";

  return {
    answers: progress?.answers || DEFAULT_ANSWERS,
    questionIndex: progress?.questionIndex || 0,
    showResults: progress?.showResults === true,
    checklistProgress: progress?.checklistProgress || {},
    assistantChat: progress?.assistantChat || createEmptyAssistantChat(),
    showIntro: !onboarded && !progress,
    showBenefits: false,
    showPrimer: false,
  };
};

const persistCitizenshipProgress = async (
  progress,
  { markOnboarded = false } = {},
) => {
  writeLocalCitizenshipProgress(progress);

  const npub = getStoredNpub();
  if (!npub) return;

  await setDoc(
    doc(database, "users", npub),
    {
      ...(markOnboarded ? { onboardedCitizenship: true } : {}),
      citizenshipProgress: progress,
      updatedAt: progress.updatedAt,
    },
    { merge: true },
  );
};

const ES_TEXT = {
  "Already Mexican by birth": "Mexicano/a por nacimiento",
  "Document/passport path": "Ruta de documentos y pasaporte",
  "Birth registration abroad": "Registro de nacimiento en el extranjero",
  "Dual nationality path": "Ruta de doble nacionalidad",
  "Parent-chain first": "Primero documentar al padre o madre",
  "Document the Mexican parent before applicant":
    "Documentar primero al padre o madre mexicano/a",
  "Declaratoria / recovery": "Declaratoria / recuperación",
  "Mexican by birth with pre-1998 foreign nationality issue":
    "Mexicano/a por nacimiento con tema de nacionalidad extranjera anterior a 1998",
  Naturalization: "Naturalización",
  "Carta de Naturalizacion path through SRE":
    "Ruta de Carta de Naturalización ante SRE",
  "Not eligible yet": "Aún no elegible",
  "Build the missing residence, document, or timing prerequisite":
    "Completa el requisito faltante de residencia, documento o tiempo",
  "Manual review": "Revisión manual",
  "Consulate, SRE, civil registry, or legal review needed":
    "Requiere revisión de consulado, SRE, registro civil o asesoría legal",
  "SRE nationality and naturalization": "Nacionalidad y naturalización de SRE",
  "MiConsulado appointments": "Citas MiConsulado",
  "U.S. dual nationality guidance": "Guía de doble nacionalidad de EE. UU.",

  Identity: "Identidad",
  Documents: "Documentos",
  Applicant: "Solicitante",
  Location: "Ubicación",
  "Born in Mexico": "Nacido/a en México",
  "Mexican parent": "Padre o madre mexicano/a",
  "Family record": "Registro familiar",
  "One step at a time": "Un paso a la vez",
  Question: "Pregunta",
  of: "de",
  answered: "respondidas",
  Back: "Atrás",
  Next: "Siguiente",
  Done: "Listo",
  Skip: "Omitir",
  "Edit answers": "Editar respuestas",
  "Jump to question": "Ir a la pregunta",
  "Finish edits": "Terminar cambios",
  Theme: "Tema",
  "Switch to dark mode": "Cambiar a modo oscuro",
  "Switch to light mode": "Cambiar a modo claro",
  Reset: "Reiniciar",
  "Reset questions": "Reiniciar preguntas",
  "Test prefill": "Autollenar prueba",
  Completion: "Avance",
  complete: "completo",
  "Start questions": "Empezar preguntas",
  "Copy key": "Copiar clave",
  "Citizenship route finder": "Guía de ruta de ciudadanía",
  "Find the right Mexico citizenship path before you book appointments or collect documents.":
    "Encuentra la ruta correcta de ciudadanía mexicana antes de agendar citas o reunir documentos.",
  "This tool asks one question at a time and separates people who are already Mexican by birth from people who need naturalization.":
    "Esta herramienta hace una pregunta a la vez y separa a quienes ya son mexicanos por nacimiento de quienes necesitan naturalización.",
  "Before you start, save your secret key somewhere safe. It is how you access your account and return to your citizenship answers later. We cannot recover it for you.":
    "Antes de empezar, guarda tu clave secreta en un lugar seguro. Es la forma de acceder a tu cuenta y volver después a tus respuestas de ciudadanía. No podemos recuperarla por ti.",
  "Secret key copied": "Clave secreta copiada",
  "No secret key found": "No se encontró clave secreta",
  "Sign in or create an account before copying your secret key.":
    "Inicia sesión o crea una cuenta antes de copiar tu clave secreta.",
  "Unable to copy secret key.": "No se pudo copiar la clave secreta.",
  "Unable to save this intro. You can still continue.":
    "No se pudo guardar esta introducción. Aun así puedes continuar.",
  English: "English",
  Spanish: "Español",
  "Intake answered": "Preguntas respondidas",
  Why: "Por qué",
  "Naturalization modality": "Modalidad de naturalización",
  "Resolve first": "Resolver primero",
  Checklist: "Lista de tareas",
  "Document collection progress": "Avance de recolección de documentos",
  "Critical warnings": "Advertencias importantes",
  "Official references": "Referencias oficiales",
  "Download report": "Descargar reporte",
  "DIY official route": "Ruta oficial por tu cuenta",
  "Paid-help range": "Rango con ayuda pagada",
  Recommendation: "Recomendación",
  "paid help": "ayuda pagada",
  Meaning: "Significado",
  "User guidance": "Guía para el usuario",
  "Mexico citizenship route report": "Reporte de ruta de ciudadanía mexicana",
  Generated: "Generado",
  Outcome: "Resultado",
  Route: "Ruta",
  Status: "Estado",
  "Questionnaire answers": "Respuestas del cuestionario",
  "Not answered": "Sin responder",
  Checked: "Marcado",
  Pending: "Pendiente",
  "Likely base route": "Ruta base probable",
  "Find the route": "Encontrar la ruta",
  "Answer more questions to narrow the route.":
    "Responde más preguntas para precisar la ruta.",
  "Complete the intake to generate a checklist.":
    "Completa el cuestionario para generar una lista de tareas.",

  "What is your current country of citizenship?":
    "¿Cuál es tu ciudadanía actual?",
  "This keeps the final warnings accurate. It does not decide the route by itself.":
    "Esto ayuda a mostrar advertencias correctas. No decide la ruta por sí solo.",
  "Where were you born?": "¿Dónde naciste?",
  "Birthplace is the first legal divider.":
    "El lugar de nacimiento es la primera división legal.",
  "Do you already have any Mexican document?":
    "¿Ya tienes algún documento mexicano?",
  "Existing proof can turn this into a records or passport task instead of an acquisition task.":
    "Un documento existente puede convertir esto en un trámite de registros o pasaporte, no de adquisición.",
  "Are you applying for yourself or for a minor?":
    "¿Solicitas para ti o para un menor?",
  "Which consulate or Mexican state will handle the case?":
    "¿Qué consulado o estado mexicano llevará el caso?",
  "You can use a ZIP, preferred consulate, or Mexican state. Skip it if you do not know yet.":
    "Puedes usar un código postal, consulado preferido o estado mexicano. Omítelo si aún no lo sabes.",
  "ZIP, preferred consulate, or Mexican state":
    "Código postal, consulado preferido o estado mexicano",
  "Were you registered with a Mexican civil registry?":
    "¿Fuiste registrado/a ante un registro civil mexicano?",
  "Did you acquire another nationality before March 20, 1998?":
    "¿Adquiriste otra nacionalidad antes del 20 de marzo de 1998?",
  "Is your Mexican birth certificate late-registered or inconsistent with your ID?":
    "¿Tu acta mexicana es extemporánea o no coincide con tu identificación?",
  "Was at least one legal parent Mexican at or before your birth?":
    "¿Al menos uno de tus padres legales era mexicano antes o al momento de tu nacimiento?",
  "What proof does the Mexican parent have?":
    "¿Qué prueba tiene el padre o madre mexicano/a?",
  "Was the Mexican parent born in Mexico, born abroad, or naturalized Mexican?":
    "¿El padre o madre mexicano/a nació en México, nació en el extranjero o se naturalizó?",
  "Do parent names on your foreign birth certificate match the Mexican parent records?":
    "¿Los nombres de tus padres en tu acta extranjera coinciden con los registros mexicanos?",
  "Do you have a long-form certified birth certificate?":
    "¿Tienes un acta certificada en formato largo?",
  "Were your parents married before your birth?":
    "¿Tus padres estaban casados antes de tu nacimiento?",
  "Is either parent deceased, absent, unavailable, or unwilling to participate?":
    "¿Alguno de tus padres falleció, está ausente, no está disponible o no quiere participar?",
  "Are you over 18?": "¿Tienes más de 18 años?",
  "Was your birth certificate issued outside the U.S. or in a language other than English/Spanish?":
    "¿Tu acta fue emitida fuera de EE. UU. o en un idioma distinto de inglés/español?",
  "Do you currently live in Mexico with legal resident status?":
    "¿Actualmente vives en México con estancia legal de residente?",
  "How long have you had qualifying residence in Mexico?":
    "¿Cuánto tiempo llevas con residencia que cuenta para naturalización?",
  "Is your resident card valid at least six months beyond filing and does it show CURP?":
    "¿Tu tarjeta de residente tendrá al menos seis meses de vigencia al presentar y muestra CURP?",
  "Is your INM-registered address the same as your application address?":
    "¿Tu domicilio registrado ante INM coincide con el domicilio de la solicitud?",
  "During the last two years of qualifying residence, how much time were you outside Mexico?":
    "Durante los últimos dos años de residencia que califica, ¿cuánto tiempo estuviste fuera de México?",
  "Are you married to a Mexican citizen?":
    "¿Estás casado/a con una persona mexicana?",
  "Do you have a Mexican child by birth?":
    "¿Tienes un hijo o hija mexicano/a por nacimiento?",
  "Are you a direct descendant of a Mexican by birth?":
    "¿Eres descendiente directo de una persona mexicana por nacimiento?",
  "Are you originally from Latin America or the Iberian Peninsula?":
    "¿Eres originario/a de América Latina o de la Península Ibérica?",
  "Are you recognized as a refugee by COMAR?":
    "¿Tienes reconocimiento de refugiado/a por COMAR?",
  "Are you a minor adopted by Mexican citizens or under Mexican parental authority?":
    "¿Eres menor adoptado/a por mexicanos o bajo patria potestad mexicana?",
  "Have you performed distinguished services benefiting Mexico?":
    "¿Has realizado servicios distinguidos en beneficio de México?",
  "Do you have criminal history, pending charges, or a prison sentence in any country?":
    "¿Tienes antecedentes penales, cargos pendientes o una sentencia en cualquier país?",
  "Can you speak Spanish and pass Mexican history/culture exams?":
    "¿Puedes hablar español y aprobar exámenes de historia/cultura mexicana?",
  "Do you have a valid foreign passport with at least 45 business days of validity?":
    "¿Tienes pasaporte extranjero válido con al menos 45 días hábiles de vigencia?",

  "U.S.": "EE. UU.",
  Mexico: "México",
  Both: "Ambas",
  Other: "Otra",
  Multiple: "Múltiples",
  "Other country": "Otro país",
  "Mexican ship or aircraft": "Buque o aeronave mexicana",
  Unknown: "No sé",
  "Mexican birth certificate": "Acta de nacimiento mexicana",
  "Mexican passport": "Pasaporte mexicano",
  Matricula: "Matrícula",
  CURP: "CURP",
  INE: "INE",
  "Declaratoria / certificate": "Declaratoria / certificado",
  "Carta de Naturalizacion": "Carta de Naturalización",
  None: "Ninguno",
  "Self, adult": "Yo, adulto/a",
  "Parent/guardian for child": "Padre/madre o tutor de menor",
  "Attorney/authorized person": "Abogado/a o persona autorizada",
  Yes: "Sí",
  No: "No",
  "Not applicable": "No aplica",
  "Yes, before March 20, 1998": "Sí, antes del 20 de marzo de 1998",
  "Acquired after that date": "La adquirí después de esa fecha",
  Mother: "Madre",
  Father: "Padre",
  "Parent became Mexican after my birth":
    "Mi padre o madre se hizo mexicano/a después de mi nacimiento",
  "Not sure": "No estoy seguro/a",
  "Mexican birth acta": "Acta mexicana de nacimiento",
  "Born abroad": "Nació en el extranjero",
  "Naturalized Mexican": "Mexicano/a naturalizado/a",
  "Accents, spelling, or order differ": "Difieren acentos, ortografía u orden",
  "Married surname issue": "Tema de apellido de casada/o",
  "Yes, long-form certified": "Sí, certificada en formato largo",
  "Short abstract only": "Solo extracto corto",
  "Hospital certificate only": "Solo certificado del hospital",
  "Yes, at least 6 months before birth":
    "Sí, al menos 6 meses antes del nacimiento",
  "Yes, but after birth or under 6 months":
    "Sí, pero después del nacimiento o menos de 6 meses antes",
  "Yes, father": "Sí, padre",
  "Yes, mother": "Sí, madre",
  "Non-U.S.": "Fuera de EE. UU.",
  "Non-English": "No está en inglés",
  "Permanent resident": "Residente permanente",
  "Temporary resident": "Residente temporal",
  "Temporary student": "Residente temporal estudiante",
  "Tourist/FMM": "Turista/FMM",
  "5+ years": "5 años o más",
  "2-5 years": "2 a 5 años",
  "1-2 years": "1 a 2 años",
  "Less than 1 year": "Menos de 1 año",
  "None / no qualifying residence": "Ninguna / sin residencia que califique",
  "Not applicable / no qualifying residence yet":
    "No aplica / aún no hay residencia que califique",
  "Under 6 months total": "Menos de 6 meses en total",
  "Over 6 months total": "Más de 6 meses en total",
  Parent: "Padre/madre",
  Grandparent: "Abuelo/a",
  "Great-grandparent": "Bisabuelo/a",
  "Formerly, now adult": "Antes, ahora adulto/a",
  "Pending case": "Caso pendiente",
  Conviction: "Condena",
  "Sentence being served": "Cumpliendo sentencia",
  Maybe: "Quizá",
  "Exempt/minor/over 60/refugee": "Exento/menor/mayor de 60/refugiado",
  "Recently renewed": "Renovado recientemente",

  "Waiting for birthplace": "Esperando lugar de nacimiento",
  "Start with birthplace and existing Mexican records.":
    "Empieza con el lugar de nacimiento y documentos mexicanos existentes.",
  "Confirm where the applicant was born.":
    "Confirma dónde nació la persona solicitante.",
  "Likely route": "Ruta probable",
  "Needs document review": "Requiere revisión documental",
  "Prerequisites or review needed": "Requiere requisitos previos o revisión",
  "You already have a Mexican nationality document on the record.":
    "Ya tienes un documento de nacionalidad mexicana.",
  "Get certified copies of the Mexican acta or document if needed.":
    "Obtén copias certificadas del acta o documento mexicano si hace falta.",
  "Confirm CURP and name consistency across IDs.":
    "Confirma CURP y consistencia de nombres entre identificaciones.",
  "Schedule passport, matricula, INE, or record-correction steps as applicable.":
    "Agenda pasaporte, matrícula, INE o corrección de registros según corresponda.",
  "Mexican civil registry record is missing or uncertain.":
    "El registro civil mexicano falta o no está claro.",
  "Ask the relevant civil registry or consulate about late/no registration evidence.":
    "Consulta al registro civil o consulado sobre pruebas para registro extemporáneo o inexistente.",
  "Collect older supporting records such as baptismal, school, medical, parent, or sibling records.":
    "Reúne pruebas antiguas como registros bautismales, escolares, médicos, de padres o hermanos.",
  "Born in Mexico, but foreign nationality was acquired before March 20, 1998.":
    "Naciste en México, pero adquiriste otra nacionalidad antes del 20 de marzo de 1998.",
  "Prepare Mexican birth acta.": "Prepara el acta mexicana de nacimiento.",
  "Gather proof of foreign naturalization with apostille if required.":
    "Reúne prueba de naturalización extranjera con apostilla si se requiere.",
  "Gather ID, photos, and name-change or marriage records.":
    "Reúne identificación, fotos y documentos de cambio de nombre o matrimonio.",
  "Foreign naturalization timing is unknown.":
    "No se conoce la fecha de la naturalización extranjera.",
  "Confirm the exact date another nationality was acquired.":
    "Confirma la fecha exacta en que se adquirió otra nacionalidad.",
  "Mexican acta may be late-registered or inconsistent with ID.":
    "El acta mexicana puede ser extemporánea o no coincidir con la identificación.",
  "Compare the acta against current ID, parents' records, and marriage/name-change documents.":
    "Compara el acta con la identificación actual, registros de padres y documentos de matrimonio/cambio de nombre.",
  "Ask the civil registry or consulate whether correction or supplemental proof is required.":
    "Pregunta al registro civil o consulado si se requiere corrección o prueba adicional.",
  "People born in Mexico are Mexican by birth.":
    "Las personas nacidas en México son mexicanas por nacimiento.",
  "Locate or obtain a certified Mexican birth acta.":
    "Localiza u obtén un acta mexicana certificada.",
  "Confirm CURP and fix record errors before passport or ID appointment.":
    "Confirma CURP y corrige errores antes de la cita de pasaporte o identificación.",
  "Apply for Mexican passport, matricula, INE, or other ID.":
    "Solicita pasaporte mexicano, matrícula, INE u otra identificación.",
  "Birth on a Mexican vessel or aircraft can be a Mexican-by-birth category.":
    "Nacer en buque o aeronave mexicana puede ser una categoría de mexicano/a por nacimiento.",
  "Collect the vessel/aircraft birth record and parent identity records.":
    "Reúne el registro de nacimiento en buque/aeronave y documentos de identidad de los padres.",
  "Ask the consulate or civil registry which office should issue or recognize the acta.":
    "Pregunta al consulado o registro civil qué oficina debe emitir o reconocer el acta.",
  "Proceed to passport/ID after the Mexican nationality record is issued.":
    "Continúa con pasaporte/identificación después de emitirse el registro mexicano.",
  "At least one legal parent was Mexican at or before the applicant's birth.":
    "Al menos uno de los padres legales era mexicano al momento o antes del nacimiento.",
  "Use MiConsulado and choose civil registry / birth registration, not passport.":
    "Usa MiConsulado y elige registro civil / registro de nacimiento, no pasaporte.",
  "Bring the applicant's long-form certified birth certificate.":
    "Lleva el acta certificada en formato largo de la persona solicitante.",
  "Bring the Mexican parent's acta, passport, Carta de Naturalizacion, or declaratoria as applicable.":
    "Lleva el acta, pasaporte, Carta de Naturalización o declaratoria del padre/madre mexicano/a, según aplique.",
  "Bring parent IDs, marriage/name-change records, and witnesses if the consulate requires them.":
    "Lleva identificaciones de padres, documentos de matrimonio/cambio de nombre y testigos si el consulado los pide.",
  "After the Mexican acta is issued, confirm CURP and schedule a Mexican passport appointment.":
    "Cuando se emita el acta mexicana, confirma CURP y agenda cita de pasaporte mexicano.",
  "The parent appears Mexican, but the appointment will likely need stronger nationality proof.":
    "El padre/madre parece mexicano/a, pero probablemente la cita requiera prueba más fuerte de nacionalidad.",
  "Obtain the Mexican parent's certified birth acta or Carta de Naturalizacion before the appointment.":
    "Obtén el acta certificada o Carta de Naturalización del padre/madre mexicano/a antes de la cita.",
  "Then prepare the applicant's long-form birth certificate and parent ID records.":
    "Después prepara el acta larga de la persona solicitante y las identificaciones de los padres.",
  "The parent link may qualify, but the Mexican parent must be documented first.":
    "El vínculo con el padre/madre puede calificar, pero primero debe documentarse al padre/madre mexicano/a.",
  "Find or request the parent's Mexican birth acta, declaratoria, or Carta de Naturalizacion.":
    "Busca o solicita el acta mexicana, declaratoria o Carta de Naturalización del padre/madre.",
  "If the parent was born abroad and never registered, document the parent first.":
    "Si el padre/madre nació en el extranjero y nunca fue registrado/a, documéntalo/a primero.",
  "Then reopen the applicant's birth registration checklist.":
    "Después retoma la lista de registro de nacimiento de la persona solicitante.",
  "Parent became Mexican after the applicant was born.":
    "El padre/madre se hizo mexicano/a después del nacimiento de la persona solicitante.",
  "Parent was born abroad and may need their own Mexican record first.":
    "El padre/madre nació en el extranjero y puede necesitar primero su propio registro mexicano.",
  "Parent names do not clearly match across birth and Mexican records.":
    "Los nombres de los padres no coinciden claramente entre el acta extranjera y los registros mexicanos.",
  "Applicant does not yet have a long-form certified birth certificate.":
    "La persona solicitante aún no tiene acta certificada en formato largo.",
  "Order the long-form certified birth certificate before attending.":
    "Solicita el acta certificada en formato largo antes de acudir.",
  "Parent appearance, marriage timing, or special power of attorney issue needs consulate review.":
    "La comparecencia de padres, fecha de matrimonio o poder especial requiere revisión consular.",
  "A parent is deceased, absent, unavailable, or unwilling to participate.":
    "Un padre/madre falleció, está ausente, no disponible o no quiere participar.",
  "Add apostille/legalization and authorized translation steps for non-U.S. or non-English/non-Spanish records.":
    "Agrega apostilla/legalización y traducción autorizada para documentos no estadounidenses o que no estén en inglés/español.",
  "Naturalization generally requires temporary or permanent resident status.":
    "La naturalización generalmente requiere residencia temporal o permanente.",
  "Move from tourist/FMM, no status, or temporary student status into qualifying temporary or permanent residence.":
    "Cambia de turista/FMM, sin estatus o estudiante temporal a residencia temporal o permanente que sí califique.",
  "Start tracking residence time and absences once qualifying status begins.":
    "Empieza a contar tiempo de residencia y ausencias cuando comience el estatus que califica.",
  "Five or more years of qualifying residence can support the general route.":
    "Cinco años o más de residencia que califica pueden apoyar la ruta general.",
  "A shorter route may exist, but the residence clock is not long enough yet.":
    "Puede existir una ruta más corta, pero el tiempo de residencia aún no alcanza.",
  "Keep qualifying residence active until the route minimum is met.":
    "Mantén activa la residencia que califica hasta cumplir el mínimo de la ruta.",
  "No shorter statutory route is selected, and the five-year clock is not complete.":
    "No se seleccionó una ruta legal más corta y aún no se cumplen cinco años.",
  "Continue qualifying temporary or permanent residence toward five years.":
    "Continúa con residencia temporal o permanente que califique hasta llegar a cinco años.",
  "Confirm resident card is valid at least six months beyond the filing date and shows CURP.":
    "Confirma que la tarjeta de residente tenga al menos seis meses de vigencia después de presentar y muestre CURP.",
  "Make sure the DNN-3 address matches the INM-registered address.":
    "Asegúrate de que el domicilio en DNN-3 coincida con el registrado ante INM.",
  "Prepare DNN-3, resident card, full passport copies, entries/exits letter, CURP, photos, payment, and criminal-record certificates.":
    "Prepara DNN-3, tarjeta de residente, copias completas del pasaporte, carta de entradas/salidas, CURP, fotos, pago y constancias de antecedentes.",
  "Gather modality proof such as marriage acta, child's Mexican acta, descent records, origin-country birth certificate, COMAR letter, or custody/adoption records.":
    "Reúne prueba de modalidad como acta de matrimonio, acta mexicana del hijo/a, documentos de descendencia, acta del país de origen, constancia COMAR o documentos de custodia/adopción.",
  "Study for Spanish, Mexican history, and culture exams unless an exception applies.":
    "Estudia para los exámenes de español, historia y cultura mexicana salvo que aplique una excepción.",
  "Resident card validity or CURP is not ready.":
    "La vigencia de la tarjeta de residente o CURP no está lista.",
  "Application address must match INM records.":
    "El domicilio de la solicitud debe coincidir con los registros de INM.",
  "Absences exceed six months total during the last two years.":
    "Las ausencias superan seis meses en total durante los últimos dos años.",
  "Calculate a new filing date after the absence window clears.":
    "Calcula una nueva fecha de presentación cuando se despeje la ventana de ausencias.",
  "Criminal history or pending case needs review before naturalization.":
    "Antecedentes penales o caso pendiente requieren revisión antes de naturalizarse.",
  "Use the SRE study guide and practice before scheduling exams.":
    "Usa la guía de estudio de SRE y practica antes de agendar exámenes.",
  "Foreign passport does not yet meet the filing-validity requirement.":
    "El pasaporte extranjero aún no cumple el requisito de vigencia para presentar.",
  "Prepare prior passport copies or INM migration-flow proof.":
    "Prepara copias del pasaporte anterior o constancia de flujos migratorios de INM.",
  "More distant descent should be reviewed before relying on a two-year route.":
    "La descendencia más lejana debe revisarse antes de depender de una ruta de dos años.",
  "Distinguished services are discretionary and should be reviewed before relying on the route.":
    "Los servicios distinguidos son discrecionales y deben revisarse antes de depender de esa ruta.",
  "High-discretion naturalization route.":
    "Ruta de naturalización con alta discrecionalidad.",
  "Prepare evidence of cultural, social, scientific, technical, artistic, sports, business, or other benefit to Mexico.":
    "Prepara evidencia de beneficio cultural, social, científico, técnico, artístico, deportivo, empresarial u otro para México.",
  "Ask SRE or counsel whether residence can be shortened or waived.":
    "Pregunta a SRE o a un asesor si la residencia puede reducirse o dispensarse.",
  "5-year general residence": "Residencia general de 5 años",
  "Distinguished-service route": "Ruta por servicios distinguidos",
  "1-year adoption / parental authority route":
    "Ruta de 1 año por adopción / patria potestad",
  "marriage to a Mexican citizen": "matrimonio con persona mexicana",
  "Mexican child by birth": "hijo/a mexicano/a por nacimiento",
  "direct descent from Mexican by birth":
    "descendencia directa de mexicano/a por nacimiento",
  "Latin American or Iberian origin": "origen latinoamericano o ibérico",
  "recognized refugee checklist": "lista para persona refugiada reconocida",

  "U.S. citizens generally do not automatically lose U.S. citizenship by acquiring another nationality, and U.S. dual nationals generally must use a U.S. passport to enter and leave the United States.":
    "Las personas ciudadanas de EE. UU. generalmente no pierden automáticamente esa ciudadanía al adquirir otra nacionalidad, y las personas con doble nacionalidad estadounidense generalmente deben usar pasaporte de EE. UU. para entrar y salir de Estados Unidos.",
  "Mexicans by birth cannot be deprived of Mexican nationality.":
    "Las personas mexicanas por nacimiento no pueden ser privadas de la nacionalidad mexicana.",
  "Naturalized Mexican nationality can be lost in specific situations, including voluntarily acquiring another foreign nationality, using a foreign passport as a Mexican in certain contexts, or residing abroad for five continuous years.":
    "La nacionalidad mexicana por naturalización puede perderse en situaciones específicas, incluyendo adquirir voluntariamente otra nacionalidad extranjera, usar pasaporte extranjero como mexicano/a en ciertos contextos o residir fuera de México por cinco años continuos.",
  "This tool is an eligibility guide, not a legal decision. SRE, consulates, and civil registry offices apply the final requirements.":
    "Esta herramienta es una guía de elegibilidad, no una decisión legal. SRE, consulados y registros civiles aplican los requisitos finales.",
};

const PT_TEXT = {
  "Already Mexican by birth": "Mexicano/a por nascimento",
  "Document/passport path": "Caminho de documentos e passaporte",
  "Birth registration abroad": "Registro de nascimento no exterior",
  "Dual nationality path": "Caminho de dupla nacionalidade",
  "Parent-chain first": "Primeiro documentar o pai ou a mãe",
  "Document the Mexican parent before applicant":
    "Documentar primeiro o pai ou a mãe mexicana",
  "Declaratoria / recovery": "Declaratória / recuperação",
  "Mexican by birth with pre-1998 foreign nationality issue":
    "Mexicano/a por nascimento com questão de nacionalidade estrangeira anterior a 1998",
  Naturalization: "Naturalização",
  "Carta de Naturalizacion path through SRE":
    "Caminho da Carta de Naturalização pela SRE",
  "Not eligible yet": "Ainda não elegível",
  "Build the missing residence, document, or timing prerequisite":
    "Complete o requisito faltante de residência, documento ou prazo",
  "Manual review": "Revisão manual",
  "Consulate, SRE, civil registry, or legal review needed":
    "É necessária revisão do consulado, SRE, registro civil ou jurídica",
  "SRE nationality and naturalization": "Nacionalidade e naturalização da SRE",
  "MiConsulado appointments": "Agendamentos MiConsulado",
  "U.S. dual nationality guidance":
    "Orientação dos EUA sobre dupla nacionalidade",
  Identity: "Identidade",
  Documents: "Documentos",
  Applicant: "Solicitante",
  Location: "Localização",
  "Born in Mexico": "Nascido/a no México",
  "Mexican parent": "Pai ou mãe mexicana",
  "Family record": "Registro familiar",
  "One step at a time": "Um passo de cada vez",
  Question: "Pergunta",
  of: "de",
  answered: "respondidas",
  Back: "Voltar",
  Next: "Avançar",
  Done: "Concluir",
  Skip: "Pular",
  "Edit answers": "Editar respostas",
  "Jump to question": "Ir para a pergunta",
  "Finish edits": "Finalizar edições",
  Theme: "Tema",
  "Switch to dark mode": "Mudar para modo escuro",
  "Switch to light mode": "Mudar para modo claro",
  "Intake answered": "Perguntas respondidas",
  Why: "Por quê",
  "Naturalization modality": "Modalidade de naturalização",
  "Resolve first": "Resolver primeiro",
  Checklist: "Lista de tarefas",
  "Critical warnings": "Avisos importantes",
  "Official references": "Referências oficiais",
  "Likely base route": "Rota base provável",
  "Find the route": "Encontrar a rota",
  "Answer more questions to narrow the route.":
    "Responda a mais perguntas para refinar a rota.",
  "Complete the intake to generate a checklist.":
    "Conclua o questionário para gerar uma lista de tarefas.",
  "What is your current country of citizenship?":
    "Qual é o seu país de cidadania atual?",
  "This keeps the final warnings accurate. It does not decide the route by itself.":
    "Isso mantém os avisos finais corretos. Não decide a rota sozinho.",
  "Where were you born?": "Onde você nasceu?",
  "Birthplace is the first legal divider.":
    "O local de nascimento é a primeira divisão legal.",
  "Do you already have any Mexican document?":
    "Você já tem algum documento mexicano?",
  "Existing proof can turn this into a records or passport task instead of an acquisition task.":
    "Uma prova existente pode transformar isso em uma tarefa de registros ou passaporte, em vez de aquisição.",
  "Are you applying for yourself or for a minor?":
    "Você está solicitando para si ou para um menor?",
  "Which consulate or Mexican state will handle the case?":
    "Qual consulado ou estado mexicano cuidará do caso?",
  "You can use a ZIP, preferred consulate, or Mexican state. Skip it if you do not know yet.":
    "Você pode usar CEP, consulado preferido ou estado mexicano. Pule se ainda não souber.",
  "ZIP, preferred consulate, or Mexican state":
    "CEP, consulado preferido ou estado mexicano",
  "Were you registered with a Mexican civil registry?":
    "Você foi registrado/a em um registro civil mexicano?",
  "Did you acquire another nationality before March 20, 1998?":
    "Você adquiriu outra nacionalidade antes de 20 de março de 1998?",
  "Is your Mexican birth certificate late-registered or inconsistent with your ID?":
    "Sua certidão mexicana foi registrada tarde ou não coincide com sua identificação?",
  "Was at least one legal parent Mexican at or before your birth?":
    "Ao menos um dos seus pais legais era mexicano antes ou no momento do seu nascimento?",
  "What proof does the Mexican parent have?":
    "Que prova o pai ou a mãe mexicana possui?",
  "Was the Mexican parent born in Mexico, born abroad, or naturalized Mexican?":
    "O pai ou a mãe mexicana nasceu no México, no exterior ou se naturalizou mexicano/a?",
  "Do parent names on your foreign birth certificate match the Mexican parent records?":
    "Os nomes dos pais na sua certidão estrangeira coincidem com os registros mexicanos?",
  "Do you have a long-form certified birth certificate?":
    "Você tem uma certidão de nascimento certificada de inteiro teor?",
  "Were your parents married before your birth?":
    "Seus pais eram casados antes do seu nascimento?",
  "Is either parent deceased, absent, unavailable, or unwilling to participate?":
    "Algum dos pais faleceu, está ausente, indisponível ou não quer participar?",
  "Are you over 18?": "Você tem mais de 18 anos?",
  "Was your birth certificate issued outside the U.S. or in a language other than English/Spanish?":
    "Sua certidão foi emitida fora dos EUA ou em idioma diferente de inglês/espanhol?",
  "Do you currently live in Mexico with legal resident status?":
    "Você vive atualmente no México com status legal de residente?",
  "How long have you had qualifying residence in Mexico?":
    "Há quanto tempo você tem residência qualificada no México?",
  "Is your resident card valid at least six months beyond filing and does it show CURP?":
    "Seu cartão de residente terá validade de pelo menos seis meses após o pedido e mostra CURP?",
  "Is your INM-registered address the same as your application address?":
    "Seu endereço registrado no INM é o mesmo do pedido?",
  "During the last two years of qualifying residence, how much time were you outside Mexico?":
    "Durante os últimos dois anos de residência qualificável, quanto tempo você ficou fora do México?",
  "Are you married to a Mexican citizen?":
    "Você é casado/a com cidadão/ã mexicano/a?",
  "Do you have a Mexican child by birth?":
    "Você tem filho/a mexicano/a por nascimento?",
  "Are you a direct descendant of a Mexican by birth?":
    "Você é descendente direto de mexicano/a por nascimento?",
  "Are you originally from Latin America or the Iberian Peninsula?":
    "Você é originário/a da América Latina ou da Península Ibérica?",
  "Are you recognized as a refugee by COMAR?":
    "Você é reconhecido/a como refugiado/a pela COMAR?",
  "Are you a minor adopted by Mexican citizens or under Mexican parental authority?":
    "Você é menor adotado/a por mexicanos ou sob autoridade parental mexicana?",
  "Have you performed distinguished services benefiting Mexico?":
    "Você realizou serviços destacados em benefício do México?",
  "Do you have criminal history, pending charges, or a prison sentence in any country?":
    "Você tem antecedentes criminais, acusações pendentes ou sentença em algum país?",
  "Can you speak Spanish and pass Mexican history/culture exams?":
    "Você fala espanhol e consegue passar nos exames de história/cultura mexicana?",
  "Do you have a valid foreign passport with at least 45 business days of validity?":
    "Você tem passaporte estrangeiro válido por pelo menos 45 dias úteis?",
  "U.S.": "EUA",
  Mexico: "México",
  Both: "Ambos",
  Other: "Outro",
  Multiple: "Múltiplas",
  "Other country": "Outro país",
  "Mexican ship or aircraft": "Navio ou aeronave mexicana",
  Unknown: "Não sei",
  "Mexican birth certificate": "Certidão mexicana de nascimento",
  "Mexican passport": "Passaporte mexicano",
  Matricula: "Matrícula",
  "Declaratoria / certificate": "Declaratória / certificado",
  None: "Nenhum",
  "Self, adult": "Eu, adulto/a",
  "Parent/guardian for child": "Pai/mãe ou tutor de menor",
  "Attorney/authorized person": "Advogado/a ou pessoa autorizada",
  Yes: "Sim",
  No: "Não",
  "Not applicable": "Não se aplica",
  "Yes, before March 20, 1998": "Sim, antes de 20 de março de 1998",
  "Acquired after that date": "Adquirida depois dessa data",
  Mother: "Mãe",
  Father: "Pai",
  "Parent became Mexican after my birth":
    "Meu pai/minha mãe se tornou mexicano/a depois do meu nascimento",
  "Not sure": "Não tenho certeza",
  "Mexican birth acta": "Acta mexicana de nascimento",
  "Born abroad": "Nascido/a no exterior",
  "Naturalized Mexican": "Mexicano/a naturalizado/a",
  "Accents, spelling, or order differ": "Acentos, grafia ou ordem diferem",
  "Married surname issue": "Questão de sobrenome de casado/a",
  "Yes, long-form certified": "Sim, certificada de inteiro teor",
  "Short abstract only": "Apenas extrato curto",
  "Hospital certificate only": "Apenas certificado hospitalar",
  "Yes, at least 6 months before birth":
    "Sim, ao menos 6 meses antes do nascimento",
  "Yes, but after birth or under 6 months":
    "Sim, mas depois do nascimento ou menos de 6 meses antes",
  "Yes, father": "Sim, pai",
  "Yes, mother": "Sim, mãe",
  "Non-U.S.": "Fora dos EUA",
  "Non-English": "Não está em inglês",
  "Permanent resident": "Residente permanente",
  "Temporary resident": "Residente temporário",
  "Temporary student": "Estudante residente temporário",
  "Tourist/FMM": "Turista/FMM",
  "5+ years": "5 anos ou mais",
  "2-5 years": "2 a 5 anos",
  "1-2 years": "1 a 2 anos",
  "Less than 1 year": "Menos de 1 ano",
  "None / no qualifying residence": "Nenhuma / sem residência qualificável",
  "Not applicable / no qualifying residence yet":
    "Não se aplica / ainda sem residência qualificável",
  "Under 6 months total": "Menos de 6 meses no total",
  "Over 6 months total": "Mais de 6 meses no total",
  Parent: "Pai/mãe",
  Grandparent: "Avô/avó",
  "Great-grandparent": "Bisavô/bisavó",
  "Formerly, now adult": "Antes, agora adulto/a",
  "Pending case": "Caso pendente",
  Conviction: "Condenação",
  "Sentence being served": "Cumprindo sentença",
  Maybe: "Talvez",
  "Exempt/minor/over 60/refugee": "Isento/menor/maior de 60/refugiado",
  "Recently renewed": "Renovado recentemente",
  "Likely route": "Rota provável",
  "Needs document review": "Precisa de revisão documental",
  "Prerequisites or review needed": "Pré-requisitos ou revisão necessários",
  "5-year general residence": "Residência geral de 5 anos",
  "Distinguished-service route": "Rota por serviços destacados",
  "1-year adoption / parental authority route":
    "Rota de 1 ano por adoção / autoridade parental",
  "marriage to a Mexican citizen": "casamento com cidadão/ã mexicano/a",
  "Mexican child by birth": "filho/a mexicano/a por nascimento",
  "direct descent from Mexican by birth":
    "descendência direta de mexicano/a por nascimento",
  "Latin American or Iberian origin": "origem latino-americana ou ibérica",
  "recognized refugee checklist": "lista para refugiado/a reconhecido/a",
  "U.S. citizens generally do not automatically lose U.S. citizenship by acquiring another nationality, and U.S. dual nationals generally must use a U.S. passport to enter and leave the United States.":
    "Cidadãos dos EUA geralmente não perdem automaticamente a cidadania dos EUA ao adquirir outra nacionalidade, e dupla nacionalidade dos EUA geralmente deve usar passaporte dos EUA para entrar e sair dos Estados Unidos.",
  "Mexicans by birth cannot be deprived of Mexican nationality.":
    "Mexicanos por nascimento não podem ser privados da nacionalidade mexicana.",
  "Naturalized Mexican nationality can be lost in specific situations, including voluntarily acquiring another foreign nationality, using a foreign passport as a Mexican in certain contexts, or residing abroad for five continuous years.":
    "A nacionalidade mexicana por naturalização pode ser perdida em situações específicas, incluindo adquirir voluntariamente outra nacionalidade, usar passaporte estrangeiro como mexicano/a em certos contextos ou residir fora do México por cinco anos contínuos.",
  "This tool is an eligibility guide, not a legal decision. SRE, consulates, and civil registry offices apply the final requirements.":
    "Esta ferramenta é um guia de elegibilidade, não uma decisão legal. A SRE, os consulados e os registros civis aplicam os requisitos finais.",
};

const IT_TEXT = {
  "Already Mexican by birth": "Messicano/a per nascita",
  "Document/passport path": "Percorso documenti e passaporto",
  "Birth registration abroad": "Registrazione di nascita all'estero",
  "Dual nationality path": "Percorso di doppia cittadinanza",
  "Parent-chain first": "Prima documentare il genitore",
  "Document the Mexican parent before applicant":
    "Documentare prima il genitore messicano",
  "Declaratoria / recovery": "Declaratoria / recupero",
  "Mexican by birth with pre-1998 foreign nationality issue":
    "Messicano/a per nascita con questione di cittadinanza straniera precedente al 1998",
  Naturalization: "Naturalizzazione",
  "Carta de Naturalizacion path through SRE":
    "Percorso Carta de Naturalización tramite SRE",
  "Not eligible yet": "Non ancora idoneo/a",
  "Build the missing residence, document, or timing prerequisite":
    "Completa il requisito mancante di residenza, documento o tempistica",
  "Manual review": "Revisione manuale",
  "Consulate, SRE, civil registry, or legal review needed":
    "Serve revisione del consolato, SRE, registro civile o legale",
  "SRE nationality and naturalization": "Nazionalità e naturalizzazione SRE",
  "MiConsulado appointments": "Appuntamenti MiConsulado",
  "U.S. dual nationality guidance": "Guida USA sulla doppia nazionalità",
  Identity: "Identità",
  Documents: "Documenti",
  Applicant: "Richiedente",
  Location: "Località",
  "Born in Mexico": "Nato/a in Messico",
  "Mexican parent": "Genitore messicano",
  "Family record": "Registro familiare",
  "One step at a time": "Un passo alla volta",
  Question: "Domanda",
  of: "di",
  answered: "risposte",
  Back: "Indietro",
  Next: "Avanti",
  Done: "Fine",
  Skip: "Salta",
  "Edit answers": "Modifica risposte",
  "Jump to question": "Vai alla domanda",
  "Finish edits": "Termina modifiche",
  Theme: "Tema",
  "Switch to dark mode": "Passa alla modalità scura",
  "Switch to light mode": "Passa alla modalità chiara",
  "Intake answered": "Domande completate",
  Why: "Perché",
  "Naturalization modality": "Modalità di naturalizzazione",
  "Resolve first": "Risolvi prima",
  Checklist: "Checklist",
  "Critical warnings": "Avvisi importanti",
  "Official references": "Riferimenti ufficiali",
  "Likely base route": "Percorso base probabile",
  "Find the route": "Trova il percorso",
  "Answer more questions to narrow the route.":
    "Rispondi ad altre domande per restringere il percorso.",
  "Complete the intake to generate a checklist.":
    "Completa il questionario per generare una checklist.",
  "What is your current country of citizenship?":
    "Qual è il tuo attuale paese di cittadinanza?",
  "This keeps the final warnings accurate. It does not decide the route by itself.":
    "Questo mantiene accurati gli avvisi finali. Non decide il percorso da solo.",
  "Where were you born?": "Dove sei nato/a?",
  "Birthplace is the first legal divider.":
    "Il luogo di nascita è la prima distinzione legale.",
  "Do you already have any Mexican document?":
    "Hai già un documento messicano?",
  "Existing proof can turn this into a records or passport task instead of an acquisition task.":
    "Una prova esistente può renderlo un compito di registri o passaporto, non di acquisizione.",
  "Are you applying for yourself or for a minor?":
    "Stai facendo domanda per te o per un minore?",
  "Which consulate or Mexican state will handle the case?":
    "Quale consolato o stato messicano gestirà il caso?",
  "You can use a ZIP, preferred consulate, or Mexican state. Skip it if you do not know yet.":
    "Puoi usare CAP, consolato preferito o stato messicano. Salta se non lo sai ancora.",
  "ZIP, preferred consulate, or Mexican state":
    "CAP, consolato preferito o stato messicano",
  "Were you registered with a Mexican civil registry?":
    "Sei stato/a registrato/a presso un registro civile messicano?",
  "Did you acquire another nationality before March 20, 1998?":
    "Hai acquisito un'altra nazionalità prima del 20 marzo 1998?",
  "Is your Mexican birth certificate late-registered or inconsistent with your ID?":
    "Il tuo atto di nascita messicano è tardivo o non coincide con il tuo documento?",
  "Was at least one legal parent Mexican at or before your birth?":
    "Almeno un genitore legale era messicano prima o al momento della tua nascita?",
  "What proof does the Mexican parent have?":
    "Quale prova ha il genitore messicano?",
  "Was the Mexican parent born in Mexico, born abroad, or naturalized Mexican?":
    "Il genitore messicano è nato in Messico, all'estero o si è naturalizzato?",
  "Do parent names on your foreign birth certificate match the Mexican parent records?":
    "I nomi dei genitori sul tuo certificato estero coincidono con i registri messicani?",
  "Do you have a long-form certified birth certificate?":
    "Hai un certificato di nascita integrale certificato?",
  "Were your parents married before your birth?":
    "I tuoi genitori erano sposati prima della tua nascita?",
  "Is either parent deceased, absent, unavailable, or unwilling to participate?":
    "Un genitore è deceduto, assente, indisponibile o non vuole partecipare?",
  "Are you over 18?": "Hai più di 18 anni?",
  "Was your birth certificate issued outside the U.S. or in a language other than English/Spanish?":
    "Il certificato è stato emesso fuori dagli USA o in una lingua diversa da inglese/spagnolo?",
  "Do you currently live in Mexico with legal resident status?":
    "Vivi attualmente in Messico con status legale di residente?",
  "How long have you had qualifying residence in Mexico?":
    "Da quanto tempo hai residenza qualificante in Messico?",
  "Is your resident card valid at least six months beyond filing and does it show CURP?":
    "La carta di residente è valida almeno sei mesi oltre la domanda e mostra il CURP?",
  "Is your INM-registered address the same as your application address?":
    "L'indirizzo registrato presso INM coincide con quello della domanda?",
  "During the last two years of qualifying residence, how much time were you outside Mexico?":
    "Durante gli ultimi due anni di residenza qualificante, quanto tempo sei stato/a fuori dal Messico?",
  "Are you married to a Mexican citizen?":
    "Sei sposato/a con un/a cittadino/a messicano/a?",
  "Do you have a Mexican child by birth?":
    "Hai un figlio messicano per nascita?",
  "Are you a direct descendant of a Mexican by birth?":
    "Sei discendente diretto di un messicano per nascita?",
  "Are you originally from Latin America or the Iberian Peninsula?":
    "Sei originario/a dell'America Latina o della Penisola Iberica?",
  "Are you recognized as a refugee by COMAR?":
    "Sei riconosciuto/a come rifugiato/a da COMAR?",
  "Are you a minor adopted by Mexican citizens or under Mexican parental authority?":
    "Sei minorenne adottato/a da cittadini messicani o sotto potestà genitoriale messicana?",
  "Have you performed distinguished services benefiting Mexico?":
    "Hai svolto servizi distinti a beneficio del Messico?",
  "Do you have criminal history, pending charges, or a prison sentence in any country?":
    "Hai precedenti penali, accuse pendenti o una pena detentiva in qualsiasi paese?",
  "Can you speak Spanish and pass Mexican history/culture exams?":
    "Parli spagnolo e puoi superare gli esami di storia/cultura messicana?",
  "Do you have a valid foreign passport with at least 45 business days of validity?":
    "Hai un passaporto straniero valido per almeno 45 giorni lavorativi?",
  "U.S.": "USA",
  Mexico: "Messico",
  Both: "Entrambe",
  Other: "Altro",
  Multiple: "Multiple",
  "Other country": "Altro paese",
  "Mexican ship or aircraft": "Nave o aeromobile messicano",
  Unknown: "Non so",
  "Mexican birth certificate": "Atto di nascita messicano",
  "Mexican passport": "Passaporto messicano",
  Matricula: "Matrícula",
  "Declaratoria / certificate": "Declaratoria / certificato",
  None: "Nessuno",
  "Self, adult": "Io, adulto/a",
  "Parent/guardian for child": "Genitore/tutore per minore",
  "Attorney/authorized person": "Avvocato/persona autorizzata",
  Yes: "Sì",
  No: "No",
  "Not applicable": "Non applicabile",
  "Yes, before March 20, 1998": "Sì, prima del 20 marzo 1998",
  "Acquired after that date": "Acquisita dopo quella data",
  Mother: "Madre",
  Father: "Padre",
  "Parent became Mexican after my birth":
    "Il genitore è diventato messicano dopo la mia nascita",
  "Not sure": "Non sono sicuro/a",
  "Mexican birth acta": "Atto di nascita messicano",
  "Born abroad": "Nato/a all'estero",
  "Naturalized Mexican": "Messicano/a naturalizzato/a",
  "Accents, spelling, or order differ": "Accenti, grafia o ordine differiscono",
  "Married surname issue": "Questione di cognome da matrimonio",
  "Yes, long-form certified": "Sì, integrale certificato",
  "Short abstract only": "Solo estratto breve",
  "Hospital certificate only": "Solo certificato ospedaliero",
  "Yes, at least 6 months before birth":
    "Sì, almeno 6 mesi prima della nascita",
  "Yes, but after birth or under 6 months":
    "Sì, ma dopo la nascita o meno di 6 mesi prima",
  "Yes, father": "Sì, padre",
  "Yes, mother": "Sì, madre",
  "Non-U.S.": "Fuori dagli USA",
  "Non-English": "Non in inglese",
  "Permanent resident": "Residente permanente",
  "Temporary resident": "Residente temporaneo",
  "Temporary student": "Studente residente temporaneo",
  "Tourist/FMM": "Turista/FMM",
  "5+ years": "5 anni o più",
  "2-5 years": "2-5 anni",
  "1-2 years": "1-2 anni",
  "Less than 1 year": "Meno di 1 anno",
  "None / no qualifying residence": "Nessuna / nessuna residenza qualificante",
  "Not applicable / no qualifying residence yet":
    "Non applicabile / nessuna residenza qualificante ancora",
  "Under 6 months total": "Meno di 6 mesi totali",
  "Over 6 months total": "Più di 6 mesi totali",
  Parent: "Genitore",
  Grandparent: "Nonno/a",
  "Great-grandparent": "Bisnonno/a",
  "Formerly, now adult": "In passato, ora adulto/a",
  "Pending case": "Procedimento pendente",
  Conviction: "Condanna",
  "Sentence being served": "Pena in corso",
  Maybe: "Forse",
  "Exempt/minor/over 60/refugee": "Esente/minore/oltre 60/rifugiato",
  "Recently renewed": "Rinnovato di recente",
  "Likely route": "Percorso probabile",
  "Needs document review": "Serve revisione documentale",
  "Prerequisites or review needed": "Servono prerequisiti o revisione",
  "5-year general residence": "Residenza generale di 5 anni",
  "Distinguished-service route": "Percorso per servizi distinti",
  "1-year adoption / parental authority route":
    "Percorso di 1 anno per adozione / potestà genitoriale",
  "marriage to a Mexican citizen": "matrimonio con cittadino/a messicano/a",
  "Mexican child by birth": "figlio messicano per nascita",
  "direct descent from Mexican by birth":
    "discendenza diretta da messicano/a per nascita",
  "Latin American or Iberian origin": "origine latinoamericana o iberica",
  "recognized refugee checklist": "checklist per rifugiato/a riconosciuto/a",
  "U.S. citizens generally do not automatically lose U.S. citizenship by acquiring another nationality, and U.S. dual nationals generally must use a U.S. passport to enter and leave the United States.":
    "I cittadini statunitensi generalmente non perdono automaticamente la cittadinanza USA acquisendo un'altra nazionalità, e i doppi cittadini USA generalmente devono usare il passaporto USA per entrare e uscire dagli Stati Uniti.",
  "Mexicans by birth cannot be deprived of Mexican nationality.":
    "I messicani per nascita non possono essere privati della nazionalità messicana.",
  "Naturalized Mexican nationality can be lost in specific situations, including voluntarily acquiring another foreign nationality, using a foreign passport as a Mexican in certain contexts, or residing abroad for five continuous years.":
    "La nazionalità messicana per naturalizzazione può perdersi in situazioni specifiche, tra cui acquisire volontariamente un'altra nazionalità, usare un passaporto straniero come messicano/a in certi contesti o risiedere all'estero per cinque anni continuativi.",
  "This tool is an eligibility guide, not a legal decision. SRE, consulates, and civil registry offices apply the final requirements.":
    "Questo strumento è una guida di idoneità, non una decisione legale. SRE, consolati e registri civili applicano i requisiti finali.",
};

const FR_TEXT = {
  "Already Mexican by birth": "Mexicain/e de naissance",
  "Document/passport path": "Parcours documents et passeport",
  "Birth registration abroad": "Enregistrement de naissance à l'étranger",
  "Dual nationality path": "Parcours de double nationalité",
  "Parent-chain first": "Documenter d'abord le parent",
  "Document the Mexican parent before applicant":
    "Documenter d'abord le parent mexicain",
  "Declaratoria / recovery": "Declaratoria / récupération",
  "Mexican by birth with pre-1998 foreign nationality issue":
    "Mexicain/e de naissance avec une question de nationalité étrangère avant 1998",
  Naturalization: "Naturalisation",
  "Carta de Naturalizacion path through SRE":
    "Parcours Carta de Naturalización auprès de la SRE",
  "Not eligible yet": "Pas encore éligible",
  "Build the missing residence, document, or timing prerequisite":
    "Compléter le prérequis manquant de résidence, document ou délai",
  "Manual review": "Examen manuel",
  "Consulate, SRE, civil registry, or legal review needed":
    "Examen du consulat, de la SRE, de l'état civil ou juridique requis",
  "SRE nationality and naturalization": "Nationalité et naturalisation SRE",
  "MiConsulado appointments": "Rendez-vous MiConsulado",
  "U.S. dual nationality guidance": "Guide américain sur la double nationalité",
  Identity: "Identité",
  Documents: "Documents",
  Applicant: "Demandeur",
  Location: "Lieu",
  "Born in Mexico": "Né/e au Mexique",
  "Mexican parent": "Parent mexicain",
  "Family record": "Dossier familial",
  "One step at a time": "Une étape à la fois",
  Question: "Question",
  of: "sur",
  answered: "répondues",
  Back: "Retour",
  Next: "Suivant",
  Done: "Terminer",
  Skip: "Passer",
  "Edit answers": "Modifier les réponses",
  "Jump to question": "Aller à la question",
  "Finish edits": "Terminer les modifications",
  Theme: "Thème",
  "Switch to dark mode": "Passer en mode sombre",
  "Switch to light mode": "Passer en mode clair",
  "Intake answered": "Questions répondues",
  Why: "Pourquoi",
  "Naturalization modality": "Modalité de naturalisation",
  "Resolve first": "À résoudre d'abord",
  Checklist: "Liste de tâches",
  "Critical warnings": "Avertissements importants",
  "Official references": "Références officielles",
  "Likely base route": "Parcours de base probable",
  "Find the route": "Trouver le parcours",
  "Answer more questions to narrow the route.":
    "Répondez à d'autres questions pour préciser le parcours.",
  "Complete the intake to generate a checklist.":
    "Terminez le questionnaire pour générer une liste de tâches.",
  "What is your current country of citizenship?":
    "Quel est votre pays de citoyenneté actuel ?",
  "This keeps the final warnings accurate. It does not decide the route by itself.":
    "Cela garde les avertissements finaux exacts. Cela ne décide pas le parcours à lui seul.",
  "Where were you born?": "Où êtes-vous né/e ?",
  "Birthplace is the first legal divider.":
    "Le lieu de naissance est la première distinction juridique.",
  "Do you already have any Mexican document?":
    "Avez-vous déjà un document mexicain ?",
  "Existing proof can turn this into a records or passport task instead of an acquisition task.":
    "Une preuve existante peut transformer cela en démarche de registre ou passeport plutôt qu'en acquisition.",
  "Are you applying for yourself or for a minor?":
    "Faites-vous la demande pour vous-même ou pour un mineur ?",
  "Which consulate or Mexican state will handle the case?":
    "Quel consulat ou État mexicain traitera le dossier ?",
  "You can use a ZIP, preferred consulate, or Mexican state. Skip it if you do not know yet.":
    "Vous pouvez indiquer un code postal, un consulat préféré ou un État mexicain. Passez si vous ne savez pas encore.",
  "ZIP, preferred consulate, or Mexican state":
    "Code postal, consulat préféré ou État mexicain",
  "Were you registered with a Mexican civil registry?":
    "Avez-vous été enregistré/e auprès d'un registre civil mexicain ?",
  "Did you acquire another nationality before March 20, 1998?":
    "Avez-vous acquis une autre nationalité avant le 20 mars 1998 ?",
  "Is your Mexican birth certificate late-registered or inconsistent with your ID?":
    "Votre acte de naissance mexicain est-il tardif ou incohérent avec votre pièce d'identité ?",
  "Was at least one legal parent Mexican at or before your birth?":
    "Au moins un parent légal était-il mexicain avant ou au moment de votre naissance ?",
  "What proof does the Mexican parent have?":
    "Quelle preuve possède le parent mexicain ?",
  "Was the Mexican parent born in Mexico, born abroad, or naturalized Mexican?":
    "Le parent mexicain est-il né au Mexique, à l'étranger ou naturalisé mexicain ?",
  "Do parent names on your foreign birth certificate match the Mexican parent records?":
    "Les noms des parents sur votre acte étranger correspondent-ils aux registres mexicains ?",
  "Do you have a long-form certified birth certificate?":
    "Avez-vous un acte de naissance intégral certifié ?",
  "Were your parents married before your birth?":
    "Vos parents étaient-ils mariés avant votre naissance ?",
  "Is either parent deceased, absent, unavailable, or unwilling to participate?":
    "Un parent est-il décédé, absent, indisponible ou refuse-t-il de participer ?",
  "Are you over 18?": "Avez-vous plus de 18 ans ?",
  "Was your birth certificate issued outside the U.S. or in a language other than English/Spanish?":
    "Votre acte a-t-il été délivré hors des États-Unis ou dans une langue autre que l'anglais/l'espagnol ?",
  "Do you currently live in Mexico with legal resident status?":
    "Vivez-vous actuellement au Mexique avec un statut légal de résident ?",
  "How long have you had qualifying residence in Mexico?":
    "Depuis combien de temps avez-vous une résidence admissible au Mexique ?",
  "Is your resident card valid at least six months beyond filing and does it show CURP?":
    "Votre carte de résident est-elle valide au moins six mois après le dépôt et affiche-t-elle le CURP ?",
  "Is your INM-registered address the same as your application address?":
    "Votre adresse enregistrée auprès de l'INM est-elle la même que celle de la demande ?",
  "During the last two years of qualifying residence, how much time were you outside Mexico?":
    "Pendant les deux dernières années de résidence admissible, combien de temps avez-vous passé hors du Mexique ?",
  "Are you married to a Mexican citizen?":
    "Êtes-vous marié/e à un/e citoyen/ne mexicain/e ?",
  "Do you have a Mexican child by birth?":
    "Avez-vous un enfant mexicain de naissance ?",
  "Are you a direct descendant of a Mexican by birth?":
    "Êtes-vous descendant direct d'un/e Mexicain/e de naissance ?",
  "Are you originally from Latin America or the Iberian Peninsula?":
    "Êtes-vous originaire d'Amérique latine ou de la péninsule Ibérique ?",
  "Are you recognized as a refugee by COMAR?":
    "Êtes-vous reconnu/e réfugié/e par la COMAR ?",
  "Are you a minor adopted by Mexican citizens or under Mexican parental authority?":
    "Êtes-vous mineur/e adopté/e par des Mexicains ou sous autorité parentale mexicaine ?",
  "Have you performed distinguished services benefiting Mexico?":
    "Avez-vous rendu des services distingués au bénéfice du Mexique ?",
  "Do you have criminal history, pending charges, or a prison sentence in any country?":
    "Avez-vous un casier judiciaire, des charges pendantes ou une peine de prison dans un pays ?",
  "Can you speak Spanish and pass Mexican history/culture exams?":
    "Pouvez-vous parler espagnol et réussir les examens d'histoire/culture mexicaine ?",
  "Do you have a valid foreign passport with at least 45 business days of validity?":
    "Avez-vous un passeport étranger valide avec au moins 45 jours ouvrables de validité ?",
  "U.S.": "États-Unis",
  Mexico: "Mexique",
  Both: "Les deux",
  Other: "Autre",
  Multiple: "Multiples",
  "Other country": "Autre pays",
  "Mexican ship or aircraft": "Navire ou aéronef mexicain",
  Unknown: "Je ne sais pas",
  "Mexican birth certificate": "Acte de naissance mexicain",
  "Mexican passport": "Passeport mexicain",
  Matricula: "Matrícula",
  "Declaratoria / certificate": "Declaratoria / certificat",
  None: "Aucun",
  "Self, adult": "Moi, adulte",
  "Parent/guardian for child": "Parent/tuteur pour enfant",
  "Attorney/authorized person": "Avocat/personne autorisée",
  Yes: "Oui",
  No: "Non",
  "Not applicable": "Sans objet",
  "Yes, before March 20, 1998": "Oui, avant le 20 mars 1998",
  "Acquired after that date": "Acquise après cette date",
  Mother: "Mère",
  Father: "Père",
  "Parent became Mexican after my birth":
    "Mon parent est devenu mexicain après ma naissance",
  "Not sure": "Pas sûr/e",
  "Mexican birth acta": "Acte de naissance mexicain",
  "Born abroad": "Né/e à l'étranger",
  "Naturalized Mexican": "Mexicain/e naturalisé/e",
  "Accents, spelling, or order differ":
    "Accents, orthographe ou ordre différents",
  "Married surname issue": "Question de nom marital",
  "Yes, long-form certified": "Oui, intégral certifié",
  "Short abstract only": "Seulement un extrait court",
  "Hospital certificate only": "Seulement un certificat d'hôpital",
  "Yes, at least 6 months before birth":
    "Oui, au moins 6 mois avant la naissance",
  "Yes, but after birth or under 6 months":
    "Oui, mais après la naissance ou moins de 6 mois avant",
  "Yes, father": "Oui, père",
  "Yes, mother": "Oui, mère",
  "Non-U.S.": "Hors États-Unis",
  "Non-English": "Pas en anglais",
  "Permanent resident": "Résident permanent",
  "Temporary resident": "Résident temporaire",
  "Temporary student": "Étudiant résident temporaire",
  "Tourist/FMM": "Touriste/FMM",
  "5+ years": "5 ans ou plus",
  "2-5 years": "2 à 5 ans",
  "1-2 years": "1 à 2 ans",
  "Less than 1 year": "Moins d'un an",
  "None / no qualifying residence": "Aucune / pas de résidence admissible",
  "Not applicable / no qualifying residence yet":
    "Sans objet / pas encore de résidence admissible",
  "Under 6 months total": "Moins de 6 mois au total",
  "Over 6 months total": "Plus de 6 mois au total",
  Parent: "Parent",
  Grandparent: "Grand-parent",
  "Great-grandparent": "Arrière-grand-parent",
  "Formerly, now adult": "Auparavant, maintenant adulte",
  "Pending case": "Affaire pendante",
  Conviction: "Condamnation",
  "Sentence being served": "Peine en cours",
  Maybe: "Peut-être",
  "Exempt/minor/over 60/refugee": "Exempté/mineur/plus de 60/réfugié",
  "Recently renewed": "Renouvelé récemment",
  "Likely route": "Parcours probable",
  "Needs document review": "Examen documentaire requis",
  "Prerequisites or review needed": "Prérequis ou examen nécessaires",
  "5-year general residence": "Résidence générale de 5 ans",
  "Distinguished-service route": "Parcours services distingués",
  "1-year adoption / parental authority route":
    "Parcours de 1 an adoption / autorité parentale",
  "marriage to a Mexican citizen": "mariage avec un/e citoyen/ne mexicain/e",
  "Mexican child by birth": "enfant mexicain de naissance",
  "direct descent from Mexican by birth":
    "descendance directe d'un/e Mexicain/e de naissance",
  "Latin American or Iberian origin": "origine latino-américaine ou ibérique",
  "recognized refugee checklist": "liste pour réfugié/e reconnu/e",
  "U.S. citizens generally do not automatically lose U.S. citizenship by acquiring another nationality, and U.S. dual nationals generally must use a U.S. passport to enter and leave the United States.":
    "Les citoyens américains ne perdent généralement pas automatiquement la citoyenneté américaine en acquérant une autre nationalité, et les doubles nationaux américains doivent généralement utiliser un passeport américain pour entrer et sortir des États-Unis.",
  "Mexicans by birth cannot be deprived of Mexican nationality.":
    "Les Mexicains de naissance ne peuvent pas être privés de la nationalité mexicaine.",
  "Naturalized Mexican nationality can be lost in specific situations, including voluntarily acquiring another foreign nationality, using a foreign passport as a Mexican in certain contexts, or residing abroad for five continuous years.":
    "La nationalité mexicaine par naturalisation peut être perdue dans certaines situations, notamment l'acquisition volontaire d'une autre nationalité, l'usage d'un passeport étranger comme Mexicain/e dans certains contextes ou la résidence à l'étranger pendant cinq années continues.",
  "This tool is an eligibility guide, not a legal decision. SRE, consulates, and civil registry offices apply the final requirements.":
    "Cet outil est un guide d'éligibilité, pas une décision juridique. La SRE, les consulats et les registres civils appliquent les exigences finales.",
};

const JA_TEXT = {
  "Already Mexican by birth": "出生によりメキシコ国籍",
  "Document/passport path": "書類・パスポートの手続き",
  "Birth registration abroad": "国外出生登録",
  "Dual nationality path": "二重国籍の手続き",
  "Parent-chain first": "親の国籍証明を先に行う",
  "Document the Mexican parent before applicant":
    "申請者の前にメキシコ人の親を証明します",
  "Declaratoria / recovery": "Declaratoria / 回復",
  "Mexican by birth with pre-1998 foreign nationality issue":
    "1998年以前の外国国籍取得に関係する出生メキシコ人",
  Naturalization: "帰化",
  "Carta de Naturalizacion path through SRE":
    "SREでのCarta de Naturalización手続き",
  "Not eligible yet": "まだ対象外",
  "Build the missing residence, document, or timing prerequisite":
    "不足している居住・書類・時期の条件を整えます",
  "Manual review": "個別確認",
  "Consulate, SRE, civil registry, or legal review needed":
    "領事館、SRE、戸籍機関、または法律上の確認が必要です",
  "SRE nationality and naturalization": "SRE 国籍・帰化",
  "MiConsulado appointments": "MiConsulado 予約",
  "U.S. dual nationality guidance": "米国の二重国籍ガイダンス",
  Identity: "本人情報",
  Documents: "書類",
  Applicant: "申請者",
  Location: "取扱場所",
  "Born in Mexico": "メキシコ生まれ",
  "Mexican parent": "メキシコ人の親",
  "Family record": "家族記録",
  "One step at a time": "一問ずつ進みます",
  Question: "質問",
  of: "/",
  answered: "回答済み",
  Back: "戻る",
  Next: "次へ",
  Done: "完了",
  Skip: "スキップ",
  "Edit answers": "回答を編集",
  "Jump to question": "質問へ移動",
  "Finish edits": "編集を完了",
  Theme: "テーマ",
  "Switch to dark mode": "ダークモードに切り替え",
  "Switch to light mode": "ライトモードに切り替え",
  "Intake answered": "回答済み",
  Why: "理由",
  "Naturalization modality": "帰化の種類",
  "Resolve first": "先に解決",
  Checklist: "チェックリスト",
  "Critical warnings": "重要な注意",
  "Official references": "公式参照",
  "Likely base route": "想定される基本ルート",
  "Find the route": "ルートを判定",
  "Answer more questions to narrow the route.":
    "さらに質問に答えるとルートを絞り込めます。",
  "Complete the intake to generate a checklist.":
    "質問を完了するとチェックリストを作成します。",
  "What is your current country of citizenship?":
    "現在の国籍はどこの国ですか？",
  "This keeps the final warnings accurate. It does not decide the route by itself.":
    "最終的な注意事項を正確にするための質問です。これだけでルートは決まりません。",
  "Where were you born?": "どこで生まれましたか？",
  "Birthplace is the first legal divider.": "出生地は最初の法的な分岐点です。",
  "Do you already have any Mexican document?":
    "すでにメキシコの書類を持っていますか？",
  "Existing proof can turn this into a records or passport task instead of an acquisition task.":
    "既存の証明がある場合、国籍取得ではなく記録やパスポートの手続きになることがあります。",
  "Are you applying for yourself or for a minor?":
    "本人の申請ですか、未成年者の申請ですか？",
  "Which consulate or Mexican state will handle the case?":
    "どの領事館またはメキシコの州が担当しますか？",
  "You can use a ZIP, preferred consulate, or Mexican state. Skip it if you do not know yet.":
    "郵便番号、希望する領事館、またはメキシコの州を入力できます。まだ不明ならスキップしてください。",
  "ZIP, preferred consulate, or Mexican state":
    "郵便番号、希望領事館、またはメキシコの州",
  "Were you registered with a Mexican civil registry?":
    "メキシコの戸籍機関に登録されていますか？",
  "Did you acquire another nationality before March 20, 1998?":
    "1998年3月20日より前に別の国籍を取得しましたか？",
  "Is your Mexican birth certificate late-registered or inconsistent with your ID?":
    "メキシコ出生証明は遅延登録、またはIDと不一致がありますか？",
  "Was at least one legal parent Mexican at or before your birth?":
    "出生時またはそれ以前に、法律上の親の少なくとも一人がメキシコ人でしたか？",
  "What proof does the Mexican parent have?":
    "メキシコ人の親はどの証明を持っていますか？",
  "Was the Mexican parent born in Mexico, born abroad, or naturalized Mexican?":
    "その親はメキシコ生まれ、国外生まれ、または帰化メキシコ人ですか？",
  "Do parent names on your foreign birth certificate match the Mexican parent records?":
    "外国の出生証明にある親の名前は、メキシコ側の記録と一致しますか？",
  "Do you have a long-form certified birth certificate?":
    "詳細版の認証出生証明を持っていますか？",
  "Were your parents married before your birth?":
    "両親はあなたの出生前に結婚していましたか？",
  "Is either parent deceased, absent, unavailable, or unwilling to participate?":
    "親のどちらかが死亡、不在、対応不能、または参加を拒否していますか？",
  "Are you over 18?": "18歳以上ですか？",
  "Was your birth certificate issued outside the U.S. or in a language other than English/Spanish?":
    "出生証明は米国外で発行、または英語/スペイン語以外ですか？",
  "Do you currently live in Mexico with legal resident status?":
    "現在、合法的な居住資格でメキシコに住んでいますか？",
  "How long have you had qualifying residence in Mexico?":
    "メキシコで対象となる居住期間はどのくらいですか？",
  "Is your resident card valid at least six months beyond filing and does it show CURP?":
    "居住カードは申請日から少なくとも6か月有効で、CURPが表示されていますか？",
  "Is your INM-registered address the same as your application address?":
    "INM登録住所は申請住所と同じですか？",
  "During the last two years of qualifying residence, how much time were you outside Mexico?":
    "対象となる居住の直近2年間で、メキシコ国外にいた期間はどのくらいですか？",
  "Are you married to a Mexican citizen?": "メキシコ国民と結婚していますか？",
  "Do you have a Mexican child by birth?":
    "出生によりメキシコ国籍の子どもがいますか？",
  "Are you a direct descendant of a Mexican by birth?":
    "出生メキシコ人の直系子孫ですか？",
  "Are you originally from Latin America or the Iberian Peninsula?":
    "ラテンアメリカまたはイベリア半島の出身ですか？",
  "Are you recognized as a refugee by COMAR?":
    "COMARにより難民認定を受けていますか？",
  "Are you a minor adopted by Mexican citizens or under Mexican parental authority?":
    "メキシコ国民に養子縁組された未成年、またはメキシコの親権下にありますか？",
  "Have you performed distinguished services benefiting Mexico?":
    "メキシコに利益をもたらす顕著な貢献をしましたか？",
  "Do you have criminal history, pending charges, or a prison sentence in any country?":
    "どこかの国で犯罪歴、係属中の起訴、または服役中の刑がありますか？",
  "Can you speak Spanish and pass Mexican history/culture exams?":
    "スペイン語を話し、メキシコ史・文化試験に合格できますか？",
  "Do you have a valid foreign passport with at least 45 business days of validity?":
    "少なくとも45営業日有効な外国旅券を持っていますか？",
  "U.S.": "米国",
  Mexico: "メキシコ",
  Both: "両方",
  Other: "その他",
  Multiple: "複数",
  "Other country": "その他の国",
  "Mexican ship or aircraft": "メキシコ船舶または航空機",
  Unknown: "不明",
  "Mexican birth certificate": "メキシコ出生証明",
  "Mexican passport": "メキシコ旅券",
  "Declaratoria / certificate": "Declaratoria / 証明書",
  None: "なし",
  "Self, adult": "本人、成人",
  "Parent/guardian for child": "子の親/保護者",
  "Attorney/authorized person": "弁護士/権限のある人",
  Yes: "はい",
  No: "いいえ",
  "Not applicable": "該当なし",
  "Yes, before March 20, 1998": "はい、1998年3月20日以前",
  "Acquired after that date": "その日以降に取得",
  Mother: "母",
  Father: "父",
  "Parent became Mexican after my birth": "親は私の出生後にメキシコ人になった",
  "Not sure": "わからない",
  "Mexican birth acta": "メキシコ出生記録",
  "Born abroad": "国外生まれ",
  "Naturalized Mexican": "帰化メキシコ人",
  "Accents, spelling, or order differ": "アクセント、綴り、順序が異なる",
  "Married surname issue": "婚姻姓の問題",
  "Yes, long-form certified": "はい、詳細版の認証書類",
  "Short abstract only": "短い抄本のみ",
  "Hospital certificate only": "病院証明のみ",
  "Yes, at least 6 months before birth": "はい、出生の少なくとも6か月前",
  "Yes, but after birth or under 6 months":
    "はい、ただし出生後または6か月未満前",
  "Yes, father": "はい、父",
  "Yes, mother": "はい、母",
  "Non-U.S.": "米国外",
  "Non-English": "英語以外",
  "Permanent resident": "永住者",
  "Temporary resident": "一時居住者",
  "Temporary student": "一時学生居住者",
  "Tourist/FMM": "観光/FMM",
  "5+ years": "5年以上",
  "2-5 years": "2〜5年",
  "1-2 years": "1〜2年",
  "Less than 1 year": "1年未満",
  "None / no qualifying residence": "なし / 対象となる居住なし",
  "Not applicable / no qualifying residence yet":
    "該当なし / まだ対象となる居住なし",
  "Under 6 months total": "合計6か月未満",
  "Over 6 months total": "合計6か月超",
  Parent: "親",
  Grandparent: "祖父母",
  "Great-grandparent": "曾祖父母",
  "Formerly, now adult": "以前該当、現在は成人",
  "Pending case": "係属中の事件",
  Conviction: "有罪判決",
  "Sentence being served": "服役中",
  Maybe: "たぶん",
  "Exempt/minor/over 60/refugee": "免除/未成年/60歳超/難民",
  "Recently renewed": "最近更新",
  "Likely route": "可能性の高いルート",
  "Needs document review": "書類確認が必要",
  "Prerequisites or review needed": "前提条件または確認が必要",
  "5-year general residence": "5年の一般居住ルート",
  "Distinguished-service route": "顕著な貢献ルート",
  "1-year adoption / parental authority route": "1年の養子/親権ルート",
  "marriage to a Mexican citizen": "メキシコ国民との婚姻",
  "Mexican child by birth": "出生メキシコ人の子",
  "direct descent from Mexican by birth": "出生メキシコ人からの直系血統",
  "Latin American or Iberian origin": "ラテンアメリカまたはイベリア出身",
  "recognized refugee checklist": "認定難民チェックリスト",
  "U.S. citizens generally do not automatically lose U.S. citizenship by acquiring another nationality, and U.S. dual nationals generally must use a U.S. passport to enter and leave the United States.":
    "米国市民は通常、別の国籍を取得しても自動的に米国市民権を失いません。米国の二重国籍者は通常、米国への出入国に米国旅券を使用する必要があります。",
  "Mexicans by birth cannot be deprived of Mexican nationality.":
    "出生によるメキシコ人はメキシコ国籍を剥奪されません。",
  "Naturalized Mexican nationality can be lost in specific situations, including voluntarily acquiring another foreign nationality, using a foreign passport as a Mexican in certain contexts, or residing abroad for five continuous years.":
    "帰化によるメキシコ国籍は、別の外国国籍を自発的に取得する、特定の場面で外国旅券を使う、国外に5年連続で居住するなどの場合に失われることがあります。",
  "This tool is an eligibility guide, not a legal decision. SRE, consulates, and civil registry offices apply the final requirements.":
    "このツールは資格の目安であり、法的判断ではありません。最終的な要件はSRE、領事館、戸籍機関が適用します。",
};

const HI_TEXT = {
  "Already Mexican by birth": "जन्म से मैक्सिकन",
  "Document/passport path": "दस्तावेज़/पासपोर्ट मार्ग",
  "Birth registration abroad": "विदेश में जन्म पंजीकरण",
  "Dual nationality path": "दोहरी नागरिकता मार्ग",
  "Parent-chain first": "पहले माता-पिता की श्रृंखला",
  "Document the Mexican parent before applicant":
    "आवेदक से पहले मैक्सिकन माता-पिता का दस्तावेज़ीकरण करें",
  "Declaratoria / recovery": "Declaratoria / पुनर्प्राप्ति",
  "Mexican by birth with pre-1998 foreign nationality issue":
    "जन्म से मैक्सिकन, 1998 से पहले विदेशी नागरिकता का मामला",
  Naturalization: "नैचुरलाइज़ेशन",
  "Carta de Naturalizacion path through SRE":
    "SRE के माध्यम से Carta de Naturalización मार्ग",
  "Not eligible yet": "अभी पात्र नहीं",
  "Build the missing residence, document, or timing prerequisite":
    "लापता निवास, दस्तावेज़ या समय-सीमा की शर्त पूरी करें",
  "Manual review": "मैनुअल समीक्षा",
  "Consulate, SRE, civil registry, or legal review needed":
    "कांसुलेट, SRE, सिविल रजिस्ट्री या कानूनी समीक्षा आवश्यक है",
  "SRE nationality and naturalization": "SRE राष्ट्रीयता और नैचुरलाइज़ेशन",
  "MiConsulado appointments": "MiConsulado अपॉइंटमेंट",
  "U.S. dual nationality guidance": "अमेरिकी दोहरी नागरिकता मार्गदर्शन",
  Identity: "पहचान",
  Documents: "दस्तावेज़",
  Applicant: "आवेदक",
  Location: "स्थान",
  "Born in Mexico": "मेक्सिको में जन्म",
  "Mexican parent": "मैक्सिकन माता-पिता",
  "Family record": "परिवार रिकॉर्ड",
  "One step at a time": "एक बार में एक सवाल",
  Question: "प्रश्न",
  of: "में से",
  answered: "उत्तर दिए गए",
  Back: "पीछे",
  Next: "आगे",
  Done: "पूर्ण",
  Skip: "छोड़ें",
  "Edit answers": "उत्तर संपादित करें",
  "Jump to question": "प्रश्न पर जाएँ",
  "Finish edits": "संपादन समाप्त करें",
  Theme: "थीम",
  "Switch to dark mode": "डार्क मोड पर जाएं",
  "Switch to light mode": "लाइट मोड पर जाएं",
  "Intake answered": "उत्तर पूरे हुए",
  Why: "क्यों",
  "Naturalization modality": "नैचुरलाइज़ेशन प्रकार",
  "Resolve first": "पहले हल करें",
  Checklist: "चेकलिस्ट",
  "Critical warnings": "महत्वपूर्ण चेतावनियां",
  "Official references": "आधिकारिक संदर्भ",
  "Likely base route": "संभावित आधार मार्ग",
  "Find the route": "मार्ग खोजें",
  "Answer more questions to narrow the route.":
    "मार्ग को संकीर्ण करने के लिए और प्रश्नों के उत्तर दें।",
  "Complete the intake to generate a checklist.":
    "चेकलिस्ट बनाने के लिए प्रश्नावली पूरी करें।",
  "What is your current country of citizenship?":
    "आपकी वर्तमान नागरिकता किस देश की है?",
  "This keeps the final warnings accurate. It does not decide the route by itself.":
    "यह अंतिम चेतावनियों को सटीक रखता है। यह अपने आप मार्ग तय नहीं करता।",
  "Where were you born?": "आपका जन्म कहां हुआ था?",
  "Birthplace is the first legal divider.": "जन्मस्थान पहला कानूनी विभाजन है।",
  "Do you already have any Mexican document?":
    "क्या आपके पास पहले से कोई मैक्सिकन दस्तावेज़ है?",
  "Existing proof can turn this into a records or passport task instead of an acquisition task.":
    "मौजूदा प्रमाण इसे नागरिकता प्राप्ति के बजाय रिकॉर्ड या पासपोर्ट कार्य बना सकता है।",
  "Are you applying for yourself or for a minor?":
    "क्या आप अपने लिए या किसी नाबालिग के लिए आवेदन कर रहे हैं?",
  "Which consulate or Mexican state will handle the case?":
    "कौन सा कांसुलेट या मैक्सिकन राज्य मामला संभालेगा?",
  "You can use a ZIP, preferred consulate, or Mexican state. Skip it if you do not know yet.":
    "आप ZIP, पसंदीदा कांसुलेट या मैक्सिकन राज्य दे सकते हैं। अभी नहीं जानते तो छोड़ दें।",
  "ZIP, preferred consulate, or Mexican state":
    "ZIP, पसंदीदा कांसुलेट, या मैक्सिकन राज्य",
  "Were you registered with a Mexican civil registry?":
    "क्या आपका पंजीकरण मैक्सिकन सिविल रजिस्ट्री में हुआ था?",
  "Did you acquire another nationality before March 20, 1998?":
    "क्या आपने 20 मार्च 1998 से पहले दूसरी राष्ट्रीयता प्राप्त की थी?",
  "Is your Mexican birth certificate late-registered or inconsistent with your ID?":
    "क्या आपका मैक्सिकन जन्म प्रमाणपत्र देर से पंजीकृत है या ID से मेल नहीं खाता?",
  "Was at least one legal parent Mexican at or before your birth?":
    "क्या जन्म के समय या उससे पहले आपके कम से कम एक कानूनी माता-पिता मैक्सिकन थे?",
  "What proof does the Mexican parent have?":
    "मैक्सिकन माता-पिता के पास कौन सा प्रमाण है?",
  "Was the Mexican parent born in Mexico, born abroad, or naturalized Mexican?":
    "मैक्सिकन माता-पिता मेक्सिको में जन्मे, विदेश में जन्मे, या नैचुरलाइज़्ड मैक्सिकन हैं?",
  "Do parent names on your foreign birth certificate match the Mexican parent records?":
    "क्या आपके विदेशी जन्म प्रमाणपत्र पर माता-पिता के नाम मैक्सिकन रिकॉर्ड से मिलते हैं?",
  "Do you have a long-form certified birth certificate?":
    "क्या आपके पास लंबा प्रमाणित जन्म प्रमाणपत्र है?",
  "Were your parents married before your birth?":
    "क्या आपके जन्म से पहले आपके माता-पिता विवाहित थे?",
  "Is either parent deceased, absent, unavailable, or unwilling to participate?":
    "क्या कोई माता-पिता दिवंगत, अनुपस्थित, अनुपलब्ध या भाग लेने को तैयार नहीं हैं?",
  "Are you over 18?": "क्या आप 18 से अधिक हैं?",
  "Was your birth certificate issued outside the U.S. or in a language other than English/Spanish?":
    "क्या जन्म प्रमाणपत्र अमेरिका से बाहर जारी हुआ या अंग्रेज़ी/स्पैनिश के अलावा किसी भाषा में है?",
  "Do you currently live in Mexico with legal resident status?":
    "क्या आप वर्तमान में कानूनी निवासी स्थिति के साथ मेक्सिको में रहते हैं?",
  "How long have you had qualifying residence in Mexico?":
    "मेक्सिको में आपकी पात्र निवास अवधि कितनी है?",
  "Is your resident card valid at least six months beyond filing and does it show CURP?":
    "क्या आपका निवासी कार्ड आवेदन के बाद कम से कम छह महीने वैध है और CURP दिखाता है?",
  "Is your INM-registered address the same as your application address?":
    "क्या INM में दर्ज पता आवेदन के पते जैसा है?",
  "During the last two years of qualifying residence, how much time were you outside Mexico?":
    "योग्य निवास के पिछले दो वर्षों में, आप मेक्सिको से बाहर कितने समय रहे?",
  "Are you married to a Mexican citizen?":
    "क्या आपकी शादी मैक्सिकन नागरिक से हुई है?",
  "Do you have a Mexican child by birth?":
    "क्या आपका जन्म से मैक्सिकन बच्चा है?",
  "Are you a direct descendant of a Mexican by birth?":
    "क्या आप जन्म से मैक्सिकन व्यक्ति के सीधे वंशज हैं?",
  "Are you originally from Latin America or the Iberian Peninsula?":
    "क्या आप मूल रूप से लैटिन अमेरिका या आइबेरियन प्रायद्वीप से हैं?",
  "Are you recognized as a refugee by COMAR?":
    "क्या COMAR ने आपको शरणार्थी मान्यता दी है?",
  "Are you a minor adopted by Mexican citizens or under Mexican parental authority?":
    "क्या आप मैक्सिकन नागरिकों द्वारा गोद लिए गए नाबालिग हैं या मैक्सिकन अभिभावक अधिकार के अंतर्गत हैं?",
  "Have you performed distinguished services benefiting Mexico?":
    "क्या आपने मेक्सिको के हित में विशिष्ट सेवाएं दी हैं?",
  "Do you have criminal history, pending charges, or a prison sentence in any country?":
    "क्या किसी देश में आपका आपराधिक इतिहास, लंबित आरोप या जेल सजा है?",
  "Can you speak Spanish and pass Mexican history/culture exams?":
    "क्या आप स्पैनिश बोल सकते हैं और मैक्सिकन इतिहास/संस्कृति परीक्षा पास कर सकते हैं?",
  "Do you have a valid foreign passport with at least 45 business days of validity?":
    "क्या आपके पास कम से कम 45 व्यावसायिक दिनों की वैधता वाला विदेशी पासपोर्ट है?",
  "U.S.": "अमेरिका",
  Mexico: "मेक्सिको",
  Both: "दोनों",
  Other: "अन्य",
  Multiple: "कई",
  "Other country": "अन्य देश",
  "Mexican ship or aircraft": "मैक्सिकन जहाज़ या विमान",
  Unknown: "पता नहीं",
  "Mexican birth certificate": "मैक्सिकन जन्म प्रमाणपत्र",
  "Mexican passport": "मैक्सिकन पासपोर्ट",
  "Declaratoria / certificate": "Declaratoria / प्रमाणपत्र",
  None: "कोई नहीं",
  "Self, adult": "स्वयं, वयस्क",
  "Parent/guardian for child": "बच्चे के माता-पिता/अभिभावक",
  "Attorney/authorized person": "वकील/अधिकृत व्यक्ति",
  Yes: "हां",
  No: "नहीं",
  "Not applicable": "लागू नहीं",
  "Yes, before March 20, 1998": "हां, 20 मार्च 1998 से पहले",
  "Acquired after that date": "उस तारीख के बाद प्राप्त",
  Mother: "माता",
  Father: "पिता",
  "Parent became Mexican after my birth":
    "मेरे जन्म के बाद माता-पिता मैक्सिकन बने",
  "Not sure": "निश्चित नहीं",
  "Mexican birth acta": "मैक्सिकन जन्म acta",
  "Born abroad": "विदेश में जन्म",
  "Naturalized Mexican": "नैचुरलाइज़्ड मैक्सिकन",
  "Accents, spelling, or order differ": "उच्चारण, वर्तनी या क्रम अलग है",
  "Married surname issue": "विवाहित उपनाम का मुद्दा",
  "Yes, long-form certified": "हां, लंबा प्रमाणित",
  "Short abstract only": "केवल छोटा सार",
  "Hospital certificate only": "केवल अस्पताल प्रमाणपत्र",
  "Yes, at least 6 months before birth": "हां, जन्म से कम से कम 6 महीने पहले",
  "Yes, but after birth or under 6 months":
    "हां, लेकिन जन्म के बाद या 6 महीने से कम पहले",
  "Yes, father": "हां, पिता",
  "Yes, mother": "हां, माता",
  "Non-U.S.": "अमेरिका के बाहर",
  "Non-English": "अंग्रेज़ी नहीं",
  "Permanent resident": "स्थायी निवासी",
  "Temporary resident": "अस्थायी निवासी",
  "Temporary student": "अस्थायी छात्र निवासी",
  "Tourist/FMM": "पर्यटक/FMM",
  "5+ years": "5+ वर्ष",
  "2-5 years": "2-5 वर्ष",
  "1-2 years": "1-2 वर्ष",
  "Less than 1 year": "1 वर्ष से कम",
  "None / no qualifying residence": "कोई नहीं / योग्य निवास नहीं",
  "Not applicable / no qualifying residence yet":
    "लागू नहीं / अभी योग्य निवास नहीं",
  "Under 6 months total": "कुल 6 महीने से कम",
  "Over 6 months total": "कुल 6 महीने से अधिक",
  Parent: "माता-पिता",
  Grandparent: "दादा-दादी/नाना-नानी",
  "Great-grandparent": "परदादा/परनाना",
  "Formerly, now adult": "पहले, अब वयस्क",
  "Pending case": "लंबित मामला",
  Conviction: "दोषसिद्धि",
  "Sentence being served": "सजा चल रही है",
  Maybe: "शायद",
  "Exempt/minor/over 60/refugee": "छूट/नाबालिग/60 से अधिक/शरणार्थी",
  "Recently renewed": "हाल ही में नवीनीकृत",
  "Likely route": "संभावित मार्ग",
  "Needs document review": "दस्तावेज़ समीक्षा चाहिए",
  "Prerequisites or review needed": "पूर्व-शर्तें या समीक्षा चाहिए",
  "5-year general residence": "5-वर्षीय सामान्य निवास",
  "Distinguished-service route": "विशिष्ट सेवा मार्ग",
  "1-year adoption / parental authority route":
    "1-वर्षीय गोद/अभिभावक अधिकार मार्ग",
  "marriage to a Mexican citizen": "मैक्सिकन नागरिक से विवाह",
  "Mexican child by birth": "जन्म से मैक्सिकन बच्चा",
  "direct descent from Mexican by birth": "जन्म से मैक्सिकन से सीधा वंश",
  "Latin American or Iberian origin": "लैटिन अमेरिकी या आइबेरियन मूल",
  "recognized refugee checklist": "मान्यता प्राप्त शरणार्थी चेकलिस्ट",
  "U.S. citizens generally do not automatically lose U.S. citizenship by acquiring another nationality, and U.S. dual nationals generally must use a U.S. passport to enter and leave the United States.":
    "अमेरिकी नागरिक आम तौर पर दूसरी राष्ट्रीयता प्राप्त करने से स्वतः अमेरिकी नागरिकता नहीं खोते, और अमेरिकी दोहरी नागरिकता वाले लोगों को आम तौर पर अमेरिका में प्रवेश और निकास के लिए अमेरिकी पासपोर्ट उपयोग करना होता है।",
  "Mexicans by birth cannot be deprived of Mexican nationality.":
    "जन्म से मैक्सिकन लोगों को मैक्सिकन राष्ट्रीयता से वंचित नहीं किया जा सकता।",
  "Naturalized Mexican nationality can be lost in specific situations, including voluntarily acquiring another foreign nationality, using a foreign passport as a Mexican in certain contexts, or residing abroad for five continuous years.":
    "नैचुरलाइज़्ड मैक्सिकन राष्ट्रीयता कुछ स्थितियों में खो सकती है, जैसे स्वेच्छा से दूसरी विदेशी राष्ट्रीयता लेना, कुछ संदर्भों में मैक्सिकन के रूप में विदेशी पासपोर्ट उपयोग करना, या लगातार पांच वर्ष विदेश में रहना।",
  "This tool is an eligibility guide, not a legal decision. SRE, consulates, and civil registry offices apply the final requirements.":
    "यह टूल पात्रता गाइड है, कानूनी निर्णय नहीं। अंतिम आवश्यकताएं SRE, कांसुलेट और सिविल रजिस्ट्री कार्यालय लागू करते हैं।",
};

const AR_TEXT = {
  "Already Mexican by birth": "مكسيكي/ة بالميلاد",
  "Document/passport path": "مسار الوثائق وجواز السفر",
  "Birth registration abroad": "تسجيل الميلاد في الخارج",
  "Dual nationality path": "مسار الجنسية المزدوجة",
  "Parent-chain first": "توثيق سلسلة الوالد أولا",
  "Document the Mexican parent before applicant":
    "وثق الوالد المكسيكي قبل مقدم الطلب",
  "Declaratoria / recovery": "إقرار / استرداد",
  "Mexican by birth with pre-1998 foreign nationality issue":
    "مكسيكي/ة بالميلاد مع مسألة جنسية أجنبية قبل 1998",
  Naturalization: "التجنس",
  "Carta de Naturalizacion path through SRE":
    "مسار Carta de Naturalización عبر SRE",
  "Not eligible yet": "غير مؤهل بعد",
  "Build the missing residence, document, or timing prerequisite":
    "استكمل شرط الإقامة أو الوثيقة أو التوقيت الناقص",
  "Manual review": "مراجعة يدوية",
  "Consulate, SRE, civil registry, or legal review needed":
    "تحتاج مراجعة القنصلية أو SRE أو السجل المدني أو مراجعة قانونية",
  "SRE nationality and naturalization": "الجنسية والتجنس لدى SRE",
  "MiConsulado appointments": "مواعيد MiConsulado",
  "U.S. dual nationality guidance":
    "إرشادات الولايات المتحدة حول الجنسية المزدوجة",
  Identity: "الهوية",
  Documents: "الوثائق",
  Applicant: "مقدم الطلب",
  Location: "المكان",
  "Born in Mexico": "مولود/ة في المكسيك",
  "Mexican parent": "والد مكسيكي",
  "Family record": "سجل الأسرة",
  "One step at a time": "سؤال واحد في كل مرة",
  Question: "سؤال",
  of: "من",
  answered: "تمت الإجابة",
  Back: "رجوع",
  Next: "التالي",
  Done: "تم",
  Skip: "تخطي",
  "Edit answers": "تعديل الإجابات",
  "Jump to question": "انتقل إلى السؤال",
  "Finish edits": "إنهاء التعديلات",
  Theme: "المظهر",
  "Switch to dark mode": "التبديل إلى الوضع الداكن",
  "Switch to light mode": "التبديل إلى الوضع الفاتح",
  "Intake answered": "الإجابات المكتملة",
  Why: "لماذا",
  "Naturalization modality": "نوع التجنس",
  "Resolve first": "حل أولا",
  Checklist: "قائمة المهام",
  "Critical warnings": "تحذيرات مهمة",
  "Official references": "مراجع رسمية",
  "Likely base route": "المسار الأساسي المحتمل",
  "Find the route": "اعثر على المسار",
  "Answer more questions to narrow the route.":
    "أجب عن أسئلة أخرى لتضييق المسار.",
  "Complete the intake to generate a checklist.":
    "أكمل الأسئلة لإنشاء قائمة مهام.",
  "What is your current country of citizenship?": "ما بلد جنسيتك الحالية؟",
  "This keeps the final warnings accurate. It does not decide the route by itself.":
    "هذا يحافظ على دقة التحذيرات النهائية. لا يحدد المسار وحده.",
  "Where were you born?": "أين ولدت؟",
  "Birthplace is the first legal divider.": "مكان الميلاد هو أول فاصل قانوني.",
  "Do you already have any Mexican document?":
    "هل لديك بالفعل أي وثيقة مكسيكية؟",
  "Existing proof can turn this into a records or passport task instead of an acquisition task.":
    "قد يحول الدليل الموجود هذا إلى مهمة سجلات أو جواز سفر بدلا من اكتساب الجنسية.",
  "Are you applying for yourself or for a minor?": "هل تقدم لنفسك أم لقاصر؟",
  "Which consulate or Mexican state will handle the case?":
    "أي قنصلية أو ولاية مكسيكية ستتعامل مع الحالة؟",
  "You can use a ZIP, preferred consulate, or Mexican state. Skip it if you do not know yet.":
    "يمكنك استخدام الرمز البريدي أو القنصلية المفضلة أو الولاية المكسيكية. تخط إذا كنت لا تعرف بعد.",
  "ZIP, preferred consulate, or Mexican state":
    "رمز بريدي، قنصلية مفضلة، أو ولاية مكسيكية",
  "Were you registered with a Mexican civil registry?":
    "هل تم تسجيلك في سجل مدني مكسيكي؟",
  "Did you acquire another nationality before March 20, 1998?":
    "هل حصلت على جنسية أخرى قبل 20 مارس 1998؟",
  "Is your Mexican birth certificate late-registered or inconsistent with your ID?":
    "هل شهادة ميلادك المكسيكية مسجلة متأخرة أو لا تطابق هويتك؟",
  "Was at least one legal parent Mexican at or before your birth?":
    "هل كان أحد الوالدين القانونيين على الأقل مكسيكيا عند ميلادك أو قبله؟",
  "What proof does the Mexican parent have?":
    "ما الدليل الذي يملكه الوالد المكسيكي؟",
  "Was the Mexican parent born in Mexico, born abroad, or naturalized Mexican?":
    "هل ولد الوالد المكسيكي في المكسيك أو في الخارج أو تجنس مكسيكيا؟",
  "Do parent names on your foreign birth certificate match the Mexican parent records?":
    "هل تتطابق أسماء الوالدين في شهادة ميلادك الأجنبية مع السجلات المكسيكية؟",
  "Do you have a long-form certified birth certificate?":
    "هل لديك شهادة ميلاد كاملة ومعتمدة؟",
  "Were your parents married before your birth?":
    "هل كان والداك متزوجين قبل ميلادك؟",
  "Is either parent deceased, absent, unavailable, or unwilling to participate?":
    "هل أحد الوالدين متوفى أو غائب أو غير متاح أو غير راغب في المشاركة؟",
  "Are you over 18?": "هل عمرك أكثر من 18؟",
  "Was your birth certificate issued outside the U.S. or in a language other than English/Spanish?":
    "هل صدرت شهادة الميلاد خارج الولايات المتحدة أو بلغة غير الإنجليزية/الإسبانية؟",
  "Do you currently live in Mexico with legal resident status?":
    "هل تعيش حاليا في المكسيك بوضع إقامة قانوني؟",
  "How long have you had qualifying residence in Mexico?":
    "منذ متى لديك إقامة مؤهلة في المكسيك؟",
  "Is your resident card valid at least six months beyond filing and does it show CURP?":
    "هل بطاقة إقامتك صالحة لستة أشهر على الأقل بعد التقديم وتظهر CURP؟",
  "Is your INM-registered address the same as your application address?":
    "هل عنوانك المسجل لدى INM هو نفسه عنوان الطلب؟",
  "During the last two years of qualifying residence, how much time were you outside Mexico?":
    "خلال آخر سنتين من الإقامة المؤهلة، كم قضيت من الوقت خارج المكسيك؟",
  "Are you married to a Mexican citizen?":
    "هل أنت متزوج/ة من مواطن/ة مكسيكي/ة؟",
  "Do you have a Mexican child by birth?": "هل لديك طفل مكسيكي بالميلاد؟",
  "Are you a direct descendant of a Mexican by birth?":
    "هل أنت من نسل مباشر لشخص مكسيكي بالميلاد؟",
  "Are you originally from Latin America or the Iberian Peninsula?":
    "هل أصلك من أمريكا اللاتينية أو شبه الجزيرة الإيبيرية؟",
  "Are you recognized as a refugee by COMAR?": "هل تعترف بك COMAR كلاجئ؟",
  "Are you a minor adopted by Mexican citizens or under Mexican parental authority?":
    "هل أنت قاصر متبنى من مواطنين مكسيكيين أو تحت السلطة الأبوية المكسيكية؟",
  "Have you performed distinguished services benefiting Mexico?":
    "هل قدمت خدمات متميزة تفيد المكسيك؟",
  "Do you have criminal history, pending charges, or a prison sentence in any country?":
    "هل لديك سجل جنائي أو تهم معلقة أو حكم بالسجن في أي بلد؟",
  "Can you speak Spanish and pass Mexican history/culture exams?":
    "هل يمكنك التحدث بالإسبانية واجتياز اختبارات تاريخ/ثقافة المكسيك؟",
  "Do you have a valid foreign passport with at least 45 business days of validity?":
    "هل لديك جواز سفر أجنبي صالح لمدة لا تقل عن 45 يوم عمل؟",
  "U.S.": "الولايات المتحدة",
  Mexico: "المكسيك",
  Both: "كلاهما",
  Other: "أخرى",
  Multiple: "متعددة",
  "Other country": "بلد آخر",
  "Mexican ship or aircraft": "سفينة أو طائرة مكسيكية",
  Unknown: "لا أعرف",
  "Mexican birth certificate": "شهادة ميلاد مكسيكية",
  "Mexican passport": "جواز سفر مكسيكي",
  "Declaratoria / certificate": "إقرار / شهادة",
  None: "لا شيء",
  "Self, adult": "أنا، بالغ/ة",
  "Parent/guardian for child": "والد/وصي لطفل",
  "Attorney/authorized person": "محام/شخص مخول",
  Yes: "نعم",
  No: "لا",
  "Not applicable": "لا ينطبق",
  "Yes, before March 20, 1998": "نعم، قبل 20 مارس 1998",
  "Acquired after that date": "تم الحصول عليها بعد ذلك التاريخ",
  Mother: "الأم",
  Father: "الأب",
  "Parent became Mexican after my birth": "أصبح الوالد مكسيكيا بعد ولادتي",
  "Not sure": "لست متأكدا",
  "Mexican birth acta": "سجل ميلاد مكسيكي",
  "Born abroad": "مولود/ة في الخارج",
  "Naturalized Mexican": "مكسيكي/ة بالتجنس",
  "Accents, spelling, or order differ": "تختلف اللكنات أو الإملاء أو الترتيب",
  "Married surname issue": "مسألة اسم العائلة بعد الزواج",
  "Yes, long-form certified": "نعم، كاملة ومعتمدة",
  "Short abstract only": "ملخص قصير فقط",
  "Hospital certificate only": "شهادة مستشفى فقط",
  "Yes, at least 6 months before birth": "نعم، قبل الميلاد بستة أشهر على الأقل",
  "Yes, but after birth or under 6 months":
    "نعم، لكن بعد الميلاد أو قبل أقل من 6 أشهر",
  "Yes, father": "نعم، الأب",
  "Yes, mother": "نعم، الأم",
  "Non-U.S.": "خارج الولايات المتحدة",
  "Non-English": "ليست بالإنجليزية",
  "Permanent resident": "مقيم دائم",
  "Temporary resident": "مقيم مؤقت",
  "Temporary student": "طالب مقيم مؤقت",
  "Tourist/FMM": "سائح/FMM",
  "5+ years": "5 سنوات أو أكثر",
  "2-5 years": "2-5 سنوات",
  "1-2 years": "1-2 سنة",
  "Less than 1 year": "أقل من سنة",
  "None / no qualifying residence": "لا يوجد / لا إقامة مؤهلة",
  "Not applicable / no qualifying residence yet":
    "لا ينطبق / لا توجد إقامة مؤهلة بعد",
  "Under 6 months total": "أقل من 6 أشهر إجمالا",
  "Over 6 months total": "أكثر من 6 أشهر إجمالا",
  Parent: "والد/والدة",
  Grandparent: "جد/جدة",
  "Great-grandparent": "جد/جدة أكبر",
  "Formerly, now adult": "سابقا، والآن بالغ/ة",
  "Pending case": "قضية معلقة",
  Conviction: "إدانة",
  "Sentence being served": "تنفيذ حكم",
  Maybe: "ربما",
  "Exempt/minor/over 60/refugee": "معفى/قاصر/فوق 60/لاجئ",
  "Recently renewed": "مجدد حديثا",
  "Likely route": "المسار المحتمل",
  "Needs document review": "يحتاج مراجعة الوثائق",
  "Prerequisites or review needed": "تحتاج شروطا مسبقة أو مراجعة",
  "5-year general residence": "إقامة عامة 5 سنوات",
  "Distinguished-service route": "مسار الخدمات المتميزة",
  "1-year adoption / parental authority route":
    "مسار سنة واحدة للتبني / السلطة الأبوية",
  "marriage to a Mexican citizen": "الزواج من مواطن/ة مكسيكي/ة",
  "Mexican child by birth": "طفل مكسيكي بالميلاد",
  "direct descent from Mexican by birth": "نسب مباشر من مكسيكي بالميلاد",
  "Latin American or Iberian origin": "أصل لاتيني أمريكي أو إيبيري",
  "recognized refugee checklist": "قائمة اللاجئ المعترف به",
  "U.S. citizens generally do not automatically lose U.S. citizenship by acquiring another nationality, and U.S. dual nationals generally must use a U.S. passport to enter and leave the United States.":
    "المواطنون الأمريكيون لا يفقدون عادة الجنسية الأمريكية تلقائيا عند الحصول على جنسية أخرى، ويجب على مزدوجي الجنسية الأمريكيين عادة استخدام جواز سفر أمريكي للدخول إلى الولايات المتحدة والخروج منها.",
  "Mexicans by birth cannot be deprived of Mexican nationality.":
    "لا يمكن حرمان المكسيكيين بالميلاد من الجنسية المكسيكية.",
  "Naturalized Mexican nationality can be lost in specific situations, including voluntarily acquiring another foreign nationality, using a foreign passport as a Mexican in certain contexts, or residing abroad for five continuous years.":
    "قد تفقد الجنسية المكسيكية بالتجنس في حالات محددة، منها اكتساب جنسية أجنبية أخرى طوعا، أو استخدام جواز سفر أجنبي كمكسيكي في بعض السياقات، أو الإقامة في الخارج خمس سنوات متواصلة.",
  "This tool is an eligibility guide, not a legal decision. SRE, consulates, and civil registry offices apply the final requirements.":
    "هذه الأداة دليل أهلية وليست قرارا قانونيا. تطبق SRE والقنصليات ومكاتب السجل المدني المتطلبات النهائية.",
};

const ZH_TEXT = {
  "Already Mexican by birth": "出生即为墨西哥国籍",
  "Document/passport path": "文件/护照路径",
  "Birth registration abroad": "海外出生登记",
  "Dual nationality path": "双重国籍路径",
  "Parent-chain first": "先证明父母链条",
  "Document the Mexican parent before applicant": "先为墨西哥籍父/母取得证明",
  "Declaratoria / recovery": "Declaratoria / 恢复",
  "Mexican by birth with pre-1998 foreign nationality issue":
    "出生即为墨西哥人，但有1998年前外国国籍问题",
  Naturalization: "入籍",
  "Carta de Naturalizacion path through SRE":
    "通过 SRE 申请 Carta de Naturalización",
  "Not eligible yet": "暂不符合条件",
  "Build the missing residence, document, or timing prerequisite":
    "先补齐居留、文件或时间要求",
  "Manual review": "人工审核",
  "Consulate, SRE, civil registry, or legal review needed":
    "需要领事馆、SRE、民事登记或法律审核",
  "SRE nationality and naturalization": "SRE 国籍与入籍",
  "MiConsulado appointments": "MiConsulado 预约",
  "U.S. dual nationality guidance": "美国双重国籍指南",
  Identity: "身份",
  Documents: "文件",
  Applicant: "申请人",
  Location: "办理地点",
  "Born in Mexico": "出生在墨西哥",
  "Mexican parent": "墨西哥籍父/母",
  "Family record": "家庭记录",
  "One step at a time": "一次一个问题",
  Question: "问题",
  of: "/",
  answered: "已回答",
  Back: "返回",
  Next: "下一步",
  Done: "完成",
  Skip: "跳过",
  "Edit answers": "编辑答案",
  "Jump to question": "跳到问题",
  "Finish edits": "完成编辑",
  Theme: "主题",
  "Switch to dark mode": "切换到深色模式",
  "Switch to light mode": "切换到浅色模式",
  "Intake answered": "已回答",
  Why: "原因",
  "Naturalization modality": "入籍类别",
  "Resolve first": "先解决",
  Checklist: "清单",
  "Critical warnings": "重要提醒",
  "Official references": "官方参考",
  "Likely base route": "可能的基础路径",
  "Find the route": "查找路径",
  "Answer more questions to narrow the route.": "回答更多问题以缩小路径范围。",
  "Complete the intake to generate a checklist.": "完成问卷以生成清单。",
  "What is your current country of citizenship?": "你目前是哪国公民？",
  "This keeps the final warnings accurate. It does not decide the route by itself.":
    "这会让最后提醒更准确，但不会单独决定路径。",
  "Where were you born?": "你出生在哪里？",
  "Birthplace is the first legal divider.": "出生地是第一项法律分界。",
  "Do you already have any Mexican document?": "你已经有任何墨西哥文件吗？",
  "Existing proof can turn this into a records or passport task instead of an acquisition task.":
    "已有证明可能让这变成记录或护照事项，而不是取得国籍事项。",
  "Are you applying for yourself or for a minor?":
    "你是为自己申请，还是为未成年人申请？",
  "Which consulate or Mexican state will handle the case?":
    "哪个领事馆或墨西哥州将处理此案？",
  "You can use a ZIP, preferred consulate, or Mexican state. Skip it if you do not know yet.":
    "可填写邮编、首选领事馆或墨西哥州。不确定可跳过。",
  "ZIP, preferred consulate, or Mexican state": "邮编、首选领事馆或墨西哥州",
  "Were you registered with a Mexican civil registry?":
    "你是否已在墨西哥民事登记处登记？",
  "Did you acquire another nationality before March 20, 1998?":
    "你是否在1998年3月20日前取得过另一国国籍？",
  "Is your Mexican birth certificate late-registered or inconsistent with your ID?":
    "你的墨西哥出生证明是否晚登记，或与身份证件不一致？",
  "Was at least one legal parent Mexican at or before your birth?":
    "你出生时或出生前，至少一名法律父/母是墨西哥人吗？",
  "What proof does the Mexican parent have?": "墨西哥籍父/母有什么证明？",
  "Was the Mexican parent born in Mexico, born abroad, or naturalized Mexican?":
    "该父/母是出生在墨西哥、出生在国外，还是归化为墨西哥人？",
  "Do parent names on your foreign birth certificate match the Mexican parent records?":
    "你的外国出生证明上的父母姓名是否与墨西哥记录一致？",
  "Do you have a long-form certified birth certificate?":
    "你有完整认证版出生证明吗？",
  "Were your parents married before your birth?":
    "你的父母在你出生前已结婚吗？",
  "Is either parent deceased, absent, unavailable, or unwilling to participate?":
    "父母中是否有人已故、缺席、无法参与或不愿参与？",
  "Are you over 18?": "你是否超过18岁？",
  "Was your birth certificate issued outside the U.S. or in a language other than English/Spanish?":
    "你的出生证明是否在美国以外签发，或不是英语/西班牙语？",
  "Do you currently live in Mexico with legal resident status?":
    "你目前是否以合法居民身份居住在墨西哥？",
  "How long have you had qualifying residence in Mexico?":
    "你在墨西哥已有多久符合条件的居留？",
  "Is your resident card valid at least six months beyond filing and does it show CURP?":
    "你的居留卡在提交后是否至少仍有效六个月，并显示 CURP？",
  "Is your INM-registered address the same as your application address?":
    "你在 INM 登记的地址是否与申请地址相同？",
  "During the last two years of qualifying residence, how much time were you outside Mexico?":
    "在符合条件居留的最近两年中，你在墨西哥境外待了多久？",
  "Are you married to a Mexican citizen?": "你是否与墨西哥公民结婚？",
  "Do you have a Mexican child by birth?": "你是否有出生即为墨西哥国籍的子女？",
  "Are you a direct descendant of a Mexican by birth?":
    "你是否是出生墨西哥人的直系后代？",
  "Are you originally from Latin America or the Iberian Peninsula?":
    "你是否原籍拉丁美洲或伊比利亚半岛？",
  "Are you recognized as a refugee by COMAR?": "你是否被 COMAR 认定为难民？",
  "Are you a minor adopted by Mexican citizens or under Mexican parental authority?":
    "你是否是被墨西哥公民收养的未成年人，或受墨西哥父母权管辖？",
  "Have you performed distinguished services benefiting Mexico?":
    "你是否做出过有益于墨西哥的杰出服务？",
  "Do you have criminal history, pending charges, or a prison sentence in any country?":
    "你在任何国家是否有犯罪记录、待审指控或服刑判决？",
  "Can you speak Spanish and pass Mexican history/culture exams?":
    "你是否会说西班牙语，并能通过墨西哥历史/文化考试？",
  "Do you have a valid foreign passport with at least 45 business days of validity?":
    "你是否有至少45个工作日有效期的外国护照？",
  "U.S.": "美国",
  Mexico: "墨西哥",
  Both: "两者",
  Other: "其他",
  Multiple: "多个",
  "Other country": "其他国家",
  "Mexican ship or aircraft": "墨西哥船舶或飞机",
  Unknown: "不确定",
  "Mexican birth certificate": "墨西哥出生证明",
  "Mexican passport": "墨西哥护照",
  "Declaratoria / certificate": "Declaratoria / 证明",
  None: "无",
  "Self, adult": "本人，成年人",
  "Parent/guardian for child": "儿童的父母/监护人",
  "Attorney/authorized person": "律师/授权人",
  Yes: "是",
  No: "否",
  "Not applicable": "不适用",
  "Yes, before March 20, 1998": "是，1998年3月20日前",
  "Acquired after that date": "该日期后取得",
  Mother: "母亲",
  Father: "父亲",
  "Parent became Mexican after my birth": "父/母在我出生后成为墨西哥人",
  "Not sure": "不确定",
  "Mexican birth acta": "墨西哥出生登记",
  "Born abroad": "出生在国外",
  "Naturalized Mexican": "归化墨西哥人",
  "Accents, spelling, or order differ": "重音、拼写或顺序不同",
  "Married surname issue": "婚后姓氏问题",
  "Yes, long-form certified": "是，完整认证版",
  "Short abstract only": "只有简短摘要",
  "Hospital certificate only": "只有医院证明",
  "Yes, at least 6 months before birth": "是，出生前至少6个月",
  "Yes, but after birth or under 6 months": "是，但在出生后或出生前不足6个月",
  "Yes, father": "是，父亲",
  "Yes, mother": "是，母亲",
  "Non-U.S.": "非美国",
  "Non-English": "非英语",
  "Permanent resident": "永久居民",
  "Temporary resident": "临时居民",
  "Temporary student": "临时学生居民",
  "Tourist/FMM": "游客/FMM",
  "5+ years": "5年以上",
  "2-5 years": "2-5年",
  "1-2 years": "1-2年",
  "Less than 1 year": "少于1年",
  "None / no qualifying residence": "无 / 没有符合条件的居留",
  "Not applicable / no qualifying residence yet":
    "不适用 / 尚无符合条件的居留",
  "Under 6 months total": "总计少于6个月",
  "Over 6 months total": "总计超过6个月",
  Parent: "父/母",
  Grandparent: "祖父母/外祖父母",
  "Great-grandparent": "曾祖父母/曾外祖父母",
  "Formerly, now adult": "曾经是，现在已成年",
  "Pending case": "待处理案件",
  Conviction: "定罪",
  "Sentence being served": "正在服刑",
  Maybe: "也许",
  "Exempt/minor/over 60/refugee": "豁免/未成年/60岁以上/难民",
  "Recently renewed": "近期更新",
  "Likely route": "可能路径",
  "Needs document review": "需要文件审核",
  "Prerequisites or review needed": "需要前置条件或审核",
  "5-year general residence": "5年一般居留",
  "Distinguished-service route": "杰出服务路径",
  "1-year adoption / parental authority route": "1年收养/父母权路径",
  "marriage to a Mexican citizen": "与墨西哥公民结婚",
  "Mexican child by birth": "出生墨西哥子女",
  "direct descent from Mexican by birth": "出生墨西哥人的直系后代",
  "Latin American or Iberian origin": "拉丁美洲或伊比利亚出身",
  "recognized refugee checklist": "获认定难民清单",
  "U.S. citizens generally do not automatically lose U.S. citizenship by acquiring another nationality, and U.S. dual nationals generally must use a U.S. passport to enter and leave the United States.":
    "美国公民通常不会因取得另一国国籍而自动失去美国国籍；美国双重国籍者通常必须使用美国护照进出美国。",
  "Mexicans by birth cannot be deprived of Mexican nationality.":
    "出生即为墨西哥国籍者不能被剥夺墨西哥国籍。",
  "Naturalized Mexican nationality can be lost in specific situations, including voluntarily acquiring another foreign nationality, using a foreign passport as a Mexican in certain contexts, or residing abroad for five continuous years.":
    "归化取得的墨西哥国籍在特定情况下可能丧失，包括自愿取得另一外国国籍、在某些情境下以墨西哥人身份使用外国护照，或连续在国外居住五年。",
  "This tool is an eligibility guide, not a legal decision. SRE, consulates, and civil registry offices apply the final requirements.":
    "本工具是资格指南，不是法律决定。最终要求由 SRE、领事馆和民事登记机构适用。",
};

Object.assign(PT_TEXT, {
  "Waiting for birthplace": "Aguardando local de nascimento",
  "Start with birthplace and existing Mexican records.":
    "Comece pelo local de nascimento e pelos registros mexicanos existentes.",
  "Confirm where the applicant was born.":
    "Confirme onde a pessoa solicitante nasceu.",
  "You already have a Mexican nationality document on the record.":
    "Você já tem um documento de nacionalidade mexicana registrado.",
  "Get certified copies of the Mexican acta or document if needed.":
    "Obtenha cópias certificadas da acta ou documento mexicano, se necessário.",
  "Confirm CURP and name consistency across IDs.":
    "Confirme o CURP e a consistência dos nomes nas identificações.",
  "Schedule passport, matricula, INE, or record-correction steps as applicable.":
    "Agende passaporte, matrícula, INE ou correção de registros conforme aplicável.",
  "People born in Mexico are Mexican by birth.":
    "Pessoas nascidas no México são mexicanas por nascimento.",
  "Locate or obtain a certified Mexican birth acta.":
    "Localize ou obtenha uma acta mexicana de nascimento certificada.",
  "Confirm CURP and fix record errors before passport or ID appointment.":
    "Confirme o CURP e corrija erros antes da cita de passaporte ou identificação.",
  "Apply for Mexican passport, matricula, INE, or other ID.":
    "Solicite passaporte mexicano, matrícula, INE ou outra identificação.",
  "Born in Mexico, but foreign nationality was acquired before March 20, 1998.":
    "Nasceu no México, mas adquiriu nacionalidade estrangeira antes de 20 de março de 1998.",
  "Prepare Mexican birth acta.": "Prepare a acta mexicana de nascimento.",
  "Gather proof of foreign naturalization with apostille if required.":
    "Reúna prova de naturalização estrangeira com apostila, se exigida.",
  "Gather ID, photos, and name-change or marriage records.":
    "Reúna identificação, fotos e registros de mudança de nome ou casamento.",
  "At least one legal parent was Mexican at or before the applicant's birth.":
    "Ao menos um pai legal era mexicano antes ou no nascimento do solicitante.",
  "Use MiConsulado and choose civil registry / birth registration, not passport.":
    "Use MiConsulado e escolha registro civil / registro de nascimento, não passaporte.",
  "Bring the applicant's long-form certified birth certificate.":
    "Leve a certidão de nascimento completa e certificada do solicitante.",
  "Bring the Mexican parent's acta, passport, Carta de Naturalizacion, or declaratoria as applicable.":
    "Leve a acta, passaporte, Carta de Naturalización ou declaratória do pai/mãe mexicano/a, conforme aplicável.",
  "Bring parent IDs, marriage/name-change records, and witnesses if the consulate requires them.":
    "Leve IDs dos pais, registros de casamento/mudança de nome e testemunhas se o consulado exigir.",
  "After the Mexican acta is issued, confirm CURP and schedule a Mexican passport appointment.":
    "Depois que a acta mexicana for emitida, confirme o CURP e agende o passaporte mexicano.",
  "The parent link may qualify, but the Mexican parent must be documented first.":
    "O vínculo parental pode qualificar, mas o pai/mãe mexicano/a deve ser documentado primeiro.",
  "Find or request the parent's Mexican birth acta, declaratoria, or Carta de Naturalizacion.":
    "Encontre ou solicite a acta mexicana, declaratória ou Carta de Naturalización do pai/mãe.",
  "If the parent was born abroad and never registered, document the parent first.":
    "Se o pai/mãe nasceu no exterior e nunca foi registrado, documente-o primeiro.",
  "Then reopen the applicant's birth registration checklist.":
    "Depois retome a lista de registro de nascimento do solicitante.",
  "Parent names do not clearly match across birth and Mexican records.":
    "Os nomes dos pais não coincidem claramente entre os registros de nascimento e mexicanos.",
  "Applicant does not yet have a long-form certified birth certificate.":
    "O solicitante ainda não tem certidão de nascimento completa e certificada.",
  "Order the long-form certified birth certificate before attending.":
    "Solicite a certidão completa certificada antes de comparecer.",
  "Naturalization generally requires temporary or permanent resident status.":
    "A naturalização geralmente exige status de residente temporário ou permanente.",
  "Five or more years of qualifying residence can support the general route.":
    "Cinco anos ou mais de residência qualificada podem sustentar a rota geral.",
  "Confirm resident card is valid at least six months beyond the filing date and shows CURP.":
    "Confirme que o cartão de residente seja válido por pelo menos seis meses após a data do pedido e mostre CURP.",
  "Make sure the DNN-3 address matches the INM-registered address.":
    "Garanta que o endereço no DNN-3 corresponda ao registrado no INM.",
  "Prepare DNN-3, resident card, full passport copies, entries/exits letter, CURP, photos, payment, and criminal-record certificates.":
    "Prepare DNN-3, cartão de residente, cópias completas do passaporte, carta de entradas/saídas, CURP, fotos, pagamento e certidões criminais.",
  "Gather modality proof such as marriage acta, child's Mexican acta, descent records, origin-country birth certificate, COMAR letter, or custody/adoption records.":
    "Reúna provas da modalidade, como acta de casamento, acta mexicana de filho, registros de descendência, certidão do país de origem, carta COMAR ou registros de custódia/adoção.",
  "Study for Spanish, Mexican history, and culture exams unless an exception applies.":
    "Estude para exames de espanhol, história e cultura mexicana, salvo exceção.",
  "Adoption or Mexican parental authority can support a one-year route with custody review.":
    "Adoção ou autoridade parental mexicana pode apoiar uma rota de um ano com revisão de custódia.",
});

Object.assign(IT_TEXT, {
  "Waiting for birthplace": "In attesa del luogo di nascita",
  "Start with birthplace and existing Mexican records.":
    "Inizia dal luogo di nascita e dai registri messicani esistenti.",
  "Confirm where the applicant was born.":
    "Conferma dove è nato/a il richiedente.",
  "You already have a Mexican nationality document on the record.":
    "Hai già un documento di nazionalità messicana registrato.",
  "Get certified copies of the Mexican acta or document if needed.":
    "Ottieni copie certificate dell'atto o documento messicano se necessario.",
  "Confirm CURP and name consistency across IDs.":
    "Conferma CURP e coerenza dei nomi tra i documenti.",
  "Schedule passport, matricula, INE, or record-correction steps as applicable.":
    "Prenota passaporto, matrícula, INE o correzione registri secondo il caso.",
  "People born in Mexico are Mexican by birth.":
    "Le persone nate in Messico sono messicane per nascita.",
  "Locate or obtain a certified Mexican birth acta.":
    "Trova o ottieni un atto di nascita messicano certificato.",
  "Confirm CURP and fix record errors before passport or ID appointment.":
    "Conferma il CURP e correggi errori prima dell'appuntamento per passaporto o ID.",
  "Apply for Mexican passport, matricula, INE, or other ID.":
    "Richiedi passaporto messicano, matrícula, INE o altro documento.",
  "Born in Mexico, but foreign nationality was acquired before March 20, 1998.":
    "Nato/a in Messico, ma la nazionalità straniera è stata acquisita prima del 20 marzo 1998.",
  "Prepare Mexican birth acta.": "Prepara l'atto di nascita messicano.",
  "Gather proof of foreign naturalization with apostille if required.":
    "Raccogli prova di naturalizzazione straniera con apostille se richiesta.",
  "Gather ID, photos, and name-change or marriage records.":
    "Raccogli documento, foto e registri di cambio nome o matrimonio.",
  "At least one legal parent was Mexican at or before the applicant's birth.":
    "Almeno un genitore legale era messicano prima o al momento della nascita.",
  "Use MiConsulado and choose civil registry / birth registration, not passport.":
    "Usa MiConsulado e scegli registro civile / registrazione nascita, non passaporto.",
  "Bring the applicant's long-form certified birth certificate.":
    "Porta il certificato di nascita integrale certificato del richiedente.",
  "Bring the Mexican parent's acta, passport, Carta de Naturalizacion, or declaratoria as applicable.":
    "Porta atto, passaporto, Carta de Naturalización o declaratoria del genitore messicano, secondo il caso.",
  "Bring parent IDs, marriage/name-change records, and witnesses if the consulate requires them.":
    "Porta documenti dei genitori, registri di matrimonio/cambio nome e testimoni se richiesti.",
  "After the Mexican acta is issued, confirm CURP and schedule a Mexican passport appointment.":
    "Dopo l'emissione dell'atto messicano, conferma il CURP e prenota il passaporto.",
  "The parent link may qualify, but the Mexican parent must be documented first.":
    "Il legame parentale può qualificare, ma il genitore messicano va documentato prima.",
  "Find or request the parent's Mexican birth acta, declaratoria, or Carta de Naturalizacion.":
    "Trova o richiedi l'atto messicano, la declaratoria o la Carta de Naturalización del genitore.",
  "If the parent was born abroad and never registered, document the parent first.":
    "Se il genitore è nato all'estero e non è mai stato registrato, documentalo prima.",
  "Then reopen the applicant's birth registration checklist.":
    "Poi riapri la checklist di registrazione nascita del richiedente.",
  "Parent names do not clearly match across birth and Mexican records.":
    "I nomi dei genitori non coincidono chiaramente tra registri di nascita e messicani.",
  "Applicant does not yet have a long-form certified birth certificate.":
    "Il richiedente non ha ancora un certificato di nascita integrale certificato.",
  "Order the long-form certified birth certificate before attending.":
    "Richiedi il certificato integrale certificato prima dell'appuntamento.",
  "Naturalization generally requires temporary or permanent resident status.":
    "La naturalizzazione richiede generalmente status di residente temporaneo o permanente.",
  "Five or more years of qualifying residence can support the general route.":
    "Cinque o più anni di residenza qualificante possono sostenere il percorso generale.",
  "Confirm resident card is valid at least six months beyond the filing date and shows CURP.":
    "Conferma che la carta di residente sia valida almeno sei mesi dopo il deposito e mostri il CURP.",
  "Make sure the DNN-3 address matches the INM-registered address.":
    "Assicurati che l'indirizzo DNN-3 coincida con quello registrato presso INM.",
  "Prepare DNN-3, resident card, full passport copies, entries/exits letter, CURP, photos, payment, and criminal-record certificates.":
    "Prepara DNN-3, carta di residente, copie complete del passaporto, lettera ingressi/uscite, CURP, foto, pagamento e certificati penali.",
  "Gather modality proof such as marriage acta, child's Mexican acta, descent records, origin-country birth certificate, COMAR letter, or custody/adoption records.":
    "Raccogli prove della modalità: atto di matrimonio, atto messicano del figlio, registri di discendenza, certificato del paese d'origine, lettera COMAR o registri custodia/adozione.",
  "Study for Spanish, Mexican history, and culture exams unless an exception applies.":
    "Studia per gli esami di spagnolo, storia e cultura messicana salvo eccezioni.",
  "Adoption or Mexican parental authority can support a one-year route with custody review.":
    "Adozione o potestà genitoriale messicana può sostenere un percorso di un anno con revisione della custodia.",
});

Object.assign(FR_TEXT, {
  "Waiting for birthplace": "En attente du lieu de naissance",
  "Start with birthplace and existing Mexican records.":
    "Commencez par le lieu de naissance et les registres mexicains existants.",
  "Confirm where the applicant was born.": "Confirmez où le demandeur est né.",
  "You already have a Mexican nationality document on the record.":
    "Vous avez déjà un document de nationalité mexicaine au dossier.",
  "Get certified copies of the Mexican acta or document if needed.":
    "Obtenez des copies certifiées de l'acte ou document mexicain si nécessaire.",
  "Confirm CURP and name consistency across IDs.":
    "Confirmez le CURP et la cohérence des noms entre les pièces d'identité.",
  "Schedule passport, matricula, INE, or record-correction steps as applicable.":
    "Planifiez passeport, matrícula, INE ou correction de registre selon le cas.",
  "People born in Mexico are Mexican by birth.":
    "Les personnes nées au Mexique sont mexicaines de naissance.",
  "Locate or obtain a certified Mexican birth acta.":
    "Trouvez ou obtenez un acte de naissance mexicain certifié.",
  "Confirm CURP and fix record errors before passport or ID appointment.":
    "Confirmez le CURP et corrigez les erreurs avant le rendez-vous passeport ou ID.",
  "Apply for Mexican passport, matricula, INE, or other ID.":
    "Demandez un passeport mexicain, matrícula, INE ou autre pièce d'identité.",
  "Born in Mexico, but foreign nationality was acquired before March 20, 1998.":
    "Né/e au Mexique, mais une nationalité étrangère a été acquise avant le 20 mars 1998.",
  "Prepare Mexican birth acta.": "Préparez l'acte de naissance mexicain.",
  "Gather proof of foreign naturalization with apostille if required.":
    "Rassemblez la preuve de naturalisation étrangère avec apostille si requise.",
  "Gather ID, photos, and name-change or marriage records.":
    "Rassemblez pièce d'identité, photos et documents de changement de nom ou mariage.",
  "At least one legal parent was Mexican at or before the applicant's birth.":
    "Au moins un parent légal était mexicain avant ou au moment de la naissance.",
  "Use MiConsulado and choose civil registry / birth registration, not passport.":
    "Utilisez MiConsulado et choisissez état civil / enregistrement de naissance, pas passeport.",
  "Bring the applicant's long-form certified birth certificate.":
    "Apportez l'acte de naissance intégral certifié du demandeur.",
  "Bring the Mexican parent's acta, passport, Carta de Naturalizacion, or declaratoria as applicable.":
    "Apportez l'acte, passeport, Carta de Naturalización ou declaratoria du parent mexicain selon le cas.",
  "Bring parent IDs, marriage/name-change records, and witnesses if the consulate requires them.":
    "Apportez les IDs des parents, documents de mariage/changement de nom et témoins si requis.",
  "After the Mexican acta is issued, confirm CURP and schedule a Mexican passport appointment.":
    "Après l'émission de l'acte mexicain, confirmez le CURP et prenez rendez-vous pour le passeport.",
  "The parent link may qualify, but the Mexican parent must be documented first.":
    "Le lien parental peut qualifier, mais le parent mexicain doit d'abord être documenté.",
  "Find or request the parent's Mexican birth acta, declaratoria, or Carta de Naturalizacion.":
    "Trouvez ou demandez l'acte mexicain, la declaratoria ou la Carta de Naturalización du parent.",
  "If the parent was born abroad and never registered, document the parent first.":
    "Si le parent est né à l'étranger et n'a jamais été enregistré, documentez-le d'abord.",
  "Then reopen the applicant's birth registration checklist.":
    "Puis reprenez la liste d'enregistrement de naissance du demandeur.",
  "Parent names do not clearly match across birth and Mexican records.":
    "Les noms des parents ne correspondent pas clairement entre les registres de naissance et mexicains.",
  "Applicant does not yet have a long-form certified birth certificate.":
    "Le demandeur n'a pas encore d'acte de naissance intégral certifié.",
  "Order the long-form certified birth certificate before attending.":
    "Demandez l'acte intégral certifié avant de vous présenter.",
  "Naturalization generally requires temporary or permanent resident status.":
    "La naturalisation exige généralement un statut de résident temporaire ou permanent.",
  "Five or more years of qualifying residence can support the general route.":
    "Cinq ans ou plus de résidence admissible peuvent soutenir le parcours général.",
  "Confirm resident card is valid at least six months beyond the filing date and shows CURP.":
    "Confirmez que la carte de résident est valide au moins six mois après le dépôt et affiche le CURP.",
  "Make sure the DNN-3 address matches the INM-registered address.":
    "Assurez-vous que l'adresse DNN-3 correspond à celle enregistrée auprès de l'INM.",
  "Prepare DNN-3, resident card, full passport copies, entries/exits letter, CURP, photos, payment, and criminal-record certificates.":
    "Préparez DNN-3, carte de résident, copies complètes du passeport, lettre d'entrées/sorties, CURP, photos, paiement et certificats de casier judiciaire.",
  "Gather modality proof such as marriage acta, child's Mexican acta, descent records, origin-country birth certificate, COMAR letter, or custody/adoption records.":
    "Rassemblez les preuves de modalité : acte de mariage, acte mexicain de l'enfant, registres de descendance, acte du pays d'origine, lettre COMAR ou dossiers de garde/adoption.",
  "Study for Spanish, Mexican history, and culture exams unless an exception applies.":
    "Étudiez pour les examens d'espagnol, d'histoire et de culture mexicaine sauf exception.",
  "Adoption or Mexican parental authority can support a one-year route with custody review.":
    "L'adoption ou l'autorité parentale mexicaine peut soutenir un parcours d'un an avec examen de garde.",
});

Object.assign(JA_TEXT, {
  "Waiting for birthplace": "出生地を待っています",
  "Start with birthplace and existing Mexican records.":
    "出生地と既存のメキシコ記録から始めます。",
  "Confirm where the applicant was born.":
    "申請者がどこで生まれたか確認してください。",
  "You already have a Mexican nationality document on the record.":
    "すでにメキシコ国籍を示す書類があります。",
  "Get certified copies of the Mexican acta or document if needed.":
    "必要ならメキシコのactaまたは書類の認証コピーを取得してください。",
  "Confirm CURP and name consistency across IDs.":
    "CURPと各ID上の氏名の一致を確認してください。",
  "Schedule passport, matricula, INE, or record-correction steps as applicable.":
    "必要に応じて旅券、matrícula、INE、記録訂正の手続きを予約してください。",
  "People born in Mexico are Mexican by birth.":
    "メキシコで生まれた人は出生によりメキシコ人です。",
  "Locate or obtain a certified Mexican birth acta.":
    "認証済みメキシコ出生actaを探すか取得してください。",
  "Confirm CURP and fix record errors before passport or ID appointment.":
    "旅券またはID予約の前にCURPを確認し、記録の誤りを直してください。",
  "Apply for Mexican passport, matricula, INE, or other ID.":
    "メキシコ旅券、matrícula、INE、または他のIDを申請してください。",
  "Born in Mexico, but foreign nationality was acquired before March 20, 1998.":
    "メキシコ生まれですが、1998年3月20日より前に外国国籍を取得しています。",
  "Prepare Mexican birth acta.": "メキシコ出生actaを準備してください。",
  "Gather proof of foreign naturalization with apostille if required.":
    "必要ならアポスティーユ付きの外国帰化証明を集めてください。",
  "Gather ID, photos, and name-change or marriage records.":
    "ID、写真、氏名変更または婚姻記録を集めてください。",
  "At least one legal parent was Mexican at or before the applicant's birth.":
    "申請者の出生時またはそれ以前に、法律上の親の少なくとも一人がメキシコ人でした。",
  "Use MiConsulado and choose civil registry / birth registration, not passport.":
    "MiConsuladoで旅券ではなく、戸籍/出生登録を選んでください。",
  "Bring the applicant's long-form certified birth certificate.":
    "申請者の詳細版認証出生証明を持参してください。",
  "Bring the Mexican parent's acta, passport, Carta de Naturalizacion, or declaratoria as applicable.":
    "該当するメキシコ人親のacta、旅券、Carta de Naturalización、またはdeclaratoriaを持参してください。",
  "Bring parent IDs, marriage/name-change records, and witnesses if the consulate requires them.":
    "領事館が求める場合は親のID、婚姻/氏名変更記録、証人を持参してください。",
  "After the Mexican acta is issued, confirm CURP and schedule a Mexican passport appointment.":
    "メキシコacta発行後、CURPを確認してメキシコ旅券予約をしてください。",
  "The parent link may qualify, but the Mexican parent must be documented first.":
    "親子関係は該当する可能性がありますが、まずメキシコ人の親を証明する必要があります。",
  "Find or request the parent's Mexican birth acta, declaratoria, or Carta de Naturalizacion.":
    "親のメキシコ出生acta、declaratoria、またはCarta de Naturalizaciónを探すか請求してください。",
  "If the parent was born abroad and never registered, document the parent first.":
    "親が国外生まれで未登録なら、まず親を登録・証明してください。",
  "Then reopen the applicant's birth registration checklist.":
    "その後、申請者の出生登録チェックリストに戻ってください。",
  "Parent names do not clearly match across birth and Mexican records.":
    "出生記録とメキシコ記録で親の名前が明確に一致しません。",
  "Applicant does not yet have a long-form certified birth certificate.":
    "申請者はまだ詳細版認証出生証明を持っていません。",
  "Order the long-form certified birth certificate before attending.":
    "予約前に詳細版認証出生証明を取り寄せてください。",
  "Naturalization generally requires temporary or permanent resident status.":
    "帰化には通常、一時または永住の居住資格が必要です。",
  "Five or more years of qualifying residence can support the general route.":
    "5年以上の対象居住は一般ルートの根拠になります。",
  "Confirm resident card is valid at least six months beyond the filing date and shows CURP.":
    "居住カードが申請日から少なくとも6か月有効でCURPを表示しているか確認してください。",
  "Make sure the DNN-3 address matches the INM-registered address.":
    "DNN-3の住所がINM登録住所と一致するようにしてください。",
  "Prepare DNN-3, resident card, full passport copies, entries/exits letter, CURP, photos, payment, and criminal-record certificates.":
    "DNN-3、居住カード、旅券全ページコピー、出入国レター、CURP、写真、支払い、犯罪経歴証明を準備してください。",
  "Gather modality proof such as marriage acta, child's Mexican acta, descent records, origin-country birth certificate, COMAR letter, or custody/adoption records.":
    "婚姻acta、子のメキシコacta、血統記録、出生国の証明、COMARレター、親権/養子記録などの根拠書類を集めてください。",
  "Study for Spanish, Mexican history, and culture exams unless an exception applies.":
    "例外がない限り、スペイン語、メキシコ史、文化試験の勉強をしてください。",
  "Adoption or Mexican parental authority can support a one-year route with custody review.":
    "養子縁組またはメキシコの親権は、親権確認を伴う1年ルートの根拠になり得ます。",
});

Object.assign(HI_TEXT, {
  "Waiting for birthplace": "जन्मस्थान की प्रतीक्षा",
  "Start with birthplace and existing Mexican records.":
    "जन्मस्थान और मौजूदा मैक्सिकन रिकॉर्ड से शुरू करें।",
  "Confirm where the applicant was born.":
    "पुष्टि करें कि आवेदक का जन्म कहां हुआ।",
  "You already have a Mexican nationality document on the record.":
    "आपके रिकॉर्ड में पहले से मैक्सिकन राष्ट्रीयता दस्तावेज़ है।",
  "Get certified copies of the Mexican acta or document if needed.":
    "जरूरत हो तो मैक्सिकन acta या दस्तावेज़ की प्रमाणित प्रतियां लें।",
  "Confirm CURP and name consistency across IDs.":
    "CURP और IDs में नाम की समानता की पुष्टि करें।",
  "Schedule passport, matricula, INE, or record-correction steps as applicable.":
    "जैसा लागू हो, पासपोर्ट, matrícula, INE या रिकॉर्ड-सुधार कदम तय करें।",
  "People born in Mexico are Mexican by birth.":
    "मेक्सिको में जन्मे लोग जन्म से मैक्सिकन होते हैं।",
  "Locate or obtain a certified Mexican birth acta.":
    "प्रमाणित मैक्सिकन जन्म acta खोजें या प्राप्त करें।",
  "Confirm CURP and fix record errors before passport or ID appointment.":
    "पासपोर्ट या ID अपॉइंटमेंट से पहले CURP की पुष्टि करें और रिकॉर्ड त्रुटियां सुधारें।",
  "Apply for Mexican passport, matricula, INE, or other ID.":
    "मैक्सिकन पासपोर्ट, matrícula, INE या अन्य ID के लिए आवेदन करें।",
  "Born in Mexico, but foreign nationality was acquired before March 20, 1998.":
    "जन्म मेक्सिको में हुआ, लेकिन विदेशी राष्ट्रीयता 20 मार्च 1998 से पहले प्राप्त हुई।",
  "Prepare Mexican birth acta.": "मैक्सिकन जन्म acta तैयार करें।",
  "Gather proof of foreign naturalization with apostille if required.":
    "जरूरत हो तो apostille के साथ विदेशी नैचुरलाइज़ेशन प्रमाण जुटाएं।",
  "Gather ID, photos, and name-change or marriage records.":
    "ID, फोटो, और नाम-बदलाव या विवाह रिकॉर्ड जुटाएं।",
  "At least one legal parent was Mexican at or before the applicant's birth.":
    "आवेदक के जन्म के समय या उससे पहले कम से कम एक कानूनी माता-पिता मैक्सिकन थे।",
  "Use MiConsulado and choose civil registry / birth registration, not passport.":
    "MiConsulado में पासपोर्ट नहीं, civil registry / birth registration चुनें।",
  "Bring the applicant's long-form certified birth certificate.":
    "आवेदक का लंबा प्रमाणित जन्म प्रमाणपत्र साथ लाएं।",
  "Bring the Mexican parent's acta, passport, Carta de Naturalizacion, or declaratoria as applicable.":
    "जैसा लागू हो, मैक्सिकन माता-पिता का acta, पासपोर्ट, Carta de Naturalización या declaratoria लाएं।",
  "Bring parent IDs, marriage/name-change records, and witnesses if the consulate requires them.":
    "यदि कांसुलेट मांगे तो माता-पिता की IDs, विवाह/नाम-बदलाव रिकॉर्ड और गवाह लाएं।",
  "After the Mexican acta is issued, confirm CURP and schedule a Mexican passport appointment.":
    "मैक्सिकन acta जारी होने के बाद CURP की पुष्टि करें और मैक्सिकन पासपोर्ट अपॉइंटमेंट लें।",
  "The parent link may qualify, but the Mexican parent must be documented first.":
    "माता-पिता का लिंक योग्य हो सकता है, लेकिन पहले मैक्सिकन माता-पिता का दस्तावेज़ीकरण जरूरी है।",
  "Find or request the parent's Mexican birth acta, declaratoria, or Carta de Naturalizacion.":
    "माता-पिता का मैक्सिकन जन्म acta, declaratoria या Carta de Naturalización खोजें या मांगें।",
  "If the parent was born abroad and never registered, document the parent first.":
    "यदि माता-पिता विदेश में जन्मे और कभी पंजीकृत नहीं हुए, तो पहले उन्हें दस्तावेज़ित करें।",
  "Then reopen the applicant's birth registration checklist.":
    "फिर आवेदक की जन्म पंजीकरण चेकलिस्ट दोबारा खोलें।",
  "Parent names do not clearly match across birth and Mexican records.":
    "जन्म और मैक्सिकन रिकॉर्ड में माता-पिता के नाम साफ तौर पर मेल नहीं खाते।",
  "Applicant does not yet have a long-form certified birth certificate.":
    "आवेदक के पास अभी लंबा प्रमाणित जन्म प्रमाणपत्र नहीं है।",
  "Order the long-form certified birth certificate before attending.":
    "अपॉइंटमेंट से पहले लंबा प्रमाणित जन्म प्रमाणपत्र मंगाएं।",
  "Naturalization generally requires temporary or permanent resident status.":
    "नैचुरलाइज़ेशन के लिए आम तौर पर अस्थायी या स्थायी निवासी स्थिति चाहिए।",
  "Five or more years of qualifying residence can support the general route.":
    "पांच या अधिक वर्ष की पात्र निवास अवधि सामान्य मार्ग का आधार हो सकती है।",
  "Confirm resident card is valid at least six months beyond the filing date and shows CURP.":
    "पुष्टि करें कि निवासी कार्ड आवेदन तिथि से कम से कम छह महीने आगे तक वैध है और CURP दिखाता है।",
  "Make sure the DNN-3 address matches the INM-registered address.":
    "सुनिश्चित करें कि DNN-3 पता INM में दर्ज पते से मेल खाता है।",
  "Prepare DNN-3, resident card, full passport copies, entries/exits letter, CURP, photos, payment, and criminal-record certificates.":
    "DNN-3, निवासी कार्ड, पासपोर्ट की पूरी प्रतियां, प्रवेश/निकास पत्र, CURP, फोटो, भुगतान और आपराधिक रिकॉर्ड प्रमाणपत्र तैयार करें।",
  "Gather modality proof such as marriage acta, child's Mexican acta, descent records, origin-country birth certificate, COMAR letter, or custody/adoption records.":
    "विवाह acta, बच्चे का मैक्सिकन acta, वंश रिकॉर्ड, मूल देश जन्म प्रमाणपत्र, COMAR पत्र या custody/adoption रिकॉर्ड जैसे प्रमाण जुटाएं।",
  "Study for Spanish, Mexican history, and culture exams unless an exception applies.":
    "यदि छूट लागू न हो तो स्पैनिश, मैक्सिकन इतिहास और संस्कृति परीक्षा की तैयारी करें।",
  "Adoption or Mexican parental authority can support a one-year route with custody review.":
    "गोद लेना या मैक्सिकन अभिभावक अधिकार custody समीक्षा के साथ एक-वर्षीय मार्ग का आधार हो सकता है।",
});

Object.assign(AR_TEXT, {
  "Waiting for birthplace": "بانتظار مكان الميلاد",
  "Start with birthplace and existing Mexican records.":
    "ابدأ بمكان الميلاد والسجلات المكسيكية الموجودة.",
  "Confirm where the applicant was born.": "أكد مكان ميلاد مقدم الطلب.",
  "You already have a Mexican nationality document on the record.":
    "لديك بالفعل وثيقة جنسية مكسيكية في السجل.",
  "Get certified copies of the Mexican acta or document if needed.":
    "احصل على نسخ مصدقة من acta أو الوثيقة المكسيكية إذا لزم الأمر.",
  "Confirm CURP and name consistency across IDs.":
    "أكد CURP وتطابق الاسم عبر الهويات.",
  "Schedule passport, matricula, INE, or record-correction steps as applicable.":
    "حدد خطوات جواز السفر أو matrícula أو INE أو تصحيح السجلات حسب الحالة.",
  "People born in Mexico are Mexican by birth.":
    "الأشخاص المولودون في المكسيك مكسيكيون بالميلاد.",
  "Locate or obtain a certified Mexican birth acta.":
    "اعثر على acta ميلاد مكسيكية مصدقة أو احصل عليها.",
  "Confirm CURP and fix record errors before passport or ID appointment.":
    "أكد CURP وصحح أخطاء السجل قبل موعد جواز السفر أو الهوية.",
  "Apply for Mexican passport, matricula, INE, or other ID.":
    "تقدم لجواز سفر مكسيكي أو matrícula أو INE أو هوية أخرى.",
  "Born in Mexico, but foreign nationality was acquired before March 20, 1998.":
    "ولد/ت في المكسيك، لكن تم الحصول على جنسية أجنبية قبل 20 مارس 1998.",
  "Prepare Mexican birth acta.": "جهز acta الميلاد المكسيكية.",
  "Gather proof of foreign naturalization with apostille if required.":
    "اجمع إثبات التجنس الأجنبي مع apostille إذا كان مطلوبا.",
  "Gather ID, photos, and name-change or marriage records.":
    "اجمع الهوية والصور وسجلات تغيير الاسم أو الزواج.",
  "At least one legal parent was Mexican at or before the applicant's birth.":
    "كان أحد الوالدين القانونيين على الأقل مكسيكيا عند ميلاد مقدم الطلب أو قبله.",
  "Use MiConsulado and choose civil registry / birth registration, not passport.":
    "استخدم MiConsulado واختر السجل المدني / تسجيل الميلاد، وليس جواز السفر.",
  "Bring the applicant's long-form certified birth certificate.":
    "أحضر شهادة الميلاد الكاملة والمصدقة لمقدم الطلب.",
  "Bring the Mexican parent's acta, passport, Carta de Naturalizacion, or declaratoria as applicable.":
    "أحضر acta أو جواز السفر أو Carta de Naturalización أو declaratoria للوالد المكسيكي حسب الحالة.",
  "Bring parent IDs, marriage/name-change records, and witnesses if the consulate requires them.":
    "أحضر هويات الوالدين وسجلات الزواج/تغيير الاسم والشهود إذا طلبت القنصلية ذلك.",
  "After the Mexican acta is issued, confirm CURP and schedule a Mexican passport appointment.":
    "بعد إصدار acta المكسيكية، أكد CURP وحدد موعد جواز سفر مكسيكي.",
  "The parent link may qualify, but the Mexican parent must be documented first.":
    "قد يؤهل رابط الوالد، لكن يجب توثيق الوالد المكسيكي أولا.",
  "Find or request the parent's Mexican birth acta, declaratoria, or Carta de Naturalizacion.":
    "ابحث عن acta ميلاد الوالد المكسيكية أو declaratoria أو Carta de Naturalización أو اطلبها.",
  "If the parent was born abroad and never registered, document the parent first.":
    "إذا ولد الوالد في الخارج ولم يسجل أبدا، فوثقه أولا.",
  "Then reopen the applicant's birth registration checklist.":
    "ثم أعد فتح قائمة تسجيل ميلاد مقدم الطلب.",
  "Parent names do not clearly match across birth and Mexican records.":
    "أسماء الوالدين لا تتطابق بوضوح بين سجلات الميلاد والسجلات المكسيكية.",
  "Applicant does not yet have a long-form certified birth certificate.":
    "لا يملك مقدم الطلب بعد شهادة ميلاد كاملة ومصدقة.",
  "Order the long-form certified birth certificate before attending.":
    "اطلب شهادة الميلاد الكاملة والمصدقة قبل الحضور.",
  "Naturalization generally requires temporary or permanent resident status.":
    "يتطلب التجنس عادة وضع إقامة مؤقتة أو دائمة.",
  "Five or more years of qualifying residence can support the general route.":
    "يمكن لخمس سنوات أو أكثر من الإقامة المؤهلة دعم المسار العام.",
  "Confirm resident card is valid at least six months beyond the filing date and shows CURP.":
    "أكد أن بطاقة الإقامة صالحة لستة أشهر على الأقل بعد تاريخ التقديم وتعرض CURP.",
  "Make sure the DNN-3 address matches the INM-registered address.":
    "تأكد من أن عنوان DNN-3 يطابق العنوان المسجل لدى INM.",
  "Prepare DNN-3, resident card, full passport copies, entries/exits letter, CURP, photos, payment, and criminal-record certificates.":
    "جهز DNN-3 وبطاقة الإقامة ونسخ جواز السفر كاملة وخطاب الدخول/الخروج وCURP والصور والدفع وشهادات السجل الجنائي.",
  "Gather modality proof such as marriage acta, child's Mexican acta, descent records, origin-country birth certificate, COMAR letter, or custody/adoption records.":
    "اجمع إثبات نوع المسار مثل acta الزواج أو acta الطفل المكسيكية أو سجلات النسب أو شهادة بلد الأصل أو خطاب COMAR أو سجلات الحضانة/التبني.",
  "Study for Spanish, Mexican history, and culture exams unless an exception applies.":
    "ادرس لاختبارات الإسبانية وتاريخ وثقافة المكسيك ما لم ينطبق استثناء.",
  "Adoption or Mexican parental authority can support a one-year route with custody review.":
    "يمكن للتبني أو السلطة الأبوية المكسيكية دعم مسار سنة واحدة مع مراجعة الحضانة.",
});

Object.assign(ZH_TEXT, {
  "Waiting for birthplace": "等待出生地",
  "Start with birthplace and existing Mexican records.":
    "先从出生地和已有墨西哥记录开始。",
  "Confirm where the applicant was born.": "确认申请人的出生地点。",
  "You already have a Mexican nationality document on the record.":
    "记录中已有墨西哥国籍文件。",
  "Get certified copies of the Mexican acta or document if needed.":
    "如有需要，取得墨西哥 acta 或文件的认证副本。",
  "Confirm CURP and name consistency across IDs.":
    "确认 CURP，并核对各身份证件上的姓名一致。",
  "Schedule passport, matricula, INE, or record-correction steps as applicable.":
    "根据情况安排护照、matrícula、INE 或记录更正步骤。",
  "People born in Mexico are Mexican by birth.":
    "出生在墨西哥的人为出生即墨西哥国籍。",
  "Locate or obtain a certified Mexican birth acta.":
    "查找或取得认证墨西哥出生 acta。",
  "Confirm CURP and fix record errors before passport or ID appointment.":
    "在护照或身份证预约前确认 CURP 并更正记录错误。",
  "Apply for Mexican passport, matricula, INE, or other ID.":
    "申请墨西哥护照、matrícula、INE 或其他身份证件。",
  "Born in Mexico, but foreign nationality was acquired before March 20, 1998.":
    "出生在墨西哥，但在1998年3月20日前取得外国国籍。",
  "Prepare Mexican birth acta.": "准备墨西哥出生 acta。",
  "Gather proof of foreign naturalization with apostille if required.":
    "如需要，收集带 apostille 的外国归化证明。",
  "Gather ID, photos, and name-change or marriage records.":
    "收集身份证件、照片以及改名或婚姻记录。",
  "At least one legal parent was Mexican at or before the applicant's birth.":
    "申请人出生时或出生前，至少一名法律父/母是墨西哥人。",
  "Use MiConsulado and choose civil registry / birth registration, not passport.":
    "使用 MiConsulado，并选择民事登记/出生登记，而不是护照。",
  "Bring the applicant's long-form certified birth certificate.":
    "带上申请人的完整认证版出生证明。",
  "Bring the Mexican parent's acta, passport, Carta de Naturalizacion, or declaratoria as applicable.":
    "根据情况带上墨西哥籍父/母的 acta、护照、Carta de Naturalización 或 declaratoria。",
  "Bring parent IDs, marriage/name-change records, and witnesses if the consulate requires them.":
    "如领事馆要求，带上父母身份证件、婚姻/改名记录和见证人。",
  "After the Mexican acta is issued, confirm CURP and schedule a Mexican passport appointment.":
    "墨西哥 acta 签发后，确认 CURP 并预约墨西哥护照。",
  "The parent link may qualify, but the Mexican parent must be documented first.":
    "父母关系可能符合条件，但必须先证明墨西哥籍父/母。",
  "Find or request the parent's Mexican birth acta, declaratoria, or Carta de Naturalizacion.":
    "查找或申请父/母的墨西哥出生 acta、declaratoria 或 Carta de Naturalización。",
  "If the parent was born abroad and never registered, document the parent first.":
    "如果父/母出生在国外且从未登记，请先为父/母完成证明。",
  "Then reopen the applicant's birth registration checklist.":
    "然后重新打开申请人的出生登记清单。",
  "Parent names do not clearly match across birth and Mexican records.":
    "出生记录和墨西哥记录中的父母姓名不明确匹配。",
  "Applicant does not yet have a long-form certified birth certificate.":
    "申请人尚无完整认证版出生证明。",
  "Order the long-form certified birth certificate before attending.":
    "参加预约前先订购完整认证版出生证明。",
  "Naturalization generally requires temporary or permanent resident status.":
    "入籍通常需要临时或永久居民身份。",
  "Five or more years of qualifying residence can support the general route.":
    "五年或以上符合条件的居留可支持一般路径。",
  "Confirm resident card is valid at least six months beyond the filing date and shows CURP.":
    "确认居留卡在提交日期后至少仍有效六个月，并显示 CURP。",
  "Make sure the DNN-3 address matches the INM-registered address.":
    "确保 DNN-3 地址与 INM 登记地址一致。",
  "Prepare DNN-3, resident card, full passport copies, entries/exits letter, CURP, photos, payment, and criminal-record certificates.":
    "准备 DNN-3、居留卡、完整护照复印件、出入境说明、CURP、照片、付款以及犯罪记录证明。",
  "Gather modality proof such as marriage acta, child's Mexican acta, descent records, origin-country birth certificate, COMAR letter, or custody/adoption records.":
    "收集类别证明，如婚姻 acta、子女墨西哥 acta、血统记录、原籍国出生证明、COMAR 信或监护/收养记录。",
  "Study for Spanish, Mexican history, and culture exams unless an exception applies.":
    "除非适用例外，请准备西班牙语、墨西哥历史和文化考试。",
  "Adoption or Mexican parental authority can support a one-year route with custody review.":
    "收养或墨西哥父母权可支持一年路径，但需监护审核。",
});

Object.assign(PT_TEXT, {
  Reset: "Redefinir",
  "Reset questions": "Redefinir perguntas",
  "Test prefill": "Preencher teste",
  Completion: "Progresso",
  complete: "concluído",
  "Document collection progress": "Progresso da coleta de documentos",
  "Download report": "Baixar relatório",
  "DIY official route": "Rota oficial por conta própria",
  "Paid-help range": "Faixa com ajuda paga",
  Recommendation: "Recomendação",
  "paid help": "ajuda paga",
  Meaning: "Significado",
  "User guidance": "Orientação ao usuário",
  "Mexico citizenship route report": "Relatório de rota de cidadania mexicana",
  Generated: "Gerado",
  Outcome: "Resultado",
  Route: "Rota",
  Status: "Status",
  "Questionnaire answers": "Respostas do questionário",
  "Not answered": "Sem resposta",
  Checked: "Marcado",
  Pending: "Pendente",
  "Start questions": "Começar perguntas",
  "Copy key": "Copiar chave",
  "Citizenship route finder": "Guia de rota de cidadania",
  "Find the right Mexico citizenship path before you book appointments or collect documents.":
    "Encontre o caminho certo para a cidadania mexicana antes de marcar citas ou reunir documentos.",
  "This tool asks one question at a time and separates people who are already Mexican by birth from people who need naturalization.":
    "Esta ferramenta faz uma pergunta por vez e separa quem já é mexicano por nascimento de quem precisa de naturalização.",
  "Before you start, save your secret key somewhere safe. It is how you access your account and return to your citizenship answers later. We cannot recover it for you.":
    "Antes de começar, salve sua chave secreta em um lugar seguro. Ela é como você acessa sua conta e volta às respostas de cidadania depois. Não podemos recuperá-la para você.",
  "Secret key copied": "Chave secreta copiada",
  "No secret key found": "Nenhuma chave secreta encontrada",
  "Sign in or create an account before copying your secret key.":
    "Entre ou crie uma conta antes de copiar sua chave secreta.",
  "Unable to copy secret key.": "Não foi possível copiar a chave secreta.",
  "Unable to save this intro. You can still continue.":
    "Não foi possível salvar esta introdução. Você ainda pode continuar.",
});

Object.assign(IT_TEXT, {
  Reset: "Reimposta",
  "Reset questions": "Reimposta domande",
  "Test prefill": "Compila test",
  Completion: "Avanzamento",
  complete: "completo",
  "Document collection progress": "Avanzamento raccolta documenti",
  "Download report": "Scarica report",
  "DIY official route": "Percorso ufficiale fai-da-te",
  "Paid-help range": "Fascia con aiuto pagato",
  Recommendation: "Raccomandazione",
  "paid help": "aiuto pagato",
  Meaning: "Significato",
  "User guidance": "Guida per l'utente",
  "Mexico citizenship route report":
    "Report sul percorso di cittadinanza messicana",
  Generated: "Generato",
  Outcome: "Risultato",
  Route: "Percorso",
  Status: "Stato",
  "Questionnaire answers": "Risposte al questionario",
  "Not answered": "Non risposto",
  Checked: "Completato",
  Pending: "In sospeso",
  "Start questions": "Inizia domande",
  "Copy key": "Copia chiave",
  "Citizenship route finder": "Guida al percorso di cittadinanza",
  "Find the right Mexico citizenship path before you book appointments or collect documents.":
    "Trova il percorso giusto per la cittadinanza messicana prima di prenotare appuntamenti o raccogliere documenti.",
  "This tool asks one question at a time and separates people who are already Mexican by birth from people who need naturalization.":
    "Questo strumento fa una domanda alla volta e distingue chi è già messicano per nascita da chi deve naturalizzarsi.",
  "Before you start, save your secret key somewhere safe. It is how you access your account and return to your citizenship answers later. We cannot recover it for you.":
    "Prima di iniziare, salva la chiave segreta in un posto sicuro. È il modo per accedere al tuo account e tornare alle risposte sulla cittadinanza. Non possiamo recuperarla per te.",
  "Secret key copied": "Chiave segreta copiata",
  "No secret key found": "Nessuna chiave segreta trovata",
  "Sign in or create an account before copying your secret key.":
    "Accedi o crea un account prima di copiare la chiave segreta.",
  "Unable to copy secret key.": "Impossibile copiare la chiave segreta.",
  "Unable to save this intro. You can still continue.":
    "Impossibile salvare questa introduzione. Puoi comunque continuare.",
});

Object.assign(FR_TEXT, {
  Reset: "Réinitialiser",
  "Reset questions": "Réinitialiser les questions",
  "Test prefill": "Préremplir test",
  Completion: "Progression",
  complete: "terminé",
  "Document collection progress": "Progression de la collecte des documents",
  "Download report": "Télécharger le rapport",
  "DIY official route": "Voie officielle par soi-même",
  "Paid-help range": "Fourchette avec aide payante",
  Recommendation: "Recommandation",
  "paid help": "aide payante",
  Meaning: "Signification",
  "User guidance": "Conseil utilisateur",
  "Mexico citizenship route report":
    "Rapport de parcours de citoyenneté mexicaine",
  Generated: "Généré",
  Outcome: "Résultat",
  Route: "Parcours",
  Status: "Statut",
  "Questionnaire answers": "Réponses au questionnaire",
  "Not answered": "Sans réponse",
  Checked: "Coché",
  Pending: "En attente",
  "Start questions": "Commencer les questions",
  "Copy key": "Copier la clé",
  "Citizenship route finder": "Guide de parcours de citoyenneté",
  "Find the right Mexico citizenship path before you book appointments or collect documents.":
    "Trouvez le bon parcours de citoyenneté mexicaine avant de prendre rendez-vous ou de rassembler des documents.",
  "This tool asks one question at a time and separates people who are already Mexican by birth from people who need naturalization.":
    "Cet outil pose une question à la fois et distingue les personnes déjà mexicaines de naissance de celles qui doivent se naturaliser.",
  "Before you start, save your secret key somewhere safe. It is how you access your account and return to your citizenship answers later. We cannot recover it for you.":
    "Avant de commencer, enregistrez votre clé secrète dans un endroit sûr. C'est ainsi que vous accédez à votre compte et retrouvez vos réponses plus tard. Nous ne pouvons pas la récupérer pour vous.",
  "Secret key copied": "Clé secrète copiée",
  "No secret key found": "Aucune clé secrète trouvée",
  "Sign in or create an account before copying your secret key.":
    "Connectez-vous ou créez un compte avant de copier votre clé secrète.",
  "Unable to copy secret key.": "Impossible de copier la clé secrète.",
  "Unable to save this intro. You can still continue.":
    "Impossible d'enregistrer cette introduction. Vous pouvez quand même continuer.",
});

Object.assign(JA_TEXT, {
  Reset: "リセット",
  "Reset questions": "質問をリセット",
  "Test prefill": "テスト入力",
  Completion: "進捗",
  complete: "完了",
  "Document collection progress": "書類収集の進捗",
  "Download report": "レポートをダウンロード",
  "DIY official route": "公式の自分で行うルート",
  "Paid-help range": "有料支援の範囲",
  Recommendation: "推奨",
  "paid help": "有料支援",
  Meaning: "意味",
  "User guidance": "利用者向けの案内",
  "Mexico citizenship route report": "メキシコ国籍ルートレポート",
  Generated: "生成日時",
  Outcome: "結果",
  Route: "ルート",
  Status: "ステータス",
  "Questionnaire answers": "質問への回答",
  "Not answered": "未回答",
  Checked: "完了",
  Pending: "未完了",
  "Start questions": "質問を始める",
  "Copy key": "キーをコピー",
  "Citizenship route finder": "国籍ルートガイド",
  "Find the right Mexico citizenship path before you book appointments or collect documents.":
    "予約や書類収集の前に、メキシコ国籍に向けた正しいルートを確認します。",
  "This tool asks one question at a time and separates people who are already Mexican by birth from people who need naturalization.":
    "このツールは一問ずつ質問し、出生によりすでにメキシコ人の人と帰化が必要な人を分けます。",
  "Before you start, save your secret key somewhere safe. It is how you access your account and return to your citizenship answers later. We cannot recover it for you.":
    "始める前に、秘密鍵を安全な場所に保存してください。これはアカウントにアクセスし、後で国籍の回答に戻るための鍵です。こちらでは復元できません。",
  "Secret key copied": "秘密鍵をコピーしました",
  "No secret key found": "秘密鍵が見つかりません",
  "Sign in or create an account before copying your secret key.":
    "秘密鍵をコピーする前にサインインまたはアカウント作成をしてください。",
  "Unable to copy secret key.": "秘密鍵をコピーできませんでした。",
  "Unable to save this intro. You can still continue.":
    "この紹介を保存できませんでした。それでも続行できます。",
});

Object.assign(HI_TEXT, {
  Reset: "रीसेट",
  "Reset questions": "प्रश्न रीसेट करें",
  "Test prefill": "टेस्ट भरें",
  Completion: "प्रगति",
  complete: "पूर्ण",
  "Document collection progress": "दस्तावेज़ संग्रह प्रगति",
  "Download report": "रिपोर्ट डाउनलोड करें",
  "DIY official route": "आधिकारिक खुद करने वाला मार्ग",
  "Paid-help range": "भुगतान वाली मदद की सीमा",
  Recommendation: "सिफारिश",
  "paid help": "भुगतान वाली मदद",
  Meaning: "अर्थ",
  "User guidance": "यूज़र मार्गदर्शन",
  "Mexico citizenship route report": "मेक्सिको नागरिकता मार्ग रिपोर्ट",
  Generated: "जनरेट किया गया",
  Outcome: "परिणाम",
  Route: "मार्ग",
  Status: "स्थिति",
  "Questionnaire answers": "प्रश्नावली उत्तर",
  "Not answered": "उत्तर नहीं दिया",
  Checked: "चिह्नित",
  Pending: "बाकी",
  "Start questions": "प्रश्न शुरू करें",
  "Copy key": "कुंजी कॉपी करें",
  "Citizenship route finder": "नागरिकता मार्ग गाइड",
  "Find the right Mexico citizenship path before you book appointments or collect documents.":
    "अपॉइंटमेंट बुक करने या दस्तावेज़ इकट्ठा करने से पहले मेक्सिको नागरिकता का सही मार्ग खोजें।",
  "This tool asks one question at a time and separates people who are already Mexican by birth from people who need naturalization.":
    "यह टूल एक बार में एक प्रश्न पूछता है और जन्म से पहले से मैक्सिकन लोगों को नैचुरलाइज़ेशन की जरूरत वाले लोगों से अलग करता है।",
  "Before you start, save your secret key somewhere safe. It is how you access your account and return to your citizenship answers later. We cannot recover it for you.":
    "शुरू करने से पहले अपनी गुप्त कुंजी सुरक्षित जगह रखें। इसी से आप अपने खाते में वापस आते हैं और बाद में नागरिकता उत्तर देखते हैं। हम इसे आपके लिए वापस नहीं ला सकते।",
  "Secret key copied": "गुप्त कुंजी कॉपी हुई",
  "No secret key found": "कोई गुप्त कुंजी नहीं मिली",
  "Sign in or create an account before copying your secret key.":
    "गुप्त कुंजी कॉपी करने से पहले साइन इन करें या खाता बनाएं।",
  "Unable to copy secret key.": "गुप्त कुंजी कॉपी नहीं हो सकी।",
  "Unable to save this intro. You can still continue.":
    "यह परिचय सेव नहीं हो सका। आप फिर भी जारी रख सकते हैं।",
});

Object.assign(AR_TEXT, {
  Reset: "إعادة ضبط",
  "Reset questions": "إعادة ضبط الأسئلة",
  "Test prefill": "ملء اختباري",
  Completion: "التقدم",
  complete: "مكتمل",
  "Document collection progress": "تقدم جمع الوثائق",
  "Download report": "تنزيل التقرير",
  "DIY official route": "المسار الرسمي بنفسك",
  "Paid-help range": "نطاق المساعدة المدفوعة",
  Recommendation: "التوصية",
  "paid help": "مساعدة مدفوعة",
  Meaning: "المعنى",
  "User guidance": "إرشاد المستخدم",
  "Mexico citizenship route report": "تقرير مسار الجنسية المكسيكية",
  Generated: "تم الإنشاء",
  Outcome: "النتيجة",
  Route: "المسار",
  Status: "الحالة",
  "Questionnaire answers": "إجابات الاستبيان",
  "Not answered": "لم تتم الإجابة",
  Checked: "تم",
  Pending: "قيد الانتظار",
  "Start questions": "ابدأ الأسئلة",
  "Copy key": "انسخ المفتاح",
  "Citizenship route finder": "دليل مسار الجنسية",
  "Find the right Mexico citizenship path before you book appointments or collect documents.":
    "اعرف المسار الصحيح للجنسية المكسيكية قبل حجز المواعيد أو جمع الوثائق.",
  "This tool asks one question at a time and separates people who are already Mexican by birth from people who need naturalization.":
    "تسأل هذه الأداة سؤالا واحدا في كل مرة وتفرق بين من هم مكسيكيون بالميلاد ومن يحتاجون إلى التجنس.",
  "Before you start, save your secret key somewhere safe. It is how you access your account and return to your citizenship answers later. We cannot recover it for you.":
    "قبل أن تبدأ، احفظ مفتاحك السري في مكان آمن. هو طريقة الوصول إلى حسابك والعودة لاحقا لإجابات الجنسية. لا يمكننا استرجاعه لك.",
  "Secret key copied": "تم نسخ المفتاح السري",
  "No secret key found": "لم يتم العثور على مفتاح سري",
  "Sign in or create an account before copying your secret key.":
    "سجل الدخول أو أنشئ حسابا قبل نسخ مفتاحك السري.",
  "Unable to copy secret key.": "تعذر نسخ المفتاح السري.",
  "Unable to save this intro. You can still continue.":
    "تعذر حفظ هذه المقدمة. ما زال بإمكانك المتابعة.",
});

Object.assign(ZH_TEXT, {
  Reset: "重置",
  "Reset questions": "重置问题",
  "Test prefill": "测试填充",
  Completion: "完成度",
  complete: "完成",
  "Document collection progress": "文件收集进度",
  "Download report": "下载报告",
  "DIY official route": "官方自办路线",
  "Paid-help range": "付费帮助范围",
  Recommendation: "建议",
  "paid help": "付费帮助",
  Meaning: "含义",
  "User guidance": "用户指导",
  "Mexico citizenship route report": "墨西哥国籍路径报告",
  Generated: "生成时间",
  Outcome: "结果",
  Route: "路径",
  Status: "状态",
  "Questionnaire answers": "问卷答案",
  "Not answered": "未回答",
  Checked: "已勾选",
  Pending: "待处理",
  "Start questions": "开始问题",
  "Copy key": "复制密钥",
  "Citizenship route finder": "国籍路径指南",
  "Find the right Mexico citizenship path before you book appointments or collect documents.":
    "在预约或收集文件前，先找到合适的墨西哥国籍路径。",
  "This tool asks one question at a time and separates people who are already Mexican by birth from people who need naturalization.":
    "本工具一次只问一个问题，并区分出生即为墨西哥国籍的人和需要入籍的人。",
  "Before you start, save your secret key somewhere safe. It is how you access your account and return to your citizenship answers later. We cannot recover it for you.":
    "开始前，请把密钥保存在安全的地方。它是你访问账户并以后回到国籍答案的方式。我们无法为你恢复。",
  "Secret key copied": "密钥已复制",
  "No secret key found": "未找到密钥",
  "Sign in or create an account before copying your secret key.":
    "复制密钥前，请先登录或创建账户。",
  "Unable to copy secret key.": "无法复制密钥。",
  "Unable to save this intro. You can still continue.":
    "无法保存此介绍。你仍然可以继续。",
});

Object.assign(ES_TEXT, {
  "Assist me": "Asísteme",
  "Analyze my checklist": "Analizar mi checklist",
  "Next best action": "Siguiente mejor acción",
  "Resolve this before moving forward.": "Resuelve esto antes de avanzar.",
  "Work on this checklist item next.":
    "Trabaja en este punto del checklist ahora.",
  "Checklist complete": "Checklist completo",
  "All checklist items are marked complete. Review official requirements before filing or attending an appointment.":
    "Todos los puntos del checklist están marcados como completos. Revisa los requisitos oficiales antes de presentar o asistir a una cita.",
  "High priority": "Alta prioridad",
  "Appointment-stopper": "Puede bloquear la cita",
  "Route guidance": "Guía de ruta",
  "Based on your answers, this is the clearest route the guide found. Officials may still require document review.":
    "Según tus respuestas, esta es la ruta más clara que encontró la guía. Las autoridades aún pueden requerir revisión de documentos.",
  "This result has blockers. Resolve them before relying on the route or booking a final appointment.":
    "Este resultado tiene bloqueos. Resuélvelos antes de depender de la ruta o reservar una cita final.",
  "This looks like a prerequisite-building path, not a filing-ready path yet.":
    "Esto parece una ruta para completar requisitos, no una ruta lista para presentar todavía.",
  "Checklist stages": "Etapas del checklist",
  "Fix blockers": "Resolver bloqueos",
  "Document collection": "Recolección de documentos",
  "Appointment prep": "Preparación de cita",
  "Naturalization filing": "Trámite de naturalización",
  "After approval": "Después de la aprobación",
  "Other tasks": "Otras tareas",
  "Clear issues that could stop the case before collecting everything else.":
    "Resuelve problemas que podrían detener el caso antes de reunir todo lo demás.",
  "Gather identity, civil registry, family, and nationality records.":
    "Reúne documentos de identidad, registro civil, familia y nacionalidad.",
  "Prepare scheduling, appearances, witnesses, and appointment-specific items.":
    "Prepara citas, comparecencias, testigos y requisitos específicos de la cita.",
  "Prepare SRE filing documents, residence proof, exams, and modality evidence.":
    "Prepara documentos para SRE, prueba de residencia, exámenes y evidencia de modalidad.",
  "Handle passport, CURP, ID, or post-approval follow-up tasks.":
    "Gestiona pasaporte, CURP, identificación o tareas posteriores a la aprobación.",
  "Track remaining tasks that do not fit a specific stage yet.":
    "Da seguimiento a tareas restantes que aún no encajan en una etapa específica.",
  "Unsaved chat": "Chat sin guardar",
  "Saved chat": "Chat guardado",
  "Citizenship assistant": "Asistente de ciudadanía",
  "Checklist support": "Apoyo para tu checklist",
  You: "Tú",
  Assistant: "Asistente",
  "Thinking through your checklist...": "Analizando tu checklist...",
  Saved: "Guardado",
  "Save chat": "Guardar chat",
  "Ask about a checklist item...": "Pregunta sobre un punto del checklist...",
  Send: "Enviar",
  "Chat saved": "Chat guardado",
  "This conversation will stay with your citizenship checklist.":
    "Esta conversación se quedará con tu checklist de ciudadanía.",
  "Assistant unavailable": "Asistente no disponible",
  "Try again in a moment.": "Inténtalo de nuevo en un momento.",
  "I could not reach the assistant right now, but your checklist is still saved.":
    "No pude conectar con el asistente ahora, pero tu checklist sigue guardado.",
  "Start with unresolved blockers, then gather the highest-proof records first: long-form birth records, Mexican actas, IDs, name-change documents, and any consulate-specific items.":
    "Empieza por los bloqueos pendientes y luego reúne primero los documentos más fuertes: actas largas, actas mexicanas, identificaciones, documentos de cambio de nombre y requisitos específicos del consulado.",
});

Object.assign(PT_TEXT, {
  "Assist me": "Me ajude",
  "Analyze my checklist": "Analisar meu checklist",
  "Next best action": "Próxima melhor ação",
  "Resolve this before moving forward.": "Resolva isso antes de avançar.",
  "Work on this checklist item next.":
    "Trabalhe neste item do checklist agora.",
  "Checklist complete": "Checklist completo",
  "All checklist items are marked complete. Review official requirements before filing or attending an appointment.":
    "Todos os itens do checklist estão completos. Revise os requisitos oficiais antes de protocolar ou ir a uma consulta.",
  "High priority": "Alta prioridade",
  "Appointment-stopper": "Pode bloquear a consulta",
  "Route guidance": "Orientação da rota",
  "Based on your answers, this is the clearest route the guide found. Officials may still require document review.":
    "Com base nas suas respostas, esta é a rota mais clara encontrada. Autoridades ainda podem exigir revisão documental.",
  "This result has blockers. Resolve them before relying on the route or booking a final appointment.":
    "Este resultado tem bloqueios. Resolva-os antes de confiar na rota ou marcar a consulta final.",
  "This looks like a prerequisite-building path, not a filing-ready path yet.":
    "Isto parece uma rota para completar pré-requisitos, ainda não pronta para protocolo.",
  "Checklist stages": "Etapas do checklist",
  "Fix blockers": "Resolver bloqueios",
  "Document collection": "Coleta de documentos",
  "Appointment prep": "Preparação da consulta",
  "Naturalization filing": "Protocolo de naturalização",
  "After approval": "Após aprovação",
  "Other tasks": "Outras tarefas",
  "Clear issues that could stop the case before collecting everything else.":
    "Resolva problemas que podem travar o caso antes de juntar todo o resto.",
  "Gather identity, civil registry, family, and nationality records.":
    "Reúna registros de identidade, registro civil, família e nacionalidade.",
  "Prepare scheduling, appearances, witnesses, and appointment-specific items.":
    "Prepare agendamento, comparecimentos, testemunhas e itens específicos da consulta.",
  "Prepare SRE filing documents, residence proof, exams, and modality evidence.":
    "Prepare documentos da SRE, prova de residência, exames e evidência da modalidade.",
  "Handle passport, CURP, ID, or post-approval follow-up tasks.":
    "Cuide de passaporte, CURP, ID ou tarefas após aprovação.",
  "Track remaining tasks that do not fit a specific stage yet.":
    "Acompanhe tarefas restantes que ainda não se encaixam em uma etapa.",
  "Unsaved chat": "Chat não salvo",
  "Saved chat": "Chat salvo",
  "Citizenship assistant": "Assistente de cidadania",
  "Checklist support": "Apoio para o checklist",
  You: "Você",
  Assistant: "Assistente",
  "Thinking through your checklist...": "Analisando seu checklist...",
  Saved: "Salvo",
  "Save chat": "Salvar chat",
  "Ask about a checklist item...": "Pergunte sobre um item do checklist...",
  Send: "Enviar",
  "Chat saved": "Chat salvo",
  "This conversation will stay with your citizenship checklist.":
    "Esta conversa ficará com seu checklist de cidadania.",
  "Assistant unavailable": "Assistente indisponível",
  "Try again in a moment.": "Tente novamente em instantes.",
  "I could not reach the assistant right now, but your checklist is still saved.":
    "Não consegui acessar o assistente agora, mas seu checklist ainda está salvo.",
  "Start with unresolved blockers, then gather the highest-proof records first: long-form birth records, Mexican actas, IDs, name-change documents, and any consulate-specific items.":
    "Comece pelos bloqueios pendentes e depois reúna primeiro os documentos mais fortes: certidões completas, actas mexicanas, IDs, documentos de mudança de nome e itens específicos do consulado.",
});

Object.assign(IT_TEXT, {
  "Assist me": "Aiutami",
  "Analyze my checklist": "Analizza la checklist",
  "Next best action": "Prossima azione migliore",
  "Resolve this before moving forward.":
    "Risolvi questo punto prima di andare avanti.",
  "Work on this checklist item next.":
    "Lavora ora su questo punto della checklist.",
  "Checklist complete": "Checklist completa",
  "All checklist items are marked complete. Review official requirements before filing or attending an appointment.":
    "Tutti i punti della checklist sono completati. Verifica i requisiti ufficiali prima di presentare o andare all'appuntamento.",
  "High priority": "Alta priorità",
  "Appointment-stopper": "Può bloccare l'appuntamento",
  "Route guidance": "Guida percorso",
  "Based on your answers, this is the clearest route the guide found. Officials may still require document review.":
    "In base alle risposte, questo è il percorso più chiaro trovato. Le autorità possono comunque richiedere revisione dei documenti.",
  "This result has blockers. Resolve them before relying on the route or booking a final appointment.":
    "Questo risultato ha blocchi. Risolvili prima di fare affidamento sul percorso o prenotare l'appuntamento finale.",
  "This looks like a prerequisite-building path, not a filing-ready path yet.":
    "Sembra un percorso per completare prerequisiti, non ancora pronto per la domanda.",
  "Checklist stages": "Fasi checklist",
  "Fix blockers": "Risolvere blocchi",
  "Document collection": "Raccolta documenti",
  "Appointment prep": "Preparazione appuntamento",
  "Naturalization filing": "Domanda di naturalizzazione",
  "After approval": "Dopo approvazione",
  "Other tasks": "Altre attività",
  "Clear issues that could stop the case before collecting everything else.":
    "Risolvi problemi che potrebbero fermare il caso prima di raccogliere tutto il resto.",
  "Gather identity, civil registry, family, and nationality records.":
    "Raccogli documenti di identità, stato civile, famiglia e nazionalità.",
  "Prepare scheduling, appearances, witnesses, and appointment-specific items.":
    "Prepara prenotazione, presenze, testimoni e requisiti specifici dell'appuntamento.",
  "Prepare SRE filing documents, residence proof, exams, and modality evidence.":
    "Prepara documenti SRE, prova di residenza, esami ed evidenza della modalità.",
  "Handle passport, CURP, ID, or post-approval follow-up tasks.":
    "Gestisci passaporto, CURP, ID o attività successive all'approvazione.",
  "Track remaining tasks that do not fit a specific stage yet.":
    "Tieni traccia delle attività rimanenti non ancora assegnate a una fase.",
  "Unsaved chat": "Chat non salvata",
  "Saved chat": "Chat salvata",
  "Citizenship assistant": "Assistente cittadinanza",
  "Checklist support": "Supporto checklist",
  You: "Tu",
  Assistant: "Assistente",
  "Thinking through your checklist...": "Analisi della checklist...",
  Saved: "Salvata",
  "Save chat": "Salva chat",
  "Ask about a checklist item...": "Chiedi di un punto della checklist...",
  Send: "Invia",
  "Chat saved": "Chat salvata",
  "This conversation will stay with your citizenship checklist.":
    "Questa conversazione resterà con la tua checklist di cittadinanza.",
  "Assistant unavailable": "Assistente non disponibile",
  "Try again in a moment.": "Riprova tra poco.",
  "I could not reach the assistant right now, but your checklist is still saved.":
    "Non riesco a raggiungere l'assistente ora, ma la checklist è ancora salvata.",
  "Start with unresolved blockers, then gather the highest-proof records first: long-form birth records, Mexican actas, IDs, name-change documents, and any consulate-specific items.":
    "Inizia dai blocchi irrisolti, poi raccogli prima i documenti più forti: certificati completi, actas messicane, documenti d'identità, cambi di nome e requisiti specifici del consolato.",
});

Object.assign(FR_TEXT, {
  "Assist me": "Aide-moi",
  "Analyze my checklist": "Analyser ma checklist",
  "Next best action": "Prochaine meilleure action",
  "Resolve this before moving forward.": "Résous cela avant d'avancer.",
  "Work on this checklist item next.":
    "Travaille ensuite sur cet élément de la checklist.",
  "Checklist complete": "Checklist complète",
  "All checklist items are marked complete. Review official requirements before filing or attending an appointment.":
    "Tous les éléments sont terminés. Vérifie les exigences officielles avant de déposer ou d'aller au rendez-vous.",
  "High priority": "Priorité élevée",
  "Appointment-stopper": "Peut bloquer le rendez-vous",
  "Route guidance": "Orientation du parcours",
  "Based on your answers, this is the clearest route the guide found. Officials may still require document review.":
    "D'après tes réponses, c'est le parcours le plus clair trouvé. Les autorités peuvent encore demander une revue des documents.",
  "This result has blockers. Resolve them before relying on the route or booking a final appointment.":
    "Ce résultat a des blocages. Résous-les avant de te fier au parcours ou de prendre le rendez-vous final.",
  "This looks like a prerequisite-building path, not a filing-ready path yet.":
    "Cela ressemble à un parcours de prérequis, pas encore prêt pour le dépôt.",
  "Checklist stages": "Étapes de la checklist",
  "Fix blockers": "Résoudre les blocages",
  "Document collection": "Collecte de documents",
  "Appointment prep": "Préparation du rendez-vous",
  "Naturalization filing": "Dépôt de naturalisation",
  "After approval": "Après approbation",
  "Other tasks": "Autres tâches",
  "Clear issues that could stop the case before collecting everything else.":
    "Résous les problèmes qui pourraient bloquer le dossier avant de tout collecter.",
  "Gather identity, civil registry, family, and nationality records.":
    "Rassemble les documents d'identité, d'état civil, familiaux et de nationalité.",
  "Prepare scheduling, appearances, witnesses, and appointment-specific items.":
    "Prépare la prise de rendez-vous, les présences, témoins et éléments propres au rendez-vous.",
  "Prepare SRE filing documents, residence proof, exams, and modality evidence.":
    "Prépare les documents SRE, preuve de résidence, examens et preuves de modalité.",
  "Handle passport, CURP, ID, or post-approval follow-up tasks.":
    "Gère passeport, CURP, ID ou tâches après approbation.",
  "Track remaining tasks that do not fit a specific stage yet.":
    "Suis les tâches restantes qui n'entrent pas encore dans une étape précise.",
  "Unsaved chat": "Chat non enregistré",
  "Saved chat": "Chat enregistré",
  "Citizenship assistant": "Assistant citoyenneté",
  "Checklist support": "Aide pour la checklist",
  You: "Vous",
  Assistant: "Assistant",
  "Thinking through your checklist...": "Analyse de ta checklist...",
  Saved: "Enregistré",
  "Save chat": "Enregistrer le chat",
  "Ask about a checklist item...":
    "Pose une question sur un élément de la checklist...",
  Send: "Envoyer",
  "Chat saved": "Chat enregistré",
  "This conversation will stay with your citizenship checklist.":
    "Cette conversation restera avec ta checklist de citoyenneté.",
  "Assistant unavailable": "Assistant indisponible",
  "Try again in a moment.": "Réessaie dans un instant.",
  "I could not reach the assistant right now, but your checklist is still saved.":
    "Je n'ai pas pu joindre l'assistant pour le moment, mais ta checklist est toujours enregistrée.",
  "Start with unresolved blockers, then gather the highest-proof records first: long-form birth records, Mexican actas, IDs, name-change documents, and any consulate-specific items.":
    "Commence par les blocages non résolus, puis rassemble d'abord les documents les plus solides : actes complets, actas mexicaines, pièces d'identité, documents de changement de nom et éléments propres au consulat.",
});

Object.assign(JA_TEXT, {
  "Assist me": "サポートして",
  "Analyze my checklist": "チェックリストを分析",
  "Next best action": "次にやるべきこと",
  "Resolve this before moving forward.": "先にこれを解決してください。",
  "Work on this checklist item next.":
    "次はこのチェックリスト項目に取り組んでください。",
  "Checklist complete": "チェックリスト完了",
  "All checklist items are marked complete. Review official requirements before filing or attending an appointment.":
    "すべて完了しています。申請や予約前に公式要件を確認してください。",
  "High priority": "高優先度",
  "Appointment-stopper": "予約を止める可能性",
  "Route guidance": "ルート案内",
  "Based on your answers, this is the clearest route the guide found. Officials may still require document review.":
    "回答に基づくと、これが最も明確なルートです。ただし当局が書類確認を求める場合があります。",
  "This result has blockers. Resolve them before relying on the route or booking a final appointment.":
    "この結果にはブロック要因があります。ルートに進む前や予約前に解決してください。",
  "This looks like a prerequisite-building path, not a filing-ready path yet.":
    "これはまだ申請準備完了ではなく、前提条件を整える段階です。",
  "Checklist stages": "チェックリスト段階",
  "Fix blockers": "ブロック解決",
  "Document collection": "書類収集",
  "Appointment prep": "予約準備",
  "Naturalization filing": "帰化申請",
  "After approval": "承認後",
  "Other tasks": "その他のタスク",
  "Clear issues that could stop the case before collecting everything else.":
    "他の収集前に、手続きを止める可能性のある問題を解決します。",
  "Gather identity, civil registry, family, and nationality records.":
    "身分、戸籍・民事登録、家族、国籍関連書類を集めます。",
  "Prepare scheduling, appearances, witnesses, and appointment-specific items.":
    "予約、出席者、証人、予約固有の項目を準備します。",
  "Prepare SRE filing documents, residence proof, exams, and modality evidence.":
    "SRE書類、居住証明、試験、該当ルートの証拠を準備します。",
  "Handle passport, CURP, ID, or post-approval follow-up tasks.":
    "パスポート、CURP、ID、承認後のフォローを進めます。",
  "Track remaining tasks that do not fit a specific stage yet.":
    "特定の段階に入らない残りタスクを管理します。",
  "Unsaved chat": "未保存チャット",
  "Saved chat": "保存済みチャット",
  "Citizenship assistant": "国籍アシスタント",
  "Checklist support": "チェックリスト支援",
  You: "あなた",
  Assistant: "アシスタント",
  "Thinking through your checklist...": "チェックリストを確認中...",
  Saved: "保存済み",
  "Save chat": "チャットを保存",
  "Ask about a checklist item...": "チェックリスト項目について質問...",
  Send: "送信",
  "Chat saved": "チャットを保存しました",
  "This conversation will stay with your citizenship checklist.":
    "この会話は国籍チェックリストに保存されます。",
  "Assistant unavailable": "アシスタントを利用できません",
  "Try again in a moment.": "少ししてからもう一度お試しください。",
  "I could not reach the assistant right now, but your checklist is still saved.":
    "現在アシスタントに接続できませんが、チェックリストは保存されています。",
  "Start with unresolved blockers, then gather the highest-proof records first: long-form birth records, Mexican actas, IDs, name-change documents, and any consulate-specific items.":
    "未解決のブロック要因から始め、次に証明力の高い書類を集めてください。長形式の出生記録、メキシコのacta、身分証、氏名変更書類、領事館固有の項目です。",
});

Object.assign(HI_TEXT, {
  "Assist me": "मेरी मदद करें",
  "Analyze my checklist": "मेरी चेकलिस्ट देखें",
  "Next best action": "अगला सबसे अच्छा कदम",
  "Resolve this before moving forward.": "आगे बढ़ने से पहले इसे हल करें।",
  "Work on this checklist item next.": "अब इस चेकलिस्ट आइटम पर काम करें।",
  "Checklist complete": "चेकलिस्ट पूरी",
  "All checklist items are marked complete. Review official requirements before filing or attending an appointment.":
    "सभी आइटम पूरे हैं। फाइल करने या अपॉइंटमेंट पर जाने से पहले आधिकारिक आवश्यकताएं देखें।",
  "High priority": "उच्च प्राथमिकता",
  "Appointment-stopper": "अपॉइंटमेंट रोक सकता है",
  "Route guidance": "मार्ग मार्गदर्शन",
  "Based on your answers, this is the clearest route the guide found. Officials may still require document review.":
    "आपके उत्तरों के आधार पर यह सबसे स्पष्ट मार्ग है। अधिकारी फिर भी दस्तावेज़ समीक्षा मांग सकते हैं।",
  "This result has blockers. Resolve them before relying on the route or booking a final appointment.":
    "इस परिणाम में blockers हैं। मार्ग पर भरोसा करने या अंतिम अपॉइंटमेंट बुक करने से पहले इन्हें हल करें।",
  "This looks like a prerequisite-building path, not a filing-ready path yet.":
    "यह अभी filing-ready मार्ग नहीं, बल्कि prerequisite पूरा करने का मार्ग लगता है।",
  "Checklist stages": "चेकलिस्ट चरण",
  "Fix blockers": "Blockers हल करें",
  "Document collection": "दस्तावेज़ संग्रह",
  "Appointment prep": "अपॉइंटमेंट तैयारी",
  "Naturalization filing": "Naturalization filing",
  "After approval": "अनुमोदन के बाद",
  "Other tasks": "अन्य कार्य",
  "Clear issues that could stop the case before collecting everything else.":
    "बाकी सब इकट्ठा करने से पहले केस रोक सकने वाली समस्याएं हल करें।",
  "Gather identity, civil registry, family, and nationality records.":
    "पहचान, civil registry, family, और nationality records इकट्ठा करें।",
  "Prepare scheduling, appearances, witnesses, and appointment-specific items.":
    "Scheduling, appearances, witnesses, और appointment-specific items तैयार करें।",
  "Prepare SRE filing documents, residence proof, exams, and modality evidence.":
    "SRE filing documents, residence proof, exams, और modality evidence तैयार करें।",
  "Handle passport, CURP, ID, or post-approval follow-up tasks.":
    "Passport, CURP, ID, या post-approval follow-up tasks करें।",
  "Track remaining tasks that do not fit a specific stage yet.":
    "बाकी tasks ट्रैक करें जो अभी किसी खास stage में फिट नहीं होते।",
  "Unsaved chat": "सेव न की गई चैट",
  "Saved chat": "सेव की गई चैट",
  "Citizenship assistant": "नागरिकता सहायक",
  "Checklist support": "चेकलिस्ट सहायता",
  You: "आप",
  Assistant: "सहायक",
  "Thinking through your checklist...": "आपकी चेकलिस्ट देख रहा है...",
  Saved: "सेव",
  "Save chat": "चैट सेव करें",
  "Ask about a checklist item...": "चेकलिस्ट आइटम के बारे में पूछें...",
  Send: "भेजें",
  "Chat saved": "चैट सेव हुई",
  "This conversation will stay with your citizenship checklist.":
    "यह बातचीत आपकी नागरिकता चेकलिस्ट के साथ रहेगी।",
  "Assistant unavailable": "सहायक उपलब्ध नहीं",
  "Try again in a moment.": "थोड़ी देर में फिर कोशिश करें।",
  "I could not reach the assistant right now, but your checklist is still saved.":
    "अभी सहायक से संपर्क नहीं हो सका, लेकिन आपकी चेकलिस्ट सेव है।",
  "Start with unresolved blockers, then gather the highest-proof records first: long-form birth records, Mexican actas, IDs, name-change documents, and any consulate-specific items.":
    "पहले अधूरे blockers हल करें, फिर सबसे मजबूत दस्तावेज़ इकट्ठा करें: long-form birth records, Mexican actas, IDs, name-change documents, और consulate-specific items.",
});

Object.assign(AR_TEXT, {
  "Assist me": "ساعدني",
  "Analyze my checklist": "حلّل قائمتي",
  "Next best action": "أفضل خطوة تالية",
  "Resolve this before moving forward.": "حل هذه النقطة قبل المتابعة.",
  "Work on this checklist item next.": "اعمل على هذا البند التالي في القائمة.",
  "Checklist complete": "القائمة مكتملة",
  "All checklist items are marked complete. Review official requirements before filing or attending an appointment.":
    "كل البنود مكتملة. راجع المتطلبات الرسمية قبل التقديم أو حضور الموعد.",
  "High priority": "أولوية عالية",
  "Appointment-stopper": "قد يوقف الموعد",
  "Route guidance": "إرشاد المسار",
  "Based on your answers, this is the clearest route the guide found. Officials may still require document review.":
    "بناء على إجاباتك، هذا أوضح مسار وجدته الأداة. قد تطلب الجهات الرسمية مراجعة الوثائق.",
  "This result has blockers. Resolve them before relying on the route or booking a final appointment.":
    "هذه النتيجة فيها عوائق. حلها قبل الاعتماد على المسار أو حجز موعد نهائي.",
  "This looks like a prerequisite-building path, not a filing-ready path yet.":
    "يبدو هذا مسارا لاستكمال المتطلبات، وليس جاهزا للتقديم بعد.",
  "Checklist stages": "مراحل القائمة",
  "Fix blockers": "حل العوائق",
  "Document collection": "جمع الوثائق",
  "Appointment prep": "تحضير الموعد",
  "Naturalization filing": "تقديم التجنس",
  "After approval": "بعد الموافقة",
  "Other tasks": "مهام أخرى",
  "Clear issues that could stop the case before collecting everything else.":
    "حل المسائل التي قد توقف القضية قبل جمع بقية الوثائق.",
  "Gather identity, civil registry, family, and nationality records.":
    "اجمع وثائق الهوية والسجل المدني والأسرة والجنسية.",
  "Prepare scheduling, appearances, witnesses, and appointment-specific items.":
    "حضّر الحجز والحضور والشهود ومتطلبات الموعد.",
  "Prepare SRE filing documents, residence proof, exams, and modality evidence.":
    "حضّر وثائق SRE وإثبات الإقامة والاختبارات وأدلة المسار.",
  "Handle passport, CURP, ID, or post-approval follow-up tasks.":
    "أنجز جواز السفر أو CURP أو الهوية أو مهام ما بعد الموافقة.",
  "Track remaining tasks that do not fit a specific stage yet.":
    "تابع المهام المتبقية التي لا تناسب مرحلة محددة بعد.",
  "Unsaved chat": "محادثة غير محفوظة",
  "Saved chat": "محادثة محفوظة",
  "Citizenship assistant": "مساعد الجنسية",
  "Checklist support": "دعم قائمة الوثائق",
  You: "أنت",
  Assistant: "المساعد",
  "Thinking through your checklist...": "أراجع قائمتك...",
  Saved: "محفوظ",
  "Save chat": "احفظ المحادثة",
  "Ask about a checklist item...": "اسأل عن بند في القائمة...",
  Send: "إرسال",
  "Chat saved": "تم حفظ المحادثة",
  "This conversation will stay with your citizenship checklist.":
    "ستبقى هذه المحادثة مع قائمة الجنسية الخاصة بك.",
  "Assistant unavailable": "المساعد غير متاح",
  "Try again in a moment.": "حاول مرة أخرى بعد قليل.",
  "I could not reach the assistant right now, but your checklist is still saved.":
    "تعذر الوصول إلى المساعد الآن، لكن قائمتك لا تزال محفوظة.",
  "Start with unresolved blockers, then gather the highest-proof records first: long-form birth records, Mexican actas, IDs, name-change documents, and any consulate-specific items.":
    "ابدأ بالعوائق غير المحلولة، ثم اجمع أولا أقوى الوثائق: سجلات الميلاد الكاملة، actas المكسيكية، الهويات، وثائق تغيير الاسم، وأي متطلبات خاصة بالقنصلية.",
});

Object.assign(ZH_TEXT, {
  "Assist me": "协助我",
  "Analyze my checklist": "分析我的清单",
  "Next best action": "下一步最佳行动",
  "Resolve this before moving forward.": "继续前先解决此问题。",
  "Work on this checklist item next.": "接下来处理这个清单项目。",
  "Checklist complete": "清单已完成",
  "All checklist items are marked complete. Review official requirements before filing or attending an appointment.":
    "所有清单项目均已完成。提交或赴约前请核实官方要求。",
  "High priority": "高优先级",
  "Appointment-stopper": "可能阻止预约",
  "Route guidance": "路径指导",
  "Based on your answers, this is the clearest route the guide found. Officials may still require document review.":
    "根据你的回答，这是本指南找到的最清晰路径。官方仍可能要求文件审查。",
  "This result has blockers. Resolve them before relying on the route or booking a final appointment.":
    "此结果存在阻碍。请先解决，再依赖该路径或预约最终办理。",
  "This looks like a prerequisite-building path, not a filing-ready path yet.":
    "这看起来是补齐前置条件的路径，尚未准备好提交。",
  "Checklist stages": "清单阶段",
  "Fix blockers": "解决阻碍",
  "Document collection": "收集文件",
  "Appointment prep": "预约准备",
  "Naturalization filing": "入籍提交",
  "After approval": "批准后",
  "Other tasks": "其他任务",
  "Clear issues that could stop the case before collecting everything else.":
    "先解决可能阻止案件的事项，再收集其他材料。",
  "Gather identity, civil registry, family, and nationality records.":
    "收集身份、民事登记、家庭和国籍记录。",
  "Prepare scheduling, appearances, witnesses, and appointment-specific items.":
    "准备预约、到场人员、见证人和预约特定要求。",
  "Prepare SRE filing documents, residence proof, exams, and modality evidence.":
    "准备 SRE 提交文件、居住证明、考试和路径证明。",
  "Handle passport, CURP, ID, or post-approval follow-up tasks.":
    "处理护照、CURP、身份证件或批准后的后续事项。",
  "Track remaining tasks that do not fit a specific stage yet.":
    "跟踪尚不属于特定阶段的剩余任务。",
  "Unsaved chat": "未保存聊天",
  "Saved chat": "已保存聊天",
  "Citizenship assistant": "国籍助手",
  "Checklist support": "清单支持",
  You: "你",
  Assistant: "助手",
  "Thinking through your checklist...": "正在分析你的清单...",
  Saved: "已保存",
  "Save chat": "保存聊天",
  "Ask about a checklist item...": "询问某个清单项目...",
  Send: "发送",
  "Chat saved": "聊天已保存",
  "This conversation will stay with your citizenship checklist.":
    "此对话会保存在你的国籍清单中。",
  "Assistant unavailable": "助手暂不可用",
  "Try again in a moment.": "请稍后再试。",
  "I could not reach the assistant right now, but your checklist is still saved.":
    "现在无法连接助手，但你的清单仍已保存。",
  "Start with unresolved blockers, then gather the highest-proof records first: long-form birth records, Mexican actas, IDs, name-change documents, and any consulate-specific items.":
    "先处理未解决的阻碍，然后优先收集证明力最强的文件：长格式出生记录、墨西哥 actas、身份证件、姓名变更文件以及领事馆特定要求。",
});

Object.assign(ES_TEXT, {
  "Why it matters": "Por qué importa",
  "What to check": "Qué revisar",
  "How to resolve": "Cómo resolverlo",
  "Common mistake": "Error común",
  "This item can delay or stop the route until the consulate, SRE, or civil registry confirms the path.":
    "Este punto puede retrasar o detener la ruta hasta que el consulado, SRE o registro civil confirme el camino.",
  "This item helps prove the route and reduces the chance of an appointment delay.":
    "Este punto ayuda a probar la ruta y reduce la probabilidad de retraso en la cita.",
  "Compare names, dates, parent details, actas, IDs, and certificate format before scheduling.":
    "Compara nombres, fechas, datos de padres, actas, identificaciones y formato del certificado antes de agendar.",
  "Order the correct long-form or certified record, then correct mismatches before relying on it.":
    "Solicita el acta larga o certificada correcta y corrige inconsistencias antes de depender de ella.",
  "Short-form records, missing parent details, or small name differences can still cause rejection.":
    "Actas cortas, datos de padres faltantes o pequeñas diferencias de nombre aún pueden causar rechazo.",
  "Confirm who must appear or consent, and collect marriage, death, custody, adoption, or court records if relevant.":
    "Confirma quién debe presentarse o consentir, y reúne actas de matrimonio, defunción, custodia, adopción o documentos judiciales si aplica.",
  "Contact the consulate or civil registry with the exact parentage issue before booking the appointment.":
    "Contacta al consulado o registro civil con el problema exacto de filiación antes de agendar la cita.",
  "Do not assume a missing, deceased, or unavailable parent can be handled the same way at every consulate.":
    "No asumas que un padre ausente, fallecido o no disponible se maneja igual en todos los consulados.",
  "Check whether the record needs apostille/legalization and an authorized translation.":
    "Revisa si el documento necesita apostilla/legalización y traducción autorizada.",
  "Request the apostille or legalization from the issuing authority and use the required translator before filing.":
    "Solicita la apostilla o legalización ante la autoridad emisora y usa el traductor requerido antes de presentar.",
  "Apostilles and translations can take time, so do not leave this until appointment week.":
    "Las apostillas y traducciones pueden tardar, así que no lo dejes para la semana de la cita.",
  "Confirm the correct appointment category, required originals, copies, witnesses, and who must attend.":
    "Confirma la categoría correcta de cita, originales requeridos, copias, testigos y quién debe asistir.",
  "Use the official appointment system, choose the matching service category, and bring the exact people and records required.":
    "Usa el sistema oficial de citas, elige la categoría correcta y lleva a las personas y documentos exactos requeridos.",
  "Booking the wrong appointment type can delay the case even when documents are ready.":
    "Agendar el tipo de cita equivocado puede retrasar el caso aunque los documentos estén listos.",
  "Confirm resident status, CURP, INM address match, card validity, absence limits, and modality proof before filing.":
    "Confirma estatus de residente, CURP, dirección ante INM, vigencia de tarjeta, límites de ausencias y prueba de modalidad antes de presentar.",
  "Update immigration records, wait out timing problems, or gather modality proof before submitting to SRE.":
    "Actualiza registros migratorios, espera a cumplir tiempos o reúne la prueba de modalidad antes de presentar ante SRE.",
  "Student, tourist, or mismatched INM records may not count for naturalization filing.":
    "Estatus de estudiante, turista o datos INM inconsistentes pueden no contar para naturalización.",
  "Verify the issued Mexican record before using it for passport, CURP, or ID steps.":
    "Verifica el registro mexicano emitido antes de usarlo para pasaporte, CURP o identificación.",
  "Request corrections immediately if the issued acta, CURP, or identity record has an error.":
    "Solicita correcciones de inmediato si el acta, CURP o registro de identidad emitido tiene un error.",
  "Do not skip checking the issued record for name or date errors.":
    "No omitas revisar el registro emitido por errores de nombre o fecha.",
  "Confirm the record is current, certified when required, and matches the names in your other documents.":
    "Confirma que el documento sea vigente, certificado cuando se requiera, y que coincida con los nombres en tus otros documentos.",
  "Find the official requirement, gather the exact supporting record, and keep a copy with your case file.":
    "Encuentra el requisito oficial, reúne el documento de respaldo exacto y guarda una copia en tu expediente.",
  "Do not assume a similar document is acceptable; verify the exact official requirement.":
    "No asumas que un documento parecido sirve; verifica el requisito oficial exacto.",
});

Object.assign(PT_TEXT, {
  "Why it matters": "Por que importa",
  "What to check": "O que verificar",
  "How to resolve": "Como resolver",
  "Common mistake": "Erro comum",
  "This item can delay or stop the route until the consulate, SRE, or civil registry confirms the path.":
    "Este item pode atrasar ou parar a rota até que o consulado, a SRE ou o registro civil confirme o caminho.",
  "This item helps prove the route and reduces the chance of an appointment delay.":
    "Este item ajuda a provar a rota e reduz a chance de atraso na consulta.",
  "Compare names, dates, parent details, actas, IDs, and certificate format before scheduling.":
    "Compare nomes, datas, dados dos pais, certidões mexicanas, documentos de identidade e formato da certidão antes de agendar.",
  "Order the correct long-form or certified record, then correct mismatches before relying on it.":
    "Solicite o registro completo ou certificado correto e corrija divergências antes de depender dele.",
  "Short-form records, missing parent details, or small name differences can still cause rejection.":
    "Registros abreviados, dados dos pais ausentes ou pequenas diferenças de nome ainda podem causar rejeição.",
  "Confirm who must appear or consent, and collect marriage, death, custody, adoption, or court records if relevant.":
    "Confirme quem deve comparecer ou consentir, e reúna registros de casamento, óbito, guarda, adoção ou judiciais se relevante.",
  "Contact the consulate or civil registry with the exact parentage issue before booking the appointment.":
    "Contate o consulado ou registro civil com a questão exata de filiação antes de marcar a consulta.",
  "Do not assume a missing, deceased, or unavailable parent can be handled the same way at every consulate.":
    "Não presuma que um pai ausente, falecido ou indisponível será tratado da mesma forma em todos os consulados.",
  "Check whether the record needs apostille/legalization and an authorized translation.":
    "Verifique se o registro precisa de apostila/legalização e tradução autorizada.",
  "Request the apostille or legalization from the issuing authority and use the required translator before filing.":
    "Solicite a apostila ou legalização à autoridade emissora e use o tradutor exigido antes de protocolar.",
  "Apostilles and translations can take time, so do not leave this until appointment week.":
    "Apostilas e traduções podem demorar, então não deixe para a semana da consulta.",
  "Confirm the correct appointment category, required originals, copies, witnesses, and who must attend.":
    "Confirme a categoria correta da consulta, originais exigidos, cópias, testemunhas e quem deve comparecer.",
  "Use the official appointment system, choose the matching service category, and bring the exact people and records required.":
    "Use o sistema oficial de agendamento, escolha a categoria correta e leve exatamente as pessoas e registros exigidos.",
  "Booking the wrong appointment type can delay the case even when documents are ready.":
    "Agendar o tipo errado de consulta pode atrasar o caso mesmo quando os documentos estão prontos.",
  "Confirm resident status, CURP, INM address match, card validity, absence limits, and modality proof before filing.":
    "Confirme status de residente, CURP, endereço no INM, validade do cartão, limites de ausência e prova da modalidade antes de protocolar.",
  "Update immigration records, wait out timing problems, or gather modality proof before submitting to SRE.":
    "Atualize registros migratórios, aguarde prazos necessários ou reúna prova da modalidade antes de enviar à SRE.",
  "Student, tourist, or mismatched INM records may not count for naturalization filing.":
    "Registros de estudante, turista ou dados INM divergentes podem não contar para naturalização.",
  "Verify the issued Mexican record before using it for passport, CURP, or ID steps.":
    "Verifique o registro mexicano emitido antes de usá-lo para passaporte, CURP ou documento de identidade.",
  "Request corrections immediately if the issued acta, CURP, or identity record has an error.":
    "Peça correções imediatamente se a acta, CURP ou registro de identidade emitido tiver erro.",
  "Do not skip checking the issued record for name or date errors.":
    "Não deixe de conferir o registro emitido por erros de nome ou data.",
  "Confirm the record is current, certified when required, and matches the names in your other documents.":
    "Confirme que o registro está atual, certificado quando exigido e combina com os nomes nos outros documentos.",
  "Find the official requirement, gather the exact supporting record, and keep a copy with your case file.":
    "Encontre o requisito oficial, reúna o documento de apoio exato e guarde uma cópia no seu dossiê.",
  "Do not assume a similar document is acceptable; verify the exact official requirement.":
    "Não presuma que um documento parecido serve; verifique o requisito oficial exato.",
});

Object.assign(IT_TEXT, {
  "Why it matters": "Perché conta",
  "What to check": "Cosa verificare",
  "How to resolve": "Come risolvere",
  "Common mistake": "Errore comune",
  "This item can delay or stop the route until the consulate, SRE, or civil registry confirms the path.":
    "Questo punto può ritardare o bloccare il percorso finché consolato, SRE o registro civile confermano la strada.",
  "This item helps prove the route and reduces the chance of an appointment delay.":
    "Questo punto aiuta a provare il percorso e riduce il rischio di ritardi all'appuntamento.",
  "Compare names, dates, parent details, actas, IDs, and certificate format before scheduling.":
    "Confronta nomi, date, dati dei genitori, atti messicani, documenti d'identità e formato del certificato prima di prenotare.",
  "Order the correct long-form or certified record, then correct mismatches before relying on it.":
    "Richiedi il documento completo o certificato corretto e correggi le incongruenze prima di usarlo.",
  "Short-form records, missing parent details, or small name differences can still cause rejection.":
    "Documenti abbreviati, dati dei genitori mancanti o piccole differenze nei nomi possono comunque causare rigetto.",
  "Confirm who must appear or consent, and collect marriage, death, custody, adoption, or court records if relevant.":
    "Conferma chi deve comparire o dare consenso e raccogli atti di matrimonio, morte, custodia, adozione o tribunale se rilevanti.",
  "Contact the consulate or civil registry with the exact parentage issue before booking the appointment.":
    "Contatta consolato o registro civile con il problema esatto di parentela prima di prenotare.",
  "Do not assume a missing, deceased, or unavailable parent can be handled the same way at every consulate.":
    "Non presumere che un genitore mancante, deceduto o non disponibile sia gestito allo stesso modo in ogni consolato.",
  "Check whether the record needs apostille/legalization and an authorized translation.":
    "Verifica se il documento richiede apostille/legalizzazione e traduzione autorizzata.",
  "Request the apostille or legalization from the issuing authority and use the required translator before filing.":
    "Richiedi apostille o legalizzazione all'autorità emittente e usa il traduttore richiesto prima di presentare.",
  "Apostilles and translations can take time, so do not leave this until appointment week.":
    "Apostille e traduzioni possono richiedere tempo, quindi non lasciarle alla settimana dell'appuntamento.",
  "Confirm the correct appointment category, required originals, copies, witnesses, and who must attend.":
    "Conferma categoria corretta dell'appuntamento, originali richiesti, copie, testimoni e chi deve presentarsi.",
  "Use the official appointment system, choose the matching service category, and bring the exact people and records required.":
    "Usa il sistema ufficiale, scegli la categoria corretta e porta esattamente persone e documenti richiesti.",
  "Booking the wrong appointment type can delay the case even when documents are ready.":
    "Prenotare il tipo di appuntamento sbagliato può ritardare il caso anche con documenti pronti.",
  "Confirm resident status, CURP, INM address match, card validity, absence limits, and modality proof before filing.":
    "Conferma status di residente, CURP, indirizzo INM, validità della carta, limiti di assenza e prova della modalità prima di presentare.",
  "Update immigration records, wait out timing problems, or gather modality proof before submitting to SRE.":
    "Aggiorna i registri migratori, attendi i tempi necessari o raccogli la prova della modalità prima di inviare alla SRE.",
  "Student, tourist, or mismatched INM records may not count for naturalization filing.":
    "Status studente, turista o dati INM non corrispondenti potrebbero non contare per la naturalizzazione.",
  "Verify the issued Mexican record before using it for passport, CURP, or ID steps.":
    "Verifica il registro messicano emesso prima di usarlo per passaporto, CURP o documento d'identità.",
  "Request corrections immediately if the issued acta, CURP, or identity record has an error.":
    "Richiedi subito correzioni se acta, CURP o registro d'identità emesso contiene errori.",
  "Do not skip checking the issued record for name or date errors.":
    "Non saltare il controllo del registro emesso per errori di nome o data.",
  "Confirm the record is current, certified when required, and matches the names in your other documents.":
    "Conferma che il documento sia aggiornato, certificato quando richiesto e coerente con i nomi negli altri documenti.",
  "Find the official requirement, gather the exact supporting record, and keep a copy with your case file.":
    "Trova il requisito ufficiale, raccogli il documento di supporto esatto e conserva una copia nel fascicolo.",
  "Do not assume a similar document is acceptable; verify the exact official requirement.":
    "Non presumere che un documento simile sia accettabile; verifica il requisito ufficiale esatto.",
});

Object.assign(FR_TEXT, {
  "Why it matters": "Pourquoi c'est important",
  "What to check": "À vérifier",
  "How to resolve": "Comment résoudre",
  "Common mistake": "Erreur fréquente",
  "This item can delay or stop the route until the consulate, SRE, or civil registry confirms the path.":
    "Cet élément peut retarder ou bloquer le parcours jusqu'à confirmation par le consulat, la SRE ou l'état civil.",
  "This item helps prove the route and reduces the chance of an appointment delay.":
    "Cet élément aide à prouver le parcours et réduit le risque de retard au rendez-vous.",
  "Compare names, dates, parent details, actas, IDs, and certificate format before scheduling.":
    "Compare les noms, dates, informations des parents, actes mexicains, pièces d'identité et format du certificat avant de réserver.",
  "Order the correct long-form or certified record, then correct mismatches before relying on it.":
    "Commande le bon acte complet ou certifié, puis corrige les incohérences avant de t'y fier.",
  "Short-form records, missing parent details, or small name differences can still cause rejection.":
    "Les extraits courts, informations parentales manquantes ou petites différences de nom peuvent encore entraîner un rejet.",
  "Confirm who must appear or consent, and collect marriage, death, custody, adoption, or court records if relevant.":
    "Confirme qui doit comparaître ou consentir, et rassemble les actes de mariage, décès, garde, adoption ou décisions judiciaires si nécessaire.",
  "Contact the consulate or civil registry with the exact parentage issue before booking the appointment.":
    "Contacte le consulat ou l'état civil avec le problème exact de filiation avant de réserver.",
  "Do not assume a missing, deceased, or unavailable parent can be handled the same way at every consulate.":
    "Ne suppose pas qu'un parent absent, décédé ou indisponible est traité de la même façon dans chaque consulat.",
  "Check whether the record needs apostille/legalization and an authorized translation.":
    "Vérifie si le document exige apostille/légalisation et traduction autorisée.",
  "Request the apostille or legalization from the issuing authority and use the required translator before filing.":
    "Demande l'apostille ou la légalisation à l'autorité émettrice et utilise le traducteur requis avant le dépôt.",
  "Apostilles and translations can take time, so do not leave this until appointment week.":
    "Apostilles et traductions peuvent prendre du temps, ne les laisse pas à la semaine du rendez-vous.",
  "Confirm the correct appointment category, required originals, copies, witnesses, and who must attend.":
    "Confirme la bonne catégorie de rendez-vous, les originaux requis, copies, témoins et personnes devant être présentes.",
  "Use the official appointment system, choose the matching service category, and bring the exact people and records required.":
    "Utilise le système officiel, choisis la bonne catégorie et apporte exactement les personnes et documents requis.",
  "Booking the wrong appointment type can delay the case even when documents are ready.":
    "Réserver le mauvais type de rendez-vous peut retarder le dossier même si les documents sont prêts.",
  "Confirm resident status, CURP, INM address match, card validity, absence limits, and modality proof before filing.":
    "Confirme le statut de résident, CURP, adresse INM, validité de la carte, limites d'absence et preuve de modalité avant de déposer.",
  "Update immigration records, wait out timing problems, or gather modality proof before submitting to SRE.":
    "Mets à jour les dossiers migratoires, attends les délais nécessaires ou rassemble la preuve de modalité avant de soumettre à la SRE.",
  "Student, tourist, or mismatched INM records may not count for naturalization filing.":
    "Un statut étudiant, touriste ou des données INM incohérentes peuvent ne pas compter pour la naturalisation.",
  "Verify the issued Mexican record before using it for passport, CURP, or ID steps.":
    "Vérifie l'acte mexicain délivré avant de l'utiliser pour passeport, CURP ou pièce d'identité.",
  "Request corrections immediately if the issued acta, CURP, or identity record has an error.":
    "Demande des corrections immédiatement si l'acta, le CURP ou le document d'identité délivré contient une erreur.",
  "Do not skip checking the issued record for name or date errors.":
    "Ne saute pas la vérification de l'acte délivré pour erreurs de nom ou de date.",
  "Confirm the record is current, certified when required, and matches the names in your other documents.":
    "Confirme que le document est récent, certifié si requis, et cohérent avec les noms de tes autres documents.",
  "Find the official requirement, gather the exact supporting record, and keep a copy with your case file.":
    "Trouve l'exigence officielle, rassemble le justificatif exact et garde une copie dans ton dossier.",
  "Do not assume a similar document is acceptable; verify the exact official requirement.":
    "Ne suppose pas qu'un document similaire suffit; vérifie l'exigence officielle exacte.",
});

Object.assign(JA_TEXT, {
  "Why it matters": "重要な理由",
  "What to check": "確認すること",
  "How to resolve": "解決方法",
  "Common mistake": "よくあるミス",
  "This item can delay or stop the route until the consulate, SRE, or civil registry confirms the path.":
    "この項目は、領事館、SRE、または民事登録機関が手順を確認するまで、手続きを遅らせたり止めたりする可能性があります。",
  "This item helps prove the route and reduces the chance of an appointment delay.":
    "この項目はルートの証明に役立ち、予約時の遅延リスクを下げます。",
  "Compare names, dates, parent details, actas, IDs, and certificate format before scheduling.":
    "予約前に、氏名、日付、親の情報、メキシコの出生登録記録、身分証明書、証明書の形式を照合してください。",
  "Order the correct long-form or certified record, then correct mismatches before relying on it.":
    "正しい長形式または認証済み記録を取得し、使う前に不一致を修正してください。",
  "Short-form records, missing parent details, or small name differences can still cause rejection.":
    "短形式の記録、親情報の不足、小さな氏名の違いでも却下につながることがあります。",
  "Confirm who must appear or consent, and collect marriage, death, custody, adoption, or court records if relevant.":
    "誰が出席または同意すべきか確認し、必要なら婚姻、死亡、親権、養子縁組、裁判所記録を集めてください。",
  "Contact the consulate or civil registry with the exact parentage issue before booking the appointment.":
    "予約前に、具体的な親子関係の問題を領事館または民事登録機関へ確認してください。",
  "Do not assume a missing, deceased, or unavailable parent can be handled the same way at every consulate.":
    "不在、死亡、または参加できない親の扱いがすべての領事館で同じとは限りません。",
  "Check whether the record needs apostille/legalization and an authorized translation.":
    "記録にアポスティーユ/認証と公認翻訳が必要か確認してください。",
  "Request the apostille or legalization from the issuing authority and use the required translator before filing.":
    "提出前に発行機関へアポスティーユまたは認証を依頼し、必要な翻訳者を使用してください。",
  "Apostilles and translations can take time, so do not leave this until appointment week.":
    "アポスティーユや翻訳には時間がかかるため、予約週まで残さないでください。",
  "Confirm the correct appointment category, required originals, copies, witnesses, and who must attend.":
    "正しい予約カテゴリ、必要な原本、コピー、証人、出席者を確認してください。",
  "Use the official appointment system, choose the matching service category, and bring the exact people and records required.":
    "公式予約システムを使い、該当サービスカテゴリを選び、必要な人と記録を正確に持参してください。",
  "Booking the wrong appointment type can delay the case even when documents are ready.":
    "書類が揃っていても、予約タイプを間違えると手続きが遅れます。",
  "Confirm resident status, CURP, INM address match, card validity, absence limits, and modality proof before filing.":
    "申請前に、在留資格、CURP、INM住所一致、カード有効性、不在期間、該当ルート証明を確認してください。",
  "Update immigration records, wait out timing problems, or gather modality proof before submitting to SRE.":
    "SREへ提出する前に、入管記録を更新し、必要な期間を待つか、該当ルートの証明を集めてください。",
  "Student, tourist, or mismatched INM records may not count for naturalization filing.":
    "学生、観光、またはINM情報不一致は帰化申請で認められない場合があります。",
  "Verify the issued Mexican record before using it for passport, CURP, or ID steps.":
    "パスポート、CURP、身分証明書の手続きに使う前に、発行されたメキシコ記録を確認してください。",
  "Request corrections immediately if the issued acta, CURP, or identity record has an error.":
    "発行された出生登録記録、CURP、または身分記録に誤りがある場合はすぐに訂正を依頼してください。",
  "Do not skip checking the issued record for name or date errors.":
    "発行記録の氏名や日付の誤り確認を省略しないでください。",
  "Confirm the record is current, certified when required, and matches the names in your other documents.":
    "記録が最新で、必要な場合は認証済みで、他の書類の氏名と一致することを確認してください。",
  "Find the official requirement, gather the exact supporting record, and keep a copy with your case file.":
    "公式要件を確認し、正確な補足記録を集め、ケースファイルにコピーを保管してください。",
  "Do not assume a similar document is acceptable; verify the exact official requirement.":
    "似た書類で足りると思わず、正確な公式要件を確認してください。",
});

Object.assign(HI_TEXT, {
  "Why it matters": "यह क्यों जरूरी है",
  "What to check": "क्या जांचें",
  "How to resolve": "कैसे हल करें",
  "Common mistake": "सामान्य गलती",
  "This item can delay or stop the route until the consulate, SRE, or civil registry confirms the path.":
    "यह बिंदु प्रक्रिया को तब तक रोक या विलंबित कर सकता है जब तक वाणिज्य दूतावास, SRE या नागरिक पंजीकरण कार्यालय मार्ग की पुष्टि न कर दे।",
  "This item helps prove the route and reduces the chance of an appointment delay.":
    "यह बिंदु आपकी पात्रता की राह साबित करने में मदद करता है और मुलाकात में देरी की संभावना कम करता है।",
  "Compare names, dates, parent details, actas, IDs, and certificate format before scheduling.":
    "मुलाकात तय करने से पहले नाम, तारीखें, माता-पिता का विवरण, मेक्सिकन जन्म रिकॉर्ड, पहचान पत्र और प्रमाणपत्र का प्रारूप मिलाएं।",
  "Order the correct long-form or certified record, then correct mismatches before relying on it.":
    "सही विस्तृत या प्रमाणित रिकॉर्ड मंगाएं, फिर उस पर भरोसा करने से पहले असंगतियां ठीक करें।",
  "Short-form records, missing parent details, or small name differences can still cause rejection.":
    "संक्षिप्त रिकॉर्ड, माता-पिता की जानकारी की कमी या नामों में छोटे अंतर भी अस्वीकृति का कारण बन सकते हैं।",
  "Confirm who must appear or consent, and collect marriage, death, custody, adoption, or court records if relevant.":
    "किसे उपस्थित होना है या सहमति देनी है, इसकी पुष्टि करें, और ज़रूरत हो तो विवाह, मृत्यु, अभिरक्षा, गोद लेने या अदालत के रिकॉर्ड जुटाएं।",
  "Contact the consulate or civil registry with the exact parentage issue before booking the appointment.":
    "मुलाकात तय करने से पहले सटीक माता-पिता संबंधी समस्या के साथ वाणिज्य दूतावास या नागरिक पंजीकरण कार्यालय से संपर्क करें।",
  "Do not assume a missing, deceased, or unavailable parent can be handled the same way at every consulate.":
    "यह न मानें कि अनुपस्थित, मृत या उपलब्ध न होने वाले माता/पिता का मामला हर वाणिज्य दूतावास में एक जैसा संभाला जाएगा।",
  "Check whether the record needs apostille/legalization and an authorized translation.":
    "जांचें कि रिकॉर्ड को अपोस्टिल/वैधीकरण और अधिकृत अनुवाद चाहिए या नहीं।",
  "Request the apostille or legalization from the issuing authority and use the required translator before filing.":
    "आवेदन से पहले जारी करने वाली प्राधिकरण से अपोस्टिल या वैधीकरण लें और आवश्यक अनुवादक का उपयोग करें।",
  "Apostilles and translations can take time, so do not leave this until appointment week.":
    "अपोस्टिल और अनुवाद में समय लग सकता है, इसलिए इसे मुलाकात वाले सप्ताह तक न छोड़ें।",
  "Confirm the correct appointment category, required originals, copies, witnesses, and who must attend.":
    "सही मुलाकात श्रेणी, आवश्यक मूल दस्तावेज़, प्रतियां, गवाह और उपस्थित होने वाले व्यक्ति की पुष्टि करें।",
  "Use the official appointment system, choose the matching service category, and bring the exact people and records required.":
    "आधिकारिक मुलाकात प्रणाली का उपयोग करें, सही सेवा श्रेणी चुनें और आवश्यक व्यक्तियों व रिकॉर्ड को ठीक-ठीक साथ लाएं।",
  "Booking the wrong appointment type can delay the case even when documents are ready.":
    "गलत मुलाकात प्रकार चुनने से दस्तावेज़ तैयार होने पर भी मामला विलंबित हो सकता है।",
  "Confirm resident status, CURP, INM address match, card validity, absence limits, and modality proof before filing.":
    "आवेदन से पहले निवासी स्थिति, CURP, INM पते का मिलान, कार्ड की वैधता, अनुपस्थिति सीमा और मार्ग का प्रमाण पुष्टि करें।",
  "Update immigration records, wait out timing problems, or gather modality proof before submitting to SRE.":
    "SRE में जमा करने से पहले आव्रजन रिकॉर्ड अपडेट करें, समय संबंधी शर्तें पूरी होने दें या मार्ग का प्रमाण जुटाएं।",
  "Student, tourist, or mismatched INM records may not count for naturalization filing.":
    "छात्र, पर्यटक या असंगत INM रिकॉर्ड प्राकृतिककरण आवेदन के लिए मान्य नहीं हो सकते।",
  "Verify the issued Mexican record before using it for passport, CURP, or ID steps.":
    "पासपोर्ट, CURP या पहचान दस्तावेज़ की प्रक्रिया में उपयोग से पहले जारी मेक्सिकन रिकॉर्ड जांचें।",
  "Request corrections immediately if the issued acta, CURP, or identity record has an error.":
    "अगर जारी जन्म रिकॉर्ड, CURP या पहचान रिकॉर्ड में गलती है, तो तुरंत सुधार का अनुरोध करें।",
  "Do not skip checking the issued record for name or date errors.":
    "जारी रिकॉर्ड में नाम या तारीख की गलतियां जांचना न छोड़ें।",
  "Confirm the record is current, certified when required, and matches the names in your other documents.":
    "पुष्टि करें कि रिकॉर्ड वर्तमान है, ज़रूरत पड़ने पर प्रमाणित है और आपके अन्य दस्तावेज़ों के नामों से मेल खाता है।",
  "Find the official requirement, gather the exact supporting record, and keep a copy with your case file.":
    "आधिकारिक आवश्यकता ढूंढें, सही सहायक रिकॉर्ड जुटाएं और अपने मामले की फ़ाइल में एक प्रति रखें।",
  "Do not assume a similar document is acceptable; verify the exact official requirement.":
    "यह न मानें कि मिलता-जुलता दस्तावेज़ स्वीकार होगा; सटीक आधिकारिक आवश्यकता की पुष्टि करें।",
});

Object.assign(AR_TEXT, {
  "Why it matters": "لماذا يهم",
  "What to check": "ما يجب فحصه",
  "How to resolve": "كيفية الحل",
  "Common mistake": "خطأ شائع",
  "This item can delay or stop the route until the consulate, SRE, or civil registry confirms the path.":
    "قد يؤخر هذا البند المسار أو يوقفه إلى أن تؤكد القنصلية أو SRE أو السجل المدني الطريق الصحيح.",
  "This item helps prove the route and reduces the chance of an appointment delay.":
    "يساعد هذا البند في إثبات المسار ويقلل احتمال تأخر الموعد.",
  "Compare names, dates, parent details, actas, IDs, and certificate format before scheduling.":
    "قارن الأسماء والتواريخ وبيانات الوالدين وسجلات الميلاد المكسيكية والهويات وشكل الشهادة قبل الحجز.",
  "Order the correct long-form or certified record, then correct mismatches before relying on it.":
    "اطلب السجل الكامل أو المصدق الصحيح، ثم صحح الاختلافات قبل الاعتماد عليه.",
  "Short-form records, missing parent details, or small name differences can still cause rejection.":
    "السجلات المختصرة أو نقص بيانات الوالدين أو اختلافات الاسم الصغيرة قد تسبب الرفض.",
  "Confirm who must appear or consent, and collect marriage, death, custody, adoption, or court records if relevant.":
    "أكد من يجب أن يحضر أو يوافق، واجمع سجلات الزواج أو الوفاة أو الحضانة أو التبني أو المحكمة عند الحاجة.",
  "Contact the consulate or civil registry with the exact parentage issue before booking the appointment.":
    "تواصل مع القنصلية أو السجل المدني بخصوص مسألة النسب المحددة قبل حجز الموعد.",
  "Do not assume a missing, deceased, or unavailable parent can be handled the same way at every consulate.":
    "لا تفترض أن الوالد الغائب أو المتوفى أو غير المتاح يعامل بالطريقة نفسها في كل قنصلية.",
  "Check whether the record needs apostille/legalization and an authorized translation.":
    "تحقق مما إذا كان السجل يحتاج إلى أبوستيل/تصديق وترجمة معتمدة.",
  "Request the apostille or legalization from the issuing authority and use the required translator before filing.":
    "اطلب الأبوستيل أو التصديق من جهة الإصدار واستخدم المترجم المطلوب قبل التقديم.",
  "Apostilles and translations can take time, so do not leave this until appointment week.":
    "قد تستغرق الأبوستيل والترجمات وقتا، فلا تتركها لأسبوع الموعد.",
  "Confirm the correct appointment category, required originals, copies, witnesses, and who must attend.":
    "أكد فئة الموعد الصحيحة، والأصول المطلوبة، والنسخ، والشهود، ومن يجب أن يحضر.",
  "Use the official appointment system, choose the matching service category, and bring the exact people and records required.":
    "استخدم نظام المواعيد الرسمي، واختر فئة الخدمة المناسبة، وأحضر الأشخاص والوثائق المطلوبة بدقة.",
  "Booking the wrong appointment type can delay the case even when documents are ready.":
    "حجز نوع الموعد الخطأ قد يؤخر القضية حتى لو كانت الوثائق جاهزة.",
  "Confirm resident status, CURP, INM address match, card validity, absence limits, and modality proof before filing.":
    "أكد حالة الإقامة وCURP وتطابق عنوان INM وصلاحية البطاقة وحدود الغياب وإثبات المسار قبل التقديم.",
  "Update immigration records, wait out timing problems, or gather modality proof before submitting to SRE.":
    "حدّث سجلات الهجرة، أو انتظر اكتمال المدة، أو اجمع إثبات المسار قبل التقديم إلى SRE.",
  "Student, tourist, or mismatched INM records may not count for naturalization filing.":
    "قد لا تحتسب حالة الطالب أو السائح أو سجلات INM غير المتطابقة لطلب التجنس.",
  "Verify the issued Mexican record before using it for passport, CURP, or ID steps.":
    "تحقق من السجل المكسيكي الصادر قبل استخدامه لجواز السفر أو CURP أو وثائق الهوية.",
  "Request corrections immediately if the issued acta, CURP, or identity record has an error.":
    "اطلب التصحيح فورا إذا كان في سجل الميلاد المكسيكي أو CURP أو سجل الهوية الصادر خطأ.",
  "Do not skip checking the issued record for name or date errors.":
    "لا تتجاوز فحص السجل الصادر بحثا عن أخطاء الاسم أو التاريخ.",
  "Confirm the record is current, certified when required, and matches the names in your other documents.":
    "أكد أن السجل حديث ومصدق عند الحاجة ويطابق الأسماء في وثائقك الأخرى.",
  "Find the official requirement, gather the exact supporting record, and keep a copy with your case file.":
    "ابحث عن المتطلب الرسمي، واجمع السجل الداعم المطلوب، واحتفظ بنسخة في ملف قضيتك.",
  "Do not assume a similar document is acceptable; verify the exact official requirement.":
    "لا تفترض أن وثيقة مشابهة مقبولة؛ تحقق من المتطلب الرسمي الدقيق.",
});

Object.assign(ZH_TEXT, {
  "Why it matters": "为什么重要",
  "What to check": "需要检查",
  "How to resolve": "如何解决",
  "Common mistake": "常见错误",
  "This item can delay or stop the route until the consulate, SRE, or civil registry confirms the path.":
    "在领事馆、SRE 或民事登记机构确认路径前，此项可能延迟或阻止流程。",
  "This item helps prove the route and reduces the chance of an appointment delay.":
    "此项有助于证明路径，并降低预约延误的可能性。",
  "Compare names, dates, parent details, actas, IDs, and certificate format before scheduling.":
    "预约前请比对姓名、日期、父母信息、墨西哥出生登记记录、身份证件和证书格式。",
  "Order the correct long-form or certified record, then correct mismatches before relying on it.":
    "申请正确的长格式或认证记录，并在依赖它之前修正不一致。",
  "Short-form records, missing parent details, or small name differences can still cause rejection.":
    "短格式记录、缺少父母信息或小的姓名差异仍可能导致被拒。",
  "Confirm who must appear or consent, and collect marriage, death, custody, adoption, or court records if relevant.":
    "确认谁必须到场或同意，并在相关时收集婚姻、死亡、监护、收养或法院记录。",
  "Contact the consulate or civil registry with the exact parentage issue before booking the appointment.":
    "预约前，带着具体的亲子关系问题联系领事馆或民事登记机构。",
  "Do not assume a missing, deceased, or unavailable parent can be handled the same way at every consulate.":
    "不要假设缺席、已故或无法到场的父母在每个领事馆都会被同样处理。",
  "Check whether the record needs apostille/legalization and an authorized translation.":
    "检查记录是否需要海牙认证/合法化以及授权翻译。",
  "Request the apostille or legalization from the issuing authority and use the required translator before filing.":
    "提交前向签发机构申请认证或合法化，并使用要求的翻译人员。",
  "Apostilles and translations can take time, so do not leave this until appointment week.":
    "认证和翻译可能需要时间，请不要拖到预约当周。",
  "Confirm the correct appointment category, required originals, copies, witnesses, and who must attend.":
    "确认正确的预约类别、所需原件、复印件、见证人以及必须到场人员。",
  "Use the official appointment system, choose the matching service category, and bring the exact people and records required.":
    "使用官方预约系统，选择匹配的服务类别，并带齐要求的人员和记录。",
  "Booking the wrong appointment type can delay the case even when documents are ready.":
    "即使文件已准备好，预约错误类型也可能延误案件。",
  "Confirm resident status, CURP, INM address match, card validity, absence limits, and modality proof before filing.":
    "提交前确认居留身份、CURP、INM 地址一致、卡片有效期、离境限制和路径证明。",
  "Update immigration records, wait out timing problems, or gather modality proof before submitting to SRE.":
    "提交给 SRE 前，更新移民记录、等待满足时间要求，或收集路径证明。",
  "Student, tourist, or mismatched INM records may not count for naturalization filing.":
    "学生、游客身份或 INM 记录不一致可能不计入入籍申请。",
  "Verify the issued Mexican record before using it for passport, CURP, or ID steps.":
    "用于护照、CURP 或身份证件步骤前，请核实已签发的墨西哥记录。",
  "Request corrections immediately if the issued acta, CURP, or identity record has an error.":
    "如果签发的墨西哥出生登记记录、CURP 或身份记录有错误，请立即申请更正。",
  "Do not skip checking the issued record for name or date errors.":
    "不要跳过对已签发记录中姓名或日期错误的检查。",
  "Confirm the record is current, certified when required, and matches the names in your other documents.":
    "确认记录是最新的、在需要时已认证，并与其他文件中的姓名一致。",
  "Find the official requirement, gather the exact supporting record, and keep a copy with your case file.":
    "找到官方要求，收集准确的支持记录，并在案件文件中保留副本。",
  "Do not assume a similar document is acceptable; verify the exact official requirement.":
    "不要假设类似文件可以接受；请核实确切的官方要求。",
});

Object.assign(ES_TEXT, {
  "Adoption or Mexican parental authority can support a one-year route with custody review.":
    "La adopción o patria potestad mexicana puede apoyar una ruta de un año con revisión de custodia.",
});

Object.assign(PT_TEXT, {
  "Mexican civil registry record is missing or uncertain.":
    "O registro civil mexicano está ausente ou incerto.",
  "Ask the relevant civil registry or consulate about late/no registration evidence.":
    "Pergunte ao registro civil ou consulado competente sobre provas para registro tardio ou inexistente.",
  "Collect older supporting records such as baptismal, school, medical, parent, or sibling records.":
    "Reúna registros antigos de apoio, como batismo, escola, médicos, dos pais ou de irmãos.",
  "Foreign naturalization timing is unknown.":
    "A data da naturalização estrangeira é desconhecida.",
  "Confirm the exact date another nationality was acquired.":
    "Confirme a data exata em que outra nacionalidade foi adquirida.",
  "Mexican acta may be late-registered or inconsistent with ID.":
    "A certidão mexicana pode ter registro tardio ou não corresponder à identificação.",
  "Compare the acta against current ID, parents' records, and marriage/name-change documents.":
    "Compare a certidão com a identificação atual, registros dos pais e documentos de casamento ou mudança de nome.",
  "Ask the civil registry or consulate whether correction or supplemental proof is required.":
    "Pergunte ao registro civil ou consulado se é necessária correção ou prova complementar.",
  "Birth on a Mexican vessel or aircraft can be a Mexican-by-birth category.":
    "Nascimento em embarcação ou aeronave mexicana pode ser uma categoria de mexicano por nascimento.",
  "Collect the vessel/aircraft birth record and parent identity records.":
    "Reúna o registro de nascimento da embarcação/aeronave e documentos de identidade dos pais.",
  "Ask the consulate or civil registry which office should issue or recognize the acta.":
    "Pergunte ao consulado ou registro civil qual repartição deve emitir ou reconhecer a certidão.",
  "Proceed to passport/ID after the Mexican nationality record is issued.":
    "Siga para passaporte ou identificação depois que o registro de nacionalidade mexicana for emitido.",
  "The parent appears Mexican, but the appointment will likely need stronger nationality proof.":
    "O pai ou mãe parece mexicano, mas a consulta provavelmente exigirá prova de nacionalidade mais forte.",
  "Obtain the Mexican parent's certified birth acta or Carta de Naturalizacion before the appointment.":
    "Obtenha a certidão mexicana certificada ou Carta de Naturalización do pai ou mãe antes da consulta.",
  "Then prepare the applicant's long-form birth certificate and parent ID records.":
    "Depois prepare a certidão completa do solicitante e os documentos de identidade dos pais.",
  "Parent became Mexican after the applicant was born.":
    "O pai ou mãe tornou-se mexicano depois do nascimento do solicitante.",
  "Parent was born abroad and may need their own Mexican record first.":
    "O pai ou mãe nasceu no exterior e pode precisar primeiro do próprio registro mexicano.",
  "Parent appearance, marriage timing, or special power of attorney issue needs consulate review.":
    "Comparecimento dos pais, data do casamento ou procuração especial exige revisão consular.",
  "A parent is deceased, absent, unavailable, or unwilling to participate.":
    "Um dos pais faleceu, está ausente, indisponível ou não quer participar.",
  "Add apostille/legalization and authorized translation steps for non-U.S. or non-English/non-Spanish records.":
    "Adicione etapas de apostila/legalização e tradução autorizada para registros não emitidos nos EUA ou que não estejam em inglês/espanhol.",
  "Move from tourist/FMM, no status, or temporary student status into qualifying temporary or permanent residence.":
    "Mude de turista/FMM, sem status ou estudante temporário para residência temporária ou permanente qualificável.",
  "Start tracking residence time and absences once qualifying status begins.":
    "Comece a acompanhar o tempo de residência e ausências quando o status qualificável começar.",
  "Distinguished services are discretionary and should be reviewed before relying on the route.":
    "Serviços distintos são discricionários e devem ser revisados antes de depender dessa rota.",
  "High-discretion naturalization route.":
    "Rota de naturalização de alta discricionariedade.",
  "Prepare evidence of cultural, social, scientific, technical, artistic, sports, business, or other benefit to Mexico.":
    "Prepare provas de benefício cultural, social, científico, técnico, artístico, esportivo, empresarial ou outro para o México.",
  "Ask SRE or counsel whether residence can be shortened or waived.":
    "Pergunte à SRE ou a um assessor se a residência pode ser reduzida ou dispensada.",
  "A shorter route may exist, but the residence clock is not long enough yet.":
    "Uma rota mais curta pode existir, mas o tempo de residência ainda não é suficiente.",
  "Keep qualifying residence active until the route minimum is met.":
    "Mantenha a residência qualificável ativa até cumprir o mínimo da rota.",
  "No shorter statutory route is selected, and the five-year clock is not complete.":
    "Nenhuma rota legal mais curta foi selecionada, e o prazo de cinco anos ainda não está completo.",
  "Continue qualifying temporary or permanent residence toward five years.":
    "Continue a residência temporária ou permanente qualificável até completar cinco anos.",
  "Resident card validity or CURP is not ready.":
    "A validade do cartão de residente ou o CURP ainda não está pronto.",
  "Application address must match INM records.":
    "O endereço da solicitação deve corresponder aos registros do INM.",
  "Absences exceed six months total during the last two years.":
    "As ausências somam mais de seis meses nos últimos dois anos.",
  "Calculate a new filing date after the absence window clears.":
    "Calcule uma nova data de protocolo depois que a janela de ausências se limpar.",
  "Criminal history or pending case needs review before naturalization.":
    "Histórico criminal ou caso pendente precisa de revisão antes da naturalização.",
  "Use the SRE study guide and practice before scheduling exams.":
    "Use o guia de estudo da SRE e pratique antes de agendar exames.",
  "Foreign passport does not yet meet the filing-validity requirement.":
    "O passaporte estrangeiro ainda não atende ao requisito de validade para protocolo.",
  "Prepare prior passport copies or INM migration-flow proof.":
    "Prepare cópias do passaporte anterior ou comprovante de fluxo migratório do INM.",
  "More distant descent should be reviewed before relying on a two-year route.":
    "Descendência mais distante deve ser revisada antes de depender de uma rota de dois anos.",
});

Object.assign(IT_TEXT, {
  "Mexican civil registry record is missing or uncertain.":
    "Il registro civile messicano manca o non è certo.",
  "Ask the relevant civil registry or consulate about late/no registration evidence.":
    "Chiedi al registro civile o al consolato competente quali prove servono per registrazione tardiva o assente.",
  "Collect older supporting records such as baptismal, school, medical, parent, or sibling records.":
    "Raccogli vecchi documenti di supporto, come battesimo, scuola, medici, dei genitori o dei fratelli.",
  "Foreign naturalization timing is unknown.":
    "La data della naturalizzazione straniera è sconosciuta.",
  "Confirm the exact date another nationality was acquired.":
    "Conferma la data esatta in cui è stata acquisita un'altra nazionalità.",
  "Mexican acta may be late-registered or inconsistent with ID.":
    "L'atto messicano potrebbe essere registrato tardivamente o non coincidere con il documento d'identità.",
  "Compare the acta against current ID, parents' records, and marriage/name-change documents.":
    "Confronta l'atto con l'identità attuale, i registri dei genitori e i documenti di matrimonio o cambio nome.",
  "Ask the civil registry or consulate whether correction or supplemental proof is required.":
    "Chiedi al registro civile o al consolato se servono correzioni o prove supplementari.",
  "Birth on a Mexican vessel or aircraft can be a Mexican-by-birth category.":
    "La nascita su nave o aeromobile messicano può rientrare nella cittadinanza messicana per nascita.",
  "Collect the vessel/aircraft birth record and parent identity records.":
    "Raccogli il registro di nascita su nave/aeromobile e i documenti d'identità dei genitori.",
  "Ask the consulate or civil registry which office should issue or recognize the acta.":
    "Chiedi al consolato o al registro civile quale ufficio deve emettere o riconoscere l'atto.",
  "Proceed to passport/ID after the Mexican nationality record is issued.":
    "Procedi con passaporto o documento d'identità dopo l'emissione del registro di nazionalità messicana.",
  "The parent appears Mexican, but the appointment will likely need stronger nationality proof.":
    "Il genitore sembra messicano, ma l'appuntamento probabilmente richiederà una prova di nazionalità più forte.",
  "Obtain the Mexican parent's certified birth acta or Carta de Naturalizacion before the appointment.":
    "Ottieni l'atto di nascita messicano certificato o la Carta de Naturalización del genitore prima dell'appuntamento.",
  "Then prepare the applicant's long-form birth certificate and parent ID records.":
    "Poi prepara il certificato di nascita integrale del richiedente e i documenti d'identità dei genitori.",
  "Parent became Mexican after the applicant was born.":
    "Il genitore è diventato messicano dopo la nascita del richiedente.",
  "Parent was born abroad and may need their own Mexican record first.":
    "Il genitore è nato all'estero e potrebbe dover ottenere prima il proprio registro messicano.",
  "Parent appearance, marriage timing, or special power of attorney issue needs consulate review.":
    "Comparizione del genitore, data del matrimonio o procura speciale richiedono revisione consolare.",
  "A parent is deceased, absent, unavailable, or unwilling to participate.":
    "Un genitore è deceduto, assente, indisponibile o non vuole partecipare.",
  "Add apostille/legalization and authorized translation steps for non-U.S. or non-English/non-Spanish records.":
    "Aggiungi apostille/legalizzazione e traduzione autorizzata per registri non statunitensi o non in inglese/spagnolo.",
  "Move from tourist/FMM, no status, or temporary student status into qualifying temporary or permanent residence.":
    "Passa da turista/FMM, nessuno status o studente temporaneo a residenza temporanea o permanente qualificante.",
  "Start tracking residence time and absences once qualifying status begins.":
    "Inizia a monitorare il tempo di residenza e le assenze quando inizia lo status qualificante.",
  "Distinguished services are discretionary and should be reviewed before relying on the route.":
    "I servizi distinti sono discrezionali e vanno esaminati prima di fare affidamento su questa rotta.",
  "High-discretion naturalization route.":
    "Rotta di naturalizzazione altamente discrezionale.",
  "Prepare evidence of cultural, social, scientific, technical, artistic, sports, business, or other benefit to Mexico.":
    "Prepara prove di beneficio culturale, sociale, scientifico, tecnico, artistico, sportivo, imprenditoriale o altro per il Messico.",
  "Ask SRE or counsel whether residence can be shortened or waived.":
    "Chiedi alla SRE o a un consulente se la residenza può essere ridotta o dispensata.",
  "A shorter route may exist, but the residence clock is not long enough yet.":
    "Può esistere una rotta più breve, ma il periodo di residenza non è ancora sufficiente.",
  "Keep qualifying residence active until the route minimum is met.":
    "Mantieni attiva la residenza qualificante fino al minimo richiesto.",
  "No shorter statutory route is selected, and the five-year clock is not complete.":
    "Non è stata selezionata una rotta legale più breve e il periodo di cinque anni non è completo.",
  "Continue qualifying temporary or permanent residence toward five years.":
    "Continua la residenza temporanea o permanente qualificante fino a cinque anni.",
  "Resident card validity or CURP is not ready.":
    "La validità della carta di residente o il CURP non è ancora pronto.",
  "Application address must match INM records.":
    "L'indirizzo della domanda deve coincidere con i registri INM.",
  "Absences exceed six months total during the last two years.":
    "Le assenze superano sei mesi totali negli ultimi due anni.",
  "Calculate a new filing date after the absence window clears.":
    "Calcola una nuova data di deposito dopo che la finestra delle assenze si azzera.",
  "Criminal history or pending case needs review before naturalization.":
    "Precedenti penali o procedimenti pendenti richiedono revisione prima della naturalizzazione.",
  "Use the SRE study guide and practice before scheduling exams.":
    "Usa la guida di studio SRE e fai pratica prima di programmare gli esami.",
  "Foreign passport does not yet meet the filing-validity requirement.":
    "Il passaporto straniero non soddisfa ancora il requisito di validità per il deposito.",
  "Prepare prior passport copies or INM migration-flow proof.":
    "Prepara copie del passaporto precedente o prova del flusso migratorio INM.",
  "More distant descent should be reviewed before relying on a two-year route.":
    "Una discendenza più lontana va esaminata prima di fare affidamento su una rotta di due anni.",
});

Object.assign(FR_TEXT, {
  "Mexican civil registry record is missing or uncertain.":
    "L'acte d'état civil mexicain est manquant ou incertain.",
  "Ask the relevant civil registry or consulate about late/no registration evidence.":
    "Demandez à l'état civil ou au consulat compétent quelles preuves fournir pour un enregistrement tardif ou absent.",
  "Collect older supporting records such as baptismal, school, medical, parent, or sibling records.":
    "Rassemblez d'anciens justificatifs, comme baptême, école, dossiers médicaux, parents ou fratrie.",
  "Foreign naturalization timing is unknown.":
    "La date de naturalisation étrangère est inconnue.",
  "Confirm the exact date another nationality was acquired.":
    "Confirmez la date exacte d'acquisition de l'autre nationalité.",
  "Mexican acta may be late-registered or inconsistent with ID.":
    "L'acte mexicain peut être enregistré tardivement ou ne pas correspondre à l'identité.",
  "Compare the acta against current ID, parents' records, and marriage/name-change documents.":
    "Comparez l'acte avec l'identité actuelle, les dossiers des parents et les documents de mariage ou changement de nom.",
  "Ask the civil registry or consulate whether correction or supplemental proof is required.":
    "Demandez à l'état civil ou au consulat si une correction ou preuve supplémentaire est requise.",
  "Birth on a Mexican vessel or aircraft can be a Mexican-by-birth category.":
    "Une naissance sur navire ou aéronef mexicain peut relever de la nationalité mexicaine de naissance.",
  "Collect the vessel/aircraft birth record and parent identity records.":
    "Rassemblez le registre de naissance du navire/aéronef et les pièces d'identité des parents.",
  "Ask the consulate or civil registry which office should issue or recognize the acta.":
    "Demandez au consulat ou à l'état civil quel bureau doit émettre ou reconnaître l'acte.",
  "Proceed to passport/ID after the Mexican nationality record is issued.":
    "Passez au passeport ou à l'identité après émission du registre de nationalité mexicaine.",
  "The parent appears Mexican, but the appointment will likely need stronger nationality proof.":
    "Le parent semble mexicain, mais le rendez-vous exigera probablement une preuve de nationalité plus forte.",
  "Obtain the Mexican parent's certified birth acta or Carta de Naturalizacion before the appointment.":
    "Obtenez l'acte de naissance mexicain certifié ou la Carta de Naturalización du parent avant le rendez-vous.",
  "Then prepare the applicant's long-form birth certificate and parent ID records.":
    "Préparez ensuite l'acte de naissance intégral du demandeur et les pièces d'identité des parents.",
  "Parent became Mexican after the applicant was born.":
    "Le parent est devenu mexicain après la naissance du demandeur.",
  "Parent was born abroad and may need their own Mexican record first.":
    "Le parent est né à l'étranger et peut devoir obtenir d'abord son propre registre mexicain.",
  "Parent appearance, marriage timing, or special power of attorney issue needs consulate review.":
    "Comparution du parent, date du mariage ou procuration spéciale nécessite une revue consulaire.",
  "A parent is deceased, absent, unavailable, or unwilling to participate.":
    "Un parent est décédé, absent, indisponible ou refuse de participer.",
  "Add apostille/legalization and authorized translation steps for non-U.S. or non-English/non-Spanish records.":
    "Ajoutez les étapes d'apostille/légalisation et de traduction autorisée pour les actes non américains ou non rédigés en anglais/espagnol.",
  "Move from tourist/FMM, no status, or temporary student status into qualifying temporary or permanent residence.":
    "Passez du statut touriste/FMM, sans statut ou étudiant temporaire vers une résidence temporaire ou permanente admissible.",
  "Start tracking residence time and absences once qualifying status begins.":
    "Commencez à suivre le temps de résidence et les absences dès que le statut admissible commence.",
  "Distinguished services are discretionary and should be reviewed before relying on the route.":
    "Les services distingués sont discrétionnaires et doivent être examinés avant de s'appuyer sur ce parcours.",
  "High-discretion naturalization route.":
    "Parcours de naturalisation très discrétionnaire.",
  "Prepare evidence of cultural, social, scientific, technical, artistic, sports, business, or other benefit to Mexico.":
    "Préparez des preuves de bénéfice culturel, social, scientifique, technique, artistique, sportif, commercial ou autre pour le Mexique.",
  "Ask SRE or counsel whether residence can be shortened or waived.":
    "Demandez à la SRE ou à un conseiller si la résidence peut être réduite ou dispensée.",
  "A shorter route may exist, but the residence clock is not long enough yet.":
    "Un parcours plus court peut exister, mais le temps de résidence n'est pas encore suffisant.",
  "Keep qualifying residence active until the route minimum is met.":
    "Maintenez la résidence admissible active jusqu'au minimum requis.",
  "No shorter statutory route is selected, and the five-year clock is not complete.":
    "Aucun parcours légal plus court n'est sélectionné et les cinq ans ne sont pas complets.",
  "Continue qualifying temporary or permanent residence toward five years.":
    "Continuez la résidence temporaire ou permanente admissible jusqu'à cinq ans.",
  "Resident card validity or CURP is not ready.":
    "La validité de la carte de résident ou le CURP n'est pas prêt.",
  "Application address must match INM records.":
    "L'adresse de la demande doit correspondre aux registres INM.",
  "Absences exceed six months total during the last two years.":
    "Les absences dépassent six mois au total sur les deux dernières années.",
  "Calculate a new filing date after the absence window clears.":
    "Calculez une nouvelle date de dépôt après effacement de la période d'absence.",
  "Criminal history or pending case needs review before naturalization.":
    "Antécédents pénaux ou affaire en cours nécessitent une revue avant naturalisation.",
  "Use the SRE study guide and practice before scheduling exams.":
    "Utilisez le guide d'étude de la SRE et entraînez-vous avant de programmer les examens.",
  "Foreign passport does not yet meet the filing-validity requirement.":
    "Le passeport étranger ne respecte pas encore l'exigence de validité pour le dépôt.",
  "Prepare prior passport copies or INM migration-flow proof.":
    "Préparez les copies de l'ancien passeport ou la preuve de flux migratoire INM.",
  "More distant descent should be reviewed before relying on a two-year route.":
    "Une ascendance plus éloignée doit être examinée avant de s'appuyer sur un parcours de deux ans.",
});

Object.assign(JA_TEXT, {
  "Mexican civil registry record is missing or uncertain.":
    "メキシコの民事登録記録がない、または不明です。",
  "Ask the relevant civil registry or consulate about late/no registration evidence.":
    "遅延登録または未登録の証拠について、該当する民事登録機関または領事館に確認してください。",
  "Collect older supporting records such as baptismal, school, medical, parent, or sibling records.":
    "洗礼、学校、医療、親、兄弟姉妹などの古い補足記録を集めてください。",
  "Foreign naturalization timing is unknown.": "外国国籍取得の時期が不明です。",
  "Confirm the exact date another nationality was acquired.":
    "別の国籍を取得した正確な日付を確認してください。",
  "Mexican acta may be late-registered or inconsistent with ID.":
    "メキシコの出生登録記録が遅延登録、または身分証明書と一致しない可能性があります。",
  "Compare the acta against current ID, parents' records, and marriage/name-change documents.":
    "出生登録記録を現在の身分証明書、親の記録、婚姻または氏名変更書類と照合してください。",
  "Ask the civil registry or consulate whether correction or supplemental proof is required.":
    "訂正または補足証拠が必要か、民事登録機関または領事館に確認してください。",
  "Birth on a Mexican vessel or aircraft can be a Mexican-by-birth category.":
    "メキシコ船舶または航空機での出生は、出生によるメキシコ国籍の区分に該当する可能性があります。",
  "Collect the vessel/aircraft birth record and parent identity records.":
    "船舶/航空機での出生記録と親の本人確認書類を集めてください。",
  "Ask the consulate or civil registry which office should issue or recognize the acta.":
    "どの事務所が出生登録記録を発行または承認すべきか、領事館または民事登録機関に確認してください。",
  "Proceed to passport/ID after the Mexican nationality record is issued.":
    "メキシコ国籍記録の発行後、旅券または身分証明書の手続きに進んでください。",
  "The parent appears Mexican, but the appointment will likely need stronger nationality proof.":
    "親はメキシコ人と思われますが、予約ではより強い国籍証明が必要になる可能性があります。",
  "Obtain the Mexican parent's certified birth acta or Carta de Naturalizacion before the appointment.":
    "予約前に、メキシコ人親の認証済み出生登録記録またはCarta de Naturalizaciónを取得してください。",
  "Then prepare the applicant's long-form birth certificate and parent ID records.":
    "その後、申請者の詳細版出生証明と親の身分証明書類を準備してください。",
  "Parent became Mexican after the applicant was born.":
    "親は申請者の出生後にメキシコ人になりました。",
  "Parent was born abroad and may need their own Mexican record first.":
    "親は国外生まれのため、先に親自身のメキシコ記録が必要な場合があります。",
  "Parent appearance, marriage timing, or special power of attorney issue needs consulate review.":
    "親の出席、婚姻時期、または特別委任状の問題は領事館の確認が必要です。",
  "A parent is deceased, absent, unavailable, or unwilling to participate.":
    "親の一方が死亡、欠席、参加不可、または協力意思なしです。",
  "Add apostille/legalization and authorized translation steps for non-U.S. or non-English/non-Spanish records.":
    "米国発行でない記録、または英語/スペイン語以外の記録には、アポスティーユ/認証と公認翻訳の手順を追加してください。",
  "Move from tourist/FMM, no status, or temporary student status into qualifying temporary or permanent residence.":
    "観光/FMM、無資格、または一時学生資格から、対象となる一時または永住資格へ移行してください。",
  "Start tracking residence time and absences once qualifying status begins.":
    "対象資格が始まったら、居住期間と不在期間の記録を開始してください。",
  "Distinguished services are discretionary and should be reviewed before relying on the route.":
    "顕著な貢献によるルートは裁量的なため、依拠する前に確認が必要です。",
  "High-discretion naturalization route.": "裁量性の高い帰化ルートです。",
  "Prepare evidence of cultural, social, scientific, technical, artistic, sports, business, or other benefit to Mexico.":
    "メキシコへの文化、社会、科学、技術、芸術、スポーツ、事業、その他の貢献を示す証拠を準備してください。",
  "Ask SRE or counsel whether residence can be shortened or waived.":
    "居住要件を短縮または免除できるか、SREまたは専門家に確認してください。",
  "A shorter route may exist, but the residence clock is not long enough yet.":
    "より短いルートがある可能性はありますが、居住期間がまだ足りません。",
  "Keep qualifying residence active until the route minimum is met.":
    "ルートの最低期間を満たすまで、対象となる居住資格を維持してください。",
  "No shorter statutory route is selected, and the five-year clock is not complete.":
    "より短い法定ルートは選択されておらず、5年の期間もまだ完了していません。",
  "Continue qualifying temporary or permanent residence toward five years.":
    "5年に向けて、対象となる一時または永住資格を継続してください。",
  "Resident card validity or CURP is not ready.":
    "居住カードの有効性またはCURPがまだ整っていません。",
  "Application address must match INM records.":
    "申請住所はINM登録住所と一致する必要があります。",
  "Absences exceed six months total during the last two years.":
    "過去2年間の不在期間が合計6か月を超えています。",
  "Calculate a new filing date after the absence window clears.":
    "不在期間の対象期間が過ぎた後、新しい申請可能日を計算してください。",
  "Criminal history or pending case needs review before naturalization.":
    "犯罪歴または係属中の事件は、帰化前に確認が必要です。",
  "Use the SRE study guide and practice before scheduling exams.":
    "試験予約前にSREの学習ガイドを使って練習してください。",
  "Foreign passport does not yet meet the filing-validity requirement.":
    "外国旅券が申請時の有効期間要件をまだ満たしていません。",
  "Prepare prior passport copies or INM migration-flow proof.":
    "以前の旅券コピーまたはINMの出入国履歴証明を準備してください。",
  "More distant descent should be reviewed before relying on a two-year route.":
    "より遠い血統は、2年ルートに依拠する前に確認が必要です。",
});

Object.assign(HI_TEXT, {
  "Mexican civil registry record is missing or uncertain.":
    "मेक्सिकन नागरिक पंजीकरण रिकॉर्ड गायब है या स्पष्ट नहीं है।",
  "Ask the relevant civil registry or consulate about late/no registration evidence.":
    "देर से या बिना पंजीकरण के प्रमाण के बारे में संबंधित नागरिक पंजीकरण कार्यालय या वाणिज्य दूतावास से पूछें।",
  "Collect older supporting records such as baptismal, school, medical, parent, or sibling records.":
    "बपतिस्मा, स्कूल, चिकित्सा, माता-पिता या भाई-बहन से जुड़े पुराने सहायक रिकॉर्ड जुटाएं।",
  "Foreign naturalization timing is unknown.":
    "विदेशी प्राकृतिककरण की तारीख अज्ञात है।",
  "Confirm the exact date another nationality was acquired.":
    "दूसरी राष्ट्रीयता प्राप्त करने की सही तारीख की पुष्टि करें।",
  "Mexican acta may be late-registered or inconsistent with ID.":
    "मेक्सिकन जन्म रिकॉर्ड देर से पंजीकृत हो सकता है या पहचान दस्तावेज़ से मेल नहीं खा सकता।",
  "Compare the acta against current ID, parents' records, and marriage/name-change documents.":
    "जन्म रिकॉर्ड की तुलना वर्तमान पहचान दस्तावेज़, माता-पिता के रिकॉर्ड और विवाह/नाम-परिवर्तन दस्तावेज़ों से करें।",
  "Ask the civil registry or consulate whether correction or supplemental proof is required.":
    "नागरिक पंजीकरण कार्यालय या वाणिज्य दूतावास से पूछें कि सुधार या अतिरिक्त प्रमाण चाहिए या नहीं।",
  "Birth on a Mexican vessel or aircraft can be a Mexican-by-birth category.":
    "मेक्सिकन जहाज़ या विमान पर जन्म, जन्म से मेक्सिकन होने की श्रेणी हो सकता है।",
  "Collect the vessel/aircraft birth record and parent identity records.":
    "जहाज़/विमान जन्म रिकॉर्ड और माता-पिता के पहचान रिकॉर्ड जुटाएं।",
  "Ask the consulate or civil registry which office should issue or recognize the acta.":
    "वाणिज्य दूतावास या नागरिक पंजीकरण कार्यालय से पूछें कि कौन सा कार्यालय जन्म रिकॉर्ड जारी या मान्यता देगा।",
  "Proceed to passport/ID after the Mexican nationality record is issued.":
    "मेक्सिकन राष्ट्रीयता रिकॉर्ड जारी होने के बाद पासपोर्ट या पहचान दस्तावेज़ की प्रक्रिया आगे बढ़ाएं।",
  "The parent appears Mexican, but the appointment will likely need stronger nationality proof.":
    "माता/पिता मेक्सिकन लगते हैं, लेकिन मुलाकात में संभवतः अधिक मजबूत राष्ट्रीयता प्रमाण चाहिए होगा।",
  "Obtain the Mexican parent's certified birth acta or Carta de Naturalizacion before the appointment.":
    "मुलाकात से पहले मेक्सिकन माता/पिता का प्रमाणित जन्म रिकॉर्ड या Carta de Naturalización प्राप्त करें।",
  "Then prepare the applicant's long-form birth certificate and parent ID records.":
    "फिर आवेदक का विस्तृत जन्म प्रमाणपत्र और माता-पिता के पहचान रिकॉर्ड तैयार करें।",
  "Parent became Mexican after the applicant was born.":
    "माता/पिता आवेदक के जन्म के बाद मेक्सिकन बने।",
  "Parent was born abroad and may need their own Mexican record first.":
    "माता/पिता विदेश में जन्मे थे और उन्हें पहले अपना मेक्सिकन रिकॉर्ड चाहिए हो सकता है।",
  "Parent appearance, marriage timing, or special power of attorney issue needs consulate review.":
    "माता-पिता की उपस्थिति, विवाह का समय या विशेष पावर ऑफ अटॉर्नी का मुद्दा वाणिज्य दूतावास समीक्षा चाहता है।",
  "A parent is deceased, absent, unavailable, or unwilling to participate.":
    "माता/पिता में से कोई मृत, अनुपस्थित, उपलब्ध नहीं या भाग लेने को तैयार नहीं है।",
  "Add apostille/legalization and authorized translation steps for non-U.S. or non-English/non-Spanish records.":
    "अमेरिका से बाहर जारी या अंग्रेज़ी/स्पैनिश में न होने वाले रिकॉर्ड के लिए अपोस्टिल/वैधीकरण और अधिकृत अनुवाद के कदम जोड़ें।",
  "Move from tourist/FMM, no status, or temporary student status into qualifying temporary or permanent residence.":
    "पर्यटक/FMM, बिना स्थिति या अस्थायी छात्र स्थिति से पात्र अस्थायी या स्थायी निवास में जाएं।",
  "Start tracking residence time and absences once qualifying status begins.":
    "पात्र स्थिति शुरू होते ही निवास समय और अनुपस्थिति का रिकॉर्ड रखना शुरू करें।",
  "Distinguished services are discretionary and should be reviewed before relying on the route.":
    "विशिष्ट सेवाओं वाला मार्ग विवेकाधीन है और उस पर निर्भर करने से पहले समीक्षा होनी चाहिए।",
  "High-discretion naturalization route.": "उच्च विवेकाधीन प्राकृतिककरण मार्ग।",
  "Prepare evidence of cultural, social, scientific, technical, artistic, sports, business, or other benefit to Mexico.":
    "मेक्सिको को सांस्कृतिक, सामाजिक, वैज्ञानिक, तकनीकी, कलात्मक, खेल, व्यापार या अन्य लाभ का प्रमाण तैयार करें।",
  "Ask SRE or counsel whether residence can be shortened or waived.":
    "SRE या सलाहकार से पूछें कि निवास अवधि कम या माफ़ हो सकती है या नहीं।",
  "A shorter route may exist, but the residence clock is not long enough yet.":
    "छोटा मार्ग हो सकता है, लेकिन निवास अवधि अभी पर्याप्त नहीं है।",
  "Keep qualifying residence active until the route minimum is met.":
    "मार्ग की न्यूनतम अवधि पूरी होने तक पात्र निवास सक्रिय रखें।",
  "No shorter statutory route is selected, and the five-year clock is not complete.":
    "कोई छोटा वैधानिक मार्ग चयनित नहीं है और पांच साल की अवधि पूरी नहीं हुई है।",
  "Continue qualifying temporary or permanent residence toward five years.":
    "पांच साल तक पात्र अस्थायी या स्थायी निवास जारी रखें।",
  "Resident card validity or CURP is not ready.":
    "निवासी कार्ड की वैधता या CURP अभी तैयार नहीं है।",
  "Application address must match INM records.":
    "आवेदन का पता INM रिकॉर्ड से मेल खाना चाहिए।",
  "Absences exceed six months total during the last two years.":
    "पिछले दो वर्षों में अनुपस्थिति कुल छह महीने से अधिक है।",
  "Calculate a new filing date after the absence window clears.":
    "अनुपस्थिति अवधि साफ होने के बाद नई आवेदन तारीख की गणना करें।",
  "Criminal history or pending case needs review before naturalization.":
    "प्राकृतिककरण से पहले आपराधिक इतिहास या लंबित मामला समीक्षा चाहता है।",
  "Use the SRE study guide and practice before scheduling exams.":
    "परीक्षा तय करने से पहले SRE अध्ययन गाइड का उपयोग करें और अभ्यास करें।",
  "Foreign passport does not yet meet the filing-validity requirement.":
    "विदेशी पासपोर्ट अभी आवेदन-वैधता आवश्यकता पूरी नहीं करता।",
  "Prepare prior passport copies or INM migration-flow proof.":
    "पुराने पासपोर्ट की प्रतियां या INM आव्रजन-प्रवाह प्रमाण तैयार करें।",
  "More distant descent should be reviewed before relying on a two-year route.":
    "दो-वर्षीय मार्ग पर निर्भर करने से पहले अधिक दूर के वंश की समीक्षा होनी चाहिए।",
});

Object.assign(AR_TEXT, {
  "Mexican civil registry record is missing or uncertain.":
    "سجل الأحوال المدنية المكسيكي مفقود أو غير مؤكد.",
  "Ask the relevant civil registry or consulate about late/no registration evidence.":
    "اسأل السجل المدني أو القنصلية المختصة عن أدلة التسجيل المتأخر أو عدم التسجيل.",
  "Collect older supporting records such as baptismal, school, medical, parent, or sibling records.":
    "اجمع سجلات داعمة قديمة مثل سجلات المعمودية أو المدرسة أو الطب أو الوالدين أو الأشقاء.",
  "Foreign naturalization timing is unknown.":
    "تاريخ التجنس الأجنبي غير معروف.",
  "Confirm the exact date another nationality was acquired.":
    "أكد التاريخ الدقيق لاكتساب جنسية أخرى.",
  "Mexican acta may be late-registered or inconsistent with ID.":
    "قد يكون سجل الميلاد المكسيكي مسجلا متأخرا أو غير متطابق مع الهوية.",
  "Compare the acta against current ID, parents' records, and marriage/name-change documents.":
    "قارن سجل الميلاد بالهوية الحالية وسجلات الوالدين ووثائق الزواج أو تغيير الاسم.",
  "Ask the civil registry or consulate whether correction or supplemental proof is required.":
    "اسأل السجل المدني أو القنصلية هل يلزم تصحيح أو إثبات إضافي.",
  "Birth on a Mexican vessel or aircraft can be a Mexican-by-birth category.":
    "الولادة على سفينة أو طائرة مكسيكية قد تكون فئة جنسية مكسيكية بالميلاد.",
  "Collect the vessel/aircraft birth record and parent identity records.":
    "اجمع سجل الولادة على السفينة/الطائرة وسجلات هوية الوالدين.",
  "Ask the consulate or civil registry which office should issue or recognize the acta.":
    "اسأل القنصلية أو السجل المدني أي مكتب يجب أن يصدر أو يعترف بسجل الميلاد.",
  "Proceed to passport/ID after the Mexican nationality record is issued.":
    "انتقل إلى جواز السفر أو الهوية بعد إصدار سجل الجنسية المكسيكية.",
  "The parent appears Mexican, but the appointment will likely need stronger nationality proof.":
    "يبدو أن الوالد مكسيكي، لكن الموعد غالبا سيحتاج إلى إثبات جنسية أقوى.",
  "Obtain the Mexican parent's certified birth acta or Carta de Naturalizacion before the appointment.":
    "احصل على سجل الميلاد المكسيكي المصدق أو Carta de Naturalización للوالد قبل الموعد.",
  "Then prepare the applicant's long-form birth certificate and parent ID records.":
    "ثم جهز شهادة الميلاد الكاملة لمقدم الطلب وسجلات هوية الوالدين.",
  "Parent became Mexican after the applicant was born.":
    "أصبح الوالد مكسيكيا بعد ولادة مقدم الطلب.",
  "Parent was born abroad and may need their own Mexican record first.":
    "ولد الوالد في الخارج وقد يحتاج أولا إلى سجله المكسيكي الخاص.",
  "Parent appearance, marriage timing, or special power of attorney issue needs consulate review.":
    "حضور الوالد أو توقيت الزواج أو مسألة التوكيل الخاص تحتاج إلى مراجعة قنصلية.",
  "A parent is deceased, absent, unavailable, or unwilling to participate.":
    "أحد الوالدين متوفى أو غائب أو غير متاح أو غير راغب في المشاركة.",
  "Add apostille/legalization and authorized translation steps for non-U.S. or non-English/non-Spanish records.":
    "أضف خطوات الأبوستيل/التصديق والترجمة المعتمدة للسجلات غير الأمريكية أو غير المكتوبة بالإنجليزية/الإسبانية.",
  "Move from tourist/FMM, no status, or temporary student status into qualifying temporary or permanent residence.":
    "انتقل من سائح/FMM أو بلا وضع أو طالب مؤقت إلى إقامة مؤقتة أو دائمة مؤهلة.",
  "Start tracking residence time and absences once qualifying status begins.":
    "ابدأ بتتبع مدة الإقامة والغيابات عند بدء الوضع المؤهل.",
  "Distinguished services are discretionary and should be reviewed before relying on the route.":
    "الخدمات المتميزة تقديرية ويجب مراجعتها قبل الاعتماد على هذا المسار.",
  "High-discretion naturalization route.": "مسار تجنس عالي التقدير.",
  "Prepare evidence of cultural, social, scientific, technical, artistic, sports, business, or other benefit to Mexico.":
    "جهز أدلة على منفعة ثقافية أو اجتماعية أو علمية أو تقنية أو فنية أو رياضية أو تجارية أو غيرها للمكسيك.",
  "Ask SRE or counsel whether residence can be shortened or waived.":
    "اسأل SRE أو مستشارا هل يمكن تقصير الإقامة أو الإعفاء منها.",
  "A shorter route may exist, but the residence clock is not long enough yet.":
    "قد يوجد مسار أقصر، لكن مدة الإقامة ليست كافية بعد.",
  "Keep qualifying residence active until the route minimum is met.":
    "حافظ على الإقامة المؤهلة نشطة حتى تحقق الحد الأدنى للمسار.",
  "No shorter statutory route is selected, and the five-year clock is not complete.":
    "لم يتم اختيار مسار قانوني أقصر، ومدة الخمس سنوات لم تكتمل.",
  "Continue qualifying temporary or permanent residence toward five years.":
    "استمر في الإقامة المؤقتة أو الدائمة المؤهلة حتى خمس سنوات.",
  "Resident card validity or CURP is not ready.":
    "صلاحية بطاقة الإقامة أو CURP ليست جاهزة.",
  "Application address must match INM records.":
    "يجب أن يطابق عنوان الطلب سجلات INM.",
  "Absences exceed six months total during the last two years.":
    "تتجاوز الغيابات ستة أشهر إجمالا خلال آخر سنتين.",
  "Calculate a new filing date after the absence window clears.":
    "احسب تاريخ تقديم جديد بعد انتهاء فترة الغياب المؤثرة.",
  "Criminal history or pending case needs review before naturalization.":
    "السجل الجنائي أو القضية المعلقة يحتاج إلى مراجعة قبل التجنس.",
  "Use the SRE study guide and practice before scheduling exams.":
    "استخدم دليل الدراسة من SRE وتدرب قبل جدولة الاختبارات.",
  "Foreign passport does not yet meet the filing-validity requirement.":
    "جواز السفر الأجنبي لا يفي بعد بمتطلب الصلاحية للتقديم.",
  "Prepare prior passport copies or INM migration-flow proof.":
    "جهز نسخ جواز السفر السابق أو إثبات حركة الهجرة من INM.",
  "More distant descent should be reviewed before relying on a two-year route.":
    "يجب مراجعة النسب الأبعد قبل الاعتماد على مسار السنتين.",
});

Object.assign(ZH_TEXT, {
  "Mexican civil registry record is missing or uncertain.":
    "墨西哥民事登记记录缺失或不确定。",
  "Ask the relevant civil registry or consulate about late/no registration evidence.":
    "向相关民事登记机构或领事馆询问迟登记或未登记需要哪些证据。",
  "Collect older supporting records such as baptismal, school, medical, parent, or sibling records.":
    "收集较早的支持记录，例如洗礼、学校、医疗、父母或兄弟姐妹记录。",
  "Foreign naturalization timing is unknown.": "外国归化时间未知。",
  "Confirm the exact date another nationality was acquired.":
    "确认取得另一国籍的准确日期。",
  "Mexican acta may be late-registered or inconsistent with ID.":
    "墨西哥出生登记记录可能为迟登记，或与身份证件不一致。",
  "Compare the acta against current ID, parents' records, and marriage/name-change documents.":
    "将出生登记记录与当前身份证件、父母记录以及婚姻/姓名变更文件核对。",
  "Ask the civil registry or consulate whether correction or supplemental proof is required.":
    "询问民事登记机构或领事馆是否需要更正或补充证明。",
  "Birth on a Mexican vessel or aircraft can be a Mexican-by-birth category.":
    "在墨西哥船舶或航空器上出生可能属于出生即墨西哥国籍类别。",
  "Collect the vessel/aircraft birth record and parent identity records.":
    "收集船舶/航空器出生记录和父母身份证明记录。",
  "Ask the consulate or civil registry which office should issue or recognize the acta.":
    "询问领事馆或民事登记机构应由哪个办公室签发或承认出生登记记录。",
  "Proceed to passport/ID after the Mexican nationality record is issued.":
    "墨西哥国籍记录签发后，再办理护照或身份证件。",
  "The parent appears Mexican, but the appointment will likely need stronger nationality proof.":
    "父/母看起来可能是墨西哥人，但预约时可能需要更强的国籍证明。",
  "Obtain the Mexican parent's certified birth acta or Carta de Naturalizacion before the appointment.":
    "预约前取得墨西哥父/母的认证出生登记记录或 Carta de Naturalización。",
  "Then prepare the applicant's long-form birth certificate and parent ID records.":
    "然后准备申请人的完整出生证明和父母身份证明记录。",
  "Parent became Mexican after the applicant was born.":
    "父/母是在申请人出生后才成为墨西哥人的。",
  "Parent was born abroad and may need their own Mexican record first.":
    "父/母出生在国外，可能需要先取得自己的墨西哥记录。",
  "Parent appearance, marriage timing, or special power of attorney issue needs consulate review.":
    "父母到场、婚姻时间或特别授权书问题需要领事馆审核。",
  "A parent is deceased, absent, unavailable, or unwilling to participate.":
    "父/母一方已死亡、缺席、无法参加或不愿参加。",
  "Add apostille/legalization and authorized translation steps for non-U.S. or non-English/non-Spanish records.":
    "为非美国签发或非英语/西班牙语记录添加海牙认证/合法化和授权翻译步骤。",
  "Move from tourist/FMM, no status, or temporary student status into qualifying temporary or permanent residence.":
    "从游客/FMM、无身份或临时学生身份转为符合条件的临时或永久居留。",
  "Start tracking residence time and absences once qualifying status begins.":
    "符合条件的身份开始后，开始记录居留时间和离境情况。",
  "Distinguished services are discretionary and should be reviewed before relying on the route.":
    "杰出服务路线具有裁量性，依赖该路线前应先审核。",
  "High-discretion naturalization route.": "高度裁量的入籍路线。",
  "Prepare evidence of cultural, social, scientific, technical, artistic, sports, business, or other benefit to Mexico.":
    "准备对墨西哥有文化、社会、科学、技术、艺术、体育、商业或其他贡献的证据。",
  "Ask SRE or counsel whether residence can be shortened or waived.":
    "询问 SRE 或顾问是否可以缩短或免除居住要求。",
  "A shorter route may exist, but the residence clock is not long enough yet.":
    "可能存在更短路线，但居住时间尚不足。",
  "Keep qualifying residence active until the route minimum is met.":
    "在满足路线最低要求前，保持符合条件的居留有效。",
  "No shorter statutory route is selected, and the five-year clock is not complete.":
    "未选择更短的法定路线，五年期限也尚未完成。",
  "Continue qualifying temporary or permanent residence toward five years.":
    "继续保持符合条件的临时或永久居留，直到满五年。",
  "Resident card validity or CURP is not ready.":
    "居留卡有效期或 CURP 尚未准备好。",
  "Application address must match INM records.":
    "申请地址必须与 INM 记录一致。",
  "Absences exceed six months total during the last two years.":
    "过去两年内离境合计超过六个月。",
  "Calculate a new filing date after the absence window clears.":
    "待离境影响期过去后，计算新的提交日期。",
  "Criminal history or pending case needs review before naturalization.":
    "犯罪记录或待处理案件需要在入籍前审核。",
  "Use the SRE study guide and practice before scheduling exams.":
    "预约考试前使用 SRE 学习指南并练习。",
  "Foreign passport does not yet meet the filing-validity requirement.":
    "外国护照尚未满足提交时的有效期要求。",
  "Prepare prior passport copies or INM migration-flow proof.":
    "准备旧护照复印件或 INM 出入境记录证明。",
  "More distant descent should be reviewed before relying on a two-year route.":
    "更远的血统关系在依赖两年路线前应先审核。",
});

const PRIVACY_POLICY_TITLE = "Privacy policy";
const PRIVACY_POLICY_COPY = [
  "Saved data is only used for your account experience, so you can return, edit answers, and stay organized across devices. It is never sold or shared.",
  "Your identity stays private. We have no way of identifying you.",
  "You are given keys instead of creating a personal account, and we do not save your secret key. Only you can access your information with your key.",
  "If you lose your secret key, you lose access to your account. We cannot recover it for you.",
];
const [
  PRIVACY_POLICY_SAVED_DATA,
  PRIVACY_POLICY_IDENTITY_PRIVATE,
  PRIVACY_POLICY_KEYS,
  PRIVACY_POLICY_KEY_LOSS,
] = PRIVACY_POLICY_COPY;
const CONSULATE_FINDER_TITLE = "Find nearest Mexican consulate";
const CONSULATE_FINDER_DESCRIPTION =
  "Use your ZIP code, city, or state to quickly find nearby Mexican consulates.";
const CONSULATE_FINDER_PLACEHOLDER = "ZIP code, city, or state";
const CONSULATE_FINDER_BUTTON = "Search consulates";

Object.assign(ES_TEXT, {
  "Already have a key?": "¿Ya tienes una clave?",
  "Sign in": "Iniciar sesión",
  "Paste your secret key": "Pega tu clave secreta",
  "Use this key": "Usar esta clave",
  Cancel: "Cancelar",
  "Account ready": "Cuenta lista",
  "Preparing your key...": "Preparando tu clave...",
  "We created a secret key for this citizenship workspace.":
    "Creamos una clave secreta para este espacio de ciudadanía.",
  "This account is ready.": "Esta cuenta está lista.",
  "Invalid secret key": "Clave secreta no válida",
  "Paste an nsec key that starts with nsec.":
    "Pega una clave nsec que empiece con nsec.",
  "Switched account": "Cuenta cambiada",
  "Your citizenship workspace is now using that key.":
    "Tu espacio de ciudadanía ahora usa esa clave.",
  "Unable to sign in.": "No se pudo iniciar sesión.",
  "Creating your key failed. You can still paste an existing key.":
    "No se pudo crear tu clave. Aún puedes pegar una clave existente.",
  [PRIVACY_POLICY_TITLE]: "Política de privacidad",
  [PRIVACY_POLICY_SAVED_DATA]:
    "Los datos guardados solo se usan para tu experiencia de cuenta, para que puedas volver, editar respuestas y mantenerte organizado/a en todos tus dispositivos. Nunca se venden ni se comparten.",
  [PRIVACY_POLICY_IDENTITY_PRIVATE]:
    "Tu identidad se mantiene privada. No tenemos forma de identificarte.",
  [PRIVACY_POLICY_KEYS]:
    "Recibes claves en lugar de crear una cuenta personal, y no guardamos tu clave secreta. Solo tú puedes acceder a tu información con tu clave.",
  [PRIVACY_POLICY_KEY_LOSS]:
    "Si pierdes tu clave secreta, pierdes acceso a tu cuenta. No podemos recuperarla por ti.",
  [CONSULATE_FINDER_TITLE]: "Encuentra el consulado mexicano más cercano",
  [CONSULATE_FINDER_DESCRIPTION]:
    "Usa tu código postal, ciudad o estado para encontrar rápidamente consulados mexicanos cercanos.",
  [CONSULATE_FINDER_PLACEHOLDER]: "Código postal, ciudad o estado",
  [CONSULATE_FINDER_BUTTON]: "Buscar consulados",
});

Object.assign(PT_TEXT, {
  "Already have a key?": "Já tem uma chave?",
  "Sign in": "Entrar",
  "Paste your secret key": "Cole sua chave secreta",
  "Use this key": "Usar esta chave",
  Cancel: "Cancelar",
  "Account ready": "Conta pronta",
  "Preparing your key...": "Preparando sua chave...",
  "We created a secret key for this citizenship workspace.":
    "Criamos uma chave secreta para este espaço de cidadania.",
  "This account is ready.": "Esta conta está pronta.",
  "Invalid secret key": "Chave secreta inválida",
  "Paste an nsec key that starts with nsec.":
    "Cole uma chave nsec que comece com nsec.",
  "Switched account": "Conta trocada",
  "Your citizenship workspace is now using that key.":
    "Seu espaço de cidadania agora usa essa chave.",
  "Unable to sign in.": "Não foi possível entrar.",
  "Creating your key failed. You can still paste an existing key.":
    "Não foi possível criar sua chave. Você ainda pode colar uma chave existente.",
  [PRIVACY_POLICY_TITLE]: "Política de privacidade",
  [PRIVACY_POLICY_SAVED_DATA]:
    "Os dados salvos são usados apenas para a experiência da sua conta, para que você possa voltar, editar respostas e se organizar em todos os dispositivos. Eles nunca são vendidos nem compartilhados.",
  [PRIVACY_POLICY_IDENTITY_PRIVATE]:
    "Sua identidade permanece privada. Não temos como identificar você.",
  [PRIVACY_POLICY_KEYS]:
    "Você recebe chaves em vez de criar uma conta pessoal, e não salvamos sua chave secreta. Só você pode acessar suas informações com sua chave.",
  [PRIVACY_POLICY_KEY_LOSS]:
    "Se você perder sua chave secreta, perderá o acesso à sua conta. Não podemos recuperá-la para você.",
  [CONSULATE_FINDER_TITLE]: "Encontre o consulado mexicano mais próximo",
  [CONSULATE_FINDER_DESCRIPTION]:
    "Use seu CEP, cidade ou estado para encontrar rapidamente consulados mexicanos próximos.",
  [CONSULATE_FINDER_PLACEHOLDER]: "CEP, cidade ou estado",
  [CONSULATE_FINDER_BUTTON]: "Buscar consulados",
});

Object.assign(IT_TEXT, {
  "Already have a key?": "Hai già una chiave?",
  "Sign in": "Accedi",
  "Paste your secret key": "Incolla la tua chiave segreta",
  "Use this key": "Usa questa chiave",
  Cancel: "Annulla",
  "Account ready": "Account pronto",
  "Preparing your key...": "Preparazione della chiave...",
  "We created a secret key for this citizenship workspace.":
    "Abbiamo creato una chiave segreta per questo spazio cittadinanza.",
  "This account is ready.": "Questo account è pronto.",
  "Invalid secret key": "Chiave segreta non valida",
  "Paste an nsec key that starts with nsec.":
    "Incolla una chiave nsec che inizi con nsec.",
  "Switched account": "Account cambiato",
  "Your citizenship workspace is now using that key.":
    "Il tuo spazio cittadinanza ora usa quella chiave.",
  "Unable to sign in.": "Impossibile accedere.",
  "Creating your key failed. You can still paste an existing key.":
    "Creazione della chiave non riuscita. Puoi comunque incollare una chiave esistente.",
  [PRIVACY_POLICY_TITLE]: "Informativa sulla privacy",
  [PRIVACY_POLICY_SAVED_DATA]:
    "I dati salvati vengono usati solo per l'esperienza del tuo account, così puoi tornare, modificare le risposte e restare organizzato su tutti i dispositivi. Non vengono mai venduti né condivisi.",
  [PRIVACY_POLICY_IDENTITY_PRIVATE]:
    "La tua identità resta privata. Non abbiamo modo di identificarti.",
  [PRIVACY_POLICY_KEYS]:
    "Ti vengono fornite chiavi invece di creare un account personale, e non salviamo la tua chiave segreta. Solo tu puoi accedere alle tue informazioni con la tua chiave.",
  [PRIVACY_POLICY_KEY_LOSS]:
    "Se perdi la chiave segreta, perdi l'accesso al tuo account. Non possiamo recuperarla per te.",
  [CONSULATE_FINDER_TITLE]: "Trova il consolato messicano più vicino",
  [CONSULATE_FINDER_DESCRIPTION]:
    "Usa CAP, città o stato per trovare rapidamente i consolati messicani vicini.",
  [CONSULATE_FINDER_PLACEHOLDER]: "CAP, città o stato",
  [CONSULATE_FINDER_BUTTON]: "Cerca consolati",
});

Object.assign(FR_TEXT, {
  "Already have a key?": "Vous avez déjà une clé ?",
  "Sign in": "Se connecter",
  "Paste your secret key": "Collez votre clé secrète",
  "Use this key": "Utiliser cette clé",
  Cancel: "Annuler",
  "Account ready": "Compte prêt",
  "Preparing your key...": "Préparation de votre clé...",
  "We created a secret key for this citizenship workspace.":
    "Nous avons créé une clé secrète pour cet espace citoyenneté.",
  "This account is ready.": "Ce compte est prêt.",
  "Invalid secret key": "Clé secrète invalide",
  "Paste an nsec key that starts with nsec.":
    "Collez une clé nsec qui commence par nsec.",
  "Switched account": "Compte changé",
  "Your citizenship workspace is now using that key.":
    "Votre espace citoyenneté utilise maintenant cette clé.",
  "Unable to sign in.": "Impossible de se connecter.",
  "Creating your key failed. You can still paste an existing key.":
    "La création de votre clé a échoué. Vous pouvez toujours coller une clé existante.",
  [PRIVACY_POLICY_TITLE]: "Politique de confidentialité",
  [PRIVACY_POLICY_SAVED_DATA]:
    "Les données enregistrées servent uniquement à l'expérience de votre compte, afin que vous puissiez revenir, modifier vos réponses et rester organisé sur tous vos appareils. Elles ne sont jamais vendues ni partagées.",
  [PRIVACY_POLICY_IDENTITY_PRIVATE]:
    "Votre identité reste privée. Nous n'avons aucun moyen de vous identifier.",
  [PRIVACY_POLICY_KEYS]:
    "Vous recevez des clés au lieu de créer un compte personnel, et nous n'enregistrons pas votre clé secrète. Vous seul pouvez accéder à vos informations avec votre clé.",
  [PRIVACY_POLICY_KEY_LOSS]:
    "Si vous perdez votre clé secrète, vous perdez l'accès à votre compte. Nous ne pouvons pas la récupérer pour vous.",
  [CONSULATE_FINDER_TITLE]: "Trouvez le consulat mexicain le plus proche",
  [CONSULATE_FINDER_DESCRIPTION]:
    "Utilisez votre code postal, votre ville ou votre État pour trouver rapidement les consulats mexicains proches.",
  [CONSULATE_FINDER_PLACEHOLDER]: "Code postal, ville ou État",
  [CONSULATE_FINDER_BUTTON]: "Rechercher des consulats",
});

Object.assign(JA_TEXT, {
  "Already have a key?": "すでにキーをお持ちですか？",
  "Sign in": "サインイン",
  "Paste your secret key": "秘密鍵を貼り付け",
  "Use this key": "このキーを使う",
  Cancel: "キャンセル",
  "Account ready": "アカウント準備完了",
  "Preparing your key...": "キーを準備中...",
  "We created a secret key for this citizenship workspace.":
    "この国籍ワークスペース用の秘密鍵を作成しました。",
  "This account is ready.": "このアカウントは準備できています。",
  "Invalid secret key": "秘密鍵が無効です",
  "Paste an nsec key that starts with nsec.":
    "nsecで始まるnsecキーを貼り付けてください。",
  "Switched account": "アカウントを切り替えました",
  "Your citizenship workspace is now using that key.":
    "国籍ワークスペースはそのキーを使用しています。",
  "Unable to sign in.": "サインインできませんでした。",
  "Creating your key failed. You can still paste an existing key.":
    "キーを作成できませんでした。既存のキーを貼り付けることはできます。",
  [PRIVACY_POLICY_TITLE]: "プライバシーポリシー",
  [PRIVACY_POLICY_SAVED_DATA]:
    "保存されたデータはアカウント体験のためだけに使われます。戻って回答を編集したり、複数のデバイスで整理して使ったりできます。販売や共有はされません。",
  [PRIVACY_POLICY_IDENTITY_PRIVATE]:
    "あなたの身元は非公開のままです。こちらがあなたを特定する方法はありません。",
  [PRIVACY_POLICY_KEYS]:
    "個人アカウントを作成する代わりにキーが渡されます。こちらでは秘密鍵を保存しません。あなたのキーを使えるのはあなただけなので、情報にアクセスできるのもあなただけです。",
  [PRIVACY_POLICY_KEY_LOSS]:
    "秘密鍵を失うと、アカウントにアクセスできなくなります。こちらでは復元できません。",
  [CONSULATE_FINDER_TITLE]: "最寄りのメキシコ領事館を探す",
  [CONSULATE_FINDER_DESCRIPTION]:
    "郵便番号、市区町村、または州を使って、近くのメキシコ領事館をすばやく探せます。",
  [CONSULATE_FINDER_PLACEHOLDER]: "郵便番号、市区町村、または州",
  [CONSULATE_FINDER_BUTTON]: "領事館を検索",
});

Object.assign(HI_TEXT, {
  "Already have a key?": "क्या आपके पास पहले से कुंजी है?",
  "Sign in": "साइन इन करें",
  "Paste your secret key": "अपनी गुप्त कुंजी चिपकाएँ",
  "Use this key": "इस कुंजी का उपयोग करें",
  Cancel: "रद्द करें",
  "Account ready": "खाता तैयार है",
  "Preparing your key...": "आपकी कुंजी तैयार हो रही है...",
  "We created a secret key for this citizenship workspace.":
    "हमने इस नागरिकता कार्यक्षेत्र के लिए एक गुप्त कुंजी बनाई है।",
  "This account is ready.": "यह खाता तैयार है।",
  "Invalid secret key": "अमान्य गुप्त कुंजी",
  "Paste an nsec key that starts with nsec.":
    "ऐसी nsec कुंजी चिपकाएँ जो nsec से शुरू होती हो।",
  "Switched account": "खाता बदल गया",
  "Your citizenship workspace is now using that key.":
    "आपका नागरिकता कार्यक्षेत्र अब उसी कुंजी का उपयोग कर रहा है।",
  "Unable to sign in.": "साइन इन नहीं हो सका।",
  "Creating your key failed. You can still paste an existing key.":
    "आपकी कुंजी नहीं बन सकी। आप फिर भी मौजूदा कुंजी चिपका सकते हैं।",
  [PRIVACY_POLICY_TITLE]: "गोपनीयता नीति",
  [PRIVACY_POLICY_SAVED_DATA]:
    "सेव किया गया डेटा केवल आपके खाते के अनुभव के लिए उपयोग होता है, ताकि आप वापस आ सकें, उत्तर संपादित कर सकें, और सभी डिवाइस पर व्यवस्थित रह सकें। इसे कभी बेचा या साझा नहीं किया जाता।",
  [PRIVACY_POLICY_IDENTITY_PRIVATE]:
    "आपकी पहचान निजी रहती है। हमारे पास आपको पहचानने का कोई तरीका नहीं है।",
  [PRIVACY_POLICY_KEYS]:
    "व्यक्तिगत खाता बनाने के बजाय आपको कुंजियाँ दी जाती हैं, और हम आपकी गुप्त कुंजी सेव नहीं करते। केवल आप अपनी कुंजी से अपनी जानकारी तक पहुँच सकते हैं।",
  [PRIVACY_POLICY_KEY_LOSS]:
    "अगर आप अपनी गुप्त कुंजी खो देते हैं, तो आपके खाते तक पहुँच चली जाती है। हम इसे आपके लिए वापस नहीं ला सकते।",
  [CONSULATE_FINDER_TITLE]: "निकटतम मैक्सिकन वाणिज्य दूतावास खोजें",
  [CONSULATE_FINDER_DESCRIPTION]:
    "अपने ZIP कोड, शहर या राज्य से पास के मैक्सिकन वाणिज्य दूतावास जल्दी खोजें।",
  [CONSULATE_FINDER_PLACEHOLDER]: "ZIP कोड, शहर या राज्य",
  [CONSULATE_FINDER_BUTTON]: "वाणिज्य दूतावास खोजें",
});

Object.assign(AR_TEXT, {
  "Already have a key?": "هل لديك مفتاح بالفعل؟",
  "Sign in": "تسجيل الدخول",
  "Paste your secret key": "الصق مفتاحك السري",
  "Use this key": "استخدم هذا المفتاح",
  Cancel: "إلغاء",
  "Account ready": "الحساب جاهز",
  "Preparing your key...": "جار تجهيز مفتاحك...",
  "We created a secret key for this citizenship workspace.":
    "أنشأنا مفتاحا سريا لمساحة الجنسية هذه.",
  "This account is ready.": "هذا الحساب جاهز.",
  "Invalid secret key": "المفتاح السري غير صالح",
  "Paste an nsec key that starts with nsec.": "الصق مفتاح nsec يبدأ بـ nsec.",
  "Switched account": "تم تبديل الحساب",
  "Your citizenship workspace is now using that key.":
    "مساحة الجنسية لديك تستخدم هذا المفتاح الآن.",
  "Unable to sign in.": "تعذر تسجيل الدخول.",
  "Creating your key failed. You can still paste an existing key.":
    "تعذر إنشاء مفتاحك. ما زال بإمكانك لصق مفتاح موجود.",
  [PRIVACY_POLICY_TITLE]: "سياسة الخصوصية",
  [PRIVACY_POLICY_SAVED_DATA]:
    "البيانات المحفوظة تُستخدم فقط لتجربة حسابك، حتى تتمكن من الرجوع وتعديل الإجابات والبقاء منظما عبر الأجهزة. لا يتم بيعها أو مشاركتها أبدا.",
  [PRIVACY_POLICY_IDENTITY_PRIVATE]:
    "تظل هويتك خاصة. لا توجد لدينا طريقة للتعرف عليك.",
  [PRIVACY_POLICY_KEYS]:
    "تحصل على مفاتيح بدلا من إنشاء حساب شخصي، ولا نحفظ مفتاحك السري. أنت وحدك تستطيع الوصول إلى معلوماتك باستخدام مفتاحك.",
  [PRIVACY_POLICY_KEY_LOSS]:
    "إذا فقدت مفتاحك السري، فستفقد الوصول إلى حسابك. لا يمكننا استرجاعه لك.",
  [CONSULATE_FINDER_TITLE]: "ابحث عن أقرب قنصلية مكسيكية",
  [CONSULATE_FINDER_DESCRIPTION]:
    "استخدم الرمز البريدي أو المدينة أو الولاية للعثور بسرعة على القنصليات المكسيكية القريبة.",
  [CONSULATE_FINDER_PLACEHOLDER]: "الرمز البريدي أو المدينة أو الولاية",
  [CONSULATE_FINDER_BUTTON]: "ابحث عن القنصليات",
});

Object.assign(ZH_TEXT, {
  "Already have a key?": "已经有密钥？",
  "Sign in": "登录",
  "Paste your secret key": "粘贴你的密钥",
  "Use this key": "使用此密钥",
  Cancel: "取消",
  "Account ready": "账户已准备好",
  "Preparing your key...": "正在准备密钥...",
  "We created a secret key for this citizenship workspace.":
    "我们已为此国籍工作区创建密钥。",
  "This account is ready.": "此账户已准备好。",
  "Invalid secret key": "密钥无效",
  "Paste an nsec key that starts with nsec.":
    "请粘贴以 nsec 开头的 nsec 密钥。",
  "Switched account": "账户已切换",
  "Your citizenship workspace is now using that key.":
    "你的国籍工作区现在正在使用该密钥。",
  "Unable to sign in.": "无法登录。",
  "Creating your key failed. You can still paste an existing key.":
    "密钥创建失败。你仍然可以粘贴已有密钥。",
  [PRIVACY_POLICY_TITLE]: "隐私政策",
  [PRIVACY_POLICY_SAVED_DATA]:
    "保存的数据只用于你的账户体验，让你可以返回、编辑答案，并在不同设备上保持有序。它绝不会被出售或分享。",
  [PRIVACY_POLICY_IDENTITY_PRIVATE]: "你的身份保持私密。我们无法识别你的身份。",
  [PRIVACY_POLICY_KEYS]:
    "你会获得密钥，而不是创建个人账户；我们也不会保存你的密钥。只有你可以用自己的密钥访问你的信息。",
  [PRIVACY_POLICY_KEY_LOSS]:
    "如果你丢失密钥，就会失去账户访问权限。我们无法为你恢复。",
  [CONSULATE_FINDER_TITLE]: "查找最近的墨西哥领事馆",
  [CONSULATE_FINDER_DESCRIPTION]:
    "使用邮编、城市或州，快速查找附近的墨西哥领事馆。",
  [CONSULATE_FINDER_PLACEHOLDER]: "邮编、城市或州",
  [CONSULATE_FINDER_BUTTON]: "搜索领事馆",
});

const TEXT_TRANSLATIONS = {
  es: ES_TEXT,
  pt: PT_TEXT,
  it: IT_TEXT,
  fr: FR_TEXT,
  ja: JA_TEXT,
  hi: HI_TEXT,
  ar: AR_TEXT,
  zh: ZH_TEXT,
};

const TWO_YEAR_ROUTE_LABELS = {
  es: "Ruta de 2 años",
  pt: "Rota de 2 anos",
  it: "Percorso di 2 anni",
  fr: "Parcours de 2 ans",
  ja: "2年ルート",
  hi: "2-वर्षीय मार्ग",
  ar: "مسار سنتين",
  zh: "2年路径",
};

const SHORTER_ROUTE_SENTENCES = {
  es: (subject) =>
    `${subject} puede apoyar una ruta de naturalización más corta.`,
  pt: (subject) =>
    `${subject} pode apoiar uma rota de naturalização mais curta.`,
  it: (subject) =>
    `${subject} può sostenere un percorso di naturalizzazione più breve.`,
  fr: (subject) =>
    `${subject} peut appuyer un parcours de naturalisation plus court.`,
  ja: (subject) => `${subject} はより短い帰化ルートの根拠になり得ます。`,
  hi: (subject) => `${subject} छोटे नैचुरलाइज़ेशन मार्ग का आधार हो सकता है।`,
  ar: (subject) => `يمكن أن يدعم ${subject} مسار تجنس أقصر.`,
  zh: (subject) => `${subject} 可以支持较短的入籍路径。`,
};

const BASE_ROUTE_REMAINS_SENTENCES = {
  en: (routeTitle) =>
    `${routeTitle} remains possible, but the flagged issue should be resolved first.`,
  es: (routeTitle) =>
    `${routeTitle} sigue siendo posible, pero primero debe resolverse el punto marcado.`,
  pt: (routeTitle) =>
    `${routeTitle} continua possível, mas o ponto marcado deve ser resolvido primeiro.`,
  it: (routeTitle) =>
    `${routeTitle} resta possibile, ma il punto segnalato va risolto prima.`,
  fr: (routeTitle) =>
    `${routeTitle} reste possible, mais le point signalé doit être résolu d'abord.`,
  ja: (routeTitle) =>
    `${routeTitle} はまだ可能ですが、先に指摘事項を解決してください。`,
  hi: (routeTitle) =>
    `${routeTitle} अभी भी संभव है, लेकिन चिह्नित मुद्दे को पहले हल करना चाहिए।`,
  ar: (routeTitle) =>
    `يبقى ${routeTitle} ممكنا، لكن يجب حل المسألة المشار إليها أولا.`,
  zh: (routeTitle) => `${routeTitle} 仍然可能，但应先解决标记的问题。`,
};

const translateText = (text, language = "en") => {
  if (!text) return text;
  const normalizedLanguage = normalizeSupportLanguage(language);
  if (normalizedLanguage === "en") return text;

  const translations = TEXT_TRANSLATIONS[normalizedLanguage] || {};
  if (translations[text]) return translations[text];

  if (text.startsWith("2-year route: ")) {
    const subject = text.replace("2-year route: ", "");
    const prefix = TWO_YEAR_ROUTE_LABELS[normalizedLanguage] || "2-year route";
    return `${prefix}: ${translateText(subject, normalizedLanguage)}`;
  }

  if (text.endsWith(" can support a shorter naturalization route.")) {
    const subject = text.replace(
      " can support a shorter naturalization route.",
      "",
    );
    const translatedSubject = translateText(subject, normalizedLanguage);
    const template = SHORTER_ROUTE_SENTENCES[normalizedLanguage];
    return template ? template(translatedSubject) : text;
  }

  return text;
};

const DEFAULT_ANSWERS = {
  currentCitizenship: "",
  birthplace: "",
  existingDocs: [],
  applicantType: "",
  handlingLocation: "",
  registeredMexico: "",
  foreignNationalityBefore1998: "",
  actaIssue: "",
  parentMexicanAtBirth: "",
  parentProof: "",
  parentOrigin: "",
  parentNamesMatch: "",
  birthCertificateType: "",
  parentsMarriedTiming: "",
  parentAvailability: "",
  applicantAdult: "",
  foreignBirthRecord: "",
  residentStatus: "",
  residenceYears: "",
  cardReady: "",
  addressMatch: "",
  absences: "",
  marriedMexican: "",
  mexicanChild: "",
  descendant: "",
  latinIberian: "",
  adoptedParentalAuthority: "",
  refugee: "",
  distinguishedService: "",
  criminalHistory: "",
  examReady: "",
  passportReady: "",
};

const TEST_PREFILL_ANSWERS = {
  ...DEFAULT_ANSWERS,
  currentCitizenship: "us",
  birthplace: "mexico",
  existingDocs: ["birth_acta"],
  applicantType: "self_adult",
  handlingLocation: "Los Angeles consulate",
  registeredMexico: "yes",
  foreignNationalityBefore1998: "no",
  actaIssue: "no",
  residentStatus: "permanent",
  residenceYears: "5_plus",
  cardReady: "yes",
  addressMatch: "yes",
  absences: "none",
  marriedMexican: "no",
  mexicanChild: "no",
  descendant: "no",
  latinIberian: "no",
  adoptedParentalAuthority: "no",
  refugee: "no",
  distinguishedService: "no",
  criminalHistory: "no",
  examReady: "yes",
  passportReady: "yes",
};

const hasAny = (values, targets) =>
  values.some((value) => targets.includes(value));

const strongMexicanDocs = [
  "birth_acta",
  "passport",
  "declaratoria",
  "certificate",
  "naturalization_letter",
];

const parentStrongProof = [
  "parent_birth_acta",
  "parent_passport",
  "parent_naturalization_letter",
  "parent_declaratoria",
];

const parentSoftProof = ["parent_matricula", "parent_ine"];

const isBornOutsideMexico = (birthplace) =>
  ["us", "other_country", "unknown"].includes(birthplace);

const isParentMexicanYes = (value) =>
  ["mother", "father", "both"].includes(value);

const addUnique = (list, item) => {
  if (!list.includes(item)) list.push(item);
};

const getChecklistItemId = (item) => {
  const text = String(item || "");
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }

  return `item_${text.length}_${hash.toString(36)}`;
};

const evaluateCitizenshipRoute = (answers) => {
  const blockers = [];
  const reasons = [];
  const checklist = [];
  const notices = [];
  const docs = answers.existingDocs || [];
  const hasNationalityDoc = hasAny(docs, strongMexicanDocs);
  const hasParentStrongProof = parentStrongProof.includes(answers.parentProof);
  const hasParentSoftProof = parentSoftProof.includes(answers.parentProof);
  const parentLikelyMexican =
    isParentMexicanYes(answers.parentMexicanAtBirth) ||
    answers.parentMexicanAtBirth === "not_sure";

  let baseRoute = null;
  let routeCode = null;
  let modality = "";

  if (!answers.birthplace) {
    return {
      route: null,
      confidence: "Waiting for birthplace",
      baseRoute,
      modality,
      reasons: ["Start with birthplace and existing Mexican records."],
      blockers,
      checklist: ["Confirm where the applicant was born."],
      notices,
    };
  }

  if (hasNationalityDoc) {
    routeCode = "R1";
    reasons.push(
      "You already have a Mexican nationality document on the record.",
    );
    checklist.push(
      "Get certified copies of the Mexican acta or document if needed.",
      "Confirm CURP and name consistency across IDs.",
      "Schedule passport, matricula, INE, or record-correction steps as applicable.",
    );
  }

  if (!routeCode && answers.birthplace === "mexico") {
    if (
      answers.registeredMexico === "no" ||
      answers.registeredMexico === "unknown"
    ) {
      routeCode = "R7";
      baseRoute = "R1";
      addUnique(
        blockers,
        "Mexican civil registry record is missing or uncertain.",
      );
      checklist.push(
        "Ask the relevant civil registry or consulate about late/no registration evidence.",
        "Collect older supporting records such as baptismal, school, medical, parent, or sibling records.",
      );
    } else if (answers.foreignNationalityBefore1998 === "yes") {
      routeCode = "R4";
      reasons.push(
        "Born in Mexico, but foreign nationality was acquired before March 20, 1998.",
      );
      checklist.push(
        "Prepare Mexican birth acta.",
        "Gather proof of foreign naturalization with apostille if required.",
        "Gather ID, photos, and name-change or marriage records.",
      );
    } else if (answers.foreignNationalityBefore1998 === "unknown") {
      routeCode = "R7";
      baseRoute = "R1";
      addUnique(blockers, "Foreign naturalization timing is unknown.");
      checklist.push(
        "Confirm the exact date another nationality was acquired.",
      );
    } else if (answers.actaIssue === "yes" || answers.actaIssue === "unknown") {
      routeCode = "R7";
      baseRoute = "R1";
      addUnique(
        blockers,
        "Mexican acta may be late-registered or inconsistent with ID.",
      );
      checklist.push(
        "Compare the acta against current ID, parents' records, and marriage/name-change documents.",
        "Ask the civil registry or consulate whether correction or supplemental proof is required.",
      );
    } else {
      routeCode = "R1";
      reasons.push("People born in Mexico are Mexican by birth.");
      checklist.push(
        "Locate or obtain a certified Mexican birth acta.",
        "Confirm CURP and fix record errors before passport or ID appointment.",
        "Apply for Mexican passport, matricula, INE, or other ID.",
      );
    }
  }

  if (!routeCode && answers.birthplace === "mexican_ship_aircraft") {
    routeCode = "R1";
    reasons.push(
      "Birth on a Mexican vessel or aircraft can be a Mexican-by-birth category.",
    );
    checklist.push(
      "Collect the vessel/aircraft birth record and parent identity records.",
      "Ask the consulate or civil registry which office should issue or recognize the acta.",
      "Proceed to passport/ID after the Mexican nationality record is issued.",
    );
  }

  if (!routeCode && isBornOutsideMexico(answers.birthplace)) {
    if (
      isParentMexicanYes(answers.parentMexicanAtBirth) &&
      hasParentStrongProof
    ) {
      routeCode = "R2";
      reasons.push(
        "At least one legal parent was Mexican at or before the applicant's birth.",
      );
      checklist.push(
        "Use MiConsulado and choose civil registry / birth registration, not passport.",
        "Bring the applicant's long-form certified birth certificate.",
        "Bring the Mexican parent's acta, passport, Carta de Naturalizacion, or declaratoria as applicable.",
        "Bring parent IDs, marriage/name-change records, and witnesses if the consulate requires them.",
        "After the Mexican acta is issued, confirm CURP and schedule a Mexican passport appointment.",
      );
    } else if (
      isParentMexicanYes(answers.parentMexicanAtBirth) &&
      hasParentSoftProof
    ) {
      routeCode = "R2";
      reasons.push(
        "The parent appears Mexican, but the appointment will likely need stronger nationality proof.",
      );
      checklist.push(
        "Obtain the Mexican parent's certified birth acta or Carta de Naturalizacion before the appointment.",
        "Then prepare the applicant's long-form birth certificate and parent ID records.",
      );
    } else if (
      parentLikelyMexican &&
      ["none", "unknown", ""].includes(answers.parentProof)
    ) {
      routeCode = "R3";
      reasons.push(
        "The parent link may qualify, but the Mexican parent must be documented first.",
      );
      checklist.push(
        "Find or request the parent's Mexican birth acta, declaratoria, or Carta de Naturalizacion.",
        "If the parent was born abroad and never registered, document the parent first.",
        "Then reopen the applicant's birth registration checklist.",
      );
    }

    if (answers.parentMexicanAtBirth === "parent_after_birth") {
      addUnique(
        blockers,
        "Parent became Mexican after the applicant was born.",
      );
    }
    if (answers.parentOrigin === "born_abroad" && !hasParentStrongProof) {
      routeCode = routeCode === "R2" ? "R7" : "R3";
      baseRoute = "R3";
      addUnique(
        blockers,
        "Parent was born abroad and may need their own Mexican record first.",
      );
    }
    if (answers.parentNamesMatch && answers.parentNamesMatch !== "yes") {
      baseRoute = baseRoute || routeCode || "R2";
      routeCode = "R7";
      addUnique(
        blockers,
        "Parent names do not clearly match across birth and Mexican records.",
      );
    }
    if (
      ["short_abstract", "hospital_only", "no"].includes(
        answers.birthCertificateType,
      )
    ) {
      baseRoute = baseRoute || routeCode || "R2";
      routeCode = routeCode === "R3" ? "R3" : "R7";
      addUnique(
        blockers,
        "Applicant does not yet have a long-form certified birth certificate.",
      );
      addUnique(
        checklist,
        "Order the long-form certified birth certificate before attending.",
      );
    }
    if (
      ["late_or_after_birth", "no", "unknown"].includes(
        answers.parentsMarriedTiming,
      ) &&
      ["yes_father", "yes_mother", "both", "unknown"].includes(
        answers.parentAvailability,
      )
    ) {
      baseRoute = baseRoute || routeCode || "R2";
      routeCode = "R7";
      addUnique(
        blockers,
        "Parent appearance, marriage timing, or special power of attorney issue needs consulate review.",
      );
    }
    if (answers.parentAvailability && answers.parentAvailability !== "no") {
      baseRoute = baseRoute || routeCode || "R2";
      routeCode = routeCode === "R3" ? "R3" : "R7";
      addUnique(
        blockers,
        "A parent is deceased, absent, unavailable, or unwilling to participate.",
      );
    }
    if (
      ["non_us", "non_english", "unknown"].includes(answers.foreignBirthRecord)
    ) {
      addUnique(
        checklist,
        "Add apostille/legalization and authorized translation steps for non-U.S. or non-English/non-Spanish records.",
      );
    }
  }

  if (
    !routeCode ||
    (routeCode === "R7" &&
      baseRoute === "R2" &&
      blockers.includes("Parent became Mexican after the applicant was born."))
  ) {
    const naturalization = evaluateNaturalization(answers);
    if (!routeCode || answers.parentMexicanAtBirth === "parent_after_birth") {
      return naturalization;
    }
  }

  if (!routeCode) {
    return evaluateNaturalization(answers);
  }

  if (blockers.length > 0 && routeCode !== "R7" && routeCode !== "R3") {
    baseRoute = routeCode;
    routeCode = "R7";
  }

  notices.push(...buildWarnings(routeCode, baseRoute));

  return {
    route: ROUTES[routeCode],
    confidence: blockers.length ? "Needs document review" : "Likely route",
    baseRoute,
    modality,
    reasons,
    blockers,
    checklist,
    notices,
  };
};

const evaluateNaturalization = (answers) => {
  const blockers = [];
  const reasons = [];
  const checklist = [];
  const notices = [];
  let routeCode = "";
  let modality = "";

  const hasQualifyingResidence = ["permanent", "temporary"].includes(
    answers.residentStatus,
  );
  const residenceYears = answers.residenceYears;
  const hasTwoYears = ["2_5", "5_plus"].includes(residenceYears);
  const hasFiveYears = residenceYears === "5_plus";
  const hasOneYear = ["1_2", "2_5", "5_plus"].includes(residenceYears);
  const hasNoQualifyingResidenceYears = residenceYears === "none";

  const specialTwoYearRoutes = [];
  if (answers.marriedMexican === "yes")
    specialTwoYearRoutes.push("marriage to a Mexican citizen");
  if (answers.mexicanChild === "yes")
    specialTwoYearRoutes.push("Mexican child by birth");
  if (["parent", "grandparent"].includes(answers.descendant)) {
    specialTwoYearRoutes.push("direct descent from Mexican by birth");
  }
  if (answers.latinIberian === "yes") {
    specialTwoYearRoutes.push("Latin American or Iberian origin");
  }
  if (answers.refugee === "yes")
    specialTwoYearRoutes.push("recognized refugee checklist");

  const hasOneYearRoute = ["yes", "former"].includes(
    answers.adoptedParentalAuthority,
  );

  if (answers.distinguishedService === "yes") {
    routeCode = "R7";
    modality = "Distinguished-service route";
    reasons.push(
      "Distinguished services are discretionary and should be reviewed before relying on the route.",
    );
    blockers.push("High-discretion naturalization route.");
    checklist.push(
      "Prepare evidence of cultural, social, scientific, technical, artistic, sports, business, or other benefit to Mexico.",
      "Ask SRE or counsel whether residence can be shortened or waived.",
    );
  } else if (!hasQualifyingResidence || hasNoQualifyingResidenceYears) {
    routeCode = "R6";
    if (!hasQualifyingResidence) {
      reasons.push(
        "Naturalization generally requires temporary or permanent resident status.",
      );
      checklist.push(
        "Move from tourist/FMM, no status, or temporary student status into qualifying temporary or permanent residence.",
      );
    } else {
      reasons.push(
        "A shorter route may exist, but the residence clock is not long enough yet.",
      );
      checklist.push(
        "Keep qualifying residence active until the route minimum is met.",
      );
    }
    checklist.push(
      "Start tracking residence time and absences once qualifying status begins.",
    );
  } else if (hasFiveYears) {
    routeCode = "R5";
    modality = "5-year general residence";
    reasons.push(
      "Five or more years of qualifying residence can support the general route.",
    );
  } else if (specialTwoYearRoutes.length && hasTwoYears) {
    routeCode = "R5";
    modality = `2-year route: ${specialTwoYearRoutes[0]}`;
    reasons.push(
      `${specialTwoYearRoutes[0]} can support a shorter naturalization route.`,
    );
  } else if (hasOneYearRoute && hasOneYear) {
    routeCode = "R5";
    modality = "1-year adoption / parental authority route";
    reasons.push(
      "Adoption or Mexican parental authority can support a one-year route with custody review.",
    );
  } else if (specialTwoYearRoutes.length || hasOneYearRoute) {
    routeCode = "R6";
    modality =
      specialTwoYearRoutes[0] || "1-year adoption / parental authority route";
    reasons.push(
      "A shorter route may exist, but the residence clock is not long enough yet.",
    );
    checklist.push(
      "Keep qualifying residence active until the route minimum is met.",
    );
  } else {
    routeCode = "R6";
    modality = "5-year general residence";
    reasons.push(
      "No shorter statutory route is selected, and the five-year clock is not complete.",
    );
    checklist.push(
      "Continue qualifying temporary or permanent residence toward five years.",
    );
  }

  if (routeCode === "R5") {
    checklist.push(
      "Confirm resident card is valid at least six months beyond the filing date and shows CURP.",
      "Make sure the DNN-3 address matches the INM-registered address.",
      "Prepare DNN-3, resident card, full passport copies, entries/exits letter, CURP, photos, payment, and criminal-record certificates.",
      "Gather modality proof such as marriage acta, child's Mexican acta, descent records, origin-country birth certificate, COMAR letter, or custody/adoption records.",
      "Study for Spanish, Mexican history, and culture exams unless an exception applies.",
    );
  }

  if (
    ["no", "unknown"].includes(answers.cardReady) ||
    (routeCode === "R5" && answers.cardReady === "not_applicable")
  ) {
    addUnique(blockers, "Resident card validity or CURP is not ready.");
  }
  if (
    ["no", "unknown"].includes(answers.addressMatch) ||
    (routeCode === "R5" && answers.addressMatch === "not_applicable")
  ) {
    addUnique(blockers, "Application address must match INM records.");
  }
  if (answers.absences === "over_6_months") {
    routeCode = "R6";
    addUnique(
      blockers,
      "Absences exceed six months total during the last two years.",
    );
    addUnique(
      checklist,
      "Calculate a new filing date after the absence window clears.",
    );
  }
  if (
    ["pending", "conviction", "sentence", "unknown"].includes(
      answers.criminalHistory,
    )
  ) {
    routeCode = "R7";
    addUnique(
      blockers,
      "Criminal history or pending case needs review before naturalization.",
    );
  }
  if (["no", "maybe"].includes(answers.examReady)) {
    addUnique(
      checklist,
      "Use the SRE study guide and practice before scheduling exams.",
    );
  }
  if (answers.passportReady === "no") {
    addUnique(
      blockers,
      "Foreign passport does not yet meet the filing-validity requirement.",
    );
  }
  if (answers.passportReady === "recently_renewed") {
    addUnique(
      checklist,
      "Prepare prior passport copies or INM migration-flow proof.",
    );
  }
  if (answers.descendant === "great_grandparent") {
    addUnique(
      blockers,
      "More distant descent should be reviewed before relying on a two-year route.",
    );
  }

  notices.push(...buildWarnings(routeCode));

  return {
    route: ROUTES[routeCode || "R6"],
    confidence: blockers.length
      ? "Prerequisites or review needed"
      : "Likely route",
    baseRoute: null,
    modality,
    reasons,
    blockers,
    checklist,
    notices,
  };
};

const buildWarnings = (routeCode, baseRoute) => {
  const warnings = [
    "U.S. citizens generally do not automatically lose U.S. citizenship by acquiring another nationality, and U.S. dual nationals generally must use a U.S. passport to enter and leave the United States.",
  ];

  if (
    ["R1", "R2", "R3", "R4"].includes(routeCode) ||
    ["R1", "R2"].includes(baseRoute)
  ) {
    warnings.push(
      "Mexicans by birth cannot be deprived of Mexican nationality.",
    );
  }

  if (routeCode === "R5" || baseRoute === "R5") {
    warnings.push(
      "Naturalized Mexican nationality can be lost in specific situations, including voluntarily acquiring another foreign nationality, using a foreign passport as a Mexican in certain contexts, or residing abroad for five continuous years.",
    );
  }

  warnings.push(
    "This tool is an eligibility guide, not a legal decision. SRE, consulates, and civil registry offices apply the final requirements.",
  );

  return warnings;
};

const DUAL_CITIZENSHIP_BENEFITS = {
  en: {
    title: "Benefits of Mexican dual citizenship",
    subtitle:
      "Start with the rights that matter at any age, then see how they can matter at different life stages.",
    overallTitle: "Biggest overall benefits",
    overallBenefits: [
      "Live in Mexico without needing a visa",
      "Work in Mexico without a work permit",
      "Vote in Mexican elections",
      "Get Mexican ID and passport",
      "Own property more easily",
      "Pass nationality to children",
      "Retire in Mexico more securely",
      "Keep U.S. citizenship while gaining Mexican rights",
    ],
    ageTitle: "Benefits by age group",
    ageGroups: [
      {
        range: "Ages 0-17",
        items: [
          "Mexican birth registration",
          "Mexican passport",
          "CURP / official Mexican identity record",
          "Easier future access to Mexico",
          "Easier to live with family in Mexico",
          "Keeps options open for school, work, property, and inheritance later",
        ],
      },
      {
        range: "Ages 18-24",
        items: [
          "INE voter ID eligibility",
          "Right to vote in Mexican elections",
          "Can work in Mexico without a work visa",
          "Easier to rent, bank, study, and get local services",
          "Easier to build a life in either the U.S. or Mexico",
        ],
      },
      {
        range: "Ages 25-39",
        items: [
          "Work in Mexico without immigration sponsorship",
          "Start a business more easily",
          "Buy property more easily",
          "Own land directly instead of using foreigner structures in restricted zones",
          "Pass Mexican nationality to children if eligible",
          "Easier family relocation",
        ],
      },
      {
        range: "Ages 40-54",
        items: [
          "More flexibility to relocate or live part-time in Mexico",
          "Easier property and wealth planning",
          "Easier banking, tax, and legal setup",
          "Easier to care for family in Mexico",
          "Can build healthcare and retirement plans earlier",
        ],
      },
      {
        range: "Ages 55-64",
        items: [
          "Easier pre-retirement planning",
          "Can spend long periods in Mexico without tourist/residency limits",
          "Easier to buy, renovate, or settle into property",
          "Easier to test living in Mexico before retirement",
          "Possible access to senior-related programs starting around 60, depending on requirements",
        ],
      },
      {
        range: "Ages 65+",
        items: [
          "Can retire in Mexico as a Mexican citizen",
          "Long-term residence without visa concerns",
          "Easier access to Mexican senior programs if eligible",
          "Possible federal senior pension if living in Mexico and meeting requirements",
          "Can combine Mexico residence with U.S. Social Security, if eligible",
          "More secure cross-border retirement planning",
        ],
      },
    ],
    primaryCta: "Compare DNExpress costs",
    backCta: "Back to benefits",
  },
  es: {
    title: "Beneficios de la doble ciudadanía mexicana",
    subtitle:
      "Empieza con los derechos que importan a cualquier edad y luego mira cómo pueden servir en distintas etapas de vida.",
    overallTitle: "Mayores beneficios generales",
    overallBenefits: [
      "Vivir en México sin necesitar visa",
      "Trabajar en México sin permiso de trabajo",
      "Votar en elecciones mexicanas",
      "Obtener identificación y pasaporte mexicanos",
      "Tener propiedad con más facilidad",
      "Transmitir nacionalidad a hijos",
      "Jubilarte en México con más seguridad",
      "Conservar ciudadanía estadounidense mientras obtienes derechos mexicanos",
    ],
    ageTitle: "Beneficios por grupo de edad",
    ageGroups: [
      {
        range: "0-17 años",
        items: [
          "Registro mexicano de nacimiento",
          "Pasaporte mexicano",
          "CURP / registro oficial de identidad mexicana",
          "Acceso futuro a México más fácil",
          "Más facilidad para vivir con familia en México",
          "Mantiene abiertas opciones futuras de escuela, trabajo, propiedad e herencia",
        ],
      },
      {
        range: "18-24 años",
        items: [
          "Elegibilidad para credencial INE",
          "Derecho a votar en elecciones mexicanas",
          "Puedes trabajar en México sin visa de trabajo",
          "Más facilidad para rentar, abrir cuentas, estudiar y recibir servicios locales",
          "Más facilidad para construir una vida en EE. UU. o México",
        ],
      },
      {
        range: "25-39 años",
        items: [
          "Trabajar en México sin patrocinio migratorio",
          "Emprender un negocio con más facilidad",
          "Comprar propiedad con más facilidad",
          "Tener tierra directamente en vez de usar estructuras para extranjeros en zonas restringidas",
          "Transmitir nacionalidad mexicana a hijos si califican",
          "Reubicación familiar más sencilla",
        ],
      },
      {
        range: "40-54 años",
        items: [
          "Más flexibilidad para mudarte o vivir parte del tiempo en México",
          "Planificación patrimonial y de propiedad más sencilla",
          "Configuración bancaria, fiscal y legal más sencilla",
          "Más facilidad para cuidar familia en México",
          "Puedes preparar antes planes de salud y retiro",
        ],
      },
      {
        range: "55-64 años",
        items: [
          "Planificación previa al retiro más sencilla",
          "Puedes pasar periodos largos en México sin límites de turista o residencia",
          "Más facilidad para comprar, renovar o establecerte en una propiedad",
          "Más facilidad para probar vivir en México antes del retiro",
          "Posible acceso a programas para adultos mayores desde alrededor de los 60, según requisitos",
        ],
      },
      {
        range: "65+ años",
        items: [
          "Puedes retirarte en México como ciudadano/a mexicano/a",
          "Residencia de largo plazo sin preocupaciones de visa",
          "Acceso más fácil a programas mexicanos para adultos mayores si calificas",
          "Posible pensión federal para adultos mayores si vives en México y cumples requisitos",
          "Puedes combinar residencia en México con Seguro Social de EE. UU., si calificas",
          "Planificación de retiro transfronterizo más segura",
        ],
      },
    ],
    primaryCta: "Comparar costos de DNExpress",
    backCta: "Volver a beneficios",
  },
  pt: {
    title: "Benefícios da dupla cidadania mexicana",
    subtitle:
      "Comece pelos direitos que importam em qualquer idade e depois veja como eles podem ajudar em cada fase da vida.",
    overallTitle: "Maiores benefícios gerais",
    overallBenefits: [
      "Viver no México sem precisar de visto",
      "Trabalhar no México sem permissão de trabalho",
      "Votar em eleições mexicanas",
      "Obter identidade e passaporte mexicanos",
      "Ter propriedade com mais facilidade",
      "Transmitir nacionalidade aos filhos",
      "Aposentar-se no México com mais segurança",
      "Manter a cidadania dos EUA enquanto ganha direitos mexicanos",
    ],
    ageTitle: "Benefícios por faixa etária",
    ageGroups: [
      {
        range: "0-17 anos",
        items: [
          "Registro mexicano de nascimento",
          "Passaporte mexicano",
          "CURP / registro oficial de identidade mexicana",
          "Acesso futuro ao México mais fácil",
          "Mais facilidade para viver com família no México",
          "Mantém opções abertas para escola, trabalho, propriedade e herança no futuro",
        ],
      },
      {
        range: "18-24 anos",
        items: [
          "Elegibilidade para identidade eleitoral INE",
          "Direito de votar em eleições mexicanas",
          "Pode trabalhar no México sem visto de trabalho",
          "Mais facilidade para alugar, abrir conta, estudar e acessar serviços locais",
          "Mais facilidade para construir uma vida nos EUA ou no México",
        ],
      },
      {
        range: "25-39 anos",
        items: [
          "Trabalhar no México sem patrocínio migratório",
          "Abrir um negócio com mais facilidade",
          "Comprar propriedade com mais facilidade",
          "Possuir terra diretamente em vez de usar estruturas para estrangeiros em zonas restritas",
          "Transmitir nacionalidade mexicana aos filhos se forem elegíveis",
          "Relocação familiar mais fácil",
        ],
      },
      {
        range: "40-54 anos",
        items: [
          "Mais flexibilidade para mudar-se ou viver meio período no México",
          "Planejamento patrimonial e de propriedade mais fácil",
          "Configuração bancária, fiscal e legal mais fácil",
          "Mais facilidade para cuidar de família no México",
          "Pode construir planos de saúde e aposentadoria mais cedo",
        ],
      },
      {
        range: "55-64 anos",
        items: [
          "Planejamento pré-aposentadoria mais fácil",
          "Pode passar longos períodos no México sem limites de turista ou residência",
          "Mais facilidade para comprar, reformar ou estabelecer-se em uma propriedade",
          "Mais facilidade para testar a vida no México antes da aposentadoria",
          "Possível acesso a programas para idosos a partir de cerca de 60 anos, conforme requisitos",
        ],
      },
      {
        range: "65+ anos",
        items: [
          "Pode aposentar-se no México como cidadão mexicano",
          "Residência de longo prazo sem preocupação com visto",
          "Acesso mais fácil a programas mexicanos para idosos se elegível",
          "Possível pensão federal para idosos se morar no México e cumprir requisitos",
          "Pode combinar residência no México com Social Security dos EUA, se elegível",
          "Planejamento de aposentadoria transfronteiriça mais seguro",
        ],
      },
    ],
    primaryCta: "Comparar custos do DNExpress",
    backCta: "Voltar aos benefícios",
  },
  it: {
    title: "Benefici della doppia cittadinanza messicana",
    subtitle:
      "Parti dai diritti utili a qualsiasi eta, poi vedi come possono contare nelle diverse fasi della vita.",
    overallTitle: "Benefici generali principali",
    overallBenefits: [
      "Vivere in Messico senza bisogno di visto",
      "Lavorare in Messico senza permesso di lavoro",
      "Votare nelle elezioni messicane",
      "Ottenere ID e passaporto messicani",
      "Possedere beni immobili con piu facilita",
      "Trasmettere la nazionalita ai figli",
      "Andare in pensione in Messico con piu sicurezza",
      "Mantenere la cittadinanza statunitense ottenendo diritti messicani",
    ],
    ageTitle: "Benefici per fascia d'eta",
    ageGroups: [
      {
        range: "0-17 anni",
        items: [
          "Registrazione messicana della nascita",
          "Passaporto messicano",
          "CURP / registro ufficiale di identita messicana",
          "Accesso futuro al Messico piu semplice",
          "Piu facile vivere con la famiglia in Messico",
          "Mantiene aperte opzioni future per scuola, lavoro, proprieta ed eredita",
        ],
      },
      {
        range: "18-24 anni",
        items: [
          "Idoneita alla tessera elettorale INE",
          "Diritto di voto nelle elezioni messicane",
          "Possibilita di lavorare in Messico senza visto di lavoro",
          "Piu facile affittare, aprire conti, studiare e accedere a servizi locali",
          "Piu facile costruire una vita negli Stati Uniti o in Messico",
        ],
      },
      {
        range: "25-39 anni",
        items: [
          "Lavorare in Messico senza sponsorizzazione migratoria",
          "Avviare un'attivita con piu facilita",
          "Comprare immobili con piu facilita",
          "Possedere terra direttamente invece di usare strutture per stranieri nelle zone riservate",
          "Trasmettere la nazionalita messicana ai figli se idonei",
          "Ricollocazione familiare piu semplice",
        ],
      },
      {
        range: "40-54 anni",
        items: [
          "Maggiore flessibilita per trasferirsi o vivere part-time in Messico",
          "Pianificazione patrimoniale e immobiliare piu semplice",
          "Impostazione bancaria, fiscale e legale piu semplice",
          "Piu facile prendersi cura della famiglia in Messico",
          "Possibilita di preparare prima piani sanitari e pensionistici",
        ],
      },
      {
        range: "55-64 anni",
        items: [
          "Pianificazione pre-pensionamento piu semplice",
          "Possibilita di restare a lungo in Messico senza limiti turistici o di residenza",
          "Piu facile comprare, ristrutturare o stabilirsi in una proprieta",
          "Piu facile provare la vita in Messico prima della pensione",
          "Possibile accesso a programmi per anziani da circa 60 anni, secondo i requisiti",
        ],
      },
      {
        range: "65+ anni",
        items: [
          "Possibilita di andare in pensione in Messico come cittadino messicano",
          "Residenza a lungo termine senza problemi di visto",
          "Accesso piu facile a programmi messicani per anziani se idonei",
          "Possibile pensione federale per anziani se vivi in Messico e soddisfi i requisiti",
          "Possibilita di combinare residenza in Messico e Social Security USA, se idoneo",
          "Pianificazione pensionistica transfrontaliera piu sicura",
        ],
      },
    ],
    primaryCta: "Confronta i costi DNExpress",
    backCta: "Torna ai benefici",
  },
  fr: {
    title: "Avantages de la double citoyennete mexicaine",
    subtitle:
      "Commence par les droits utiles a tout age, puis vois comment ils peuvent compter a chaque etape de la vie.",
    overallTitle: "Plus grands avantages generaux",
    overallBenefits: [
      "Vivre au Mexique sans avoir besoin de visa",
      "Travailler au Mexique sans permis de travail",
      "Voter aux elections mexicaines",
      "Obtenir une piece d'identite et un passeport mexicains",
      "Posseder des biens plus facilement",
      "Transmettre la nationalite aux enfants",
      "Prendre sa retraite au Mexique avec plus de securite",
      "Conserver la citoyennete americaine tout en obtenant des droits mexicains",
    ],
    ageTitle: "Avantages par groupe d'age",
    ageGroups: [
      {
        range: "0-17 ans",
        items: [
          "Enregistrement de naissance mexicain",
          "Passeport mexicain",
          "CURP / dossier officiel d'identite mexicaine",
          "Acces futur au Mexique plus facile",
          "Plus facile de vivre avec la famille au Mexique",
          "Garde des options ouvertes pour l'ecole, le travail, la propriete et l'heritage",
        ],
      },
      {
        range: "18-24 ans",
        items: [
          "Eligibilite a la carte electorale INE",
          "Droit de vote aux elections mexicaines",
          "Possibilite de travailler au Mexique sans visa de travail",
          "Plus facile de louer, ouvrir un compte, etudier et obtenir des services locaux",
          "Plus facile de construire une vie aux Etats-Unis ou au Mexique",
        ],
      },
      {
        range: "25-39 ans",
        items: [
          "Travailler au Mexique sans parrainage migratoire",
          "Creer une entreprise plus facilement",
          "Acheter un bien plus facilement",
          "Posseder directement un terrain au lieu d'utiliser des structures pour etrangers en zones restreintes",
          "Transmettre la nationalite mexicaine aux enfants s'ils sont admissibles",
          "Relocalisation familiale plus facile",
        ],
      },
      {
        range: "40-54 ans",
        items: [
          "Plus de flexibilite pour demenager ou vivre a temps partiel au Mexique",
          "Planification patrimoniale et immobiliere plus facile",
          "Mise en place bancaire, fiscale et juridique plus facile",
          "Plus facile de s'occuper de la famille au Mexique",
          "Possibilite de preparer plus tot les plans de sante et de retraite",
        ],
      },
      {
        range: "55-64 ans",
        items: [
          "Planification pre-retraite plus facile",
          "Possibilite de passer de longues periodes au Mexique sans limites touristiques ou de residence",
          "Plus facile d'acheter, renover ou s'installer dans un bien",
          "Plus facile de tester la vie au Mexique avant la retraite",
          "Acces possible a des programmes pour personnes agees vers 60 ans, selon les conditions",
        ],
      },
      {
        range: "65+ ans",
        items: [
          "Possibilite de prendre sa retraite au Mexique comme citoyen mexicain",
          "Residence longue duree sans souci de visa",
          "Acces plus facile aux programmes mexicains pour personnes agees si admissible",
          "Pension federale possible pour personnes agees si tu vis au Mexique et remplis les conditions",
          "Possibilite de combiner residence au Mexique et Social Security americaine, si admissible",
          "Planification de retraite transfrontaliere plus solide",
        ],
      },
    ],
    primaryCta: "Comparer les couts DNExpress",
    backCta: "Retour aux avantages",
  },
  ja: {
    title: "メキシコ二重国籍のメリット",
    subtitle:
      "まず年齢を問わず重要な権利を確認し、その後ライフステージごとの意味を見ていきます。",
    overallTitle: "主な全体メリット",
    overallBenefits: [
      "ビザなしでメキシコに住める",
      "就労許可なしでメキシコで働ける",
      "メキシコの選挙で投票できる",
      "メキシコの身分証とパスポートを取得できる",
      "不動産をより取得しやすい",
      "子どもに国籍を引き継げる",
      "メキシコでより安心して退職生活を計画できる",
      "米国市民権を保ちながらメキシコの権利を得られる",
    ],
    ageTitle: "年齢別メリット",
    ageGroups: [
      {
        range: "0-17歳",
        items: [
          "メキシコ出生登録",
          "メキシコ旅券",
          "CURP / 公式のメキシコ身分記録",
          "将来メキシコへアクセスしやすい",
          "メキシコの家族と暮らしやすい",
          "将来の学校、仕事、不動産、相続の選択肢を残せる",
        ],
      },
      {
        range: "18-24歳",
        items: [
          "INE有権者IDの対象になり得る",
          "メキシコ選挙で投票する権利",
          "就労ビザなしでメキシコで働ける",
          "賃貸、銀行、就学、地域サービスの利用がしやすい",
          "米国またはメキシコのどちらでも生活を築きやすい",
        ],
      },
      {
        range: "25-39歳",
        items: [
          "移民スポンサーなしでメキシコで働ける",
          "事業を始めやすい",
          "不動産を買いやすい",
          "制限区域で外国人向けの仕組みを使わず土地を直接所有しやすい",
          "条件を満たせば子どもにメキシコ国籍を引き継げる",
          "家族での移住がしやすい",
        ],
      },
      {
        range: "40-54歳",
        items: [
          "移住またはメキシコでの二拠点生活の柔軟性が増す",
          "不動産と資産計画がしやすい",
          "銀行、税務、法的手続きの準備がしやすい",
          "メキシコにいる家族を支えやすい",
          "医療と退職計画を早めに作りやすい",
        ],
      },
      {
        range: "55-64歳",
        items: [
          "退職前の計画がしやすい",
          "観光・居住制限を気にせず長くメキシコに滞在しやすい",
          "不動産の購入、改修、定住準備がしやすい",
          "退職前にメキシコ生活を試しやすい",
          "要件次第で60歳前後から高齢者向け制度にアクセスできる可能性",
        ],
      },
      {
        range: "65歳以上",
        items: [
          "メキシコ市民としてメキシコで退職生活を送れる",
          "ビザの心配なく長期居住しやすい",
          "条件を満たせばメキシコの高齢者制度を利用しやすい",
          "メキシコ在住で要件を満たす場合、連邦高齢者年金の可能性",
          "条件を満たせば米国Social Securityとメキシコ居住を組み合わせられる",
          "国境をまたぐ退職計画がより安定する",
        ],
      },
    ],
    primaryCta: "DNExpress費用を比較",
    backCta: "メリットに戻る",
  },
  hi: {
    title: "मैक्सिकन दोहरी नागरिकता के लाभ",
    subtitle:
      "पहले वे अधिकार देखें जो हर उम्र में काम आते हैं, फिर उम्र के हिसाब से उनके फायदे देखें।",
    overallTitle: "सबसे बड़े सामान्य लाभ",
    overallBenefits: [
      "वीजा के बिना मेक्सिको में रहना",
      "वर्क परमिट के बिना मेक्सिको में काम करना",
      "मैक्सिकन चुनावों में वोट देना",
      "मैक्सिकन ID और पासपोर्ट पाना",
      "संपत्ति रखना अधिक आसान",
      "बच्चों को राष्ट्रीयता देना",
      "मेक्सिको में अधिक सुरक्षित तरीके से रिटायर होना",
      "अमेरिकी नागरिकता रखते हुए मैक्सिकन अधिकार पाना",
    ],
    ageTitle: "उम्र के हिसाब से लाभ",
    ageGroups: [
      {
        range: "0-17 वर्ष",
        items: [
          "मैक्सिकन जन्म पंजीकरण",
          "मैक्सिकन पासपोर्ट",
          "CURP / आधिकारिक मैक्सिकन पहचान रिकॉर्ड",
          "भविष्य में मेक्सिको तक आसान पहुंच",
          "मेक्सिको में परिवार के साथ रहना आसान",
          "आगे स्कूल, काम, संपत्ति और विरासत के विकल्प खुले रहते हैं",
        ],
      },
      {
        range: "18-24 वर्ष",
        items: [
          "INE मतदाता ID की पात्रता",
          "मैक्सिकन चुनावों में वोट देने का अधिकार",
          "वर्क वीजा के बिना मेक्सिको में काम कर सकते हैं",
          "किराया, बैंकिंग, पढ़ाई और स्थानीय सेवाएं लेना आसान",
          "अमेरिका या मेक्सिको में जीवन बनाना आसान",
        ],
      },
      {
        range: "25-39 वर्ष",
        items: [
          "इमिग्रेशन स्पॉन्सरशिप के बिना मेक्सिको में काम",
          "व्यवसाय शुरू करना आसान",
          "संपत्ति खरीदना आसान",
          "प्रतिबंधित क्षेत्रों में विदेशी संरचनाओं के बजाय जमीन सीधे रखना",
          "पात्र होने पर बच्चों को मैक्सिकन राष्ट्रीयता देना",
          "परिवार के साथ स्थानांतरण आसान",
        ],
      },
      {
        range: "40-54 वर्ष",
        items: [
          "मेक्सिको में स्थानांतरित होने या पार्ट-टाइम रहने की अधिक लचीलापन",
          "संपत्ति और धन योजना आसान",
          "बैंकिंग, टैक्स और कानूनी व्यवस्था आसान",
          "मेक्सिको में परिवार की देखभाल आसान",
          "स्वास्थ्य और रिटायरमेंट योजना पहले से बनाना आसान",
        ],
      },
      {
        range: "55-64 वर्ष",
        items: [
          "प्री-रिटायरमेंट योजना आसान",
          "टूरिस्ट या रेजिडेंसी सीमाओं के बिना लंबे समय तक मेक्सिको में रहना",
          "संपत्ति खरीदना, सुधारना या बसना आसान",
          "रिटायरमेंट से पहले मेक्सिको में रहने को आज़माना आसान",
          "लगभग 60 वर्ष से वरिष्ठ कार्यक्रमों की संभावित पहुंच, आवश्यकताओं पर निर्भर",
        ],
      },
      {
        range: "65+ वर्ष",
        items: [
          "मैक्सिकन नागरिक के रूप में मेक्सिको में रिटायर हो सकते हैं",
          "वीजा चिंता के बिना दीर्घकालिक निवास",
          "पात्र होने पर मैक्सिकन वरिष्ठ कार्यक्रमों तक आसान पहुंच",
          "मेक्सिको में रहने और शर्तें पूरी करने पर संघीय वरिष्ठ पेंशन की संभावना",
          "पात्र होने पर मेक्सिको निवास को अमेरिकी Social Security के साथ जोड़ सकते हैं",
          "अधिक सुरक्षित सीमा-पार रिटायरमेंट योजना",
        ],
      },
    ],
    primaryCta: "DNExpress लागतों की तुलना करें",
    backCta: "लाभों पर वापस जाएं",
  },
  ar: {
    title: "فوائد الجنسية المكسيكية المزدوجة",
    subtitle:
      "ابدأ بالحقوق المهمة في أي عمر، ثم انظر كيف تفيد في مراحل الحياة المختلفة.",
    overallTitle: "أكبر الفوائد العامة",
    overallBenefits: [
      "العيش في المكسيك دون الحاجة إلى تأشيرة",
      "العمل في المكسيك دون تصريح عمل",
      "التصويت في الانتخابات المكسيكية",
      "الحصول على هوية وجواز سفر مكسيكيين",
      "امتلاك العقارات بسهولة أكبر",
      "نقل الجنسية إلى الأطفال",
      "التقاعد في المكسيك بأمان أكبر",
      "الاحتفاظ بالجنسية الأمريكية مع الحصول على حقوق مكسيكية",
    ],
    ageTitle: "الفوائد حسب الفئة العمرية",
    ageGroups: [
      {
        range: "0-17 سنة",
        items: [
          "تسجيل ميلاد مكسيكي",
          "جواز سفر مكسيكي",
          "CURP / سجل هوية مكسيكي رسمي",
          "سهولة الوصول إلى المكسيك مستقبلا",
          "سهولة العيش مع العائلة في المكسيك",
          "إبقاء خيارات الدراسة والعمل والملكية والميراث مفتوحة لاحقا",
        ],
      },
      {
        range: "18-24 سنة",
        items: [
          "الأهلية لهوية الناخب INE",
          "حق التصويت في الانتخابات المكسيكية",
          "إمكانية العمل في المكسيك دون تأشيرة عمل",
          "سهولة الاستئجار والبنوك والدراسة والخدمات المحلية",
          "سهولة بناء حياة في الولايات المتحدة أو المكسيك",
        ],
      },
      {
        range: "25-39 سنة",
        items: [
          "العمل في المكسيك دون كفالة هجرة",
          "بدء عمل تجاري بسهولة أكبر",
          "شراء العقار بسهولة أكبر",
          "امتلاك الأرض مباشرة بدلا من هياكل الأجانب في المناطق المقيدة",
          "نقل الجنسية المكسيكية إلى الأطفال إذا كانوا مؤهلين",
          "انتقال العائلة بسهولة أكبر",
        ],
      },
      {
        range: "40-54 سنة",
        items: [
          "مرونة أكبر للانتقال أو العيش جزئيا في المكسيك",
          "تخطيط أسهل للملكية والثروة",
          "إعداد مصرفي وضريبي وقانوني أسهل",
          "سهولة رعاية العائلة في المكسيك",
          "إمكانية بناء خطط الصحة والتقاعد مبكرا",
        ],
      },
      {
        range: "55-64 سنة",
        items: [
          "تخطيط أسهل لما قبل التقاعد",
          "إمكانية قضاء فترات طويلة في المكسيك دون حدود السائح أو الإقامة",
          "سهولة شراء أو ترميم أو الاستقرار في عقار",
          "سهولة تجربة العيش في المكسيك قبل التقاعد",
          "إمكانية الوصول إلى برامج كبار السن بدءا من حوالي 60 عاما، حسب المتطلبات",
        ],
      },
      {
        range: "65+ سنة",
        items: [
          "إمكانية التقاعد في المكسيك كمواطن مكسيكي",
          "إقامة طويلة الأجل دون قلق التأشيرة",
          "وصول أسهل إلى برامج كبار السن المكسيكية إذا كنت مؤهلا",
          "احتمال معاش اتحادي لكبار السن إذا كنت تعيش في المكسيك وتلبي المتطلبات",
          "إمكانية الجمع بين الإقامة في المكسيك وSocial Security الأمريكي إذا كنت مؤهلا",
          "تخطيط تقاعد عبر الحدود أكثر أمانا",
        ],
      },
    ],
    primaryCta: "قارن تكاليف DNExpress",
    backCta: "العودة إلى الفوائد",
  },
  zh: {
    title: "墨西哥双重国籍的好处",
    subtitle:
      "先看任何年龄都重要的权利，再按人生阶段了解这些权利的实际作用。",
    overallTitle: "最大的整体好处",
    overallBenefits: [
      "无需签证即可在墨西哥居住",
      "无需工作许可即可在墨西哥工作",
      "在墨西哥选举中投票",
      "获得墨西哥身份证件和护照",
      "更容易拥有房产",
      "把国籍传给子女",
      "在墨西哥更安心地退休",
      "保留美国公民身份，同时获得墨西哥权利",
    ],
    ageTitle: "按年龄段的好处",
    ageGroups: [
      {
        range: "0-17岁",
        items: [
          "墨西哥出生登记",
          "墨西哥护照",
          "CURP / 官方墨西哥身份记录",
          "未来更容易进入墨西哥",
          "更容易与家人在墨西哥生活",
          "为以后的学校、工作、房产和继承保留选择",
        ],
      },
      {
        range: "18-24岁",
        items: [
          "有资格取得INE选民身份证",
          "在墨西哥选举中投票的权利",
          "无需工作签证即可在墨西哥工作",
          "更容易租房、开户、学习和使用本地服务",
          "更容易在美国或墨西哥建立生活",
        ],
      },
      {
        range: "25-39岁",
        items: [
          "无需移民担保即可在墨西哥工作",
          "更容易创业",
          "更容易购买房产",
          "在限制区可更直接地拥有土地，而不是使用外国人结构",
          "符合条件时可把墨西哥国籍传给子女",
          "家庭搬迁更容易",
        ],
      },
      {
        range: "40-54岁",
        items: [
          "搬到墨西哥或在墨西哥兼职居住更灵活",
          "房产和财富规划更容易",
          "银行、税务和法律安排更容易",
          "更容易照顾在墨西哥的家人",
          "可以更早建立医疗和退休计划",
        ],
      },
      {
        range: "55-64岁",
        items: [
          "退休前规划更容易",
          "可以在墨西哥长期停留，不受游客或居留限制影响",
          "更容易购买、翻修或安顿房产",
          "退休前更容易试住墨西哥",
          "约60岁起可能可使用老年相关项目，取决于要求",
        ],
      },
      {
        range: "65岁以上",
        items: [
          "可以作为墨西哥公民在墨西哥退休",
          "长期居住无需担心签证",
          "符合条件时更容易使用墨西哥老年项目",
          "若居住在墨西哥并符合要求，可能获得联邦老年金",
          "符合条件时可把墨西哥居住与美国Social Security结合",
          "跨境退休规划更稳妥",
        ],
      },
    ],
    primaryCta: "比较DNExpress费用",
    backCta: "返回好处",
  },
};

const getDualCitizenshipBenefits = (language) =>
  DUAL_CITIZENSHIP_BENEFITS[normalizeSupportLanguage(language)] ||
  DUAL_CITIZENSHIP_BENEFITS.en;

const DNEXPRESS_POSTS = {
  en: {
    title: "Is DNExpress worth it?",
    subtitle:
      "Sometimes - but it depends on whether you are paying for convenience or paying to fix a real document problem.",
    intro: [
      "If you were born in the U.S. to a Mexican parent, the official Mexican birth registration process can often be free or very low cost through a Mexican consulate.",
      "That means a paid service is not automatically necessary. The real question is whether your case is clean, slightly messy, or genuinely complicated.",
    ],
    priceFooter:
      "Prices vary by provider, consulate, and case complexity. Always verify current fees before paying.",
    priceComparison: [
      {
        title: "Official DIY route",
        items: [
          "Birth registration: often free",
          "First Mexican birth certificate: often free",
          "Extra certified copies: usually low cost",
          "Main costs: ordering records, copies, apostilles, translations, corrections if needed",
        ],
      },
      {
        title: "Paid help route",
        items: [
          "Clean-case help: often hundreds of dollars",
          "Record corrections: may cost more",
          "Name changes or Mexico-side registration work can become significantly more expensive",
          "Main value: convenience, review, and fixing difficult records",
        ],
      },
    ],
    cards: [
      {
        tone: "green",
        status: "Green case",
        title: "Probably not worth it",
        body: "You likely do not need full-service help if your documents already line up.",
        examplesTitle: "This usually means:",
        examples: [
          "You have your long-form U.S. birth certificate",
          "Your Mexican parent has their Mexican birth certificate",
          "Names match across documents",
          "Parent information is clear",
          "No adoption, paternity, court order, deceased-parent, or major name issue",
        ],
        bestMove:
          "Best move: Try the official consulate route first. Paid help may only be worth it if you want convenience.",
        priceNote:
          "DIY estimate: very low cost. Paid service estimate: hundreds of dollars. Recommendation: save the money unless you value convenience.",
      },
      {
        tone: "yellow",
        status: "Yellow case",
        title: "Maybe worth a document review",
        body: "You may have a fixable issue, but probably not enough to justify an expensive full-service package yet.",
        examplesTitle: "This usually means:",
        examples: [
          "You only have a short-form birth certificate",
          "You need to order your parent's Mexican birth certificate",
          "A name is slightly different",
          "A parent uses a married name on one document",
          "You need a marriage certificate, apostille, or translation",
          "You are unsure if your documents match exactly",
        ],
        bestMove:
          "Best move: Fix or verify the document issue before booking the consulate appointment. A low-cost review may be useful, but do not pay for a large package until you know the exact blocker.",
        priceNote:
          "DIY estimate: low to moderate. Paid review estimate: possibly worth it. Recommendation: pay for clarity, not for a full package too early.",
      },
      {
        tone: "red",
        status: "Red case",
        title: "Paid help may be worth it",
        body: "This is where a service may actually provide value, but only if they are fixing the specific problem blocking your registration.",
        examplesTitle: "This usually means:",
        examples: [
          "A parent is deceased, absent, or unwilling to appear",
          "The Mexican parent is missing from the birth certificate",
          "The wrong parent information appears on the record",
          "Parents were not married before birth and father participation is required",
          "There is an adoption, paternity, court order, or legal name change issue",
          "Your Mexican parent's record is missing, irregular, or needs correction",
          "The consulate says the case must be handled in Mexico",
        ],
        bestMove:
          "Best move: Do not just pay for citizenship help. Ask exactly what record is wrong, who will fix it, where it will be fixed, and what happens if the consulate rejects it.",
        priceNote:
          "DIY estimate: unpredictable. Paid/legal help estimate: potentially worth it. Recommendation: worth considering only if they solve the actual blocker.",
      },
    ],
    closingTitle: "What are you really paying for?",
    closing:
      "You are not buying Mexican citizenship. If you qualify through a Mexican parent, you may already be Mexican by birth. What you are paying for is help proving it.",
    officialChecklistTitle: "Official document checklist",
    officialChecklistIntro:
      "For a clean U.S.-born child of Mexican parent case, these are the usual documents to verify before booking. Consulates can vary.",
    officialChecklist: [
      "Long-form certified U.S. birth certificate",
      "Mexican parent's certified Mexican birth certificate or Carta de Naturalizacion",
      "Applicant photo ID, or school/medical ID for a minor",
      "Parent IDs",
      "Parents' marriage certificate if relevant",
      "Name-change, divorce, or death records if names changed",
      "Apostille/legalization and translation when records are not U.S., English, or Spanish",
    ],
    primaryCta: "Start my citizenship questionnaire",
    secondaryCta: "Show me the official document checklist",
    secondaryCtaHide: "Hide the official document checklist",
    stickyTakeaway: "Pay for problem-solving, not for citizenship.",
  },
  es: {
    title: "¿Vale la pena DNExpress?",
    subtitle:
      "A veces, pero depende de si pagas por comodidad o por arreglar un problema real de documentos.",
    intro: [
      "Si naciste en EE. UU. de padre o madre mexicana, el registro mexicano de nacimiento suele ser gratis o de muy bajo costo en un consulado mexicano.",
      "Eso significa que un servicio pagado no siempre es necesario. La pregunta real es si tu caso está limpio, algo complicado o verdaderamente enredado.",
    ],
    priceFooter:
      "Los precios varían por proveedor, consulado y complejidad del caso. Verifica tarifas actuales antes de pagar.",
    priceComparison: [
      {
        title: "Ruta oficial por tu cuenta",
        items: [
          "Registro de nacimiento: a menudo gratis",
          "Primera acta mexicana: a menudo gratis",
          "Copias certificadas extra: usualmente bajo costo",
          "Costos principales: pedir registros, copias, apostillas, traducciones o correcciones",
        ],
      },
      {
        title: "Ruta con ayuda pagada",
        items: [
          "Ayuda para caso limpio: a menudo cientos de dólares",
          "Correcciones de actas: pueden costar más",
          "Cambios de nombre o trámites en México pueden ser mucho más caros",
          "Valor principal: comodidad, revisión y resolver documentos difíciles",
        ],
      },
    ],
    cards: [
      {
        tone: "green",
        status: "Caso verde",
        title: "Probablemente no vale la pena",
        body: "Probablemente no necesitas ayuda completa si tus documentos ya coinciden.",
        examplesTitle: "Esto suele significar:",
        examples: [
          "Tienes tu acta de nacimiento larga de EE. UU.",
          "Tu padre o madre mexicana tiene su acta mexicana",
          "Los nombres coinciden entre documentos",
          "La información de los padres está clara",
          "No hay adopción, paternidad, orden judicial, padre fallecido o cambio mayor de nombre",
        ],
        bestMove:
          "Mejor movimiento: prueba primero la ruta oficial del consulado. La ayuda pagada puede valer la pena solo si quieres comodidad.",
        priceNote:
          "Estimado por cuenta propia: costo muy bajo. Servicio pagado: cientos de dólares. Recomendación: ahorra el dinero salvo que valores la comodidad.",
      },
      {
        tone: "yellow",
        status: "Caso amarillo",
        title: "Quizá vale una revisión de documentos",
        body: "Puede haber un problema corregible, pero quizá no justifica todavía un paquete completo caro.",
        examplesTitle: "Esto suele significar:",
        examples: [
          "Solo tienes acta corta",
          "Necesitas pedir el acta mexicana de tu padre o madre",
          "Un nombre cambia ligeramente",
          "Un padre usa apellido de casado/a en un documento",
          "Necesitas acta de matrimonio, apostilla o traducción",
          "No sabes si los documentos coinciden exactamente",
        ],
        bestMove:
          "Mejor movimiento: corrige o verifica el documento antes de agendar. Una revisión de bajo costo puede servir, pero no pagues un paquete grande antes de conocer el bloqueo exacto.",
        priceNote:
          "Estimado por cuenta propia: bajo a moderado. Revisión pagada: quizá útil. Recomendación: paga por claridad, no por un paquete completo demasiado pronto.",
      },
      {
        tone: "red",
        status: "Caso rojo",
        title: "La ayuda pagada puede valer la pena",
        body: "Aquí un servicio puede aportar valor, pero solo si corrige el problema específico que bloquea tu registro.",
        examplesTitle: "Esto suele significar:",
        examples: [
          "Un padre falleció, está ausente o no quiere presentarse",
          "El padre o madre mexicana no aparece en el acta",
          "La información de los padres está mal",
          "Los padres no estaban casados antes del nacimiento y se requiere participación del padre",
          "Hay adopción, paternidad, orden judicial o cambio legal de nombre",
          "El acta del padre o madre mexicana falta, es irregular o necesita corrección",
          "El consulado dice que el caso debe hacerse en México",
        ],
        bestMove:
          "Mejor movimiento: no pagues solo por ayuda de ciudadanía. Pregunta qué registro está mal, quién lo arregla, dónde se arregla y qué pasa si el consulado lo rechaza.",
        priceNote:
          "Estimado por cuenta propia: impredecible. Ayuda pagada/legal: potencialmente útil. Recomendación: considérala solo si resuelve el bloqueo real.",
      },
    ],
    closingTitle: "¿Qué estás pagando realmente?",
    closing:
      "No estás comprando ciudadanía mexicana. Si calificas por padre o madre mexicana, quizá ya eres mexicano/a por nacimiento. Lo que pagas es ayuda para probarlo.",
    officialChecklistTitle: "Lista oficial de documentos",
    officialChecklistIntro:
      "Para un caso limpio de persona nacida en EE. UU. con padre o madre mexicana, estos son los documentos comunes que debes revisar antes de agendar. Cada consulado puede variar.",
    officialChecklist: [
      "Acta de nacimiento larga y certificada de EE. UU.",
      "Acta mexicana certificada del padre/madre mexicano/a o Carta de Naturalización",
      "Identificación del solicitante, o escolar/médica si es menor",
      "Identificaciones de los padres",
      "Acta de matrimonio de los padres si aplica",
      "Registros de cambio de nombre, divorcio o defunción si los nombres cambiaron",
      "Apostilla/legalización y traducción cuando los registros no sean de EE. UU., inglés o español",
    ],
    primaryCta: "Empezar mi cuestionario de ciudadanía",
    secondaryCta: "Mostrar la lista oficial de documentos",
    secondaryCtaHide: "Ocultar la lista oficial de documentos",
    stickyTakeaway: "Paga por resolver problemas, no por ciudadanía.",
  },
  pt: {
    title: "DNExpress vale a pena?",
    subtitle:
      "Às vezes, mas depende se você está pagando por conveniência ou para resolver um problema real de documentos.",
    intro: [
      "Se você nasceu nos EUA com pai ou mãe mexicana, o registro mexicano de nascimento muitas vezes pode ser gratuito ou de baixo custo em um consulado mexicano.",
      "Isso significa que um serviço pago não é automaticamente necessário. A pergunta real é se o seu caso está limpo, um pouco confuso ou realmente complicado.",
    ],
    priceFooter:
      "Preços variam por provedor, consulado e complexidade do caso. Verifique as taxas atuais antes de pagar.",
    priceComparison: [
      {
        title: "Rota oficial por conta própria",
        items: [
          "Registro de nascimento: muitas vezes gratuito",
          "Primeira certidão mexicana: muitas vezes gratuita",
          "Cópias certificadas extras: geralmente baixo custo",
          "Custos principais: registros, cópias, apostilas, traduções ou correções",
        ],
      },
      {
        title: "Rota com ajuda paga",
        items: [
          "Ajuda para caso limpo: muitas vezes centenas de dólares",
          "Correções de registro podem custar mais",
          "Mudanças de nome ou trabalho registral no México podem ficar bem mais caros",
          "Valor principal: conveniência, revisão e solução de registros difíceis",
        ],
      },
    ],
    cards: [
      {
        tone: "green",
        status: "Caso verde",
        title: "Provavelmente não vale a pena",
        body: "Você provavelmente não precisa de ajuda completa se seus documentos já batem.",
        examplesTitle: "Isso geralmente significa:",
        examples: [
          "Você tem sua certidão longa dos EUA",
          "Seu pai ou mãe mexicana tem a certidão mexicana",
          "Os nomes batem entre documentos",
          "As informações dos pais estão claras",
          "Não há adoção, paternidade, ordem judicial, pai falecido ou grande problema de nome",
        ],
        bestMove:
          "Melhor passo: tente primeiro a rota oficial do consulado. Ajuda paga pode valer apenas pela conveniência.",
        priceNote:
          "Estimativa por conta própria: custo muito baixo. Serviço pago: centenas de dólares. Recomendação: economize salvo se a conveniência valer para você.",
      },
      {
        tone: "yellow",
        status: "Caso amarelo",
        title: "Talvez valha uma revisão",
        body: "Pode haver um problema corrigível, mas talvez ainda não justifique um pacote completo caro.",
        examplesTitle: "Isso geralmente significa:",
        examples: [
          "Você só tem certidão curta",
          "Precisa pedir a certidão mexicana do pai ou mãe",
          "Um nome tem pequena diferença",
          "Um pai usa nome de casado em um documento",
          "Precisa de certidão de casamento, apostila ou tradução",
          "Você não sabe se os documentos batem exatamente",
        ],
        bestMove:
          "Melhor passo: corrija ou verifique o documento antes de marcar. Uma revisão barata pode ajudar, mas não pague um pacote grande antes de saber o bloqueio exato.",
        priceNote:
          "Estimativa por conta própria: baixa a moderada. Revisão paga: pode valer. Recomendação: pague por clareza, não por um pacote completo cedo demais.",
      },
      {
        tone: "red",
        status: "Caso vermelho",
        title: "Ajuda paga pode valer a pena",
        body: "Um serviço pode ter valor se resolver o problema específico que bloqueia seu registro.",
        examplesTitle: "Isso geralmente significa:",
        examples: [
          "Um pai faleceu, está ausente ou não quer comparecer",
          "O pai ou mãe mexicana não aparece na certidão",
          "Informações dos pais estão erradas",
          "Os pais não eram casados antes do nascimento e a participação do pai é exigida",
          "Há adoção, paternidade, ordem judicial ou mudança legal de nome",
          "O registro do pai ou mãe mexicana falta, é irregular ou precisa correção",
          "O consulado diz que o caso deve ser tratado no México",
        ],
        bestMove:
          "Melhor passo: não pague apenas por ajuda de cidadania. Pergunte qual registro está errado, quem corrigirá, onde será corrigido e o que acontece se o consulado rejeitar.",
        priceNote:
          "Estimativa por conta própria: imprevisível. Ajuda paga/legal: potencialmente útil. Recomendação: considere apenas se resolver o bloqueio real.",
      },
    ],
    closingTitle: "Pelo que você está pagando?",
    closing:
      "Você não está comprando cidadania mexicana. Se você se qualifica por pai ou mãe mexicana, talvez já seja mexicano por nascimento. O que se paga é ajuda para provar isso.",
    officialChecklistTitle: "Checklist oficial de documentos",
    officialChecklistIntro:
      "Para um caso limpo de pessoa nascida nos EUA com pai ou mãe mexicana, estes são documentos comuns para verificar antes de marcar. Consulados podem variar.",
    officialChecklist: [
      "Certidão longa e certificada dos EUA",
      "Certidão mexicana certificada do pai/mãe mexicano ou Carta de Naturalização",
      "Documento com foto do solicitante, ou escolar/médico para menor",
      "Documentos dos pais",
      "Certidão de casamento dos pais se aplicável",
      "Registros de mudança de nome, divórcio ou óbito se nomes mudaram",
      "Apostila/legalização e tradução quando os registros não forem dos EUA, inglês ou espanhol",
    ],
    primaryCta: "Começar meu questionário de cidadania",
    secondaryCta: "Mostrar o checklist oficial de documentos",
    secondaryCtaHide: "Ocultar o checklist oficial de documentos",
    stickyTakeaway: "Pague por solução de problemas, não por cidadania.",
  },
  it: {
    title: "DNExpress vale la pena?",
    subtitle:
      "A volte, ma dipende se stai pagando per comodità o per risolvere un vero problema documentale.",
    intro: [
      "Se sei nato/a negli Stati Uniti da un genitore messicano, la registrazione messicana della nascita può spesso essere gratuita o a basso costo tramite un consolato messicano.",
      "Quindi un servizio a pagamento non è automaticamente necessario. La vera domanda è se il tuo caso è pulito, un po' complesso o davvero complicato.",
    ],
    priceFooter:
      "I prezzi variano per fornitore, consolato e complessità del caso. Verifica sempre le tariffe attuali prima di pagare.",
    priceComparison: [
      {
        title: "Percorso ufficiale fai-da-te",
        items: [
          "Registrazione della nascita: spesso gratuita",
          "Prima acta messicana: spesso gratuita",
          "Copie certificate extra: di solito a basso costo",
          "Costi principali: registri, copie, apostille, traduzioni o correzioni",
        ],
      },
      {
        title: "Percorso con aiuto pagato",
        items: [
          "Aiuto per caso pulito: spesso centinaia di dollari",
          "Correzioni dei registri: possono costare di più",
          "Cambi di nome o lavoro registrale in Messico possono diventare molto più costosi",
          "Valore principale: comodità, revisione e soluzione di registri difficili",
        ],
      },
    ],
    cards: [
      {
        tone: "green",
        status: "Caso verde",
        title: "Probabilmente non vale la pena",
        body: "Probabilmente non hai bisogno di assistenza completa se i documenti coincidono già.",
        examplesTitle: "Di solito significa:",
        examples: [
          "Hai il certificato di nascita statunitense in formato lungo",
          "Il genitore messicano ha l'acta messicana",
          "I nomi coincidono tra documenti",
          "Le informazioni sui genitori sono chiare",
          "Nessuna adozione, paternità, ordine del tribunale, genitore deceduto o grande problema di nome",
        ],
        bestMove:
          "Mossa migliore: prova prima la via ufficiale del consolato. L'aiuto pagato può valere solo per comodità.",
        priceNote:
          "Stima fai-da-te: costo molto basso. Servizio pagato: centinaia di dollari. Raccomandazione: risparmia, salvo se la comodità conta molto.",
      },
      {
        tone: "yellow",
        status: "Caso giallo",
        title: "Forse vale una revisione documenti",
        body: "Potresti avere un problema risolvibile, ma non abbastanza per giustificare subito un pacchetto completo costoso.",
        examplesTitle: "Di solito significa:",
        examples: [
          "Hai solo un certificato breve",
          "Devi ordinare l'acta messicana del genitore",
          "Un nome è leggermente diverso",
          "Un genitore usa un cognome da sposato/a in un documento",
          "Serve certificato di matrimonio, apostille o traduzione",
          "Non sai se i documenti coincidono esattamente",
        ],
        bestMove:
          "Mossa migliore: verifica o correggi il problema prima dell'appuntamento. Una revisione a basso costo può aiutare, ma non pagare un grande pacchetto prima di sapere il blocco esatto.",
        priceNote:
          "Stima fai-da-te: bassa o moderata. Revisione pagata: forse utile. Raccomandazione: paga per chiarezza, non troppo presto per un pacchetto completo.",
      },
      {
        tone: "red",
        status: "Caso rosso",
        title: "L'aiuto pagato può valere",
        body: "Un servizio può avere valore se risolve il problema specifico che blocca la registrazione.",
        examplesTitle: "Di solito significa:",
        examples: [
          "Un genitore è deceduto, assente o non disposto a comparire",
          "Il genitore messicano manca dal certificato",
          "Le informazioni sui genitori sono errate",
          "I genitori non erano sposati prima della nascita e serve partecipazione del padre",
          "C'è adozione, paternità, ordine del tribunale o cambio legale di nome",
          "Il registro del genitore messicano manca, è irregolare o va corretto",
          "Il consolato dice che il caso va gestito in Messico",
        ],
        bestMove:
          "Mossa migliore: non pagare genericamente per aiuto di cittadinanza. Chiedi quale registro è sbagliato, chi lo corregge, dove e cosa succede se il consolato rifiuta.",
        priceNote:
          "Stima fai-da-te: imprevedibile. Aiuto pagato/legale: potenzialmente utile. Raccomandazione: valuta solo se risolve il blocco reale.",
      },
    ],
    closingTitle: "Per cosa stai pagando davvero?",
    closing:
      "Non stai comprando cittadinanza messicana. Se ti qualifichi tramite un genitore messicano, potresti essere già messicano/a per nascita. Paghi aiuto per provarlo.",
    officialChecklistTitle: "Checklist ufficiale dei documenti",
    officialChecklistIntro:
      "Per un caso pulito di persona nata negli USA da genitore messicano, questi sono documenti comuni da verificare prima di prenotare. I consolati possono variare.",
    officialChecklist: [
      "Certificato di nascita USA lungo e certificato",
      "Acta messicana certificata del genitore messicano o Carta di Naturalizzazione",
      "Documento d'identità del richiedente, o scolastico/medico per minore",
      "Documenti dei genitori",
      "Certificato di matrimonio dei genitori se rilevante",
      "Documenti di cambio nome, divorzio o morte se i nomi sono cambiati",
      "Apostille/legalizzazione e traduzione se i registri non sono USA, inglesi o spagnoli",
    ],
    primaryCta: "Inizia il questionario di cittadinanza",
    secondaryCta: "Mostra la checklist ufficiale",
    secondaryCtaHide: "Nascondi la checklist ufficiale",
    stickyTakeaway: "Paga per risolvere problemi, non per cittadinanza.",
  },
  fr: {
    title: "DNExpress vaut-il le coup?",
    subtitle:
      "Parfois, mais cela dépend si vous payez pour la commodité ou pour corriger un vrai problème de documents.",
    intro: [
      "Si vous êtes né/e aux États-Unis d'un parent mexicain, l'enregistrement mexicain de naissance peut souvent être gratuit ou peu coûteux via un consulat mexicain.",
      "Un service payant n'est donc pas automatiquement nécessaire. La vraie question est de savoir si votre dossier est clair, un peu compliqué ou vraiment complexe.",
    ],
    priceFooter:
      "Les prix varient selon le prestataire, le consulat et la complexité du dossier. Vérifiez toujours les frais actuels avant de payer.",
    priceComparison: [
      {
        title: "Voie officielle par soi-même",
        items: [
          "Enregistrement de naissance: souvent gratuit",
          "Premier acte mexicain: souvent gratuit",
          "Copies certifiées supplémentaires: généralement peu coûteuses",
          "Principaux coûts: dossiers, copies, apostilles, traductions ou corrections",
        ],
      },
      {
        title: "Voie avec aide payante",
        items: [
          "Aide pour dossier simple: souvent plusieurs centaines de dollars",
          "Corrections d'actes: peuvent coûter plus cher",
          "Changements de nom ou démarches au Mexique peuvent devenir bien plus chers",
          "Valeur principale: commodité, revue et résolution de dossiers difficiles",
        ],
      },
    ],
    cards: [
      {
        tone: "green",
        status: "Cas vert",
        title: "Probablement pas nécessaire",
        body: "Vous n'avez probablement pas besoin d'un service complet si vos documents correspondent déjà.",
        examplesTitle: "Cela signifie souvent:",
        examples: [
          "Vous avez l'acte de naissance américain long-form certifié",
          "Votre parent mexicain a son acte de naissance mexicain",
          "Les noms correspondent entre les documents",
          "Les informations parentales sont claires",
          "Pas d'adoption, paternité, décision judiciaire, parent décédé ou problème majeur de nom",
        ],
        bestMove:
          "Meilleur choix: essayez d'abord la voie officielle du consulat. L'aide payante vaut surtout si vous voulez de la commodité.",
        priceNote:
          "Estimation par soi-même: coût très faible. Service payant: centaines de dollars. Recommandation: économisez sauf si la commodité vaut ce prix.",
      },
      {
        tone: "yellow",
        status: "Cas jaune",
        title: "Une revue documentaire peut aider",
        body: "Vous avez peut-être un problème corrigeable, mais pas forcément assez pour justifier un grand forfait coûteux.",
        examplesTitle: "Cela signifie souvent:",
        examples: [
          "Vous n'avez qu'un acte court",
          "Vous devez obtenir l'acte mexicain du parent",
          "Un nom diffère légèrement",
          "Un parent utilise un nom marital sur un document",
          "Il faut un acte de mariage, une apostille ou une traduction",
          "Vous ne savez pas si les documents correspondent exactement",
        ],
        bestMove:
          "Meilleur choix: corrigez ou vérifiez le problème avant le rendez-vous. Une revue peu coûteuse peut aider, mais ne payez pas un gros forfait avant de connaître le blocage exact.",
        priceNote:
          "Estimation par soi-même: faible à modérée. Revue payante: possiblement utile. Recommandation: payez pour la clarté, pas trop tôt pour un forfait complet.",
      },
      {
        tone: "red",
        status: "Cas rouge",
        title: "L'aide payante peut valoir le coup",
        body: "Un service peut avoir de la valeur s'il corrige le problème spécifique qui bloque votre enregistrement.",
        examplesTitle: "Cela signifie souvent:",
        examples: [
          "Un parent est décédé, absent ou refuse de comparaître",
          "Le parent mexicain manque sur l'acte",
          "Les informations parentales sont incorrectes",
          "Les parents n'étaient pas mariés avant la naissance et la participation du père est exigée",
          "Il y a adoption, paternité, décision judiciaire ou changement légal de nom",
          "Le dossier du parent mexicain manque, est irrégulier ou doit être corrigé",
          "Le consulat dit que le dossier doit être traité au Mexique",
        ],
        bestMove:
          "Meilleur choix: ne payez pas simplement pour de l'aide citoyenneté. Demandez quel acte est erroné, qui le corrigera, où, et ce qui se passe si le consulat refuse.",
        priceNote:
          "Estimation par soi-même: imprévisible. Aide payante/juridique: potentiellement utile. Recommandation: seulement si cela résout le vrai blocage.",
      },
    ],
    closingTitle: "Que payez-vous vraiment?",
    closing:
      "Vous n'achetez pas la citoyenneté mexicaine. Si vous êtes admissible par un parent mexicain, vous êtes peut-être déjà mexicain/e de naissance. Vous payez de l'aide pour le prouver.",
    officialChecklistTitle: "Liste officielle de documents",
    officialChecklistIntro:
      "Pour un dossier simple né aux États-Unis avec parent mexicain, voici les documents habituels à vérifier avant le rendez-vous. Les consulats peuvent varier.",
    officialChecklist: [
      "Acte de naissance américain long-form certifié",
      "Acte mexicain certifié du parent mexicain ou Carta de Naturalizacion",
      "Pièce d'identité du demandeur, ou scolaire/médicale pour mineur",
      "Pièces d'identité des parents",
      "Acte de mariage des parents si pertinent",
      "Documents de changement de nom, divorce ou décès si les noms ont changé",
      "Apostille/légalisation et traduction si les dossiers ne sont pas américains, anglais ou espagnols",
    ],
    primaryCta: "Commencer mon questionnaire de citoyenneté",
    secondaryCta: "Afficher la liste officielle",
    secondaryCtaHide: "Masquer la liste officielle",
    stickyTakeaway: "Payez pour résoudre un problème, pas pour la citoyenneté.",
  },
  ja: {
    title: "DNExpress は使う価値がありますか？",
    subtitle:
      "場合によります。便利さに払うのか、実際の書類問題を直すために払うのかで変わります。",
    intro: [
      "米国生まれで親の一方がメキシコ人の場合、メキシコ領事館での出生登録は無料または低額で済むことがあります。",
      "そのため有料サービスが必ず必要とは限りません。重要なのは、書類がきれいか、少し問題があるか、本当に複雑かです。",
    ],
    priceFooter:
      "料金は業者、領事館、案件の複雑さで変わります。支払う前に最新料金を確認してください。",
    priceComparison: [
      {
        title: "公式の自分で行うルート",
        items: [
          "出生登録: 無料の場合が多い",
          "最初のメキシコ出生証明: 無料の場合が多い",
          "追加認証コピー: 通常は低額",
          "主な費用: 記録取得、コピー、アポスティーユ、翻訳、訂正",
        ],
      },
      {
        title: "有料サポートのルート",
        items: [
          "きれいな案件の支援: 数百ドルになることが多い",
          "記録訂正はさらに高くなることがある",
          "氏名変更やメキシコ側の登録作業は高額化しやすい",
          "主な価値: 便利さ、確認、難しい記録問題の解決",
        ],
      },
    ],
    cards: [
      {
        tone: "green",
        status: "グリーン案件",
        title: "たぶん不要",
        body: "書類がすでにそろって一致しているなら、フルサービスは不要な可能性が高いです。",
        examplesTitle: "通常は次の状態です:",
        examples: [
          "長形式の米国出生証明がある",
          "メキシコ人の親のメキシコ出生証明がある",
          "書類間で名前が一致している",
          "親情報が明確",
          "養子、父子関係、裁判所命令、死亡した親、大きな氏名問題がない",
        ],
        bestMove:
          "最善策: まず公式の領事館ルートを試す。有料支援は便利さを買う場合のみ価値があります。",
        priceNote:
          "自分で行う場合の目安: とても低額。有料サービス: 数百ドル。推奨: 便利さに価値を感じない限り節約。",
      },
      {
        tone: "yellow",
        status: "イエロー案件",
        title: "書類レビューは役立つかも",
        body: "修正可能な問題かもしれませんが、高額なフルパッケージを早く買うほどではない可能性があります。",
        examplesTitle: "通常は次の状態です:",
        examples: [
          "短形式の出生証明しかない",
          "親のメキシコ出生証明を取得する必要がある",
          "名前に小さな違いがある",
          "一方の書類で婚姻後の姓を使っている",
          "婚姻証明、アポスティーユ、翻訳が必要",
          "書類が完全に一致するか不明",
        ],
        bestMove:
          "最善策: 予約前に問題を確認または修正する。低額レビューは有用ですが、正確な障害が分かる前に大きなパッケージを買わないでください。",
        priceNote:
          "自分で行う場合の目安: 低から中程度。有料レビュー: 価値ありの場合あり。推奨: 早すぎるフルパッケージではなく明確さに払う。",
      },
      {
        tone: "red",
        status: "レッド案件",
        title: "有料支援が価値を持つ場合",
        body: "登録を妨げている具体的な問題を解決するなら、サービスに価値があるかもしれません。",
        examplesTitle: "通常は次の状態です:",
        examples: [
          "親が死亡、所在不明、または協力しない",
          "メキシコ人の親が出生証明に載っていない",
          "親情報が間違っている",
          "出生前に両親が結婚しておらず父の参加が必要",
          "養子、父子関係、裁判所命令、法的氏名変更がある",
          "メキシコ人の親の記録がない、不規則、または訂正が必要",
          "領事館がメキシコで処理すべきと言っている",
        ],
        bestMove:
          "最善策: 単なる国籍支援に払わないでください。どの記録が悪いのか、誰がどこで直すのか、領事館が拒否したらどうなるのかを確認してください。",
        priceNote:
          "自分で行う場合の目安: 予測困難。有料/法的支援: 価値がある場合あり。推奨: 実際の障害を解決する場合のみ検討。",
      },
    ],
    closingTitle: "本当に何に払うのか？",
    closing:
      "メキシコ国籍を買うわけではありません。メキシコ人の親を通じて該当するなら、すでに出生によるメキシコ人かもしれません。支払うのは、それを証明する手助けです。",
    officialChecklistTitle: "公式書類チェックリスト",
    officialChecklistIntro:
      "米国生まれで親がメキシコ人のきれいな案件では、予約前に通常これらを確認します。領事館により違います。",
    officialChecklist: [
      "長形式の認証済み米国出生証明",
      "メキシコ人の親の認証済みメキシコ出生証明または帰化証書",
      "申請者の写真付きID、未成年なら学校/医療ID",
      "親のID",
      "必要な場合は両親の婚姻証明",
      "名前が変わった場合は氏名変更、離婚、死亡記録",
      "米国・英語・スペイン語以外の記録にはアポスティーユ/認証と翻訳",
    ],
    primaryCta: "国籍質問を始める",
    secondaryCta: "公式書類リストを表示",
    secondaryCtaHide: "公式書類リストを隠す",
    stickyTakeaway: "国籍ではなく、問題解決に払う。",
  },
  hi: {
    title: "क्या DNExpress उपयोगी है?",
    subtitle:
      "कभी-कभी, लेकिन यह इस बात पर निर्भर है कि आप सुविधा के लिए भुगतान कर रहे हैं या असली दस्तावेज़ समस्या ठीक कराने के लिए।",
    intro: [
      "अगर आपका जन्म अमेरिका में मैक्सिकन माता-पिता से हुआ है, तो मैक्सिकन वाणिज्य दूतावास के ज़रिए जन्म पंजीकरण अक्सर मुफ्त या बहुत कम खर्च में हो सकता है।",
      "इसलिए भुगतान वाली सेवा हमेशा जरूरी नहीं है। असली सवाल यह है कि आपका मामला साफ है, थोड़ा उलझा है, या सच में जटिल है।",
    ],
    priceFooter:
      "कीमतें सेवा प्रदाता, वाणिज्य दूतावास और मामले की जटिलता पर निर्भर करती हैं। भुगतान से पहले मौजूदा शुल्क जरूर जांचें।",
    priceComparison: [
      {
        title: "आधिकारिक खुद करने वाला मार्ग",
        items: [
          "जन्म पंजीकरण: अक्सर मुफ्त",
          "पहला मैक्सिकन जन्म प्रमाणपत्र: अक्सर मुफ्त",
          "अतिरिक्त प्रमाणित प्रतियां: आमतौर पर कम लागत",
          "मुख्य खर्च: रिकॉर्ड मंगाना, प्रतियां, अपोस्टिल, अनुवाद या जरूरत पड़ने पर सुधार",
        ],
      },
      {
        title: "भुगतान वाली मदद का मार्ग",
        items: [
          "साफ मामले में मदद: अक्सर सैकड़ों डॉलर",
          "रिकॉर्ड सुधार: अधिक खर्च हो सकता है",
          "नाम बदलाव या मेक्सिको में पंजीकरण का काम काफी महंगा हो सकता है",
          "मुख्य लाभ: सुविधा, समीक्षा और कठिन रिकॉर्ड समस्याओं को ठीक करना",
        ],
      },
    ],
    cards: [
      {
        tone: "green",
        status: "हरा मामला",
        title: "शायद इसकी जरूरत नहीं",
        body: "अगर आपके दस्तावेज़ पहले से मेल खाते हैं, तो पूरी सेवा वाली मदद की जरूरत शायद नहीं है।",
        examplesTitle: "आम तौर पर इसका मतलब है:",
        examples: [
          "आपके पास लंबे प्रारूप वाला प्रमाणित अमेरिकी जन्म प्रमाणपत्र है",
          "आपके मैक्सिकन माता-पिता के पास मैक्सिकन जन्म प्रमाणपत्र है",
          "दस्तावेज़ों में नाम मेल खाते हैं",
          "माता-पिता की जानकारी साफ है",
          "गोद लेने, पितृत्व, अदालत के आदेश, दिवंगत माता-पिता या बड़े नाम-समस्या का मामला नहीं है",
        ],
        bestMove:
          "सबसे अच्छा कदम: पहले आधिकारिक वाणिज्य दूतावास वाला मार्ग आज़माएं। भुगतान वाली मदद सिर्फ सुविधा के लिए उपयोगी हो सकती है।",
        priceNote:
          "खुद करने का अनुमान: बहुत कम लागत। भुगतान वाली सेवा: सैकड़ों डॉलर। सिफारिश: अगर सुविधा जरूरी नहीं है, तो पैसे बचाएं।",
      },
      {
        tone: "yellow",
        status: "पीला मामला",
        title: "दस्तावेज़ समीक्षा उपयोगी हो सकती है",
        body: "समस्या ठीक हो सकती है, लेकिन अभी महंगे पूरी-सेवा पैकेज को सही ठहराने लायक शायद नहीं है।",
        examplesTitle: "आम तौर पर इसका मतलब है:",
        examples: [
          "आपके पास केवल छोटे प्रारूप वाला जन्म प्रमाणपत्र है",
          "आपको माता-पिता का मैक्सिकन जन्म प्रमाणपत्र मंगाना है",
          "नाम में हल्का फर्क है",
          "किसी दस्तावेज़ में शादी के बाद वाला नाम है",
          "विवाह प्रमाणपत्र, अपोस्टिल या अनुवाद चाहिए",
          "आपको भरोसा नहीं है कि दस्तावेज़ बिल्कुल मेल खाते हैं",
        ],
        bestMove:
          "सबसे अच्छा कदम: अपॉइंटमेंट से पहले समस्या की पुष्टि करें या उसे ठीक करें। कम लागत वाली समीक्षा मदद कर सकती है, लेकिन सटीक रुकावट जाने बिना बड़ा पैकेज न खरीदें।",
        priceNote:
          "खुद करने का अनुमान: कम से मध्यम। भुगतान वाली समीक्षा: शायद उपयोगी। सिफारिश: स्पष्टता के लिए भुगतान करें, बहुत जल्दी पूरी सेवा के लिए नहीं।",
      },
      {
        tone: "red",
        status: "लाल मामला",
        title: "भुगतान वाली मदद उपयोगी हो सकती है",
        body: "सेवा तभी सच में मूल्य दे सकती है जब वह पंजीकरण रोक रही खास समस्या को हल करे।",
        examplesTitle: "आम तौर पर इसका मतलब है:",
        examples: [
          "माता-पिता में से कोई दिवंगत, अनुपस्थित या उपस्थित होने को तैयार नहीं है",
          "मैक्सिकन माता-पिता जन्म प्रमाणपत्र में दर्ज नहीं हैं",
          "माता-पिता की जानकारी गलत है",
          "जन्म से पहले माता-पिता विवाहित नहीं थे और पिता की भागीदारी चाहिए",
          "गोद लेने, पितृत्व, अदालत के आदेश या कानूनी नाम बदलाव का मामला है",
          "मैक्सिकन माता-पिता का रिकॉर्ड गायब, अनियमित या सुधार योग्य है",
          "वाणिज्य दूतावास कहता है कि मामला मेक्सिको में संभालना होगा",
        ],
        bestMove:
          "सबसे अच्छा कदम: सिर्फ नागरिकता मदद के नाम पर भुगतान न करें। पूछें कौन सा रिकॉर्ड गलत है, कौन ठीक करेगा, कहाँ ठीक होगा, और वाणिज्य दूतावास ने अस्वीकार किया तो क्या होगा।",
        priceNote:
          "खुद करने का अनुमान: अनिश्चित। भुगतान वाली या कानूनी मदद: उपयोगी हो सकती है। सिफारिश: तभी विचार करें जब वे असली रुकावट हल करें।",
      },
    ],
    closingTitle: "आप असल में किसके लिए भुगतान कर रहे हैं?",
    closing:
      "आप मैक्सिकन नागरिकता नहीं खरीद रहे। अगर आप मैक्सिकन माता-पिता के आधार पर पात्र हैं, तो आप जन्म से ही मैक्सिकन हो सकते हैं। भुगतान केवल इसे साबित करने में मदद के लिए है।",
    officialChecklistTitle: "आधिकारिक दस्तावेज़ सूची",
    officialChecklistIntro:
      "अमेरिका में जन्मे और मैक्सिकन माता-पिता वाले साफ मामले में अपॉइंटमेंट से पहले आम तौर पर ये दस्तावेज़ जांचे जाते हैं। वाणिज्य दूतावासों की जरूरतें अलग हो सकती हैं।",
    officialChecklist: [
      "लंबे प्रारूप वाला प्रमाणित अमेरिकी जन्म प्रमाणपत्र",
      "मैक्सिकन माता-पिता का प्रमाणित मैक्सिकन जन्म प्रमाणपत्र या Carta de Naturalizacion",
      "आवेदक की फोटो पहचान, या नाबालिग के लिए स्कूल/चिकित्सा पहचान",
      "माता-पिता की पहचान",
      "यदि लागू हो तो माता-पिता का विवाह प्रमाणपत्र",
      "नाम बदले हों तो नाम-परिवर्तन, तलाक या मृत्यु रिकॉर्ड",
      "अमेरिका, अंग्रेज़ी या स्पेनिश से अलग रिकॉर्ड के लिए अपोस्टिल/कानूनीकरण और अनुवाद",
    ],
    primaryCta: "मेरी नागरिकता प्रश्नावली शुरू करें",
    secondaryCta: "आधिकारिक दस्तावेज़ सूची दिखाएं",
    secondaryCtaHide: "आधिकारिक दस्तावेज़ सूची छिपाएं",
    stickyTakeaway: "समस्या हल कराने के लिए भुगतान करें, नागरिकता के लिए नहीं।",
  },
  ar: {
    title: "هل يستحق DNExpress الدفع؟",
    subtitle:
      "أحيانا، لكن الأمر يعتمد على ما إذا كنت تدفع مقابل الراحة أو مقابل حل مشكلة حقيقية في الوثائق.",
    intro: [
      "إذا وُلدت في الولايات المتحدة لأب أو أم مكسيكية، فقد يكون تسجيل الميلاد المكسيكي عبر القنصلية مجانيا أو منخفض التكلفة.",
      "لذلك ليست الخدمة المدفوعة ضرورية دائما. السؤال الحقيقي هو هل ملفك نظيف، أم فيه مشكلة بسيطة، أم معقد فعلا.",
    ],
    priceFooter:
      "تختلف الأسعار حسب المزود والقنصلية وتعقيد الحالة. تحقق دائما من الرسوم الحالية قبل الدفع.",
    priceComparison: [
      {
        title: "المسار الرسمي بنفسك",
        items: [
          "تسجيل الميلاد: غالبا مجاني",
          "أول شهادة ميلاد مكسيكية: غالبا مجانية",
          "النسخ المصدقة الإضافية: عادة منخفضة التكلفة",
          "التكاليف الرئيسية: السجلات والنسخ والأبوستيل والترجمات أو التصحيحات",
        ],
      },
      {
        title: "مسار المساعدة المدفوعة",
        items: [
          "مساعدة الحالة النظيفة: غالبا مئات الدولارات",
          "تصحيح السجلات قد يكلف أكثر",
          "تغيير الاسم أو العمل في السجل داخل المكسيك قد يصبح أغلى بكثير",
          "القيمة الرئيسية: الراحة والمراجعة وحل السجلات الصعبة",
        ],
      },
    ],
    cards: [
      {
        tone: "green",
        status: "حالة خضراء",
        title: "غالبا لا يستحق",
        body: "غالبا لا تحتاج إلى خدمة كاملة إذا كانت وثائقك متطابقة بالفعل.",
        examplesTitle: "هذا يعني عادة:",
        examples: [
          "لديك شهادة ميلاد أمريكية طويلة ومعتمدة",
          "والدك/والدتك المكسيكية لديه شهادة ميلاد مكسيكية",
          "الأسماء متطابقة في الوثائق",
          "معلومات الوالدين واضحة",
          "لا توجد مسألة تبن أو أبوة أو أمر محكمة أو والد متوفى أو مشكلة اسم كبيرة",
        ],
        bestMove:
          "أفضل خطوة: جرّب المسار الرسمي في القنصلية أولا. قد تكون المساعدة المدفوعة مفيدة فقط إذا كنت تريد الراحة.",
        priceNote:
          "تقدير القيام بها بنفسك: تكلفة منخفضة جدا. الخدمة المدفوعة: مئات الدولارات. التوصية: وفر المال إلا إذا كانت الراحة مهمة لك.",
      },
      {
        tone: "yellow",
        status: "حالة صفراء",
        title: "قد تستحق مراجعة الوثائق",
        body: "قد تكون لديك مشكلة قابلة للإصلاح، لكنها ربما لا تبرر حزمة كاملة ومكلفة بعد.",
        examplesTitle: "هذا يعني عادة:",
        examples: [
          "لديك فقط شهادة ميلاد مختصرة",
          "تحتاج إلى طلب شهادة ميلاد الوالد المكسيكي",
          "يوجد اختلاف بسيط في الاسم",
          "يستخدم أحد الوالدين اسم الزواج في وثيقة",
          "تحتاج إلى شهادة زواج أو أبوستيل أو ترجمة",
          "لست متأكدا من تطابق الوثائق تماما",
        ],
        bestMove:
          "أفضل خطوة: أصلح أو تحقق من المشكلة قبل الموعد. قد تفيد مراجعة منخفضة التكلفة، لكن لا تدفع لحزمة كبيرة قبل معرفة العائق الدقيق.",
        priceNote:
          "تقدير القيام بها بنفسك: منخفض إلى متوسط. المراجعة المدفوعة: قد تستحق. التوصية: ادفع للوضوح، لا لحزمة كاملة مبكرة.",
      },
      {
        tone: "red",
        status: "حالة حمراء",
        title: "قد تستحق المساعدة المدفوعة",
        body: "قد تقدم الخدمة قيمة إذا كانت تحل المشكلة المحددة التي تمنع التسجيل.",
        examplesTitle: "هذا يعني عادة:",
        examples: [
          "أحد الوالدين متوفى أو غائب أو غير مستعد للحضور",
          "الوالد المكسيكي غير موجود في شهادة الميلاد",
          "معلومات الوالدين خاطئة",
          "لم يكن الوالدان متزوجين قبل الميلاد ومشاركة الأب مطلوبة",
          "توجد مسألة تبن أو أبوة أو أمر محكمة أو تغيير اسم قانوني",
          "سجل الوالد المكسيكي مفقود أو غير منتظم أو يحتاج تصحيحا",
          "القنصلية تقول إن الحالة يجب أن تتم في المكسيك",
        ],
        bestMove:
          "أفضل خطوة: لا تدفع فقط مقابل مساعدة جنسية. اسأل ما السجل الخاطئ، من سيصلحه، أين سيصلح، وماذا يحدث إذا رفضته القنصلية.",
        priceNote:
          "تقدير القيام بها بنفسك: غير متوقع. المساعدة المدفوعة/القانونية: قد تستحق. التوصية: فكر بها فقط إذا حلت العائق الحقيقي.",
      },
    ],
    closingTitle: "مقابل ماذا تدفع فعلا؟",
    closing:
      "أنت لا تشتري الجنسية المكسيكية. إذا كنت مؤهلا عبر والد مكسيكي، فقد تكون مكسيكيا بالميلاد بالفعل. ما تدفعه هو مساعدة لإثبات ذلك.",
    officialChecklistTitle: "قائمة الوثائق الرسمية",
    officialChecklistIntro:
      "في حالة نظيفة لشخص مولود في الولايات المتحدة من والد مكسيكي، هذه وثائق شائعة للتحقق قبل الموعد. قد تختلف القنصليات.",
    officialChecklist: [
      "شهادة ميلاد أمريكية طويلة ومعتمدة",
      "شهادة ميلاد مكسيكية معتمدة للوالد المكسيكي أو Carta de Naturalizacion",
      "هوية مصورة لمقدم الطلب، أو هوية مدرسية/طبية للقاصر",
      "هويات الوالدين",
      "شهادة زواج الوالدين إذا كانت ذات صلة",
      "سجلات تغيير الاسم أو الطلاق أو الوفاة إذا تغيرت الأسماء",
      "أبوستيل/تصديق وترجمة إذا لم تكن السجلات أمريكية أو بالإنجليزية أو الإسبانية",
    ],
    primaryCta: "ابدأ استبيان الجنسية",
    secondaryCta: "أظهر قائمة الوثائق الرسمية",
    secondaryCtaHide: "أخف قائمة الوثائق الرسمية",
    stickyTakeaway: "ادفع لحل المشكلة، لا لشراء الجنسية.",
  },
  zh: {
    title: "DNExpress 值得吗？",
    subtitle:
      "有时候值得，但关键在于你是在为便利付费，还是在为解决真实文件问题付费。",
    intro: [
      "如果你出生在美国，且父母一方是墨西哥人，通过墨西哥领事馆办理墨西哥出生登记通常可以免费或低成本完成。",
      "所以付费服务并不是自动必要。真正的问题是你的文件是否干净、略有问题，还是确实复杂。",
    ],
    priceFooter:
      "价格会因服务商、领事馆和案件复杂度而不同。付款前请务必确认最新费用。",
    priceComparison: [
      {
        title: "官方自办路线",
        items: [
          "出生登记：通常免费",
          "第一份墨西哥出生证明：通常免费",
          "额外认证副本：通常低成本",
          "主要费用：申请记录、副本、海牙认证、翻译或更正",
        ],
      },
      {
        title: "付费帮助路线",
        items: [
          "干净案件帮助：通常数百美元",
          "记录更正：可能更贵",
          "姓名变更或墨西哥境内登记工作可能明显更贵",
          "主要价值：便利、审核和解决困难记录问题",
        ],
      },
    ],
    cards: [
      {
        tone: "green",
        status: "绿色案件",
        title: "可能不值得",
        body: "如果你的文件已经匹配，通常不需要全套付费服务。",
        examplesTitle: "通常意味着：",
        examples: [
          "你有长表认证版美国出生证明",
          "墨西哥父/母有墨西哥出生证明",
          "各文件上的姓名匹配",
          "父母信息清楚",
          "没有收养、亲子关系、法院命令、父母死亡或重大姓名问题",
        ],
        bestMove:
          "最佳做法：先走官方领事馆路线。付费帮助可能只在你重视便利时值得。",
        priceNote:
          "自办估计：成本很低。付费服务：数百美元。建议：除非你愿意为便利付费，否则省下这笔钱。",
      },
      {
        tone: "yellow",
        status: "黄色案件",
        title: "可能值得做文件审核",
        body: "你可能有可修正的问题，但未必需要过早购买昂贵全套服务。",
        examplesTitle: "通常意味着：",
        examples: [
          "你只有短表出生证明",
          "需要申请父/母的墨西哥出生证明",
          "姓名有轻微差异",
          "某份文件使用婚后姓氏",
          "需要婚姻证明、海牙认证或翻译",
          "不确定文件是否完全匹配",
        ],
        bestMove:
          "最佳做法：预约前先确认或修正文件问题。低成本审核可能有用，但在知道具体障碍前不要购买大套餐。",
        priceNote:
          "自办估计：低到中等。付费审核：可能值得。建议：为清晰度付费，不要太早买全套。",
      },
      {
        tone: "red",
        status: "红色案件",
        title: "付费帮助可能值得",
        body: "如果服务能解决阻碍登记的具体问题，它才可能真正有价值。",
        examplesTitle: "通常意味着：",
        examples: [
          "父/母已死亡、缺席或不愿出面",
          "墨西哥父/母未列在出生证明上",
          "父母信息错误",
          "父母出生前未婚且需要父亲参与",
          "存在收养、亲子关系、法院命令或法定姓名变更",
          "墨西哥父/母记录缺失、不规则或需要更正",
          "领事馆说案件必须在墨西哥办理",
        ],
        bestMove:
          "最佳做法：不要只为“国籍帮助”付费。问清楚哪份记录错了、谁来修、在哪里修，以及领事馆拒绝后怎么办。",
        priceNote:
          "自办估计：不可预测。付费/法律帮助：可能值得。建议：只有能解决真实障碍时才考虑。",
      },
    ],
    closingTitle: "你真正支付的是什么？",
    closing:
      "你不是在购买墨西哥国籍。如果你通过墨西哥父/母符合条件，你可能出生时已经是墨西哥人。你支付的是证明这一点的帮助。",
    officialChecklistTitle: "官方文件清单",
    officialChecklistIntro:
      "对于美国出生、父/母为墨西哥人的干净案件，预约前通常需要核对这些文件。各领事馆可能不同。",
    officialChecklist: [
      "长表认证版美国出生证明",
      "墨西哥父/母的认证墨西哥出生证明或 Carta de Naturalizacion",
      "申请人照片身份证，未成年人可用学校/医疗证件",
      "父母身份证件",
      "如相关，父母婚姻证明",
      "如姓名变更，提供姓名变更、离婚或死亡记录",
      "非美国、非英语或非西班牙语记录需海牙认证/合法化和翻译",
    ],
    primaryCta: "开始我的国籍问卷",
    secondaryCta: "显示官方文件清单",
    secondaryCtaHide: "隐藏官方文件清单",
    stickyTakeaway: "为解决问题付费，不是为国籍付费。",
  },
};

const getDNExpressPost = (language) =>
  DNEXPRESS_POSTS[normalizeSupportLanguage(language)] || DNEXPRESS_POSTS.en;

const OptionButton = ({ option, selected, onClick }) => (
  <Button
    type="button"
    variant="outline"
    justifyContent="flex-start"
    alignItems="center"
    minH="44px"
    h="auto"
    whiteSpace="normal"
    textAlign="start"
    borderRadius="8px"
    px={3}
    py={2}
    borderColor={selected ? option.accent || "#0f766e" : "var(--app-border)"}
    bg={
      selected
        ? option.bg || "rgba(15, 118, 110, 0.12)"
        : "var(--app-surface-elevated)"
    }
    color="var(--app-text-primary)"
    boxShadow="none"
    transform="none"
    _hover={{
      bg: selected
        ? option.bg || "rgba(15, 118, 110, 0.16)"
        : "var(--app-surface-muted)",
      borderColor: option.accent || "#0f766e",
    }}
    _active={{
      transform: "none",
      boxShadow: "none",
    }}
    onClick={onClick}
    leftIcon={
      <Box
        as="span"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        w="20px"
        h="20px"
        borderRadius="999px"
        flexShrink={0}
        bg={selected ? option.accent || "#0f766e" : "transparent"}
        border="1px solid"
        borderColor={
          selected ? option.accent || "#0f766e" : "var(--app-border-strong)"
        }
        color="white"
      >
        {selected ? <Icon as={Check} boxSize="13px" /> : null}
      </Box>
    }
  >
    <Box as="span">{option.label}</Box>
  </Button>
);

const SingleChoice = ({
  label,
  value,
  options,
  onChange,
  helper,
  onSelectSound,
}) => (
  <Box>
    <Text
      fontWeight="700"
      color="var(--app-text-primary)"
      mb={2}
      textAlign="start"
    >
      {label}
    </Text>
    {helper ? (
      <Text
        color="var(--app-text-muted)"
        fontSize="sm"
        mb={3}
        textAlign="start"
      >
        {helper}
      </Text>
    ) : null}
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
      {options.map((option) => (
        <OptionButton
          key={option.value}
          option={option}
          selected={value === option.value}
          onClick={() => {
            onSelectSound?.();
            onChange(option.value);
          }}
        />
      ))}
    </SimpleGrid>
  </Box>
);

const MultiChoice = ({
  label,
  values,
  options,
  onChange,
  helper,
  onSelectSound,
}) => {
  const selectedValues = values || [];
  return (
    <Box>
      <Text
        fontWeight="700"
        color="var(--app-text-primary)"
        mb={2}
        textAlign="start"
      >
        {label}
      </Text>
      {helper ? (
        <Text
          color="var(--app-text-muted)"
          fontSize="sm"
          mb={3}
          textAlign="start"
        >
          {helper}
        </Text>
      ) : null}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
        {options.map((option) => {
          const selected = selectedValues.includes(option.value);
          return (
            <OptionButton
              key={option.value}
              option={option}
              selected={selected}
              onClick={() => {
                onSelectSound?.();
                if (option.value === "none") {
                  onChange(selected ? [] : ["none"]);
                  return;
                }
                const withoutNone = selectedValues.filter(
                  (item) => item !== "none",
                );
                onChange(
                  selected
                    ? withoutNone.filter((item) => item !== option.value)
                    : [...withoutNone, option.value],
                );
              }}
            />
          );
        })}
      </SimpleGrid>
    </Box>
  );
};

const TextField = ({ label, value, onChange, placeholder, helper }) => (
  <Box>
    <Text
      fontWeight="700"
      color="var(--app-text-primary)"
      mb={2}
      textAlign="start"
    >
      {label}
    </Text>
    {helper ? (
      <Text
        color="var(--app-text-muted)"
        fontSize="sm"
        mb={3}
        textAlign="start"
      >
        {helper}
      </Text>
    ) : null}
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      bg="var(--app-surface-elevated)"
      borderColor="var(--app-border)"
      color="var(--app-text-primary)"
      _placeholder={{ color: "var(--app-text-muted)" }}
      _focus={{ borderColor: "#0f766e", boxShadow: "0 0 0 1px #0f766e" }}
    />
  </Box>
);

const SupportLanguageFlagSwatch = ({ value }) => {
  const flag =
    SUPPORT_LANGUAGE_FLAG_SWATCHES[value] || SUPPORT_LANGUAGE_FLAG_SWATCHES.en;

  return (
    <Box
      as="span"
      aria-hidden="true"
      display="inline-flex"
      position="relative"
      w="24px"
      h="24px"
      flexShrink={0}
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
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      w="24px"
      h="24px"
      flexShrink={0}
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
  const activeLanguage = normalizeSupportLanguage(language || "en");
  const menuDirection = getLanguageDirection(activeLanguage);
  const topControlProps = getTopControlProps(isLightTheme);
  const langOptions = getSupportLanguageOptions({
    ui: translations,
    uiLang: activeLanguage,
  });
  const selected =
    langOptions.find((option) => option.value === activeLanguage) ||
    langOptions.find((option) => option.value === "en") ||
    langOptions[0];

  return (
    <Box>
      <Menu placement="bottom-start">
        <MenuButton
          as={Button}
          type="button"
          aria-label={`Select language${selected?.label ? `: ${selected.label}` : ""}`}
          size="sm"
          minW="40px"
          w="40px"
          h="40px"
          p={0}
          lineHeight="1"
          rounded="full"
          border="1px solid"
          {...topControlProps}
        >
          <LanguageFlagIcon option={selected} value={activeLanguage} />
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
            onChange={(value) => {
              playSound?.();
              onSelect(normalizeSupportLanguage(value));
            }}
          >
            {langOptions.map((option) => (
              <MenuItemOption
                key={option.value}
                value={option.value}
                bg="transparent"
                _hover={{ bg: APP_SURFACE_MUTED }}
                _checked={{ fontWeight: "bold" }}
                fontSize="sm"
                fontFamily="monospace"
              >
                <HStack spacing={2} justify="flex-start">
                  <LanguageFlagIcon option={option} value={option.value} />
                  <Text
                    color={APP_TEXT_PRIMARY}
                    textAlign={menuDirection === "rtl" ? "right" : "left"}
                    flex="1"
                    sx={{ unicodeBidi: "plaintext" }}
                  >
                    {option.label}
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

const ThemeModeToggle = ({ isLightTheme, onToggle, language }) => {
  const label = translateText(
    isLightTheme ? "Switch to dark mode" : "Switch to light mode",
    language,
  );
  const topControlProps = getTopControlProps(isLightTheme);

  return (
    <IconButton
      type="button"
      aria-label={label}
      title={label}
      onClick={onToggle}
      icon={<Icon as={isLightTheme ? Moon : Sun} boxSize="17px" />}
      size="sm"
      minW="40px"
      h="40px"
      borderRadius="full"
      border="1px solid"
      {...topControlProps}
    />
  );
};

const CitizenshipIntro = ({
  language,
  onCopySecretKey,
  onStartQuestions,
  onSignInWithKey,
  onSelectSound,
  onSubmitSound,
  isStarting,
  isPreparingAccount,
  isSigningIn,
  hasAccountKey,
}) => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [secretInput, setSecretInput] = useState("");

  const submitSignIn = async () => {
    onSubmitSound?.();
    const didSignIn = await onSignInWithKey(secretInput);
    if (didSignIn) {
      setSecretInput("");
      setShowSignIn(false);
    }
  };

  return (
    <Box
      border="1px solid"
      borderColor="var(--app-border)"
      borderRadius="8px"
      bg="var(--app-surface)"
      p={{ base: 5, md: 8 }}
      textAlign="start"
    >
      <Stack spacing={5}>
        <Box
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          w="44px"
          h="44px"
          borderRadius="8px"
          bg="rgba(8, 145, 178, 0.14)"
          color="#0891b2"
        >
          <Icon as={HiOutlineDocumentCheck} boxSize="24px" />
        </Box>
        <Box>
          <Stack spacing={3}>
            <Text
              color="var(--app-text-secondary)"
              fontSize={{ base: "md", md: "lg" }}
            >
              {translateText(
                "Find the right Mexico citizenship path before you book appointments or collect documents.",
                language,
              )}
            </Text>
            <Text color="var(--app-text-muted)" fontSize="sm">
              {translateText(
                "Before you start, save your secret key somewhere safe. It is how you access your account and return to your citizenship answers later. We cannot recover it for you.",
                language,
              )}
            </Text>
          </Stack>
        </Box>

        <Box
          border="1px solid"
          borderColor="var(--app-border)"
          borderRadius="8px"
          bg="var(--app-surface-elevated)"
          p={4}
        >
          <Text color="var(--app-text-primary)" fontWeight="800" mb={1}>
            {isPreparingAccount
              ? translateText("Preparing your key...", language)
              : hasAccountKey
                ? translateText("Account ready", language)
                : translateText("No secret key found", language)}
          </Text>
          <Text color="var(--app-text-muted)" fontSize="sm">
            {isPreparingAccount
              ? translateText(
                  "Before you start, save your secret key somewhere safe. It is how you access your account and return to your citizenship answers later. We cannot recover it for you.",
                  language,
                )
              : hasAccountKey
                ? translateText("This account is ready.", language)
                : translateText(
                    "Creating your key failed. You can still paste an existing key.",
                    language,
                  )}
          </Text>
        </Box>

        <Flex gap={3} direction={{ base: "column", sm: "row" }} align="stretch">
          <Button
            type="button"
            variant="outline"
            borderRadius="8px"
            bg="var(--app-surface-elevated)"
            borderColor="var(--app-border)"
            color="var(--app-text-primary)"
            boxShadow="none"
            transform="none"
            minW={{ base: "100%", sm: "176px" }}
            h="52px"
            leftIcon={<Icon as={Copy} boxSize="16px" />}
            onClick={() => {
              onSubmitSound?.();
              onCopySecretKey();
            }}
            isDisabled={isPreparingAccount}
            _hover={{ bg: "var(--app-surface-muted)" }}
            _active={{ boxShadow: "none", transform: "none" }}
          >
            {translateText("Copy key", language)}
          </Button>
          <Button
            type="button"
            variant="outline"
            borderRadius="8px"
            bg="var(--app-surface-elevated)"
            borderColor="#0f766e"
            color="#0f766e"
            boxShadow="none"
            transform="none"
            onClick={() => {
              onSubmitSound?.();
              onStartQuestions();
            }}
            isLoading={isStarting}
            isDisabled={isPreparingAccount}
            minW={{ base: "100%", sm: "176px" }}
            h="52px"
            _hover={{ bg: "rgba(15, 118, 110, 0.08)" }}
            _active={{
              bg: "rgba(15, 118, 110, 0.12)",
              boxShadow: "none",
              transform: "none",
            }}
            _disabled={{ opacity: 0.58, cursor: "not-allowed" }}
          >
            {translateText("Next", language)}
          </Button>
        </Flex>

        <Divider borderColor="var(--app-border)" />

        <Flex
          align={{ base: "stretch", sm: "center" }}
          justify="space-between"
          gap={3}
          direction={{ base: "column", sm: "row" }}
        >
          <Text color="var(--app-text-muted)" fontSize="sm">
            {translateText("Already have a key?", language)}
          </Text>
          <Button
            type="button"
            variant="outline"
            borderRadius="8px"
            bg="transparent"
            borderColor="var(--app-border)"
            color="var(--app-text-primary)"
            boxShadow="none"
            transform="none"
            onClick={() => {
              onSelectSound?.();
              setShowSignIn((current) => !current);
            }}
            _hover={{ bg: "var(--app-surface-muted)" }}
            _active={{ boxShadow: "none", transform: "none" }}
          >
            {translateText("Sign in", language)}
          </Button>
        </Flex>

        <Accordion allowToggle>
          <AccordionItem
            border="1px solid"
            borderColor="var(--app-border)"
            borderRadius="8px"
          >
            <AccordionButton
              onClick={onSelectSound}
              _hover={{ bg: "var(--app-surface-muted)" }}
            >
              <HStack flex="1" textAlign="start" spacing={2}>
                <Icon as={ShieldCheck} boxSize="16px" color="#0f766e" />
                <Text fontWeight="700" color="var(--app-text-primary)">
                  {translateText(PRIVACY_POLICY_TITLE, language)}
                </Text>
              </HStack>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel
              bg="var(--app-surface-elevated)"
              borderTop="1px solid var(--app-border)"
            >
              <Stack
                spacing={3}
                fontSize="sm"
                color="var(--app-text-secondary)"
              >
                {PRIVACY_POLICY_COPY.map((paragraph) => (
                  <Text key={paragraph}>
                    {translateText(paragraph, language)}
                  </Text>
                ))}
              </Stack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>

        {showSignIn ? (
          <Stack
            spacing={3}
            border="1px solid"
            borderColor="var(--app-border)"
            borderRadius="8px"
            bg="var(--app-surface-elevated)"
            p={4}
          >
            <Input
              dir="ltr"
              type="password"
              value={secretInput}
              onChange={(event) => setSecretInput(event.target.value)}
              placeholder={translateText("Paste your secret key", language)}
              bg="var(--app-surface)"
              borderColor="var(--app-border)"
              color="var(--app-text-primary)"
              _placeholder={{ color: "var(--app-text-muted)" }}
            />
            <Flex gap={3} direction={{ base: "column", sm: "row" }}>
              <Button
                type="button"
                {...CITIZENSHIP_TEAL_BUTTON_PROPS}
                onClick={submitSignIn}
                isLoading={isSigningIn}
                isDisabled={!secretInput.trim()}
              >
                {translateText("Use this key", language)}
              </Button>
              <Button
                type="button"
                variant="outline"
                borderRadius="8px"
                bg="transparent"
                borderColor="var(--app-border)"
                color="var(--app-text-primary)"
                boxShadow="none"
                transform="none"
                onClick={() => {
                  onSelectSound?.();
                  setSecretInput("");
                  setShowSignIn(false);
                }}
                _hover={{ bg: "var(--app-surface-muted)" }}
                _active={{ boxShadow: "none", transform: "none" }}
              >
                {translateText("Cancel", language)}
              </Button>
            </Flex>
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
};

const WORTH_IT_TONE_STYLES = {
  green: {
    color: "#0f766e",
    bg: "rgba(15, 118, 110, 0.08)",
    border: "rgba(15, 118, 110, 0.28)",
  },
  yellow: {
    color: "#b45309",
    bg: "rgba(180, 83, 9, 0.08)",
    border: "rgba(180, 83, 9, 0.28)",
  },
  red: {
    color: "#dc2626",
    bg: "rgba(220, 38, 38, 0.07)",
    border: "rgba(220, 38, 38, 0.26)",
  },
};

const WORTH_IT_CASE_COSTS = {
  en: {
    green: {
      summary: "$0-$75 before passport DIY / $200-$400+ paid help",
      diy: "$0-$75 before passport",
      paid: "$200-$400+",
    },
    yellow: {
      summary: "$50-$300+ DIY / $150-$500+ paid review",
      diy: "$50-$300+",
      paid: "$150-$500+",
    },
    red: {
      summary: "Unpredictable DIY: $150-$1,000+ / paid help: $500-$1,200+",
      diy: "Unpredictable: $150-$1,000+",
      paid: "$500-$1,200+",
    },
  },
  es: {
    green: {
      summary:
        "Por cuenta propia antes del pasaporte: $0-$75 / ayuda pagada: $200-$400+",
      diy: "$0-$75 antes del pasaporte",
      paid: "$200-$400+",
    },
    yellow: {
      summary: "Por cuenta propia: $50-$300+ / revisión pagada: $150-$500+",
      diy: "$50-$300+",
      paid: "$150-$500+",
    },
    red: {
      summary:
        "Por cuenta propia impredecible: $150-$1,000+ / ayuda pagada: $500-$1,200+",
      diy: "Impredecible: $150-$1,000+",
      paid: "$500-$1,200+",
    },
  },
  pt: {
    green: {
      summary:
        "Por conta própria antes do passaporte: US$0-US$75 / ajuda paga: US$200-US$400+",
      diy: "US$0-US$75 antes do passaporte",
      paid: "US$200-US$400+",
    },
    yellow: {
      summary:
        "Por conta própria: US$50-US$300+ / revisão paga: US$150-US$500+",
      diy: "US$50-US$300+",
      paid: "US$150-US$500+",
    },
    red: {
      summary:
        "Por conta própria imprevisível: US$150-US$1.000+ / ajuda paga: US$500-US$1.200+",
      diy: "Imprevisível: US$150-US$1.000+",
      paid: "US$500-US$1.200+",
    },
  },
  it: {
    green: {
      summary:
        "Fai da te prima del passaporto: $0-$75 / aiuto pagato: $200-$400+",
      diy: "$0-$75 prima del passaporto",
      paid: "$200-$400+",
    },
    yellow: {
      summary: "Fai da te: $50-$300+ / revisione pagata: $150-$500+",
      diy: "$50-$300+",
      paid: "$150-$500+",
    },
    red: {
      summary:
        "Fai da te imprevedibile: $150-$1.000+ / aiuto pagato: $500-$1.200+",
      diy: "Imprevedibile: $150-$1.000+",
      paid: "$500-$1.200+",
    },
  },
  fr: {
    green: {
      summary:
        "Par soi-meme avant le passeport: 0-75 $ / aide payante: 200-400 $+",
      diy: "0-75 $ avant le passeport",
      paid: "200-400 $+",
    },
    yellow: {
      summary: "Par soi-meme: 50-300 $+ / revue payante: 150-500 $+",
      diy: "50-300 $+",
      paid: "150-500 $+",
    },
    red: {
      summary:
        "Par soi-meme imprevisible: 150-1 000 $+ / aide payante: 500-1 200 $+",
      diy: "Imprevisible: 150-1 000 $+",
      paid: "500-1 200 $+",
    },
  },
  ja: {
    green: {
      summary: "パスポート前に自分で行う場合: $0-$75 / 有料支援: $200-$400+",
      diy: "$0-$75（パスポート前）",
      paid: "$200-$400+",
    },
    yellow: {
      summary: "自分で行う場合: $50-$300+ / 有料レビュー: $150-$500+",
      diy: "$50-$300+",
      paid: "$150-$500+",
    },
    red: {
      summary:
        "自分で行う費用は予測困難: $150-$1,000+ / 有料支援: $500-$1,200+",
      diy: "予測困難: $150-$1,000+",
      paid: "$500-$1,200+",
    },
  },
  hi: {
    green: {
      summary:
        "पासपोर्ट से पहले खुद करने पर: $0-$75 / भुगतान वाली मदद: $200-$400+",
      diy: "$0-$75 पासपोर्ट से पहले",
      paid: "$200-$400+",
    },
    yellow: {
      summary: "खुद करने पर: $50-$300+ / भुगतान वाली समीक्षा: $150-$500+",
      diy: "$50-$300+",
      paid: "$150-$500+",
    },
    red: {
      summary:
        "खुद करने का खर्च अनिश्चित: $150-$1,000+ / भुगतान वाली मदद: $500-$1,200+",
      diy: "अनिश्चित: $150-$1,000+",
      paid: "$500-$1,200+",
    },
  },
  ar: {
    green: {
      summary: "بنفسك قبل جواز السفر: $0-$75 / مساعدة مدفوعة: $200-$400+",
      diy: "$0-$75 قبل جواز السفر",
      paid: "$200-$400+",
    },
    yellow: {
      summary: "بنفسك: $50-$300+ / مراجعة مدفوعة: $150-$500+",
      diy: "$50-$300+",
      paid: "$150-$500+",
    },
    red: {
      summary:
        "بنفسك بتكلفة غير متوقعة: $150-$1,000+ / مساعدة مدفوعة: $500-$1,200+",
      diy: "غير متوقعة: $150-$1,000+",
      paid: "$500-$1,200+",
    },
  },
  zh: {
    green: {
      summary: "护照前自办：$0-$75 / 付费帮助：$200-$400+",
      diy: "$0-$75（护照前）",
      paid: "$200-$400+",
    },
    yellow: {
      summary: "自办：$50-$300+ / 付费审核：$150-$500+",
      diy: "$50-$300+",
      paid: "$150-$500+",
    },
    red: {
      summary: "自办费用不可预测：$150-$1,000+ / 付费帮助：$500-$1,200+",
      diy: "不可预测：$150-$1,000+",
      paid: "$500-$1,200+",
    },
  },
};

const getWorthItCaseCost = (language, tone) => {
  const normalizedLanguage = normalizeSupportLanguage(language);
  return (
    WORTH_IT_CASE_COSTS[normalizedLanguage]?.[tone] ||
    WORTH_IT_CASE_COSTS.en[tone] ||
    WORTH_IT_CASE_COSTS.en.green
  );
};

const DualCitizenshipBenefitsScene = ({
  language,
  onContinue,
  onSubmitSound,
}) => {
  const content = getDualCitizenshipBenefits(language);

  return (
    <Stack spacing={5} textAlign="start">
      <Box>
        <HStack spacing={3} mb={3}>
          <Box
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            w="42px"
            h="42px"
            borderRadius="8px"
            bg="rgba(15, 118, 110, 0.14)"
            color="#0f766e"
            flexShrink={0}
          >
            <Icon as={BadgeCheck} boxSize="22px" />
          </Box>
          <Heading
            as="h1"
            size="lg"
            letterSpacing="0"
            color="var(--app-text-primary)"
          >
            {content.title}
          </Heading>
        </HStack>
        <Text
          color="var(--app-text-secondary)"
          fontSize={{ base: "md", md: "lg" }}
        >
          {content.subtitle}
        </Text>
      </Box>

      <Box
        border="1px solid"
        borderColor="rgba(15, 118, 110, 0.24)"
        borderRadius="8px"
        bg="rgba(15, 118, 110, 0.07)"
        p={{ base: 4, md: 5 }}
      >
        <HStack spacing={2} mb={4} align="center">
          <Icon as={Sparkles} boxSize="18px" color="#0f766e" />
          <Text color="var(--app-text-primary)" fontWeight="800">
            {content.overallTitle}
          </Text>
        </HStack>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          {content.overallBenefits.map((benefit) => (
            <HStack key={benefit} spacing={2} align="flex-start">
              <Icon
                as={Check}
                color="#0f766e"
                boxSize="15px"
                mt="3px"
                flexShrink={0}
              />
              <Text color="var(--app-text-secondary)" fontSize="sm">
                {benefit}
              </Text>
            </HStack>
          ))}
        </SimpleGrid>
      </Box>

      <Box>
        <Text color="var(--app-text-primary)" fontWeight="800" mb={3}>
          {content.ageTitle}
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          {content.ageGroups.map((group) => (
            <Box
              key={group.range}
              border="1px solid"
              borderColor="var(--app-border)"
              borderRadius="8px"
              bg="var(--app-surface)"
              p={4}
            >
              <Badge
                bg="rgba(15, 118, 110, 0.14)"
                color="#0f766e"
                borderRadius="6px"
                px={2}
                py={1}
                mb={3}
              >
                {group.range}
              </Badge>
              <Stack spacing={2}>
                {group.items.map((item) => (
                  <HStack
                    key={`${group.range}-${item}`}
                    spacing={2}
                    align="flex-start"
                  >
                    <Icon
                      as={Check}
                      color="#0f766e"
                      boxSize="14px"
                      mt="3px"
                      flexShrink={0}
                    />
                    <Text color="var(--app-text-secondary)" fontSize="sm">
                      {item}
                    </Text>
                  </HStack>
                ))}
              </Stack>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      <Button
        type="button"
        alignSelf="center"
        {...CITIZENSHIP_TEAL_BUTTON_PROPS}
        minW={{ base: "100%", sm: "240px" }}
        h="58px"
        fontSize="lg"
        mb={3}
        onClick={() => {
          onSubmitSound?.();
          onContinue();
        }}
      >
        {translateText("Next", language)}
      </Button>
    </Stack>
  );
};

const DNExpressWorthItPrimer = ({
  language,
  onBackToBenefits,
  onStartQuestions,
  isStarting,
  onSelectSound,
  onSubmitSound,
}) => {
  const post = getDNExpressPost(language);
  const benefitsContent = getDualCitizenshipBenefits(language);
  const [openCaseIndexes, setOpenCaseIndexes] = useState([]);

  return (
    <Stack spacing={5} textAlign="start">
      <Button
        type="button"
        variant="outline"
        alignSelf="flex-start"
        borderRadius="8px"
        bg="var(--app-surface-elevated)"
        borderColor="var(--app-border)"
        color="var(--app-text-primary)"
        boxShadow="none"
        transform="none"
        leftIcon={<Icon as={ArrowLeft} boxSize="16px" />}
        onClick={() => {
          onSelectSound?.();
          onBackToBenefits();
        }}
        _hover={{ bg: "var(--app-surface-muted)" }}
        _active={{ boxShadow: "none", transform: "none" }}
      >
        {benefitsContent.backCta}
      </Button>
      <Box>
        <Heading
          as="h1"
          size="lg"
          letterSpacing="0"
          color="var(--app-text-primary)"
          mb={3}
        >
          {post.title}
        </Heading>
        <Text
          color="var(--app-text-secondary)"
          fontSize={{ base: "md", md: "lg" }}
        >
          {post.subtitle}
        </Text>
      </Box>

      <Text color="var(--app-text-muted)" fontSize="sm">
        {post.priceFooter}
      </Text>

      <Button
        type="button"
        alignSelf="center"
        {...CITIZENSHIP_TEAL_BUTTON_PROPS}
        onClick={() => {
          onSubmitSound?.();
          onStartQuestions();
        }}
        isLoading={isStarting}
      >
        {post.primaryCta}
      </Button>

      <Accordion
        allowMultiple
        reduceMotion
        index={openCaseIndexes}
        onChange={(nextIndexes) => {
          setOpenCaseIndexes(
            Array.isArray(nextIndexes) ? nextIndexes : [nextIndexes],
          );
        }}
        sx={{ overflowAnchor: "none" }}
      >
        {post.cards.map((card) => {
          const tone =
            WORTH_IT_TONE_STYLES[card.tone] || WORTH_IT_TONE_STYLES.green;
          const cost = getWorthItCaseCost(language, card.tone);
          return (
            <AccordionItem
              key={card.status}
              border="1px solid"
              borderColor={tone.border}
              borderRadius="8px"
              bg={tone.bg}
              mb={3}
              overflow="hidden"
            >
              <AccordionButton
                px={{ base: 4, md: 5 }}
                py={4}
                onClick={onSelectSound}
                _hover={{ bg: "rgba(255, 255, 255, 0.04)" }}
              >
                <HStack flex="1" spacing={3} textAlign="start" align="center">
                  <Badge
                    bg={tone.color}
                    color="white"
                    borderRadius="6px"
                    px={2}
                    py={1}
                  >
                    {card.status}
                  </Badge>
                  <Box>
                    <Text fontWeight="800" color="var(--app-text-primary)">
                      {card.title}
                    </Text>
                    <Text color="var(--app-text-muted)" fontSize="sm">
                      {cost.summary}
                    </Text>
                  </Box>
                </HStack>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel px={{ base: 4, md: 5 }} pb={5}>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} mb={4}>
                  <Box
                    border="1px solid"
                    borderColor={tone.border}
                    borderRadius="8px"
                    bg="var(--app-surface)"
                    p={3}
                  >
                    <Text
                      color="var(--app-text-muted)"
                      fontSize="xs"
                      fontWeight="800"
                      mb={1}
                    >
                      {translateText("DIY official route", language)}
                    </Text>
                    <Text
                      color="var(--app-text-primary)"
                      fontSize="sm"
                      fontWeight="800"
                    >
                      {cost.diy}
                    </Text>
                  </Box>
                  <Box
                    border="1px solid"
                    borderColor={tone.border}
                    borderRadius="8px"
                    bg="var(--app-surface)"
                    p={3}
                  >
                    <Text
                      color="var(--app-text-muted)"
                      fontSize="xs"
                      fontWeight="800"
                      mb={1}
                    >
                      {translateText("Paid-help range", language)}
                    </Text>
                    <Text
                      color="var(--app-text-primary)"
                      fontSize="sm"
                      fontWeight="800"
                    >
                      {cost.paid}
                    </Text>
                  </Box>
                  <Box
                    border="1px solid"
                    borderColor={tone.border}
                    borderRadius="8px"
                    bg="var(--app-surface)"
                    p={3}
                  >
                    <Text
                      color="var(--app-text-muted)"
                      fontSize="xs"
                      fontWeight="800"
                      mb={1}
                    >
                      {translateText("Recommendation", language)}
                    </Text>
                    <Text
                      color="var(--app-text-primary)"
                      fontSize="sm"
                      fontWeight="800"
                    >
                      {card.title}
                    </Text>
                  </Box>
                </SimpleGrid>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box>
                    <Text
                      color="var(--app-text-primary)"
                      fontSize="sm"
                      fontWeight="800"
                      mb={2}
                    >
                      {translateText("Meaning", language)}
                    </Text>
                    <Text
                      color="var(--app-text-secondary)"
                      fontSize="sm"
                      mb={3}
                    >
                      {card.body}
                    </Text>
                    <Stack spacing={2}>
                      {card.examples.map((example) => (
                        <HStack key={example} align="flex-start" spacing={2}>
                          <Icon
                            as={Check}
                            color={tone.color}
                            boxSize="14px"
                            mt="3px"
                            flexShrink={0}
                          />
                          <Text color="var(--app-text-secondary)" fontSize="sm">
                            {example}
                          </Text>
                        </HStack>
                      ))}
                    </Stack>
                  </Box>
                  <Box>
                    <Text
                      color="var(--app-text-primary)"
                      fontSize="sm"
                      fontWeight="800"
                      mb={2}
                    >
                      {translateText("User guidance", language)}
                    </Text>
                    <Text
                      color="var(--app-text-secondary)"
                      fontSize="sm"
                      fontWeight="700"
                      mb={3}
                    >
                      {card.bestMove}
                    </Text>
                    <Text color="var(--app-text-muted)" fontSize="xs">
                      {card.priceNote}
                    </Text>
                  </Box>
                </SimpleGrid>
              </AccordionPanel>
            </AccordionItem>
          );
        })}
      </Accordion>
    </Stack>
  );
};

const QUESTION_DEFINITIONS = [
  {
    id: "currentCitizenship",
    section: "Identity",
    icon: UserRound,
    type: "single",
    label: "What is your current country of citizenship?",
    helper:
      "This keeps the final warnings accurate. It does not decide the route by itself.",
    options: [
      { value: "us", label: "U.S." },
      { value: "mexico", label: "Mexico" },
      { value: "both", label: "Both" },
      { value: "other", label: "Other" },
      { value: "multiple", label: "Multiple" },
    ],
  },
  {
    id: "birthplace",
    section: "Identity",
    icon: MapPin,
    type: "single",
    label: "Where were you born?",
    helper: "Birthplace is the first legal divider.",
    options: [
      {
        value: "mexico",
        label: "Mexico",
        accent: "#0f766e",
        bg: "rgba(15,118,110,0.12)",
      },
      {
        value: "us",
        label: "U.S.",
        accent: "#1d4ed8",
        bg: "rgba(29,78,216,0.12)",
      },
      {
        value: "other_country",
        label: "Other country",
        accent: "#7c3aed",
        bg: "rgba(124,58,237,0.12)",
      },
      {
        value: "mexican_ship_aircraft",
        label: "Mexican ship or aircraft",
        accent: "#b45309",
        bg: "rgba(180,83,9,0.14)",
      },
      {
        value: "unknown",
        label: "Unknown",
        accent: "#475569",
        bg: "rgba(71,85,105,0.12)",
      },
    ],
  },
  {
    id: "existingDocs",
    section: "Documents",
    icon: FileBadge2,
    type: "multi",
    label: "Do you already have any Mexican document?",
    helper:
      "Existing proof can turn this into a records or passport task instead of an acquisition task.",
    options: [
      { value: "birth_acta", label: "Mexican birth certificate" },
      { value: "passport", label: "Mexican passport" },
      { value: "matricula", label: "Matricula" },
      { value: "curp", label: "CURP" },
      { value: "ine", label: "INE" },
      { value: "declaratoria", label: "Declaratoria / certificate" },
      { value: "naturalization_letter", label: "Carta de Naturalizacion" },
      { value: "none", label: "None" },
    ],
  },
  {
    id: "applicantType",
    section: "Applicant",
    icon: UserRound,
    type: "single",
    label: "Are you applying for yourself or for a minor?",
    options: [
      { value: "self_adult", label: "Self, adult" },
      { value: "minor_guardian", label: "Parent/guardian for child" },
      { value: "authorized", label: "Attorney/authorized person" },
    ],
  },
  {
    id: "handlingLocation",
    section: "Location",
    icon: MapPin,
    type: "text",
    label: "Which consulate or Mexican state will handle the case?",
    helper:
      "You can use a ZIP, preferred consulate, or Mexican state. Skip it if you do not know yet.",
    placeholder: "ZIP, preferred consulate, or Mexican state",
    optional: true,
  },
  {
    id: "registeredMexico",
    section: "Born in Mexico",
    icon: Home,
    type: "single",
    label: "Were you registered with a Mexican civil registry?",
    when: (answers) => answers.birthplace === "mexico",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "foreignNationalityBefore1998",
    section: "Born in Mexico",
    icon: Home,
    type: "single",
    label: "Did you acquire another nationality before March 20, 1998?",
    when: (answers) => answers.birthplace === "mexico",
    options: [
      { value: "yes", label: "Yes, before March 20, 1998" },
      { value: "after", label: "Acquired after that date" },
      { value: "no", label: "No" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "actaIssue",
    section: "Born in Mexico",
    icon: Home,
    type: "single",
    label:
      "Is your Mexican birth certificate late-registered or inconsistent with your ID?",
    when: (answers) => answers.birthplace === "mexico",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "parentMexicanAtBirth",
    section: "Mexican parent",
    icon: UsersRound,
    type: "single",
    label: "Was at least one legal parent Mexican at or before your birth?",
    when: (answers) => isBornOutsideMexico(answers.birthplace),
    options: [
      { value: "mother", label: "Mother" },
      { value: "father", label: "Father" },
      { value: "both", label: "Both" },
      {
        value: "parent_after_birth",
        label: "Parent became Mexican after my birth",
      },
      { value: "not_sure", label: "Not sure" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "parentProof",
    section: "Mexican parent",
    icon: FileBadge2,
    type: "single",
    label: "What proof does the Mexican parent have?",
    when: (answers) => isBornOutsideMexico(answers.birthplace),
    options: [
      { value: "parent_birth_acta", label: "Mexican birth acta" },
      { value: "parent_passport", label: "Mexican passport" },
      { value: "parent_matricula", label: "Matricula" },
      { value: "parent_ine", label: "INE" },
      {
        value: "parent_naturalization_letter",
        label: "Carta de Naturalizacion",
      },
      { value: "parent_declaratoria", label: "Declaratoria / certificate" },
      { value: "none", label: "None" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "parentOrigin",
    section: "Mexican parent",
    icon: UsersRound,
    type: "single",
    label:
      "Was the Mexican parent born in Mexico, born abroad, or naturalized Mexican?",
    when: (answers) => isBornOutsideMexico(answers.birthplace),
    options: [
      { value: "born_mexico", label: "Born in Mexico" },
      { value: "born_abroad", label: "Born abroad" },
      { value: "naturalized", label: "Naturalized Mexican" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "parentNamesMatch",
    section: "Documents",
    icon: FileBadge2,
    type: "single",
    label:
      "Do parent names on your foreign birth certificate match the Mexican parent records?",
    when: (answers) => isBornOutsideMexico(answers.birthplace),
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      {
        value: "minor_difference",
        label: "Accents, spelling, or order differ",
      },
      { value: "married_surname", label: "Married surname issue" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "birthCertificateType",
    section: "Documents",
    icon: FileBadge2,
    type: "single",
    label: "Do you have a long-form certified birth certificate?",
    when: (answers) => isBornOutsideMexico(answers.birthplace),
    options: [
      { value: "long_form", label: "Yes, long-form certified" },
      { value: "short_abstract", label: "Short abstract only" },
      { value: "hospital_only", label: "Hospital certificate only" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "parentsMarriedTiming",
    section: "Family record",
    icon: UsersRound,
    type: "single",
    label: "Were your parents married before your birth?",
    when: (answers) => isBornOutsideMexico(answers.birthplace),
    options: [
      {
        value: "six_months_before",
        label: "Yes, at least 6 months before birth",
      },
      {
        value: "late_or_after_birth",
        label: "Yes, but after birth or under 6 months",
      },
      { value: "no", label: "No" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "parentAvailability",
    section: "Family record",
    icon: UsersRound,
    type: "single",
    label:
      "Is either parent deceased, absent, unavailable, or unwilling to participate?",
    when: (answers) => isBornOutsideMexico(answers.birthplace),
    options: [
      { value: "no", label: "No" },
      { value: "yes_father", label: "Yes, father" },
      { value: "yes_mother", label: "Yes, mother" },
      { value: "both", label: "Both" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "applicantAdult",
    section: "Applicant",
    icon: UserRound,
    type: "single",
    label: "Are you over 18?",
    when: (answers) => isBornOutsideMexico(answers.birthplace),
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "foreignBirthRecord",
    section: "Documents",
    icon: FileBadge2,
    type: "single",
    label:
      "Was your birth certificate issued outside the U.S. or in a language other than English/Spanish?",
    when: (answers) => isBornOutsideMexico(answers.birthplace),
    options: [
      { value: "us", label: "U.S." },
      { value: "non_us", label: "Non-U.S." },
      { value: "non_english", label: "Non-English" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "residentStatus",
    section: "Naturalization",
    icon: Gavel,
    type: "single",
    label: "Do you currently live in Mexico with legal resident status?",
    options: [
      { value: "permanent", label: "Permanent resident" },
      { value: "temporary", label: "Temporary resident" },
      { value: "student", label: "Temporary student" },
      { value: "tourist", label: "Tourist/FMM" },
      { value: "no", label: "No" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "residenceYears",
    section: "Naturalization",
    icon: Gavel,
    type: "single",
    label: "How long have you had qualifying residence in Mexico?",
    options: [
      { value: "5_plus", label: "5+ years" },
      { value: "2_5", label: "2-5 years" },
      { value: "1_2", label: "1-2 years" },
      { value: "under_1", label: "Less than 1 year" },
      { value: "none", label: "None / no qualifying residence" },
    ],
  },
  {
    id: "cardReady",
    section: "Naturalization",
    icon: FileBadge2,
    type: "single",
    label:
      "Is your resident card valid at least six months beyond filing and does it show CURP?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "not_applicable", label: "Not applicable" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "addressMatch",
    section: "Naturalization",
    icon: MapPin,
    type: "single",
    label:
      "Is your INM-registered address the same as your application address?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "not_applicable", label: "Not applicable" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "absences",
    section: "Naturalization",
    icon: Gavel,
    type: "single",
    label:
      "During the last two years of qualifying residence, how much time were you outside Mexico?",
    options: [
      { value: "none", label: "None" },
      { value: "under_6_months", label: "Under 6 months total" },
      { value: "over_6_months", label: "Over 6 months total" },
      {
        value: "not_applicable",
        label: "Not applicable / no qualifying residence yet",
      },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "marriedMexican",
    section: "Naturalization",
    icon: UsersRound,
    type: "single",
    label: "Are you married to a Mexican citizen?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "mexicanChild",
    section: "Naturalization",
    icon: UsersRound,
    type: "single",
    label: "Do you have a Mexican child by birth?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "descendant",
    section: "Naturalization",
    icon: UsersRound,
    type: "single",
    label: "Are you a direct descendant of a Mexican by birth?",
    options: [
      { value: "parent", label: "Parent" },
      { value: "grandparent", label: "Grandparent" },
      { value: "great_grandparent", label: "Great-grandparent" },
      { value: "no", label: "No" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "latinIberian",
    section: "Naturalization",
    icon: Gavel,
    type: "single",
    label: "Are you originally from Latin America or the Iberian Peninsula?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "refugee",
    section: "Naturalization",
    icon: ShieldCheck,
    type: "single",
    label: "Are you recognized as a refugee by COMAR?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "adoptedParentalAuthority",
    section: "Naturalization",
    icon: UsersRound,
    type: "single",
    label:
      "Are you a minor adopted by Mexican citizens or under Mexican parental authority?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "former", label: "Formerly, now adult" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "distinguishedService",
    section: "Naturalization",
    icon: Gavel,
    type: "single",
    label: "Have you performed distinguished services benefiting Mexico?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "criminalHistory",
    section: "Naturalization",
    icon: AlertTriangle,
    type: "single",
    label:
      "Do you have criminal history, pending charges, or a prison sentence in any country?",
    options: [
      { value: "no", label: "No" },
      { value: "pending", label: "Pending case" },
      { value: "conviction", label: "Conviction" },
      { value: "sentence", label: "Sentence being served" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    id: "examReady",
    section: "Naturalization",
    icon: ClipboardCheck,
    type: "single",
    label: "Can you speak Spanish and pass Mexican history/culture exams?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "maybe", label: "Maybe" },
      { value: "exempt", label: "Exempt/minor/over 60/refugee" },
    ],
  },
  {
    id: "passportReady",
    section: "Naturalization",
    icon: FileBadge2,
    type: "single",
    label:
      "Do you have a valid foreign passport with at least 45 business days of validity?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "recently_renewed", label: "Recently renewed" },
    ],
  },
];

const hasQuestionAnswer = (question, answers) => {
  const value = answers[question.id];
  if (Array.isArray(value)) return value.length > 0;
  return String(value || "").trim().length > 0;
};

const getVisibleQuestions = (answers) =>
  QUESTION_DEFINITIONS.filter((question) =>
    question.when ? question.when(answers) : true,
  );

const getLocalizedQuestion = (question, language) => {
  if (!question) return null;
  return {
    ...question,
    label: translateText(question.label, language),
    helper: translateText(question.helper, language),
    placeholder: translateText(question.placeholder, language),
    section: translateText(question.section, language),
    options: question.options?.map((option) => ({
      ...option,
      label: translateText(option.label, language),
    })),
  };
};

const formatQuestionAnswer = (question, answers, language) => {
  const value = answers[question.id];
  const optionLabelByValue = new Map(
    (question.options || []).map((option) => [option.value, option.label]),
  );

  if (Array.isArray(value)) {
    if (!value.length) return translateText("Not answered", language);
    return value
      .map((item) =>
        translateText(optionLabelByValue.get(item) || item, language),
      )
      .join(", ");
  }

  if (!String(value || "").trim()) {
    return translateText("Not answered", language);
  }

  return translateText(optionLabelByValue.get(value) || value, language);
};

const buildCitizenshipReportText = ({
  answers,
  evaluation,
  checklistProgress,
  language,
}) => {
  const route = evaluation.route;
  const baseRoute = evaluation.baseRoute ? ROUTES[evaluation.baseRoute] : null;
  const visibleQuestions = getVisibleQuestions(answers);
  const checklistItems = evaluation.checklist.length
    ? evaluation.checklist
    : ["Complete the intake to generate a checklist."];

  const lines = [
    translateText("Mexico citizenship route report", language),
    `${translateText("Generated", language)}: ${new Date().toLocaleString()}`,
    "",
    translateText("Outcome", language),
    `${translateText("Route", language)}: ${route?.code || ""} - ${translateText(
      route?.title || "Find the route",
      language,
    )}`,
    `${translateText("Completion", language)}: 100%`,
  ];

  if (route?.subtitle) {
    lines.push(
      `${translateText("Status", language)}: ${translateText(route.subtitle, language)}`,
    );
  }

  if (baseRoute) {
    lines.push(
      `${translateText("Likely base route", language)}: ${baseRoute.code} - ${translateText(
        baseRoute.title,
        language,
      )}`,
    );
  }

  if (evaluation.modality) {
    lines.push(
      `${translateText("Naturalization modality", language)}: ${translateText(
        evaluation.modality,
        language,
      )}`,
    );
  }

  lines.push("", translateText("Why", language));
  (evaluation.reasons.length
    ? evaluation.reasons
    : ["Answer more questions to narrow the route."]
  ).forEach((reason) => {
    lines.push(`- ${translateText(reason, language)}`);
  });

  if (evaluation.blockers.length) {
    lines.push("", translateText("Resolve first", language));
    evaluation.blockers.forEach((blocker) => {
      lines.push(`- ${translateText(blocker, language)}`);
    });
  }

  lines.push("", translateText("Questionnaire answers", language));
  visibleQuestions.forEach((question, index) => {
    lines.push(`${index + 1}. ${translateText(question.label, language)}`);
    lines.push(`   ${formatQuestionAnswer(question, answers, language)}`);
  });

  lines.push("", translateText("Checklist", language));
  checklistItems.forEach((item) => {
    const itemStatus = checklistProgress[getChecklistItemId(item)]
      ? translateText("Checked", language)
      : translateText("Pending", language);
    lines.push(`[${itemStatus}] ${translateText(item, language)}`);
  });

  lines.push("", translateText("Critical warnings", language));
  evaluation.notices.forEach((notice) => {
    lines.push(`- ${translateText(notice, language)}`);
  });

  lines.push("", translateText("Official references", language));
  OFFICIAL_LINKS.forEach((link) => {
    lines.push(`- ${translateText(link.label, language)}: ${link.href}`);
  });

  return `${lines.join("\n")}\n`;
};

const getCitizenshipChecklistItems = (evaluation) =>
  evaluation.checklist.length
    ? evaluation.checklist
    : ["Complete the intake to generate a checklist."];

const CHECKLIST_STAGE_DEFINITIONS = [
  {
    id: "resolve",
    title: "Fix blockers",
    description:
      "Clear issues that could stop the case before collecting everything else.",
    tone: "#dc2626",
  },
  {
    id: "documents",
    title: "Document collection",
    description:
      "Gather identity, civil registry, family, and nationality records.",
    tone: "#1d4ed8",
  },
  {
    id: "appointment",
    title: "Appointment prep",
    description:
      "Prepare scheduling, appearances, witnesses, and appointment-specific items.",
    tone: "#7c3aed",
  },
  {
    id: "filing",
    title: "Naturalization filing",
    description:
      "Prepare SRE filing documents, residence proof, exams, and modality evidence.",
    tone: "#b91c1c",
  },
  {
    id: "after",
    title: "After approval",
    description: "Handle passport, CURP, ID, or post-approval follow-up tasks.",
    tone: "#0f766e",
  },
  {
    id: "other",
    title: "Other tasks",
    description: "Track remaining tasks that do not fit a specific stage yet.",
    tone: "#64748b",
  },
];

const getChecklistItemStageId = (item, evaluation) => {
  const text = String(item || "").toLowerCase();
  const routeCode = evaluation.route?.code || "";

  if (
    text.includes("ask ") ||
    text.includes("fix ") ||
    text.includes("correct") ||
    text.includes("compare") ||
    text.includes("review") ||
    text.includes("missing") ||
    text.includes("not ready") ||
    text.includes("calculate") ||
    text.includes("move from") ||
    text.includes("continue qualifying") ||
    text.includes("keep qualifying")
  ) {
    return "resolve";
  }

  if (
    text.includes("schedule") ||
    text.includes("appointment") ||
    text.includes("miconsulado") ||
    text.includes("attending") ||
    text.includes("witness") ||
    text.includes("appearance")
  ) {
    return "appointment";
  }

  if (
    routeCode === "R5" ||
    text.includes("dnn-3") ||
    text.includes("resident card") ||
    text.includes("criminal-record") ||
    text.includes("entries/exits") ||
    text.includes("payment") ||
    text.includes("exam") ||
    text.includes("sre study") ||
    text.includes("residence")
  ) {
    return "filing";
  }

  if (
    text.includes("after") ||
    text.includes("passport appointment") ||
    text.includes("apply for mexican passport") ||
    text.includes("proceed to passport") ||
    text.includes("issued")
  ) {
    return "after";
  }

  if (
    text.includes("collect") ||
    text.includes("gather") ||
    text.includes("prepare") ||
    text.includes("bring") ||
    text.includes("obtain") ||
    text.includes("order") ||
    text.includes("locate") ||
    text.includes("birth") ||
    text.includes("acta") ||
    text.includes("passport") ||
    text.includes("curp") ||
    text.includes("id")
  ) {
    return "documents";
  }

  return "other";
};

const getChecklistStageGroups = (evaluation) => {
  const stageItems = CHECKLIST_STAGE_DEFINITIONS.map((stage) => ({
    ...stage,
    items: [],
  }));

  getCitizenshipChecklistItems(evaluation).forEach((item) => {
    const stageId = getChecklistItemStageId(item, evaluation);
    const stage = stageItems.find((candidate) => candidate.id === stageId);
    (stage || stageItems[stageItems.length - 1]).items.push(item);
  });

  return stageItems.filter((stage) => stage.items.length > 0);
};

const CITIZENSHIP_DETAIL_PRESETS = {
  records: {
    check:
      "Compare names, dates, parent details, actas, IDs, and certificate format before scheduling.",
    resolve:
      "Order the correct long-form or certified record, then correct mismatches before relying on it.",
    mistake:
      "Short-form records, missing parent details, or small name differences can still cause rejection.",
  },
  family: {
    check:
      "Confirm who must appear or consent, and collect marriage, death, custody, adoption, or court records if relevant.",
    resolve:
      "Contact the consulate or civil registry with the exact parentage issue before booking the appointment.",
    mistake:
      "Do not assume a missing, deceased, or unavailable parent can be handled the same way at every consulate.",
  },
  legalization: {
    check:
      "Check whether the record needs apostille/legalization and an authorized translation.",
    resolve:
      "Request the apostille or legalization from the issuing authority and use the required translator before filing.",
    mistake:
      "Apostilles and translations can take time, so do not leave this until appointment week.",
  },
  appointment: {
    check:
      "Confirm the correct appointment category, required originals, copies, witnesses, and who must attend.",
    resolve:
      "Use the official appointment system, choose the matching service category, and bring the exact people and records required.",
    mistake:
      "Booking the wrong appointment type can delay the case even when documents are ready.",
  },
  residence: {
    check:
      "Confirm resident status, CURP, INM address match, card validity, absence limits, and modality proof before filing.",
    resolve:
      "Update immigration records, wait out timing problems, or gather modality proof before submitting to SRE.",
    mistake:
      "Student, tourist, or mismatched INM records may not count for naturalization filing.",
  },
  issuance: {
    check:
      "Verify the issued Mexican record before using it for passport, CURP, or ID steps.",
    resolve:
      "Request corrections immediately if the issued acta, CURP, or identity record has an error.",
    mistake: "Do not skip checking the issued record for name or date errors.",
  },
  default: {
    check:
      "Confirm the record is current, certified when required, and matches the names in your other documents.",
    resolve:
      "Find the official requirement, gather the exact supporting record, and keep a copy with your case file.",
    mistake:
      "Do not assume a similar document is acceptable; verify the exact official requirement.",
  },
};

const getCitizenshipDetailPresetKey = (item) => {
  const text = String(item || "").toLowerCase();

  if (
    text.includes("apostille") ||
    text.includes("translation") ||
    text.includes("legalization") ||
    text.includes("legalisation") ||
    text.includes("non-u.s") ||
    text.includes("non-us") ||
    text.includes("foreign birth")
  ) {
    return "legalization";
  }

  if (
    text.includes("parent") ||
    text.includes("father") ||
    text.includes("mother") ||
    text.includes("married") ||
    text.includes("custody") ||
    text.includes("adoption") ||
    text.includes("adopted") ||
    text.includes("paternity") ||
    text.includes("court") ||
    text.includes("deceased") ||
    text.includes("absent") ||
    text.includes("unavailable") ||
    text.includes("unwilling") ||
    text.includes("power")
  ) {
    return "family";
  }

  if (
    text.includes("appointment") ||
    text.includes("miconsulado") ||
    text.includes("schedule") ||
    text.includes("witness") ||
    text.includes("appear") ||
    text.includes("attending")
  ) {
    return "appointment";
  }

  if (
    text.includes("resident") ||
    text.includes("residence") ||
    text.includes("inm") ||
    text.includes("dnn-3") ||
    text.includes("criminal") ||
    text.includes("absence") ||
    text.includes("entries/exits") ||
    text.includes("exam") ||
    text.includes("payment") ||
    text.includes("naturalization filing")
  ) {
    return "residence";
  }

  if (
    text.includes("after") ||
    text.includes("issued") ||
    text.includes("passport appointment") ||
    text.includes("apply for mexican passport") ||
    text.includes("proceed to passport") ||
    text.includes("certified copies")
  ) {
    return "issuance";
  }

  if (
    text.includes("name") ||
    text.includes("birth") ||
    text.includes("acta") ||
    text.includes("curp") ||
    text.includes("id") ||
    text.includes("document") ||
    text.includes("record") ||
    text.includes("proof") ||
    text.includes("certificate") ||
    text.includes("passport")
  ) {
    return "records";
  }

  return "default";
};

const getCitizenshipItemDetail = (item, kind = "checklist") => {
  const preset =
    CITIZENSHIP_DETAIL_PRESETS[getCitizenshipDetailPresetKey(item)] ||
    CITIZENSHIP_DETAIL_PRESETS.default;

  return {
    why:
      kind === "blocker"
        ? "This item can delay or stop the route until the consulate, SRE, or civil registry confirms the path."
        : "This item helps prove the route and reduces the chance of an appointment delay.",
    check: preset.check,
    resolve: preset.resolve,
    mistake: preset.mistake,
  };
};

const createCitizenshipChatMessageId = () => {
  const randomId = globalThis.crypto?.randomUUID?.();
  return (
    randomId ||
    `citizenship-chat-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
};

const createCitizenshipChatMessage = (role, text = "", done = true) => ({
  id: createCitizenshipChatMessageId(),
  role,
  text,
  done,
  createdAt: new Date().toISOString(),
});

const getCitizenshipAssistantLanguageName = (language) =>
  LANGUAGE_PROMPT_LABELS[normalizeSupportLanguage(language)] || "English";

const buildCitizenshipAssistantContext = ({
  answers,
  evaluation,
  checklistProgress,
  language,
}) => {
  const route = evaluation.route;
  const checklistItems = getCitizenshipChecklistItems(evaluation);
  const visibleQuestions = getVisibleQuestions(answers);
  const completedItems = checklistItems.filter(
    (item) => checklistProgress[getChecklistItemId(item)] === true,
  );

  return [
    `Selected route: ${route?.code || "unknown"} - ${route?.title || "Unknown"}`,
    `Route subtitle: ${route?.subtitle || evaluation.confidence || ""}`,
    evaluation.baseRoute
      ? `Likely base route: ${evaluation.baseRoute} - ${ROUTES[evaluation.baseRoute]?.title || ""}`
      : "",
    evaluation.modality
      ? `Naturalization modality: ${evaluation.modality}`
      : "",
    "",
    "Reasons shown to the user:",
    ...(evaluation.reasons.length
      ? evaluation.reasons
      : ["No route reasons yet."]
    ).map((reason) => `- ${reason}`),
    "",
    "Blockers shown to the user:",
    ...(evaluation.blockers.length
      ? evaluation.blockers
      : ["No blockers currently flagged."]
    ).map((blocker) => `- ${blocker}`),
    "",
    "Checklist with current progress:",
    ...checklistItems.map((item) => {
      const status = checklistProgress[getChecklistItemId(item)]
        ? "done"
        : "pending";
      return `- [${status}] ${item}`;
    }),
    "",
    `Completed checklist items: ${completedItems.length}/${checklistItems.length}`,
    "",
    "Questionnaire answers:",
    ...visibleQuestions.map(
      (question) =>
        `- ${question.label}: ${formatQuestionAnswer(question, answers, language)}`,
    ),
  ]
    .filter((line) => line !== "")
    .join("\n");
};

const buildCitizenshipAssistantStarterPrompt = ({
  answers,
  evaluation,
  checklistProgress,
  language,
}) => {
  const languageName = getCitizenshipAssistantLanguageName(language);
  return [
    "You are a practical, supportive assistant inside a Mexico dual-citizenship checklist tool.",
    `Respond in ${languageName}.`,
    "The user just completed the questionnaire. Write the first assistant message.",
    "Break down their checklist into a clear plan, call out the most important blockers or document risks, and explain what to do next.",
    "Keep it concise, specific to their route, and useful for document collection.",
    "Use concise Markdown for structure, including bullets, numbered steps, and **bold** emphasis when helpful.",
    "Do not provide legal advice or promise an outcome. Tell the user to verify official requirements with SRE, the relevant consulate, or civil registry when needed.",
    "Do not repeat every questionnaire answer. Do not invent fees, deadlines, or appointment availability.",
    "",
    "Use this shape:",
    "1. A one-sentence route summary.",
    "2. The top 3 priorities.",
    "3. A short note about likely blockers or easy wins.",
    "4. A helpful question the user can ask you next.",
    "",
    buildCitizenshipAssistantContext({
      answers,
      evaluation,
      checklistProgress,
      language,
    }),
  ].join("\n");
};

const buildCitizenshipAssistantFollowUpPrompt = ({
  answers,
  evaluation,
  checklistProgress,
  language,
  messages,
  userText,
}) => {
  const languageName = getCitizenshipAssistantLanguageName(language);
  const history = messages
    .slice(-8)
    .map(
      (message) =>
        `${message.role === "user" ? "User" : "Assistant"}: ${message.text}`,
    )
    .join("\n");

  return [
    "You are a practical, supportive assistant inside a Mexico dual-citizenship checklist tool.",
    `Respond in ${languageName}.`,
    "Answer the user's follow-up using the route, checklist, and answers below.",
    "Be concise, direct, and action-oriented. Do not provide legal advice or promise an outcome.",
    "Use concise Markdown when it improves readability.",
    "If official verification is important, say so plainly.",
    "",
    history ? `Recent chat:\n${history}` : "",
    "",
    `User follow-up:\n${userText}`,
    "",
    buildCitizenshipAssistantContext({
      answers,
      evaluation,
      checklistProgress,
      language,
    }),
  ]
    .filter((line) => line !== "")
    .join("\n");
};

const buildCitizenshipChecklistAnalysisPrompt = ({
  answers,
  evaluation,
  checklistProgress,
  language,
  messages,
}) =>
  buildCitizenshipAssistantFollowUpPrompt({
    answers,
    evaluation,
    checklistProgress,
    language,
    messages,
    userText: [
      "Analyze my current checklist progress.",
      "Compare what is already checked with what remains pending.",
      "Give me concise advice, guidance, and useful context to help me complete the checklist.",
      "Include the next 3 practical actions, any likely blockers, and what documents or proof I should prioritize next.",
      "Use Markdown.",
    ].join(" "),
  });

const getGeminiChunkText = (chunk) =>
  typeof chunk?.text === "function" ? chunk.text() : "";

const getCitizenshipAssistantFallbackMessage = (language) =>
  [
    translateText(
      "I could not reach the assistant right now, but your checklist is still saved.",
      language,
    ),
    translateText(
      "Start with unresolved blockers, then gather the highest-proof records first: long-form birth records, Mexican actas, IDs, name-change documents, and any consulate-specific items.",
      language,
    ),
  ].join("\n\n");

const QuestionStep = ({
  question,
  value,
  onChange,
  language,
  onSelectSound,
}) => {
  if (!question) return null;
  const localizedQuestion = getLocalizedQuestion(question, language);
  if (localizedQuestion.type === "multi") {
    return (
      <MultiChoice
        label={localizedQuestion.label}
        helper={localizedQuestion.helper}
        values={value}
        options={localizedQuestion.options}
        onChange={onChange}
        onSelectSound={onSelectSound}
      />
    );
  }
  if (localizedQuestion.type === "text") {
    return (
      <TextField
        label={localizedQuestion.label}
        helper={localizedQuestion.helper}
        value={value || ""}
        placeholder={localizedQuestion.placeholder}
        onChange={onChange}
      />
    );
  }
  return (
    <SingleChoice
      label={localizedQuestion.label}
      helper={localizedQuestion.helper}
      value={value}
      options={localizedQuestion.options}
      onChange={onChange}
      onSelectSound={onSelectSound}
    />
  );
};

const CitizenshipItemDetail = ({ detail, language }) => (
  <Stack
    spacing={3}
    borderInlineStart="2px solid var(--app-border-strong)"
    ps={3}
  >
    {[
      ["Why it matters", detail.why],
      ["What to check", detail.check],
      ["How to resolve", detail.resolve],
      ["Common mistake", detail.mistake],
    ].map(([label, body]) => (
      <Box key={label}>
        <Text
          as="span"
          color="var(--app-text-primary)"
          fontSize="xs"
          fontWeight="800"
          textTransform="uppercase"
          letterSpacing="0"
        >
          {translateText(label, language)}
        </Text>
        <Text color="var(--app-text-secondary)" fontSize="sm" mt={1}>
          {translateText(body, language)}
        </Text>
      </Box>
    ))}
  </Stack>
);

const ResultPanel = ({
  evaluation,
  completionPercent,
  language,
  isLightTheme,
  onSelectSound,
}) => {
  const route = evaluation.route;
  const RouteIcon = route?.icon || Route;
  const referenceLinkColor = isLightTheme ? "#1d4ed8" : "white";

  return (
    <Box
      position={{ base: "static", lg: "sticky" }}
      top={{ lg: "24px" }}
      border="1px solid"
      borderColor="var(--app-border)"
      borderRadius="8px"
      overflow="hidden"
      bg="var(--app-surface-elevated)"
      boxShadow="var(--app-shadow-soft)"
    >
      <Box p={{ base: 4, md: 5 }} bg={route?.bg || "var(--app-surface-muted)"}>
        <HStack align="flex-start" justify="space-between" spacing={4}>
          <HStack align="center" spacing={3}>
            <Box
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              w="44px"
              h="44px"
              borderRadius="8px"
              bg="var(--app-surface-elevated)"
              color={route?.color || "#475569"}
              flexShrink={0}
            >
              <Icon as={RouteIcon} boxSize="24px" />
            </Box>
            <Box textAlign="start">
              <Heading
                as="h2"
                size="md"
                letterSpacing="0"
                color="var(--app-text-primary)"
              >
                {translateText(route?.title || "Find the route", language)}
              </Heading>
              <Text color="var(--app-text-secondary)" fontSize="sm">
                {translateText(
                  route?.subtitle || evaluation.confidence,
                  language,
                )}
              </Text>
            </Box>
          </HStack>
        </HStack>
        <Box mt={4}>
          <HStack justify="space-between" mb={2}>
            <Text color="var(--app-text-muted)" fontSize="sm">
              {translateText("Completion", language)}
            </Text>
            <Text
              color="var(--app-text-secondary)"
              fontSize="sm"
              fontWeight="700"
            >
              {completionPercent}%
            </Text>
          </HStack>
          <Progress
            value={completionPercent}
            h="8px"
            borderRadius="999px"
            bg="rgba(148, 163, 184, 0.18)"
            sx={{
              "& > div": {
                bg: route?.color || "#0f766e",
              },
            }}
          />
        </Box>
      </Box>

      <Stack spacing={0} divider={<Divider borderColor="var(--app-border)" />}>
        <Box p={5} textAlign="start">
          <Text fontWeight="800" mb={3} color="var(--app-text-primary)">
            {translateText("Why", language)}
          </Text>
          <Stack spacing={2}>
            {(evaluation.reasons.length
              ? evaluation.reasons
              : ["Answer more questions to narrow the route."]
            ).map((reason) => (
              <HStack key={reason} spacing={2} align="flex-start">
                <Icon
                  as={Check}
                  color="#0f766e"
                  boxSize="16px"
                  mt="2px"
                  flexShrink={0}
                />
                <Text color="var(--app-text-secondary)" fontSize="sm">
                  {translateText(reason, language)}
                </Text>
              </HStack>
            ))}
          </Stack>
        </Box>

        {evaluation.modality ? (
          <Box p={5} textAlign="start">
            <Text fontWeight="800" mb={2} color="var(--app-text-primary)">
              {translateText("Naturalization modality", language)}
            </Text>
            <Badge
              borderRadius="6px"
              px={2}
              py={1}
              bg="rgba(185, 28, 28, 0.1)"
              color="#b91c1c"
            >
              {translateText(evaluation.modality, language)}
            </Badge>
          </Box>
        ) : null}

        {evaluation.blockers.length ? (
          <Box p={5} textAlign="start" bg="rgba(220, 38, 38, 0.06)">
            <Text fontWeight="800" mb={3} color="var(--app-text-primary)">
              {translateText("Resolve first", language)}
            </Text>
            <Stack spacing={2}>
              {evaluation.blockers.map((blocker) => {
                const detail = getCitizenshipItemDetail(blocker, "blocker");

                return (
                  <Box
                    key={blocker}
                    border="1px solid"
                    borderColor="rgba(220, 38, 38, 0.2)"
                    borderRadius="8px"
                    bg="rgba(220, 38, 38, 0.04)"
                    overflow="hidden"
                  >
                    <Accordion allowMultiple>
                      <AccordionItem border="0">
                        <AccordionButton
                          px={3}
                          py={3}
                          color="var(--app-text-primary)"
                          onClick={onSelectSound}
                          _hover={{ bg: "rgba(220, 38, 38, 0.06)" }}
                        >
                          <HStack
                            spacing={2}
                            align="flex-start"
                            flex="1"
                            textAlign="start"
                          >
                            <Icon
                              as={AlertTriangle}
                              color="#dc2626"
                              boxSize="16px"
                              mt="2px"
                              flexShrink={0}
                            />
                            <Text
                              color="var(--app-text-secondary)"
                              fontSize="sm"
                            >
                              {translateText(blocker, language)}
                            </Text>
                          </HStack>
                          <HStack spacing={2} flexShrink={0} ms={3}>
                            <Badge
                              display={{ base: "none", sm: "inline-flex" }}
                              borderRadius="6px"
                              bg="rgba(220, 38, 38, 0.12)"
                              color="#dc2626"
                            >
                              {translateText("Appointment-stopper", language)}
                            </Badge>
                            <AccordionIcon />
                          </HStack>
                        </AccordionButton>
                        <AccordionPanel px={3} pt={0} pb={3}>
                          <CitizenshipItemDetail
                            detail={detail}
                            language={language}
                          />
                        </AccordionPanel>
                      </AccordionItem>
                    </Accordion>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        ) : null}

        <Box p={2} textAlign="start">
          <Accordion allowMultiple>
            <AccordionItem border="0">
              <AccordionButton
                px={3}
                py={3}
                borderRadius="8px"
                color="var(--app-text-primary)"
                onClick={onSelectSound}
                _hover={{ bg: "var(--app-surface-muted)" }}
              >
                <HStack flex="1" spacing={2} textAlign="start">
                  <Icon as={ShieldCheck} color="#b45309" boxSize="16px" />
                  <Text fontWeight="800">
                    {translateText("Critical warnings", language)}
                  </Text>
                </HStack>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel px={3} pt={2} pb={4}>
                <Stack spacing={2}>
                  {evaluation.notices.map((notice) => (
                    <HStack key={notice} spacing={2} align="flex-start">
                      <Icon
                        as={ShieldCheck}
                        color="#b45309"
                        boxSize="16px"
                        mt="2px"
                        flexShrink={0}
                      />
                      <Text color="var(--app-text-secondary)" fontSize="sm">
                        {translateText(notice, language)}
                      </Text>
                    </HStack>
                  ))}
                </Stack>
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem border="0">
              <AccordionButton
                px={3}
                py={3}
                borderRadius="8px"
                color="var(--app-text-primary)"
                onClick={onSelectSound}
                _hover={{ bg: "var(--app-surface-muted)" }}
              >
                <HStack flex="1" spacing={2} textAlign="start">
                  <Icon as={ExternalLink} color="#1d4ed8" boxSize="16px" />
                  <Text fontWeight="800">
                    {translateText("Official references", language)}
                  </Text>
                </HStack>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel px={3} pt={2} pb={4}>
                <Stack spacing={2}>
                  {OFFICIAL_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={onSelectSound}
                      color={referenceLinkColor}
                      display="inline-flex"
                      alignItems="center"
                      gap={2}
                      fontSize="sm"
                      textDecoration="underline"
                      textUnderlineOffset="3px"
                      textDecorationThickness="1px"
                      _hover={{
                        color: referenceLinkColor,
                        textDecoration: "underline",
                        opacity: 0.84,
                      }}
                    >
                      {translateText(link.label, language)}
                      <Icon as={ExternalLink} boxSize="14px" />
                    </Link>
                  ))}
                </Stack>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </Box>
      </Stack>
    </Box>
  );
};

const ChecklistPanel = ({
  evaluation,
  language,
  checklistProgress,
  onChecklistItemChange,
  onOpenAssistant,
  assistantChatSaved,
  isLightTheme,
  onSelectSound,
}) => {
  const checklistItems = getCitizenshipChecklistItems(evaluation);
  const checklistStageGroups = getChecklistStageGroups(evaluation);
  const completedChecklistItems = checklistItems.filter(
    (item) => checklistProgress[getChecklistItemId(item)] === true,
  ).length;
  const checklistPercent = checklistItems.length
    ? Math.round((completedChecklistItems / checklistItems.length) * 100)
    : 0;
  const panelAccent = isLightTheme
    ? {
        bg: "rgba(96, 77, 56, 0.045)",
        border: "rgba(96, 77, 56, 0.18)",
      }
    : {
        bg: "rgba(24, 32, 49, 0.74)",
        border: "rgba(148, 163, 184, 0.18)",
      };

  return (
    <Box
      border="1px solid"
      borderColor={panelAccent.border}
      borderRadius="8px"
      bg={panelAccent.bg}
      boxShadow="var(--app-shadow-soft)"
      p={{ base: 4, md: 5 }}
      textAlign="start"
    >
      <Button
        type="button"
        variant="outline"
        leftIcon={<Icon as={MessageCircle} boxSize="17px" />}
        onClick={() => {
          onSelectSound?.();
          onOpenAssistant();
        }}
        alignSelf="flex-start"
        borderRadius="8px"
        borderColor="var(--app-border)"
        bg="var(--app-surface)"
        color="var(--app-text-primary)"
        boxShadow="none"
        transform="none"
        mb={4}
        _hover={{ bg: "var(--app-surface-muted)" }}
        _active={{
          bg: "var(--app-surface-muted)",
          boxShadow: "none",
          transform: "none",
        }}
      >
        {translateText("Assist me", language)}
      </Button>
      <HStack justify="space-between" align="flex-start" gap={4} mb={3}>
        <Box>
          <Text fontWeight="800" color="var(--app-text-primary)">
            {translateText("Checklist", language)}
          </Text>
          <Text color="var(--app-text-muted)" fontSize="sm">
            {translateText("Document collection progress", language)}
          </Text>
        </Box>
        <Stack spacing={2} align="flex-end">
          <Text
            color="var(--app-text-muted)"
            fontSize="sm"
            fontWeight="700"
            whiteSpace="nowrap"
          >
            {checklistPercent}% {translateText("complete", language)}
          </Text>
          {assistantChatSaved ? (
            <Badge
              borderRadius="6px"
              bg="rgba(15, 118, 110, 0.12)"
              color="#0f766e"
            >
              {translateText("Saved chat", language)}
            </Badge>
          ) : null}
        </Stack>
      </HStack>
      <Progress
        value={checklistPercent}
        h="6px"
        borderRadius="999px"
        bg="rgba(148, 163, 184, 0.18)"
        sx={{ "& > div": { bg: "#1d4ed8" } }}
        mb={4}
      />
      <Text
        color="var(--app-text-primary)"
        fontWeight="800"
        fontSize="sm"
        mb={3}
      >
        {translateText("Checklist stages", language)}
      </Text>
      <Stack spacing={4}>
        {checklistStageGroups.map((stage) => {
          const completedInStage = stage.items.filter(
            (item) => checklistProgress[getChecklistItemId(item)] === true,
          ).length;

          return (
            <Box key={stage.id}>
              <HStack justify="space-between" align="flex-start" gap={3} mb={2}>
                <Box>
                  <HStack spacing={2} align="center">
                    <Box
                      w="8px"
                      h="8px"
                      borderRadius="full"
                      bg={stage.tone}
                      flexShrink={0}
                    />
                    <Text
                      color="var(--app-text-primary)"
                      fontWeight="800"
                      fontSize="sm"
                    >
                      {translateText(stage.title, language)}
                    </Text>
                  </HStack>
                  <Text color="var(--app-text-muted)" fontSize="xs" mt={1}>
                    {translateText(stage.description, language)}
                  </Text>
                </Box>
                <Badge
                  borderRadius="6px"
                  bg="var(--app-surface-muted)"
                  color="var(--app-text-secondary)"
                  flexShrink={0}
                >
                  {completedInStage}/{stage.items.length}
                </Badge>
              </HStack>
              <Stack spacing={2}>
                {stage.items.map((item) => {
                  const itemId = getChecklistItemId(item);
                  const isDone = checklistProgress[itemId] === true;
                  const detail = getCitizenshipItemDetail(item);

                  return (
                    <Box
                      key={itemId}
                      border="1px solid"
                      borderColor={
                        isDone ? "rgba(29, 78, 216, 0.24)" : "var(--app-border)"
                      }
                      borderRadius="8px"
                      bg={
                        isDone
                          ? "rgba(29, 78, 216, 0.06)"
                          : "var(--app-surface)"
                      }
                      overflow="hidden"
                    >
                      <Accordion allowMultiple>
                        <AccordionItem border="0">
                          <HStack spacing={0} align="stretch">
                            <Box
                              display="flex"
                              alignItems="flex-start"
                              px={3}
                              py={3}
                              flexShrink={0}
                            >
                              <Checkbox
                                isChecked={isDone}
                                onChange={(event) => {
                                  onSelectSound?.();
                                  onChecklistItemChange(
                                    item,
                                    event.target.checked,
                                  );
                                }}
                                colorScheme="blue"
                                aria-label={translateText(item, language)}
                                sx={{
                                  ".chakra-checkbox__control": {
                                    mt: "2px",
                                    borderRadius: "6px",
                                    borderColor: isDone
                                      ? "#1d4ed8"
                                      : "var(--app-border-strong)",
                                  },
                                }}
                              />
                            </Box>
                            <AccordionButton
                              px={0}
                              pe={3}
                              py={3}
                              flex="1"
                              color="var(--app-text-primary)"
                              onClick={onSelectSound}
                              _hover={{ bg: "var(--app-surface-muted)" }}
                            >
                              <Text
                                flex="1"
                                textAlign="start"
                                color={
                                  isDone
                                    ? "var(--app-text-muted)"
                                    : "var(--app-text-secondary)"
                                }
                                fontSize="sm"
                                transition="color 0.16s ease"
                              >
                                {translateText(item, language)}
                              </Text>
                              <AccordionIcon
                                color="var(--app-text-muted)"
                                ms={3}
                              />
                            </AccordionButton>
                          </HStack>
                          <AccordionPanel
                            px={3}
                            pt={0}
                            pb={3}
                            borderTop="1px solid var(--app-border)"
                          >
                            <CitizenshipItemDetail
                              detail={detail}
                              language={language}
                            />
                          </AccordionPanel>
                        </AccordionItem>
                      </Accordion>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};

const ConsulateFinderPanel = ({
  language,
  locationAnswer,
  onLocationChange,
  onSelectSound,
}) => {
  const [locationInput, setLocationInput] = useState(locationAnswer || "");

  useEffect(() => {
    setLocationInput(locationAnswer || "");
  }, [locationAnswer]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextValue = (locationInput || "").trim();
      if (nextValue !== (locationAnswer || "")) {
        onLocationChange(nextValue);
      }
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [locationAnswer, locationInput, onLocationChange]);

  const normalizedLocation = (locationInput || "").trim();
  const query = normalizedLocation
    ? `nearest Mexican consulate ${normalizedLocation}`
    : "nearest Mexican consulate";
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  return (
    <Box
      border="1px solid var(--app-border)"
      borderRadius="8px"
      bg="var(--app-surface)"
      boxShadow="var(--app-shadow-soft)"
      p={{ base: 4, md: 5 }}
      textAlign="start"
    >
      <Stack spacing={3}>
        <Text color="var(--app-text-primary)" fontWeight="800">
          {translateText(CONSULATE_FINDER_TITLE, language)}
        </Text>
        <Text color="var(--app-text-muted)" fontSize="sm">
          {translateText(CONSULATE_FINDER_DESCRIPTION, language)}
        </Text>
        <Input
          value={locationInput}
          onChange={(event) => setLocationInput(event.target.value)}
          placeholder={translateText(CONSULATE_FINDER_PLACEHOLDER, language)}
          bg="var(--app-surface-elevated)"
          borderColor="var(--app-border)"
          _hover={{ borderColor: "var(--app-border-strong)" }}
          _focusVisible={{
            borderColor: "#1d4ed8",
            boxShadow: "0 0 0 1px #1d4ed8",
          }}
        />
        <HStack>
          <Button
            as="a"
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onSelectSound}
            leftIcon={<Icon as={MapPin} boxSize="16px" />}
            bg="#1d4ed8"
            color="white"
            borderRadius="8px"
            _hover={{ bg: "#1e40af" }}
            _active={{ bg: "#1e3a8a" }}
          >
            {translateText(CONSULATE_FINDER_BUTTON, language)}
          </Button>
        </HStack>
      </Stack>
    </Box>
  );
};

const CitizenshipMarkdown = ({ children }) => (
  <Box
    color="inherit"
    fontSize="sm"
    lineHeight="1.72"
    sx={{
      "& > *:last-child": { marginBottom: 0 },
      p: { marginBottom: "0.7rem" },
      "h1, h2, h3": {
        color: "inherit",
        fontWeight: 750,
        letterSpacing: 0,
        lineHeight: 1.28,
        marginTop: "0.95rem",
        marginBottom: "0.4rem",
      },
      h1: { fontSize: "1.02rem" },
      h2: { fontSize: "0.98rem" },
      h3: { fontSize: "0.94rem" },
      "ul, ol": {
        paddingInlineStart: "1.1rem",
        marginBottom: "0.7rem",
        listStylePosition: "outside",
      },
      ul: { listStyleType: "disc" },
      ol: { listStyleType: "decimal" },
      li: {
        marginBottom: "0.35rem",
        paddingInlineStart: "0.18rem",
      },
      "li::marker": {
        color: "currentColor",
        fontWeight: 600,
      },
      strong: { color: "inherit", fontWeight: 760 },
      em: { fontStyle: "italic" },
      a: {
        color: "inherit",
        textDecoration: "underline",
        textUnderlineOffset: "3px",
        textDecorationThickness: "1px",
      },
      code: {
        border: "1px solid var(--app-border)",
        borderRadius: "5px",
        background: "transparent",
        padding: "0.08rem 0.28rem",
        fontSize: "0.92em",
      },
      pre: {
        border: "1px solid var(--app-border)",
        borderRadius: "8px",
        background: "transparent",
        padding: "0.75rem",
        overflowX: "auto",
        marginBottom: "0.7rem",
      },
      "pre code": {
        border: 0,
        background: "transparent",
        padding: 0,
      },
      blockquote: {
        borderInlineStart: "3px solid var(--app-border-strong)",
        paddingInlineStart: "0.75rem",
        marginBottom: "0.7rem",
        color: "inherit",
      },
      table: {
        width: "100%",
        borderCollapse: "collapse",
        marginBottom: "0.7rem",
      },
      "th, td": {
        borderBottom: "1px solid var(--app-border)",
        padding: "0.35rem 0.45rem",
        textAlign: "start",
      },
    }}
  >
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {typeof children === "string" ? children : String(children || "")}
    </ReactMarkdown>
  </Box>
);

const CitizenshipAssistantDrawer = ({
  isOpen,
  onClose,
  answers,
  evaluation,
  checklistProgress,
  language,
  assistantChat,
  onAssistantChatChange,
  onSelectSound,
  onSubmitSound,
}) => {
  const toast = useToast();
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef(null);
  const starterRequestKeyRef = useRef("");
  const chat = useMemo(
    () => normalizeAssistantChat(assistantChat),
    [assistantChat],
  );
  const messages = chat.messages;
  const checklistItems = useMemo(
    () => getCitizenshipChecklistItems(evaluation),
    [evaluation],
  );
  const starterKey = useMemo(
    () =>
      [
        language,
        evaluation.route?.code || "",
        checklistItems.join("|"),
        JSON.stringify(normalizeCitizenshipAnswers(answers)),
      ].join("::"),
    [answers, checklistItems, evaluation.route?.code, language],
  );

  const updateAssistantChat = useCallback(
    (updater) => {
      onAssistantChatChange((current) => {
        const normalized = normalizeAssistantChat(current);
        const next = updater(normalized);
        return normalizeAssistantChat({
          messages: next.messages || normalized.messages,
          saved: next.saved ?? normalized.saved,
          updatedAt: new Date().toISOString(),
        });
      });
    },
    [onAssistantChatChange],
  );

  const patchAssistantMessage = useCallback(
    (messageId, patcher) => {
      updateAssistantChat((current) => ({
        messages: current.messages.map((message) =>
          message.id === messageId ? patcher(message) : message,
        ),
        saved: false,
      }));
    },
    [updateAssistantChat],
  );

  const generateAssistantReply = useCallback(
    async ({ starter = false, userText = "", mode = "chat" } = {}) => {
      const normalizedUserText = userText.trim();
      if (isGenerating || (!starter && !normalizedUserText)) return;

      const assistantMessage = createCitizenshipChatMessage(
        "assistant",
        "",
        false,
      );
      const userMessage = starter
        ? null
        : createCitizenshipChatMessage("user", normalizedUserText, true);

      updateAssistantChat((current) => ({
        messages: [
          ...current.messages,
          ...(userMessage ? [userMessage] : []),
          assistantMessage,
        ].slice(-CITIZENSHIP_ASSISTANT_MAX_MESSAGES),
        saved: false,
      }));

      setIsGenerating(true);

      try {
        if (!citizenshipAssistantModel) {
          throw new Error("citizenship-assistant-unavailable");
        }

        const prompt = starter
          ? buildCitizenshipAssistantStarterPrompt({
              answers,
              evaluation,
              checklistProgress,
              language,
            })
          : mode === "checklistAnalysis"
            ? buildCitizenshipChecklistAnalysisPrompt({
                answers,
                evaluation,
                checklistProgress,
                language,
                messages,
              })
            : buildCitizenshipAssistantFollowUpPrompt({
                answers,
                evaluation,
                checklistProgress,
                language,
                messages,
                userText: normalizedUserText,
              });

        const result =
          await citizenshipAssistantModel.generateContentStream(prompt);
        let fullText = "";

        for await (const chunk of result.stream) {
          const chunkText = getGeminiChunkText(chunk);
          if (!chunkText) continue;

          fullText += chunkText;
          patchAssistantMessage(assistantMessage.id, (message) => ({
            ...message,
            text: fullText,
          }));
        }

        const finalText = fullText.trim()
          ? fullText.trim()
          : getCitizenshipAssistantFallbackMessage(language);

        patchAssistantMessage(assistantMessage.id, (message) => ({
          ...message,
          text: finalText,
          done: true,
        }));
      } catch (error) {
        console.warn("Citizenship assistant error:", error);
        patchAssistantMessage(assistantMessage.id, (message) => ({
          ...message,
          text: getCitizenshipAssistantFallbackMessage(language),
          done: true,
        }));
        toast({
          title: translateText("Assistant unavailable", language),
          description: translateText("Try again in a moment.", language),
          status: "warning",
          duration: 3200,
          isClosable: true,
        });
      } finally {
        setIsGenerating(false);
      }
    },
    [
      answers,
      checklistProgress,
      evaluation,
      isGenerating,
      language,
      messages,
      patchAssistantMessage,
      toast,
      updateAssistantChat,
    ],
  );

  useEffect(() => {
    if (!isOpen || chat.saved || messages.length || isGenerating) return;
    if (starterRequestKeyRef.current === starterKey) return;

    starterRequestKeyRef.current = starterKey;
    generateAssistantReply({ starter: true });
  }, [
    chat.saved,
    generateAssistantReply,
    isGenerating,
    isOpen,
    messages.length,
    starterKey,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [isOpen, messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || isGenerating) return;
    onSubmitSound?.();
    setInput("");
    generateAssistantReply({ userText: text });
  };

  const analyzeChecklist = () => {
    if (isGenerating) return;
    onSubmitSound?.();
    generateAssistantReply({
      userText: translateText("Analyze my checklist", language),
      mode: "checklistAnalysis",
    });
  };

  const saveChat = () => {
    if (!messages.length || isGenerating) return;
    onSubmitSound?.();

    updateAssistantChat((current) => ({
      messages: current.messages.map((message) => ({ ...message, done: true })),
      saved: true,
    }));

    toast({
      title: translateText("Chat saved", language),
      description: translateText(
        "This conversation will stay with your citizenship checklist.",
        language,
      ),
      status: "success",
      duration: 2500,
      isClosable: true,
    });
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay bg="blackAlpha.500" />
      <DrawerContent
        bg="var(--app-surface)"
        color="var(--app-text-primary)"
        w={{ base: "92vw", sm: "420px", md: "480px" }}
        maxW={{ base: "92vw", sm: "420px", md: "480px" }}
        h="100dvh"
        maxH="100dvh"
        overflow="hidden"
        borderLeft="1px solid"
        borderColor="var(--app-border)"
      >
        <DrawerHeader
          borderBottom="1px solid"
          borderColor="var(--app-border)"
          py={4}
        >
          <Flex align="flex-start" justify="space-between" gap={3}>
            <Text
              fontSize="md"
              fontWeight="800"
              color="var(--app-text-primary)"
            >
              {translateText("Citizenship assistant", language)}
            </Text>
            <DrawerCloseButton
              position="static"
              onClick={onSelectSound}
              color="var(--app-text-primary)"
              border="1px solid"
              borderColor="var(--app-border)"
              borderRadius="full"
            />
          </Flex>
        </DrawerHeader>

        <DrawerBody
          p={0}
          display="flex"
          flexDirection="column"
          flex="1"
          minH={0}
          overflow="hidden"
        >
          <Box
            flex="1"
            minH={0}
            overflowY="auto"
            overscrollBehavior="contain"
            px={4}
            py={4}
            sx={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              "&::-webkit-scrollbar": {
                display: "none",
              },
            }}
          >
            <Stack spacing={3}>
              {messages.map((message) => {
                const isUser = message.role === "user";
                return (
                  <Box
                    key={message.id}
                    alignSelf={isUser ? "flex-end" : "flex-start"}
                    maxW="92%"
                    border="1px solid"
                    borderColor={
                      isUser ? "rgba(29, 78, 216, 0.28)" : "var(--app-border)"
                    }
                    bg={
                      isUser
                        ? "rgba(29, 78, 216, 0.1)"
                        : "var(--app-surface-elevated)"
                    }
                    borderRadius="8px"
                    px={3}
                    py={2}
                    textAlign="start"
                  >
                    <HStack spacing={2} mb={1}>
                      <Icon
                        as={isUser ? UserRound : Sparkles}
                        color={isUser ? "#1d4ed8" : "#0f766e"}
                        boxSize="14px"
                      />
                      <Text
                        color="var(--app-text-muted)"
                        fontSize="xs"
                        fontWeight="800"
                      >
                        {isUser
                          ? translateText("You", language)
                          : translateText("Assistant", language)}
                      </Text>
                    </HStack>
                    {message.text ? (
                      <CitizenshipMarkdown>{message.text}</CitizenshipMarkdown>
                    ) : message.done ? null : (
                      <Text color="var(--app-text-secondary)" fontSize="sm">
                        {translateText(
                          "Thinking through your checklist...",
                          language,
                        )}
                      </Text>
                    )}
                  </Box>
                );
              })}
              <Box ref={messagesEndRef} />
            </Stack>
          </Box>

          <Box borderTop="1px solid" borderColor="var(--app-border)" p={4}>
            <Flex
              justify="space-between"
              align="center"
              gap={2}
              mb={3}
              wrap="wrap"
            >
              <HStack spacing={2} align="center">
                <Button
                  type="button"
                  size="sm"
                  leftIcon={<Icon as={Save} boxSize="15px" />}
                  variant="outline"
                  borderRadius="8px"
                  borderColor="var(--app-border)"
                  color="var(--app-text-primary)"
                  bg="var(--app-surface-elevated)"
                  onClick={saveChat}
                  isDisabled={!messages.length || isGenerating || chat.saved}
                  _hover={{ bg: "var(--app-surface-muted)" }}
                >
                  {translateText(chat.saved ? "Saved" : "Save chat", language)}
                </Button>
                {messages.length ? (
                  <Badge
                    borderRadius="6px"
                    bg={
                      chat.saved
                        ? "rgba(15, 118, 110, 0.12)"
                        : "rgba(180, 83, 9, 0.14)"
                    }
                    color={chat.saved ? "#0f766e" : "#b45309"}
                  >
                    {translateText(
                      chat.saved ? "Saved chat" : "Unsaved chat",
                      language,
                    )}
                  </Badge>
                ) : null}
              </HStack>
              <Button
                type="button"
                size="sm"
                leftIcon={<Icon as={ClipboardCheck} boxSize="15px" />}
                onClick={analyzeChecklist}
                isDisabled={isGenerating}
                {...CITIZENSHIP_TEAL_BUTTON_PROPS}
              >
                {translateText("Analyze my checklist", language)}
              </Button>
            </Flex>
            <HStack spacing={2} align="flex-end">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={translateText(
                  "Ask about a checklist item...",
                  language,
                )}
                minH="86px"
                maxH="220px"
                resize="vertical"
                borderRadius="8px"
                bg="var(--app-surface-elevated)"
                borderColor="var(--app-border)"
                color="var(--app-text-primary)"
                _placeholder={{ color: "var(--app-text-muted)" }}
                _focusVisible={{
                  borderColor: "#0f766e",
                  boxShadow: "0 0 0 1px #0f766e",
                }}
              />
              <IconButton
                type="button"
                aria-label={translateText("Send", language)}
                icon={<Icon as={Send} boxSize="18px" />}
                onClick={sendMessage}
                isDisabled={!input.trim() || isGenerating}
                {...CITIZENSHIP_TEAL_BUTTON_PROPS}
                minW="44px"
                h="44px"
              />
            </HStack>
          </Box>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default function CitizenshipGuide() {
  const { language, initLanguage, setLanguage } = useLanguage();
  const toast = useToast();
  const themeMode = useThemeStore((state) => state.themeMode);
  const syncThemeMode = useThemeStore((state) => state.syncThemeMode);
  const playSound = useSoundSettings((state) => state.playSound);
  const pageLanguage = normalizeSupportLanguage(language);
  const pageDirection = getLanguageDirection(pageLanguage);
  const isLightTheme = themeMode === "light";
  const [accountKeys, setAccountKeys] = useState(() => ({
    npub: getStoredNpub(),
    nsec: getStoredNsec(),
  }));
  const { generateNostrKeys, auth } = useDecentralizedIdentity(
    accountKeys.npub,
    accountKeys.nsec,
  );
  const [initialCitizenshipState] = useState(getInitialCitizenshipState);
  const [answers, setAnswers] = useState(initialCitizenshipState.answers);
  const [questionIndex, setQuestionIndex] = useState(
    initialCitizenshipState.questionIndex,
  );
  const [showResults, setShowResults] = useState(
    initialCitizenshipState.showResults,
  );
  const [showIntro, setShowIntro] = useState(initialCitizenshipState.showIntro);
  const [showBenefits, setShowBenefits] = useState(
    initialCitizenshipState.showBenefits,
  );
  const [showPrimer, setShowPrimer] = useState(
    initialCitizenshipState.showPrimer,
  );
  const [checklistProgress, setChecklistProgress] = useState(
    initialCitizenshipState.checklistProgress,
  );
  const [assistantChat, setAssistantChat] = useState(
    initialCitizenshipState.assistantChat,
  );
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isEditingAnswers, setIsEditingAnswers] = useState(false);
  const [isSavingIntro, setIsSavingIntro] = useState(false);
  const [isPreparingAccount, setIsPreparingAccount] = useState(false);
  const [isSigningInWithKey, setIsSigningInWithKey] = useState(false);
  const [accountReloadNonce, setAccountReloadNonce] = useState(0);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const hasTriggeredKeygenRef = useRef(false);
  const accountCreationPromiseRef = useRef(null);
  const hasLoadedProgressRef = useRef(false);
  const lastSavedAssistantChatRef = useRef(
    normalizeSavedAssistantChat(initialCitizenshipState.assistantChat),
  );
  const playSelectSound = useCallback(() => {
    playSound(selectSound);
  }, [playSound]);
  const playSubmitSound = useCallback(() => {
    playSound(submitActionSound);
  }, [playSound]);
  const setHandlingLocation = useCallback((value) => {
    setAnswers((current) => ({ ...current, handlingLocation: value }));
  }, []);
  const setAnswer = (key, value) => {
    lastSavedAssistantChatRef.current = createEmptyAssistantChat();
    setAnswers((current) => ({ ...current, [key]: value }));
    setShowResults(false);
    setAssistantChat(createEmptyAssistantChat());
  };

  const ensureCitizenshipAccount = useCallback(async () => {
    if (typeof window === "undefined") return { npub: "", nsec: "" };

    const storedNpub = getStoredNpub();
    const storedNsec = getStoredNsec();
    if (storedNpub && storedNsec) {
      const nextKeys = { npub: storedNpub, nsec: storedNsec };
      setAccountKeys(nextKeys);
      return nextKeys;
    }

    if (storedNsec?.startsWith("nsec") && !storedNpub) {
      setIsPreparingAccount(true);
      try {
        const result = await auth(storedNsec);
        const nextKeys = {
          npub: result?.user?.npub || getStoredNpub(),
          nsec: storedNsec,
        };
        if (!nextKeys.npub?.startsWith("npub")) {
          throw new Error("Could not derive npub from stored nsec.");
        }
        setAccountKeys(nextKeys);
        return nextKeys;
      } finally {
        setIsPreparingAccount(false);
      }
    }

    if (accountCreationPromiseRef.current) {
      return accountCreationPromiseRef.current;
    }

    setIsPreparingAccount(true);
    accountCreationPromiseRef.current = (async () => {
      const did = await generateNostrKeys("");
      const nextKeys = {
        npub: did?.npub || getStoredNpub(),
        nsec: did?.nsec || getStoredNsec(),
      };
      setAccountKeys(nextKeys);
      if (nextKeys.npub) {
        setAccountReloadNonce((current) => current + 1);
      }
      return nextKeys;
    })();

    try {
      return await accountCreationPromiseRef.current;
    } finally {
      accountCreationPromiseRef.current = null;
      setIsPreparingAccount(false);
    }
  }, [auth, generateNostrKeys]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasStoredKeys = Boolean(getStoredNpub()) && Boolean(getStoredNsec());
    if (hasStoredKeys || hasTriggeredKeygenRef.current) return;

    hasTriggeredKeygenRef.current = true;
    let cancelled = false;
    ensureCitizenshipAccount().catch((error) => {
      if (cancelled) return;
      console.warn("Failed to prepare citizenship account:", error);
      toast({
        title: translateText(
          "Creating your key failed. You can still paste an existing key.",
          pageLanguage,
        ),
        status: "warning",
        duration: 3400,
        isClosable: true,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [ensureCitizenshipAccount, pageLanguage, toast]);

  useEffect(() => {
    initLanguage();
  }, [initLanguage]);

  useEffect(() => {
    let cancelled = false;
    const loadCitizenshipOnboarding = async () => {
      const npub = accountKeys.npub || getStoredNpub();
      if (!npub) {
        hasLoadedProgressRef.current = true;
        return;
      }

      hasLoadedProgressRef.current = false;
      try {
        const snap = await getDoc(doc(database, "users", npub));
        if (cancelled) return;

        const data = snap.exists() ? snap.data() : {};
        const remoteProgress = normalizeCitizenshipProgress(
          data?.citizenshipProgress,
        );
        const localProgress = readLocalCitizenshipProgress();
        const progress = chooseMostRecentProgress(
          remoteProgress,
          localProgress,
        );

        if (progress) {
          setAnswers(progress.answers);
          setQuestionIndex(progress.questionIndex);
          setShowResults(progress.showResults);
          setChecklistProgress(progress.checklistProgress);
          setAssistantChat(progress.assistantChat);
          lastSavedAssistantChatRef.current = normalizeSavedAssistantChat(
            progress.assistantChat,
          );
          writeLocalCitizenshipProgress(progress);
        }

        if (data?.onboardedCitizenship === true || progress) {
          window.localStorage.setItem(
            CITIZENSHIP_ONBOARDED_STORAGE_KEY,
            "true",
          );
          setShowIntro(false);
          setShowBenefits(false);
          setShowPrimer(false);
        }
      } catch (error) {
        console.warn("Failed to load citizenship onboarding state:", error);
      } finally {
        if (!cancelled) {
          hasLoadedProgressRef.current = true;
        }
      }
    };

    loadCitizenshipOnboarding();
    return () => {
      cancelled = true;
    };
  }, [accountKeys.npub, accountReloadNonce]);

  const evaluation = useMemo(
    () => evaluateCitizenshipRoute(answers),
    [answers],
  );
  const visibleQuestions = useMemo(
    () => getVisibleQuestions(answers),
    [answers],
  );
  const currentIndex = Math.min(questionIndex, visibleQuestions.length - 1);
  const currentQuestion = visibleQuestions[currentIndex];
  const totalQuestions = visibleQuestions.length;
  const isLastQuestion = currentIndex >= totalQuestions - 1;
  const canContinue =
    !currentQuestion ||
    currentQuestion.optional ||
    hasQuestionAnswer(currentQuestion, answers);
  const progressValue = totalQuestions
    ? ((currentIndex + (hasQuestionAnswer(currentQuestion, answers) ? 1 : 0)) /
        totalQuestions) *
      100
    : 0;
  const completionPercent =
    showResults || isEditingAnswers ? 100 : Math.round(progressValue);

  useEffect(() => {
    setQuestionIndex((index) =>
      Math.min(index, Math.max(visibleQuestions.length - 1, 0)),
    );
  }, [visibleQuestions.length]);

  useEffect(() => {
    const savedChat = normalizeSavedAssistantChat(assistantChat);
    if (savedChat.saved) {
      lastSavedAssistantChatRef.current = savedChat;
    }
  }, [assistantChat]);

  useEffect(() => {
    if (showIntro || showBenefits || showPrimer || !hasLoadedProgressRef.current)
      return undefined;

    const currentSavedChat = normalizeSavedAssistantChat(assistantChat);
    const progress = buildCitizenshipProgress({
      answers,
      questionIndex,
      showResults,
      checklistProgress,
      assistantChat: currentSavedChat.saved
        ? currentSavedChat
        : lastSavedAssistantChatRef.current,
    });
    writeLocalCitizenshipProgress(progress);

    const timeoutId = window.setTimeout(() => {
      persistCitizenshipProgress(progress).catch((error) => {
        console.warn("Failed to save citizenship progress:", error);
      });
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [
    answers,
    assistantChat,
    checklistProgress,
    questionIndex,
    showResults,
    showIntro,
    showBenefits,
    showPrimer,
  ]);

  const goNext = () => {
    if (!canContinue) return;
    playSubmitSound();
    if (isLastQuestion) {
      setIsEditingAnswers(false);
      setShowResults(true);
      return;
    }
    setQuestionIndex((index) => Math.min(index + 1, totalQuestions - 1));
  };

  const goBack = () => {
    playSelectSound();
    setShowResults(false);
    if (currentIndex === 0 && !isEditingAnswers) {
      setShowBenefits(false);
      setShowPrimer(true);
      return;
    }
    setQuestionIndex((index) => Math.max(index - 1, 0));
  };

  const finishEdits = () => {
    playSubmitSound();
    setIsEditingAnswers(false);
    setShowResults(true);
  };

  const toggleTheme = () => {
    playSelectSound();
    syncThemeMode(isLightTheme ? "dark" : "light");
  };

  const resetQuestions = () => {
    playSubmitSound();
    lastSavedAssistantChatRef.current = createEmptyAssistantChat();
    setAnswers(DEFAULT_ANSWERS);
    setChecklistProgress({});
    setAssistantChat(createEmptyAssistantChat());
    setIsAssistantOpen(false);
    setIsEditingAnswers(false);
    setQuestionIndex(0);
    setShowResults(false);
    const progress = buildCitizenshipProgress({
      answers: DEFAULT_ANSWERS,
      questionIndex: 0,
      showResults: false,
      checklistProgress: {},
      assistantChat: createEmptyAssistantChat(),
    });
    writeLocalCitizenshipProgress(progress);

    if (!showIntro && hasLoadedProgressRef.current) {
      persistCitizenshipProgress(progress).catch((error) => {
        console.warn("Failed to reset citizenship progress:", error);
      });
    }
  };

  /*
  const prefillTestQuestionnaire = () => {
    lastSavedAssistantChatRef.current = createEmptyAssistantChat();
    const testQuestionIndex = Math.max(
      getVisibleQuestions(TEST_PREFILL_ANSWERS).length - 1,
      0,
    );
    setAnswers(TEST_PREFILL_ANSWERS);
    setChecklistProgress({});
    setAssistantChat(createEmptyAssistantChat());
    setIsAssistantOpen(false);
    setQuestionIndex(testQuestionIndex);
    setShowIntro(false);
    setShowPrimer(false);
    setShowResults(true);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(CITIZENSHIP_ONBOARDED_STORAGE_KEY, "true");
    }

    const progress = buildCitizenshipProgress({
      answers: TEST_PREFILL_ANSWERS,
      questionIndex: testQuestionIndex,
      showResults: true,
      checklistProgress: {},
      assistantChat: createEmptyAssistantChat(),
    });

    persistCitizenshipProgress(progress, { markOnboarded: true }).catch((error) => {
      console.warn("Failed to save citizenship test prefill:", error);
    });
  };
  */

  const copySecretKey = async () => {
    let nsec = "";
    try {
      const keys = await ensureCitizenshipAccount();
      nsec = keys.nsec || getStoredNsec();
    } catch (error) {
      console.warn("Failed to prepare citizenship secret key:", error);
      toast({
        title: translateText(
          "Creating your key failed. You can still paste an existing key.",
          pageLanguage,
        ),
        status: "warning",
        duration: 3400,
        isClosable: true,
      });
      return;
    }

    if (!nsec || nsec === "nip07") {
      toast({
        title: translateText("No secret key found", pageLanguage),
        description: translateText(
          "Sign in or create an account before copying your secret key.",
          pageLanguage,
        ),
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(nsec);
      toast({
        title: translateText("Secret key copied", pageLanguage),
        status: "success",
        duration: 2200,
        isClosable: true,
      });
    } catch (error) {
      console.warn("Failed to copy citizenship secret key:", error);
      toast({
        title: translateText("Unable to copy secret key.", pageLanguage),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const signInWithSecretKey = async (secretKey) => {
    const nsec = String(secretKey || "").trim();
    if (!nsec.startsWith("nsec")) {
      toast({
        title: translateText("Invalid secret key", pageLanguage),
        description: translateText(
          "Paste an nsec key that starts with nsec.",
          pageLanguage,
        ),
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    setIsSigningInWithKey(true);
    try {
      const result = await auth(nsec);
      const npub = result?.user?.npub || getStoredNpub();
      if (!npub?.startsWith("npub")) {
        throw new Error("Could not derive npub from nsec.");
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("local_npub", npub);
        window.localStorage.setItem("local_nsec", nsec);
        window.localStorage.removeItem(CITIZENSHIP_PROGRESS_STORAGE_KEY);
        window.localStorage.removeItem(CITIZENSHIP_ONBOARDED_STORAGE_KEY);
      }

      lastSavedAssistantChatRef.current = createEmptyAssistantChat();
      setAnswers(DEFAULT_ANSWERS);
      setChecklistProgress({});
      setAssistantChat(createEmptyAssistantChat());
      setIsAssistantOpen(false);
      setIsEditingAnswers(false);
      setQuestionIndex(0);
      setShowResults(false);
      setShowBenefits(false);
      setShowPrimer(false);
      setShowIntro(true);
      hasLoadedProgressRef.current = false;
      setAccountKeys({ npub, nsec });
      setAccountReloadNonce((current) => current + 1);

      toast({
        title: translateText("Switched account", pageLanguage),
        description: translateText(
          "Your citizenship workspace is now using that key.",
          pageLanguage,
        ),
        status: "success",
        duration: 2600,
        isClosable: true,
      });
      return true;
    } catch (error) {
      console.warn("Failed to sign in to citizenship account:", error);
      toast({
        title: translateText("Unable to sign in.", pageLanguage),
        description: translateText(
          "Paste an nsec key that starts with nsec.",
          pageLanguage,
        ),
        status: "error",
        duration: 3400,
        isClosable: true,
      });
      return false;
    } finally {
      setIsSigningInWithKey(false);
    }
  };

  const goToBenefits = async () => {
    setIsSavingIntro(true);
    try {
      await ensureCitizenshipAccount();
      setShowIntro(false);
      setShowBenefits(true);
      setShowPrimer(false);
    } catch (error) {
      console.warn("Failed to prepare account before benefits:", error);
      toast({
        title: translateText(
          "Creating your key failed. You can still paste an existing key.",
          pageLanguage,
        ),
        status: "warning",
        duration: 3400,
        isClosable: true,
      });
    } finally {
      setIsSavingIntro(false);
    }
  };

  const goToPrimer = () => {
    setShowIntro(false);
    setShowBenefits(false);
    setShowPrimer(true);
  };

  const goBackToBenefits = () => {
    setShowIntro(false);
    setShowPrimer(false);
    setShowBenefits(true);
  };

  const startQuestions = async () => {
    setIsSavingIntro(true);
    try {
      await ensureCitizenshipAccount();
      const progress = buildCitizenshipProgress({
        answers,
        questionIndex,
        showResults,
        checklistProgress,
        assistantChat: normalizeSavedAssistantChat(assistantChat).saved
          ? assistantChat
          : lastSavedAssistantChatRef.current,
      });
      await persistCitizenshipProgress(progress, { markOnboarded: true });
      if (typeof window !== "undefined") {
        window.localStorage.setItem(CITIZENSHIP_ONBOARDED_STORAGE_KEY, "true");
      }
    } catch (error) {
      console.warn("Failed to save citizenship onboarding state:", error);
      toast({
        title: translateText(
          "Unable to save this intro. You can still continue.",
          pageLanguage,
        ),
        status: "warning",
        duration: 3200,
        isClosable: true,
      });
    } finally {
      setIsSavingIntro(false);
      setShowIntro(false);
      setShowBenefits(false);
      setShowPrimer(false);
    }
  };

  const setChecklistItemDone = (item, isDone) => {
    const itemId = getChecklistItemId(item);

    setChecklistProgress((current) => {
      const next = { ...current };
      if (isDone) {
        next[itemId] = true;
      } else {
        delete next[itemId];
      }
      return next;
    });
  };

  const closeAssistant = () => {
    setIsAssistantOpen(false);
    const savedChat = normalizeSavedAssistantChat(assistantChat);
    if (!savedChat.saved) {
      setAssistantChat(lastSavedAssistantChatRef.current);
    }
  };

  const downloadReport = () => {
    if (typeof window === "undefined") return;
    playSubmitSound();

    const reportText = buildCitizenshipReportText({
      answers,
      evaluation,
      checklistProgress,
      language: pageLanguage,
    });
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    const dateStamp = new Date().toISOString().slice(0, 10);

    downloadLink.href = url;
    downloadLink.download = `mexico-citizenship-report-${dateStamp}.txt`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
  };

  const QuestionIcon = currentQuestion?.icon || CircleHelp;
  const localizedCurrentQuestion = getLocalizedQuestion(
    currentQuestion,
    pageLanguage,
  );
  const topControlProps = getTopControlProps(isLightTheme);
  const pageMenuTranslations =
    linksPageTranslations[pageLanguage] || linksPageTranslations.en;

  return (
    <Box
      minH="100vh"
      bg="var(--app-page-bg)"
      color="var(--app-text-primary)"
      dir={pageDirection}
    >
      <Box
        borderBottom="1px solid"
        borderColor="var(--app-border)"
        bg="var(--app-surface)"
      >
        <Container maxW="4xl" px={{ base: 4, md: 6 }} py={3}>
          <Flex align="center" justify="space-between" gap={3} flexWrap="wrap">
            <IconButton
              as="a"
              href="/links"
              onClick={playSelectSound}
              aria-label={translateText("Back", pageLanguage)}
              title={translateText("Back", pageLanguage)}
              size="sm"
              minW="40px"
              h="40px"
              minH="40px"
              borderRadius="full"
              border="1px solid"
              icon={<Icon as={ArrowLeft} boxSize="17px" />}
              {...topControlProps}
            />
            <Flex align="center" justify="flex-end" gap={3} flexWrap="wrap">
              <LanguageMenuFixed
                language={pageLanguage}
                onSelect={setLanguage}
                playSound={playSelectSound}
                translations={pageMenuTranslations}
                isLightTheme={isLightTheme}
              />
              <ThemeModeToggle
                isLightTheme={isLightTheme}
                onToggle={toggleTheme}
                language={pageLanguage}
              />
              <IconButton
                type="button"
                aria-label={translateText("Copy key", pageLanguage)}
                title={translateText("Copy key", pageLanguage)}
                icon={<Icon as={SiMonkeytie} boxSize="17px" />}
                size="sm"
                minW="40px"
                h="40px"
                borderRadius="full"
                border="1px solid"
                onClick={() => {
                  playSubmitSound();
                  copySecretKey();
                }}
                {...topControlProps}
              />
              <IconButton
                type="button"
                aria-label={translateText(PRIVACY_POLICY_TITLE, pageLanguage)}
                title={translateText(PRIVACY_POLICY_TITLE, pageLanguage)}
                onClick={() => {
                  playSelectSound();
                  setIsPrivacyOpen(true);
                }}
                icon={<Icon as={ShieldCheck} boxSize="17px" />}
                size="sm"
                minW="40px"
                h="40px"
                borderRadius="full"
                border="1px solid"
                {...topControlProps}
              />
              {/*
              <Button
                type="button"
                size="sm"
                minH="40px"
                borderRadius="full"
                border="1px solid"
                leftIcon={<Icon as={ClipboardCheck} boxSize="16px" />}
                onClick={prefillTestQuestionnaire}
                {...topControlProps}
              >
                {translateText("Test prefill", pageLanguage)}
              </Button>
              */}
              <IconButton
                type="button"
                aria-label={translateText("Reset questions", pageLanguage)}
                title={translateText("Reset questions", pageLanguage)}
                onClick={resetQuestions}
                icon={<Icon as={RotateCcw} boxSize="17px" />}
                size="sm"
                minW="40px"
                h="40px"
                borderRadius="full"
                border="1px solid"
                {...topControlProps}
              />
            </Flex>
          </Flex>
        </Container>
      </Box>

      <Container maxW="4xl" px={{ base: 4, md: 6 }} py={{ base: 6, md: 10 }}>
        <Stack spacing={5}>
          {showIntro ? (
            <CitizenshipIntro
              language={pageLanguage}
              onCopySecretKey={copySecretKey}
              onStartQuestions={goToBenefits}
              onSignInWithKey={signInWithSecretKey}
              onSelectSound={playSelectSound}
              onSubmitSound={playSubmitSound}
              isStarting={isSavingIntro}
              isPreparingAccount={isPreparingAccount}
              isSigningIn={isSigningInWithKey}
              hasAccountKey={Boolean(
                accountKeys.npub &&
                accountKeys.nsec &&
                accountKeys.nsec !== "nip07",
              )}
            />
          ) : null}

          {showBenefits ? (
            <DualCitizenshipBenefitsScene
              language={pageLanguage}
              onContinue={goToPrimer}
              onSubmitSound={playSubmitSound}
            />
          ) : null}

          {showPrimer ? (
            <DNExpressWorthItPrimer
              language={pageLanguage}
              onBackToBenefits={goBackToBenefits}
              onStartQuestions={startQuestions}
              isStarting={isSavingIntro}
              onSelectSound={playSelectSound}
              onSubmitSound={playSubmitSound}
            />
          ) : null}

          {!showIntro && !showBenefits && !showPrimer && !showResults ? (
            <Box>
              <HStack justify="space-between" mb={2}>
                {isEditingAnswers ? (
                  <Menu placement="bottom-start">
                    <MenuButton
                      as={Button}
                      type="button"
                      size="sm"
                      variant="outline"
                      borderRadius="8px"
                      bg="var(--app-surface-elevated)"
                      borderColor="var(--app-border)"
                      color="var(--app-text-primary)"
                      boxShadow="none"
                      transform="none"
                      aria-label={translateText(
                        "Jump to question",
                        pageLanguage,
                      )}
                      rightIcon={<Icon as={ChevronDown} boxSize="15px" />}
                      _hover={{ bg: "var(--app-surface-muted)" }}
                      _active={{ boxShadow: "none", transform: "none" }}
                    >
                      {translateText("Question", pageLanguage)}{" "}
                      {currentIndex + 1}
                    </MenuButton>
                    <MenuList
                      bg="var(--app-surface-elevated)"
                      borderColor="var(--app-border)"
                      boxShadow="var(--app-shadow-soft)"
                      maxH="320px"
                      overflowY="auto"
                      minW={{ base: "calc(100vw - 32px)", sm: "360px" }}
                      zIndex={20}
                    >
                      {visibleQuestions.map((question, index) => {
                        const localizedQuestion = getLocalizedQuestion(
                          question,
                          pageLanguage,
                        );
                        const isCurrentQuestion = index === currentIndex;
                        const isAnswered = hasQuestionAnswer(question, answers);

                        return (
                          <MenuItem
                            key={question.id}
                            onClick={() => {
                              playSelectSound();
                              setQuestionIndex(index);
                            }}
                            bg={
                              isCurrentQuestion
                                ? "var(--app-surface-muted)"
                                : "transparent"
                            }
                            _hover={{ bg: "var(--app-surface-muted)" }}
                            whiteSpace="normal"
                            alignItems="flex-start"
                            gap={3}
                            py={3}
                          >
                            <Icon
                              as={isAnswered ? Check : CircleHelp}
                              color={
                                isAnswered ? "#0f766e" : "var(--app-text-muted)"
                              }
                              boxSize="16px"
                              mt="3px"
                              flexShrink={0}
                            />
                            <Box textAlign="start">
                              <Text
                                color="var(--app-text-muted)"
                                fontSize="xs"
                                fontWeight="800"
                              >
                                {translateText("Question", pageLanguage)}{" "}
                                {index + 1}
                                {localizedQuestion?.section
                                  ? ` · ${localizedQuestion.section}`
                                  : ""}
                              </Text>
                              <Text
                                color="var(--app-text-primary)"
                                fontSize="sm"
                              >
                                {localizedQuestion?.question ||
                                  question.question}
                              </Text>
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </MenuList>
                  </Menu>
                ) : (
                  <Text
                    color="var(--app-text-muted)"
                    fontSize="sm"
                    fontWeight="700"
                  >
                    {translateText("Question", pageLanguage)} {currentIndex + 1}
                  </Text>
                )}
                <Text color="var(--app-text-muted)" fontSize="sm">
                  {completionPercent}% {translateText("complete", pageLanguage)}
                </Text>
              </HStack>
              <Progress
                value={completionPercent}
                h="8px"
                borderRadius="999px"
                bg="rgba(148, 163, 184, 0.18)"
                sx={{ "& > div": { bg: "#0f766e" } }}
              />
            </Box>
          ) : null}

          {!showIntro && !showBenefits && !showPrimer && !showResults ? (
            <>
              <Box
                border="1px solid"
                borderColor="var(--app-border)"
                borderRadius="8px"
                bg="var(--app-surface)"
                p={{ base: 4, md: 7 }}
              >
                <HStack spacing={3} mb={6} align="center">
                  <Box
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    w="38px"
                    h="38px"
                    borderRadius="8px"
                    bg="rgba(15, 118, 110, 0.14)"
                    color="#0f766e"
                    flexShrink={0}
                  >
                    <Icon as={QuestionIcon} boxSize="20px" />
                  </Box>
                  <Box textAlign="start">
                    <Text
                      color="var(--app-text-muted)"
                      fontSize="xs"
                      fontWeight="800"
                      textTransform="uppercase"
                    >
                      {localizedCurrentQuestion?.section ||
                        translateText("Question", pageLanguage)}
                    </Text>
                  </Box>
                </HStack>

                <QuestionStep
                  question={currentQuestion}
                  value={answers[currentQuestion?.id]}
                  onChange={(value) => setAnswer(currentQuestion.id, value)}
                  language={pageLanguage}
                  onSelectSound={playSelectSound}
                />

                <Flex
                  justify="space-between"
                  align="center"
                  gap={3}
                  mt={8}
                  direction="row"
                  wrap="wrap"
                >
                  <Button
                    variant="outline"
                    borderRadius="8px"
                    bg="var(--app-surface-elevated)"
                    borderColor="var(--app-border)"
                    color="var(--app-text-primary)"
                    boxShadow="none"
                    transform="none"
                    minW="112px"
                    h="48px"
                    isDisabled={currentIndex === 0 && isEditingAnswers}
                    onClick={goBack}
                    _hover={{ bg: "var(--app-surface-muted)" }}
                    _active={{ boxShadow: "none", transform: "none" }}
                  >
                    {translateText("Back", pageLanguage)}
                  </Button>
                  <HStack spacing={3} justify="flex-end">
                    {currentQuestion?.optional ? (
                      <Button
                        variant="ghost"
                        color="var(--app-text-secondary)"
                        boxShadow="none"
                        transform="none"
                        minW="112px"
                        h="48px"
                        onClick={goNext}
                        _hover={{ bg: "var(--app-surface-muted)" }}
                        _active={{ boxShadow: "none", transform: "none" }}
                      >
                        {translateText("Skip", pageLanguage)}
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      borderRadius="8px"
                      bg="rgba(20, 184, 166, 0.1)"
                      borderColor="#14b8a6"
                      borderWidth="2px"
                      color="#2dd4bf"
                      boxShadow="none"
                      transform="none"
                      fontWeight="800"
                      isDisabled={!canContinue}
                      onClick={goNext}
                      minW="112px"
                      h="48px"
                      _hover={{
                        bg: "rgba(20, 184, 166, 0.16)",
                        borderColor: "#2dd4bf",
                        color: "#5eead4",
                      }}
                      _active={{
                        bg: "rgba(20, 184, 166, 0.22)",
                        boxShadow: "none",
                        transform: "none",
                      }}
                      _disabled={{
                        bg: "var(--app-surface-elevated)",
                        borderColor: "var(--app-border)",
                        color: "var(--app-text-muted)",
                        boxShadow: "none",
                        cursor: "not-allowed",
                        opacity: 0.54,
                        transform: "none",
                      }}
                    >
                      {translateText(
                        isLastQuestion ? "Done" : "Next",
                        pageLanguage,
                      )}
                    </Button>
                  </HStack>
                </Flex>
              </Box>
              {isEditingAnswers ? (
                <Flex justify="center" mt={3}>
                  <Button
                    type="button"
                    variant="outline"
                    borderRadius="8px"
                    bg="rgba(20, 184, 166, 0.1)"
                    borderColor="#14b8a6"
                    borderWidth="2px"
                    color="#2dd4bf"
                    boxShadow="none"
                    transform="none"
                    fontWeight="800"
                    w={{ base: "100%", sm: "50%" }}
                    onClick={finishEdits}
                    _hover={{
                      bg: "rgba(20, 184, 166, 0.16)",
                      borderColor: "#2dd4bf",
                      color: "#5eead4",
                    }}
                    _active={{
                      bg: "rgba(20, 184, 166, 0.22)",
                      boxShadow: "none",
                      transform: "none",
                    }}
                  >
                    {translateText("Finish edits", pageLanguage)}
                  </Button>
                </Flex>
              ) : null}
            </>
          ) : !showIntro && !showBenefits && !showPrimer ? (
            <Flex
              alignSelf="stretch"
              justify="space-between"
              gap={3}
              direction={{ base: "column", sm: "row" }}
            >
              <Button
                variant="outline"
                borderRadius="8px"
                bg="var(--app-surface-elevated)"
                borderColor="var(--app-border)"
                color="var(--app-text-primary)"
                boxShadow="none"
                transform="none"
                onClick={() => {
                  playSelectSound();
                  setIsEditingAnswers(true);
                  setShowResults(false);
                }}
                _hover={{ bg: "var(--app-surface-muted)" }}
                _active={{ boxShadow: "none", transform: "none" }}
              >
                {translateText("Edit answers", pageLanguage)}
              </Button>
              <Button
                leftIcon={<Icon as={Download} boxSize="16px" />}
                bg="#1d4ed8"
                color="white"
                borderRadius="8px"
                onClick={downloadReport}
                _hover={{ bg: "#1e40af" }}
                _active={{ bg: "#1e3a8a" }}
              >
                {translateText("Download report", pageLanguage)}
              </Button>
            </Flex>
          ) : null}

          {!showIntro && !showBenefits && !showPrimer && showResults ? (
            <Stack spacing={5}>
              <ResultPanel
                evaluation={evaluation}
                completionPercent={completionPercent}
                language={pageLanguage}
                isLightTheme={isLightTheme}
                onSelectSound={playSelectSound}
              />
              <ChecklistPanel
                evaluation={evaluation}
                language={pageLanguage}
                checklistProgress={checklistProgress}
                onChecklistItemChange={setChecklistItemDone}
                onOpenAssistant={() => setIsAssistantOpen(true)}
                assistantChatSaved={assistantChat.saved}
                isLightTheme={isLightTheme}
                onSelectSound={playSelectSound}
              />
              <ConsulateFinderPanel
                language={pageLanguage}
                locationAnswer={answers.handlingLocation}
                onLocationChange={setHandlingLocation}
                onSelectSound={playSelectSound}
              />
              <CitizenshipAssistantDrawer
                isOpen={isAssistantOpen}
                onClose={closeAssistant}
                answers={answers}
                evaluation={evaluation}
                checklistProgress={checklistProgress}
                language={pageLanguage}
                assistantChat={assistantChat}
                onAssistantChatChange={setAssistantChat}
                onSelectSound={playSelectSound}
                onSubmitSound={playSubmitSound}
              />
            </Stack>
          ) : null}
        </Stack>
      </Container>
      <Modal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        isCentered
      >
        <ModalOverlay />
        <ModalContent
          bg="var(--app-surface)"
          color="var(--app-text-primary)"
          border="4px solid"
          borderColor="#0f766e"
        >
          <ModalHeader>
            <HStack spacing={2}>
              <Icon as={ShieldCheck} color="#0f766e" />
              <Text>{translateText(PRIVACY_POLICY_TITLE, pageLanguage)}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={5}>
            <Stack spacing={4} fontSize="sm" color="var(--app-text-secondary)">
              {PRIVACY_POLICY_COPY.map((paragraph) => (
                <Text key={paragraph}>
                  {translateText(paragraph, pageLanguage)}
                </Text>
              ))}
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
