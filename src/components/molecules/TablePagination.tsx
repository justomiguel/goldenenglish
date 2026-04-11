"use client";

import { Button } from "@/components/atoms/Button";
import { formatPaginationSummary } from "@/lib/dashboard/formatPaginationSummary";

export interface TablePaginationLabels {
  prev: string;
  next: string;
  summary: string;
}

export interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  labels: TablePaginationLabels;
}

export function TablePagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  labels,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  const summary = formatPaginationSummary(labels.summary, from, to, totalCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-2 py-3">
      <p className="text-sm text-[var(--color-muted-foreground)]">{summary}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-h-[44px]"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {labels.prev}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-h-[44px]"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {labels.next}
        </Button>
      </div>
    </div>
  );
}
