"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import type { AppSurface } from "@/hooks/useAppSurface";

function FlowReturnSkeleton() {
  return (
    <div className="animate-pulse space-y-3 px-3 py-8" aria-hidden>
      <div className="mx-auto h-10 max-w-md rounded bg-[var(--color-muted)]" />
      <div className="mx-auto h-6 max-w-2xl rounded bg-[var(--color-muted)]" />
    </div>
  );
}

export interface PaymentsFlowReturnSurfaceEntryProps {
  backHref: string;
  backLabel: string;
  title: string;
  lead: string;
  /** Visual emphasis for the status message. */
  variant?: "default" | "success" | "warning" | "error";
}

function variantPanelClass(variant: PaymentsFlowReturnSurfaceEntryProps["variant"]): string {
  switch (variant) {
    case "success":
      return "border-[var(--color-success)]/50 bg-[var(--color-success)]/10";
    case "warning":
      return "border-[var(--color-warning)]/50 bg-[var(--color-warning)]/10";
    case "error":
      return "border-[var(--color-error)]/50 bg-[var(--color-error)]/10";
    default:
      return "border-[var(--color-border)] bg-[var(--color-surface)]";
  }
}

export function PaymentsFlowReturnSurfaceEntry({
  backHref,
  backLabel,
  title,
  lead,
  variant = "default",
}: PaymentsFlowReturnSurfaceEntryProps) {
  const panel = variantPanelClass(variant);

  const desktopBody = (
    <div className="mx-auto max-w-[var(--layout-max-width)] px-3 py-8">
      <div
        className={`rounded-[var(--layout-border-radius)] border p-5 shadow-[var(--shadow-card)] ${panel}`}
        role="status"
        aria-live="polite"
      >
        <h1 className="font-display text-2xl font-bold text-[var(--color-secondary)]">{title}</h1>
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{lead}</p>
      </div>
      <Link
        href={backHref}
        className="mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border-2 border-[var(--color-primary)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-muted)]"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        {backLabel}
      </Link>
    </div>
  );

  const narrowMobileBody = (
    <div className="mx-auto max-w-[var(--layout-max-width)] space-y-4 px-3 py-8">
      <div
        className={`rounded-[var(--layout-border-radius)] border p-5 shadow-[var(--shadow-card)] ${panel}`}
        role="status"
        aria-live="polite"
      >
        <h1 className="font-display text-2xl font-bold text-[var(--color-secondary)]">{title}</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">{lead}</p>
      </div>
      <Link
        href={backHref}
        className="inline-flex min-h-[44px] w-full max-w-xs items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border-2 border-[var(--color-primary)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-muted)]"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        {backLabel}
      </Link>
    </div>
  );

  return (
    <SurfaceMountGate
      skeleton={<FlowReturnSkeleton />}
      desktop={desktopBody}
      narrow={(surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">) => (
        <PwaPageShell surface={surface}>
          <div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
            {narrowMobileBody}
          </div>
        </PwaPageShell>
      )}
    />
  );
}
