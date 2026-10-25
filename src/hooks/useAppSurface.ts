"use client";

import { useSyncExternalStore } from "react";
import {
  type AppSurface,
  getClientAppSurfaceSnapshot,
  getClientInstalledDisplay,
  getServerAppSurfaceSnapshot,
  subscribeAppSurface,
  subscribeInstalledDisplay,
} from "@/hooks/useAppSurfaceCore";

export type { AppSurface } from "@/hooks/useAppSurfaceCore";

export function useAppSurface(): AppSurface {
  return useSyncExternalStore(
    subscribeAppSurface,
    getClientAppSurfaceSnapshot,
    getServerAppSurfaceSnapshot,
  );
}

/** True in standalone / installed mode, including a wide iPad window. */
export function useInstalledDisplay(): boolean {
  return useSyncExternalStore(
    subscribeInstalledDisplay,
    getClientInstalledDisplay,
    () => false,
  );
}
