// src/components/CompanionQuestBubble.jsx
//
// A hand-drawn manga speech balloon: ONE continuous outline (puffy bowed edges,
// slightly irregular corners + a curved tail), traced as a single SVG path so
// the ink line reads as inked-by-hand rather than geometric. The wobble is
// seeded from the message text — organic, but stable across re-renders. It
// measures its own text so the outline wraps any length, and the tail leans
// down-left toward the companion it's anchored to (see PlatePetPanel).
import React, { useLayoutEffect, useRef, useState } from "react";
import { Box, Button, Text } from "@chakra-ui/react";

// Tiny deterministic PRNG (Lehmer) so each message gets a stable hand-drawn
// wobble instead of re-jittering every render.
function seededRng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 48271) % 2147483647;
    return (s / 2147483647) * 2 - 1; // -1..1
  };
}

function seedFromText(text) {
  let h = 0;
  for (let i = 0; i < text.length; i += 1)
    h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

// Trace the balloon as one continuous path: a smooth rounded blob (big corner
// radii, almost oval) with a single soft outward bow per side and slightly
// uneven corners — the gentle, low-frequency asymmetry of a hand-inked manga
// bubble, not a puffy wave. The wobble is seeded from the message text so it's
// organic but stable. `pad` shifts everything in so the bows never clip.
function buildBalloonPath(W, H, tailH, pad, seed) {
  const rnd = seededRng(seed);
  const j = (amt) => rnd() * amt;
  const n = (v) => v.toFixed(1);
  const x = (v) => n(v + pad);
  const y = (v) => n(v + pad);

  // Large, slightly uneven corner radii → a round, blobby outline (almost an
  // oval) rather than a rectangle, like the reference manga bubbles.
  const r0 = Math.max(18, Math.min(H / 2, W / 2, 64));
  const rTL = r0 + j(4);
  const rTR = r0 + j(4);
  const rBR = r0 + j(4);
  const rBL = r0 + j(4);

  // ONE gentle outward bow per side. Scales a little with length so a big
  // balloon isn't dead-straight, but stays subtle (manga bubbles are smooth).
  const bow = (len) => Math.max(2, Math.min(7, len * 0.04)) + j(1.2);
  const bTop = bow(W);
  const bRight = bow(H);
  const bLeft = bow(H);
  const bBot = bow(W) * 0.5; // the bottom barely bows (the tail lives there)

  // Tail: a small, cute curved nub aimed down-left. Kept clear of the
  // bottom-left corner (baseL stays well right of rBL) so the short run back to
  // the corner doesn't pinch into a second little nub.
  const baseR = Math.min(Math.max(W - r0 - 4, r0 + 22), r0 + 30);
  const baseL = baseR - 12;
  const tipX = baseL - 8 + j(1.2);
  const tipY = H + tailH + j(1.2);

  return [
    `M ${x(rTL)},${y(0)}`,
    `Q ${x(W / 2 + j(4))},${y(-bTop)} ${x(W - rTR)},${y(0)}`, // top
    `Q ${x(W)},${y(0)} ${x(W)},${y(rTR)}`, // top-right corner
    `Q ${x(W + bRight)},${y(H / 2 + j(4))} ${x(W)},${y(H - rBR)}`, // right
    `Q ${x(W)},${y(H)} ${x(W - rBR)},${y(H)}`, // bottom-right corner
    `Q ${x((W - rBR + baseR) / 2)},${y(H + bBot)} ${x(baseR)},${y(H)}`, // bottom, right of tail
    `Q ${x(baseR - 4 + j(1.5))},${y(H + tailH * 0.5)} ${x(tipX)},${y(tipY)}`,
    `Q ${x(tipX + 9 + j(1.5))},${y(H + tailH * 0.32)} ${x(baseL)},${y(H)}`,
    `L ${x(rBL)},${y(H)}`, // bottom, left of tail → straight into the corner (no second nub)
    `Q ${x(0)},${y(H)} ${x(0)},${y(H - rBL)}`, // bottom-left corner
    `Q ${x(-bLeft)},${y(H / 2 + j(4))} ${x(0)},${y(rTL)}`, // left
    `Q ${x(0)},${y(0)} ${x(rTL)},${y(0)}`, // top-left corner
    "Z",
  ].join(" ");
}

const PAD = 20;

export default function CompanionQuestBubble({
  text,
  maxWidth = 220,
  onDismiss,
}) {
  const contentRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return undefined;
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  if (!text) return null;

  const W = size.w;
  const H = size.h;
  const tailH = 16;
  const path =
    W > 0 && H > 0
      ? buildBalloonPath(W, H, tailH, PAD, seedFromText(text))
      : "";

  return (
    <Box position="relative" display="inline-block" maxW={`${maxWidth}px`}>
      {path ? (
        <Box
          as="svg"
          position="absolute"
          left={`${-PAD}px`}
          top={`${-PAD}px`}
          width={`${W + PAD * 2}px`}
          height={`${H + tailH + PAD * 2}px`}
          viewBox={`0 0 ${W + PAD * 2} ${H + tailH + PAD * 2}`}
          overflow="visible"
          aria-hidden="true"
        >
          <path
            d={path}
            style={{
              fill: "var(--app-surface-elevated)",
              stroke: "var(--app-text-primary)",
              strokeWidth: 2.8,
              strokeLinejoin: "round",
              strokeLinecap: "round",
            }}
          />
        </Box>
      ) : null}
      <Box
        ref={contentRef}
        position="relative"
        px={6}
        py={4}
        maxW={`${maxWidth}px`}
        visibility={W > 0 ? "visible" : "hidden"}
      >
        <Text
          fontFamily={
            "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          }
          fontSize="xs"
          color="var(--app-text-primary)"
          lineHeight="1.4"
          textAlign="center"
          fontWeight="bold"
        >
          {text}
        </Text>
        {onDismiss && (
          <Button
            mt={3}
            size="sm"
            width="100%"
            fontFamily={
              "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            }
            fontWeight="bold"
            borderRadius="full"
            variant="outline"
            colorScheme="blackAlpha"
            borderWidth="2px"
            borderColor="var(--app-text-primary)"
            color="var(--app-text-primary)"
            onClick={onDismiss}
          >
            Continue
          </Button>
        )}
      </Box>
    </Box>
  );
}
