"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, type FocusEvent } from "react";

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
const STEP_MS = 4000;

function subscribeReduce(onStoreChange: () => void) {
  const media = window.matchMedia(REDUCE_QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function reduceSnapshot() {
  return window.matchMedia(REDUCE_QUERY).matches;
}

export function useLioraGalleryStrip(total: number, frozen: boolean) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState(false);
  const reduced = useSyncExternalStore(subscribeReduce, reduceSnapshot, () => false);
  const held = hovering || focused || paused || reduced || frozen;
  const size = Math.max(total, 1);

  const step = useCallback(
    (delta: number) => {
      setIndex((current) => (current + delta + size) % size);
    },
    [size],
  );

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % size) + size) % size);
    },
    [size],
  );

  useEffect(() => {
    if (held || total < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % size);
    }, STEP_MS);
    return () => window.clearInterval(timer);
  }, [held, size, total]);

  const onBlur = (event: FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;
    setFocused(false);
  };

  return {
    index,
    paused,
    setPaused,
    step,
    goTo,
    onMouseEnter: () => setHovering(true),
    onMouseLeave: () => setHovering(false),
    onFocus: () => setFocused(true),
    onBlur,
  };
}
