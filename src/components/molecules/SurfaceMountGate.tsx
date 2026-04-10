"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { useAppSurface } from "@/hooks/useAppSurface";
import type { AppSurface } from "@/hooks/useAppSurface";

export type NarrowAppSurface = Extract<AppSurface, "web-mobile" | "pwa-mobile">;

interface SurfaceMountGateProps {
  skeleton: ReactNode;
  desktop: ReactNode;
  narrow: (surface: NarrowAppSurface) => ReactNode;
}

function subscribeReady(onStoreChange: () => void) {
  queueMicrotask(onStoreChange);
  return () => {};
}

function snapshotMounted() {
  return true;
}

function snapshotNotMounted() {
  return false;
}

/**
 * Waits until after SSR + first client snapshot, then branches on `useAppSurface`.
 */
export function SurfaceMountGate({
  skeleton,
  desktop,
  narrow,
}: SurfaceMountGateProps) {
  const mounted = useSyncExternalStore(
    subscribeReady,
    snapshotMounted,
    snapshotNotMounted,
  );
  const surface = useAppSurface();

  if (!mounted) {
    return skeleton;
  }

  if (surface === "web-desktop") {
    return desktop;
  }

  return narrow(surface);
}
