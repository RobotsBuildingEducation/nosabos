import React, { useState } from "react";
import { Box } from "@chakra-ui/react";
import LessonFlashcard from "../../src/components/LessonFlashcard";

// Production exercise, deterministic grader and local-only progress callback.
export default function FlashcardPreview() {
  const [earned, setEarned] = useState(60);
  const [card, setCard] = useState(0);
  return (
    <Box p={5} pb={40}>
      <LessonFlashcard
        key={card}
        concept="Invitar a alguien a tomar café"
        answer="Would you like to grab coffee?"
        targetLang="en"
        supportLang="es"
        userLanguage="en"
        lessonProgress={{
          pct: earned,
          earned,
          total: 100,
          label: "Lesson progress",
        }}
        onCorrect={async (xp) => setEarned((previous) => previous + xp)}
        onNext={() => setCard((previous) => previous + 1)}
      />
    </Box>
  );
}
