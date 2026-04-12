"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { AdminPromotionsClient } from "@/components/dashboard/AdminPromotionsClient";
import type { AdminPromotionRow } from "@/components/dashboard/AdminPromotionsTable";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import type { AppSurface } from "@/hooks/useAppSurface";
import type { Dictionary } from "@/types/i18n";

interface AdminPromotionsEntryProps {
  locale: string;
  initialRows: AdminPromotionRow[];
  labels: Dictionary["admin"]["promotions"];
}

export function AdminPromotionsEntry({ locale, initialRows, labels }: AdminPromotionsEntryProps) {
  const body = <AdminPromotionsClient locale={locale} initialRows={initialRows} labels={labels} />;

  return (
    <SurfaceMountGate
      skeleton={
        <div className="animate-pulse space-y-4" aria-hidden>
          <div className="h-10 max-w-md rounded bg-[var(--color-muted)]" />
        </div>
      }
      desktop={<div className="mx-auto max-w-5xl space-y-6">{body}</div>}
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
