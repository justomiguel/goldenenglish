import Link from "next/link";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { formatPaginationSummary } from "@/lib/dashboard/formatPaginationSummary";
import type { AdminEventAttendeesPanelLabels } from "@/components/dashboard/admin/events/AdminEventAttendeesPanelParts";

interface AdminEventAttendeesPaginationBarProps {
  baseHref: string;
  page: number;
  pageSize: number;
  totalCount: number;
  searchQuery: string;
  labels: AdminEventAttendeesPanelLabels;
}

function buildAttendeesHref(
  baseHref: string,
  params: { page?: number; q?: string },
): string {
  const search = new URLSearchParams({ tab: "attendees" });
  if (params.page && params.page > 1) search.set("attendeesPage", String(params.page));
  if (params.q) search.set("attendeesQ", params.q);
  return `${baseHref}?${search.toString()}`;
}

function formatPageOf(template: string, page: number, totalPages: number): string {
  return template
    .replace(/\{\{page\}\}/g, String(page))
    .replace(/\{\{totalPages\}\}/g, String(totalPages));
}

export function AdminEventAttendeesPaginationBar({
  baseHref,
  page,
  pageSize,
  totalCount,
  searchQuery,
  labels,
}: AdminEventAttendeesPaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  const summary = formatPaginationSummary(labels.pagination.summary, from, to, totalCount);
  const pageOf = formatPageOf(labels.pagination.pageOf, page, totalPages);
  const showPager = totalPages > 1;

  if (totalCount === 0) return null;

  return (
    <nav
      aria-label={labels.pagination.navAria}
      className="mb-4 flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_8%,var(--color-surface)),var(--color-muted))] p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-foreground)]">
          <Users className="h-4 w-4 shrink-0 text-[var(--color-primary-dark)]" aria-hidden />
          {summary}
        </p>
        {showPager ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">{pageOf}</p>
        ) : null}
      </div>
      {showPager ? (
        <div className="flex flex-wrap gap-2">
          {page > 1 ? (
            <Link
              href={buildAttendeesHref(baseHref, { page: page - 1, q: searchQuery })}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
            >
              <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
              {labels.pagination.prev}
            </Link>
          ) : (
            <Button type="button" variant="secondary" size="sm" className="min-h-[44px]" disabled>
              <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
              {labels.pagination.prev}
            </Button>
          )}
          {page < totalPages ? (
            <Link
              href={buildAttendeesHref(baseHref, { page: page + 1, q: searchQuery })}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
            >
              {labels.pagination.next}
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
          ) : (
            <Button type="button" variant="secondary" size="sm" className="min-h-[44px]" disabled>
              {labels.pagination.next}
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
            </Button>
          )}
        </div>
      ) : null}
    </nav>
  );
}
