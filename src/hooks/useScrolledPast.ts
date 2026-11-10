"use client";

import { useEffect, useRef, useState } from "react";

export interface UseScrolledPastResult {
  /** Attach to a zero-height sentinel at the top of the page. */
  sentinelRef: React.RefObject<HTMLSpanElement | null>;
  scrolledPast: boolean;
}

/** True once the sentinel leaves the viewport. Uses `IntersectionObserver`, not a scroll listener. */
export function useScrolledPast(): UseScrolledPastResult {
  const sentinelRef = useRef<HTMLSpanElement | null>(null);
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setScrolledPast(entry ? !entry.isIntersecting : false));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { sentinelRef, scrolledPast };
}
