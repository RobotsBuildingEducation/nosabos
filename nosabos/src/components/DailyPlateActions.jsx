import { Button, HStack } from "@chakra-ui/react";
import { achievementText } from "../achievements/copy.js";

export default function DailyPlateActions({ primaryLabel, onPrimary, onAchievements, language, isLightTheme }) {
  const actions = [
    { label: primaryLabel, onClick: onPrimary },
    { label: achievementText("achievements", language), onClick: onAchievements },
  ].filter(action => typeof action.onClick === "function");
  if (!actions.length) return null;
  return (
    <HStack spacing={3} justify="center" alignSelf="center" mt="auto">
      {actions.map(action => (
        <Button key={action.label} size="sm" variant="outline" bg="transparent"
          color={isLightTheme ? "black" : "white"}
          borderColor={isLightTheme ? "teal.600" : "teal.300"}
          boxShadow="none"
          _hover={{ bg: isLightTheme ? "teal.50" : "whiteAlpha.100" }}
          _active={{ bg: isLightTheme ? "teal.100" : "whiteAlpha.200" }}
          onClick={action.onClick}>
          {action.label}
        </Button>
      ))}
    </HStack>
  );
}
