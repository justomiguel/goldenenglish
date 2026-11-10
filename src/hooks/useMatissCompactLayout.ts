"use client";

import { useSyncExternalStore } from "react";

/** Same cut as the Matiss hamburger (`lg` = 1024). */
export const MATISS_COMPACT_MEDIA = "(max-width: 1023px)";

function subscribeReady(onStoreChange: () => void) {
  queueMicrotask(onStoreChange);
  return () => {};
}

function subscribeCompact(onChange: () => void) {
  const media = window.matchMedia(MATISS_COMPACT_MEDIA);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function compactSnapshot() {
  return window.matchMedia(MATISS_COMPACT_MEDIA).matches;
}

/** `null` until mount so the server paint and the first client paint match. */
export function useMatissCompactLayout(): boolean | null {
  const mounted = useSyncExternalStore(subscribeReady, () => true, () => false);
  const compact = useSyncExternalStore(subscribeCompact, compactSnapshot, () => false);
  if (!mounted) return null;
  return compact;
}
