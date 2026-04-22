import React, { useMemo, useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LockIcon } from "@chakra-ui/icons";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  normalizeSupportLanguage,
} from "../constants/languages";

function supportCopy(lang, en, es, pt, it, fr, ja) {
  if (lang === "ja") return ja || en;
  if (lang === "fr") return fr || en;
  if (lang === "it") return it || en;
  if (lang === "pt") return pt || en;
  if (lang === "es") return es || en;
  return en;
}

export default function SubscriptionGate({
  appLanguage = "en",
  t = {},
  onSubmit,
  isSubmitting = false,
  error = "",
}) {
  const lang = normalizeSupportLanguage(appLanguage, DEFAULT_SUPPORT_LANGUAGE);
  const [value, setValue] = useState("");
  const [localError, setLocalError] = useState("");

  const instructions = useMemo(
    () => t["passcode.instructions"] || t.passcode?.instructions,
    [t]
  );
  const label = useMemo(
    () => t["passcode.label"] || t.passcode?.label || "Passcode",
    [t]
  );
  const invalidMessage =
    error ||
    localError ||
    t.invalid ||
    t.passcode?.invalid ||
    "Invalid passcode. Please try again.";

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLocalError("");
    const normalized = (value || "").trim();
    if (!normalized) {
      setLocalError(
        supportCopy(
          lang,
          "Enter the passcode",
          "Ingresa el código de acceso",
          "Digite o código de acesso",
          "Inserisci il codice di accesso",
          "Entre le code d'acces",
          "パスコードを入力してください",
        ),
      );
      return;
    }
    await onSubmit?.(normalized, setLocalError);
  };

  return (
    <Box
      minH="100vh"
      bg="gray.950"
      color="gray.50"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
    >
      <Box
        as="form"
        onSubmit={handleSubmit}
        bg="gray.900"
        borderWidth="1px"
        borderColor="gray.700"
        borderRadius="lg"
        p={{ base: 6, md: 8 }}
        maxW="480px"
        w="100%"
        boxShadow="xl"
      >
        <VStack align="stretch" spacing={6}>
          <Box>
            <Heading size="lg" mb={2}>
              {label}
            </Heading>
            <Text color="gray.200">{instructions}</Text>
          </Box>

          <Stack spacing={3} mt={4}>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <LockIcon color="gray.400" />
              </InputLeftElement>

              <Input
                bg="gray.800"
                borderColor="gray.700"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={label}
                autoComplete="off"
                fontSize="16px"
              />
            </InputGroup>
            {(error || localError) && (
              <Alert status="error" bg="red.900" borderColor="red.700">
                <AlertIcon />
                <Text fontSize="sm">{invalidMessage}</Text>
              </Alert>
            )}
            <Button
              colorScheme="teal"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              loadingText={supportCopy(
                lang,
                "Verifying",
                "Verificando",
                "Verificando",
                "Verifica in corso",
                "Verification",
                "確認中",
              )}
            >
              {supportCopy(
                lang,
                "Submit",
                "Enviar",
                "Enviar",
                "Invia",
                "Envoyer",
                "送信",
              )}
            </Button>
          </Stack>
        </VStack>
      </Box>
    </Box>
  );
}
