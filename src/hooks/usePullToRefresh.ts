"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PullToRefreshPhase = "idle" | "pulling" | "armed" | "refreshing";

export const PULL_TO_REFRESH_THRESHOLD_PX = 72;

/** Past the threshold the gesture drags at a fraction of finger travel, as native lists do. */
const OVERPULL_RESISTANCE = 0.35;
const MAX_PULL_PX = 120;
/** Horizontal swipes (carousels, back gestures) must not be captured. */
const DIRECTION_LOCK_PX = 8;

export interface UsePullToRefreshOptions {
  onRefresh: () => void | Promise<void>;
  /** Callers gate on surface/standalone; the hook itself stays passive when disabled. */
  enabled?: boolean;
  threshold?: number;
}

export interface UsePullToRefreshResult {
  /** Current drag distance in CSS px, already damped. */
  distance: number;
  phase: PullToRefreshPhase;
  /** Attach to the scrolling container that wraps the refreshable content. */
  ref: (node: HTMLElement | null) => void;
}

function atTopOfPage(): boolean {
  return (window.scrollY || document.documentElement.scrollTop || 0) <= 0;
}

function damp(delta: number, threshold: number): number {
  if (delta <= threshold) return delta;
  return Math.min(MAX_PULL_PX, threshold + (delta - threshold) * OVERPULL_RESISTANCE);
}

/**
 * Pull-to-refresh for the installed PWA, where the browser chrome (and its native gesture)
 * is gone and `overscroll-behavior-y: contain` blocks the platform fallback.
 */
export function usePullToRefresh({
  onRefresh,
  enabled = true,
  threshold = PULL_TO_REFRESH_THRESHOLD_PX,
}: UsePullToRefreshOptions): UsePullToRefreshResult {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [distance, setDistance] = useState(0);
  const [phase, setPhase] = useState<PullToRefreshPhase>("idle");

  const startYRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const trackingRef = useRef(false);
  /** Touch handlers run outside render and need the phase synchronously. */
  const phaseRef = useRef<PullToRefreshPhase>("idle");

  const applyPhase = useCallback((next: PullToRefreshPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const reset = useCallback(() => {
    startYRef.current = null;
    trackingRef.current = false;
    setDistance(0);
  }, []);

  useEffect(() => {
    if (!node || !enabled) return;

    const onTouchStart = (event: TouchEvent) => {
      if (phaseRef.current === "refreshing" || event.touches.length !== 1) return;
      if (!atTopOfPage()) return;
      startYRef.current = event.touches[0].clientY;
      startXRef.current = event.touches[0].clientX;
      trackingRef.current = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      const startY = startYRef.current;
      if (startY == null || phaseRef.current === "refreshing") return;

      const deltaY = event.touches[0].clientY - startY;
      const deltaX = Math.abs(event.touches[0].clientX - startXRef.current);

      if (!trackingRef.current) {
        if (deltaY < DIRECTION_LOCK_PX) return;
        // Vertical-dominant only, so horizontal swipes keep their native behaviour.
        if (deltaX > deltaY) {
          startYRef.current = null;
          return;
        }
        trackingRef.current = true;
      }

      if (deltaY <= 0 || !atTopOfPage()) {
        reset();
        applyPhase("idle");
        return;
      }

      const next = damp(deltaY, threshold);
      setDistance(next);
      applyPhase(next >= threshold ? "armed" : "pulling");
    };

    const onTouchEnd = () => {
      if (startYRef.current == null || phaseRef.current === "refreshing") {
        reset();
        return;
      }
      const shouldRefresh = phaseRef.current === "armed";
      reset();
      if (!shouldRefresh) {
        applyPhase("idle");
        return;
      }
      applyPhase("refreshing");
      void Promise.resolve(onRefresh()).finally(() => {
        applyPhase("idle");
      });
    };

    node.addEventListener("touchstart", onTouchStart, { passive: true });
    node.addEventListener("touchmove", onTouchMove, { passive: true });
    node.addEventListener("touchend", onTouchEnd);
    node.addEventListener("touchcancel", onTouchEnd);

    return () => {
      node.removeEventListener("touchstart", onTouchStart);
      node.removeEventListener("touchmove", onTouchMove);
      node.removeEventListener("touchend", onTouchEnd);
      node.removeEventListener("touchcancel", onTouchEnd);
      startYRef.current = null;
      trackingRef.current = false;
      phaseRef.current = "idle";
    };
  }, [node, enabled, onRefresh, reset, threshold, applyPhase]);

  // Reported as inert while disabled: no listeners are attached, so any residual state from
  // a previous surface must not leak into the UI.
  return {
    distance: enabled ? distance : 0,
    phase: enabled ? phase : "idle",
    ref: setNode,
  };
}
