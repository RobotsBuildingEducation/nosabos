import { getLanguageDirection } from "../constants/languages";

export function getBidiTextProps(
  lang,
  { align = "start", unicodeBidi = "plaintext" } = {},
) {
  const dir = getLanguageDirection(lang, "ltr");
  const textAlign =
    align === "center"
      ? "center"
      : align === "end"
        ? dir === "rtl"
          ? "left"
          : "right"
        : dir === "rtl"
          ? "right"
          : "left";

  return {
    dir,
    lang,
    textAlign,
    sx: unicodeBidi ? { unicodeBidi } : undefined,
  };
}

export function mergeBidiSx(bidiProps, sx = {}) {
  return {
    ...(bidiProps?.sx || {}),
    ...sx,
  };
}
