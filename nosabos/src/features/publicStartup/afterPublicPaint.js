// Optional public-page work starts after the real page has replaced its loader.
export function afterPublicPaint(callback, browser = window) {
  let frame;
  let cancelled = false;
  const check = () => {
    if (cancelled) return;
    if (browser.document.querySelector(".startup-loading")) {
      frame = browser.requestAnimationFrame(check);
      return;
    }
    frame = browser.requestAnimationFrame(() => { if (!cancelled) callback(); });
  };
  frame = browser.requestAnimationFrame(check);
  return () => { cancelled = true; browser.cancelAnimationFrame(frame); };
}
