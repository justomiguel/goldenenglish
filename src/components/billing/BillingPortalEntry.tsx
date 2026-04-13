"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import {
  BillingPortalScreen,
  type BillingPortalScreenProps,
} from "@/components/billing/BillingPortalScreen";
import type { AppSurface } from "@/hooks/useAppSurface";

function BillingSkeleton() {
  return <div className="animate-pulse h-32 rounded bg-[var(--color-muted)]" aria-hidden />;
}

export interface BillingPortalEntryProps extends BillingPortalScreenProps {
  title: string;
  lead: string;
}

export function BillingPortalEntry({ title, lead, ...screen }: BillingPortalEntryProps) {
  const body = (
    <>
      <h1 className="text-2xl font-bold text-[var(--color-secondary)]">{title}</h1>
      <p className="mt-2 max-w-2xl text-[var(--color-muted-foreground)]">{lead}</p>
      <div className="mt-8">
        <BillingPortalScreen {...screen} />
      </div>
    </>
  );

  return (
    <SurfaceMountGate
      skeleton={<BillingSkeleton />}
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
