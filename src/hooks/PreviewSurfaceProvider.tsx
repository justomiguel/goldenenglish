"use client";

import { createContext, use, type ReactNode } from "react";
import type { AppSurface } from "@/hooks/useAppSurfaceCore";

export const PreviewSurfaceContext = createContext<AppSurface | null>(null);

/** Draft preview only. A null surface keeps the live viewport. */
export function PreviewSurfaceProvider({
  surface,
  children,
}: {
  surface: AppSurface | null;
  children: ReactNode;
}) {
  return <PreviewSurfaceContext.Provider value={surface}>{children}</PreviewSurfaceContext.Provider>;
}

export function usePreviewSurface(): AppSurface | null {
  return use(PreviewSurfaceContext);
}
