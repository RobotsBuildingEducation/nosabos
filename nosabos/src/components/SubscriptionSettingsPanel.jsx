import React, { useMemo, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  ButtonGroup,
  Heading,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  normalizeSupportLanguage,
} from "../constants/languages";
import { SUBSCRIPTION_SETTINGS_COPY } from "./subscriptionSettingsCopy";
import {
  formatUsdEntitlement,
  getSubscriptionSettingsState,
  PATREON_MEMBERSHIP_URL,
  PATREON_PAYMENT_URL,
} from "./subscriptionSettingsModel";

export default function SubscriptionSettingsPanel({
  appLanguage = "en",
  statusPayload = {},
  isBusy = false,
  onRefresh,
  onReconnect,
  onDisconnect,
}) {
  const lang = normalizeSupportLanguage(appLanguage, DEFAULT_SUPPORT_LANGUAGE);
  const copy = SUBSCRIPTION_SETTINGS_COPY[lang] || SUBSCRIPTION_SETTINGS_COPY.en;
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const view = getSubscriptionSettingsState(statusPayload);
  const { subscription, linked, unavailable, status, entitledAmountCents } = view;
  const statusText = useMemo(() => {
    if (unavailable || status === "unknown") return copy.unavailable;
    if (status === "active") return copy.active;
    if (status === "payment_issue") return copy.paymentIssue;
    if (status === "inactive" || status === "expired") return copy.inactive;
    return copy.notLinked;
  }, [copy, status, unavailable]);
  const colorScheme = status === "active" ? "green" : status === "payment_issue" ? "orange" : "gray";
  const checkedAt = Number(subscription?.lastVerifiedAtMs || 0);

  return (
    <Stack spacing={4} pb={14}>
      <Box bg="gray.800" borderWidth="1px" borderColor="gray.700" borderRadius="24px" p={5}>
        <HStack justify="space-between" align="start" spacing={3}>
          <Box>
            <Heading size="sm">{copy.title}</Heading>
            <Text mt={2} color="gray.300">{statusText}</Text>
          </Box>
          <Badge colorScheme={colorScheme} borderRadius="full" px={3} py={1}>
            Patreon
          </Badge>
        </HStack>
        {subscription?.stale && (
          <Alert status="warning" mt={4} borderRadius="16px" bg="orange.900">
            <AlertIcon />
            <Text fontSize="sm">{copy.stale}</Text>
          </Alert>
        )}
        {checkedAt > 0 && (
          <Text fontSize="xs" color="gray.400" mt={3}>
            {copy.lastChecked}: {new Intl.DateTimeFormat(lang, { dateStyle: "medium", timeStyle: "short" }).format(new Date(checkedAt))}
          </Text>
        )}
        {entitledAmountCents > 0 && (
          <Text fontSize="sm" color="gray.300" mt={3}>
            {copy.entitlement}: {formatUsdEntitlement(entitledAmountCents, lang)}
          </Text>
        )}
      </Box>

      <ButtonGroup flexWrap="wrap" gap={2}>
        {view.showConnect && (
          <Button colorScheme="teal" onClick={onReconnect} isDisabled={isBusy}>
            {copy.connect}
          </Button>
        )}
        {view.showRefresh && (
          <Button colorScheme="teal" onClick={onRefresh} isLoading={isBusy} loadingText={copy.refreshing}>
            {copy.refresh}
          </Button>
        )}
        {view.showReconnect && (
          <Button variant="outline" onClick={onReconnect} isDisabled={isBusy}>
            {copy.reconnect}
          </Button>
        )}
        {view.showManage && (
          <Button as="a" href={PATREON_MEMBERSHIP_URL} target="_blank" rel="noopener noreferrer" variant="outline">
            {copy.manage}
          </Button>
        )}
        {view.showPayment && (
          <Button as="a" href={PATREON_PAYMENT_URL} target="_blank" rel="noopener noreferrer" variant="outline">
            {copy.payment}
          </Button>
        )}
      </ButtonGroup>

      {view.showDisconnect && !confirmingDisconnect && (
        <Button alignSelf="flex-start" colorScheme="red" variant="ghost" onClick={() => setConfirmingDisconnect(true)}>
          {copy.disconnect}
        </Button>
      )}
      {linked && confirmingDisconnect && (
        <Alert status="warning" borderRadius="20px" bg="gray.800" alignItems="flex-start">
          <AlertIcon mt={1} />
          <Box flex="1">
            <Text fontWeight="bold">{copy.disconnectTitle}</Text>
            <Text fontSize="sm" mt={1} color="gray.300">{copy.disconnectBody}</Text>
            <ButtonGroup mt={4} size="sm">
              <Button variant="ghost" onClick={() => setConfirmingDisconnect(false)}>{copy.cancel}</Button>
              <Button colorScheme="red" onClick={onDisconnect} isLoading={isBusy} loadingText={copy.disconnecting}>{copy.confirm}</Button>
            </ButtonGroup>
          </Box>
        </Alert>
      )}
    </Stack>
  );
}
