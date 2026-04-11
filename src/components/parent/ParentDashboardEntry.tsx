"use client";

import Link from "next/link";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import type { AppSurface } from "@/hooks/useAppSurface";

function ParentDashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-10 max-w-md rounded bg-[var(--color-muted)]" />
      <div className="h-32 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]" />
    </div>
  );
}

export interface ParentDashboardEntryProps {
  title: string;
  lead: string;
  navPay: string;
  payHref: string;
  kids: { id: string; first_name: string; last_name: string }[];
}

export function ParentDashboardEntry({
  title,
  lead,
  navPay,
  payHref,
  kids,
}: ParentDashboardEntryProps) {
  const body = (
    <>
      <h1 className="font-display text-3xl font-bold text-[var(--color-secondary)]">{title}</h1>
      <p className="mt-2 text-[var(--color-muted-foreground)]">{lead}</p>
      <ul className="mt-8 space-y-3">
        {kids.map((k) => (
          <li key={k.id}>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3">
              <span className="font-medium text-[var(--color-foreground)]">
                {k.first_name} {k.last_name}
              </span>
              <Link
                href={payHref}
                className="text-sm font-semibold text-[var(--color-primary)] underline"
              >
                {navPay}
              </Link>
            </div>
          </li>
        ))}
      </ul>
      {kids.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--color-muted-foreground)]">{lead}</p>
      ) : null}
    </>
  );

  return (
    <SurfaceMountGate
      skeleton={<ParentDashboardSkeleton />}
      desktop={<div>{body}</div>}
      narrow={(surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">) => (
        <PwaPageShell surface={surface}>
          <div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
            <div className="mx-auto max-w-[var(--layout-max-width)] space-y-4 py-2">{body}</div>
          </div>
        </PwaPageShell>
      )}
    />
  );
}
