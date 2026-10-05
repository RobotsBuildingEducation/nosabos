/** Neutral, readable mute/pause controls across both application themes. */
export function voiceCallControlStyle(selected) {
  const selectedBackground = "color-mix(in srgb, var(--app-surface) 88%, black)";
  const hoverBackground = "color-mix(in srgb, var(--app-surface) 92%, black)";
  return {
    "data-call-control": "",
    "aria-pressed": selected,
    variant: "ghost",
    color: "var(--app-text-primary)",
    bg: selected ? selectedBackground : "transparent",
    boxShadow: "none",
    _hover: { bg: selected ? selectedBackground : hoverBackground, color: "var(--app-text-primary)" },
    _active: { bg: selectedBackground, transform: "scale(0.96)", color: "var(--app-text-primary)" },
    _focusVisible: { outline: "2px solid var(--app-text-secondary)", outlineOffset: "2px", boxShadow: "none" },
    _disabled: { opacity: 0.5 },
    transition: "background-color 160ms ease, transform 160ms ease",
  };
}
