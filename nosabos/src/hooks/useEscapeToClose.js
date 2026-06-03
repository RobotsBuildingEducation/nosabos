import { useEffect } from "react";

/**
 * Close a modal on the Escape key via a document-level listener.
 *
 * Some modals set `trapFocus={false}` / `autoFocus={false}` (so they don't
 * focus an input and pop the mobile keyboard on open). With focus never inside
 * the dialog, Chakra's built-in `closeOnEsc` never fires — its key handler lives
 * on the dialog container and only sees the keydown if focus is in the subtree.
 * This hook listens on `document` instead, so Escape works regardless of focus.
 *
 * @param {boolean} isOpen   Whether the modal is currently open.
 * @param {() => void} onClose  Close handler.
 * @param {boolean} [enabled=true]  Gate (e.g. only when a modal is dismissible).
 */
export default function useEscapeToClose(isOpen, onClose, enabled = true) {
  useEffect(() => {
    if (!isOpen || !enabled || typeof onClose !== "function") return undefined;
    if (typeof document === "undefined") return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, enabled, onClose]);
}
