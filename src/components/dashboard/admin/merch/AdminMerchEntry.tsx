"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { AdminMerchProductsScreen } from "@/components/dashboard/admin/merch/AdminMerchProductsScreen";
import type {
  AdminMerchLabels,
  AdminMerchProductRow,
} from "@/components/dashboard/admin/merch/adminMerchTypes";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";

interface AdminMerchEntryProps {
  locale: string;
  initialRows: AdminMerchProductRow[];
  labels: AdminMerchLabels;
  fileUploadProgress: FileUploadProgressLabels;
}

export function AdminMerchEntry({
  locale,
  initialRows,
  labels,
  fileUploadProgress,
}: AdminMerchEntryProps) {
  const body = (
    <AdminMerchProductsScreen
      locale={locale}
      initialRows={initialRows}
      labels={labels}
      fileUploadProgress={fileUploadProgress}
    />
  );

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
