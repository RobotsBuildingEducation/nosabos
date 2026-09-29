import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Box,
  Button,
  Divider,
  HStack,
  Image,
  Link,
  Text,
  VStack,
} from "@chakra-ui/react";
import VoiceOrb from "../VoiceOrbNext";
import { WaveBar, WAVE_BAR_PROGRESS_END, WAVE_BAR_PROGRESS_START } from "../WaveBar";
import { characterImagesMap } from "../RandomCharacter";
import { RPG_STORY_CHARACTERS } from "../../features/stories/storyCharacters";
import { useThemeStore } from "../../useThemeStore";
import { getCachedGlobalTeamFeed, loadGlobalTeamFeed } from "../../utils/globalTeamFeedCache";

const APP_SURFACE = "var(--app-surface)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_SHADOW = "var(--app-shadow-soft)";

const TOTAL_FEED_STEPS = 120;
const HASHTAG_LABEL = "#LearnWithNostr";

const getAvatarCharacter = (profile) => {
  const authorId = String(
    profile?.pubkey || profile?.npub || profile?.profile?.pubkey || profile?.id || "nostr-friend"
  );
  // Keep each author assigned to a stable member of the Stories/Game Review cast.
  let hash = 2166136261;
  for (let i = 0; i < authorId.length; i += 1) {
    hash ^= authorId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const character = RPG_STORY_CHARACTERS[(hash >>> 0) % RPG_STORY_CHARACTERS.length];
  const portraitPool = character?.portraitPool || [character?.portraitIndex || "35"];
  const portraitId = portraitPool[((hash >>> 5) >>> 0) % portraitPool.length];
  return characterImagesMap[portraitId] || characterImagesMap["35"];
};

const ReplaceHashtagWithLink = ({ text = "", linkColor = "blue.400" }) => {
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
              color={linkColor}
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
  t = {},
  fetchGlobalTeamFeed,
}) {
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const [profiles, setProfiles] = useState(() => sanitizeProfiles(getCachedGlobalTeamFeed() || []));
  const [isLoading, setIsLoading] = useState(() => getCachedGlobalTeamFeed() === null);
  const [error, setError] = useState("");
  const fetchNotesRef = useRef(fetchGlobalTeamFeed);
  fetchNotesRef.current = fetchGlobalTeamFeed;

  const localeStrings = useMemo(
    () => ({
      refresh: t?.teams_feed_refresh || "Refresh",
      loading: t?.teams_feed_loading || "Syncing with the community...",
      empty: t?.teams_feed_empty || "No posts yet. Start the conversation!",
      error: t?.teams_feed_error || "Unable to load the feed.",
    }),
    [t]
  );

  const fetchFeed = useCallback(async (force = false) => {
    if (force || getCachedGlobalTeamFeed() === null) setIsLoading(true);
    setError("");
    try {
      const data = await loadGlobalTeamFeed(fetchNotesRef.current, { force });
      setProfiles(sanitizeProfiles(data || []));
    } catch (err) {
      console.error("TeamFeed load error", err);
      setError(err?.message || localeStrings.error);
    } finally {
      setIsLoading(false);
    }
  }, [localeStrings.error]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const extractQuestionNumber = (text = "") => {
    const match = text.match(/question (\d+)/i);
    return match ? Number(match[1]) : null;
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

    if (!questionNumber && !hasScholarship && !noSaboProgress) return null;

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
          borderWidth="1px"
          borderColor={isLightTheme ? APP_BORDER : "whiteAlpha.200"}
          bg={isLightTheme ? "color-mix(in srgb, var(--app-surface) 75%, var(--app-surface-muted))" : "gray.800"}
          boxShadow={isLightTheme ? APP_SHADOW : undefined}
          width="100%"
        >
          <HStack align="center" spacing={3} mb={2}>
            <Image
              src={getAvatarCharacter(profile)}
              width={8}
              height={8}
              borderRadius="46%"
              alt={profile.profile?.name || "Nostr friend"}
            />
            <Link
              href={`https://ditto.pub/${profile.npub}`}
              textDecoration="underline"
              color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
              isExternal
            >
              {profile.profile?.name || "Nostr friend"}
            </Link>
          </HStack>
          {questionNumber ? (
            <Box mt={1} mb={4} width="80%">
              <WaveBar
                value={progressValue}
                height={14}
                start={WAVE_BAR_PROGRESS_START}
                end={WAVE_BAR_PROGRESS_END}
                bg={isLightTheme ? "rgba(255, 255, 255, 0.58)" : "rgba(255,255,255,0.22)"}
                border={isLightTheme ? "rgba(91, 75, 58, 0.10)" : "rgba(255,255,255,0.14)"}
              />
            </Box>
          ) : null}
          <ReplaceHashtagWithLink
            text={profile.content}
            linkColor={isLightTheme ? "#2f7dd3" : "blue.400"}
          />
          <br />
          <br />
          <Divider borderColor={isLightTheme ? APP_BORDER : "whiteAlpha.200"} />
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
      return (
        <Box
          key={`${profile.id}-${index}`}
          textAlign="left"
          fontSize="sm"
          p={4}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={isLightTheme ? APP_BORDER : "whiteAlpha.200"}
          bg={isLightTheme ? "color-mix(in srgb, var(--app-surface) 75%, var(--app-surface-muted))" : "gray.800"}
          boxShadow={isLightTheme ? APP_SHADOW : undefined}
          width="100%"
        >
          <HStack align="center" spacing={3} mb={2}>
            <Image
              src={getAvatarCharacter(profile)}
              width={8}
              height={8}
              borderRadius="46%"
              alt={profile.profile?.name || "Nostr friend"}
            />
            <Link
              href={`https://ditto.pub/${profile.npub}`}
              textDecoration="underline"
              color={isLightTheme ? APP_TEXT_PRIMARY : undefined}
              isExternal
            >
              {profile.profile?.name || "Nostr friend"}
            </Link>
          </HStack>
          <Text
            mb={dailyGoalPercent != null ? 2 : 4}
            color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
          >
            {`${t?.teams_feed_total_xp || "Total XP"}: ${
              Number.isFinite(totalXp)
                ? totalXp
                : questionNumber || questionNumber === 0
                ? questionNumber
                : "—"
            }`}
          </Text>
          {dailyGoalPercent != null && (
            <>
              <Box width="80%" mb={2}>
                <WaveBar
                  value={dailyGoalPercent}
                  height={14}
                  start="#fbbf24"
                  end="#f59e0b"
                  bg={isLightTheme ? "rgba(255, 255, 255, 0.58)" : "rgba(255,255,255,0.22)"}
                  border={isLightTheme ? "rgba(91, 75, 58, 0.10)" : "rgba(255,255,255,0.14)"}
                />
              </Box>
              <Text
                fontSize="xs"
                color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"}
                mb={2}
              >
                {`${
                  t?.teams_feed_goal_completion || "Goal completion"
                }: ${dailyGoalPercent}%`}
              </Text>
            </>
          )}
          <ReplaceHashtagWithLink
            text={profile.content}
            linkColor={isLightTheme ? "#2f7dd3" : "blue.400"}
          />
          <br />
          <br />
          <Divider borderColor={isLightTheme ? APP_BORDER : "whiteAlpha.200"} />
        </Box>
      );
    }
  };

  if (isLoading) {
    return (
      <VStack py={8} spacing={3} align="center">
        <VoiceOrb size={88} />
        <Text fontSize="sm" color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}>
          {localeStrings.loading}
        </Text>
      </VStack>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {error ? (
        <Box
          borderWidth="1px"
          borderRadius="md"
          p={4}
          borderColor={isLightTheme ? "rgba(194, 103, 132, 0.28)" : "red.400"}
          bg={isLightTheme ? APP_SURFACE : undefined}
        >
          <Text
            fontSize="sm"
            color={isLightTheme ? "#8f4a5e" : "red.200"}
            mb={2}
          >
            {error}
          </Text>
          <Button size="sm" onClick={() => fetchFeed(true)}>
            {localeStrings.refresh}
          </Button>
        </Box>
      ) : profiles.length === 0 ? (
        <Box
          borderWidth="1px"
          borderRadius="md"
          p={4}
          borderColor={isLightTheme ? APP_BORDER : "whiteAlpha.200"}
          bg={isLightTheme ? APP_SURFACE : undefined}
        >
          <Text fontSize="sm" color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}>
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
