"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { AdminPromotionsClient } from "@/components/dashboard/AdminPromotionsClient";
import type { AdminPromotionRow } from "@/components/dashboard/AdminPromotionsTable";
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
      narrow={() => (
        <div className="mx-auto max-w-[var(--layout-max-width)] space-y-3">{body}</div>
      )}
    />
  );
}
