"use client";

import { useSyncExternalStore } from "react";
import {
  type AppSurface,
  getClientAppSurfaceSnapshot,
  getServerAppSurfaceSnapshot,
  subscribeAppSurface,
} from "@/hooks/useAppSurfaceCore";

export type { AppSurface } from "@/hooks/useAppSurfaceCore";

export function useAppSurface(): AppSurface {
  return useSyncExternalStore(
    subscribeAppSurface,
    getClientAppSurfaceSnapshot,
    getServerAppSurfaceSnapshot,
  );
}
