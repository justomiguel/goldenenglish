"use client";

import type { ReactNode } from "react";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import type { AppSurface } from "@/hooks/useAppSurface";

function WardSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-10 max-w-md rounded bg-[var(--color-muted)]" />
      <div className="h-48 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]" />
    </div>
  );
}

export interface ParentWardProfileSurfaceEntryProps {
  children: ReactNode;
}

export function ParentWardProfileSurfaceEntry({ children }: ParentWardProfileSurfaceEntryProps) {
  return (
    <SurfaceMountGate
      skeleton={<WardSkeleton />}
      desktop={<div>{children}</div>}
      narrow={(surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">) => (
        <PwaPageShell surface={surface}>
          <div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
            <div className="mx-auto max-w-[var(--layout-max-width)] space-y-4 py-2">{children}</div>
          </div>
        </PwaPageShell>
      )}
    />
  );
}
