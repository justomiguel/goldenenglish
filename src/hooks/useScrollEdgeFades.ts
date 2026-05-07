"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

const EDGE_EPS = 6;

export interface UseScrollEdgeFadesResult {
  scrollRef: RefObject<HTMLDivElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  showTopFade: boolean;
  showBottomFade: boolean;
  onScroll: () => void;
}

/**
 * Drives visual scroll affordances (top/bottom fades) when a scroll container
 * overflows. Recomputes on scroll, resize, and content size changes.
 */
export function useScrollEdgeFades(active: boolean): UseScrollEdgeFadesResult {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [rawTopFade, setRawTopFade] = useState(false);
  const [rawBottomFade, setRawBottomFade] = useState(false);

  const recompute = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      setRawTopFade(false);
      setRawBottomFade(false);
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight + EDGE_EPS) {
      setRawTopFade(false);
      setRawBottomFade(false);
      return;
    }
    setRawTopFade(scrollTop > EDGE_EPS);
    setRawBottomFade(scrollTop + clientHeight < scrollHeight - EDGE_EPS);
  }, []);

  const showTopFade = active && rawTopFade;
  const showBottomFade = active && rawBottomFade;

  useLayoutEffect(() => {
    if (!active) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      recompute();
      raf2 = requestAnimationFrame(() => recompute());
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [active, recompute]);

  /** Dialog/flex layout often settles after first paint; retry so fades appear. */
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const run = () => {
      if (!cancelled) recompute();
    };
    const outerRaf = requestAnimationFrame(() => {
      requestAnimationFrame(run);
    });
    const t0 = window.setTimeout(run, 0);
    const t150 = window.setTimeout(run, 150);
    return () => {
      cancelled = true;
      cancelAnimationFrame(outerRaf);
      window.clearTimeout(t0);
      window.clearTimeout(t150);
    };
  }, [active, recompute]);

  useEffect(() => {
    if (!active) return;
    const scrollEl = scrollRef.current;
    const contentEl = contentRef.current;
    if (!scrollEl) return;

    const ro = new ResizeObserver(() => recompute());
    ro.observe(scrollEl);
    if (contentEl) ro.observe(contentEl);

    window.addEventListener("resize", recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [active, recompute]);

  return {
    scrollRef,
    contentRef,
    showTopFade,
    showBottomFade,
    onScroll: recompute,
  };
}
