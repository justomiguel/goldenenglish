"use client";

import type { ReactNode } from "react";
import type { AppSurface } from "@/hooks/useAppSurface";

interface PwaPageShellProps {
  surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">;
  children: ReactNode;
}

export function PwaPageShell({ surface, children }: PwaPageShellProps) {
  const standalone = surface === "pwa-mobile";

  return (
    <div
      className="min-h-dvh"
      style={{
        paddingTop: standalone
          ? "max(0.25rem, env(safe-area-inset-top, 0px))"
          : "env(safe-area-inset-top, 0px)",
        paddingBottom: standalone
          ? "max(0.75rem, env(safe-area-inset-bottom, 0px))"
          : "max(0.5rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      {children}
    </div>
  );
}
