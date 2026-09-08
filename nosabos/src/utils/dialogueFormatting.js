/**
 * Utility for parsing and separating narrative subtext (actions, stage directions,
 * dialogue tags) from actual spoken dialogue lines in RPG dialogues and stories.
 */

export function cleanSpoken(s) {
  let res = String(s || "").trim();
  // Strip leading/trailing quotes (standard, smart, single, double)
  res = res.replace(/^[\"'\u201c\u2018]+|[\"'\u201d\u2019]+$/g, "").trim();
  // If string ended with a comma from dialogue attribution like \"Hello,\" she said, strip trailing comma
  if (res.endsWith(",")) {
    res = res.slice(0, -1).trim();
  }
  return res;
}

export function cleanSubtext(s) {
  let res = String(s || "").trim();
  // Strip outer markdown asterisks, underscores, brackets, parentheses
  res = res.replace(/^[*_()[\]]+|[*_()[\]]+$/g, "").trim();
  return res;
}

/**
 * Separates any narrative subtext or stage direction from the spoken dialogue.
 * Returns: { subtext: string, spokenText: string }
 *
 * Examples:
 * - "Yachiru looks up and says, 'I am Yachiru.'" -> { subtext: "Yachiru looks up and says", spokenText: "I am Yachiru." }
 * - "*Yachiru smiles shyly.* Hello!" -> { subtext: "Yachiru smiles shyly.", spokenText: "Hello!" }
 * - "Hello! My name is Yachiru." -> { subtext: "", spokenText: "Hello! My name is Yachiru." }
 */
export function splitDialogueSubtext(rawText) {
  if (!rawText || typeof rawText !== "string") {
    return { subtext: "", spokenText: "" };
  }

  let text = rawText.trim();
  if (!text) return { subtext: "", spokenText: "" };

  // If the entire text is wrapped in matched quotes, unwrap them first
  if (
    (text.startsWith('"') && text.endsWith('"') && (text.match(/"/g) || []).length === 2) ||
    (text.startsWith("'") && text.endsWith("'") && (text.match(/'/g) || []).length === 2) ||
    (text.startsWith("“") && text.endsWith("”")) ||
    (text.startsWith("‘") && text.endsWith("’"))
  ) {
    text = text.slice(1, -1).trim();
  }

  // 1. Markdown italic or bold stage directions at start:
  // e.g. *Yachiru smiles shyly after hearing your question.* Hello!
  // or _looks up_ "I am Yachiru."
  const leadingItalicMatch = text.match(/^([*_]{1,2})([^*_]+)\1\s*(?:[:,-]\s*)?([\s\S]+)$/);
  if (leadingItalicMatch) {
    return {
      subtext: cleanSubtext(leadingItalicMatch[2]),
      spokenText: cleanSpoken(leadingItalicMatch[3]),
    };
  }

  // 2. Parentheses or brackets at start: (smiles shyly) Hello... or [looks up] Hello...
  const leadingParenMatch = text.match(/^(\([^)]{2,120}\)|\[[^\]]{2,120}\])\s*(?:[:,-]\s*)?([\s\S]+)$/);
  if (leadingParenMatch) {
    return {
      subtext: cleanSubtext(leadingParenMatch[1]),
      spokenText: cleanSpoken(leadingParenMatch[2]),
    };
  }

  // 3. Narration followed by quoted speech:
  // e.g. "Yachiru looks up and says, 'I am Yachiru.'"
  // e.g. "Yachiru looks up and says, \"I am Yachiru.\""
  // e.g. "Yachiru mira hacia arriba y dice: 'Soy Yachiru.'"
  // e.g. "She giggles: \"Welcome!\""
  const narrationQuoteMatch = text.match(/^([^"\u201c\u2018]+?)(?:,\s*|:\s*|\s+)(["'\u201c\u2018])([\s\S]+?)\2(?:\s*\.?)*$/);
  if (narrationQuoteMatch) {
    const narration = cleanSubtext(narrationQuoteMatch[1]);
    const quoted = cleanSpoken(narrationQuoteMatch[3]);
    if (narration.length > 1 && quoted.length > 0) {
      return {
        subtext: narration,
        spokenText: quoted,
      };
    }
  }

  // 4. Quoted speech followed by attribution:
  // e.g. "\"I am Yachiru,\" she says with a big smile."
  // e.g. "'Hello,' whispered Neko."
  const quoteNarrationMatch = text.match(/^(["'\u201c\u2018])([\s\S]+?)\1(?:,\s*|\s+)([^"\u201c\u2018]{2,80})$/);
  if (quoteNarrationMatch) {
    return {
      subtext: cleanSubtext(quoteNarrationMatch[3]),
      spokenText: cleanSpoken(quoteNarrationMatch[2]),
    };
  }

  // 5. Narration with speaker tag and colon (no quotes):
  // e.g. "Yachiru looks up and says: I am Yachiru."
  // e.g. "Jiraiya: Hello there."
  const colonMatch = text.match(/^([^:\n]{2,60}?(?:says|said|dice|dijo|dit|sagt|smiles|looks|laughs|replies|exclaims|giggles|shouts|whispers))\s*:\s*([\s\S]+)$/i);
  if (colonMatch) {
    return {
      subtext: cleanSubtext(colonMatch[1]),
      spokenText: cleanSpoken(colonMatch[2]),
    };
  }

  // 6. Stage direction at the very end:
  // e.g. "Hello there! *waves cheerfully*"
  // e.g. "I am ready! (smiles warmly)"
  const trailingItalicMatch = text.match(/^([\s\S]+?)\s*([*_]{1,2})([^*_]+)\2$/);
  if (trailingItalicMatch) {
    return {
      subtext: cleanSubtext(trailingItalicMatch[3]),
      spokenText: cleanSpoken(trailingItalicMatch[1]),
    };
  }

  const trailingParenMatch = text.match(/^([\s\S]+?)\s*(\([^)\n]{2,80}\)|\[[^\]\n]{2,80}\])$/);
  if (trailingParenMatch) {
    return {
      subtext: cleanSubtext(trailingParenMatch[2]),
      spokenText: cleanSpoken(trailingParenMatch[1]),
    };
  }

  return {
    subtext: "",
    spokenText: text,
  };
}

/**
 * Returns only the spoken dialogue text, stripping any narrative subtext
 * so that Text-To-Speech (TTS) never speaks narrative actions or speaker tags.
 */
export function extractSpokenDialogue(rawText) {
  const { spokenText } = splitDialogueSubtext(rawText);
  return spokenText || rawText || "";
}
