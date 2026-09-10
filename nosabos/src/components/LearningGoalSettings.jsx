import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import useUserStore from "../hooks/useUserStore";
import {
  astraGoalsEnabled,
  saveLearningGoal,
} from "../utils/learningIntelligence";
import { goalCopy } from "../utils/learningGoalCopy";

const GOAL_ACTION_BUTTON_PROPS = {
  colorScheme: "teal",
  boxShadow: "0 4px 0 var(--chakra-colors-teal-800, #234E52)",
};

export function LearningGoalField({
  lang,
  value,
  onChange,
  minH = "120px",
  rows = 4,
  ...props
}) {
  const copy = goalCopy(lang);
  return (
    <FormControl {...props}>
      <FormLabel fontSize="sm" fontWeight="semibold" mb={2}>
        {copy.label}
      </FormLabel>
      <Textarea
        value={value}
        maxLength={600}
        placeholder={copy.example}
        onChange={(e) => onChange(e.target.value)}
      minH={minH}
      rows={rows}
      p={3}
      fontSize="16px"
      lineHeight="tall"
    />
    </FormControl>
  );
}
export default function LearningGoalSettings({
  npub,
  targetLang,
  appLanguage,
}) {
  const goal = useUserStore(
    (s) => s.user?.learningIntelligence?.[targetLang]?.activeGoal,
  );
  const [value, setValue] = useState(goal?.text || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const copy = goalCopy(appLanguage);
  useEffect(() => {
    setValue(goal?.text || "");
    setMessage("");
  }, [goal?.text, targetLang, npub]);
  if (!astraGoalsEnabled()) return null;
  async function save(status = "active", text = value) {
    setBusy(true);
    setMessage("");
    try {
      await saveLearningGoal({ npub, targetLang, text, status });
      setMessage(copy.saved);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Box py={4} width="100%">
      <LearningGoalField lang={appLanguage} value={value} onChange={setValue} />
      <HStack mt={3} flexWrap="wrap">
        <Button
          size="sm"
          {...GOAL_ACTION_BUTTON_PROPS}
          isLoading={busy}
          onClick={() => save()}
        >
          {copy.save}
        </Button>
        {goal && (
          <>
            <Button
              size="sm"
              {...GOAL_ACTION_BUTTON_PROPS}
              isDisabled={busy}
              onClick={() =>
                save(goal.status === "active" ? "paused" : "active", goal.text)
              }
            >
              {goal.status === "active" ? copy.pause : copy.resume}
            </Button>
            <Button
              size="sm"
              {...GOAL_ACTION_BUTTON_PROPS}
              isDisabled={busy || goal.status === "achieved"}
              onClick={() => save("achieved", goal.text)}
            >
              {copy.achieve}
            </Button>
            <Button
              size="sm"
              {...GOAL_ACTION_BUTTON_PROPS}
              isDisabled={busy}
              onClick={() => save("active", "")}
            >
              {copy.clear}
            </Button>
          </>
        )}
      </HStack>
      {message && (
        <Text role="status" fontSize="sm" mt={2}>
          {message}
        </Text>
      )}
    </Box>
  );
}
