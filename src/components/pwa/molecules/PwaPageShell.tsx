"use client";

import type { ReactNode } from "react";
import type { AppSurface } from "@/hooks/useAppSurface";

interface PwaPageShellProps {
  surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">;
  children: ReactNode;
}

export function PwaPageShell({ surface, children }: PwaPageShellProps) {
  void surface;
  return <div className="flex min-h-dvh flex-col">{children}</div>;
}
