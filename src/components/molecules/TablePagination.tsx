"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { formatPaginationSummary } from "@/lib/dashboard/formatPaginationSummary";

export interface TablePaginationLabels {
  prev: string;
  next: string;
  summary: string;
  tipPrev?: string;
  tipNext?: string;
}

export interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  labels: TablePaginationLabels;
}

function pageItems(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items: Array<number | "gap"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push("gap");
  for (let n = start; n <= end; n += 1) items.push(n);
  if (end < total - 1) items.push("gap");
  items.push(total);
  return items;
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
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-10 rounded-xl"
          disabled={page <= 1}
          title={labels.tipPrev}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
          {labels.prev}
        </Button>
        {pageItems(page, totalPages).map((item, idx) =>
          item === "gap" ? (
            <span key={`gap-${idx}`} className="px-1 text-sm text-[var(--color-muted-foreground)]">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={item === page ? "page" : undefined}
              className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-semibold ${
                item === page
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                  : "text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
              }`}
            >
              {item}
            </button>
          ),
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-10 rounded-xl"
          disabled={page >= totalPages}
          title={labels.tipNext}
          onClick={() => onPageChange(page + 1)}
        >
          {labels.next}
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
