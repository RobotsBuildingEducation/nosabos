// components/HelpChatFab.jsx
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Badge,
  Box,
  Button,
  HStack,
  IconButton,
  Input,
  Text,
  Tooltip,
  VStack,
  useDisclosure,
  useToast,
  Link as ChakraLink,
  Heading,
  UnorderedList,
  OrderedList,
  ListItem,
  Code as ChakraCode,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Switch,
  FormControl,
  FormLabel,
  Divider,
  useBreakpointValue,
  Flex,
  Textarea,
  Spinner,
} from "@chakra-ui/react";
import {
  FaPaperPlane,
  FaStop,
  FaMicrophone,
  FaSave,
  FaTrash,
  FaBars,
  FaPlus,
} from "react-icons/fa";
import { MdOutlineSupportAgent } from "react-icons/md";
import { TTS_LANG_TAG, getRandomVoice, getTTSPlayer } from "../utils/tts";

const SAVED_CHATS_KEY = "nosabos_helpchat_saved_chats";
const MORPHEME_MODE_KEY = "nosabos_helpchat_morpheme_mode";

// Language colors for saved chat badges
const LANG_COLORS = {
  es: { bg: "yellow.500", label: "ES" },
  en: { bg: "blue.600", label: "EN" },
  pt: { bg: "green.600", label: "PT" },
  fr: { bg: "purple.600", label: "FR" },
  it: { bg: "orange.600", label: "IT" },
  nl: { bg: "orange.400", label: "NL" },
  nah: { bg: "teal.600", label: "NAH" },
  ru: { bg: "cyan.600", label: "RU" },
  de: { bg: "gray.500", label: "DE" },
  el: { bg: "blue.400", label: "EL" },
  pl: { bg: "pink.600", label: "PL" },
  ga: { bg: "green.500", label: "GA" },
  yua: { bg: "purple.500", label: "YUA" },
};

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { simplemodel } from "../firebaseResources/firebaseResources";
import { translations } from "../utils/translation";
import { FiSend } from "react-icons/fi";
import { RiVolumeUpLine } from "react-icons/ri";
import useSoundSettings from "../hooks/useSoundSettings";
import selectSound from "../assets/select.mp3";
import submitActionSound from "../assets/submitaction.mp3";
import clickSound from "../assets/click.mp3";
import BottomDrawerDragHandle from "./BottomDrawerDragHandle";
import useBottomDrawerSwipeDismiss from "../hooks/useBottomDrawerSwipeDismiss";
import VoiceOrb from "./VoiceOrb";
import { useThemeStore } from "../useThemeStore";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  normalizePracticeLanguage,
  normalizeSupportLanguage,
} from "../constants/languages";

const REALTIME_MODEL =
  (import.meta.env.VITE_REALTIME_MODEL || "gpt-realtime-mini") + "";

const REALTIME_URL = `${
  import.meta.env.VITE_REALTIME_URL
}?model=gpt-realtime-mini/exchangeRealtimeSDP?model=${encodeURIComponent(
  REALTIME_MODEL,
)}`;
const AUTO_DISCONNECT_MS = 15000;
const APP_SURFACE = "var(--app-surface)";
const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_BORDER = "var(--app-border)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_MUTED = "var(--app-text-muted)";

function supportCopy(lang, en, es, it) {
  if (lang === "it") return it || en;
  if (lang === "es") return es || en;
  return en;
}

/**
 * Small Markdown renderer mapped to Chakra components
 */
function Markdown({ children }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <Text mb={2}>{children}</Text>,
        a: ({ href, children }) => (
          <ChakraLink href={href} isExternal textDecoration="underline">
            {children}
          </ChakraLink>
        ),
        strong: ({ children }) => <Text as="strong">{children}</Text>,
        em: ({ children }) => <Text as="em">{children}</Text>,
        h1: ({ children }) => (
          <Heading as="h1" size="lg" mt={3} mb={2}>
            {children}
          </Heading>
        ),
        h2: ({ children }) => (
          <Heading as="h2" size="md" mt={3} mb={2}>
            {children}
          </Heading>
        ),
        h3: ({ children }) => (
          <Heading as="h3" size="sm" mt={3} mb={2}>
            {children}
          </Heading>
        ),
        ul: ({ children }) => (
          <UnorderedList pl={5} mb={2}>
            {children}
          </UnorderedList>
        ),
        ol: ({ children }) => (
          <OrderedList pl={5} mb={2}>
            {children}
          </OrderedList>
        ),
        li: ({ children }) => <ListItem>{children}</ListItem>,
        blockquote: ({ children }) => (
          <Box
            pl={3}
            borderLeft="3px solid"
            borderColor="gray.600"
            opacity={0.95}
            my={2}
          >
            <Text>{children}</Text>
          </Box>
        ),
        code: ({ inline, children }) =>
          inline ? (
            <ChakraCode fontSize="0.95em">{children}</ChakraCode>
          ) : (
            <Box
              as="pre"
              bg="gray.900"
              border="1px solid"
              borderColor="gray.700"
              rounded="md"
              p={3}
              overflowX="auto"
              fontSize="0.95em"
              lineHeight="1.45"
            >
              <ChakraCode whiteSpace="pre">{children}</ChakraCode>
            </Box>
          ),
        hr: () => <Box as="hr" my={3} borderColor="gray.700" />,
        table: ({ children }) => (
          <Box as="div" overflowX="auto" my={2}>
            <Box as="table" width="100%" borderCollapse="collapse">
              {children}
            </Box>
          </Box>
        ),
        th: ({ children }) => (
          <Box
            as="th"
            textAlign="left"
            borderBottom="1px solid"
            borderColor="gray.700"
            py={1}
            pr={3}
          >
            {children}
          </Box>
        ),
        td: ({ children }) => (
          <Box
            as="td"
            borderBottom="1px solid"
            borderColor="gray.800"
            py={1}
            pr={3}
          >
            {children}
          </Box>
        ),
      }}
    >
      {typeof children === "string" ? children : String(children || "")}
    </ReactMarkdown>
  );
}

/**
 * Floating Help Chat (Gemini, client-side streaming via generateContentStream)
 */
const HelpChatFab = forwardRef(
  (
    {
      progress,
      appLanguage = "en",
      isOpen: controlledIsOpen,
      onOpen: controlledOnOpen,
      onClose: controlledOnClose,
      showFloatingTrigger = true,
    },
    ref,
  ) => {
    const disclosure = useDisclosure();
    const isControlled = typeof controlledIsOpen === "boolean";
    const isOpen = isControlled ? controlledIsOpen : disclosure.isOpen;
    const onOpen = controlledOnOpen || disclosure.onOpen;
    const onClose = controlledOnClose || disclosure.onClose;
    const chatSwipeDismiss = useBottomDrawerSwipeDismiss({
      isOpen,
      onClose,
    });
    const toast = useToast();
    const playSound = useSoundSettings((s) => s.playSound);
    const themeMode = useThemeStore((s) => s.themeMode);
    const isLightTheme = themeMode === "light";
    const uiLang = normalizeSupportLanguage(
      appLanguage,
      DEFAULT_SUPPORT_LANGUAGE,
    );

    const ui = translations[uiLang] || translations.en;
    const helpUi = useMemo(
      () => ({
        noMessagesTitle: supportCopy(uiLang, "No messages", "Sin mensajes", "Nessun messaggio"),
        noMessagesDesc: supportCopy(
          uiLang,
          "No messages to save.",
          "No hay mensajes para guardar.",
          "Non ci sono messaggi da salvare.",
        ),
        savedChatTitle: supportCopy(uiLang, "Saved chat", "Chat guardado", "Chat salvata"),
        chatSavedTitle: supportCopy(uiLang, "Chat saved", "Chat guardado", "Chat salvata"),
        chatDeletedTitle: supportCopy(uiLang, "Chat deleted", "Chat eliminado", "Chat eliminata"),
        requestFailed: supportCopy(
          uiLang,
          "Sorry, I couldn’t complete that request. Please try again.",
          "Lo siento, no pude completar esa solicitud. Inténtalo nuevamente.",
          "Mi dispiace, non sono riuscito a completare la richiesta. Riprova.",
        ),
        chatErrorTitle: supportCopy(uiLang, "Chat error", "Error de chat", "Errore chat"),
        connectionErrorTitle: supportCopy(
          uiLang,
          "Connection error",
          "Error de conexión",
          "Errore di connessione",
        ),
        yourChats: supportCopy(uiLang, "Your chats", "Tus chats", "Le tue chat"),
        noSavedChats: supportCopy(
          uiLang,
          "No saved chats",
          "No hay chats guardados",
          "Nessuna chat salvata",
        ),
        delete: supportCopy(uiLang, "Delete", "Eliminar", "Elimina"),
        morphemeMode: supportCopy(
          uiLang,
          "Morpheme mode",
          "Modo morfemas",
          "Modalità morfemi",
        ),
        breakDownWords: supportCopy(
          uiLang,
          "Break down words",
          "Desglosa palabras",
          "Scomponi le parole",
        ),
        newChat: supportCopy(uiLang, "New chat", "Nuevo chat", "Nuova chat"),
        help: supportCopy(uiLang, "Help", "Ayuda", "Aiuto"),
        menu: supportCopy(uiLang, "Menu", "Menú", "Menu"),
        morphemes: supportCopy(uiLang, "Morphemes", "Morfemas", "Morfemi"),
        saveChat: supportCopy(uiLang, "Save chat", "Guardar", "Salva chat"),
        emptyPrompt: supportCopy(
          uiLang,
          "What do you want to learn today?",
          "¿Qué quieres aprender hoy?",
          "Che cosa vuoi imparare oggi?",
        ),
        stopVoiceChat: supportCopy(
          uiLang,
          "Stop voice chat",
          "Detener chat de voz",
          "Interrompi chat vocale",
        ),
        startVoiceChat: supportCopy(
          uiLang,
          "Start voice chat",
          "Iniciar chat de voz",
          "Avvia chat vocale",
        ),
        play: supportCopy(uiLang, "Play", "Reproducir", "Riproduci"),
        askPlaceholder: supportCopy(
          uiLang,
          "Ask about this lesson...",
          "Pregunta sobre esta lección...",
          "Chiedi qualcosa su questa lezione...",
        ),
        send: supportCopy(uiLang, "Send", "Enviar", "Invia"),
        stop: supportCopy(uiLang, "Stop", "Detener", "Ferma"),
      }),
      [uiLang],
    );

    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [messages, setMessages] = useState([]); // {id, role, text, done}
    const stopRef = useRef(false);
    const scrollRef = useRef(null);
    const ttsAudioRef = useRef(null);
    const ttsPcRef = useRef(null);
    const [replayingId, setReplayingId] = useState(null);
    const [replayLoadingId, setReplayLoadingId] = useState(null);
    const inputRef = useRef(null);

    // Drawer and saved chats state
    const drawerDisclosure = useDisclosure();
    const [savedChats, setSavedChats] = useState(() => {
      try {
        const stored = localStorage.getItem(SAVED_CHATS_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    });
    const [morphemeMode, setMorphemeMode] = useState(() => {
      try {
        const stored = localStorage.getItem(MORPHEME_MODE_KEY);
        return stored === "true";
      } catch {
        return false;
      }
    });

    // Realtime voice chat state
    const [realtimeStatus, setRealtimeStatus] = useState("disconnected"); // disconnected | connecting | connected
    const audioRef = useRef(null);
    const pcRef = useRef(null);
    const localRef = useRef(null);
    const dcRef = useRef(null);
    const realtimeAliveRef = useRef(false);
    const realtimeAutoStopTimerRef = useRef(null);
    const stopRealtimeRef = useRef(() => {});
    const currentAssistantIdRef = useRef(null);
    const messageSortOrderRef = useRef(0);
    const realtimeTurnQueueRef = useRef([]);
    const realtimeResponseToMessageRef = useRef(new Map());

    // -- helpers ---------------------------------------------------------------

    const getOrderedMessages = (list = []) =>
      list
        .map((message, index) => ({
          message,
          index,
          sortOrder: Number.isFinite(message?.sortOrder)
            ? message.sortOrder
            : index,
        }))
        .sort((a, b) => {
          if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
          const aCreatedAt = Number.isFinite(a.message?.createdAt)
            ? a.message.createdAt
            : 0;
          const bCreatedAt = Number.isFinite(b.message?.createdAt)
            ? b.message.createdAt
            : 0;
          if (aCreatedAt !== bCreatedAt) return aCreatedAt - bCreatedAt;
          return a.index - b.index;
        })
        .map(({ message }) => message);

    const pushMessage = (m) => {
      const nextSortOrder = Number.isFinite(m?.sortOrder)
        ? m.sortOrder
        : messageSortOrderRef.current++;
      setMessages((prev) => [
        ...prev,
        {
          createdAt: Date.now(),
          sortOrder: nextSortOrder,
          ...m,
        },
      ]);
    };

    const updateMessageById = (id, updater) =>
      setMessages((prev) => {
        const idx = prev.findIndex((message) => message.id === id);
        if (idx < 0) return prev;
        const updated = [...prev];
        updated[idx] = updater(updated[idx]);
        return updated;
      });

    const patchLastAssistant = (updater) =>
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].role === "assistant") {
            next[i] = updater(next[i]);
            break;
          }
        }
        return next;
      });

    const reserveRealtimeTurn = () => {
      const userSortOrder = messageSortOrderRef.current++;
      const assistantSortOrder = messageSortOrderRef.current++;
      const turn = {
        id: crypto.randomUUID?.() || `turn-${Date.now()}`,
        userSortOrder,
        assistantSortOrder,
        userMessageId: null,
        assistantMessageId: null,
        responseId: null,
        userDone: false,
        assistantDone: false,
      };
      realtimeTurnQueueRef.current.push(turn);
      return turn;
    };

    const ensurePendingRealtimeTurn = () => {
      const queue = realtimeTurnQueueRef.current;
      for (let i = queue.length - 1; i >= 0; i -= 1) {
        if (!queue[i].responseId) return queue[i];
      }
      return reserveRealtimeTurn();
    };

    const findRealtimeTurnAwaitingTranscript = () =>
      realtimeTurnQueueRef.current.find((turn) => !turn.userDone) ||
      ensurePendingRealtimeTurn();

    const findRealtimeTurnForResponse = (responseId) => {
      if (responseId) {
        const existing = realtimeTurnQueueRef.current.find(
          (turn) => turn.responseId === responseId,
        );
        if (existing) return existing;
      }

      const turn =
        realtimeTurnQueueRef.current.find(
          (candidate) => !candidate.responseId,
        ) || reserveRealtimeTurn();

      if (responseId) {
        turn.responseId = responseId;
      }
      return turn;
    };

    const pruneCompletedRealtimeTurns = () => {
      while (realtimeTurnQueueRef.current.length > 0) {
        const firstTurn = realtimeTurnQueueRef.current[0];
        if (!firstTurn.userDone || !firstTurn.assistantDone) break;
        if (firstTurn.responseId) {
          realtimeResponseToMessageRef.current.delete(firstTurn.responseId);
        }
        realtimeTurnQueueRef.current.shift();
      }
    };

    const ensureRealtimeAssistantMessage = (turn, responseId) => {
      if (turn.assistantMessageId) {
        if (responseId) {
          realtimeResponseToMessageRef.current.set(
            responseId,
            turn.assistantMessageId,
          );
        }
        return turn.assistantMessageId;
      }

      const assistantId = crypto.randomUUID?.() || String(Date.now());
      turn.assistantMessageId = assistantId;
      if (responseId) {
        turn.responseId = responseId;
        realtimeResponseToMessageRef.current.set(responseId, assistantId);
      }

      pushMessage({
        id: assistantId,
        role: "assistant",
        text: "",
        done: false,
        sortOrder: turn.assistantSortOrder,
      });

      return assistantId;
    };

    const hasMorphemeSection = (text) =>
      /(^|\n)\s*\*\*[^*\n]+\*\*\s*=\s*.+\+/m.test(String(text || ""));

    const nameForLanguage = useCallback((code) => {
      return (
        {
          es: "Spanish (español)",
          en: "English",
          pt: "Portuguese (português brasileiro)",
          fr: "French (français)",
          it: "Italian (italiano)",
          nl: "Dutch (Nederlands)",
          nah: "Eastern Huasteca Nahuatl (náhuatl huasteco oriental)",
          ru: "Russian (русский)",
          de: "German (Deutsch)",
          el: "Greek (Ελληνικά)",
          pl: "Polish (polski)",
          ga: "Irish (Gaeilge)",
          yua: "Yucatec Maya (maaya t'aan)",
        }[code] || code
      );
    }, []);

    const resizeTextarea = useCallback(() => {
      const el = inputRef.current;
      if (!el) return;
      const maxHeight = 140;
      el.style.height = "auto";
      const nextHeight = Math.min(el.scrollHeight, maxHeight);
      el.style.height = `${nextHeight}px`;
      el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
    }, []);

    // Split assistant text into main + gloss (lines starting with "// ")
    const splitMainAndGloss = (text) => {
      const lines = String(text || "").split("\n");
      const i = lines.findIndex((l) => l.trim().startsWith("// "));
      if (i === -1) return { main: text, gloss: "" };
      const gloss = lines[i].replace(/^\/\/\s?/, "").trim();
      const main = lines
        .filter((_, idx) => idx !== i)
        .join("\n")
        .trim();
      return { main, gloss };
    };

    // -- Saved chats & morpheme mode functions ----------------------------------

    const saveCurrentChat = useCallback(() => {
      if (messages.length === 0) {
        toast({
          status: "warning",
          title: helpUi.noMessagesTitle,
          description: helpUi.noMessagesDesc,
        });
        return;
      }

      const ordered = getOrderedMessages(messages);
      const newChat = {
        id: crypto.randomUUID?.() || String(Date.now()),
        title:
          ordered.find((m) => m.role === "user")?.text?.slice(0, 50) ||
          helpUi.savedChatTitle,
        messages: ordered,
        savedAt: Date.now(),
        targetLang: progress?.targetLang || "es",
      };

      const updated = [newChat, ...savedChats].slice(0, 20); // Keep max 20 chats
      setSavedChats(updated);
      try {
        localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save to localStorage:", e);
      }

      toast({
        status: "success",
        title: helpUi.chatSavedTitle,
        duration: 2000,
      });
    }, [messages, savedChats, helpUi, progress?.targetLang, toast]);

    const loadSavedChat = useCallback(
      (chat) => {
        const loadedMessages = Array.isArray(chat?.messages)
          ? chat.messages
          : [];
        setMessages(
          loadedMessages.map((message, index) => ({
            ...message,
            sortOrder: Number.isFinite(message?.sortOrder)
              ? message.sortOrder
              : index,
          })),
        );
        currentAssistantIdRef.current = null;
        realtimeTurnQueueRef.current = [];
        realtimeResponseToMessageRef.current.clear();
        drawerDisclosure.onClose();
      },
      [drawerDisclosure],
    );

    const deleteSavedChat = useCallback(
      (chatId, e) => {
        e.stopPropagation();
        const updated = savedChats.filter((c) => c.id !== chatId);
        setSavedChats(updated);
        try {
          localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(updated));
        } catch (err) {
          console.warn("Could not update localStorage:", err);
        }
        toast({
          status: "info",
          title: helpUi.chatDeletedTitle,
          duration: 1000,
        });
      },
      [savedChats, helpUi, toast],
    );

    const startNewChat = useCallback(() => {
      currentAssistantIdRef.current = null;
      messageSortOrderRef.current = 0;
      realtimeTurnQueueRef.current = [];
      realtimeResponseToMessageRef.current.clear();
      setMessages([]);
      setInput("");
      drawerDisclosure.onClose();
    }, [drawerDisclosure]);

    const toggleMorphemeMode = useCallback((e) => {
      const newValue = e.target.checked;
      setMorphemeMode(newValue);
      try {
        localStorage.setItem(MORPHEME_MODE_KEY, String(newValue));
      } catch (err) {
        console.warn("Could not save morpheme mode:", err);
      }
    }, []);

    // Build system instruction — PRIMARY ANSWER IS IN THE PRACTICE/TARGET LANGUAGE
    const buildInstruction = useCallback(() => {
      const lvl = progress?.level || "beginner";

      // Resolve support language (what the learner already speaks)
      const supportRaw =
        progress?.supportLang === "bilingual"
          ? "bilingual"
          : normalizeSupportLanguage(
              progress?.supportLang,
              DEFAULT_SUPPORT_LANGUAGE,
            );
      const supportLang =
        supportRaw === "bilingual"
          ? normalizeSupportLanguage(appLanguage, DEFAULT_SUPPORT_LANGUAGE)
          : supportRaw;

      const targetLang = normalizePracticeLanguage(progress?.targetLang, "es"); // practice language
      const primaryLang = supportLang; // replies must follow the learner's support language
      const persona = (progress?.voicePersona || "").slice(0, 200);
      const focus = (progress?.helpRequest || "").slice(0, 200);
      const showTranslations =
        typeof progress?.showTranslations === "boolean"
          ? progress.showTranslations
          : true;

      const strict =
        primaryLang === "es"
          ? "Responde totalmente en español (idioma de apoyo/soporte), aunque el usuario escriba en otro idioma."
          : primaryLang === "en"
            ? "Respond entirely in English (the support language), even if the user writes in another language."
            : `Respond entirely in ${nameForLanguage(
                primaryLang,
              )} (support language), even if the user writes in another language.`;

      const levelHint = (() => {
        if (primaryLang === "es") {
          return lvl === "beginner"
            ? "Usa oraciones cortas y simples."
            : lvl === "intermediate"
              ? "Sé conciso y natural."
              : "Sé muy breve y con tono nativo.";
        }
        if (primaryLang === "en") {
          return lvl === "beginner"
            ? "Use short, simple sentences."
            : lvl === "intermediate"
              ? "Be concise and natural."
              : "Be very succinct and native-like.";
        }
        return lvl === "beginner"
          ? "Use short, simple sentences."
          : lvl === "intermediate"
            ? "Be concise and natural."
            : "Be succinct and native-like.";
      })();

      // Gloss (secondary) language: translate to the practice language when different
      const glossLang =
        showTranslations && targetLang !== primaryLang ? targetLang : null;

      const glossHuman = glossLang ? nameForLanguage(glossLang) : "";
      const supportNote = `Explica y guía en ${nameForLanguage(
        primaryLang,
      )}. Incluye ejemplos o frases en ${nameForLanguage(
        targetLang,
      )} solo cuando ayuden, pero mantén la explicación en ${nameForLanguage(
        primaryLang,
      )}.`;

      // Morpheme mode instructions - placed at START for priority
      const morphemePrefix = morphemeMode
        ? `🔬 MORPHEME MODE IS ON - YOU MUST INCLUDE A MORPHEME BREAKDOWN SECTION.

You MUST include a short ${nameForLanguage(targetLang)} example sentence (1 sentence max) in your reply.
Immediately after your reply, add the morpheme breakdown with NO heading, using this exact format for each word:

**word** = part1 + part2 + part3
- part1: meaning
- part2: meaning
→ "English translation"

Example: **hablaremos** = habl + ar + emos
- habl-: root "speak"
- -ar-: infinitive marker
- -emos: future 1st person plural
→ "we will speak"

DO NOT SKIP THE MORPHEME BREAKDOWN.

`
        : "";

      const glossLine = glossLang
        ? `Después de la explicación, añade una sola línea de ejemplo o traducción en ${glossHuman}. Ponla en una nueva línea que comience con "// ".`
        : "No añadas traducciones adicionales.";

      return [
        morphemePrefix,
        "You are a helpful language study buddy for quick questions.",
        strict,
        `The learner practices ${nameForLanguage(
          targetLang,
        )}; their support/UI language is ${nameForLanguage(primaryLang)}.`,
        levelHint,
        persona ? `Persona: ${persona}.` : "",
        focus ? `Focus area: ${focus}.` : "",
        supportNote,
        morphemeMode
          ? "Keep main reply ≤ 80 words, include exactly one target-language example sentence, then ADD the morpheme breakdown."
          : "Keep replies ≤ 60 words.",
        glossLine,
        "Use concise Markdown when helpful (bullets, **bold**, code, tables).",
      ]
        .filter(Boolean)
        .join(" ");
    }, [progress, appLanguage, morphemeMode, nameForLanguage]);

    useEffect(() => {
      resizeTextarea();
    }, [input, resizeTextarea]);

    useEffect(() => {
      const maxSortOrder = messages.reduce((maxOrder, message, index) => {
        const order = Number.isFinite(message?.sortOrder)
          ? message.sortOrder
          : index;
        return Math.max(maxOrder, order);
      }, -1);
      messageSortOrderRef.current = Math.max(
        messageSortOrderRef.current,
        maxSortOrder + 1,
      );
    }, [messages]);

    // Build a simple text history block (last ~6 messages) so we still have some context
    const buildHistoryBlock = useCallback(() => {
      const last = getOrderedMessages(messages).slice(-6);
      if (!last.length) return "";
      const lines = last.map((m) =>
        m.role === "user" ? `User: ${m.text}` : `Assistant: ${m.text}`,
      );
      return lines.join("\n");
    }, [messages]);

    // -- actions ---------------------------------------------------------------

    const normalizeQuestion = useCallback((raw, fallback = "") => {
      const isEventLike =
        raw &&
        typeof raw === "object" &&
        ("nativeEvent" in raw || "currentTarget" in raw || "target" in raw);

      const candidate = isEventLike ? undefined : raw;

      if (typeof candidate === "string") return candidate.trim();

      if (
        candidate &&
        typeof candidate === "object" &&
        typeof candidate.text === "string"
      ) {
        return candidate.text.trim();
      }

      if (candidate == null) {
        return typeof fallback === "string"
          ? fallback.trim()
          : String(fallback ?? "").trim();
      }

      return String(candidate).trim();
    }, []);

    const handleSend = useCallback(
      async (overrideText) => {
        const question = normalizeQuestion(overrideText, input);
        if (!question || sending) return;

        if (!simplemodel) {
          return toast({
            status: "error",
            title: "Gemini not initialized",
            description: "simplemodel is unavailable.",
          });
        }

        setInput("");
        stopRef.current = false;

        const instruction = buildInstruction();
        const historyBlock = buildHistoryBlock();

        const prompt =
          instruction +
          "\n\n" +
          (historyBlock
            ? `Previous conversation (for context, keep answers concise):\n${historyBlock}\n\n`
            : "") +
          `User question:\n${question}`;

        const userId = crypto.randomUUID?.() || String(Date.now());
        pushMessage({ id: userId, role: "user", text: question, done: true });

        const assistantId = crypto.randomUUID?.() || String(Date.now() + 1);
        pushMessage({
          id: assistantId,
          role: "assistant",
          text: "",
          done: false,
        });

        try {
          setSending(true);

          // 🔥 STREAMING – same pattern as your working component
          const result = await simplemodel.generateContentStream(prompt);

          let fullText = "";

          for await (const chunk of result.stream) {
            if (stopRef.current) break;

            const chunkText =
              typeof chunk.text === "function" ? chunk.text() : "";

            if (!chunkText) continue;

            fullText += chunkText;

            // Update the assistant message every chunk
            const current = fullText;
            patchLastAssistant((m) => ({ ...m, text: current }));
          }

          let finalText = fullText;

          if (morphemeMode && !hasMorphemeSection(finalText)) {
            const targetLang = progress?.targetLang || "es";
            const targetLangName = nameForLanguage(targetLang);
            const fallbackPrompt = [
              "You missed the morpheme breakdown section.",
              `Target language: ${targetLangName}.`,
              "Return ONLY the morpheme breakdown in this exact format (no heading):",
              "**word** = part1 + part2 + part3",
              "- part1: meaning",
              "- part2: meaning",
              '→ "English translation"',
              "",
              "If the answer below includes a target-language example sentence, use it.",
              `Otherwise, create ONE short ${targetLangName} sentence related to the question.`,
              "",
              `User question: ${question}`,
              "Assistant answer:",
              finalText,
            ].join("\n");

            const fallbackResp =
              await simplemodel.generateContent(fallbackPrompt);
            const fallbackText =
              (typeof fallbackResp?.response?.text === "function"
                ? fallbackResp.response.text()
                : fallbackResp?.response?.text) || "";

            if (fallbackText.trim()) {
              finalText = `${finalText.trim()}\n\n${fallbackText.trim()}`;
              patchLastAssistant((m) => ({ ...m, text: finalText }));
            }
          }

          // Mark as done (don't overwrite text; we've already streamed it)
          patchLastAssistant((m) => ({ ...m, done: true }));
        } catch (e) {
          console.error("HelpChat streaming error:", e);
          patchLastAssistant((m) => ({
            ...m,
            text: m.text || helpUi.requestFailed,
            done: true,
          }));
          toast({
            status: "error",
            title: helpUi.chatErrorTitle,
            description: String(e?.message || e),
          });
        } finally {
          setSending(false);
        }
      },
      [
        appLanguage,
        buildHistoryBlock,
        buildInstruction,
        normalizeQuestion,
        nameForLanguage,
        patchLastAssistant,
        pushMessage,
        morphemeMode,
        helpUi,
        progress?.targetLang,
        sending,
        input,
        toast,
      ],
    );

    const handleStop = () => {
      stopRef.current = true;
      setSending(false);
    };

    const stopTtsPlayback = useCallback(() => {
      try {
        ttsAudioRef.current?.pause();
      } catch {
        // Ignore playback pause failures during cleanup.
      }
      if (ttsAudioRef.current) {
        try {
          ttsAudioRef.current.srcObject = null;
        } catch {
          // Ignore audio source cleanup failures.
        }
      }
      try {
        ttsPcRef.current?.close();
      } catch {
        // Ignore peer connection close failures during cleanup.
      }
      ttsAudioRef.current = null;
      ttsPcRef.current = null;
      setReplayingId(null);
      setReplayLoadingId(null);
    }, []);

    const playAssistantTts = useCallback(
      async (message) => {
        if (!message?.id || !message?.text) return;
        if (replayingId === message.id) {
          stopTtsPlayback();
          return;
        }

        stopTtsPlayback();
        setReplayingId(message.id);
        setReplayLoadingId(message.id);

        let loadingTimer = null;
        const clearLoading = () => {
          if (loadingTimer) {
            clearTimeout(loadingTimer);
            loadingTimer = null;
          }
          setReplayLoadingId((cur) => (cur === message.id ? null : cur));
        };

        loadingTimer = setTimeout(clearLoading, 1800);

        try {
          const langTag =
            TTS_LANG_TAG[progress?.targetLang] || TTS_LANG_TAG.es || "en-US";
          const player = await getTTSPlayer({
            text: message.text,
            voice: getRandomVoice(),
            langTag,
          });

          ttsAudioRef.current = player.audio;
          ttsPcRef.current = player.pc;

          await player.ready;
          clearLoading();
          try {
            await player.audio.play();
          } catch (err) {
            console.warn("TTS play blocked", err);
          }

          const cleanup = () => stopTtsPlayback();
          player.audio.onended = cleanup;
          player.audio.onerror = cleanup;

          await player.done;
          stopTtsPlayback();
        } catch (error) {
          console.error("TTS playback error:", error);
          stopTtsPlayback();
        } finally {
          clearLoading();
        }
      },
      [progress?.targetLang, replayingId, stopTtsPlayback],
    );

    // -- Realtime voice chat functions -------------------------------------------

    const buildRealtimeInstructions = useCallback(() => {
      const lvl = progress?.level || "beginner";
      const targetLang = normalizePracticeLanguage(progress?.targetLang, "es");
      const supportLang = normalizeSupportLanguage(
        progress?.supportLang,
        DEFAULT_SUPPORT_LANGUAGE,
      );
      const persona = (progress?.voicePersona || "").slice(0, 200);
      const focus = (progress?.helpRequest || "").slice(0, 200);

      const nameFor = (code) =>
        ({
          es: "Spanish",
          en: "English",
          pt: "Portuguese",
          fr: "French",
          it: "Italian",
          nl: "Dutch",
          nah: "Eastern Huasteca Nahuatl",
          ru: "Russian",
          de: "German",
          el: "Greek",
          pl: "Polish",
          ga: "Irish",
          yua: "Yucatec Maya",
        })[code] || code;

      const levelHint =
        lvl === "beginner"
          ? "Speak slowly, clearly, and keep sentences simple."
          : lvl === "intermediate"
            ? "Be concise and natural in the support language."
            : "Be succinct, natural, and keep it mostly in the support language.";

      return [
        "You are a helpful language study buddy for quick voice conversations.",
        `The learner is practicing ${nameFor(targetLang)}.`,
        `Their native/support language is ${nameFor(supportLang)}.`,
        `Level: ${lvl}. ${levelHint}`,
        persona ? `Persona: ${persona}.` : "",
        focus ? `Focus area: ${focus}.` : "",
        "Keep responses brief (under 30 seconds of speech).",
        "Be encouraging and helpful. Correct mistakes gently.",
        `Speak and explain mainly in ${nameFor(
          supportLang,
        )} (support language). Include ${nameFor(
          targetLang,
        )} examples or phrases when they help, but keep guidance in ${nameFor(
          supportLang,
        )}.`,
      ]
        .filter(Boolean)
        .join(" ");
    }, [progress]);

    const clearRealtimeAutoStopTimer = useCallback(() => {
      if (realtimeAutoStopTimerRef.current) {
        clearTimeout(realtimeAutoStopTimerRef.current);
        realtimeAutoStopTimerRef.current = null;
      }
    }, []);

    const scheduleRealtimeAutoStop = useCallback(() => {
      clearRealtimeAutoStopTimer();
      realtimeAutoStopTimerRef.current = setTimeout(() => {
        if (!realtimeAliveRef.current) return;
        stopRealtimeRef.current();
      }, AUTO_DISCONNECT_MS);
    }, [clearRealtimeAutoStopTimer]);

    const buildRealtimeTurnDetection = useCallback(
      () => ({
        type: "server_vad",
        silence_duration_ms: 2000,
        threshold: 0.35,
        prefix_padding_ms: 120,
        interrupt_response: false,
      }),
      [],
    );

    const disableRealtimeVAD = useCallback(() => {
      try {
        pcRef.current?.getSenders?.().forEach((sender) => {
          if (sender.track?.kind === "audio") {
            sender.replaceTrack(null).catch(() => {});
          }
        });
      } catch {
        // Ignore sender sync failures while muting the mic.
      }

      try {
        localRef.current?.getAudioTracks?.().forEach((track) => {
          track.enabled = false;
        });
      } catch {
        // Ignore local track toggling failures.
      }

      if (!dcRef.current || dcRef.current.readyState !== "open") return;
      try {
        dcRef.current.send(
          JSON.stringify({ type: "input_audio_buffer.clear" }),
        );
        dcRef.current.send(
          JSON.stringify({
            type: "session.update",
            session: { turn_detection: null },
          }),
        );
      } catch {
        // Ignore transient data channel update failures.
      }
    }, []);

    const enableRealtimeVAD = useCallback(() => {
      try {
        localRef.current?.getAudioTracks?.().forEach((track) => {
          track.enabled = true;
        });
      } catch {
        // Ignore local track toggling failures.
      }

      const micTrack = localRef.current?.getAudioTracks?.()[0];
      if (pcRef.current && micTrack) {
        pcRef.current.getSenders().forEach((sender) => {
          if (!sender.track || sender.track?.kind === "audio") {
            sender.replaceTrack(micTrack).catch(() => {});
          }
        });
      }

      if (!dcRef.current || dcRef.current.readyState !== "open") return;
      try {
        dcRef.current.send(
          JSON.stringify({
            type: "session.update",
            session: { turn_detection: buildRealtimeTurnDetection() },
          }),
        );
      } catch {
        // Ignore transient data channel update failures.
      }
    }, [buildRealtimeTurnDetection]);

    const handleRealtimeEvent = useCallback(
      (evt) => {
        try {
          const data = JSON.parse(evt.data);
          const eventType = data.type;
          const responseId =
            data.response_id || data.response?.id || data.id || null;

          if (eventType === "input_audio_buffer.speech_started") {
            clearRealtimeAutoStopTimer();
            return;
          }

          if (
            eventType === "input_audio_buffer.speech_stopped" ||
            eventType === "input_audio_buffer.committed"
          ) {
            clearRealtimeAutoStopTimer();
            ensurePendingRealtimeTurn();
            disableRealtimeVAD();
            return;
          }

          if (eventType === "response.created") {
            clearRealtimeAutoStopTimer();
            const turn = findRealtimeTurnForResponse(responseId);
            currentAssistantIdRef.current = ensureRealtimeAssistantMessage(
              turn,
              responseId,
            );
            disableRealtimeVAD();
            return;
          }

          if (
            eventType === "response.output_audio.done" ||
            eventType === "output_audio.done" ||
            eventType === "output_audio_buffer.stopped" ||
            eventType === "response.canceled"
          ) {
            enableRealtimeVAD();
            if (realtimeAliveRef.current) scheduleRealtimeAutoStop();
            return;
          }

          // Handle transcription of user speech
          if (
            eventType ===
              "conversation.item.input_audio_transcription.completed" ||
            eventType === "input_audio_transcription.completed"
          ) {
            const text = data.transcript?.trim();
            if (text) {
              const turn = findRealtimeTurnAwaitingTranscript();
              turn.userDone = true;

              if (turn.userMessageId) {
                updateMessageById(turn.userMessageId, (message) => ({
                  ...message,
                  text,
                  done: true,
                }));
              } else {
                const userId = crypto.randomUUID?.() || String(Date.now());
                turn.userMessageId = userId;
                pushMessage({
                  id: userId,
                  role: "user",
                  text,
                  done: true,
                  sortOrder: turn.userSortOrder,
                });
              }

              pruneCompletedRealtimeTurns();
            }
            return;
          }

          // Handle assistant response transcript
          if (eventType === "response.audio_transcript.delta") {
            const delta = data.delta || "";
            const turn = findRealtimeTurnForResponse(responseId);
            const assistantMessageId =
              realtimeResponseToMessageRef.current.get(responseId) ||
              ensureRealtimeAssistantMessage(turn, responseId);

            currentAssistantIdRef.current = assistantMessageId;
            updateMessageById(assistantMessageId, (message) => ({
              ...message,
              text: `${message.text || ""}${delta}`,
              done: false,
            }));
            return;
          }

          if (eventType === "response.audio_transcript.done") {
            const turn = responseId
              ? realtimeTurnQueueRef.current.find(
                  (candidate) => candidate.responseId === responseId,
                )
              : null;
            const assistantMessageId =
              realtimeResponseToMessageRef.current.get(responseId) ||
              currentAssistantIdRef.current;

            if (assistantMessageId) {
              updateMessageById(assistantMessageId, (message) => ({
                ...message,
                done: true,
              }));
            }

            if (turn) {
              turn.assistantDone = true;
            }
            currentAssistantIdRef.current = null;
            pruneCompletedRealtimeTurns();
            return;
          }

          if (
            eventType === "response.done" ||
            eventType === "response.completed" ||
            eventType === "response.canceled"
          ) {
            const turn = responseId
              ? realtimeTurnQueueRef.current.find(
                  (candidate) => candidate.responseId === responseId,
                )
              : null;
            if (turn) {
              turn.assistantDone = true;
            }
            currentAssistantIdRef.current = null;
            pruneCompletedRealtimeTurns();
          }
        } catch (e) {
          console.warn("Realtime event parse error:", e);
        }
      },
      [
        clearRealtimeAutoStopTimer,
        disableRealtimeVAD,
        enableRealtimeVAD,
        ensurePendingRealtimeTurn,
        ensureRealtimeAssistantMessage,
        findRealtimeTurnAwaitingTranscript,
        findRealtimeTurnForResponse,
        scheduleRealtimeAutoStop,
      ],
    );

    const startRealtime = useCallback(async () => {
      clearRealtimeAutoStopTimer();
      currentAssistantIdRef.current = null;
      realtimeTurnQueueRef.current = [];
      realtimeResponseToMessageRef.current.clear();
      setRealtimeStatus("connecting");
      try {
        const pc = new RTCPeerConnection();
        pcRef.current = pc;

        const remote = new MediaStream();
        if (audioRef.current) {
          audioRef.current.srcObject = remote;
          audioRef.current.autoplay = true;
          audioRef.current.playsInline = true;
        }

        pc.ontrack = (e) => {
          e.streams[0].getTracks().forEach((t) => remote.addTrack(t));
        };
        pc.addTransceiver("audio", { direction: "recvonly" });

        const local = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        localRef.current = local;
        local.getTracks().forEach((track) => pc.addTrack(track, local));

        const dc = pc.createDataChannel("oai-events");
        dcRef.current = dc;

        dc.onopen = () => {
          const voiceName = getRandomVoice();
          const instructions = buildRealtimeInstructions();

          dc.send(
            JSON.stringify({
              type: "session.update",
              session: {
                instructions,
                modalities: ["audio", "text"],
                voice: voiceName,
                turn_detection: buildRealtimeTurnDetection(),
                input_audio_transcription: { model: "whisper-1" },
                output_audio_format: "pcm16",
              },
            }),
          );
        };

        dc.onmessage = handleRealtimeEvent;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const resp = await fetch(REALTIME_URL, {
          method: "POST",
          headers: { "Content-Type": "application/sdp" },
          body: offer.sdp,
        });
        const answer = await resp.text();
        if (!resp.ok)
          throw new Error(`SDP exchange failed: HTTP ${resp.status}`);
        await pc.setRemoteDescription({ type: "answer", sdp: answer });

        setRealtimeStatus("connected");
        realtimeAliveRef.current = true;
        scheduleRealtimeAutoStop();
      } catch (e) {
        console.error("Realtime connection error:", e);
        clearRealtimeAutoStopTimer();
        setRealtimeStatus("disconnected");
        toast({
          status: "error",
          title: helpUi.connectionErrorTitle,
          description: e?.message || String(e),
        });
      }
    }, [
      appLanguage,
      buildRealtimeTurnDetection,
      buildRealtimeInstructions,
      clearRealtimeAutoStopTimer,
      handleRealtimeEvent,
      scheduleRealtimeAutoStop,
      helpUi,
      toast,
    ]);

    const stopRealtime = useCallback(() => {
      clearRealtimeAutoStopTimer();
      realtimeAliveRef.current = false;
      currentAssistantIdRef.current = null;
      realtimeTurnQueueRef.current = [];
      realtimeResponseToMessageRef.current.clear();

      try {
        const a = audioRef.current;
        if (a) {
          try {
            a.pause();
          } catch {
            // Ignore playback pause failures during disconnect.
          }
          const s = a.srcObject;
          if (s) {
            try {
              s.getTracks().forEach((t) => t.stop());
            } catch {
              // Ignore remote track cleanup failures during disconnect.
            }
          }
          a.srcObject = null;
        }
      } catch {
        // Ignore audio element cleanup failures during disconnect.
      }

      try {
        localRef.current?.getTracks().forEach((t) => t.stop());
      } catch {
        // Ignore local track cleanup failures during disconnect.
      }
      localRef.current = null;

      try {
        pcRef.current?.getSenders?.().forEach((s) => s.track && s.track.stop());
        pcRef.current
          ?.getReceivers?.()
          .forEach((r) => r.track && r.track.stop());
      } catch {
        // Ignore peer track cleanup failures during disconnect.
      }

      try {
        dcRef.current?.close();
      } catch {
        // Ignore data channel close failures during disconnect.
      }
      dcRef.current = null;
      try {
        pcRef.current?.close();
      } catch {
        // Ignore peer connection close failures during disconnect.
      }
      pcRef.current = null;

      setRealtimeStatus("disconnected");
    }, [clearRealtimeAutoStopTimer]);

    useEffect(() => {
      stopRealtimeRef.current = stopRealtime;
    }, [stopRealtime]);

    const toggleRealtime = useCallback(() => {
      if (realtimeStatus === "connected") {
        stopRealtime();
      } else if (realtimeStatus === "disconnected") {
        startRealtime();
      }
    }, [realtimeStatus, startRealtime, stopRealtime]);

    // Clean up realtime on unmount or modal close
    useEffect(() => {
      return () => {
        if (realtimeAliveRef.current) {
          stopRealtime();
        }
      };
    }, [stopRealtime]);

    // Disconnect realtime when modal closes
    useEffect(() => {
      if (!isOpen && realtimeAliveRef.current) {
        stopRealtime();
      }
    }, [isOpen, stopRealtime]);

    useEffect(() => {
      if (!isOpen && replayingId) {
        stopTtsPlayback();
      }
    }, [isOpen, replayingId, stopTtsPlayback]);

    useEffect(() => {
      return () => {
        stopTtsPlayback();
      };
    }, [stopTtsPlayback]);

    const openAndSend = useCallback(
      (text) => {
        const payload = normalizeQuestion(text);
        if (!payload) return;
        onOpen();
        setInput(payload);
        setTimeout(() => handleSend(payload), 0);
      },
      [handleSend, normalizeQuestion, onOpen],
    );

    useImperativeHandle(
      ref,
      () => ({
        open: onOpen,
        openAndSend,
      }),
      [openAndSend, onOpen],
    );

    const scrollToBottom = useCallback(() => {
      const el = scrollRef.current;
      if (!el) return;

      const doScroll = () => {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      };

      if (typeof window !== "undefined" && window?.requestAnimationFrame) {
        window.requestAnimationFrame(doScroll);
      } else {
        doScroll();
      }
    }, []);

    useEffect(() => {
      if (isOpen) {
        scrollToBottom();
        const timer = setTimeout(scrollToBottom, 150);
        return () => clearTimeout(timer);
      }
    }, [isOpen, scrollToBottom]);

    useEffect(() => {
      if (isOpen && messages.length > 0) {
        scrollToBottom();
      }
    }, [isOpen, messages, scrollToBottom]);

    // -- UI --------------------------------------------------------------------

    // Responsive: detect if desktop (md and up)
    const isDesktop = useBreakpointValue({ base: false, md: true });
    const orderedMessages = getOrderedMessages(messages);
    const hasMessages = orderedMessages.length > 0;
    const composerBg = isLightTheme ? APP_SURFACE_ELEVATED : "gray.800";
    const composerBorderColor = isLightTheme ? APP_BORDER : "gray.700";
    const composerTextColor = isLightTheme ? APP_TEXT_PRIMARY : "gray.100";
    const composerPlaceholderColor = isLightTheme
      ? APP_TEXT_MUTED
      : "gray.500";
    const sendButtonBg = isLightTheme ? "#0f766e" : "white";
    const sendButtonColor = isLightTheme ? "#fffaf3" : "gray.900";
    const sendButtonHoverBg = isLightTheme ? "#115e59" : "gray.200";
    const sendButtonShadow = isLightTheme
      ? "0px 4px 0px #0b5d57"
      : "0px 4px 0px darkgray";
    const sendButtonDisabledBg = isLightTheme
      ? "rgba(15, 118, 110, 0.18)"
      : "#e5e7eb";
    const sendButtonDisabledColor = isLightTheme
      ? "rgba(15, 118, 110, 0.54)"
      : "#6b7280";
    const userBubbleBg = isLightTheme ? "#6c5842" : "gray.700";
    const userBubbleColor = isLightTheme ? "#fffaf3" : "white";
    const userBubbleShadow = isLightTheme
      ? "0 10px 20px rgba(111, 86, 54, 0.14)"
      : "none";

    // Sidebar content - shared between desktop sidebar and mobile drawer
    const SidebarContent = (
      <VStack spacing={4} align="stretch" h="100%">
        {/* Saved Chats */}
        <Box flex="1" overflowY="auto">
          <Text fontWeight="bold" mb={2} fontSize="xs" color="gray.500">
            {helpUi.yourChats}
          </Text>
          <VStack spacing={1} align="stretch">
            {savedChats.length === 0 ? (
              <Text fontSize="xs" color="gray.600" textAlign="center" py={4}>
                {helpUi.noSavedChats}
              </Text>
            ) : (
              savedChats.map((chat) => {
                const langColor =
                  LANG_COLORS[chat.targetLang] || LANG_COLORS.es;
                return (
                  <Box
                    key={chat.id}
                    px={2}
                    py={2}
                    rounded="md"
                    cursor="pointer"
                    _hover={{ bg: "gray.800" }}
                    onClick={() => {
                      playSound(selectSound);
                      loadSavedChat(chat);
                    }}
                    fontSize="sm"
                  >
                    <HStack justify="space-between" spacing={2}>
                      <HStack flex="1" spacing={2} minW={0}>
                        <Badge
                          bg={langColor.bg}
                          color="white"
                          fontSize="9px"
                          px={1.5}
                          py={0.5}
                          rounded="sm"
                          flexShrink={0}
                        >
                          {langColor.label}
                        </Badge>
                        <Text noOfLines={1} flex="1">
                          {chat.title}
                        </Text>
                      </HStack>
                      <IconButton
                        aria-label={helpUi.delete}
                        icon={<FaTrash size={10} />}
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        opacity={0.5}
                        _hover={{ opacity: 1 }}
                        onClick={(e) => {
                          playSound(clickSound);
                          deleteSavedChat(chat.id, e);
                        }}
                      />
                    </HStack>
                  </Box>
                );
              })
            )}
          </VStack>
        </Box>

        <Divider borderColor="gray.700" />

        {/* Morpheme Mode Toggle - at bottom */}
        <Box
          bg="gray.800"
          p={3}
          rounded="lg"
          border="1px solid"
          borderColor="gray.700"
        >
          <FormControl display="flex" alignItems="center">
            <FormLabel htmlFor="morpheme-mode-sidebar" mb={0} flex="1">
              <VStack align="start" spacing={0}>
                <Text fontWeight="medium" fontSize="sm">
                  {helpUi.morphemeMode}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {helpUi.breakDownWords}
                </Text>
              </VStack>
            </FormLabel>
            <Switch
              id="morpheme-mode-sidebar"
              colorScheme="purple"
              size="sm"
              isChecked={morphemeMode}
              onChange={(e) => {
                playSound(submitActionSound);
                toggleMorphemeMode(e);
              }}
            />
          </FormControl>
        </Box>

        {/* New Chat Button - at bottom */}
        <Button
          leftIcon={<FaPlus />}
          variant="outline"
          colorScheme="gray"
          size="sm"
          onClick={() => {
            playSound(selectSound);
            startNewChat();
          }}
          w="100%"
          borderColor="gray.600"
          _hover={{ bg: "gray.800" }}
          marginBottom={6}
          padding={8}
        >
          {helpUi.newChat}
        </Button>
      </VStack>
    );

    return (
      <>
        {/* Floating button */}
        {showFloatingTrigger && (
          <Tooltip label={helpUi.help}>
            <IconButton
              aria-label={helpUi.help}
              icon={<MdOutlineSupportAgent size={20} />}
              rounded="xl"
              bg="white"
              color="blue"
              boxShadow="0 4px 0 blue"
              size="lg"
              position="fixed"
              bottom={{ base: "4", md: "4" }}
              right="20px"
              zIndex={50}
              onClick={() => {
                playSound(selectSound);
                onOpen();
              }}
            />
          </Tooltip>
        )}

        {/* Help chat bottom drawer */}
        <Drawer isOpen={isOpen} onClose={onClose} placement="bottom">
          <DrawerOverlay
            {...chatSwipeDismiss.overlayProps}
            bg="blackAlpha.600"
          />
          <DrawerContent
            {...chatSwipeDismiss.drawerContentProps}
            bg="gray.900"
            color="gray.100"
            borderTopRadius="24px"
            h="95vh"
            m={0}
            overflow="hidden"
            sx={{
              "@supports (height: 100dvh)": {
                height: "95dvh",
              },
            }}
          >
            <BottomDrawerDragHandle isDragging={chatSwipeDismiss.isDragging} />

            {/* Main layout: Sidebar + Chat Area */}
            <Flex flex="1" minH="0">
              {/* Desktop Sidebar - always visible on md+ */}
              {isDesktop && (
                <Box
                  w="260px"
                  h="100%"
                  bg="gray.900"
                  borderRight="1px solid"
                  borderColor="gray.800"
                  p={3}
                  flexShrink={0}
                >
                  {SidebarContent}
                </Box>
              )}

              {/* Chat Area */}
              <Flex
                flex="1"
                direction="column"
                minH="0"
                h="100%"
                overflow="hidden"
              >
                {/* Header */}
                <HStack
                  px={4}
                  py={3}
                  borderBottom="1px solid"
                  borderColor="gray.800"
                  justify="space-between"
                >
                  <HStack spacing={3}>
                    {/* Mobile menu button */}
                    {!isDesktop && (
                      <IconButton
                        aria-label={helpUi.menu}
                        icon={<FaBars />}
                        variant="ghost"
                        colorScheme="gray"
                        onClick={() => {
                          playSound(clickSound);
                          drawerDisclosure.onOpen();
                        }}
                        size="sm"
                      />
                    )}
                    {morphemeMode && (
                      <Badge colorScheme="purple" fontSize="xs">
                        {helpUi.morphemes}
                      </Badge>
                    )}
                  </HStack>
                  <HStack spacing={2}>
                    <Button
                      leftIcon={<FaSave />}
                      variant="ghost"
                      colorScheme="gray"
                      onClick={() => {
                        playSound(submitActionSound);
                        saveCurrentChat();
                      }}
                      size="sm"
                      isDisabled={messages.length === 0}
                    >
                      {helpUi.saveChat}
                    </Button>
                    <DrawerCloseButton
                      position="static"
                      size="md"
                      border="1px solid white"
                      padding={2}
                      borderRadius="50%"
                    />
                  </HStack>
                </HStack>

                {/* Chat content area */}
                {!hasMessages ? (
                  /* Empty state - centered input */
                  <Flex
                    flex="1"
                    direction="column"
                    align="center"
                    justify="center"
                    px={4}
                  >
                    <VStack spacing={6} w="100%" maxW="600px">
                      <Text
                        fontSize={{ base: "xl", md: "2xl" }}
                        fontWeight="medium"
                        textAlign="center"
                      >
                        {helpUi.emptyPrompt}
                      </Text>
                      {/* Centered input bar */}
                      <Box w="100%" maxW="600px" mx="auto" px={4}>
                        <Box
                          bg={composerBg}
                          border="1px solid"
                          borderColor={composerBorderColor}
                          rounded="2xl"
                          p={2}
                        >
                          <HStack spacing={2} align="flex-end">
                            <IconButton
                              aria-label={
                                realtimeStatus === "connected"
                                  ? helpUi.stopVoiceChat
                                  : helpUi.startVoiceChat
                              }
                              icon={
                                realtimeStatus === "connected" ? (
                                  <FaStop />
                                ) : realtimeStatus === "connecting" ? (
                                  <Spinner size="xs" />
                                ) : (
                                  <FaMicrophone />
                                )
                              }
                              onClick={() => {
                                playSound(clickSound);
                                toggleRealtime();
                              }}
                              isDisabled={
                                realtimeStatus === "connecting" || sending
                              }
                              colorScheme={
                                realtimeStatus === "connected" ? "red" : "gray"
                              }
                              variant={
                                realtimeStatus === "connected"
                                  ? "solid"
                                  : "ghost"
                              }
                              size="sm"
                              rounded="full"
                            />
                            <Textarea
                              ref={inputRef}
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  if (
                                    !sending &&
                                    realtimeStatus !== "connected"
                                  ) {
                                    playSound(submitActionSound);
                                    handleSend();
                                  }
                                }
                              }}
                              bg="transparent"
                              border="none"
                              color={composerTextColor}
                              _focus={{ boxShadow: "none", border: "none" }}
                              _placeholder={{ color: composerPlaceholderColor }}
                              resize="none"
                              minH="40px"
                              maxH="140px"
                              rows={1}
                              flex="1"
                              overflowY="hidden"
                              isDisabled={realtimeStatus === "connected"}
                              placeholder={helpUi.askPlaceholder}
                              fontSize="16px"
                              sx={{
                                scrollbarWidth: "thin",
                                scrollbarColor: "#60a5fa #0b1220",
                                "&::-webkit-scrollbar": {
                                  width: "8px",
                                },
                                "&::-webkit-scrollbar-corner": {
                                  background: "#0b1220",
                                },
                                "&::-webkit-scrollbar-thumb": {
                                  background:
                                    "linear-gradient(180deg, #60a5fa, #2563eb)",
                                  borderRadius: "8px",
                                  border: "2px solid #0b1220",
                                },
                                "&::-webkit-scrollbar-track": {
                                  background: "#0b1220",
                                  borderRadius: "8px",
                                },
                              }}
                            />
                            {sending ? (
                              <IconButton
                                aria-label={helpUi.stop}
                                onClick={() => {
                                  playSound(clickSound);
                                  handleStop();
                                }}
                                colorScheme="red"
                                icon={<FaStop />}
                                size="sm"
                                rounded="full"
                              />
                            ) : (
                              <IconButton
                                aria-label={helpUi.send}
                                onClick={() => {
                                  playSound(submitActionSound);
                                  handleSend();
                                }}
                                bg={sendButtonBg}
                                color={sendButtonColor}
                                icon={<FiSend />}
                                size="sm"
                                rounded="full"
                                boxShadow={sendButtonShadow}
                                isDisabled={
                                  !input.trim() ||
                                  realtimeStatus === "connected"
                                }
                                _hover={{ bg: sendButtonHoverBg }}
                                _disabled={{
                                  opacity: 1,
                                  bg: sendButtonDisabledBg,
                                  color: sendButtonDisabledColor,
                                  boxShadow: "none",
                                }}
                              />
                            )}
                          </HStack>
                        </Box>
                      </Box>
                    </VStack>
                  </Flex>
                ) : (
                  /* Chat active - messages + bottom input */
                  <>
                    {/* Messages area */}
                    <Box
                      flex="1"
                      overflowY="auto"
                      ref={scrollRef}
                      px={{ base: 4, md: 8 }}
                      py={4}
                      sx={{
                        scrollbarWidth: "thin",
                        scrollbarColor: "gray.700 transparent",
                      }}
                    >
                      <VStack
                        spacing={6}
                        align="stretch"
                        maxW="768px"
                        mx="auto"
                      >
                        {orderedMessages.map((m) => {
                          const { main, gloss } = splitMainAndGloss(m.text);
                          return m.role === "user" ? (
                            <Flex key={m.id} justify="flex-end">
                              <Box
                                bg={userBubbleBg}
                                color={userBubbleColor}
                                px={4}
                                py={3}
                                rounded="2xl"
                                roundedBottomRight="md"
                                maxW="80%"
                                boxShadow={userBubbleShadow}
                              >
                                <Markdown>{m.text}</Markdown>
                              </Box>
                            </Flex>
                          ) : (
                            <Flex
                              key={m.id}
                              justify="flex-start"
                              align="flex-start"
                            >
                              <Box maxW="100%" w="100%">
                                <HStack align="flex-start" spacing={3}>
                                  <IconButton
                                    aria-label={helpUi.play}
                                    icon={
                                      replayLoadingId === m.id ? (
                                        <VoiceOrb
                                          state={
                                            ["idle", "listening", "speaking"][
                                              Math.floor(Math.random() * 3)
                                            ]
                                          }
                                          size={16}
                                        />
                                      ) : (
                                        <RiVolumeUpLine size={14} />
                                      )
                                    }
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="gray"
                                    onClick={() => {
                                      playSound(clickSound);
                                      playAssistantTts(m);
                                    }}
                                    isDisabled={!m.text}
                                    mt={1}
                                  />
                                  <Box flex="1">
                                    {!m.done && (
                                      <VoiceOrb
                                        state={
                                          ["idle", "listening", "speaking"][
                                            Math.floor(Math.random() * 3)
                                          ]
                                        }
                                        size={16}
                                      />
                                    )}
                                    <Markdown>{main}</Markdown>
                                    {!!gloss && (
                                      <Box
                                        opacity={0.7}
                                        fontSize="sm"
                                        mt={2}
                                        pl={3}
                                        borderLeft="2px solid"
                                        borderColor="gray.700"
                                      >
                                        <Markdown>{gloss}</Markdown>
                                      </Box>
                                    )}
                                  </Box>
                                </HStack>
                              </Box>
                            </Flex>
                          );
                        })}
                      </VStack>
                    </Box>

                    {/* Bottom input bar */}
                    <Box py={4} borderTop="1px solid" borderColor="gray.800">
                      <Box
                        w="100%"
                        maxW="768px"
                        mx="auto"
                        px={{ base: 4, md: 8 }}
                      >
                        <Box
                          bg={composerBg}
                          border="1px solid"
                          borderColor={composerBorderColor}
                          rounded="2xl"
                          p={2}
                        >
                          <HStack spacing={2} align="flex-end">
                            <IconButton
                              aria-label={
                                realtimeStatus === "connected"
                                  ? helpUi.stopVoiceChat
                                  : helpUi.startVoiceChat
                              }
                              icon={
                                realtimeStatus === "connected" ? (
                                  <FaStop />
                                ) : realtimeStatus === "connecting" ? (
                                  <VoiceOrb
                                    state={
                                      ["idle", "listening", "speaking"][
                                        Math.floor(Math.random() * 3)
                                      ]
                                    }
                                    size={24}
                                  />
                                ) : (
                                  <FaMicrophone />
                                )
                              }
                              onClick={() => {
                                playSound(clickSound);
                                toggleRealtime();
                              }}
                              isDisabled={
                                realtimeStatus === "connecting" || sending
                              }
                              colorScheme={
                                realtimeStatus === "connected" ? "red" : "gray"
                              }
                              variant={
                                realtimeStatus === "connected"
                                  ? "solid"
                                  : "ghost"
                              }
                              size="sm"
                              rounded="full"
                            />
                            <Textarea
                              ref={inputRef}
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  if (
                                    !sending &&
                                    realtimeStatus !== "connected"
                                  ) {
                                    playSound(submitActionSound);
                                    handleSend();
                                  }
                                }
                              }}
                              bg="transparent"
                              border="none"
                              color={composerTextColor}
                              _focus={{ boxShadow: "none", border: "none" }}
                              _placeholder={{ color: composerPlaceholderColor }}
                              resize="none"
                              minH="40px"
                              maxH="140px"
                              rows={1}
                              flex="1"
                              overflowY="hidden"
                              isDisabled={realtimeStatus === "connected"}
                              placeholder={helpUi.askPlaceholder}
                              fontSize="16px"
                              sx={{
                                scrollbarWidth: "thin",
                                scrollbarColor: "#60a5fa #0b1220",
                                "&::-webkit-scrollbar": {
                                  width: "8px",
                                },
                                "&::-webkit-scrollbar-corner": {
                                  background: "#0b1220",
                                },
                                "&::-webkit-scrollbar-thumb": {
                                  background:
                                    "linear-gradient(180deg, #60a5fa, #2563eb)",
                                  borderRadius: "8px",
                                  border: "2px solid #0b1220",
                                },
                                "&::-webkit-scrollbar-track": {
                                  background: "#0b1220",
                                  borderRadius: "8px",
                                },
                              }}
                            />
                            {sending ? (
                              <IconButton
                                aria-label={helpUi.stop}
                                onClick={() => {
                                  playSound(clickSound);
                                  handleStop();
                                }}
                                colorScheme="red"
                                icon={<FaStop />}
                                size="sm"
                                rounded="full"
                              />
                            ) : (
                              <IconButton
                                aria-label={helpUi.send}
                                onClick={() => {
                                  playSound(submitActionSound);
                                  handleSend();
                                }}
                                bg={sendButtonBg}
                                color={sendButtonColor}
                                icon={<FiSend />}
                                size="sm"
                                rounded="full"
                                boxShadow={sendButtonShadow}
                                isDisabled={
                                  !input.trim() ||
                                  realtimeStatus === "connected"
                                }
                                _hover={{ bg: sendButtonHoverBg }}
                                _disabled={{
                                  opacity: 1,
                                  bg: sendButtonDisabledBg,
                                  color: sendButtonDisabledColor,
                                  boxShadow: "none",
                                }}
                              />
                            )}
                          </HStack>
                        </Box>
                      </Box>
                    </Box>
                  </>
                )}

                {/* Hidden audio element for realtime playback */}
                <audio ref={audioRef} style={{ display: "none" }} />
              </Flex>
            </Flex>
          </DrawerContent>
        </Drawer>

        {/* Mobile Drawer Menu */}
        {!isDesktop && (
          <Drawer
            isOpen={drawerDisclosure.isOpen}
            placement="left"
            onClose={drawerDisclosure.onClose}
          >
            <DrawerOverlay />
            <DrawerContent bg="gray.900" color="gray.100" maxW="280px">
              <DrawerHeader
                borderBottomWidth="1px"
                borderColor="gray.800"
                py={3}
              >
                <Text fontSize="sm">
                  {helpUi.menu}
                </Text>
              </DrawerHeader>
              <DrawerBody p={3}>{SidebarContent}</DrawerBody>
            </DrawerContent>
          </Drawer>
        )}
      </>
    );
  },
);

export default HelpChatFab;
