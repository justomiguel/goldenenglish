"use client";

import type { ReactNode } from "react";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import type { AppSurface } from "@/hooks/useAppSurface";

function LearningTasksSkeleton() {
  return (
    <div className="animate-pulse space-y-3" aria-hidden>
      <div className="h-8 w-1/2 rounded bg-[var(--color-muted)]" />
      <div className="h-40 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]" />
    </div>
  );
}

/**
 * Tier A: student task list/detail share the same desktop vs mobile/PWA shell as the home dashboard.
 */
export function StudentLearningTasksEntry({ children }: { children: ReactNode }) {
  return (
    <SurfaceMountGate
      skeleton={<LearningTasksSkeleton />}
      desktop={<div>{children}</div>}
      narrow={(surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">) => (
        <PwaPageShell surface={surface}>
          <div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
            <div className="mx-auto max-w-[var(--layout-max-width)] py-2">{children}</div>
          </div>
        </PwaPageShell>
      )}
    />
  );
}
