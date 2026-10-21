"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { AdminMerchOrdersScreen } from "@/components/dashboard/admin/merch/AdminMerchOrdersScreen";
import type { AdminShopOrderRow } from "@/lib/shop/loadAdminShopOrders";
import type { Dictionary } from "@/types/i18n";

interface AdminMerchOrdersEntryProps {
  locale: string;
  statusFilter: string;
  rows: AdminShopOrderRow[];
  students: Array<{ id: string; label: string }>;
  labels: Dictionary["admin"]["merch"];
  statusLabels: Dictionary["shop"]["order"]["status"];
}

export function AdminMerchOrdersEntry(props: AdminMerchOrdersEntryProps) {
  const body = <AdminMerchOrdersScreen {...props} />;
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
