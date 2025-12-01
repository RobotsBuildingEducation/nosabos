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
import { FaPaperPlane, FaStop } from "react-icons/fa";
import { MdOutlineSupportAgent } from "react-icons/md";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { simplemodel } from "../firebaseResources/firebaseResources";
import { translations } from "../utils/translation";

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
export default function HelpChatFab({
  progress,
  appLanguage = "en",
  isOpen: controlledIsOpen,
  onOpen: controlledOnOpen,
  onClose: controlledOnClose,
  showFloatingTrigger = true,
}) {
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

  const handleSend = async () => {
    const question = input.trim();
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
    pushMessage({ id: assistantId, role: "assistant", text: "", done: false });

    try {
      setSending(true);

      // 🔥 STREAMING – same pattern as your working component
      const result = await simplemodel.generateContentStream(prompt);

      let fullText = "";

      for await (const chunk of result.stream) {
        if (stopRef.current) break;

        const chunkText = typeof chunk.text === "function" ? chunk.text() : "";

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
  };

  const handleStop = () => {
    stopRef.current = true;
    setSending(false);
  };

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
