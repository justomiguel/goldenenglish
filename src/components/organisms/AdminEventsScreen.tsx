"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Calendar, ChartNoAxesColumn, Settings2, Users } from "lucide-react";
import type { AdminEventRow } from "@/lib/dashboard/events/loadPaginatedAdminEvents";
import { TablePagination } from "@/components/molecules/TablePagination";
import type { EventSortKey } from "@/lib/dashboard/events/loadPaginatedAdminEvents";

interface AdminEventsScreenProps {
  locale: string;
  rows: AdminEventRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  sort: EventSortKey;
  dir: "asc" | "desc";
  labels: {
    countSuffix: string;
    create: string;
    title: string;
    date: string;
    status: string;
    capacity: string;
    views: string;
    price: string;
    actions: string;
    manage: string;
    empty: string;
    free: string;
    paginationPrev: string;
    paginationNext: string;
    paginationSummary: string;
    paginationTipPrev: string;
    paginationTipNext: string;
  };
}

function nextSortDir(currentSort: EventSortKey, currentDir: "asc" | "desc", target: EventSortKey) {
  if (currentSort !== target) return "asc";
  return currentDir === "asc" ? "desc" : "asc";
}

export function AdminEventsScreen({
  locale,
  rows,
  totalCount,
  page,
  pageSize,
  sort,
  dir,
  labels,
}: AdminEventsScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const goToPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`${pathname}?${params.toString()}`);
  };
  const sortHref = (key: EventSortKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", key);
    params.set("dir", nextSortDir(sort, dir, key));
    params.set("page", "1");
    return `${pathname}?${params.toString()}`;
  };

  return (
    <section className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {totalCount} {labels.countSuffix}
        </p>
        <Link
          href={`/${locale}/dashboard/admin/events/new`}
          className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-[var(--color-primary-foreground)]"
        >
          <Calendar className="h-4 w-4" aria-hidden />
          {labels.create}
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left">
              <th className="px-3 py-2">
                <Link href={sortHref("title")} className="hover:underline">
                  {labels.title}
                </Link>
              </th>
              <th className="px-3 py-2">
                <Link href={sortHref("event_date")} className="hover:underline">
                  {labels.date}
                </Link>
              </th>
              <th className="px-3 py-2">{labels.status}</th>
              <th className="px-3 py-2">
                <Link href={sortHref("attendees_count")} className="hover:underline">
                  {labels.capacity}
                </Link>
              </th>
              <th className="px-3 py-2">{labels.views}</th>
              <th className="px-3 py-2">{labels.price}</th>
              <th className="px-3 py-2">{labels.actions}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[var(--color-border)]">
                <td className="px-3 py-2">{row.title}</td>
                <td className="px-3 py-2">{new Date(row.eventDate).toLocaleString()}</td>
                <td className="px-3 py-2 capitalize">{row.status}</td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" aria-hidden />
                    {row.attendeesCount}/{row.capacity}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1">
                    <ChartNoAxesColumn className="h-3.5 w-3.5" aria-hidden />
                    {row.viewCount.toLocaleString()}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {row.price == null ? labels.free : `${row.currency} ${row.price.toFixed(2)}`}
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/${locale}/dashboard/admin/events/${row.id}`}
                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:border-[color-mix(in_srgb,var(--color-primary)_35%,var(--color-border))] hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-surface))]"
                  >
                    <Settings2 className="h-4 w-4 shrink-0 text-[var(--color-primary-dark)]" aria-hidden />
                    {labels.manage}
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-8 text-center text-[var(--color-muted-foreground)]" colSpan={7}>
                  {labels.empty}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={goToPage}
        labels={{
          prev: labels.paginationPrev,
          next: labels.paginationNext,
          summary: labels.paginationSummary,
          tipPrev: labels.paginationTipPrev,
          tipNext: labels.paginationTipNext,
        }}
      />
    </section>
  );
}
