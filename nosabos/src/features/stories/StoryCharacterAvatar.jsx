import React, { useEffect, useState } from "react";
import { Box, Image, Center } from "@chakra-ui/react";
import { characterImagesMap } from "../../components/RandomCharacter";
import {
  getRandomStoryCharacterPortraitId,
  getUserPetType,
  isUserCharacter,
} from "./storyCharacters";
import {
  drawRpgCompanionFrame,
  RPG_COMPANION_SPRITE,
} from "../../components/rpgCompanionSprites";
import { normalizePetType } from "../../utils/petTypes";

function findOpaqueBounds(cellCtx, width, height) {
  if (!cellCtx) return null;
  const data = cellCtx.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 32) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

const petDataUrlCache = new Map();

function getPetFrameDataUrl(petType, frame = 0) {
  if (typeof document === "undefined") return null;
  const safeType = normalizePetType(petType);
  const key = `${safeType}:${frame % 12}`;
  if (petDataUrlCache.has(key)) {
    return petDataUrlCache.get(key);
  }

  const DISPLAY = 48;
  const canvas = document.createElement("canvas");
  canvas.width = DISPLAY;
  canvas.height = DISPLAY;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;

  const cell = document.createElement("canvas");
  cell.width = RPG_COMPANION_SPRITE.width;
  cell.height = RPG_COMPANION_SPRITE.height;
  const cellCtx = cell.getContext("2d");
  if (cellCtx) {
    cellCtx.imageSmoothingEnabled = false;
    drawRpgCompanionFrame(cellCtx, safeType, "down", frame);

    const bounds = findOpaqueBounds(cellCtx, cell.width, cell.height);
    if (bounds) {
      const scale = Math.min(
        (DISPLAY - 8) / bounds.width,
        (DISPLAY - 8) / bounds.height,
      );
      const drawWidth = Math.max(1, Math.floor(bounds.width * scale));
      const drawHeight = Math.max(1, Math.floor(bounds.height * scale));
      ctx.drawImage(
        cell,
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height,
        Math.floor((DISPLAY - drawWidth) / 2),
        Math.floor((DISPLAY - drawHeight) / 2) + 1,
        drawWidth,
        drawHeight,
      );
    } else {
      ctx.drawImage(cell, 0, 0, DISPLAY, DISPLAY);
    }
  }

  const dataUrl = canvas.toDataURL("image/png");
  petDataUrlCache.set(key, dataUrl);
  return dataUrl;
}

function PetAvatarImage({ petType, isSpeaking = false }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!isSpeaking) {
      setFrame(0);
      return undefined;
    }
    const interval = window.setInterval(() => {
      setFrame((f) => (f + 1) % 12);
    }, 180);
    return () => window.clearInterval(interval);
  }, [isSpeaking]);

  const dataUrl = getPetFrameDataUrl(petType, frame);

  if (!dataUrl) return <Center w="100%" h="100%" role="img" aria-label={`${petType} pet avatar`}>🐾</Center>;

  // Native img keeps the current pet frame while its next data URL decodes.
  // Chakra Image would show its loading fallback on every frame change.
  return (
    <Box
      as="img"
      src={dataUrl}
      alt={`${petType} pet avatar`}
      w="100%"
      h="100%"
      objectFit="contain"
      imageRendering="pixelated"
      p={1.5}
    />
  );
}

export default function StoryCharacterAvatar({
  name,
  user = null,
  size = "40px",
  isSpeaking = false,
  accentColor = "teal.400",
  showIndicator = false,
  indicatorIcon = null,
  borderRadius = "full",
  portraitId: explicitPortraitId = null,
  ...rest
}) {
  const isUser = isUserCharacter(name, user);
  const petType = isUser ? getUserPetType(user) : null;
  const [randomPortraitId] = useState(() =>
    getRandomStoryCharacterPortraitId(name, user)
  );
  const portraitId = explicitPortraitId || randomPortraitId;
  const portraitImg = characterImagesMap[portraitId] || characterImagesMap["35"];

  return (
    <Box
      position="relative"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
      {...rest}
    >
      <Box
        w={size}
        h={size}
        borderRadius={borderRadius}
        overflow="hidden"
        border="2.5px solid"
        borderColor={
          isSpeaking
            ? accentColor
            : "var(--app-border-strong, rgba(255, 255, 255, 0.2))"
        }
        boxShadow={
          isSpeaking
            ? `0 0 14px ${
                accentColor === "purple.400"
                  ? "rgba(168, 85, 247, 0.45)"
                  : "rgba(45, 212, 191, 0.45)"
              }`
            : "0 2px 4px rgba(0, 0, 0, 0.15)"
        }
        bg={isUser ? "rgba(45, 212, 191, 0.14)" : "var(--app-surface-elevated, #1a202c)"}
        transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
      >
        {isUser ? (
          <PetAvatarImage petType={petType} isSpeaking={isSpeaking} />
        ) : (
          <Image
            src={portraitImg}
            alt={name || "Character"}
            w="100%"
            h="100%"
            objectFit="cover"
            imageRendering="pixelated"
            fallback={
              <Center
                w="100%"
                h="100%"
                bg="teal.700"
                color="white"
                fontWeight="bold"
                fontSize="sm"
              >
                {(name || "?")[0]?.toUpperCase()}
              </Center>
            }
          />
        )}
      </Box>
      {showIndicator && indicatorIcon && (
        <Center
          position="absolute"
          bottom="-2px"
          right="-2px"
          bg={isSpeaking ? accentColor : "var(--app-surface, #1e293b)"}
          color={isSpeaking ? "white" : "var(--app-text-secondary, #94a3b8)"}
          rounded="full"
          p={1}
          boxShadow="sm"
          border="2px solid"
          borderColor="var(--app-surface, #1e293b)"
          fontSize="xs"
        >
          {indicatorIcon}
        </Center>
      )}
      {isUser && (
        <Box
          position="absolute"
          top="-4px"
          left="50%"
          transform="translateX(-50%)"
          bg="teal.500"
          color="white"
          fontSize="9px"
          fontWeight="bold"
          px={1.5}
          py={0.2}
          rounded="full"
          letterSpacing="0.04em"
          boxShadow="xs"
          pointerEvents="none"
          whiteSpace="nowrap"
        >
          YOU
        </Box>
      )}
    </Box>
  );
}
