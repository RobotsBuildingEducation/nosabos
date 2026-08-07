import React, { useEffect, useMemo } from "react";
import { Center, Spinner } from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { completePatreonDrawerReturn } from "../utils/patreonDrawerReturn";

export default function PatreonOAuthDrawerReturn() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const result = useMemo(
    () => params.get("patreon") || "oauth_error",
    [params],
  );
  const returnedNpub = useMemo(
    () => String(params.get("npub") || "").trim(),
    [params],
  );

  useEffect(() => {
    if (typeof window !== "undefined" && window.opener) {
      try {
        window.opener.postMessage(
          {
            type: "PATREON_OAUTH_RESPONSE",
            result,
            npub: returnedNpub,
          },
          "*",
        );
      } catch (e) {
        console.warn("Unable to postMessage to window.opener", e);
      }
      setTimeout(() => {
        try {
          window.close();
        } catch {
          // Ignore window.close restriction if blocked
        }
      }, 400);
      return;
    }

    const target = completePatreonDrawerReturn({ result });
    navigate(target, { replace: true });
  }, [navigate, result, returnedNpub]);

  return (
    <Center minH="100dvh" bg="var(--app-page-bg)" color="purple.300">
      <Spinner size="xl" thickness="4px" aria-label="Returning to Piyali" />
    </Center>
  );
}
