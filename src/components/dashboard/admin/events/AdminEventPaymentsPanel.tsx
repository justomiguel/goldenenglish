import Link from "next/link";
import { Search } from "lucide-react";
import { eventPaymentReceiptSignedUrlForAdmin } from "@/lib/events/eventPaymentReceiptSignedUrlForAdmin";
import type { PaginatedEventPaymentsResult } from "@/lib/dashboard/events/loadEventPaymentsPaginated";
import { formatPaginationSummary } from "@/lib/dashboard/formatPaginationSummary";
import {
  AdminEventPaymentReviewRow,
  type AdminEventPaymentReviewRowLabels,
} from "@/components/dashboard/admin/events/AdminEventPaymentReviewRow";

export interface AdminEventPaymentsPanelLabels {
  title: string;
  lead: string;
  empty: string;
  searchPlaceholder: string;
  searchButton: string;
  filterAll: string;
  filterPending: string;
  filterApproved: string;
  filterRejected: string;
  summaryPending: string;
  summaryApproved: string;
  summaryRejected: string;
  row: AdminEventPaymentReviewRowLabels;
  pagination: {
    prev: string;
    next: string;
    summary: string;
  };
}

interface AdminEventPaymentsPanelProps {
  locale: string;
  eventId: string;
  payments: PaginatedEventPaymentsResult;
  searchQuery: string;
  statusFilter: string;
  labels: AdminEventPaymentsPanelLabels;
}

function buildPaymentsHref(
  baseHref: string,
  params: { page?: number; q?: string; paymentStatus?: string },
): string {
  const search = new URLSearchParams({ tab: "payments" });
  if (params.page && params.page > 1) search.set("paymentsPage", String(params.page));
  if (params.q) search.set("paymentsQ", params.q);
  if (params.paymentStatus && params.paymentStatus !== "all") {
    search.set("paymentStatus", params.paymentStatus);
  }
  return `${baseHref}?${search.toString()}`;
}

export async function AdminEventPaymentsPanel({
  locale,
  eventId,
  payments,
  searchQuery,
  statusFilter,
  labels,
}: AdminEventPaymentsPanelProps) {
  const baseHref = `/${locale}/dashboard/admin/events/${eventId}`;
  const rowsWithReceipts = await Promise.all(
    payments.rows.map(async (row) => ({
      row,
      receiptPreviewUrl: await eventPaymentReceiptSignedUrlForAdmin(row.receiptStoragePath),
    })),
  );

  const totalPages = Math.max(1, Math.ceil(payments.totalCount / payments.pageSize) || 1);
  const from = payments.totalCount === 0 ? 0 : (payments.page - 1) * payments.pageSize + 1;
  const to = Math.min(payments.page * payments.pageSize, payments.totalCount);
  const summary = formatPaginationSummary(labels.pagination.summary, from, to, payments.totalCount);

  const filters = [
    { id: "all", label: labels.filterAll, count: payments.statusCounts.pending + payments.statusCounts.approved + payments.statusCounts.rejected },
    { id: "pending", label: labels.filterPending, count: payments.statusCounts.pending },
    { id: "approved", label: labels.filterApproved, count: payments.statusCounts.approved },
    { id: "rejected", label: labels.filterRejected, count: payments.statusCounts.rejected },
  ] as const;

  return (
    <section className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{labels.title}</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm">
          {labels.summaryPending.replace("{{count}}", String(payments.statusCounts.pending))}
        </div>
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm">
          {labels.summaryApproved.replace("{{count}}", String(payments.statusCounts.approved))}
        </div>
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm">
          {labels.summaryRejected.replace("{{count}}", String(payments.statusCounts.rejected))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const active = statusFilter === filter.id;
          return (
            <Link
              key={filter.id}
              href={buildPaymentsHref(baseHref, { q: searchQuery, paymentStatus: filter.id })}
              className={`inline-flex min-h-[36px] items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${
                active
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-[var(--color-border)] text-[var(--color-muted-foreground)]"
              }`}
            >
              {filter.label}
              <span className="rounded-full bg-[var(--color-muted)] px-1.5 py-0.5 text-xs">
                {filter.count}
              </span>
            </Link>
          );
        })}
      </div>

      <form method="get" className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="tab" value="payments" />
        {statusFilter !== "all" ? (
          <input type="hidden" name="paymentStatus" value={statusFilter} />
        ) : null}
        <input
          type="search"
          name="paymentsQ"
          defaultValue={searchQuery}
          placeholder={labels.searchPlaceholder}
          className="min-h-[36px] flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="inline-flex min-h-[36px] items-center justify-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm"
        >
          <Search className="h-4 w-4" aria-hidden />
          {labels.searchButton}
        </button>
      </form>

      {rowsWithReceipts.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.empty}</p>
      ) : (
        <ul className="space-y-3">
          {rowsWithReceipts.map(({ row, receiptPreviewUrl }) => (
            <AdminEventPaymentReviewRow
              key={row.id}
              locale={locale}
              eventId={eventId}
              row={row}
              receiptPreviewUrl={receiptPreviewUrl}
              labels={labels.row}
            />
          ))}
        </ul>
      )}

      {payments.totalCount > payments.pageSize ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-3">
          <p className="text-sm text-[var(--color-muted-foreground)]">{summary}</p>
          <div className="flex gap-2">
            {payments.page > 1 ? (
              <Link
                href={buildPaymentsHref(baseHref, {
                  page: payments.page - 1,
                  q: searchQuery,
                  paymentStatus: statusFilter,
                })}
                className="inline-flex min-h-[36px] items-center rounded-md border border-[var(--color-border)] px-3 py-2 text-sm"
              >
                {labels.pagination.prev}
              </Link>
            ) : null}
            {payments.page < totalPages ? (
              <Link
                href={buildPaymentsHref(baseHref, {
                  page: payments.page + 1,
                  q: searchQuery,
                  paymentStatus: statusFilter,
                })}
                className="inline-flex min-h-[36px] items-center rounded-md border border-[var(--color-border)] px-3 py-2 text-sm"
              >
                {labels.pagination.next}
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
