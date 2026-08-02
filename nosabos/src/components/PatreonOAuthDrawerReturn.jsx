import React, { useEffect, useMemo } from "react";
import { Center, Spinner } from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { completePatreonDrawerReturn } from "../utils/patreonDrawerReturn";

export default function PatreonOAuthDrawerReturn() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = useMemo(
    () => new URLSearchParams(location.search).get("patreon") || "oauth_error",
    [location.search],
  );

  useEffect(() => {
    const target = completePatreonDrawerReturn({ result });
    navigate(target, { replace: true });
  }, [navigate, result]);

  return (
    <Center minH="100dvh" bg="var(--app-page-bg)" color="purple.300">
      <Spinner size="xl" thickness="4px" aria-label="Returning to Piyali" />
    </Center>
  );
}
