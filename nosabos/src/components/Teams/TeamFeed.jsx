import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  HStack,
  Spinner,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useDecentralizedIdentity } from "../../hooks/useDecentralizedIdentity";

const formatDate = (timestamp) => {
  if (!timestamp) return "";
  const diffSeconds = Math.max(1, Math.floor(Date.now() / 1000 - timestamp));
  const minutes = Math.floor(diffSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${diffSeconds}s ago`;
};

export default function TeamFeed({ userLanguage, t }) {
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const { getGlobalNotesWithProfilesByHashtag } = useDecentralizedIdentity(
    typeof window !== "undefined" ? localStorage.getItem("local_npub") : "",
    typeof window !== "undefined" ? localStorage.getItem("local_nsec") : ""
  );

  const hashtag = useMemo(() => {
    if (userLanguage === "es") return "AprendeConNostr";
    return "LearnWithNostr";
  }, [userLanguage]);

  const loadPosts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await getGlobalNotesWithProfilesByHashtag(hashtag);
      setPosts(results || []);
    } catch (err) {
      console.error("TeamFeed load error", err);
      setError(err.message || "Unable to load feed");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hashtag]);

  if (isLoading) {
    return (
      <VStack py={8} spacing={3} align="center">
        <Spinner />
        <Text fontSize="sm" color="gray.400">
          {t?.teams_feed_loading || "Syncing with the community..."}
        </Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <VStack py={8} spacing={3} align="center">
        <Text color="red.300" fontSize="sm">
          {error}
        </Text>
        <Button size="sm" onClick={loadPosts}>
          {t?.teams_feed_retry || "Try again"}
        </Button>
      </VStack>
    );
  }

  if (!posts.length) {
    return (
      <VStack py={8} spacing={3} align="center">
        <Text fontSize="sm" color="gray.400">
          {t?.teams_feed_empty || "No posts yet. Start the conversation!"}
        </Text>
        <Button size="sm" onClick={loadPosts}>
          {t?.teams_feed_refresh || "Refresh"}
        </Button>
      </VStack>
    );
  }

  return (
    <Stack spacing={4} maxH="70vh" overflowY="auto">
      <Button size="sm" alignSelf="flex-end" onClick={loadPosts}>
        {t?.teams_feed_refresh || "Refresh"}
      </Button>
      {posts.map((post) => (
        <Box
          key={post.id}
          p={4}
          borderWidth="1px"
          borderRadius="lg"
          bg="gray.900"
          borderColor="whiteAlpha.200"
        >
          <HStack spacing={3} mb={2} align="flex-start">
            <Avatar size="sm" src={post.profile?.picture} name={post.profile?.name} />
            <Box flex="1">
              <HStack spacing={2} wrap="wrap">
                <Text fontWeight="bold" fontSize="sm">
                  {post.profile?.name || "Nostr friend"}
                </Text>
                <Badge colorScheme="purple">#{hashtag}</Badge>
                <Text fontSize="xs" color="gray.400">
                  {formatDate(post.createdAt)}
                </Text>
              </HStack>
              <Text fontSize="sm" mt={2} whiteSpace="pre-wrap">
                {post.content}
              </Text>
            </Box>
          </HStack>
        </Box>
      ))}
    </Stack>
  );
}
