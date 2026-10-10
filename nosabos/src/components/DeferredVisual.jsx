import { useEffect, useRef, useState } from "react";

/** Reserve decorative space without loading its code or running offscreen animation. */
export default function DeferredVisual({ children, width = 48, height = 48 }) {
  const host = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "160px" });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  return <span ref={host} style={{ display: "inline-block", width, height }}>{visible ? children : null}</span>;
}
