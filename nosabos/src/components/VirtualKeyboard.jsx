// components/VirtualKeyboard.jsx
import React, { useState } from "react";
import {
  Box,
  Button,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  IconButton,
} from "@chakra-ui/react";
import { MdClose, MdBackspace, MdSpaceBar } from "react-icons/md";

// Japanese Hiragana keyboard layout
const HIRAGANA = [
  [
    "あ",
    "い",
    "う",
    "え",
    "お",
    "か",
    "き",
    "く",
    "け",
    "こ",
    "さ",
    "し",
    "す",
    "せ",
    "そ",
    "た",
    "ち",
    "つ",
    "て",
    "と",
    "な",
    "に",
    "ぬ",
    "ね",
    "の",
    "は",
    "ひ",
    "ふ",
    "へ",
    "ほ",
    "ま",
    "み",
    "む",
    "め",
    "も",
    "や",
    "ゆ",
    "よ",
    "ら",
    "り",
    "る",
    "れ",
    "ろ",
    "わ",
    "を",
    "ん",
    "が",
    "ぎ",
    "ぐ",
    "げ",
    "ご",
    "ざ",
    "じ",
    "ず",
    "ぜ",
    "ぞ",
    "だ",
    "ぢ",
    "づ",
    "で",
    "ど",
    "ば",
    "び",
    "ぶ",
    "べ",
    "ぼ",
    "ぱ",
    "ぴ",
    "ぷ",
    "ぺ",
    "ぽ",
    "ゃ",
    "ゅ",
    "ょ",
    "っ",
    "ー",
  ],
];

// Japanese Katakana keyboard layout
const KATAKANA = [
  [
    "ア",
    "イ",
    "ウ",
    "エ",
    "オ",
    "カ",
    "キ",
    "ク",
    "ケ",
    "コ",
    "サ",
    "シ",
    "ス",
    "セ",
    "ソ",
    "タ",
    "チ",
    "ツ",
    "テ",
    "ト",
    "ナ",
    "ニ",
    "ヌ",
    "ネ",
    "ノ",
    "ハ",
    "ヒ",
    "フ",
    "ヘ",
    "ホ",
    "マ",
    "ミ",
    "ム",
    "メ",
    "モ",
    "ヤ",
    "ユ",
    "ヨ",
    "ラ",
    "リ",
    "ル",
    "レ",
    "ロ",
    "ワ",
    "ヲ",
    "ン",
    "ガ",
    "ギ",
    "グ",
    "ゲ",
    "ゴ",
    "ザ",
    "ジ",
    "ズ",
    "ゼ",
    "ゾ",
    "ダ",
    "ヂ",
    "ヅ",
    "デ",
    "ド",
    "バ",
    "ビ",
    "ブ",
    "ベ",
    "ボ",
    "パ",
    "ピ",
    "プ",
    "ペ",
    "ポ",
    "ャ",
    "ュ",
    "ョ",
    "ッ",
    "ー",
  ],
];

// Russian Cyrillic keyboard layout
const CYRILLIC = [
  [
    "а",
    "б",
    "в",
    "г",
    "д",
    "е",
    "ё",
    "ж",
    "з",
    "и",
    "й",
    "к",
    "л",
    "м",
    "н",
    "о",
    "п",
    "р",
    "с",
    "т",
    "у",
    "ф",
    "х",
    "ц",
    "ч",
    "ш",
    "щ",
    "ъ",
    "ы",
    "ь",
    "э",
    "ю",
    "я",
  ],
];

const CYRILLIC_UPPER = [
  [
    "А",
    "Б",
    "В",
    "Г",
    "Д",
    "Е",
    "Ё",
    "Ж",
    "З",
    "И",
    "Й",
    "К",
    "Л",
    "М",
    "Н",
    "О",
    "П",
    "Р",
    "С",
    "Т",
    "У",
    "Ф",
    "Х",
    "Ц",
    "Ч",
    "Ш",
    "Щ",
    "Ъ",
    "Ы",
    "Ь",
    "Э",
    "Ю",
    "Я",
  ],
];

// Greek keyboard layout
const GREEK = [
  [
    "α",
    "β",
    "γ",
    "δ",
    "ε",
    "ζ",
    "η",
    "θ",
    "ι",
    "κ",
    "λ",
    "μ",
    "ν",
    "ξ",
    "ο",
    "π",
    "ρ",
    "σ",
    "ς",
    "τ",
    "υ",
    "φ",
    "χ",
    "ψ",
    "ω",
  ],
  ["ά", "έ", "ή", "ί", "ό", "ύ", "ώ", "ϊ", "ϋ", "ΐ", "ΰ"],
];

const GREEK_UPPER = [
  [
    "Α",
    "Β",
    "Γ",
    "Δ",
    "Ε",
    "Ζ",
    "Η",
    "Θ",
    "Ι",
    "Κ",
    "Λ",
    "Μ",
    "Ν",
    "Ξ",
    "Ο",
    "Π",
    "Ρ",
    "Σ",
    "Τ",
    "Υ",
    "Φ",
    "Χ",
    "Ψ",
    "Ω",
  ],
  ["Ά", "Έ", "Ή", "Ί", "Ό", "Ύ", "Ώ", "Ϊ", "Ϋ"],
];

export default function VirtualKeyboard({
  lang,
  onKeyPress,
  onClose,
  userLanguage = "en",
}) {
  const isJapanese = lang === "ja";
  const isRussian = lang === "ru";
  const isGreek = lang === "el";

  // Japanese keyboard state
  const [japaneseMode, setJapaneseMode] = useState("hiragana"); // "hiragana" | "katakana"

  // Russian/Greek keyboard state
  const [isUpperCase, setIsUpperCase] = useState(false);

  const handleKeyPress = (char) => {
    onKeyPress?.(char);
  };

  const handleBackspace = () => {
    onKeyPress?.("BACKSPACE");
  };

  const handleSpace = () => {
    onKeyPress?.(" ");
  };

  if (!isJapanese && !isRussian && !isGreek) return null;

  // Get keyboard layout based on language and mode
  const getKeyboardLayout = () => {
    if (isJapanese) {
      return japaneseMode === "hiragana" ? HIRAGANA : KATAKANA;
    }
    if (isRussian) {
      return isUpperCase ? CYRILLIC_UPPER : CYRILLIC;
    }
    if (isGreek) {
      return isUpperCase ? GREEK_UPPER : GREEK;
    }
    return [];
  };

  const layout = getKeyboardLayout();

  return (
    <Box
      bg="rgba(20, 20, 30, 0.98)"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      p={3}
      mt={3}
    >
      {/* Header with mode toggle and close button */}
      <HStack justify="space-between" mb={3}>
        <HStack spacing={2}>
          {isJapanese && (
            <>
              <Button
                size="xs"
                colorScheme={japaneseMode === "hiragana" ? "purple" : "gray"}
                variant={japaneseMode === "hiragana" ? "solid" : "outline"}
                onClick={() => setJapaneseMode("hiragana")}
              >
                {userLanguage === "es" ? "Hiragana" : "Hiragana"}
              </Button>
              <Button
                size="xs"
                colorScheme={japaneseMode === "katakana" ? "purple" : "gray"}
                variant={japaneseMode === "katakana" ? "solid" : "outline"}
                onClick={() => setJapaneseMode("katakana")}
              >
                {userLanguage === "es" ? "Katakana" : "Katakana"}
              </Button>
            </>
          )}
          {(isRussian || isGreek) && (
            <Button
              size="xs"
              colorScheme={isUpperCase ? "purple" : "gray"}
              variant={isUpperCase ? "solid" : "outline"}
              onClick={() => setIsUpperCase(!isUpperCase)}
            >
              {isUpperCase
                ? userLanguage === "es"
                  ? "Mayúsculas"
                  : "Uppercase"
                : userLanguage === "es"
                ? "Minúsculas"
                : "Lowercase"}
            </Button>
          )}
        </HStack>
        <IconButton
          aria-label={
            userLanguage === "es" ? "Cerrar teclado" : "Close keyboard"
          }
          icon={<MdClose />}
          size="sm"
          variant="ghost"
          onClick={onClose}
        />
      </HStack>

      {/* Keyboard grid */}
      <VStack spacing={1} align="stretch">
        {layout.map((row, rowIndex) => (
          <HStack
            key={rowIndex}
            spacing={1}
            justifyContent="center"
            flexWrap="wrap"
          >
            {row.map((char, charIndex) => (
              <Button
                key={`${rowIndex}-${charIndex}`}
                size="sm"
                minW={isJapanese ? "36px" : "32px"}
                // h="36px"
                fontSize={isJapanese ? "lg" : "md"}
                fontWeight="medium"
                variant="outline"
                borderColor="whiteAlpha.300"
                _hover={{
                  bg: "purple.600",
                  borderColor: "purple.400",
                }}
                _active={{
                  bg: "purple.700",
                }}
                onClick={() => handleKeyPress(char)}
                padding={6}
              >
                {char}
              </Button>
            ))}
          </HStack>
        ))}

        {/* Bottom row with space and backspace */}
        <HStack spacing={2} justify="center" mt={2}>
          <Button
            size="sm"
            minW="100px"
            h="36px"
            variant="outline"
            borderColor="whiteAlpha.300"
            leftIcon={<MdSpaceBar />}
            _hover={{
              bg: "purple.600",
              borderColor: "purple.400",
            }}
            onClick={handleSpace}
          >
            {userLanguage === "es" ? "Espacio" : "Space"}
          </Button>
          <IconButton
            aria-label={userLanguage === "es" ? "Borrar" : "Backspace"}
            icon={<MdBackspace />}
            size="sm"
            minW="60px"
            h="36px"
            variant="outline"
            borderColor="whiteAlpha.300"
            _hover={{
              bg: "red.600",
              borderColor: "red.400",
            }}
            onClick={handleBackspace}
          />
        </HStack>
      </VStack>
    </Box>
  );
}
