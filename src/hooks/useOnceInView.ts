"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

function subscribeReducedMotion(onStoreChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

function reducedMotionSnapshot() {
  return (
    typeof IntersectionObserver === "undefined" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useOnceInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const reduced = useSyncExternalStore(subscribeReducedMotion, reducedMotionSnapshot, () => false);
  const [entered, setEntered] = useState(false);
  const seen = reduced || entered;

  useEffect(() => {
    if (seen) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setEntered(true);
      },
      { threshold: 0.45 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [seen]);

  return { ref, seen };
}
