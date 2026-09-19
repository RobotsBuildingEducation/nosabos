import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  FormControl,
  FormLabel,
  Text,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import useUserStore from "../hooks/useUserStore";
import {
  astraGoalsEnabled,
  saveLearningGoal,
} from "../utils/learningIntelligence";
import { goalCopy } from "../utils/learningGoalCopy";

export function LearningGoalField({
  lang,
  value,
  onChange,
  onBlur,
  onFocus,
  description,
  minH = "120px",
  rows = 4,
  textareaBg = "gray.700",
  ...props
}) {
  const copy = goalCopy(lang);
  return (
    <FormControl {...props}>
      <FormLabel fontSize="sm" fontWeight="semibold" mb={description ? 1 : 2}>
        {copy.label}
      </FormLabel>
      {description && (
        <Text fontSize="xs" opacity={0.7} mb="12px">
          {description}
        </Text>
      )}
      <Textarea
        value={value}
        maxLength={600}
        placeholder={copy.example}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onFocus={onFocus}
        bg={textareaBg}
        minH={minH}
        rows={rows}
        p={3}
        fontSize="16px"
        lineHeight="tall"
        resize="vertical"
      />
    </FormControl>
  );
}

export default function LearningGoalSettings({
  npub,
  targetLang,
  appLanguage,
}) {
  const toast = useToast();
  const copy = goalCopy(appLanguage);
  const goal = useUserStore(
    (s) => s.user?.learningIntelligence?.[targetLang]?.activeGoal,
  );
  const goalText = goal?.text || "";
  const [value, setValue] = useState(goalText);
  const [showSaved, setShowSaved] = useState(false);

  const debounceRef = useRef(null);
  const savedTimerRef = useRef(null);
  const isFocusedRef = useRef(false);
  const targetLangRef = useRef(targetLang);
  const npubRef = useRef(npub);
  const lastSavedRef = useRef(goalText);
  const latestValueRef = useRef(value);
  latestValueRef.current = value;

  const triggerSaved = useCallback(() => {
    setShowSaved(true);
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
    }
    savedTimerRef.current = setTimeout(() => {
      setShowSaved(false);
      savedTimerRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    if (targetLangRef.current !== targetLang || npubRef.current !== npub) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
        savedTimerRef.current = null;
      }
      setShowSaved(false);
      targetLangRef.current = targetLang;
      npubRef.current = npub;
      setValue(goalText);
      lastSavedRef.current = goalText;
    } else if (!isFocusedRef.current) {
      setValue(goalText);
      lastSavedRef.current = goalText;
    }
  }, [goalText, targetLang, npub]);

  const persistGoal = useCallback(
    async (textToSave) => {
      if (!npub) return;
      const trimmed = (textToSave || "").trim();
      if (trimmed === (lastSavedRef.current || "").trim()) {
        return;
      }
      try {
        await saveLearningGoal({
          npub,
          targetLang,
          text: trimmed,
          status: "active",
        });
        lastSavedRef.current = trimmed;
        triggerSaved();
      } catch (error) {
        toast({
          status: "error",
          title: "Save failed",
          description: String(error?.message || error),
        });
      }
    },
    [npub, targetLang, toast, triggerSaved],
  );

  const persistGoalRef = useRef(persistGoal);
  persistGoalRef.current = persistGoal;

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
        savedTimerRef.current = null;
      }
      const pending = (latestValueRef.current || "").trim();
      if (pending !== (lastSavedRef.current || "").trim()) {
        void persistGoalRef.current?.(pending);
      }
    };
  }, []);

  const handleChange = useCallback(
    (next) => {
      setValue(next);
      setShowSaved(false);
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
        savedTimerRef.current = null;
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        void persistGoal(next);
      }, 400);
    },
    [persistGoal],
  );

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    void persistGoal(latestValueRef.current);
  }, [persistGoal]);

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  if (!astraGoalsEnabled()) return null;

  return (
    <Box bg="gray.800" p={3} rounded="md" width="100%">
      <LearningGoalField
        lang={appLanguage}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        textareaBg="gray.700"
      />
      <Box textAlign="right" minH="18px" mt={1}>
        {showSaved && (
          <Text fontSize="xs" color="gray.400" role="status">
            {copy.saved}
          </Text>
        )}
      </Box>
    </Box>
  );
}
