/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect } from "react";

import character1 from "../assets/1.webp";

import character3 from "../assets/3.webp";
import character4 from "../assets/4.webp";
import character5 from "../assets/5.webp";
import character6 from "../assets/6.webp";
import character7 from "../assets/7.webp";
import character8 from "../assets/8.webp";
import character9 from "../assets/9.webp";
import character10 from "../assets/10.webp";
import character11 from "../assets/11.webp";
import character12 from "../assets/12.webp";
import character13 from "../assets/13.webp";
import character14 from "../assets/14.webp";
import character15 from "../assets/15.webp";
import character16 from "../assets/16.webp";
import character17 from "../assets/17.webp";
import character18 from "../assets/18.webp";
import character19 from "../assets/19.webp";
import character20 from "../assets/20.webp";
import character21 from "../assets/21.webp";
import character22 from "../assets/22.webp";
import character23 from "../assets/23.webp";
import character24 from "../assets/24.webp";
import character25 from "../assets/25.webp";
import character26 from "../assets/26.webp";
import character27 from "../assets/27.webp";
import character28 from "../assets/28.webp";
import character29 from "../assets/29.webp";
import character30 from "../assets/30.webp";
import character31 from "../assets/31.webp";
import character32 from "../assets/32.webp";
import character33 from "../assets/33.webp";
import character34 from "../assets/34.webp";
import character35 from "../assets/35.webp";
import character36 from "../assets/36.webp";
import character37 from "../assets/37.webp";
import character38 from "../assets/38.webp";
import character39 from "../assets/39.webp";
import character40 from "../assets/40.webp";
import character41 from "../assets/41.webp";

import { keyframes } from "@emotion/react";
import { Box } from "@chakra-ui/react";

const riseAnimation = keyframes`
  from {
    transform: translateY(25px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const fadeInAnimation = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const panLeft = keyframes`
from {
  transform: translateX(-25px);
}
to {
  transform: translateX(0); // Adjust as needed
}
`;

const panRight = keyframes`
  from {
    transform: translateX(25px);
  }
  to {
    transform: translateX(0); // Adjust as needed
  }
`;

// Create the FadeInComponent using Chakra UI
export const PanRightComponent = ({ children, speed = "0.15s" }) => {
  return (
    <Box
      display="flex"
      justifyContent={"center"}
      animation={`${panRight} ${speed} ease-in-out`} // Apply the animation with dynamic speed
    >
      {children}
    </Box>
  );
};

// Create the FadeInComponent using Chakra UI
export const PanLeftComponent = ({ children, speed = "0.15s" }) => {
  return (
    <Box
      display="flex"
      justifyContent={"center"}
      animation={`${panLeft} ${speed} ease-in-out`} // Apply the animation with dynamic speed
    >
      {children}
    </Box>
  );
};

// Create the FadeInComponent using Chakra UI
export const RiseUpAnimation = ({ children, speed = "0.15s" }) => {
  return (
    <Box
      display="flex"
      justifyContent={"center"}
      animation={`${riseAnimation} ${speed} ease-in-out`} // Apply the animation with dynamic speed
    >
      {children}
    </Box>
  );
};

// Create the FadeInComponent using Chakra UI
export const FadeInComponent = ({ children, speed = "0.15s" }) => {
  return (
    <Box
      display="flex"
      justifyContent={"center"}
      animation={`${fadeInAnimation} ${speed} ease-in`} // Apply the animation with dynamic speed
    >
      {children}
    </Box>
  );
};

const characterImages = [
  character1,

  character3,
  character4,
  character5,
  character6,
  character7,
  character8,
  character9,
  character10,
  character11,
  character12,
  character13,
  character14,
  character15,
  character16,
  character17,
  character18,
  character19,
  character20,
  character21,
  character22,
  character23,
  character24,
  character25,
  character26,
  character27,
  character28,
  character29,
  character30,
  character31,
  character32,
  character33,
  character34,
  character35,
  character36,
  character37,
  character38,
  character39,
  character40,
  character41,
];

export const characterImagesMap = {
  1: character1,
  2: character3,
  3: character4,
  4: character5,
  5: character6,
  6: character7,
  7: character8,
  8: character9,
  9: character10,
  10: character11,
  11: character12,
  12: character13,
  13: character14,
  14: character15,
  15: character16,
  16: character17,
  17: character18,
  18: character19,
  19: character20,
  20: character21,
  21: character22,
  22: character23,
  23: character24,
  24: character25,
  25: character26,
  26: character27,
  27: character28,
  28: character29,
  29: character30,
  30: character31,
  31: character32,
  32: character33,
  33: character34,
  34: character35,
  35: character36,
  36: character37,
  37: character38,
  38: character39,
  39: character40,
  40: character41,
};

// Pre-warm common character portraits off the main thread so they appear instantly
if (typeof window !== "undefined" && typeof Image !== "undefined") {
  const prewarm = () => {
    const warmSample = [1, 3, 4, 5, 24, 27, 30, 31, 32, 40];
    for (const id of warmSample) {
      const src = characterImagesMap[id];
      if (src) {
        const img = new Image();
        img.decoding = "async";
        img.src = src;
      }
    }
  };
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(prewarm, { timeout: 3000 });
  } else {
    setTimeout(prewarm, 1500);
  }
}

const RandomCharacter = ({
  width = "50px",
  containerHeight = 100,
  speed = "0.3s",
  borderRadius = null,
  notSoRandomCharacter = null,
  isTimed = false,
}) => {
  const [image, setImage] = useState(() => {
    if (notSoRandomCharacter) return "";
    try {
      const usedIndices = JSON.parse(localStorage.getItem("usedIndices")) || [];
      const availableCharacters = characterImages.filter(
        (_, index) => !usedIndices.includes(index)
      );
      const randomIndex = Math.floor(
        Math.random() * (availableCharacters.length || characterImages.length)
      );
      return availableCharacters[randomIndex] || characterImages[0];
    } catch {
      return characterImages[0];
    }
  });
  const [showSplash, setShowSplash] = useState(isTimed);

  useEffect(() => {
    // If notSoRandomCharacter is provided, characterImagesMap is used directly; skip random selection.
    if (notSoRandomCharacter) return;

    if (showSplash && isTimed) {
      const timer = setTimeout(() => setShowSplash(false), 3000);
      return () => clearTimeout(timer);
    }

    try {
      const usedIndices = JSON.parse(localStorage.getItem("usedIndices")) || [];

      // Filter out used characters
      const availableCharacters = characterImages.filter(
        (_, index) => !usedIndices.includes(index)
      );

      // Select a random character from the available ones
      const randomIndex = Math.floor(
        Math.random() * (availableCharacters.length || characterImages.length)
      );
      const randomImage = availableCharacters[randomIndex] || characterImages[0];

      // Update used indices
      const newUsedIndices = [
        ...usedIndices,
        characterImages.indexOf(randomImage),
      ];
      if (newUsedIndices.length >= characterImages.length) {
        localStorage.setItem("usedIndices", JSON.stringify([]));
      } else {
        localStorage.setItem("usedIndices", JSON.stringify(newUsedIndices));
      }

      setImage(randomImage);
    } catch {
      setImage(characterImages[0]);
    }
  }, [showSplash, isTimed, notSoRandomCharacter]);

  const resolvedSrc = notSoRandomCharacter
    ? characterImagesMap[notSoRandomCharacter]
    : image;

  return (
    <div
      style={{
        height: containerHeight,
        display: "flex",
        flexDirection: "column",
        alignContent: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex" }}>
        <RiseUpAnimation speed={typeof speed === "number" ? `${speed}s` : (speed || "0.3s")}>
          {resolvedSrc ? (
            <img
              src={resolvedSrc}
              alt=""
              width={width}
              height={width}
              decoding="async"
              loading="eager"
              style={{
                borderRadius: borderRadius || undefined,
                imageRendering: "crisp-edges",
                objectFit: "contain",
                width,
                height: width,
                display: "block",
              }}
            />
          ) : null}
        </RiseUpAnimation>
      </div>
    </div>
  );
};

export default RandomCharacter;
