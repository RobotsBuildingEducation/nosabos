import { useCallback } from "react";
import { NDKKind } from "@nostr-dev-kit/ndk";
import { useDecentralizedIdentity } from "./useDecentralizedIdentity";

export function useNOSTR(initialNpub, initialNsec) {
  const { postNostrContent, getGlobalNotesWithProfilesByHashtag } =
    useDecentralizedIdentity(initialNpub, initialNsec);

  const sendDirectMessage = useCallback(
    async (targetNpub, message) => {
      if (!targetNpub || !message) return;
      try {
        await postNostrContent(message, NDKKind.Text, targetNpub, initialNsec);
      } catch (error) {
        console.error("useNOSTR.sendDirectMessage error", error);
        throw error;
      }
    },
    [postNostrContent, initialNsec]
  );

  const fetchNotesByHashtag = useCallback(
    async (hashtag) => {
      return getGlobalNotesWithProfilesByHashtag(hashtag);
    },
    [getGlobalNotesWithProfilesByHashtag]
  );

  return {
    sendDirectMessage,
    postNostrContent,
    getGlobalNotesWithProfilesByHashtag: fetchNotesByHashtag,
  };
}

export default useNOSTR;
