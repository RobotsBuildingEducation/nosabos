import { useLayoutEffect } from "react";
import { animate, motionValue } from "framer-motion";

// The compact navigation, loading fallback, and activity footer live in
// different portals and can mount in different commits. Keep the actual
// dimensions (and spring velocity) across that handoff instead of relying on
// shared-layout snapshots of components that may already have unmounted.
const width = motionValue(66);
const height = motionValue(66);
let targetWidth = 66;
let targetHeight = 66;

export default function useActionBarDimensions({
  active,
  width: nextWidth = 66,
  height: nextHeight = 66,
  reduceMotion,
}) {
  useLayoutEffect(() => {
    if (!active || !nextWidth || !nextHeight) return;
    if (reduceMotion) {
      width.stop();
      height.stop();
      width.set(nextWidth);
      height.set(nextHeight);
    } else {
      if (targetWidth !== nextWidth || (!width.isAnimating() && width.get() !== nextWidth)) {
        animate(width, nextWidth, {
          type: "spring",
          stiffness: 300,
          damping: 29,
          mass: 0.9,
        });
      }
      if (targetHeight !== nextHeight || (!height.isAnimating() && height.get() !== nextHeight)) {
        animate(height, nextHeight,
          nextHeight < height.get()
            ? { duration: 0.4, ease: [0.32, 0, 0.2, 1] }
            : { type: "spring", stiffness: 430, damping: 36, mass: 0.8 },
        );
      }
    }
    targetWidth = nextWidth;
    targetHeight = nextHeight;
    // Do not reset or stop on unmount. The next visible owner inherits the
    // in-flight size, including rapid navigation and loading replacements.
  }, [active, nextWidth, nextHeight, reduceMotion]);

  return { width, height };
}
