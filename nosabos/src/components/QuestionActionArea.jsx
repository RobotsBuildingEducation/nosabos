import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Box, VStack } from "@chakra-ui/react";
import useQuestionActionStore from "../hooks/useQuestionActionStore";
import { APP_ACTION_BAR_RADIUS, APP_SQUIRCLE_SHAPE } from "../theme";
import GlassContainer from "./GlassContainer";
import { useThemeStore } from "../useThemeStore";
import {
  AnimatePresence,
  animate,
  motion,
  motionValue,
  useAnimationControls,
  useIsPresent,
  useReducedMotion,
} from "framer-motion";

const MotionBox = motion.create(Box);

// Activity owners are replaced by question generation, module changes, and the
// loading fallback. The visible surface must keep its current height across
// those component lifetimes; only the owner may animate this shared value.
const surfaceHeight = motionValue(66);

function ActionAreaContent({ children, actions, feedback, reduceMotion }) {
  const isPresent = useIsPresent();
  return (
    <MotionBox
      data-action-content-state={isPresent ? "present" : "exiting"}
      inert={!isPresent ? true : undefined}
      aria-hidden={!isPresent || undefined}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      position={isPresent ? "relative" : "absolute"}
      bottom={isPresent ? undefined : "16px"}
      insetInline={isPresent ? undefined : { base: 3, md: 6 }}
      pointerEvents={isPresent ? undefined : "none"}
      style={isPresent ? undefined : { clipPath: "inset(0 0 52px 0)" }}
      sx={isPresent ? undefined : {
        // The live action row replaces these controls immediately. Keep their
        // layout space so the outgoing feedback does not jump vertically.
        "[data-activity-action-row]": { visibility: "hidden" },
      }}
      exit={{
        opacity: [1, 1, 0],
        y: feedback != null && !reduceMotion ? 24 : 0,
        clipPath: "inset(0 0 76px 0)",
        transition: {
          duration: reduceMotion || feedback == null ? 0 : 0.36,
          times: [0, 0.65, 1],
          ease: [0.32, 0, 0.2, 1],
        },
      }}
    >
      <VStack spacing={3} align="stretch" minH="40px">
        {children}
        {actions && <Box data-question-actions="">{actions}</Box>}
      </VStack>
    </MotionBox>
  );
}

/** Keeps question actions in the viewport, styled identically to the bottom action bar. */
export default function QuestionActionArea({
  actions,
  children,
  fallback = false,
  suppress = false,
  feedback = null,
}) {
  const anchorRef = useRef(null);
  const panelRef = useRef(null);
  const menuSlotRef = useRef(null);
  const contentRef = useRef(null);
  const revealRef = useRef(null);
  const [layout, setLayout] = useState(null);
  const idRef = useRef(Symbol("activity-actions"));
  const isOwner = useQuestionActionStore(
    (state) => state.ownerId === idRef.current,
  );
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const reduceMotion = useReducedMotion();
  const responseMotion = useAnimationControls();
  const feedbackState =
    feedback === true ? "correct" : feedback === false ? "incorrect" : "idle";

  useEffect(() => {
    responseMotion.stop();
    if (!isOwner || suppress || reduceMotion || feedback == null) {
      responseMotion.set({ x: 0, scale: 1 });
      return;
    }
    // A small lift for success; a gentle nudge for a retry. Keep the measured
    // fixed panel still so response motion cannot disturb scroll reservation.
    responseMotion.start({
      scale: feedback === true ? [1, 1.018, 0.997, 1] : [1, 0.992, 1],
      x: feedback === false ? [0, -3, 3, -1, 0] : 0,
      transition: {
        duration: feedback === true ? 0.48 : 0.36,
        ease: "easeInOut",
      },
    });
    return () => responseMotion.stop();
  }, [feedback, isOwner, suppress, reduceMotion, responseMotion]);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return;
    let navigation;
    const viewport = window.visualViewport;
    const id = idRef.current;
    const setActive = useQuestionActionStore.getState().setActive;
    let frame;
    let previousOccupiedHeight = null;

    const measure = () => {
      const bounds = anchor.getBoundingClientRect();
      // A hidden, kept-alive lesson must not leave a portaled footer visible.
      const visible =
        anchor.getClientRects().length > 0 &&
        bounds.width > 0 &&
        getComputedStyle(anchor).visibility !== "hidden";
      setActive(
        id,
        visible,
        suppress ? null : menuSlotRef.current,
        suppress ? 2 : fallback ? 0 : 1,
      );
      const currentNavigation = document.querySelector(
        "[data-bottom-navigation]",
      );
      if (currentNavigation !== navigation) {
        if (navigation) observer.unobserve(navigation);
        navigation = currentNavigation;
        if (navigation) observer.observe(navigation);
      }
      const viewportBottom = viewport
        ? viewport.offsetTop + viewport.height
        : window.innerHeight;
      const keyboardInset = Math.max(0, window.innerHeight - viewportBottom);
      const navBounds = navigation?.getBoundingClientRect();
      const navInset =
        navBounds?.height && !panel.contains(navigation)
          ? Math.max(0, window.innerHeight - navBounds.top) + 8
          : 0;
      const bottom = Math.max(keyboardInset, navInset);
      const panelBounds = panel.getBoundingClientRect();
      const height = panelBounds.height;
      const contentHeight = (contentRef.current?.offsetHeight || 64) + 2;
      const occupiedHeight = Math.max(0, window.innerHeight - panelBounds.top);
      // Reserve the destination height before the spring grows into it.
      const targetOccupied = Math.max(
        occupiedHeight,
        contentHeight + window.innerHeight - panelBounds.bottom,
      );
      const effectivePanelTop = Math.min(
        panelBounds.top,
        window.innerHeight - targetOccupied,
      );
      const contentDocBottom = bounds.top + window.scrollY;
      const clearance = 24;
      const fitsAbovePanel = contentDocBottom + clearance <= effectivePanelTop;
      const next = {
        visible,
        bottom,
        height,
        contentHeight,
        // Include the occupied area below the panel only when content exceeds
        // the available screen space above the panel. If all content comfortably
        // fits on screen, reserve 0px to prevent unnecessary mobile scrolling.
        reserve: fitsAbovePanel ? 0 : targetOccupied + 12,
        lang: anchor.closest("[lang]")?.lang,
        dir: getComputedStyle(anchor).direction,
      };
      setLayout((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      );
      const currentOccupied = targetOccupied;
      // Preserve an answer that was visible before feedback/menu expansion.
      // Long questions keep their current reading position until the learner
      // reaches the answer; simply mounting a footer must not scroll them down.
      if (
        visible &&
        useQuestionActionStore.getState().ownerId === id &&
        previousOccupiedHeight !== null &&
        currentOccupied > previousOccupiedHeight
      ) {
        const focused = document.activeElement;
        const editing =
          focused?.matches("input, textarea, [contenteditable='true']") &&
          !panel.contains(focused);
        const answerBottom = editing
          ? focused.getBoundingClientRect().bottom
          : bounds.top - 12;
        const previousTop = window.innerHeight - previousOccupiedHeight;
        const panelTop = window.innerHeight - currentOccupied;
        if (
          (editing || answerBottom <= previousTop) &&
          answerBottom > panelTop - 12
        ) {
          revealRef.current = editing ? focused : anchor;
        }
      }
      previousOccupiedHeight = currentOccupied;
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(anchor);
    observer.observe(panel);
    observer.observe(contentRef.current);
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { childList: true, subtree: true });
    // Tab panels can hide without mounting/unmounting their activity.
    const visibilityChanges = new MutationObserver(schedule);
    for (
      let parent = anchor.parentElement;
      parent;
      parent = parent.parentElement
    ) {
      visibilityChanges.observe(parent, {
        attributes: true,
        attributeFilter: ["style", "class", "hidden"],
      });
    }
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    viewport?.addEventListener("resize", schedule);
    viewport?.addEventListener("scroll", schedule);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      mutations.disconnect();
      visibilityChanges.disconnect();
      setActive(id, false);
      // Allow the next activity/fallback to register in the same commit before
      // resetting a surface that has genuinely left the activity experience.
      requestAnimationFrame(() => {
        if (!useQuestionActionStore.getState().ownerId) {
          surfaceHeight.stop();
          surfaceHeight.set(66);
        }
      });
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
    };
  }, [fallback, suppress]);

  // Scroll after the measured spacer has committed; earlier scrolling would
  // be clamped to the old document height when feedback first expands.
  useLayoutEffect(() => {
    const target = revealRef.current;
    revealRef.current = null;
    if (!target?.isConnected) return;
    const bounds = target.getBoundingClientRect();
    const answerBottom =
      target === anchorRef.current ? bounds.top - 12 : bounds.bottom;
    const delta =
      answerBottom - (window.innerHeight - layout.reserve + 12) + 12;
    if (delta > 0) window.scrollBy({ top: delta, behavior: "auto" });
  }, [layout]);

  // Mount the measured panel and menu slot before registration. Gating these
  // on ownership creates a cycle: an unregistered activity can never own them.
  const shown = Boolean(layout?.visible && isOwner && !suppress);
  const targetHeight = layout?.contentHeight || 66;
  useLayoutEffect(() => {
    if (!isOwner || !layout?.visible) return;
    surfaceHeight.stop();
    if (suppress || reduceMotion) {
      surfaceHeight.set(suppress ? 66 : targetHeight);
      return;
    }
    animate(surfaceHeight, targetHeight,
      targetHeight < surfaceHeight.get()
        ? { duration: 0.4, ease: [0.32, 0, 0.2, 1] }
        : { type: "spring", stiffness: 430, damping: 36, mass: 0.8 },
    );
    // Do not stop on unmount: the next owner inherits the current height and
    // retargets it, even if generation briefly shows the loading fallback.
  }, [isOwner, layout?.visible, targetHeight, suppress, reduceMotion]);

  return (
    <>
      <Box
        ref={anchorRef}
        data-question-action-spacer=""
        aria-hidden="true"
        w="full"
        h={shown ? `${layout?.reserve ?? 0}px` : "0px"}
        flexShrink={0}
        pointerEvents="none"
      />
      {createPortal(
        <Box
          ref={panelRef}
          data-question-action-area=""
          data-question-feedback={feedbackState}
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          zIndex={80}
          width="100%"
          maxW="480px"
          margin="0 auto"
          mb={
            layout?.bottom
              ? `${layout.bottom}px`
              : "max(12px, env(safe-area-inset-bottom))"
          }
          paddingLeft={2}
          paddingRight={2}
          visibility={shown ? "visible" : "hidden"}
          pointerEvents={shown ? "auto" : "none"}
          aria-hidden={!shown}
          lang={layout?.lang}
          dir={layout?.dir}
        >
          <MotionBox
            animate={responseMotion}
            initial={false}
            borderRadius={APP_ACTION_BAR_RADIUS}
            overflow="visible"
            style={{
              cornerShape: APP_SQUIRCLE_SHAPE,
              transformOrigin: "50% 100%",
            }}
            w="100%"
          >
            <MotionBox
              initial={false}
              style={{ height: isOwner ? surfaceHeight : 66 }}
              position="relative"
              sx={{
                "& > .bottombar-glass": {
                  position: "relative",
                  height: "100%",
                  width: "100%",
                },
              }}
            >
              <GlassContainer
                borderRadius={APP_ACTION_BAR_RADIUS}
                blur={0.5}
                contrast={1.1}
                brightness={1.05}
                saturation={1.1}
                zIndex={80}
                displacementScale={0.2}
                className="bottombar-glass"
                elasticity={0.9}
                shadowIntensity={isLightTheme ? 0.12 : 0.25}
                allowLightModeGlass
                fallbackBlur={isLightTheme ? "10px" : "2px"}
                fallbackBg={
                  isLightTheme
                    ? "rgba(255, 252, 247, 0.58)"
                    : "var(--app-glass-bg-soft)"
                }
              >
                <Box
                  position="absolute"
                  inset={0}
                  overflow="hidden"
                  borderRadius={APP_ACTION_BAR_RADIUS}
                  style={{ cornerShape: APP_SQUIRCLE_SHAPE }}
                >
                  <Box
                    ref={contentRef}
                    position="absolute"
                    bottom={0}
                    left={0}
                    width="100%"
                    px={{ base: 3, md: 6 }}
                    pt={2}
                    pb={4}
                    borderRadius={APP_ACTION_BAR_RADIUS}
                    style={{ cornerShape: APP_SQUIRCLE_SHAPE }}
                    color="var(--app-text-primary)"
                  >
                    {/* The outgoing feedback leaves the measurement flow so
                        the surface contracts while the new controls stay visible. */}
                    <AnimatePresence initial={false} mode="sync">
                      <ActionAreaContent
                        key={feedback == null ? "question" : "feedback"}
                        feedback={feedback}
                        reduceMotion={reduceMotion || !shown}
                        actions={actions}
                      >
                        {children}
                      </ActionAreaContent>
                    </AnimatePresence>
                  </Box>
                </Box>
                <Box
                  ref={menuSlotRef}
                  data-question-menu-slot=""
                  position="absolute"
                  insetInlineStart={{ base: 3, md: 6 }}
                  bottom="14px"
                  w="44px"
                  h="44px"
                />
              </GlassContainer>
            </MotionBox>
          </MotionBox>
        </Box>,
        document.body,
      )}
    </>
  );
}
