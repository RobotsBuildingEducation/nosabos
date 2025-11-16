import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Badge,
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Image,
  Link,
  Progress,
  Spinner,
  Switch,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import useNOSTR from "../../hooks/useNOSTR";

const TOTAL_FEED_STEPS = 120;
const HASHTAG = "LearnWithNostr";
const HASHTAG_LABEL = "#LearnWithNostr";

const BUCKETS = [
  { max: 15, scheme: "gray", color: "#808080" },
  { max: 30, scheme: "cyan", color: "#22d3ee" },
  { max: 45, scheme: "purple", color: "#a855f7" },
  { max: 65, scheme: "cyan", color: "#06b6d4" },
  { max: 85, scheme: "blue", color: "#3b82f6" },
  { max: 110, scheme: "teal", color: "#0d9488" },
  { max: Infinity, scheme: "green", color: "#22c55e" },
];

const lightenColor = (hex, percent) => {
  const clean = hex.replace(/^#/, "");
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const apply = (value) =>
    Math.min(255, Math.floor(value + (255 - value) * percent));
  const next = (apply(r) << 16) | (apply(g) << 8) | apply(b);
  return `#${next.toString(16).padStart(6, "0")}`;
};

const colorForQuestion = (questionNumber = 0) => {
  const bucket =
    BUCKETS.find((entry) => questionNumber <= entry.max) || BUCKETS[0];
  return bucket;
};

const ReplaceHashtagWithLink = ({ text = "" }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return (
    <>
      {parts.map((part, index) => {
        const isUrl = urlRegex.test(part);
        urlRegex.lastIndex = 0;
        if (isUrl) {
          return (
            <Link
              key={`${part}-${index}`}
              href={part}
              color="blue.400"
              isExternal
              textDecoration="underline"
            >
              {part}
            </Link>
          );
        }
        return part;
      })}
    </>
  );
};

const sanitizeProfiles = (profiles = []) => {
  const bannedNames = new Set(["data", "test", "hi", "text", "hii"]);
  return profiles
    .filter((item) => {
      const name = item?.profile?.name?.toLowerCase();
      return !name || !bannedNames.has(name);
    })
    .sort((a, b) => (b?.createdAt || 0) - (a?.createdAt || 0));
};

export default function TeamFeed({
  userLanguage = "en",
  t = {},
  allowPosts = false,
  onAllowPostsChange,
}) {
  const toast = useToast();
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { getGlobalNotesWithProfilesByHashtag } = useNOSTR(
    typeof window !== "undefined" ? localStorage.getItem("local_npub") : "",
    typeof window !== "undefined" ? localStorage.getItem("local_nsec") : ""
  );

  const localeStrings = useMemo(() => {
    if (userLanguage === "es") {
      return {
        instructions:
          "Comparte tu progreso con la comunidad usando #LearnWithNostr y muestra lo que estás practicando.",
        copyButton: "Copiar llave privada",
        copyTitle: "Llave copiada",
        copyDescription: "Tu llave se copió al portapapeles.",
        allowLabel: "Permitir publicaciones automáticas",
        allowEnabled: "Las publicaciones automáticas están activadas.",
        allowDisabled: "Las publicaciones automáticas están desactivadas.",
        refresh: "Actualizar",
        loading: "Sincronizando con la comunidad...",
        empty: "Aún no hay publicaciones. ¡Sé la primera persona en compartir!",
        error: "No se pudo cargar el feed.",
        copyFallback: "No se pudo copiar la llave.",
      };
    }
    return {
      instructions:
        "Share your progress with the community using #LearnWithNostr and show what you're practicing.",
      copyButton: "Copy secret key",
      copyTitle: "Keys copied",
      copyDescription: "Your key was copied to the clipboard.",
      allowLabel: "Allow posts",
      allowEnabled: "Automatic community posts enabled.",
      allowDisabled: "Automatic community posts disabled.",
      refresh: "Refresh",
      loading: "Syncing with the community...",
      empty: "No posts yet. Start the conversation!",
      error: "Unable to load the feed.",
      copyFallback: "Unable to copy key.",
    };
  }, [userLanguage]);

  const fetchFeed = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getGlobalNotesWithProfilesByHashtag(HASHTAG);
      console.log("data", data);
      setProfiles(sanitizeProfiles(data || []));
    } catch (err) {
      console.error("TeamFeed load error", err);
      setError(err?.message || localeStrings.error);
    } finally {
      setIsLoading(false);
    }
  }, [getGlobalNotesWithProfilesByHashtag, localeStrings.error]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const extractQuestionNumber = (text = "") => {
    const match = text.match(/question (\d+)/i);
    return match ? Number(match[1]) : null;
  };

  const handleToggleAllowPosts = async (event) => {
    const nextValue = event.target.checked;
    if (typeof onAllowPostsChange !== "function") {
      return;
    }
    try {
      await onAllowPostsChange(nextValue);
      toast({
        title: localeStrings.allowLabel,
        description: nextValue
          ? localeStrings.allowEnabled
          : localeStrings.allowDisabled,
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (err) {
      console.error("Failed to toggle allowPosts", err);
      toast({
        title: localeStrings.error,
        description: err?.message || localeStrings.error,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCopyKeys = async () => {
    try {
      const key = localStorage.getItem("local_nsec");
      if (!key) throw new Error("No secret key available");
      if (typeof navigator === "undefined" || !navigator.clipboard) {
        throw new Error("Clipboard unavailable");
      }
      await navigator.clipboard.writeText(key);
      toast({
        title: localeStrings.copyTitle,
        description: localeStrings.copyDescription,
        status: "info",
        duration: 1800,
        isClosable: true,
      });
    } catch (err) {
      console.error("Failed to copy key", err);
      toast({
        title: localeStrings.error,
        description: localeStrings.copyFallback,
        status: "error",
        duration: 2500,
        isClosable: true,
      });
    }
  };

  const renderPost = (profile, index) => {
    // console.log("profile", profile.content);
    const questionNumber = extractQuestionNumber(profile.content || "");
    const hasScholarship = (profile.content || "")
      .toLowerCase()
      .includes("a new scholarship");

    const noSaboProgressTagged = profile.tags?.some(
      (tag) => tag?.[0] === "purpose" && tag?.[1] === "nosaboProgress"
    );
    const noSaboProgressContent = (profile.content || "")
      .toLowerCase()
      .includes("i just reached");
    const noSaboProgress = noSaboProgressTagged || noSaboProgressContent;

    console.log("noSaboProgress", noSaboProgress);
    if (!questionNumber && !hasScholarship && !noSaboProgress) return null;

    const bucket = colorForQuestion(questionNumber || 0);
    const progressValue = questionNumber
      ? Math.min(100, (questionNumber / TOTAL_FEED_STEPS) * 100)
      : 0;

    if (questionNumber) {
      return (
        <Box
          key={`${profile.id}-${index}`}
          textAlign="left"
          fontSize="sm"
          p={4}
          borderRadius="lg"
          borderColor="whiteAlpha.200"
          bg="gray.900"
          width="100%"
        >
          <HStack align="center" spacing={3} mb={2}>
            <Image
              src={
                profile.profile?.picture ||
                "https://primal.b-cdn.net/media-cache?s=o&a=1&u=https%3A%2F%2Fm.primal.net%2FKBLq.png"
              }
              width={8}
              height={8}
              borderRadius="46%"
              alt={profile.profile?.name || "Nostr friend"}
            />
            <Link
              href={`https://primal.net/p/${profile.npub}`}
              textDecoration="underline"
              isExternal
            >
              {profile.profile?.name || "Nostr friend"}
            </Link>
          </HStack>
          {questionNumber ? (
            <Progress
              value={progressValue}
              mt={1}
              colorScheme={bucket.scheme}
              width="80%"
              mb={4}
              borderRadius="4px"
              background={lightenColor(bucket.color, 0.85)}
            />
          ) : null}
          <ReplaceHashtagWithLink text={profile.content} />
          <br />
          <br />
          <Divider />
        </Box>
      );
    }
    if (noSaboProgress) {
      const tagValue = (key) =>
        profile.tags?.find((entry) => entry?.[0] === key)?.[1] ?? null;
      const totalXp = Number(tagValue("total_xp"));
      const percentValue = Number(tagValue("daily_goal_percent"));
      const dailyGoalPercent = Number.isFinite(percentValue)
        ? Math.max(0, Math.min(100, percentValue))
        : null;
      const dailyGoalTarget = Number(tagValue("daily_goal_target"));
      const dailyXp = Number(tagValue("daily_xp"));
      return (
        <Box
          key={`${profile.id}-${index}`}
          textAlign="left"
          fontSize="sm"
          p={4}
          borderRadius="lg"
          borderColor="whiteAlpha.200"
          bg="gray.900"
          width="100%"
        >
          <HStack align="center" spacing={3} mb={2}>
            <Image
              src={
                profile.profile?.picture ||
                "https://primal.b-cdn.net/media-cache?s=o&a=1&u=https%3A%2F%2Fm.primal.net%2FKBLq.png"
              }
              width={8}
              height={8}
              borderRadius="46%"
              alt={profile.profile?.name || "Nostr friend"}
            />
            <Link
              href={`https://primal.net/p/${profile.npub}`}
              textDecoration="underline"
              isExternal
            >
              {profile.profile?.name || "Nostr friend"}
            </Link>
          </HStack>
          <HStack spacing={2} mb={dailyGoalPercent != null ? 2 : 4}>
            <Badge colorScheme="blue">
              {`${t?.teams_feed_total_xp || "Total XP"}: ${
                Number.isFinite(totalXp)
                  ? totalXp
                  : questionNumber || questionNumber === 0
                  ? questionNumber
                  : "—"
              }`}
            </Badge>
          </HStack>
          {dailyGoalPercent != null && (
            <>
              <Progress
                value={dailyGoalPercent}
                colorScheme="teal"
                size="sm"
                borderRadius="4px"
                mb={2}
              />
              <Text fontSize="xs" color="gray.300" mb={2}>
                {`${t?.teams_feed_goal_completion || "Goal completion"}: ${dailyGoalPercent}%`}
                {` · ${t?.teams_feed_daily_goal || "Today's goal"}: ${
                  Number.isFinite(dailyXp) ? dailyXp : "—"
                }${Number.isFinite(dailyGoalTarget) ? `/${dailyGoalTarget}` : ""} XP`}
              </Text>
            </>
          )}
          <ReplaceHashtagWithLink text={profile.content} />
          <br />
          <br />
          <Divider />
        </Box>
      );
    }
  };

  if (isLoading) {
    return (
      <VStack py={8} spacing={3} align="center">
        <Spinner />
        <Text fontSize="sm" color="gray.400">
          {localeStrings.loading}
        </Text>
      </VStack>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="sm" color="gray.300">
        {t?.learnwithnostr_instructions || localeStrings.instructions}
      </Text>

      <FormControl display="flex" alignItems="center" mb={4}>
        <FormLabel htmlFor="allow-posts-switch" mb="0">
          {t?.learnwithnostr_allow_posts || localeStrings.allowLabel}
        </FormLabel>
        <Switch
          id="allow-posts-switch"
          isChecked={Boolean(allowPosts)}
          onChange={handleToggleAllowPosts}
          isDisabled={typeof onAllowPostsChange !== "function"}
        />
      </FormControl>

      {error ? (
        <Box borderWidth="1px" borderRadius="md" p={4} borderColor="red.400">
          <Text fontSize="sm" color="red.200" mb={2}>
            {error}
          </Text>
          <Button size="sm" onClick={fetchFeed}>
            {localeStrings.refresh}
          </Button>
        </Box>
      ) : profiles.length === 0 ? (
        <Box
          borderWidth="1px"
          borderRadius="md"
          p={4}
          borderColor="whiteAlpha.200"
        >
          <Text fontSize="sm" color="gray.400">
            {localeStrings.empty}
          </Text>
        </Box>
      ) : (
        <VStack spacing={4} maxH="70vh">
          {profiles.map((profile, index) => renderPost(profile, index))}
        </VStack>
      )}
    </VStack>
  );
}
