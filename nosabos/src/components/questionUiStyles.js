const APP_SURFACE_ELEVATED = "var(--app-surface-elevated)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_BORDER_STRONG = "var(--app-border-strong)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_TEXT_MUTED = "var(--app-text-muted)";

const toneVars = {
  single: {
    accent: "var(--question-choice-single-accent)",
    bg: "var(--question-choice-single-bg)",
    bgHover: "var(--question-choice-single-bg-hover)",
  },
  multi: {
    accent: "var(--question-choice-multi-accent)",
    bg: "var(--question-choice-multi-bg)",
    bgHover: "var(--question-choice-multi-bg-hover)",
  },
};

export const questionToneText = {
  primary: APP_TEXT_PRIMARY,
  secondary: APP_TEXT_SECONDARY,
  muted: APP_TEXT_MUTED,
};

export function getQuestionToolButtonProps({ active = false } = {}) {
  return {
    variant: "outline",
    bg: active ? "var(--question-tool-bg-hover)" : "var(--question-tool-bg)",
    color: "var(--question-tool-accent)",
    borderColor: active
      ? "var(--question-tool-accent-strong)"
      : "var(--question-tool-border)",
    borderWidth: "1px",
    boxShadow: "var(--question-tool-shadow)",
    _hover: {
      bg: "var(--question-tool-bg-hover)",
      color: "var(--question-tool-accent-strong)",
      borderColor: "var(--question-tool-accent-strong)",
    },
    _active: {
      bg: "var(--question-tool-bg-hover)",
      transform: "translateY(0)",
      boxShadow: "var(--question-tool-shadow)",
    },
  };
}

export function getQuestionChoiceCardProps({
  selected = false,
  tone = "single",
  interactive = true,
} = {}) {
  const palette = toneVars[tone] || toneVars.single;

  return {
    borderWidth: "2px",
    borderColor: selected ? palette.accent : APP_BORDER,
    bg: selected ? palette.bg : APP_SURFACE_ELEVATED,
    color: APP_TEXT_PRIMARY,
    boxShadow: selected ? "var(--question-feedback-shadow)" : "none",
    transition: "all 0.2s ease",
    _hover: interactive
      ? {
          borderColor: selected ? palette.accent : APP_BORDER_STRONG,
          bg: selected ? palette.bgHover : APP_SURFACE_MUTED,
          transform: "translateY(-2px)",
          shadow: "md",
        }
      : {},
  };
}

export function getQuestionChoiceIndicatorProps({
  selected = false,
  tone = "single",
} = {}) {
  const palette = toneVars[tone] || toneVars.single;

  return {
    borderWidth: "2px",
    borderColor: selected ? palette.accent : APP_BORDER_STRONG,
    bg: selected ? palette.accent : "transparent",
    color: selected ? APP_SURFACE_ELEVATED : APP_TEXT_PRIMARY,
    transition: "all 0.2s ease",
  };
}

export function getQuestionChipProps({ dragging = false } = {}) {
  return {
    borderWidth: "1px",
    borderColor: dragging
      ? "var(--question-chip-accent)"
      : "var(--question-chip-border)",
    bg: dragging ? "var(--question-chip-bg-hover)" : "var(--question-chip-bg)",
    color: APP_TEXT_PRIMARY,
    boxShadow: "var(--question-feedback-shadow)",
    transition: "all 0.15s ease",
    _hover: {
      bg: "var(--question-chip-bg-hover)",
      borderColor: "var(--question-chip-accent)",
    },
  };
}

export function getQuestionDropZoneProps({ filled = false } = {}) {
  return {
    border: filled
      ? "1px solid var(--question-chip-border)"
      : `1px dashed ${APP_BORDER_STRONG}`,
    bg: filled ? "var(--question-chip-bg)" : APP_SURFACE_MUTED,
    color: APP_TEXT_PRIMARY,
    transition: "all 0.2s ease",
  };
}

export function getQuestionFeedbackPanelProps({ ok = false } = {}) {
  return {
    bg: ok ? "var(--question-success-bg)" : "var(--question-error-bg)",
    borderWidth: "1px",
    borderColor: ok
      ? "var(--question-success-accent)"
      : "var(--question-error-accent)",
    boxShadow: "var(--question-feedback-shadow)",
  };
}

export const questionFeedbackAccent = {
  ok: "var(--question-success-accent)",
  error: "var(--question-error-accent)",
};

export function getQuestionAssistantPanelProps() {
  return {
    bg: "var(--question-assistant-bg)",
    borderWidth: "1px",
    borderColor: "var(--question-assistant-border)",
    boxShadow: "var(--question-feedback-shadow)",
  };
}

export const questionAssistantText = {
  accent: "var(--question-assistant-accent)",
  accentStrong: "var(--question-assistant-accent-strong)",
};
