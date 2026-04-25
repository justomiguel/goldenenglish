"use client";

import { useRouter } from "next/navigation";
import { TablePagination } from "@/components/molecules/TablePagination";
import type { Dictionary } from "@/types/i18n";

export interface AdminRetentionTablePaginationProps {
  locale: string;
  cohortId: string;
  page: number;
  pageSize: number;
  total: number;
  labels: Dictionary["admin"]["table"];
}

export function AdminRetentionTablePagination({
  locale,
  cohortId,
  page,
  pageSize,
  total,
  labels,
}: AdminRetentionTablePaginationProps) {
  const router = useRouter();
  if (total <= pageSize) return null;
  return (
    <TablePagination
      page={page}
      pageSize={pageSize}
      totalCount={total}
      onPageChange={(p) => {
        router.push(`/${locale}/dashboard/admin/academic/${cohortId}?tab=retention&rPage=${p}`);
      }}
      labels={{
        prev: labels.paginationPrev,
        next: labels.paginationNext,
        summary: labels.paginationSummary,
        tipPrev: labels.paginationTipPrev,
        tipNext: labels.paginationTipNext,
      }}
    />
  );
}
