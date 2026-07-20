export function getThemeModeToggleProps(isLightTheme) {
  return {
    bg: isLightTheme
      ? "linear-gradient(135deg, #fff9ed 0%, #ffe8cf 100%)"
      : "linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.92) 100%)",
    color: isLightTheme ? "#b45309" : "#bfdbfe",
    border: "1px solid",
    borderColor: isLightTheme
      ? "rgba(245, 158, 11, 0.36)"
      : "rgba(147, 197, 253, 0.32)",
    boxShadow: isLightTheme
      ? "0 10px 22px rgba(245, 158, 11, 0.18)"
      : "0 12px 28px rgba(15, 23, 42, 0.32)",
    backdropFilter: "blur(20px)",
    _hover: {
      bg: isLightTheme
        ? "linear-gradient(135deg, #fff6e4 0%, #ffe1c1 100%)"
        : "linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(51, 65, 85, 0.94) 100%)",
    },
    _active: {
      bg: isLightTheme
        ? "linear-gradient(135deg, #fff1d7 0%, #ffd7a8 100%)"
        : "linear-gradient(135deg, rgba(15, 23, 42, 1) 0%, rgba(30, 41, 59, 0.98) 100%)",
    },
  };
}
