// components/HelpChatFab.jsx
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
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
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
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

const REALTIME_MODEL =
  (import.meta.env.VITE_REALTIME_MODEL || "gpt-realtime-mini") + "";

const REALTIME_URL = `${
  import.meta.env.VITE_REALTIME_URL
}?model=gpt-realtime-mini/exchangeRealtimeSDP?model=${encodeURIComponent(
  REALTIME_MODEL,
)}`;

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
    const toast = useToast();

    const ui = translations[appLanguage] || translations.en;

    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [messages, setMessages] = useState([]); // {id, role, text, done}
    const stopRef = useRef(false);
    const scrollRef = useRef(null);
    const ttsAudioRef = useRef(null);
    const ttsPcRef = useRef(null);
    const [replayingId, setReplayingId] = useState(null);
    const [replayLoadingId, setReplayLoadingId] = useState(null);

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
    // Track current assistant message being built (to prevent splitting)
    const currentAssistantIdRef = useRef(null);
    // Track the most recent assistant message (even after it's marked done)
    const latestAssistantRef = useRef({ id: null, createdAt: 0 });
    // Track when we last inserted a realtime user message to avoid reordering old turns
    const lastUserInsertAtRef = useRef(0);

    // -- helpers ---------------------------------------------------------------

    const pushMessage = (m) =>
      setMessages((prev) => [
        ...prev,
        {
          createdAt: Date.now(),
          ...m,
        },
      ]);

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

    // Split assistant text into main + gloss (lines starting with "// ")
    const splitMainAndGloss = (text) => {
      const lines = String(text || "").split("\n");
      const i = lines.findIndex((l) => l.trim().startsWith("// "));
      if (i === -1) return { main: text, gloss: "" };
      return {
        main: lines.slice(0, i).join("\n").trim(),
        gloss: lines[i].replace(/^\/\/\s?/, "").trim(),
      };
    };

    // -- Saved chats & morpheme mode functions ----------------------------------

    const saveCurrentChat = useCallback(() => {
      if (messages.length === 0) {
        toast({
          status: "warning",
          title: appLanguage === "es" ? "Sin mensajes" : "No messages",
          description:
            appLanguage === "es"
              ? "No hay mensajes para guardar."
              : "No messages to save.",
        });
        return;
      }

      const newChat = {
        id: crypto.randomUUID?.() || String(Date.now()),
        title:
          messages.find((m) => m.role === "user")?.text?.slice(0, 50) ||
          (appLanguage === "es" ? "Chat guardado" : "Saved chat"),
        messages: [...messages],
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
        title: appLanguage === "es" ? "Chat guardado" : "Chat saved",
        duration: 2000,
      });
    }, [messages, savedChats, appLanguage, progress?.targetLang, toast]);

    const loadSavedChat = useCallback(
      (chat) => {
        setMessages(chat.messages);
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
          title: appLanguage === "es" ? "Chat eliminado" : "Chat deleted",
          duration: 2000,
        });
      },
      [savedChats, appLanguage, toast],
    );

    const startNewChat = useCallback(() => {
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
        ["en", "es", "bilingual"].includes(progress?.supportLang) &&
        progress?.supportLang
          ? progress.supportLang
          : "en";
      const supportLang =
        supportRaw === "bilingual"
          ? appLanguage === "es"
            ? "es"
            : "en"
          : supportRaw;

      const targetLang = progress?.targetLang || "es"; // practice language
      const primaryLang = supportLang; // replies must follow the learner's support language
      const persona = (progress?.voicePersona || "").slice(0, 200);
      const focus = (progress?.helpRequest || "").slice(0, 200);
      const showTranslations =
        typeof progress?.showTranslations === "boolean"
          ? progress.showTranslations
          : true;

      const nameFor = (code) =>
        ({
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
        })[code] || code;

      const strict =
        primaryLang === "es"
          ? "Responde totalmente en español (idioma de apoyo/soporte), aunque el usuario escriba en otro idioma."
          : primaryLang === "en"
            ? "Respond entirely in English (the support language), even if the user writes in another language."
            : `Respond entirely in ${nameFor(
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

      const glossHuman = glossLang ? nameFor(glossLang) : "";
      const supportNote = `Explica y guía en ${nameFor(
        primaryLang,
      )}. Incluye ejemplos o frases en ${nameFor(
        targetLang,
      )} solo cuando ayuden, pero mantén la explicación en ${nameFor(
        primaryLang,
      )}.`;

      // Morpheme mode instructions - placed at START for priority
      const morphemePrefix = morphemeMode
        ? `🔬 MORPHEME MODE IS ON - YOU MUST INCLUDE A MORPHEME BREAKDOWN SECTION.

After answering, ADD this section:

---MORPHEMES---
[Break down each ${nameFor(targetLang)} word like this:]

**word** = part1 + part2 + part3
- part1: meaning
- part2: meaning
→ "English translation"

Example: **hablaremos** = habl + ar + emos
- habl-: root "speak"
- -ar-: infinitive marker
- -emos: future 1st person plural
→ "we will speak"

DO NOT SKIP THE MORPHEME SECTION.

---

`
        : "";

      const glossLine = glossLang
        ? `Después de la explicación, añade una sola línea de ejemplo o traducción en ${glossHuman}. Ponla en una nueva línea que comience con "// ".`
        : "No añadas traducciones adicionales.";

      return [
        morphemePrefix,
        "You are a helpful language study buddy for quick questions.",
        strict,
        `The learner practices ${nameFor(
          targetLang,
        )}; their support/UI language is ${nameFor(primaryLang)}.`,
        levelHint,
        persona ? `Persona: ${persona}.` : "",
        focus ? `Focus area: ${focus}.` : "",
        supportNote,
        morphemeMode
          ? "Keep main reply ≤ 80 words, then ADD the morpheme breakdown."
          : "Keep replies ≤ 60 words.",
        glossLine,
        "Use concise Markdown when helpful (bullets, **bold**, code, tables).",
      ]
        .filter(Boolean)
        .join(" ");
    }, [progress, appLanguage, morphemeMode]);

    // Build a simple text history block (last ~6 messages) so we still have some context
    const buildHistoryBlock = useCallback(() => {
      const last = messages.slice(-6);
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

          // Mark as done (don't overwrite text; we've already streamed it)
          patchLastAssistant((m) => ({ ...m, done: true }));
        } catch (e) {
          console.error("HelpChat streaming error:", e);
          patchLastAssistant((m) => ({
            ...m,
            text:
              m.text ||
              (appLanguage === "es"
                ? "Lo siento, no pude completar esa solicitud. Inténtalo nuevamente."
                : "Sorry, I couldn’t complete that request. Please try again."),
            done: true,
          }));
          toast({
            status: "error",
            title: appLanguage === "es" ? "Error de chat" : "Chat error",
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
        patchLastAssistant,
        pushMessage,
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
      } catch {}
      if (ttsAudioRef.current) {
        try {
          ttsAudioRef.current.srcObject = null;
        } catch {}
      }
      try {
        ttsPcRef.current?.close();
      } catch {}
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
      const targetLang = progress?.targetLang || "es";
      const supportLang = progress?.supportLang || "en";
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

    const handleRealtimeEvent = useCallback((evt) => {
      try {
        const data = JSON.parse(evt.data);

        // Handle transcription of user speech
        if (
          data.type === "conversation.item.input_audio_transcription.completed"
        ) {
          const text = data.transcript?.trim();
          if (text) {
            const userId = crypto.randomUUID?.() || String(Date.now());
            const now = Date.now();
            const newUserMsg = {
              id: userId,
              role: "user",
              text,
              done: true,
              createdAt: now,
            };

            setMessages((prev) => {
              // If there's an assistant message being built, insert user message BEFORE it
              // This ensures proper chat order: user message -> AI response
              const candidateAssistantId =
                currentAssistantIdRef.current ||
                (latestAssistantRef.current.createdAt >
                lastUserInsertAtRef.current
                  ? latestAssistantRef.current.id
                  : null);

              if (candidateAssistantId) {
                const assistantIdx = prev.findIndex(
                  (m) => m.id === candidateAssistantId,
                );
                if (assistantIdx >= 0) {
                  const updated = [...prev];
                  updated.splice(assistantIdx, 0, newUserMsg);
                  return updated;
                }
              }

              // Fallback: if the last message is a recent assistant reply, still place
              // the user message ahead of it to preserve natural order.
              const lastAssistantIdx = (() => {
                for (let i = prev.length - 1; i >= 0; i--) {
                  if (prev[i].role === "assistant") return i;
                }
                return -1;
              })();

              if (
                lastAssistantIdx >= 0 &&
                (prev[lastAssistantIdx].createdAt || 0) >
                  lastUserInsertAtRef.current
              ) {
                const updated = [...prev];
                updated.splice(lastAssistantIdx, 0, newUserMsg);
                return updated;
              }

              // Otherwise just append
              return [...prev, newUserMsg];
            });

            lastUserInsertAtRef.current = now;
          }
        }

        // Handle assistant response transcript
        if (data.type === "response.audio_transcript.delta") {
          const delta = data.delta || "";
          setMessages((prev) => {
            // If we have a current assistant message being built, always append to it
            // (even if user messages were inserted after it)
            if (currentAssistantIdRef.current) {
              const idx = prev.findIndex(
                (m) => m.id === currentAssistantIdRef.current,
              );
              if (idx >= 0 && !prev[idx].done) {
                const updated = [...prev];
                updated[idx] = {
                  ...updated[idx],
                  text: updated[idx].text + delta,
                };
                return updated;
              }
            }

            // Start new assistant message
            const assistantId = crypto.randomUUID?.() || String(Date.now());
            const createdAt = Date.now();
            currentAssistantIdRef.current = assistantId;
            latestAssistantRef.current = { id: assistantId, createdAt };
            return [
              ...prev,
              {
                id: assistantId,
                role: "assistant",
                text: delta,
                done: false,
                createdAt,
              },
            ];
          });
        }

        if (data.type === "response.audio_transcript.done") {
          setMessages((prev) => {
            // Mark the current assistant message as done
            if (currentAssistantIdRef.current) {
              const idx = prev.findIndex(
                (m) => m.id === currentAssistantIdRef.current,
              );
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], done: true };
                currentAssistantIdRef.current = null;
                return updated;
              }
            }
            currentAssistantIdRef.current = null;
            return prev;
          });
        }
      } catch (e) {
        console.warn("Realtime event parse error:", e);
      }
    }, []);

    const startRealtime = useCallback(async () => {
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
                turn_detection: {
                  type: "server_vad",
                  silence_duration_ms: 2000,
                  threshold: 0.35,
                  prefix_padding_ms: 120,
                },
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
      } catch (e) {
        console.error("Realtime connection error:", e);
        setRealtimeStatus("disconnected");
        toast({
          status: "error",
          title:
            appLanguage === "es" ? "Error de conexión" : "Connection error",
          description: e?.message || String(e),
        });
      }
    }, [appLanguage, buildRealtimeInstructions, handleRealtimeEvent, toast]);

    const stopRealtime = useCallback(() => {
      realtimeAliveRef.current = false;
      currentAssistantIdRef.current = null;

      try {
        const a = audioRef.current;
        if (a) {
          try {
            a.pause();
          } catch {}
          const s = a.srcObject;
          if (s) {
            try {
              s.getTracks().forEach((t) => t.stop());
            } catch {}
          }
          a.srcObject = null;
        }
      } catch {}

      try {
        localRef.current?.getTracks().forEach((t) => t.stop());
      } catch {}
      localRef.current = null;

      try {
        pcRef.current?.getSenders?.().forEach((s) => s.track && s.track.stop());
        pcRef.current
          ?.getReceivers?.()
          .forEach((r) => r.track && r.track.stop());
      } catch {}

      try {
        dcRef.current?.close();
      } catch {}
      dcRef.current = null;
      try {
        pcRef.current?.close();
      } catch {}
      pcRef.current = null;

      setRealtimeStatus("disconnected");
    }, []);

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
    const hasMessages = messages.length > 0;

    // Sidebar content - shared between desktop sidebar and mobile drawer
    const SidebarContent = (
      <VStack spacing={4} align="stretch" h="100%">
        {/* Saved Chats */}
        <Box flex="1" overflowY="auto">
          <Text fontWeight="bold" mb={2} fontSize="xs" color="gray.500">
            {appLanguage === "es" ? "Tus chats" : "Your chats"}
          </Text>
          <VStack spacing={1} align="stretch">
            {savedChats.length === 0 ? (
              <Text fontSize="xs" color="gray.600" textAlign="center" py={4}>
                {appLanguage === "es"
                  ? "No hay chats guardados"
                  : "No saved chats"}
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
                    onClick={() => loadSavedChat(chat)}
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
                        aria-label={
                          appLanguage === "es" ? "Eliminar" : "Delete"
                        }
                        icon={<FaTrash size={10} />}
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        opacity={0.5}
                        _hover={{ opacity: 1 }}
                        onClick={(e) => deleteSavedChat(chat.id, e)}
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
                  {appLanguage === "es" ? "Modo morfemas" : "Morpheme mode"}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {appLanguage === "es"
                    ? "Desglosa palabras"
                    : "Break down words"}
                </Text>
              </VStack>
            </FormLabel>
            <Switch
              id="morpheme-mode-sidebar"
              colorScheme="purple"
              size="sm"
              isChecked={morphemeMode}
              onChange={toggleMorphemeMode}
            />
          </FormControl>
        </Box>

        {/* New Chat Button - at bottom */}
        <Button
          leftIcon={<FaPlus />}
          variant="outline"
          colorScheme="gray"
          size="sm"
          onClick={startNewChat}
          w="100%"
          borderColor="gray.600"
          _hover={{ bg: "gray.800" }}
        >
          {appLanguage === "es" ? "Nuevo chat" : "New chat"}
        </Button>
      </VStack>
    );

    return (
      <>
        {/* Floating button */}
        {showFloatingTrigger && (
          <Tooltip label={appLanguage === "es" ? "Ayuda" : "Help"}>
            <IconButton
              aria-label="Open help chat"
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
              onClick={onOpen}
            />
          </Tooltip>
        )}

        {/* Full screen modal chat */}
        <Modal isOpen={isOpen} onClose={onClose} size="full">
          <ModalOverlay />
          <ModalContent
            bg="gray.900"
            color="gray.100"
            borderRadius="0"
            h="100vh"
            maxH="100vh"
            m={0}
            overflow="hidden"
          >
            {/* Main layout: Sidebar + Chat Area */}
            <Flex h="100vh">
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
              <Flex flex="1" direction="column" h="100%" overflow="hidden">
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
                        aria-label={appLanguage === "es" ? "Menú" : "Menu"}
                        icon={<FaBars />}
                        variant="ghost"
                        colorScheme="gray"
                        onClick={drawerDisclosure.onOpen}
                        size="sm"
                      />
                    )}
                    {morphemeMode && (
                      <Badge colorScheme="purple" fontSize="xs">
                        {appLanguage === "es" ? "Morfemas" : "Morphemes"}
                      </Badge>
                    )}
                  </HStack>
                  <HStack spacing={2}>
                    <Button
                      leftIcon={<FaSave />}
                      variant="ghost"
                      colorScheme="gray"
                      onClick={saveCurrentChat}
                      size="sm"
                      isDisabled={messages.length === 0}
                    >
                      {appLanguage === "es" ? "Guardar" : "Save chat"}
                    </Button>
                    <ModalCloseButton position="static" />
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
                        {appLanguage === "es"
                          ? "¿Qué quieres aprender hoy?"
                          : "What do you want to learn today?"}
                      </Text>
                      {/* Centered input bar */}
                      <Box w="100%" maxW="600px" mx="auto" px={4}>
                        <Box
                          bg="gray.800"
                          border="1px solid"
                          borderColor="gray.700"
                          rounded="2xl"
                          p={2}
                        >
                          <HStack spacing={2} align="flex-end">
                            <IconButton
                              aria-label={
                                realtimeStatus === "connected"
                                  ? appLanguage === "es"
                                    ? "Detener chat de voz"
                                    : "Stop voice chat"
                                  : appLanguage === "es"
                                    ? "Iniciar chat de voz"
                                    : "Start voice chat"
                              }
                              icon={
                                realtimeStatus === "connected" ? (
                                  <FaStop />
                                ) : realtimeStatus === "connecting" ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <FaMicrophone />
                                )
                              }
                              onClick={toggleRealtime}
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
                              placeholder={
                                realtimeStatus === "connected"
                                  ? appLanguage === "es"
                                    ? "Chat de voz activo…"
                                    : "Voice chat active…"
                                  : appLanguage === "es"
                                    ? "Pregunta lo que quieras…"
                                    : "Ask anything…"
                              }
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  if (
                                    !sending &&
                                    realtimeStatus !== "connected"
                                  )
                                    handleSend();
                                }
                              }}
                              bg="transparent"
                              border="none"
                              _focus={{ boxShadow: "none", border: "none" }}
                              resize="none"
                              minH="40px"
                              maxH="120px"
                              rows={1}
                              flex="1"
                              isDisabled={realtimeStatus === "connected"}
                              fontSize="sm"
                            />
                            {sending ? (
                              <IconButton
                                onClick={handleStop}
                                colorScheme="red"
                                icon={<FaStop />}
                                size="sm"
                                rounded="full"
                              />
                            ) : (
                              <IconButton
                                onClick={handleSend}
                                bg="white"
                                color="gray.900"
                                icon={<FiSend />}
                                size="sm"
                                rounded="full"
                                isDisabled={
                                  !input.trim() ||
                                  realtimeStatus === "connected"
                                }
                                _hover={{ bg: "gray.200" }}
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
                        {messages.map((m) => {
                          const { main, gloss } = splitMainAndGloss(m.text);
                          return m.role === "user" ? (
                            <Flex key={m.id} justify="flex-end">
                              <Box
                                bg="gray.700"
                                color="white"
                                px={4}
                                py={3}
                                rounded="2xl"
                                roundedBottomRight="md"
                                maxW="80%"
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
                                    aria-label={
                                      appLanguage === "es"
                                        ? "Reproducir"
                                        : "Play"
                                    }
                                    icon={
                                      replayLoadingId === m.id ? (
                                        <Spinner size="xs" />
                                      ) : (
                                        <RiVolumeUpLine size={14} />
                                      )
                                    }
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="gray"
                                    onClick={() => playAssistantTts(m)}
                                    isDisabled={!m.text}
                                    mt={1}
                                  />
                                  <Box flex="1">
                                    {!m.done && (
                                      <Spinner size="xs" speed="0.6s" mb={2} />
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
                          bg="gray.800"
                          border="1px solid"
                          borderColor="gray.700"
                          rounded="2xl"
                          p={2}
                        >
                          <HStack spacing={2} align="flex-end">
                            <IconButton
                              aria-label={
                                realtimeStatus === "connected"
                                  ? appLanguage === "es"
                                    ? "Detener chat de voz"
                                    : "Stop voice chat"
                                  : appLanguage === "es"
                                    ? "Iniciar chat de voz"
                                    : "Start voice chat"
                              }
                              icon={
                                realtimeStatus === "connected" ? (
                                  <FaStop />
                                ) : realtimeStatus === "connecting" ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <FaMicrophone />
                                )
                              }
                              onClick={toggleRealtime}
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
                              placeholder={
                                realtimeStatus === "connected"
                                  ? appLanguage === "es"
                                    ? "Chat de voz activo…"
                                    : "Voice chat active…"
                                  : appLanguage === "es"
                                    ? "Pregunta lo que quieras…"
                                    : "Ask anything…"
                              }
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  if (
                                    !sending &&
                                    realtimeStatus !== "connected"
                                  )
                                    handleSend();
                                }
                              }}
                              bg="transparent"
                              border="none"
                              _focus={{ boxShadow: "none", border: "none" }}
                              resize="none"
                              minH="40px"
                              maxH="120px"
                              rows={1}
                              flex="1"
                              isDisabled={realtimeStatus === "connected"}
                              fontSize="sm"
                            />
                            {sending ? (
                              <IconButton
                                onClick={handleStop}
                                colorScheme="red"
                                icon={<FaStop />}
                                size="sm"
                                rounded="full"
                              />
                            ) : (
                              <IconButton
                                onClick={handleSend}
                                bg="white"
                                color="gray.900"
                                icon={<FiSend />}
                                size="sm"
                                rounded="full"
                                isDisabled={
                                  !input.trim() ||
                                  realtimeStatus === "connected"
                                }
                                _hover={{ bg: "gray.200" }}
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
          </ModalContent>
        </Modal>

        {/* Mobile Drawer Menu */}
        {!isDesktop && (
          <Drawer
            isOpen={drawerDisclosure.isOpen}
            placement="left"
            onClose={drawerDisclosure.onClose}
          >
            <DrawerOverlay />
            <DrawerContent bg="gray.900" color="gray.100" maxW="280px">
              <DrawerCloseButton />
              <DrawerHeader
                borderBottomWidth="1px"
                borderColor="gray.800"
                py={3}
              >
                <Text fontSize="sm">
                  {appLanguage === "es" ? "Menú" : "Menu"}
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
