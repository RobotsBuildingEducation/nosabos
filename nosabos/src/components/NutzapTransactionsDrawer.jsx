import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  IconButton,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { RepeatIcon } from "@chakra-ui/icons";
import NDK, { NDKNutzap, profileFromEvent } from "@nostr-dev-kit/ndk";
import { nip19 } from "nostr-tools";

import { useNostrWalletStore } from "../hooks/useNostrWalletStore";
import { nativeDrawerMotionProps, nativeOverlayMotionProps } from "../utils/modalMotion";

const DEFAULT_RELAYS = [
  "wss://relay.ditto.pub",
  "wss://relay.primal.net",
  "wss://nos.lol",
];
const LOOKBACK_SECONDS = 30 * 24 * 60 * 60;
const EVENT_LIMIT = 100;
const RELAY_QUERY_TIMEOUT = 6000;
const REQUIRED_NOTE = "Robots Building Education";

const COPY = {
  en: {
    title: "Public transactions",
    from: "From",
    to: "To",
    loading: "Reading public nutzaps…",
    empty: "No public transactions found.",
    error: "Could not read transactions from the Nostr relays.",
    retry: "Try again",
    refresh: "Refresh transactions",
  },
  es: {
    title: "Transacciones públicas",
    from: "De",
    to: "Para",
    loading: "Leyendo nutzaps públicos…",
    empty: "No se encontraron transacciones públicas.",
    error: "No se pudieron leer las transacciones de los relays de Nostr.",
    retry: "Intentar de nuevo",
    refresh: "Actualizar transacciones",
  },
  pt: {
    title: "Transações públicas",
    from: "De",
    to: "Para",
    loading: "Lendo nutzaps públicos…",
    empty: "Nenhuma transação pública encontrada.",
    error: "Não foi possível ler as transações dos relays Nostr.",
    retry: "Tentar novamente",
    refresh: "Atualizar transações",
  },
  it: {
    title: "Transazioni pubbliche",
    from: "Da",
    to: "A",
    loading: "Lettura dei nutzap pubblici…",
    empty: "Nessuna transazione pubblica trovata.",
    error: "Impossibile leggere le transazioni dai relay Nostr.",
    retry: "Riprova",
    refresh: "Aggiorna transazioni",
  },
  fr: {
    title: "Transactions publiques",
    from: "De",
    to: "À",
    loading: "Lecture des nutzaps publics…",
    empty: "Aucune transaction publique trouvée.",
    error: "Impossible de lire les transactions depuis les relais Nostr.",
    retry: "Réessayer",
    refresh: "Actualiser les transactions",
  },
  de: {
    title: "Öffentliche Transaktionen",
    from: "Von",
    to: "An",
    loading: "Öffentliche Nutzaps werden geladen…",
    empty: "Keine öffentlichen Transaktionen gefunden.",
    error: "Transaktionen konnten nicht von den Nostr-Relays gelesen werden.",
    retry: "Erneut versuchen",
    refresh: "Transaktionen aktualisieren",
  },
  ja: {
    title: "公開取引",
    from: "送信元",
    to: "送信先",
    loading: "公開Nutzapを読み込み中…",
    empty: "公開取引が見つかりません。",
    error: "Nostrリレーから取引を読み込めませんでした。",
    retry: "再試行",
    refresh: "取引を更新",
  },
  hi: {
    title: "सार्वजनिक लेन-देन",
    from: "भेजने वाला",
    to: "प्राप्तकर्ता",
    loading: "सार्वजनिक nutzaps पढ़े जा रहे हैं…",
    empty: "कोई सार्वजनिक लेन-देन नहीं मिला।",
    error: "Nostr relays से लेन-देन पढ़े नहीं जा सके।",
    retry: "फिर कोशिश करें",
    refresh: "लेन-देन रीफ़्रेश करें",
  },
  ar: {
    title: "المعاملات العامة",
    from: "من",
    to: "إلى",
    loading: "جارٍ قراءة nutzaps العامة…",
    empty: "لم يتم العثور على معاملات عامة.",
    error: "تعذرت قراءة المعاملات من Nostr relays.",
    retry: "حاول مرة أخرى",
    refresh: "تحديث المعاملات",
  },
};

function shortKey(value = "") {
  if (value.length < 18) return value || "unknown";
  return `${value.slice(0, 10)}…${value.slice(-6)}`;
}

function npubFor(pubkey) {
  try {
    return nip19.npubEncode(pubkey);
  } catch {
    return pubkey || "";
  }
}

function displayName(pubkey, profiles) {
  const profile = profiles.get(pubkey);
  return (
    profile?.displayName ||
    profile?.name ||
    profile?.nip05 ||
    shortKey(npubFor(pubkey))
  );
}

function formatTime(timestamp, language) {
  const date = new Date(timestamp * 1000);
  if (!Number.isFinite(date.getTime())) return "";

  return new Intl.DateTimeFormat(language || undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function latestEventsByAuthor(events) {
  const latest = new Map();

  for (const event of events) {
    const current = latest.get(event.pubkey);
    if (!current || (current.created_at || 0) < (event.created_at || 0)) {
      latest.set(event.pubkey, event);
    }
  }

  return latest;
}

function fetchEventsWithTimeout(ndk, filters) {
  return new Promise((resolve, reject) => {
    const events = new Map();
    let finished = false;
    let subscription;
    let timer;

    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      subscription?.stop();
      resolve(new Set(events.values()));
    };

    try {
      subscription = ndk.subscribe(
        filters,
        { closeOnEose: false },
        {
          onEvent: (event) => events.set(event.id, event),
          onEose: finish,
        },
      );
      timer = setTimeout(finish, RELAY_QUERY_TIMEOUT);
    } catch (error) {
      clearTimeout(timer);
      reject(error);
    }
  });
}

function parseNutzap(event) {
  try {
    const nutzap = NDKNutzap.from(event);
    const amount = Number(nutzap?.amount);
    const proofsAreValid =
      nutzap?.proofs?.length > 0 &&
      nutzap.proofs.every(
        (proof) => Number.isFinite(proof.amount) && proof.amount > 0,
      );

    if (
      !nutzap ||
      event.verifySignature(false) !== true ||
      !nutzap.isValid ||
      !proofsAreValid ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !nutzap.pubkey ||
      !nutzap.recipientPubkey
    ) {
      return null;
    }

    return {
      id: nutzap.id,
      createdAt: nutzap.created_at || 0,
      sender: nutzap.pubkey,
      recipient: nutzap.recipientPubkey,
      amount,
      unit: nutzap.unit || "sat",
      note: nutzap.comment?.trim() || "",
    };
  } catch {
    return null;
  }
}

function Person({ label, pubkey, profiles, mutedColor, textColor }) {
  const name = displayName(pubkey, profiles);

  return (
    <Flex align="center" gap={3} minW={0}>
      <Text
        color={mutedColor}
        flex="0 0 40px"
        fontSize="10px"
        fontWeight="bold"
        letterSpacing="0.08em"
        textTransform="uppercase"
      >
        {label}
      </Text>
      <Text
        color={textColor}
        fontSize="sm"
        fontWeight="semibold"
        minW={0}
        noOfLines={1}
      >
        {name}
      </Text>
    </Flex>
  );
}

function Transaction({ transaction, profiles, copy, language, theme }) {
  return (
    <Box
      bg={theme.cardBg}
      borderColor={theme.border}
      borderRadius="14px"
      borderWidth="1px"
      p={4}
    >
      <Flex align="baseline" justify="space-between" gap={3} mb={4}>
        <Text color={theme.amount} fontSize="sm" fontWeight="bold">
          ₿{transaction.amount.toLocaleString(language || undefined)}
        </Text>
        <Text color={theme.muted} fontSize="10px" whiteSpace="nowrap">
          {formatTime(transaction.createdAt, language)}
        </Text>
      </Flex>
      <VStack align="stretch" spacing={3}>
        <Person
          label={copy.from}
          pubkey={transaction.sender}
          profiles={profiles}
          mutedColor={theme.muted}
          textColor={theme.text}
        />
        <Person
          label={copy.to}
          pubkey={transaction.recipient}
          profiles={profiles}
          mutedColor={theme.muted}
          textColor={theme.text}
        />
      </VStack>
      {transaction.note ? (
        <Text
          bg={theme.noteBg}
          borderRadius="10px"
          color={theme.text}
          fontSize="xs"
          lineHeight="1.5"
          mt={4}
          overflowWrap="anywhere"
          px={3}
          py={2}
        >
          “{transaction.note}”
        </Text>
      ) : null}
    </Box>
  );
}

export default function NutzapTransactionsDrawer({
  isOpen,
  onClose,
  userLanguage = "en",
  visualStyle = "default",
}) {
  const ndkInstance = useNostrWalletStore((state) => state.ndkInstance);
  const fallbackNdkRef = useRef(null);
  const requestRef = useRef(0);
  const [transactions, setTransactions] = useState([]);
  const [profiles, setProfiles] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const language = COPY[userLanguage] ? userLanguage : "en";
  const copy = COPY[language];
  const isPaperStyle = visualStyle === "paper";
  const theme = useMemo(
    () =>
      isPaperStyle
        ? {
            surface: "#fff9ed",
            cardBg: "#f6ecda",
            text: "#362311",
            muted: "#806543",
            border: "#dfc9a8",
            amount: "#0f766e",
            noteBg: "rgba(255, 255, 255, 0.45)",
            overlay: "rgba(76, 60, 40, 0.18)",
          }
        : {
            surface: "gray.900",
            cardBg: "whiteAlpha.50",
            text: "gray.100",
            muted: "gray.400",
            border: "whiteAlpha.200",
            amount: "teal.200",
            noteBg: "whiteAlpha.100",
            overlay: "blackAlpha.600",
          },
    [isPaperStyle],
  );

  const loadTransactions = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setError("");

    try {
      let ndk = ndkInstance;
      if (!ndk) {
        if (!fallbackNdkRef.current) {
          fallbackNdkRef.current = new NDK({ explicitRelayUrls: DEFAULT_RELAYS });
          await fallbackNdkRef.current.connect(RELAY_QUERY_TIMEOUT);
        }
        ndk = fallbackNdkRef.current;
      }

      const zapEvents = await fetchEventsWithTimeout(ndk, {
        kinds: [9321],
        since: Math.floor(Date.now() / 1000) - LOOKBACK_SECONDS,
        limit: EVENT_LIMIT,
      });
      const nextTransactions = Array.from(zapEvents)
        .map(parseNutzap)
        .filter((transaction) => transaction?.note === REQUIRED_NOTE)
        .sort((a, b) => b.createdAt - a.createdAt);

      if (requestId === requestRef.current) {
        setTransactions(nextTransactions);
      }

      const people = Array.from(
        new Set(
          nextTransactions.flatMap((transaction) => [
            transaction.sender,
            transaction.recipient,
          ]),
        ),
      );
      const nextProfiles = new Map();

      if (people.length > 0) {
        const profileEvents = await fetchEventsWithTimeout(ndk, {
          kinds: [0],
          authors: people,
          limit: people.length,
        });

        for (const [pubkey, event] of latestEventsByAuthor(profileEvents)) {
          try {
            nextProfiles.set(pubkey, profileFromEvent(event));
          } catch {
            // Malformed profile metadata should not hide a valid transaction.
          }
        }
      }

      if (requestId === requestRef.current) {
        setProfiles(nextProfiles);
      }
    } catch (loadError) {
      if (requestId === requestRef.current) {
        setError(loadError?.message || copy.error);
      }
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [copy.error, ndkInstance]);

  useEffect(() => {
    if (!isOpen) return undefined;
    loadTransactions();

    return () => {
      requestRef.current += 1;
    };
  }, [isOpen, loadTransactions]);

  useEffect(
    () => () => {
      const ndk = fallbackNdkRef.current;
      fallbackNdkRef.current = null;
      if (ndk) {
        for (const relay of ndk.pool.relays.values()) relay.disconnect();
      }
    },
    [],
  );

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="sm">
      <DrawerOverlay motionProps={nativeOverlayMotionProps} bg={theme.overlay} />
      <DrawerContent
        motionProps={nativeDrawerMotionProps}
        bg={theme.surface}
        color={theme.text}
        borderLeftColor={theme.border}
        borderLeftWidth="1px"
        maxW={{ base: "90vw", md: "sm" }}
        w={{ base: "90vw", md: "sm" }}
      >
        <DrawerCloseButton top={4} right={4} />
        <DrawerHeader pb={3} pr={24}>
          <HStack spacing={2}>
            <Text fontSize="lg">{copy.title}</Text>
            <IconButton
              aria-label={copy.refresh}
              icon={<RepeatIcon />}
              isLoading={loading && transactions.length > 0}
              onClick={loadTransactions}
              size="xs"
              variant="ghost"
            />
          </HStack>
        </DrawerHeader>
        <DrawerBody pb={6}>
          {loading && transactions.length === 0 ? (
            <VStack color={theme.muted} py={16} spacing={4}>
              <Spinner color={theme.amount} size="md" />
              <Text fontSize="sm">{copy.loading}</Text>
            </VStack>
          ) : error ? (
            <VStack align="stretch" py={8} spacing={4}>
              <Text color={theme.muted} fontSize="sm">
                {copy.error}
              </Text>
              <Button onClick={loadTransactions} size="sm" variant="outline">
                {copy.retry}
              </Button>
            </VStack>
          ) : transactions.length === 0 ? (
            <Text color={theme.muted} fontSize="sm" py={12} textAlign="center">
              {copy.empty}
            </Text>
          ) : (
            <VStack align="stretch" spacing={3}>
              {transactions.map((transaction) => (
                <Transaction
                  key={transaction.id}
                  transaction={transaction}
                  profiles={profiles}
                  copy={copy}
                  language={language}
                  theme={theme}
                />
              ))}
            </VStack>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
