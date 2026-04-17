import { Badge, Text } from "@chakra-ui/react";
import {
  formatTimer,
  useSessionTimerRemaining,
} from "../provider/SessionTimerProvider";

export default function SessionTimerBadge({ isRunning }) {
  const remaining = useSessionTimerRemaining();
  if (remaining === null) return null;

  return (
    <Badge
      colorScheme={isRunning ? "teal" : "purple"}
      variant="subtle"
      px={3}
      py={1.5}
      borderRadius="md"
      display="flex"
      alignItems="center"
      gap={2}
    >
      <Text fontFamily="mono" fontWeight="bold" fontSize="2xs">
        {formatTimer(remaining)}
      </Text>
    </Badge>
  );
}
