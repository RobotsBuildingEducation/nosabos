const EASE_OUT = [0.22, 1, 0.36, 1];
const EASE_IN = [0.4, 0, 1, 1];

const getDrawerExitOffset = (direction = "right") => {
  switch (direction) {
    case "left":
      return { x: "-100%", y: 0 };
    case "right":
      return { x: "100%", y: 0 };
    case "top":
      return { x: 0, y: "-100%" };
    case "bottom":
    default:
      return { x: 0, y: "100%" };
  }
};

export const nativeModalMotionProps = {
  initial: "closed",
  animate: "open",
  exit: "closed",
  variants: {
    open: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: EASE_OUT,
      },
    },
    closed: {
      opacity: 0,
      y: 10,
      transition: {
        duration: 0.14,
        ease: EASE_IN,
      },
    },
  },
  style: {
    willChange: "transform, opacity",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
  },
};

export const nativeOverlayMotionProps = {
  initial: "closed",
  animate: "open",
  exit: "closed",
  variants: {
    open: {
      opacity: 1,
      transition: {
        duration: 0.16,
        ease: EASE_OUT,
      },
    },
    closed: {
      opacity: 0,
      transition: {
        duration: 0.12,
        ease: EASE_IN,
      },
    },
  },
  style: {
    willChange: "opacity",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
  },
};

export const nativeDrawerMotionProps = {
  initial: "exit",
  animate: "enter",
  exit: "exit",
  variants: {
    enter: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.24,
        ease: EASE_OUT,
        opacity: {
          duration: 0.14,
          delay: 0.04,
          ease: EASE_OUT,
        },
      },
    },
    exit: ({ direction }) => ({
      ...getDrawerExitOffset(direction),
      opacity: 0,
      transition: {
        duration: 0.18,
        ease: EASE_IN,
        opacity: {
          duration: 0.08,
          ease: EASE_IN,
        },
      },
    }),
  },
};

const getAnchoredDrawerExitOffset = (direction = "right") => {
  switch (direction) {
    case "left":
      return { x: -18, y: 0 };
    case "right":
      return { x: 18, y: 0 };
    case "top":
      return { x: 0, y: -18 };
    case "bottom":
    default:
      return { x: 0, y: 18 };
  }
};

export const nativeAnchoredDrawerMotionProps = {
  initial: "exit",
  animate: "enter",
  exit: "exit",
  variants: {
    enter: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.22,
        ease: EASE_OUT,
      },
    },
    exit: ({ direction }) => ({
      ...getAnchoredDrawerExitOffset(direction),
      opacity: 0,
      transition: {
        duration: 0.14,
        ease: EASE_IN,
      },
    }),
  },
};
