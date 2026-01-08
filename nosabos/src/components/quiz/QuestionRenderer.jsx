// components/quiz/QuestionRenderer.jsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  RadioGroup,
  Radio,
  Checkbox,
  CheckboxGroup,
  Input,
  Textarea,
  Button,
  Select,
  Badge,
} from "@chakra-ui/react";
import { shuffle } from "./utils";
import translations from "../../utils/translation";

/* ---------------------------
   Minimal i18n helper
--------------------------- */
function useT(uiLang = "en") {
  const lang = ["en", "es"].includes(uiLang) ? uiLang : "en";
  const dict = (translations && translations[lang]) || {};
  const enDict = (translations && translations.en) || {};
  return (key, params) => {
    const raw = (dict[key] ?? enDict[key] ?? key) + "";
    if (!params) return raw;
    return raw.replace(/{(\w+)}/g, (_, k) =>
      k in params ? String(params[k]) : `{${k}}`
    );
  };
}

/**
 * item shape (examples):
 * - Multiple choice: { type:"mcq", stem, options:[{id,label,correct},...]}
 * - Multiple answer: { type:"multi", stem, options:[{id,label,correct},...], multiple:true }
 * - Open ended: { type:"open", stem, answer:{ acceptable:["...","..."] } }
 * - One word: { type:"oneword", stem, answer:{ acceptable:["..."] } }
 * - Matching: { type:"matching", stem, left:["a","b"], right:["1","2"] }
 */
export default function QuestionRenderer({ item, onSubmit, uiLang = "en" }) {
  const t = useT(uiLang);

  const [value, setValue] = useState("");
  const [values, setValues] = useState([]);
  const [openText, setOpenText] = useState("");
  const [oneWord, setOneWord] = useState("");
  const [matches, setMatches] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const shuffled = useMemo(
    () => (item?.options ? shuffle(item.options) : []),
    [item]
  );

  // Remove diacritics for tolerant matching (e.g., "Cuál" matches "cual")
  function removeDiacritics(str) {
    return String(str || "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
  }

  function normalize(s = "") {
    return removeDiacritics(s).trim().toLowerCase();
  }

  function check() {
    let correct = false,
      payload = null;

    if (item.type === "mcq") {
      const opt = shuffled.find((o) => o.id === value);
      correct = !!opt?.correct;
      payload = { type: "mcq", choice: value, correct };
    }
    if (item.type === "multi") {
      const chosen = new Set(values);
      const allCorrect = item.options.filter((o) => o.correct).map((o) => o.id);
      const allWrong = item.options.filter((o) => !o.correct).map((o) => o.id);
      const noExtra = allWrong.every((id) => !chosen.has(id));
      const hasAll = allCorrect.every((id) => chosen.has(id));
      correct = hasAll && noExtra;
      payload = { type: "multi", choices: [...chosen], correct };
    }
    if (item.type === "open") {
      const okList = (item.answer?.acceptable || []).map(normalize);
      correct = okList.some((a) => normalize(openText) === a);
      payload = { type: "open", text: openText, correct };
    }
    if (item.type === "oneword") {
      const one = normalize(oneWord).split(/\s+/).filter(Boolean);
      const single = one.length === 1 ? one[0] : "";
      const okList = (item.answer?.acceptable || []).map(normalize);
      correct = !!single && okList.includes(single);
      payload = { type: "oneword", text: oneWord, correct };
    }
    if (item.type === "matching") {
      const chosen = Object.values(matches);
      const allFilled =
        Object.keys(matches).length === (item.left || []).length;
      const unique = new Set(chosen);
      correct = allFilled && unique.size === chosen.length; // structural check
      payload = { type: "matching", pairs: matches, correct };
    }

    setSubmitted(true);
    onSubmit?.(payload);
  }

  return (
    <Box>
      {!!item?.stem && <Text mb={3}>{item.stem}</Text>}

      {/* Multiple choice */}
      {item.type === "mcq" && (
        <VStack align="stretch" spacing={3}>
          <RadioGroup onChange={setValue} value={value}>
            <VStack align="stretch" spacing={2}>
              {shuffled.map((o) => (
                <Radio key={o.id} value={o.id} bg="gray.700" p={2} rounded="md">
                  {o.label}
                </Radio>
              ))}
            </VStack>
          </RadioGroup>
          {submitted && (
            <Badge
              colorScheme={
                shuffled.find((o) => o.id === value)?.correct ? "green" : "red"
              }
              w="fit-content"
            >
              {shuffled.find((o) => o.id === value)?.correct
                ? t("quiz_correct")
                : t("quiz_try_again")}
            </Badge>
          )}
          <HStack justify="flex-end">
            <Button onClick={check} colorScheme="teal" isDisabled={!value}>
              {t("quiz_submit")}
            </Button>
          </HStack>
        </VStack>
      )}

      {/* Multiple answer */}
      {item.type === "multi" && (
        <VStack align="stretch" spacing={3}>
          <CheckboxGroup value={values} onChange={setValues}>
            <VStack align="stretch" spacing={2}>
              {shuffled.map((o) => (
                <Checkbox
                  key={o.id}
                  value={o.id}
                  bg="gray.700"
                  p={2}
                  rounded="md"
                >
                  {o.label}
                </Checkbox>
              ))}
            </VStack>
          </CheckboxGroup>
          {submitted && (
            <Badge
              colorScheme={(() => {
                const chosen = new Set(values);
                const allC = item.options
                  .filter((o) => o.correct)
                  .map((o) => o.id);
                const allW = item.options
                  .filter((o) => !o.correct)
                  .map((o) => o.id);
                const noExtra = allW.every((id) => !chosen.has(id));
                const hasAll = allC.every((id) => chosen.has(id));
                return hasAll && noExtra ? "green" : "red";
              })()}
              w="fit-content"
            >
              {(() => {
                const chosen = new Set(values);
                const allC = item.options
                  .filter((o) => o.correct)
                  .map((o) => o.id);
                const allW = item.options
                  .filter((o) => !o.correct)
                  .map((o) => o.id);
                const noExtra = allW.every((id) => !chosen.has(id));
                const hasAll = allC.every((id) => chosen.has(id));
                return hasAll && noExtra
                  ? t("quiz_correct")
                  : t("quiz_try_again");
              })()}
            </Badge>
          )}
          <HStack justify="flex-end">
            <Button
              onClick={check}
              colorScheme="teal"
              isDisabled={!values.length}
            >
              {t("quiz_submit")}
            </Button>
          </HStack>
        </VStack>
      )}

      {/* Open ended */}
      {item.type === "open" && (
        <VStack align="stretch" spacing={3}>
          <Textarea
            bg="gray.700"
            value={openText}
            onChange={(e) => setOpenText(e.target.value)}
            placeholder={t("quiz_placeholder_open")}
            minH="90px"
          />
          {submitted && (
            <Badge
              colorScheme={
                (item.answer?.acceptable || [])
                  .map(normalize)
                  .includes(normalize(openText))
                  ? "green"
                  : "orange"
              }
              w="fit-content"
            >
              {t("quiz_checked")}
            </Badge>
          )}
          <HStack justify="flex-end">
            <Button
              onClick={check}
              colorScheme="teal"
              isDisabled={!openText.trim()}
            >
              {t("quiz_submit")}
            </Button>
          </HStack>
        </VStack>
      )}

      {/* One word */}
      {item.type === "oneword" && (
        <VStack align="stretch" spacing={3}>
          <Input
            bg="gray.700"
            value={oneWord}
            onChange={(e) => setOneWord(e.target.value)}
            placeholder={t("quiz_placeholder_oneword")}
          />
          {submitted && (
            <Badge
              colorScheme={(() => {
                const toks = normalize(oneWord)
                  .split(/\s+/)
                  .filter(Boolean);
                const ok = (item.answer?.acceptable || []).map(normalize);
                return toks.length === 1 && ok.includes(toks[0])
                  ? "green"
                  : "red";
              })()}
              w="fit-content"
            >
              {(() => {
                const toks = normalize(oneWord)
                  .split(/\s+/)
                  .filter(Boolean);
                const ok = (item.answer?.acceptable || []).map(normalize);
                return toks.length === 1 && ok.includes(toks[0])
                  ? t("quiz_correct")
                  : t("quiz_try_again");
              })()}
            </Badge>
          )}
          <HStack justify="flex-end">
            <Button
              onClick={check}
              colorScheme="teal"
              isDisabled={!oneWord.trim()}
            >
              {t("quiz_submit")}
            </Button>
          </HStack>
        </VStack>
      )}

      {/* Matching */}
      {item.type === "matching" && (
        <VStack align="stretch" spacing={3}>
          {(item.left || []).map((l, idx) => (
            <HStack key={idx} spacing={3}>
              <Box flex="1" bg="gray.700" p={2} rounded="md">
                {l}
              </Box>
              <Select
                bg="gray.700"
                value={matches[idx] || ""}
                onChange={(e) =>
                  setMatches((m) => ({ ...m, [idx]: e.target.value }))
                }
              >
                <option value="" disabled>
                  {t("quiz_select_placeholder")}
                </option>
                {shuffle(item.right || []).map((r, i) => (
                  <option key={i} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </HStack>
          ))}
          {submitted && (
            <Badge
              colorScheme={
                Object.keys(matches).length === (item.left || []).length &&
                new Set(Object.values(matches)).size ===
                  Object.values(matches).length
                  ? "green"
                  : "orange"
              }
              w="fit-content"
            >
              {t("quiz_checked")}
            </Badge>
          )}
          <HStack justify="flex-end">
            <Button
              onClick={check}
              colorScheme="teal"
              isDisabled={!(item.left || []).length}
            >
              {t("quiz_submit")}
            </Button>
          </HStack>
        </VStack>
      )}
    </Box>
  );
}
