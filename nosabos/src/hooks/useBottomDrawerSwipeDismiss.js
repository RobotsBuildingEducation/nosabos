import { useCallback, useEffect, useRef, useState } from "react";

const DRAG_ACTIVATION_DISTANCE = 6;
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 0.6;
const SNAP_BACK_TRANSITION =
  "transform 180ms cubic-bezier(0.22, 1, 0.36, 1)";
const DISMISS_TRANSITION =
  "transform 150ms cubic-bezier(0.22, 1, 0.36, 1)";
const INTERACTIVE_TARGET_SELECTOR = [
  "button",
  "input",
  "textarea",
  "select",
  "option",
  "label",
  "a[href]",
  "[role='button']",
  "[role='link']",
  "[role='menuitem']",
  "[role='option']",
  "[role='slider']",
  "[role='switch']",
  "[contenteditable='true']",
  "[data-drawer-swipe-ignore='true']",
].join(", ");

function isInteractiveTarget(target) {
  return (
    target instanceof Element &&
    target.closest(INTERACTIVE_TARGET_SELECTOR) !== null
  );
}

function getNearestScrollableAncestor(target, boundary) {
  if (!(target instanceof Element)) return null;

  let current = target;
  while (current && current !== boundary) {
    const style = window.getComputedStyle(current);
    const canScrollY = /auto|scroll|overlay/i.test(style.overflowY);
    if (canScrollY && current.scrollHeight > current.clientHeight + 1) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

export default function useBottomDrawerSwipeDismiss({
  isOpen,
  onClose,
  isEnabled = true,
}) {
  const contentRef = useRef(null);
  const containerRef = useRef(null);
  const overlayRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const animationFrameRef = useRef(null);
  const gestureRef = useRef(null);
  const activePointerIdRef = useRef(null);
  const offsetYRef = useRef(0);
  const transitionRef = useRef("none");
  const sheetHeightRef = useRef(0);
  const isDraggingRef = useRef(false);

  const [isDragging, setIsDragging] = useState(false);

  const setDragging = useCallback((nextValue) => {
    isDraggingRef.current = nextValue;
    setIsDragging((prev) => (prev === nextValue ? prev : nextValue));
  }, []);

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const resetGesture = useCallback(() => {
    gestureRef.current = null;
    activePointerIdRef.current = null;
    setDragging(false);
  }, [setDragging]);

  const getSheetHeight = useCallback(() => {
    if (sheetHeightRef.current > 0) return sheetHeightRef.current;
    if (typeof window === "undefined") return 0;
    const rect = contentRef.current?.getBoundingClientRect?.();
    const height = rect?.height || Math.round(window.innerHeight * 0.75);
    sheetHeightRef.current = height;
    return height;
  }, []);

  const syncPresentation = useCallback(() => {
    const offsetY = offsetYRef.current;
    const transition = transitionRef.current;
    const containerNode = containerRef.current;

    if (containerNode) {
      containerNode.style.transform = `translate3d(0, ${offsetY}px, 0)`;
      containerNode.style.transition = transition;
      containerNode.style.willChange =
        isDraggingRef.current || offsetY > 0 ? "transform" : "";
      containerNode.style.backfaceVisibility = "hidden";
    }

    const overlayNode = overlayRef.current;
    if (overlayNode) {
      const height = getSheetHeight();
      const progress = height ? Math.min(offsetY / height, 1) : 0;
      const overlayTransition =
        transition === "none"
          ? isDraggingRef.current || offsetY > 0
            ? "none"
            : "opacity 0.18s ease"
          : transition.replace("transform", "opacity");
      overlayNode.style.opacity = String(1 - progress * 0.55);
      overlayNode.style.transition = overlayTransition;
      overlayNode.style.willChange =
        isDraggingRef.current || offsetY > 0 ? "opacity" : "";
    }
  }, [getSheetHeight]);

  const schedulePresentationSync = useCallback(() => {
    if (typeof window === "undefined") return;
    if (animationFrameRef.current !== null) return;

    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null;
      syncPresentation();
    });
  }, [syncPresentation]);

  const setDrawerOffset = useCallback((nextOffset) => {
    offsetYRef.current = nextOffset;
    schedulePresentationSync();
  }, [schedulePresentationSync]);

  const setDrawerTransition = useCallback((nextTransition) => {
    transitionRef.current = nextTransition;
    schedulePresentationSync();
  }, [schedulePresentationSync]);

  const measureSheetHeight = useCallback(() => {
    if (typeof window === "undefined") {
      sheetHeightRef.current = 0;
      return 0;
    }

    const rect = contentRef.current?.getBoundingClientRect?.();
    const height = rect?.height || Math.round(window.innerHeight * 0.75);
    sheetHeightRef.current = height;
    return height;
  }, []);

  const animateBack = useCallback(() => {
    setDrawerTransition(SNAP_BACK_TRANSITION);
    setDrawerOffset(0);
    resetGesture();
  }, [resetGesture, setDrawerOffset, setDrawerTransition]);

  const dismissDrawer = useCallback(() => {
    if (typeof onClose !== "function") {
      animateBack();
      return;
    }

    clearCloseTimeout();
    setDrawerTransition(DISMISS_TRANSITION);
    setDrawerOffset(getSheetHeight() + 40);
    resetGesture();

    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null;
      onClose();
    }, 110);
  }, [
    animateBack,
    clearCloseTimeout,
    getSheetHeight,
    onClose,
    resetGesture,
    setDrawerOffset,
    setDrawerTransition,
  ]);

  const handlePointerDown = useCallback(
    (event) => {
      if (!isEnabled || !isOpen) return;
      if (typeof onClose !== "function") return;
      if (event.isPrimary === false) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (isInteractiveTarget(event.target)) return;

      clearCloseTimeout();
      activePointerIdRef.current = event.pointerId;
      const contentNode = contentRef.current;
      gestureRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        currentY: event.clientY,
        currentTime: performance.now(),
        velocityY: 0,
        hasActivated: false,
        scrollElement: contentNode
          ? getNearestScrollableAncestor(event.target, contentNode)
          : null,
      };

      setDrawerTransition("none");
      setDragging(false);
    },
    [clearCloseTimeout, isEnabled, isOpen, onClose, setDrawerTransition, setDragging],
  );

  useEffect(() => {
    if (!isOpen || !isEnabled) return undefined;

    const handlePointerMove = (event) => {
      if (event.pointerId !== activePointerIdRef.current) return;

      const gesture = gestureRef.current;
      if (!gesture) return;

      const deltaX = event.clientX - gesture.startX;
      const deltaY = event.clientY - gesture.startY;
      const now = performance.now();

      if (!gesture.hasActivated) {
        const scrollTop = gesture.scrollElement?.scrollTop || 0;
        const passedActivation =
          deltaY > DRAG_ACTIVATION_DISTANCE &&
          deltaY > 0 &&
          scrollTop <= 0 &&
          Math.abs(deltaY) > Math.abs(deltaX);

        if (!passedActivation) {
          return;
        }

        gesture.hasActivated = true;
        setDragging(true);
      }

      event.preventDefault();

      const elapsed = Math.max(now - gesture.currentTime, 1);
      gesture.velocityY = (event.clientY - gesture.currentY) / elapsed;
      gesture.currentY = event.clientY;
      gesture.currentTime = now;

      setDrawerOffset(Math.max(0, deltaY));
    };

    const finishGesture = () => {
      const gesture = gestureRef.current;
      if (!gesture) return;
      if (!gesture.hasActivated) {
        resetGesture();
        return;
      }

      const shouldClose =
        offsetYRef.current > DISMISS_DISTANCE ||
        gesture.velocityY > DISMISS_VELOCITY;

      if (shouldClose) {
        dismissDrawer();
        return;
      }

      animateBack();
    };

    const handlePointerUp = (event) => {
      if (event.pointerId !== activePointerIdRef.current) return;
      finishGesture();
    };

    const handlePointerCancel = (event) => {
      if (event.pointerId !== activePointerIdRef.current) return;
      animateBack();
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [
    animateBack,
    dismissDrawer,
    isEnabled,
    isOpen,
    resetGesture,
    setDrawerOffset,
  ]);

  useEffect(() => {
    if (!isOpen) {
      clearCloseTimeout();
      resetGesture();
      setDrawerTransition("none");
      setDrawerOffset(0);
      return undefined;
    }

    setDrawerTransition("none");
    setDrawerOffset(0);
    setDragging(false);

    return undefined;
  }, [
    clearCloseTimeout,
    isOpen,
    resetGesture,
    setDrawerOffset,
    setDrawerTransition,
    setDragging,
  ]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleResize = () => {
      measureSheetHeight();
      schedulePresentationSync();
    };

    handleResize();

    let observer;
    if (typeof ResizeObserver !== "undefined" && contentRef.current) {
      observer = new ResizeObserver(handleResize);
      observer.observe(contentRef.current);
    }

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, measureSheetHeight, schedulePresentationSync]);

  useEffect(
    () => () => {
      if (typeof window !== "undefined") {
        clearCloseTimeout();
        if (animationFrameRef.current !== null) {
          window.cancelAnimationFrame(animationFrameRef.current);
        }
      }
    },
    [clearCloseTimeout],
  );

  return {
    contentRef,
    drawerContentProps: {
      ref: contentRef,
      onPointerDown: handlePointerDown,
      containerProps: {
        ref: containerRef,
        style: {
          transform: "translate3d(0, 0, 0)",
          transition: "none",
          backfaceVisibility: "hidden",
        },
      },
    },
    overlayProps: {
      ref: overlayRef,
      style: {
        opacity: 1,
        transition: "opacity 0.18s ease",
      },
    },
    isDragging,
  };
}
