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
import { usePreviewSurface } from "@/hooks/PreviewSurfaceProvider";

export type { AppSurface } from "@/hooks/useAppSurfaceCore";
export { PreviewSurfaceProvider } from "@/hooks/PreviewSurfaceProvider";

export function useAppSurface(): AppSurface {
  const override = usePreviewSurface();
  const live = useSyncExternalStore(
    subscribeAppSurface,
    getClientAppSurfaceSnapshot,
    getServerAppSurfaceSnapshot,
  );
  return override ?? live;
}

/** True in standalone / installed mode, including a wide iPad window. */
export function useInstalledDisplay(): boolean {
  return useSyncExternalStore(
    subscribeInstalledDisplay,
    getClientInstalledDisplay,
    () => false,
  );
}
