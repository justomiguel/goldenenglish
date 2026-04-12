"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import { AdminCouponsClient } from "@/components/dashboard/AdminCouponsClient";
import type { AppSurface } from "@/hooks/useAppSurface";
import type { Dictionary } from "@/types/i18n";

export type AdminCouponRow = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  valid_from: string;
  valid_until: string | null;
  max_uses: number | null;
  uses_count: number;
  is_active: boolean;
};

interface AdminCouponsEntryProps {
  locale: string;
  initialRows: AdminCouponRow[];
  labels: Dictionary["admin"]["coupons"];
}

export function AdminCouponsEntry({ locale, initialRows, labels }: AdminCouponsEntryProps) {
  const body = (
    <AdminCouponsClient locale={locale} initialRows={initialRows} labels={labels} />
  );

  return (
    <SurfaceMountGate
      skeleton={
        <div className="animate-pulse space-y-4" aria-hidden>
          <div className="h-10 max-w-md rounded bg-[var(--color-muted)]" />
        </div>
      }
      desktop={<div className="mx-auto max-w-4xl space-y-6">{body}</div>}
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
