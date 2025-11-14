// components/HelpChatFab.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { RiChatSmile2Line } from "react-icons/ri";
import { FaPaperPlane, FaStop } from "react-icons/fa";
import { MdOutlineSupportAgent } from "react-icons/md";

import ReactMarkdown from "react-markdown"; // ✅ NEW
import remarkGfm from "remark-gfm"; // ✅ NEW

import { simplemodel } from "../firebaseResources/firebaseResources"; // ✅ pre-built Gemini model
import { translations } from "../utils/translation";

/**
 * Small Markdown renderer mapped to Chakra components
 */
function Markdown({ children }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      // linkTarget="_blank"
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
 * Floating Help Chat (Gemini, client-side streaming)
 *
 * Props:
 *   - progress: user's settings object (level, supportLang, targetLang, voicePersona, helpRequest, showTranslations, ...)
 *   - appLanguage: "en" | "es" (UI language fallback for 'bilingual' support setting)
 */
export default function HelpChatFab({ progress, appLanguage = "en" }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const ui = translations[appLanguage] || translations.en;

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]); // {id, role: 'user'|'assistant', text, done}
  const chatRef = useRef(null);
  const stopRef = useRef({ stop: false });

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

  // Extract text from a streaming chunk (be tolerant of shapes)
  const textFromChunk = (chunk) => {
    try {
      if (!chunk) return "";
      if (typeof chunk.text === "function") return chunk.text() || "";
      if (typeof chunk.text === "string") return chunk.text;
      const cand = chunk.candidates?.[0];
      if (cand?.content?.parts?.length) {
        return cand.content.parts.map((p) => p.text || "").join("");
      }
    } catch {}
    return "";
  };

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

  // Build system instruction — PRIMARY ANSWER IS IN SUPPORT LANGUAGE
  const buildInstruction = useCallback(() => {
    const lvl = progress?.level || "beginner";

    // Primary reply language = support language (if 'bilingual', fall back to UI language)
    const supportRaw =
      ["en", "es", "bilingual"].includes(progress?.supportLang) &&
      progress?.supportLang
        ? progress.supportLang
        : "en";
    const primaryLang =
      supportRaw === "bilingual"
        ? appLanguage === "es"
          ? "es"
          : "en"
        : supportRaw;

    const targetLang = progress?.targetLang || "es"; // used for gloss preference
    const persona = (progress?.voicePersona || "").slice(0, 200);
    const focus = (progress?.helpRequest || "").slice(0, 200);
    const showTranslations =
      typeof progress?.showTranslations === "boolean"
        ? progress.showTranslations
        : true;

    const strict =
      primaryLang === "es"
        ? "Responde SOLO en español."
        : "Answer ONLY in English.";

    const levelHint =
      lvl === "beginner"
        ? "Use short, simple sentences."
        : lvl === "intermediate"
        ? "Be concise and natural."
        : "Be very succinct and native-like.";

    // Gloss (secondary) language: prefer the target language if it's EN/ES and differs from primary; else the opposite of primary
    const glossLang =
      (targetLang === "en" || targetLang === "es") && targetLang !== primaryLang
        ? targetLang
        : primaryLang === "en"
        ? "es"
        : "en";

    const glossHuman =
      glossLang === "es"
        ? "Spanish (español)"
        : glossLang === "pt"
        ? "Portuguese (português brasileiro)"
        : "English";
    const glossLine = showTranslations
      ? `After your main answer, add one short translation in ${glossHuman}. Put it on a new line starting with "// ".`
      : "Do not add any translation/gloss.";
    return [
      "You are a helpful language study buddy for quick questions.",
      strict,
      levelHint,
      persona ? `Persona: ${persona}.` : "",
      focus ? `Focus area: ${focus}.` : "",
      "Keep replies ≤ 60 words.",
      glossLine,
      // ✅ Encourage Markdown for structure/clarity
      "Use concise Markdown when helpful (bullets, **bold**, code, tables).",
    ]
      .filter(Boolean)
      .join(" ");
  }, [progress, appLanguage]);

  // -- lifecycle -------------------------------------------------------------

  // Initialize the chat session when the modal opens (or lazily in handleSend)
  useEffect(() => {
    if (!isOpen) return;
    if (chatRef.current || !simplemodel) return;
    try {
      chatRef.current = simplemodel.startChat({ history: [] });
    } catch (e) {
      toast({
        status: "error",
        title: "Gemini unavailable",
        description: String(e?.message || e),
      });
    }
  }, [isOpen, toast]);

  // -- actions ---------------------------------------------------------------

  const handleSend = async () => {
    const question = input.trim();
    if (!question) return;

    // lazy-create chat if needed
    if (!chatRef.current) {
      if (!simplemodel) {
        return toast({
          status: "error",
          title: "Gemini not initialized",
          description: "simplemodel is unavailable.",
        });
      }
      try {
        chatRef.current = simplemodel.startChat({ history: [] });
      } catch (e) {
        return toast({
          status: "error",
          title: "Gemini unavailable",
          description: String(e?.message || e),
        });
      }
    }

    setInput("");
    stopRef.current.stop = false;

    const instruction = buildInstruction();
    const prompt = `${instruction}\n\nUser question:\n${question}`;

    const userId = crypto.randomUUID?.() || String(Date.now());
    pushMessage({ id: userId, role: "user", text: question, done: true });

    const assistantId = crypto.randomUUID?.() || String(Date.now() + 1);
    pushMessage({ id: assistantId, role: "assistant", text: "", done: false });

    try {
      setSending(true);

      // Stream from Gemini
      const res = await chatRef.current.sendMessageStream(prompt);

      for await (const chunk of res.stream) {
        if (stopRef.current.stop) break;
        const piece = textFromChunk(chunk);
        if (piece) {
          patchLastAssistant((m) => ({ ...m, text: m.text + piece }));
        }
      }

      const agg = await res.response;
      const finalText =
        (typeof agg?.text === "function" ? agg.text() : agg?.text) || "";
      patchLastAssistant((m) => ({
        ...m,
        text: finalText || m.text,
        done: true,
      }));
    } catch (e) {
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
  };

  const handleStop = () => {
    stopRef.current.stop = true;
    setSending(false);
  };

  // -- UI --------------------------------------------------------------------

  return (
    <>
      {/* Floating button */}
      <Tooltip label={appLanguage === "es" ? "Ayuda" : "Help"}>
        <IconButton
          aria-label="Open help chat"
          icon={<MdOutlineSupportAgent size={22} />}
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

          {/* Body should take remaining space and scroll; hide scrollbar visually */}
          <ModalBody
            flex="1"
            overflowY="auto"
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
                    ? "Haz una pregunta rápida. Responderé en tu idioma de apoyo y (si está activado) incluiré una breve traducción."
                    : "Ask a quick question. I’ll answer in your support language and (if enabled) include a short translation."}
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
                      {/* Render user's Markdown too (nice for code snippets) */}
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

                      {/* ✅ Assistant Markdown */}
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

          <ModalFooter>
            <HStack w="100%" spacing={2}>
              <Input
                placeholder={
                  appLanguage === "es"
                    ? "Escribe tu pregunta…"
                    : "Type your question…"
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!sending) handleSend();
                  }
                }}
                bg="gray.800"
                borderColor="gray.700"
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
                  isDisabled={!input.trim()}
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
