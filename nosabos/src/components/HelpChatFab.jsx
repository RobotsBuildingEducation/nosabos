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
} from "@chakra-ui/react";
import { FaPaperPlane, FaStop, FaMicrophone } from "react-icons/fa";
import { MdOutlineSupportAgent } from "react-icons/md";
import { DEFAULT_TTS_VOICE, getRandomVoice } from "../utils/tts";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { simplemodel } from "../firebaseResources/firebaseResources";
import { translations } from "../utils/translation";

const REALTIME_MODEL =
  (import.meta.env.VITE_REALTIME_MODEL || "gpt-realtime-mini") + "";

const REALTIME_URL = `${
  import.meta.env.VITE_REALTIME_URL
}?model=gpt-realtime-mini/exchangeRealtimeSDP?model=${encodeURIComponent(
  REALTIME_MODEL
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
    ref
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

    // Realtime voice chat state
    const [realtimeStatus, setRealtimeStatus] = useState("disconnected"); // disconnected | connecting | connected
    const audioRef = useRef(null);
    const pcRef = useRef(null);
    const localRef = useRef(null);
    const dcRef = useRef(null);
    const realtimeAliveRef = useRef(false);

    // -- helpers ---------------------------------------------------------------

    const pushMessage = (m) => setMessages((prev) => [...prev, m]);

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
      const primaryLang = targetLang;
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
          nah: "Nahuatl (nàhuatl)",
        }[code] || code);

      const strict =
        primaryLang === "es"
          ? "Da la respuesta principal en español (idioma de práctica). Puedes iniciar con una breve nota en el idioma de apoyo si ayuda."
          : primaryLang === "en"
          ? "Give the main answer in English (practice language). You may start with a brief note in the support language if helpful."
          : `Provide the main answer in ${nameFor(
              primaryLang
            )} (${primaryLang}). You may start with a brief note in the support language if helpful.`;

      const levelHint =
        lvl === "beginner"
          ? "Use short, simple sentences."
          : lvl === "intermediate"
          ? "Be concise and natural."
          : "Be very succinct and native-like.";

      // Gloss (secondary) language: translate to the learner's support language when different
      const glossLang =
        showTranslations && supportLang !== primaryLang ? supportLang : null;

      const glossHuman = glossLang ? nameFor(glossLang) : "";
      const supportNote =
        supportLang !== primaryLang
          ? `Start with 1-2 helpful sentences in ${
              glossHuman || nameFor(supportLang)
            } to explain the idea or clear up confusion. Keep it concise.`
          : "Start with 1-2 helpful sentences in the learner's language to explain the idea or clear up confusion. Keep it concise.";

      const glossLine = glossLang
        ? `After your main answer, add one short translation in ${glossHuman}. Put it on a new line starting with "// ".`
        : "Do not add any translation/gloss.";
      return [
        "You are a helpful language study buddy for quick questions.",
        strict,
        levelHint,
        persona ? `Persona: ${persona}.` : "",
        focus ? `Focus area: ${focus}.` : "",
        supportNote,
        "Keep replies ≤ 60 words.",
        glossLine,
        "Use concise Markdown when helpful (bullets, **bold**, code, tables).",
      ]
        .filter(Boolean)
        .join(" ");
    }, [progress, appLanguage]);

    // Build a simple text history block (last ~6 messages) so we still have some context
    const buildHistoryBlock = useCallback(() => {
      const last = messages.slice(-6);
      if (!last.length) return "";
      const lines = last.map((m) =>
        m.role === "user" ? `User: ${m.text}` : `Assistant: ${m.text}`
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
      ]
    );

    const handleStop = () => {
      stopRef.current = true;
      setSending(false);
    };

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
          nah: "Nahuatl",
        }[code] || code);

      const levelHint =
        lvl === "beginner"
          ? "Use short, simple sentences. Speak slowly and clearly."
          : lvl === "intermediate"
          ? "Be concise and natural. Normal speaking pace."
          : "Be succinct and native-like. Natural pace.";

      return [
        "You are a helpful language study buddy for quick voice conversations.",
        `The learner is practicing ${nameFor(targetLang)}.`,
        `Their native/support language is ${nameFor(supportLang)}.`,
        `Level: ${lvl}. ${levelHint}`,
        persona ? `Persona: ${persona}.` : "",
        focus ? `Focus area: ${focus}.` : "",
        "Keep responses brief (under 30 seconds of speech).",
        "Be encouraging and helpful. Correct mistakes gently.",
        `Respond primarily in ${nameFor(targetLang)} with brief ${nameFor(supportLang)} clarifications when helpful.`,
      ]
        .filter(Boolean)
        .join(" ");
    }, [progress]);

    const handleRealtimeEvent = useCallback((evt) => {
      try {
        const data = JSON.parse(evt.data);

        // Handle transcription of user speech
        if (data.type === "conversation.item.input_audio_transcription.completed") {
          const text = data.transcript?.trim();
          if (text) {
            const userId = crypto.randomUUID?.() || String(Date.now());
            pushMessage({ id: userId, role: "user", text, done: true });
          }
        }

        // Handle assistant response transcript
        if (data.type === "response.audio_transcript.delta") {
          const delta = data.delta || "";
          setMessages((prev) => {
            const lastIdx = prev.length - 1;
            if (lastIdx >= 0 && prev[lastIdx].role === "assistant" && !prev[lastIdx].done) {
              const updated = [...prev];
              updated[lastIdx] = { ...updated[lastIdx], text: updated[lastIdx].text + delta };
              return updated;
            }
            // Start new assistant message
            const assistantId = crypto.randomUUID?.() || String(Date.now());
            return [...prev, { id: assistantId, role: "assistant", text: delta, done: false }];
          });
        }

        if (data.type === "response.audio_transcript.done") {
          setMessages((prev) => {
            const lastIdx = prev.length - 1;
            if (lastIdx >= 0 && prev[lastIdx].role === "assistant") {
              const updated = [...prev];
              updated[lastIdx] = { ...updated[lastIdx], done: true };
              return updated;
            }
            return prev;
          });
        }
      } catch (e) {
        console.warn("Realtime event parse error:", e);
      }
    }, [pushMessage]);

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
            })
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
        if (!resp.ok) throw new Error(`SDP exchange failed: HTTP ${resp.status}`);
        await pc.setRemoteDescription({ type: "answer", sdp: answer });

        setRealtimeStatus("connected");
        realtimeAliveRef.current = true;

        toast({
          status: "success",
          title: appLanguage === "es" ? "Chat de voz conectado" : "Voice chat connected",
          description: appLanguage === "es" ? "Puedes empezar a hablar" : "You can start speaking",
          duration: 3000,
        });
      } catch (e) {
        console.error("Realtime connection error:", e);
        setRealtimeStatus("disconnected");
        toast({
          status: "error",
          title: appLanguage === "es" ? "Error de conexión" : "Connection error",
          description: e?.message || String(e),
        });
      }
    }, [appLanguage, buildRealtimeInstructions, handleRealtimeEvent, toast]);

    const stopRealtime = useCallback(() => {
      realtimeAliveRef.current = false;

      try {
        const a = audioRef.current;
        if (a) {
          try { a.pause(); } catch {}
          const s = a.srcObject;
          if (s) {
            try { s.getTracks().forEach((t) => t.stop()); } catch {}
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
        pcRef.current?.getReceivers?.().forEach((r) => r.track && r.track.stop());
      } catch {}

      try { dcRef.current?.close(); } catch {}
      dcRef.current = null;
      try { pcRef.current?.close(); } catch {}
      pcRef.current = null;

      setRealtimeStatus("disconnected");

      toast({
        status: "info",
        title: appLanguage === "es" ? "Chat de voz desconectado" : "Voice chat disconnected",
        duration: 2000,
      });
    }, [appLanguage, toast]);

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

    const openAndSend = useCallback(
      (text) => {
        const payload = normalizeQuestion(text);
        if (!payload) return;
        onOpen();
        setInput(payload);
        setTimeout(() => handleSend(payload), 0);
      },
      [handleSend, normalizeQuestion, onOpen]
    );

    useImperativeHandle(
      ref,
      () => ({
        open: onOpen,
        openAndSend,
      }),
      [openAndSend, onOpen]
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

    return (
      <>
        {/* Floating button */}
        {showFloatingTrigger && (
          <Tooltip label={appLanguage === "es" ? "Ayuda" : "Help"}>
            <IconButton
              aria-label="Open help chat"
              icon={<MdOutlineSupportAgent size={20} />}
              bg="white"
              color="blue"
              border="4px solid skyblue"
              rounded="full"
              size="lg"
              position="fixed"
              bottom={{ base: "4", md: "4" }}
              right="20px"
              zIndex={50}
              boxShadow="lg"
              onClick={onOpen}
            />
          </Tooltip>
        )}

        {/* Modal chat */}
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          size="lg"
          scrollBehavior="inside"
        >
          <ModalOverlay />
          <ModalContent
            bg="gray.900"
            color="gray.100"
            borderRadius="2xl"
            border="1px solid"
            borderColor="gray.700"
            h="75vh"
            display="flex"
            flexDirection="column"
          >
            <ModalHeader>
              {appLanguage === "es" ? "Ayuda rápida" : "Quick Help"}
            </ModalHeader>
            <ModalCloseButton />

            <ModalBody
              flex="1"
              overflowY="auto"
              ref={scrollRef}
              sx={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                "::-webkit-scrollbar": { display: "none", width: 0, height: 0 },
              }}
            >
              <VStack align="stretch" spacing={3}>
                {messages.length === 0 && (
                  <Box
                    fontSize="sm"
                    opacity={0.85}
                    bg="gray.800"
                    p={3}
                    rounded="lg"
                    border="1px solid"
                    borderColor="gray.700"
                  >
                    {appLanguage === "es"
                      ? "Haz una pregunta rápida. Te daré una breve explicación en tu idioma de apoyo y luego responderé en tu idioma de práctica; si está activado, también incluiré una traducción corta a tu idioma de apoyo."
                      : "Ask a quick question. I’ll give a short explanation in your support language and then answer in your practice language; if enabled, I’ll also include a brief translation into your support language."}
                  </Box>
                )}

                {messages.map((m) => {
                  const { main, gloss } = splitMainAndGloss(m.text);
                  return m.role === "user" ? (
                    <HStack key={m.id} justify="flex-end">
                      <Box
                        bg="blue.500"
                        color="white"
                        p={3}
                        rounded="xl"
                        maxW="85%"
                        boxShadow="0 6px 20px rgba(0,0,0,0.25)"
                      >
                        <Markdown>{m.text}</Markdown>
                      </Box>
                    </HStack>
                  ) : (
                    <HStack key={m.id} justify="flex-start">
                      <Box
                        bg="gray.800"
                        border="1px solid"
                        borderColor="gray.700"
                        p={3}
                        rounded="xl"
                        maxW="85%"
                      >
                        <HStack mb={1} justify="space-between">
                          {!m.done && <Spinner size="xs" speed="0.6s" />}
                        </HStack>

                        <Markdown>{main}</Markdown>

                        {!!gloss && (
                          <Box opacity={0.8} fontSize="sm" mt={1}>
                            <Markdown>{gloss}</Markdown>
                          </Box>
                        )}
                      </Box>
                    </HStack>
                  );
                })}
              </VStack>
            </ModalBody>

            {/* Hidden audio element for realtime playback */}
            <audio ref={audioRef} style={{ display: "none" }} />

            <ModalFooter>
              <HStack w="100%" spacing={2}>
                {/* Microphone button for realtime voice chat */}
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
                  isDisabled={realtimeStatus === "connecting" || sending}
                  colorScheme={realtimeStatus === "connected" ? "red" : "purple"}
                  variant={realtimeStatus === "connected" ? "solid" : "outline"}
                  size="md"
                  flexShrink={0}
                />
                <Input
                  placeholder={
                    realtimeStatus === "connected"
                      ? appLanguage === "es"
                        ? "Chat de voz activo…"
                        : "Voice chat active…"
                      : appLanguage === "es"
                      ? "Escribe tu pregunta…"
                      : "Type your question…"
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (!sending && realtimeStatus !== "connected") handleSend();
                    }
                  }}
                  bg="gray.800"
                  borderColor={realtimeStatus === "connected" ? "purple.500" : "gray.700"}
                  isDisabled={realtimeStatus === "connected"}
                />
                {sending ? (
                  <Button
                    onClick={handleStop}
                    colorScheme="red"
                    leftIcon={<FaStop />}
                  >
                    {appLanguage === "es" ? "Detener" : "Stop"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSend}
                    colorScheme="teal"
                    leftIcon={<FaPaperPlane />}
                    isDisabled={!input.trim() || realtimeStatus === "connected"}
                  >
                    {appLanguage === "es" ? "Enviar" : "Send"}
                  </Button>
                )}
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    );
  }
);

export default HelpChatFab;
